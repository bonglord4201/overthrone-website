// Response helpers. _headers only covers responses served straight from static
// assets, so anything the Worker returns gets the same headers added here.

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; media-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests"
};

export function secure(response, extra = {}) {
  const res = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!res.headers.has(name)) res.headers.set(name, value);
  }
  for (const [name, value] of Object.entries(extra)) res.headers.set(name, value);
  return res;
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers }
  });
}

export async function readJson(request) {
  const type = request.headers.get("Content-Type") || "";
  if (!type.includes("application/json")) throw new HttpError(415, "Expected JSON.");
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > 200000) throw new HttpError(413, "Request is too large.");
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }
}
