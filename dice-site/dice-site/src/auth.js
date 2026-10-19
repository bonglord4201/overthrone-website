// Admin sign-in. There is one admin: whoever knows ADMIN_PASSWORD (a Worker
// secret). Signing in sets an HttpOnly session cookie signed with
// SESSION_SECRET. The signature also covers a hash of the password, so
// changing ADMIN_PASSWORD signs every existing session out.

import { json, readJson, nowIso } from "./http.js";

const COOKIE = "__Host-cr_admin";
const SESSION_DAYS = 7;
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

export const adminConfigured = (env) => !!(env.ADMIN_PASSWORD && env.SESSION_SECRET && env.SESSION_SECRET.length >= 32);

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

// Compare two strings without leaking how much of them matched.
async function sameText(a, b) {
  const pad = crypto.getRandomValues(new Uint8Array(32));
  const [x, y] = await Promise.all([hmac(hex(pad), a), hmac(hex(pad), b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

async function sign(env, exp) {
  const fingerprint = hex(await crypto.subtle.digest("SHA-256", enc.encode(env.ADMIN_PASSWORD)));
  return hmac(env.SESSION_SECRET, `admin:${exp}:${fingerprint}`);
}

function readCookie(request) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === COOKIE) return v.join("=");
  }
  return "";
}

export async function isAdmin(request, env) {
  if (!adminConfigured(env)) return false;
  const [exp, sig] = readCookie(request).split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return sameText(sig, await sign(env, exp));
}

// State-changing admin requests must come from this site's own pages.
export function sameOrigin(request, url) {
  return request.headers.get("Origin") === url.origin;
}

export async function login(request, env, url) {
  if (!adminConfigured(env)) {
    return json({ error: "The admin panel isn't set up yet. Set the ADMIN_PASSWORD and SESSION_SECRET secrets first." }, 503);
  }
  if (!sameOrigin(request, url)) return json({ error: "Sign in from the admin page." }, 403);
  const ip = request.headers.get("CF-Connecting-IP") || "local";
  const since = new Date(Date.now() - LOCK_MINUTES * 60000).toISOString();
  const fails = await env.DB.prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND at > ?").bind(ip, since).first();
  if (fails.n >= MAX_FAILS) return json({ error: `Too many wrong passwords. Try again in ${LOCK_MINUTES} minutes.` }, 429);

  const body = await readJson(request);
  const password = String((body && body.password) || "");
  if (!password || !(await sameText(password, env.ADMIN_PASSWORD))) {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO login_attempts (ip, at) VALUES (?, ?)").bind(ip, nowIso()),
      env.DB.prepare("DELETE FROM login_attempts WHERE at < ?").bind(new Date(Date.now() - 86400000).toISOString())
    ]);
    const left = MAX_FAILS - fails.n - 1;
    return json({ error: left > 0 ? `Wrong password. ${left} ${left === 1 ? "try" : "tries"} left.` : `Wrong password. Sign-in is locked for ${LOCK_MINUTES} minutes.` }, 401);
  }

  await env.DB.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();
  const exp = String(Date.now() + SESSION_DAYS * 86400000);
  const cookie = `${COOKIE}=${exp}.${await sign(env, exp)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}`;
  return json({ ok: true }, 200, { "Set-Cookie": cookie });
}

export function logout() {
  return json({ ok: true }, 200, { "Set-Cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
}
