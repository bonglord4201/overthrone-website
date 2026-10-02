// Admin authentication via Cloudflare Access.
//
// Cloudflare Access sits in front of /admin and /api/admin/* and signs every
// request it lets through with a JWT. The Worker verifies that JWT itself
// (signature, issuer, audience, expiry) and then checks the email against the
// ADMIN_EMAILS secret, so the panel stays locked even if the Access policy is
// misconfigured or the Worker is reached through another hostname.
//
// Required secrets (wrangler secret put ...):
//   ACCESS_TEAM_DOMAIN  e.g. "overthrone" or "overthrone.cloudflareaccess.com"
//   ACCESS_AUD          the Application Audience (AUD) tag of the Access app
//   ADMIN_EMAILS        comma-separated list of admin emails
//
// Local development only: DEV_ADMIN_EMAIL in .dev.vars signs you in on
// localhost. It is ignored for any other hostname.

let certCache = { issuer: "", keys: new Map(), fetchedAt: 0 };

const b64url = (s) => {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const b64urlJson = (s) => JSON.parse(new TextDecoder().decode(b64url(s)));

export function accessIssuer(env) {
  let team = String(env.ACCESS_TEAM_DOMAIN || "").trim().toLowerCase();
  team = team.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!team) return "";
  if (!team.includes(".")) team += ".cloudflareaccess.com";
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(team)) return "";
  return "https://" + team;
}

async function signingKey(issuer, kid) {
  const stale = Date.now() - certCache.fetchedAt > 3600000;
  if (certCache.issuer !== issuer || stale || !certCache.keys.has(kid)) {
    // Refetch at most once a minute so bogus kids can't hammer the certs endpoint.
    if (certCache.issuer === issuer && !stale && Date.now() - certCache.fetchedAt < 60000) {
      return certCache.keys.get(kid) || null;
    }
    const res = await fetch(issuer + "/cdn-cgi/access/certs");
    if (!res.ok) return null;
    const { keys = [] } = await res.json();
    const map = new Map();
    for (const jwk of keys) {
      if (jwk.kty !== "RSA" || !jwk.kid) continue;
      map.set(jwk.kid, await crypto.subtle.importKey(
        "jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]
      ));
    }
    certCache = { issuer, keys: map, fetchedAt: Date.now() };
  }
  return certCache.keys.get(kid) || null;
}

async function verifyAccessJwt(token, env) {
  const issuer = accessIssuer(env);
  const audience = String(env.ACCESS_AUD || "").trim();
  if (!issuer || !audience) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = b64urlJson(parts[0]);
    const payload = b64urlJson(parts[1]);
    if (header.alg !== "RS256" || !header.kid) return null;
    const key = await signingKey(issuer, header.kid);
    if (!key) return null;
    const ok = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5", key, b64url(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1])
    );
    if (!ok) return null;
    const now = Math.floor(Date.now() / 1000);
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (payload.iss !== issuer || !aud.includes(audience)) return null;
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    if (typeof payload.nbf === "number" && payload.nbf > now + 60) return null;
    return payload;
  } catch {
    return null;
  }
}

function cookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return "";
}

const adminList = (env) =>
  String(env.ADMIN_EMAILS || "").split(/[,\s]+/).map((e) => e.trim().toLowerCase()).filter(Boolean);

// Returns { email, dev } for a signed-in admin, or null.
export async function getAdmin(request, env) {
  const { hostname } = new URL(request.url);
  if (env.DEV_ADMIN_EMAIL && (hostname === "localhost" || hostname === "127.0.0.1")) {
    return { email: String(env.DEV_ADMIN_EMAIL).toLowerCase(), dev: true };
  }
  const token = request.headers.get("Cf-Access-Jwt-Assertion") || cookie(request, "CF_Authorization");
  if (!token) return null;
  const payload = await verifyAccessJwt(token, env);
  const email = String(payload?.email || "").toLowerCase();
  if (!email || !adminList(env).includes(email)) return null;
  return { email, dev: false };
}

export function authConfigured(env) {
  return Boolean(accessIssuer(env) && String(env.ACCESS_AUD || "").trim() && adminList(env).length);
}
