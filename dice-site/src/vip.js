// VIP logins. The owner creates a VIP username + password for a streamer in the
// admin panel; the streamer signs in at /vip and can flip only their own
// "Live now" switch. Passwords are stored as PBKDF2 hashes with a per-user salt.
//
//   POST /vip/api/login   { user, password }  -> sets the VIP cookie
//   POST /vip/api/logout
//   GET  /vip/api/me                          -> their name, handle, live, avatar
//   POST /vip/api/live    { live }            -> set their own live status

import { json, readJson, nowIso } from "./http.js";

const COOKIE = "__Host-cr_vip";
const DAYS = 30;
const MAX_FAILS = 8;
const LOCK_MINUTES = 15;
export const VIP_USER_RE = /^[A-Za-z0-9._-]{3,32}$/;

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

export function genSalt() {
  return hex(crypto.getRandomValues(new Uint8Array(16)));
}
// PBKDF2-SHA256, 100k iterations. Returns a hex digest.
export async function hashPassword(password, saltHex) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const salt = Uint8Array.from(saltHex.match(/../g).map((h) => parseInt(h, 16)));
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
  return hex(bits);
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}
// constant-time-ish compare
async function sameText(a, b) {
  const pad = hex(crypto.getRandomValues(new Uint8Array(16)));
  const [x, y] = await Promise.all([hmac(pad, a), hmac(pad, b)]);
  let diff = x.length ^ y.length;
  for (let i = 0; i < x.length && i < y.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

// The session signature also covers the stored hash, so changing the password
// (or clearing VIP access) signs the streamer out everywhere.
async function sign(env, id, exp, vipHash) {
  return hmac(env.SESSION_SECRET, `vip:${id}:${exp}:${vipHash}`);
}
function readCookie(request) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === COOKIE) return v.join("=");
  }
  return "";
}

export async function vipSession(request, env) {
  const [id, exp, sig] = readCookie(request).split(".");
  if (!id || !exp || !sig || !/^\d+$/.test(id) || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return null;
  const row = await env.DB.prepare("SELECT * FROM streamers WHERE id = ?").bind(Number(id)).first();
  if (!row || !row.vip_hash) return null;
  if (!(await sameText(sig, await sign(env, row.id, exp, row.vip_hash)))) return null;
  return row;
}

const sameOrigin = (request, url) => request.headers.get("Origin") === url.origin;

export async function vipLogin(request, env, url) {
  if (!env.SESSION_SECRET) return json({ error: "VIP logins aren't set up on this site yet." }, 503);
  if (!sameOrigin(request, url)) return json({ error: "Sign in from the VIP page." }, 403);
  const ip = request.headers.get("CF-Connecting-IP") || "local";
  const since = new Date(Date.now() - LOCK_MINUTES * 60000).toISOString();
  const fails = await env.DB.prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND at > ?").bind("vip:" + ip, since).first();
  if (fails.n >= MAX_FAILS) return json({ error: `Too many wrong logins. Try again in ${LOCK_MINUTES} minutes.` }, 429);

  const body = await readJson(request);
  const user = String((body && body.user) || "").trim().toLowerCase();
  const password = String((body && body.password) || "");
  const row = VIP_USER_RE.test(user) ? await env.DB.prepare("SELECT * FROM streamers WHERE vip_user = ?").bind(user).first() : null;
  const ok = row && row.vip_hash && (await sameText(await hashPassword(password, row.vip_salt), row.vip_hash));
  if (!ok) {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO login_attempts (ip, at) VALUES (?, ?)").bind("vip:" + ip, nowIso()),
      env.DB.prepare("DELETE FROM login_attempts WHERE at < ?").bind(new Date(Date.now() - 86400000).toISOString())
    ]);
    return json({ error: "Wrong VIP username or password." }, 401);
  }
  await env.DB.prepare("DELETE FROM login_attempts WHERE ip = ?").bind("vip:" + ip).run();
  const exp = String(Date.now() + DAYS * 86400000);
  const cookie = `${COOKIE}=${row.id}.${exp}.${await sign(env, row.id, exp, row.vip_hash)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${DAYS * 86400}`;
  return json({ ok: true }, 200, { "Set-Cookie": cookie });
}

export function vipLogout() {
  return json({ ok: true }, 200, { "Set-Cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
}

const shape = (r) => ({ name: r.name, handle: r.handle, live: !!r.live, avatar: r.avatar_id ? `/media/${r.avatar_id}` : null });

// parts = ["vip", "api", <action>]
export async function handleVipApi(request, env, url, parts) {
  const method = request.method;
  if (parts[2] === "login" && method === "POST") return vipLogin(request, env, url);
  if (parts[2] === "logout" && method === "POST") return vipLogout();

  const me = await vipSession(request, env);
  if (!me) return json({ error: "Sign in to your VIP account." }, 401, { "Cache-Control": "no-store" });
  if (method !== "GET" && !sameOrigin(request, url)) return json({ error: "Make changes from the VIP page." }, 403);

  if (parts[2] === "me" && method === "GET") return json({ streamer: shape(me), canExcludeColor: ["skitz", "jarrett", "moonsab"].includes(String(me.vip_user || "").toLowerCase()) }, 200, { "Cache-Control": "no-store" });
  if (parts[2] === "live" && method === "POST") {
    const body = await readJson(request);
    const live = body && body.live ? 1 : 0;
    const row = await env.DB.prepare("UPDATE streamers SET live = ?, updated_at = ? WHERE id = ? RETURNING *").bind(live, nowIso(), me.id).first();
    return json({ streamer: shape(row) });
  }
  return json({ error: "Not found" }, 404);
}
