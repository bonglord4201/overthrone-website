// Dice rolls: the only place dice are rolled. The Worker picks the faces with
// crypto.getRandomValues, saves the roll in D1 and only then sends it back,
// so editing the page cannot change a result and anyone can look a roll up.
//
// Verification also reports whether a roller has been flagged or banned by the
// owner, so players see a warning on a known re-roller or scammer.

import { json, readJson, nowIso } from "./http.js";

const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const ID_RE = /^[A-HJ-NP-Za-km-z2-9]{10}$/;
const ROLLER_RE = /^[0-9a-f]{12}$/;
const KEY_RE = /^[A-Za-z0-9]{24,64}$/;
const MIN_GAP_MS = 400; // one roll per roller per 0.4 s
const NEIGHBOURS = 5;
const REPORT_WINDOW_MS = 60000; // one report per address per minute
const REPORT_MAX = 600;

async function createRoll(request, env) {
  const body = await readJson(request);
  const key = String((body && body.key) || "");
  const dice = Number(body && body.dice);
  const kind = body && body.kind === "number" ? "number" : "color";
  const session = ID_RE.test(String(body && body.session)) ? body.session : "";
  if (!KEY_RE.test(key)) return json({ error: "Missing or invalid roller key." }, 400);
  if (!Number.isInteger(dice) || dice < 1 || dice > 6) return json({ error: "Roll 1 to 6 dice." }, 400);

  const roller = await rollerId(key);
  const flag = await env.DB.prepare("SELECT banned, label FROM roller_flags WHERE roller = ?").bind(roller).first();
  if (flag && flag.banned) {
    return json({ error: "This roller is banned from " + (new URL(request.url).host || "this site") + (flag.label ? ": " + flag.label : "."), banned: true }, 403);
  }

  const now = Date.now();
  const faces = randomFaces(dice);

  for (let attempt = 0; attempt < 3; attempt++) {
    const id = randomId();
    const createdAt = new Date(now).toISOString();
    try {
      // One statement, so the roll number and the rate limit are checked atomically.
      const res = await env.DB.prepare(
        `INSERT INTO rolls (id, roller, seq, dice, kind, faces, created_at, session)
         SELECT ?1, ?2, COALESCE((SELECT MAX(seq) FROM rolls WHERE roller = ?2), 0) + 1, ?3, ?4, ?5, ?6, ?8
         WHERE NOT EXISTS (SELECT 1 FROM rolls WHERE roller = ?2 AND created_at > ?7)`
      ).bind(id, roller, dice, kind, faces.join(","), createdAt, new Date(now - MIN_GAP_MS).toISOString(), session).run();
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
  at: row.created_at,
  session: row.session || ""
});

// The public part of a roller's flag: whether they're flagged or banned and the
// short reason. The private note is never sent here.
async function publicFlag(env, roller) {
  const f = await env.DB.prepare("SELECT banned, label FROM roller_flags WHERE roller = ?").bind(roller).first();
  if (!f) return null;
  return { flagged: true, banned: !!f.banned, label: f.label || "" };
}

async function fileReport(request, env) {
  const body = await readJson(request);
  const message = String((body && body.message) || "").trim();
  const rollId = String((body && body.rollId) || "").trim();
  if (message.length < 3 || message.length > 1000) return json({ error: "Tell us what happened (a few words up to 1000 characters)." }, 400);
  if (rollId && !ID_RE.test(rollId)) return json({ error: "That roll ID isn't valid. Leave it blank or paste the 10-character ID." }, 400);

  const ip = request.headers.get("CF-Connecting-IP") || "local";
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM reports WHERE reporter_ip = ? AND created_at > ?")
    .bind(ip, new Date(Date.now() - REPORT_WINDOW_MS).toISOString()).first();
  if (recent.n > 0) return json({ error: "Thanks — you've already sent a report. Try again in a minute." }, 429);

  let roller = null;
  if (rollId) {
    const row = await env.DB.prepare("SELECT roller FROM rolls WHERE id = ?").bind(rollId).first();
    roller = row ? row.roller : null;
  }
  const total = await env.DB.prepare("SELECT COUNT(*) AS n FROM reports").first();
  const writes = [env.DB.prepare("INSERT INTO reports (roll_id, roller, message, reporter_ip, status, created_at) VALUES (?, ?, ?, ?, 'new', ?)")
    .bind(rollId || null, roller, message.slice(0, 1000), ip, nowIso())];
  // Keep the table from growing without bound: drop the oldest reviewed reports.
  if (total.n >= REPORT_MAX) {
    writes.push(env.DB.prepare("DELETE FROM reports WHERE id IN (SELECT id FROM reports WHERE status = 'reviewed' ORDER BY created_at ASC LIMIT 50)"));
  }
  await env.DB.batch(writes);
  return json({ ok: true }, 201);
}

export async function handleRolls(request, env, parts) {
  const method = request.method;

  if (parts[1] === "roll" && parts.length === 2) {
    if (method !== "POST") return json({ error: "Use POST to roll." }, 405);
    return createRoll(request, env);
  }

  if (parts[1] === "report" && parts.length === 2 && method === "POST") {
    return fileReport(request, env);
  }

  // A session code groups every roll made in one page visit.
  if (parts[1] === "session" && parts.length === 3 && method === "GET") {
    const code = parts[2];
    if (!ID_RE.test(code)) return json({ error: "A session code is 10 letters and digits." }, 400);
    const { results } = await env.DB.prepare("SELECT * FROM rolls WHERE session = ? ORDER BY created_at ASC, seq ASC LIMIT 200").bind(code).all();
    if (!results.length) return json({ error: "No session has this code. A made-up or edited code will never be found." }, 404);
    const flag = await publicFlag(env, results[0].roller);
    return json({ session: code, roller: results[0].roller, rolls: results.map(shape), flag });
  }

  if (parts[1] === "roll" && parts.length === 3 && method === "GET") {
    const id = parts[2];
    if (!ID_RE.test(id)) return json({ error: "A roll ID is 10 letters and digits." }, 400);
    const row = await env.DB.prepare("SELECT * FROM rolls WHERE id = ?").bind(id).first();
    if (!row) return json({ error: "No roll has this ID. A made-up or edited ID will never be found." }, 404);
    const [before, after, flag] = await Promise.all([
      env.DB.prepare("SELECT * FROM rolls WHERE roller = ? AND seq < ? ORDER BY seq DESC LIMIT ?").bind(row.roller, row.seq, NEIGHBOURS).all(),
      env.DB.prepare("SELECT * FROM rolls WHERE roller = ? AND seq > ? ORDER BY seq ASC LIMIT ?").bind(row.roller, row.seq, NEIGHBOURS).all(),
      publicFlag(env, row.roller)
    ]);
    return json({ roll: shape(row), before: before.results.map(shape), after: after.results.map(shape), flag });
  }

  if (parts[1] === "roller" && parts.length === 3 && method === "GET") {
    const roller = parts[2];
    if (!ROLLER_RE.test(roller)) return json({ error: "Unknown roller ID." }, 400);
    const [rolls, flag] = await Promise.all([
      env.DB.prepare("SELECT * FROM rolls WHERE roller = ? ORDER BY seq DESC LIMIT 20").bind(roller).all(),
      publicFlag(env, roller)
    ]);
    return json({ rolls: rolls.results.map(shape), flag });
  }

  return null;
}
