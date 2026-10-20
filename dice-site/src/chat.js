// Public lounge chat.
//
// A light, public-only chat for the lounge. Guardrails: short messages, a name
// of 1-20 characters, a per-IP rate limit, a strong censor for profanity, and a
// hard block on links and contact details so the chat can't be used to pull
// people (especially minors) off-site. There is no private messaging.

import { json, readJson, nowIso } from "./http.js";

const NAME_RE = /^[\x20-\x7E]{1,20}$/;      // printable ASCII, up to 20 chars
const MAX_BODY = 200;
const RATE_MS = 3000;                        // one message per 3s per address
const KEEP = 500;                            // keep only the newest 500 messages

// Block links, social handles and phone numbers — no luring people off-platform.
const CONTACT_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|gg|io|xyz|co|me|tv|link|app|live)\b|discord|t\.me|telegram|whats\s?app|snap\s?chat|insta\s?gram|\bkik\b|\bcash\s?app\b|@[a-z0-9_.]{2,}|\+?\d[\d\s().-]{6,}\d)/i;

// A modest profanity censor (kept small on purpose).
const SWEARS = /\b(fuck(?:ing|er|ed)?|shit|bitch|bastard|cunt|dick|pussy|asshole|nigg(?:a|er)|faggot|whore|slut|retard)\b/gi;

const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();

export async function handleChat(request, env, parts) {
  if (parts.length !== 2) return json({ error: "Not found" }, 404);
  const method = request.method;

  if (method === "GET") {
    const { results } = await env.DB.prepare("SELECT id, name, body, created_at FROM chat ORDER BY id DESC LIMIT 50").all();
    return json({ messages: results.reverse().map((m) => ({ id: m.id, name: m.name, body: m.body, at: m.created_at })) });
  }

  if (method === "POST") {
    const body = await readJson(request);
    const name = clean(body && body.name);
    let msg = clean(body && body.body);
    if (!NAME_RE.test(name)) return json({ error: "Pick a name of 1 to 20 normal characters." }, 400);
    if (msg.length < 1 || msg.length > MAX_BODY) return json({ error: "Messages are 1 to 200 characters." }, 400);
    if (CONTACT_RE.test(msg) || CONTACT_RE.test(name)) return json({ error: "Please don't share links or contact details in the chat." }, 400);
    msg = msg.replace(SWEARS, (m) => "*".repeat(m.length));

    const ip = request.headers.get("CF-Connecting-IP") || "local";
    const last = await env.DB.prepare("SELECT created_at FROM chat WHERE ip = ? ORDER BY id DESC LIMIT 1").bind(ip).first();
    if (last && Date.now() - Date.parse(last.created_at) < RATE_MS) return json({ error: "You're chatting too fast — wait a moment." }, 429);

    await env.DB.prepare("INSERT INTO chat (name, body, ip, created_at) VALUES (?, ?, ?, ?)").bind(name.slice(0, 20), msg.slice(0, MAX_BODY), ip, nowIso()).run();
    await env.DB.prepare("DELETE FROM chat WHERE id <= (SELECT MAX(id) - ? FROM chat)").bind(KEEP).run();
    return json({ ok: true }, 201);
  }

  return json({ error: "Use GET or POST." }, 405);
}
