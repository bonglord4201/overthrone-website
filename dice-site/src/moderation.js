// Admin moderation (owner only, behind the secret address and password).
//
//   GET    .../api/rollers/:roller      a roller's recent rolls + re-roll analysis
//   GET    .../api/flags                every flagged or banned roller
//   POST   .../api/flags                flag or ban a roller { roller, banned, label, note }
//   DELETE .../api/flags/:roller        remove a flag/ban
//   GET    .../api/suspects             rollers with burst-roll patterns, worst first
//   GET    .../api/reports              player reports (newest first)
//   POST   .../api/reports/:id          { status } mark a report reviewed or new
//   DELETE .../api/reports/:id          delete a report
//
// Nothing here can change a roll. Flags and bans only add a public warning and,
// for a ban, stop that roller from rolling.

import { json, readJson, nowIso } from "./http.js";

const ROLLER_RE = /^[0-9a-f]{12}$/;
// Two rolls closer together than this look like a re-roll (press, dislike, press again).
const REROLL_GAP_MS = 6000;

const rollShape = (r) => ({ id: r.id, seq: r.seq, dice: r.dice, kind: r.kind, faces: r.faces.split(",").map(Number), at: r.created_at });

// Count how many of a roller's rolls came right after the one before it. A high
// count next to a low "shown" count is the tell: they rolled many times but only
// showed a few on stream.
function rerollStats(rolls) {
  const asc = [...rolls].sort((a, b) => a.seq - b.seq);
  let bursts = 0, longest = 1, run = 1;
  for (let i = 1; i < asc.length; i++) {
    const gap = Date.parse(asc[i].created_at) - Date.parse(asc[i - 1].created_at);
    if (gap >= 0 && gap < REROLL_GAP_MS) {
      bursts++;
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }
  return { total: asc.length, bursts, longestBurst: longest };
}

export async function handleModeration(request, env, parts) {
  // parts = ["api", "admin", <section>, <id?>]
  const section = parts[2];
  const id = parts[3];
  const method = request.method;

  if (section === "rollers" && id && method === "GET") {
    if (!ROLLER_RE.test(id)) return json({ error: "That isn't a roller ID." }, 400);
    const { results } = await env.DB.prepare("SELECT * FROM rolls WHERE roller = ? ORDER BY seq DESC LIMIT 60").bind(id).all();
    if (!results.length) return json({ error: "No rolls for this roller yet." }, 404);
    const flag = await env.DB.prepare("SELECT * FROM roller_flags WHERE roller = ?").bind(id).first();
    return json({
      roller: id,
      rolls: results.map(rollShape),
      stats: rerollStats(results),
      flag: flag ? { banned: !!flag.banned, label: flag.label, note: flag.note, at: flag.updated_at } : null
    });
  }

  if (section === "flags") {
    if (method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM roller_flags ORDER BY updated_at DESC").all();
      return json({ flags: results.map((f) => ({ roller: f.roller, banned: !!f.banned, label: f.label, note: f.note, at: f.updated_at })) });
    }
    if (method === "POST") {
      const body = await readJson(request);
      const roller = String((body && body.roller) || "").trim();
      if (!ROLLER_RE.test(roller)) return json({ error: "That isn't a roller ID." }, 400);
      const banned = body && body.banned ? 1 : 0;
      const label = String((body && body.label) || "").trim().slice(0, 80);
      const note = String((body && body.note) || "").trim().slice(0, 500);
      const now = nowIso();
      await env.DB.prepare(
        `INSERT INTO roller_flags (roller, banned, label, note, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5)
         ON CONFLICT(roller) DO UPDATE SET banned = ?2, label = ?3, note = ?4, updated_at = ?5`
      ).bind(roller, banned, label, note, now).run();
      return json({ ok: true });
    }
    if (method === "DELETE" && id) {
      await env.DB.prepare("DELETE FROM roller_flags WHERE roller = ?").bind(id).run();
      return json({ ok: true });
    }
  }

  if (section === "suspects" && method === "GET") {
    // Look at recent rolls, group by roller, and surface anyone with several
    // back-to-back rolls. The owner then opens the roller to judge for themselves.
    const { results } = await env.DB.prepare(
      "SELECT roller, seq, created_at FROM rolls WHERE created_at > ? ORDER BY roller ASC, seq ASC"
    ).bind(new Date(Date.now() - 7 * 86400000).toISOString()).all();
    const byRoller = new Map();
    for (const r of results) {
      if (!byRoller.has(r.roller)) byRoller.set(r.roller, []);
      byRoller.get(r.roller).push(r);
    }
    const flags = new Set((await env.DB.prepare("SELECT roller FROM roller_flags").all()).results.map((f) => f.roller));
    const suspects = [];
    for (const [roller, rows] of byRoller) {
      const s = rerollStats(rows);
      if (s.bursts >= 3 || s.longestBurst >= 4) {
        suspects.push({ roller, ...s, last: rows[rows.length - 1].created_at, flagged: flags.has(roller) });
      }
    }
    suspects.sort((a, b) => b.bursts - a.bursts || b.longestBurst - a.longestBurst);
    return json({ suspects: suspects.slice(0, 50) });
  }

  if (section === "reports") {
    if (method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM reports ORDER BY status = 'reviewed', created_at DESC LIMIT 100").all();
      return json({ reports: results.map((r) => ({ id: r.id, rollId: r.roll_id, roller: r.roller, message: r.message, status: r.status, at: r.created_at })) });
    }
    if (method === "POST" && id) {
      const body = await readJson(request);
      const status = body && body.status === "reviewed" ? "reviewed" : "new";
      await env.DB.prepare("UPDATE reports SET status = ? WHERE id = ?").bind(status, Number(id)).run();
      return json({ ok: true });
    }
    if (method === "DELETE" && id) {
      await env.DB.prepare("DELETE FROM reports WHERE id = ?").bind(Number(id)).run();
      return json({ ok: true });
    }
  }

  return json({ error: "Not found" }, 404);
}
