import { HttpError, json, readJson } from "./http.js";
import { getAdmin, authConfigured } from "./auth.js";
import { SETTINGS, cleanSetting, getSettings, clearSettingsCache, isHttpUrl, isLink } from "./settings.js";

// Editable content types. Only the fields listed here can ever be written, and
// table/column names never come from the request, so queries stay injection-safe.
export const RESOURCES = {
  announcements: {
    table: "announcements",
    order: "pinned DESC, COALESCE(published_at, created_at) DESC, id DESC",
    publishedAt: true,
    fields: {
      title: { type: "text", max: 160, required: true },
      body: { type: "text", max: 10000 },
      link_url: { type: "link" },
      pinned: { type: "bool" },
      published: { type: "bool" }
    }
  },
  home_sections: {
    table: "home_sections",
    order: "sort_order, id",
    fields: {
      title: { type: "text", max: 120, required: true },
      body: { type: "text", max: 10000 },
      sort_order: { type: "int" },
      published: { type: "bool" }
    }
  },
  forum_categories: {
    table: "forum_categories",
    order: "sort_order, id",
    slugFrom: "name",
    fields: {
      section: { type: "text", max: 80, required: true },
      name: { type: "text", max: 80, required: true },
      slug: { type: "slug" },
      description: { type: "text", max: 300 },
      icon: { type: "text", max: 30 },
      sort_order: { type: "int" },
      published: { type: "bool" }
    }
  },
  forum_posts: {
    table: "forum_posts",
    order: "pinned DESC, COALESCE(published_at, created_at) DESC, id DESC",
    publishedAt: true,
    fields: {
      category_id: { type: "ref", table: "forum_categories", required: true },
      title: { type: "text", max: 160, required: true },
      body: { type: "text", max: 50000 },
      author_name: { type: "text", max: 60 },
      pinned: { type: "bool" },
      published: { type: "bool" }
    }
  },
  realms: {
    table: "realms",
    order: "sort_order, id",
    slugFrom: "name",
    fields: {
      name: { type: "text", max: 80, required: true },
      slug: { type: "slug" },
      subtitle: { type: "text", max: 120 },
      description: { type: "text", max: 2000 },
      status: { type: "text", max: 60 },
      image_id: { type: "ref", table: "media" },
      sort_order: { type: "int" },
      published: { type: "bool" }
    }
  },
  hunter_ranks: {
    table: "hunter_ranks",
    order: "sort_order, id",
    fields: {
      code: { type: "text", max: 10, required: true },
      name: { type: "text", max: 80 },
      description: { type: "text", max: 4000 },
      requirements: { type: "text", max: 4000 },
      sort_order: { type: "int" },
      published: { type: "bool" }
    }
  },
  tensura_skills: {
    table: "tensura_skills",
    order: "sort_order, name COLLATE NOCASE",
    slugFrom: "name",
    fields: {
      name: { type: "text", max: 100, required: true },
      slug: { type: "slug" },
      skill_type: { type: "enum", values: ["Skill", "Magic", "Battlewill"], required: true },
      category: { type: "text", max: 80 },
      activation: { type: "enum", values: ["", "Passive", "Active", "Passive & Active"] },
      description: { type: "text", max: 8000 },
      abilities: { type: "text", max: 8000 },
      obtaining: { type: "text", max: 4000 },
      requirements: { type: "text", max: 4000 },
      mastery: { type: "text", max: 4000 },
      cost: { type: "text", max: 2000 },
      related: { type: "text", max: 1000 },
      source_url: { type: "url" },
      sort_order: { type: "int" },
      published: { type: "bool" }
    }
  }
};

const MEDIA_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };
const MEDIA_MAX = 1.5 * 1024 * 1024;

const slugify = (s) =>
  String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

