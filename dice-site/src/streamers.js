// Top streamers shown beside the dice, and their avatar images.
//
//   GET    /api/streamers                  public list (visible only, live first)
//   GET    /<ADMIN_PATH>/api/streamers            every streamer, for the admin panel
//   POST   /<ADMIN_PATH>/api/streamers            add one
//   PUT    /<ADMIN_PATH>/api/streamers/:id        change one
//   DELETE /<ADMIN_PATH>/api/streamers/:id        remove one
//   POST   /<ADMIN_PATH>/api/streamers/order      { ids: [...] } save the order
//   GET    /media/:id                      an uploaded avatar

import { json, readJson, nowIso } from "./http.js";

const SIDES = ["auto", "left", "right"];
const HANDLE_RE = /^[A-Za-z0-9._]{2,24}$/;
const MAX_AVATAR_BYTES = 300 * 1024;
const IMAGE_TYPES = {
  "image/webp": (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45,
  "image/png": (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
};

const publicShape = (r) => ({
  id: r.id,
  name: r.name,
  handle: r.handle,
  avatar: r.avatar_id ? `/media/${r.avatar_id}` : null,
  verified: !!r.verified,
  live: !!r.live,
  side: r.side
});
const adminShape = (r) => ({ ...publicShape(r), visible: !!r.visible, sort: r.sort });

export async function listPublic(env) {
  const { results } = await env.DB.prepare("SELECT * FROM streamers WHERE visible = 1 ORDER BY live DESC, sort ASC, id ASC").all();
  return json({ streamers: results.map(publicShape) }, 200, { "Cache-Control": "public, max-age=15" });
}

export async function handleAdminStreamers(request, env, parts) {
  const method = request.method;
  const id = parts[3];

  if (!id && method === "GET") {
    const { results } = await env.DB.prepare("SELECT * FROM streamers ORDER BY sort ASC, id ASC").all();
    return json({ streamers: results.map(adminShape) });
  }

  if (id === "order" && method === "POST") {
    const body = await readJson(request);
    const ids = body && Array.isArray(body.ids) ? body.ids.map(Number) : null;
    if (!ids || !ids.every(Number.isInteger)) return json({ error: "Send the new order as a list of streamer IDs." }, 400);
    if (ids.length) await env.DB.batch(ids.map((sid, i) => env.DB.prepare("UPDATE streamers SET sort = ? WHERE id = ?").bind(i, sid)));
    return json({ ok: true });
  }

  if (!id && method === "POST") {
    const body = await readJson(request);
    const fields = validate(body);
    if (fields.error) return json(fields, 400);
    const avatarId = body.avatar ? await saveAvatar(env, body.avatar) : null;
    if (avatarId && avatarId.error) return json(avatarId, 400);
    const now = nowIso();
    const top = await env.DB.prepare("SELECT COALESCE(MAX(sort), -1) + 1 AS next FROM streamers").first();
    const row = await env.DB.prepare(
      `INSERT INTO streamers (name, handle, avatar_id, verified, live, visible, side, sort, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
    ).bind(fields.name, fields.handle, avatarId, fields.verified, fields.live, fields.visible, fields.side, top.next, now, now).first();
    return json({ streamer: adminShape(row) }, 201);
  }

  if (/^\d+$/.test(id || "") && parts.length === 4) {
    const current = await env.DB.prepare("SELECT * FROM streamers WHERE id = ?").bind(Number(id)).first();
    if (!current) return json({ error: "That streamer was already removed." }, 404);

    if (method === "DELETE") {
      await env.DB.batch([
        env.DB.prepare("DELETE FROM streamers WHERE id = ?").bind(current.id),
        env.DB.prepare("DELETE FROM media WHERE id = ?").bind(current.avatar_id)
      ]);
      return json({ ok: true });
    }

    if (method === "PUT") {
      const body = await readJson(request);
      const fields = validate({ ...adminShape(current), ...(body || {}) });
      if (fields.error) return json(fields, 400);
      // avatar: a data URL replaces the picture, null removes it, leaving it out keeps it.
      let avatarId = current.avatar_id;
      if (body && "avatar" in body) {
        avatarId = body.avatar ? await saveAvatar(env, body.avatar) : null;
        if (avatarId && avatarId.error) return json(avatarId, 400);
      }
      const row = await env.DB.prepare(
        `UPDATE streamers SET name = ?, handle = ?, avatar_id = ?, verified = ?, live = ?, visible = ?, side = ?, updated_at = ?
         WHERE id = ? RETURNING *`
      ).bind(fields.name, fields.handle, avatarId, fields.verified, fields.live, fields.visible, fields.side, nowIso(), current.id).first();
      if (current.avatar_id && current.avatar_id !== avatarId) {
        await env.DB.prepare("DELETE FROM media WHERE id = ?").bind(current.avatar_id).run();
      }
      return json({ streamer: adminShape(row) });
    }
  }

  return json({ error: "Not found" }, 404);
}

function validate(body) {
  if (!body || typeof body !== "object") return { error: "Send the streamer as JSON." };
  const name = String(body.name || "").trim();
  const handle = String(body.handle || "").trim().replace(/^@/, "");
  if (!name || name.length > 40) return { error: "Give the streamer a name of 1 to 40 characters." };
  if (!HANDLE_RE.test(handle)) return { error: "A TikTok username is 2 to 24 letters, numbers, dots or underscores." };
  const side = SIDES.includes(body.side) ? body.side : "auto";
  const flag = (v, d) => (v === undefined ? d : v ? 1 : 0);
  return { name, handle, side, verified: flag(body.verified, 1), live: flag(body.live, 0), visible: flag(body.visible, 1) };
}

async function saveAvatar(env, dataUrl) {
  const m = /^data:(image\/(?:webp|png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl));
  if (!m) return { error: "The picture must be a WebP, PNG or JPEG image." };
  let bytes;
  try {
    bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
  } catch {
    return { error: "The picture could not be read." };
  }
  if (bytes.length > MAX_AVATAR_BYTES) return { error: "The picture is too big. Use one under 300 KB." };
  if (!IMAGE_TYPES[m[1]](bytes)) return { error: "That file isn't a real image." };
  const row = await env.DB.prepare("INSERT INTO media (type, data, created_at) VALUES (?, ?, ?) RETURNING id").bind(m[1], bytes, nowIso()).first();
  return row.id;
}

export async function serveMedia(env, id) {
  if (!/^\d+$/.test(id)) return new Response("Not found", { status: 404 });
  const row = await env.DB.prepare("SELECT type, data FROM media WHERE id = ?").bind(Number(id)).first();
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.type,
      // An ID always points at the same picture; a new upload gets a new ID.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'"
    }
  });
}
