// Dice rolls: the only place dice are rolled. The Worker picks the faces with
// crypto.getRandomValues, saves the roll in D1 and only then sends it back,
// so editing the page cannot change a result and anyone can look a roll up.

import { json } from "./http.js";

const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const ID_RE = /^[A-HJ-NP-Za-km-z2-9]{10}$/;
const ROLLER_RE = /^[0-9a-f]{12}$/;
const KEY_RE = /^[A-Za-z0-9]{24,64}$/;
const MIN_GAP_MS = 400; // one roll per roller per 0.4 s
const NEIGHBOURS = 5;

async function createRoll(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Send the roll request as JSON." }, 400);
  }
  const key = String((body && body.key) || "");
  const dice = Number(body && body.dice);
  const kind = body && body.kind === "number" ? "number" : "color";
  if (!KEY_RE.test(key)) return json({ error: "Missing or invalid roller key." }, 400);
  if (!Number.isInteger(dice) || dice < 1 || dice > 6) return json({ error: "Roll 1 to 6 dice." }, 400);

  const roller = await rollerId(key);
  const now = Date.now();
  const faces = randomFaces(dice);

  for (let attempt = 0; attempt < 3; attempt++) {
    const id = randomId();
    const createdAt = new Date(now).toISOString();
    try {
      // One statement, so the roll number and the rate limit are checked atomically.
      const res = await env.DB.prepare(
        `INSERT INTO rolls (id, roller, seq, dice, kind, faces, created_at)
         SELECT ?1, ?2, COALESCE((SELECT MAX(seq) FROM rolls WHERE roller = ?2), 0) + 1, ?3, ?4, ?5, ?6
         WHERE NOT EXISTS (SELECT 1 FROM rolls WHERE roller = ?2 AND created_at > ?7)`
      ).bind(id, roller, dice, kind, faces.join(","), createdAt, new Date(now - MIN_GAP_MS).toISOString()).run();
      if (!res.meta.changes) return json({ error: "Slow down a little between rolls." }, 429);
      const row = await env.DB.prepare("SELECT * FROM rolls WHERE id = ?").bind(id).first();
      return json({ roll: shape(row) }, 201);
    } catch (err) {
      // A clash on the roll ID (or a racing roll number) is retried with a new ID.
      if (!/UNIQUE/i.test(String(err && err.message))) throw err;
    }
  }
  return json({ error: "Could not save the roll. Try again." }, 503);
}

// Uniform 0-5 per die: reject bytes >= 252 so every face has exactly 42 of 252 values.
function randomFaces(n) {
  const out = [];
  const buf = new Uint8Array(16);
  while (out.length < n) {
    crypto.getRandomValues(buf);
    for (const b of buf) if (b < 252 && out.length < n) out.push(b % 6);
  }
  return out;
}

function randomId() {
  const limit = 256 - (256 % ID_CHARS.length);
  let id = "";
  const buf = new Uint8Array(32);
  while (id.length < 10) {
    crypto.getRandomValues(buf);
    for (const b of buf) if (b < limit && id.length < 10) id += ID_CHARS[b % ID_CHARS.length];
  }
  return id;
}

// The public roller ID is a hash of the browser's secret key, so nobody else
// can add rolls to a streamer's history and the key itself is never shown.
async function rollerId(key) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("colorroll:" + key));
  return [...new Uint8Array(digest)].slice(0, 6).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const shape = (row) => ({
  id: row.id,
  roller: row.roller,
  seq: row.seq,
  dice: row.dice,
  kind: row.kind,
  faces: row.faces.split(",").map(Number),
  at: row.created_at
});


export async function handleRolls(request, env, parts) {
  const method = request.method;

  if (parts[1] === "roll" && parts.length === 2) {
    if (method !== "POST") return json({ error: "Use POST to roll." }, 405);
    return createRoll(request, env);
  }

  if (parts[1] === "roll" && parts.length === 3 && method === "GET") {
    const id = parts[2];
    if (!ID_RE.test(id)) return json({ error: "A roll ID is 10 letters and digits." }, 400);
    const row = await env.DB.prepare("SELECT * FROM rolls WHERE id = ?").bind(id).first();
    if (!row) return json({ error: "No roll has this ID. A made-up or edited ID will never be found." }, 404);
    const [before, after] = await Promise.all([
      env.DB.prepare("SELECT * FROM rolls WHERE roller = ? AND seq < ? ORDER BY seq DESC LIMIT ?").bind(row.roller, row.seq, NEIGHBOURS).all(),
      env.DB.prepare("SELECT * FROM rolls WHERE roller = ? AND seq > ? ORDER BY seq ASC LIMIT ?").bind(row.roller, row.seq, NEIGHBOURS).all()
    ]);
    return json({ roll: shape(row), before: before.results.map(shape), after: after.results.map(shape) });
  }

  if (parts[1] === "roller" && parts.length === 3 && method === "GET") {
    const roller = parts[2];
    if (!ROLLER_RE.test(roller)) return json({ error: "Unknown roller ID." }, 400);
    const { results } = await env.DB.prepare("SELECT * FROM rolls WHERE roller = ? ORDER BY seq DESC LIMIT 20").bind(roller).all();
    return json({ rolls: results.map(shape) });
  }

  return null;
}