async function clean(env, def, body) {
  const out = {};
  for (const [name, f] of Object.entries(def.fields)) {
    let v = body[name];
    switch (f.type) {
      case "bool":
        out[name] = v === true || v === 1 || v === "1" ? 1 : 0;
        continue;
      case "int":
        v = v === "" || v == null ? 0 : Number(v);
        if (!Number.isInteger(v) || Math.abs(v) > 1e9) throw new HttpError(400, name + " must be a whole number.");
        out[name] = v;
        continue;
      case "ref": {
        if (v === "" || v == null) {
          if (f.required) throw new HttpError(400, name + " is required.");
          out[name] = null;
          continue;
        }
        v = Number(v);
        const exists = Number.isInteger(v) && await env.DB.prepare(`SELECT 1 FROM ${f.table} WHERE id = ?`).bind(v).first();
        if (!exists) throw new HttpError(400, name + " does not exist.");
        out[name] = v;
        continue;
      }
    }
    v = typeof v === "string" ? v.trim() : v == null ? "" : String(v);
    if (f.required && !v) throw new HttpError(400, name + " is required.");
    if (f.max && v.length > f.max) throw new HttpError(400, name + " is too long (max " + f.max + ").");
    if (f.type === "url" && v && !isHttpUrl(v)) throw new HttpError(400, name + " must start with https://");
    if (f.type === "link" && v && !isLink(v)) throw new HttpError(400, name + " must be a full URL or a path starting with /");
    if (f.type === "enum" && !f.values.includes(v)) throw new HttpError(400, name + " must be one of: " + f.values.filter(Boolean).join(", "));
    if (f.type === "slug") v = slugify(v);
    out[name] = v;
  }
  return out;
}

async function uniqueSlug(env, table, base, id) {
  const root = slugify(base) || "item";
  for (let n = 1; n < 100; n++) {
    const slug = n === 1 ? root : root + "-" + n;
    const taken = await env.DB.prepare(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`).bind(slug, id || 0).first();
    if (!taken) return slug;
  }
  throw new HttpError(409, "Could not create a unique slug.");
}

async function audit(env, admin, action, resource, id) {
  await env.DB.prepare("INSERT INTO admin_audit (email, action, resource, record_id) VALUES (?, ?, ?, ?)")
    .bind(admin.email, action, resource, id ?? null).run();
}

async function saveResource(env, admin, name, id, body) {
  const def = RESOURCES[name];
  const data = await clean(env, def, body);
  if (def.slugFrom) data.slug = await uniqueSlug(env, def.table, data.slug || data[def.slugFrom], id);
  const cols = Object.keys(data);
  let row;
  if (id) {
    const sets = cols.map((c) => c + " = ?").join(", ");
    row = await env.DB.prepare(
      `UPDATE ${def.table} SET ${sets}, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ? RETURNING *`
    ).bind(...cols.map((c) => data[c]), id).first();
    if (!row) throw new HttpError(404, "Not found.");
  } else {
    row = await env.DB.prepare(
      `INSERT INTO ${def.table} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")}) RETURNING *`
    ).bind(...cols.map((c) => data[c])).first();
  }
  if (def.publishedAt && row.published && !row.published_at) {
    row = await env.DB.prepare(
      `UPDATE ${def.table} SET published_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ? RETURNING *`
    ).bind(row.id).first();
  }
  await audit(env, admin, id ? "update" : "create", name, row.id);
  return row;
}

async function deleteResource(env, admin, name, id) {
  const def = RESOURCES[name];
  if (name === "forum_categories") {
    const used = await env.DB.prepare("SELECT COUNT(*) AS n FROM forum_posts WHERE category_id = ?").bind(id).first();
    if (used.n > 0) throw new HttpError(409, "This category still has " + used.n + " post(s). Move or delete them first.");
  }
  const res = await env.DB.prepare(`DELETE FROM ${def.table} WHERE id = ?`).bind(id).run();
  if (!res.meta.changes) throw new HttpError(404, "Not found.");
  await audit(env, admin, "delete", name, id);
}

