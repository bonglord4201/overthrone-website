// ColorRoll Worker.
//
// Static files in public/ are served by Workers Static Assets. This Worker
// runs for the routes in wrangler.jsonc (assets.run_worker_first) and for any
// address that isn't a static file:
//
//   /api/roll, /api/roller/*   dice rolls and verification (src/rolls.js)
//   /api/streamers             the public top-streamers list (src/streamers.js)
//   /media/*                   uploaded streamer pictures
//   /<ADMIN_PATH>/             the admin panel, at a secret address
//   /<ADMIN_PATH>/api/*        the admin panel's API, signed-in admin only
//
// The admin panel's files live in public/admin/, but /admin itself always
// answers "page not found". They are only served at the secret address in
// the ADMIN_PATH secret, so visitors can't tell an admin panel exists. The
// password (src/auth.js) is a second lock behind that address.

import { json } from "./http.js";
import { handleRolls } from "./rolls.js";
import { isAdmin, login, logout, sameOrigin, adminConfigured } from "./auth.js";
import { listPublic, handleAdminStreamers, serveMedia } from "./streamers.js";
import { handleModeration } from "./moderation.js";
import { handleVipApi } from "./vip.js";
import { handleChat } from "./chat.js";

const ADMIN_PATH_RE = /^[A-Za-z0-9_-]{16,64}$/;
const RESERVED = ["admin", "api", "media"];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      return await route(request, env, url);
    } catch (err) {
      console.error("Server error", String((err && err.message) || err));
      return json({ error: "The server had a problem. Try again in a moment." }, 500);
    }
  }
};

// The secret admin address, or "" when ADMIN_PATH isn't set (admin panel off).
function adminBase(env) {
  const p = String(env.ADMIN_PATH || "").replace(/^\/+|\/+$/g, "");
  return ADMIN_PATH_RE.test(p) && !RESERVED.includes(p.toLowerCase()) ? "/" + p : "";
}

async function route(request, env, url) {
  const path = url.pathname;
  const method = request.method;
  const base = adminBase(env);

  if (base && (path === base || path.startsWith(base + "/"))) {
    if (path === base) return Response.redirect(url.origin + base + "/", 301);
    return adminArea(request, env, url, path.slice(base.length));
  }

  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "media" && parts.length === 2 && method === "GET") return serveMedia(env, parts[1]);

  // VIP area: a public page where a streamer signs in and sets their own live status.
  if (parts[0] === "vip") {
    if (parts[1] === "api") return handleVipApi(request, env, url, parts);
    // Redirect /vip to /vip/ so the page's relative assets resolve under /vip/.
    if (path === "/vip") return Response.redirect(url.origin + "/vip/", 301);
    const file = parts.length === 1 ? "/vip/" : "/vip" + path.slice(4);
    const res = await env.ASSETS.fetch(new Request(new URL(file, url), request));
    if (res.status !== 200) return notFound(env, url);
    const out = new Response(res.body, res);
    out.headers.set("Cache-Control", "no-store");
    out.headers.set("X-Robots-Tag", "noindex");
    return out;
  }

  if (parts[0] === "api") {
    if (parts[1] === "health" && method === "GET") return json({ ok: true });
    if (parts[1] === "streamers" && parts.length === 2 && method === "GET") return listPublic(env);
    if (parts[1] === "chat") return handleChat(request, env, parts);
    return (await handleRolls(request, env, parts)) || json({ error: "Not found" }, 404);
  }
  return notFound(env, url);
}

// Everything under the secret address. `rest` starts with "/".
async function adminArea(request, env, url, rest) {
  const private_ = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer" };

  if (rest.startsWith("/api/")) {
    const parts = ["api", "admin", ...rest.slice(5).split("/").filter(Boolean)];
    const method = request.method;
    if (parts[2] === "login" && method === "POST") return login(request, env, url);
    if (parts[2] === "logout" && method === "POST") return logout();
    if (!(await isAdmin(request, env))) return json({ error: "Sign in to use the admin panel." }, 401, private_);
    if (method !== "GET" && !sameOrigin(request, url)) return json({ error: "Make changes from the admin page." }, 403);
    if (parts[2] === "me" && method === "GET") return json({ ok: true, ready: adminConfigured(env) });
    if (parts[2] === "streamers") return handleAdminStreamers(request, env, parts);
    if (["rollers", "flags", "suspects", "reports"].includes(parts[2])) return handleModeration(request, env, parts);
    return json({ error: "Not found" }, 404);
  }

  const file = rest === "/" ? "/admin/" : "/admin" + rest;
  const res = await env.ASSETS.fetch(new Request(new URL(file, url), request));
  if (res.status !== 200) return notFound(env, url);
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(private_)) out.headers.set(k, v);
  return out;
}

async function notFound(env, url) {
  const page = await env.ASSETS.fetch(new Request(new URL("/404", url)));
  return new Response(page.ok ? page.body : "Page not found", {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
  });
}