// ---------- Public API (read-only, published content only) ----------

const mediaUrl = (id) => (id ? "/media/" + id : null);

async function publicApi(env, parts) {
  const [kind, arg] = parts;
  const db = env.DB;
  if (kind === "site" && !arg) {
    const [settings, ann, sections] = await Promise.all([
      getSettings(env),
      db.prepare(`SELECT id, title, body, link_url, pinned, published_at FROM announcements WHERE published = 1 ORDER BY ${RESOURCES.announcements.order} LIMIT 6`).all(),
      db.prepare("SELECT id, title, body FROM home_sections WHERE published = 1 ORDER BY sort_order, id").all()
    ]);
    return { settings, announcements: ann.results, sections: sections.results };
  }
  if (kind === "realms" && !arg) {
    const { results } = await db.prepare("SELECT id, name, slug, subtitle, description, status, image_id FROM realms WHERE published = 1 ORDER BY sort_order, id").all();
    return { realms: results.map(({ image_id, ...r }) => ({ ...r, image_url: mediaUrl(image_id) })) };
  }
  if (kind === "ranks" && !arg) {
    const { results } = await db.prepare("SELECT id, code, name, description, requirements FROM hunter_ranks WHERE published = 1 ORDER BY sort_order, id").all();
    return { ranks: results };
  }
  if (kind === "skills" && !arg) {
    const { results } = await db.prepare(
      "SELECT id, name, slug, skill_type, category, activation, description, abilities, obtaining, requirements, mastery, cost, related, source_url FROM tensura_skills WHERE published = 1 ORDER BY " + RESOURCES.tensura_skills.order
    ).all();
    return { skills: results };
  }
  if (kind === "forums" && !arg) {
    const { results } = await db.prepare(`
      SELECT c.id, c.section, c.name, c.slug, c.description, c.icon,
        (SELECT COUNT(*) FROM forum_posts p WHERE p.category_id = c.id AND p.published = 1) AS post_count,
        l.id AS latest_id, l.title AS latest_title, l.author_name AS latest_author, l.published_at AS latest_at
      FROM forum_categories c
      LEFT JOIN forum_posts l ON l.id = (
        SELECT p.id FROM forum_posts p WHERE p.category_id = c.id AND p.published = 1
        ORDER BY p.published_at DESC, p.id DESC LIMIT 1)
      WHERE c.published = 1
      ORDER BY c.sort_order, c.id`).all();
    return {
      categories: results.map(({ latest_id, latest_title, latest_author, latest_at, ...c }) => ({
        ...c,
        latest: latest_id ? { id: latest_id, title: latest_title, author_name: latest_author, published_at: latest_at } : null
      }))
    };
  }
  if (kind === "forums" && arg) {
    const category = await db.prepare("SELECT id, section, name, slug, description, icon FROM forum_categories WHERE slug = ? AND published = 1").bind(arg).first();
    if (!category) throw new HttpError(404, "Category not found.");
    const { results } = await db.prepare(
      `SELECT id, title, author_name, pinned, published_at, updated_at, substr(body, 1, 240) AS excerpt
       FROM forum_posts WHERE category_id = ? AND published = 1 ORDER BY ${RESOURCES.forum_posts.order}`
    ).bind(category.id).all();
    return { category, posts: results };
  }
  if (kind === "posts" && /^\d+$/.test(arg || "")) {
    const post = await db.prepare(
      `SELECT p.id, p.title, p.body, p.author_name, p.pinned, p.published_at, p.updated_at,
              c.name AS category_name, c.slug AS category_slug, c.section AS category_section
       FROM forum_posts p JOIN forum_categories c ON c.id = p.category_id
       WHERE p.id = ? AND p.published = 1 AND c.published = 1`
    ).bind(Number(arg)).first();
    if (!post) throw new HttpError(404, "Post not found.");
    return { post };
  }
  throw new HttpError(404, "Not found.");
}

// ---------- Admin API ----------

async function adminApi(request, env, admin, parts) {
  const method = request.method;
  const db = env.DB;
  // Mutations must come from the admin page itself: a custom header forces a
  // CORS preflight (which this API never approves) for any cross-site attempt.
  if (method !== "GET") {
    const origin = request.headers.get("Origin");
    if (request.headers.get("X-Overthrone-Admin") !== "1" || (origin && origin !== new URL(request.url).origin)) {
      throw new HttpError(403, "Request rejected.");
    }
  }
  const [kind, arg] = parts;

  if (kind === "me" && method === "GET") {
    await db.prepare(
      `INSERT INTO admin_users (email) VALUES (?)
       ON CONFLICT(email) DO UPDATE SET last_seen = strftime('%Y-%m-%dT%H:%M:%SZ','now')`
    ).bind(admin.email).run();
    return { email: admin.email, dev: admin.dev };
  }

  if (kind === "settings") {
    if (method === "GET") {
      return {
        settings: await getSettings(env, { fresh: true }),
        fields: Object.fromEntries(Object.entries(SETTINGS).map(([k, d]) => [k, { group: d.group, label: d.label, type: d.type, max: d.max }]))
      };
    }
    if (method === "PUT") {
      const body = await readJson(request);
      const stmts = [];
      for (const [key, value] of Object.entries(body)) {
        if (!(key in SETTINGS)) continue;
        let v;
        try { v = cleanSetting(key, value); } catch (e) { throw new HttpError(400, e.message); }
        stmts.push(db.prepare(
          `INSERT INTO site_settings (key, value) VALUES (?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')`
        ).bind(key, v));
      }
      if (stmts.length) await db.batch(stmts);
      clearSettingsCache();
      await audit(env, admin, "update", "settings", null);
      return { settings: await getSettings(env, { fresh: true }) };
    }
  }

  if (kind === "admins" && method === "GET") {
    const [users, log] = await Promise.all([
      db.prepare("SELECT email, role, first_seen, last_seen FROM admin_users ORDER BY last_seen DESC").all(),
      db.prepare("SELECT email, action, resource, record_id, created_at FROM admin_audit ORDER BY id DESC LIMIT 50").all()
    ]);
    return { admins: users.results, audit: log.results };
  }

  if (kind === "media") {
    if (method === "GET" && !arg) {
      const { results } = await db.prepare("SELECT id, filename, content_type, size, alt, created_at FROM media ORDER BY id DESC").all();
      return { items: results.map((m) => ({ ...m, url: mediaUrl(m.id) })) };
    }
    if (method === "POST" && !arg) {
      const type = request.headers.get("Content-Type") || "";
      if (!type.startsWith("multipart/form-data")) throw new HttpError(415, "Expected a file upload.");
      if (Number(request.headers.get("Content-Length") || 0) > MEDIA_MAX + 100000) throw new HttpError(413, "Images must be 1.5 MB or smaller.");
      const form = await request.formData();
      const file = form.get("file");
      if (!file || typeof file === "string") throw new HttpError(400, "Choose an image to upload.");
      if (file.size > MEDIA_MAX) throw new HttpError(413, "Images must be 1.5 MB or smaller.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const contentType = sniffImage(bytes);
      if (!contentType) throw new HttpError(415, "Only PNG, JPEG, WebP, GIF or AVIF images are allowed.");
      const alt = String(form.get("alt") || "").trim().slice(0, 200);
      const filename = String(file.name || "image").replace(/[^\w.\- ]+/g, "").slice(0, 120) || "image." + MEDIA_TYPES[contentType];
      const row = await db.prepare(
        "INSERT INTO media (filename, content_type, size, alt, data) VALUES (?, ?, ?, ?, ?) RETURNING id, filename, content_type, size, alt, created_at"
      ).bind(filename, contentType, bytes.length, alt, bytes).first();
      await audit(env, admin, "create", "media", row.id);
      return { item: { ...row, url: mediaUrl(row.id) } };
    }
    if (method === "PUT" && /^\d+$/.test(arg || "")) {
      const body = await readJson(request);
      const row = await db.prepare("UPDATE media SET alt = ? WHERE id = ? RETURNING id, filename, content_type, size, alt, created_at")
        .bind(String(body.alt || "").trim().slice(0, 200), Number(arg)).first();
      if (!row) throw new HttpError(404, "Not found.");
      return { item: { ...row, url: mediaUrl(row.id) } };
    }
    if (method === "DELETE" && /^\d+$/.test(arg || "")) {
      const id = Number(arg);
      await db.batch([
        db.prepare("UPDATE realms SET image_id = NULL WHERE image_id = ?").bind(id),
        db.prepare("DELETE FROM media WHERE id = ?").bind(id)
      ]);
      await audit(env, admin, "delete", "media", id);
      return { ok: true };
    }
  }

  if (kind in RESOURCES) {
    const def = RESOURCES[kind];
    if (!arg && method === "GET") {
      const { results } = await db.prepare(`SELECT * FROM ${def.table} ORDER BY ${def.order}`).all();
      return { items: results };
    }
    if (!arg && method === "POST") return { item: await saveResource(env, admin, kind, null, await readJson(request)) };
    if (/^\d+$/.test(arg || "")) {
      const id = Number(arg);
      if (method === "PUT") return { item: await saveResource(env, admin, kind, id, await readJson(request)) };
      if (method === "DELETE") { await deleteResource(env, admin, kind, id); return { ok: true }; }
    }
  }
  throw new HttpError(404, "Not found.");
}

function sniffImage(b) {
  const at = (i, ...v) => v.every((x, j) => b[i + j] === x);
  if (at(0, 0x89, 0x50, 0x4e, 0x47)) return "image/png";
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x47, 0x49, 0x46, 0x38)) return "image/gif";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
  if (at(4, 0x66, 0x74, 0x79, 0x70) && (at(8, 0x61, 0x76, 0x69, 0x66) || at(8, 0x61, 0x76, 0x69, 0x73))) return "image/avif";
  return null;
}

export async function serveMedia(env, id) {
  if (!/^\d+$/.test(id)) return new Response("Not found", { status: 404 });
  const row = await env.DB.prepare("SELECT content_type, data FROM media WHERE id = ?").bind(Number(id)).first();
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.content_type,
      "Cache-Control": "public, max-age=86400",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Content-Disposition": "inline"
    }
  });
}

export async function handleApi(request, env, url) {
  const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  try {
    if (!env.DB) throw new HttpError(503, "The database is not connected yet.");
    if (parts[0] === "public") {
      if (request.method !== "GET" && request.method !== "HEAD") throw new HttpError(405, "Method not allowed.");
      return json(await publicApi(env, parts.slice(1)), 200, { "Cache-Control": "public, max-age=15" });
    }
    if (parts[0] === "admin") {
      const admin = await getAdmin(request, env);
      if (!admin) {
        throw new HttpError(401, authConfigured(env)
          ? "Not signed in as an admin."
          : "Admin sign-in is not configured yet. Set ACCESS_TEAM_DOMAIN, ACCESS_AUD and ADMIN_EMAILS.");
      }
      return json(await adminApi(request, env, admin, parts.slice(1)));
    }
    throw new HttpError(404, "Not found.");
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    const msg = String(err && err.message || err);
    console.error("API error", msg);
    if (/no such table/i.test(msg)) return json({ error: "The database has not been set up yet. Run the D1 migrations." }, 503);
    if (/UNIQUE constraint/i.test(msg)) return json({ error: "That value is already used." }, 409);
    return json({ error: "Something went wrong." }, 500);
  }
}
