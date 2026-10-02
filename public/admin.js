// OVERTHRONE admin panel. All access control happens on the server (Cloudflare
// Access + the Worker); this script only talks to /api/admin/*.
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const h = (tag, attrs, ...children) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k in el && typeof v !== "string") el[k] = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) if (c != null && c !== false) el.append(c);
    return el;
  };

  const main = $("[data-admin-main]");
  const nav = $("[data-admin-nav]");
  const toastEl = $("[data-toast]");
  let toastTimer;
  const toast = (msg, bad) => {
    toastEl.textContent = msg;
    toastEl.classList.toggle("is-error", Boolean(bad));
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, bad ? 6000 : 3000);
  };

  const call = async (method, path, body) => {
    const opts = { method, headers: { Accept: "application/json" }, credentials: "same-origin" };
    if (method !== "GET") opts.headers["X-Overthrone-Admin"] = "1";
    if (body instanceof FormData) opts.body = body;
    else if (body !== undefined) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
    const res = await fetch("/api/admin/" + path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(data.error || "Request failed (" + res.status + ")"); e.status = res.status; throw e; }
    return data;
  };

  const fmtDate = (iso) => {
    const d = iso ? new Date(iso) : null;
    return d && !isNaN(d) ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";
  };

  const FORMAT_HELP = "Formatting: blank line = new paragraph, \"- \" = bullet, \"## \" = heading, **bold**, [link text](https://…).";

  // ---------- Content type definitions ----------
  const RES = {
    home_sections: {
      label: "Home Sections", singular: "section",
      intro: "Extra text sections shown on the home page below Tensura Skills (e.g. Getting Started).",
      columns: [["title", "Title"], ["sort_order", "Order"], ["published", "Published"]],
      fields: [
        { name: "title", label: "Title", type: "text", required: true, max: 120 },
        { name: "body", label: "Body", type: "textarea", rows: 8, help: FORMAT_HELP },
        { name: "sort_order", label: "Order (lower shows first)", type: "number" },
        { name: "published", label: "Published", type: "checkbox" }
      ],
      defaults: { published: 1, sort_order: 100 }
    },
    announcements: {
      label: "Announcements", singular: "announcement",
      intro: "Published announcements appear on the home page. For a site-wide strip, use the banner in Site Settings.",
      columns: [["title", "Title"], ["pinned", "Pinned"], ["published", "Published"], ["published_at", "Published on"]],
      fields: [
        { name: "title", label: "Title", type: "text", required: true, max: 160 },
        { name: "body", label: "Body", type: "textarea", rows: 8, help: FORMAT_HELP },
        { name: "link_url", label: "Link (optional, https://… or /forums?p=1)", type: "text" },
        { name: "pinned", label: "Pinned to top", type: "checkbox" },
        { name: "published", label: "Published", type: "checkbox" }
      ],
      defaults: { published: 0 }
    },
    forum_categories: {
      label: "Forum Categories", singular: "category",
      intro: "Categories are grouped on the Forums page by their Section name, in order.",
      columns: [["section", "Section"], ["name", "Name"], ["sort_order", "Order"], ["published", "Visible"]],
      fields: [
        { name: "section", label: "Section (group heading)", type: "text", required: true, max: 80, list: "sections" },
        { name: "name", label: "Name", type: "text", required: true, max: 80 },
        { name: "slug", label: "URL slug (leave empty to generate)", type: "text", max: 80 },
        { name: "description", label: "Description", type: "text", max: 300 },
        { name: "icon", label: "Icon", type: "select", options: ["", "megaphone", "scroll", "refresh", "list", "chat", "user", "image", "bulb", "crown", "spark", "globe", "gate", "skull", "compass", "shield", "coin", "help", "bug", "flag", "pin"] },
        { name: "sort_order", label: "Order (lower shows first)", type: "number" },
        { name: "published", label: "Visible on the site", type: "checkbox" }
      ],
      defaults: { published: 1, sort_order: 500 }
    },
    forum_posts: {
      label: "Forum Posts", singular: "post",
      intro: "Posts appear in their category once published. Pinned posts stay at the top.",
      columns: [["title", "Title"], ["category_id", "Category"], ["pinned", "Pinned"], ["published", "Published"], ["published_at", "Published on"]],
      fields: [
        { name: "category_id", label: "Category", type: "select", required: true, optionsFrom: "forum_categories" },
        { name: "title", label: "Title", type: "text", required: true, max: 160 },
        { name: "author_name", label: "Author name shown", type: "text", max: 60 },
        { name: "body", label: "Body", type: "textarea", rows: 14, help: FORMAT_HELP },
        { name: "pinned", label: "Pinned", type: "checkbox" },
        { name: "published", label: "Published", type: "checkbox" }
      ],
      defaults: { published: 0, author_name: "OVERTHRONE Staff" },
      filter: "category_id"
    },
    realms: {
      label: "Realms", singular: "realm",
      intro: "Shown in the Realms section of the home page, in order. Leave fields empty rather than guessing; empty descriptions show \"Information will be revealed.\"",
      columns: [["name", "Name"], ["subtitle", "Subtitle"], ["status", "Status"], ["sort_order", "Order"], ["published", "Visible"]],
      fields: [
        { name: "name", label: "Name", type: "text", required: true, max: 80 },
        { name: "slug", label: "URL slug (leave empty to generate)", type: "text", max: 80 },
        { name: "subtitle", label: "Subtitle / role (e.g. Hub, Realm of the Divine)", type: "text", max: 120 },
        { name: "description", label: "Description", type: "textarea", rows: 4 },
        { name: "status", label: "Status (e.g. Open, Coming Soon, Under Development)", type: "text", max: 60, list: "statuses" },
        { name: "image_id", label: "Image", type: "image" },
        { name: "sort_order", label: "Order (lower shows first)", type: "number" },
        { name: "published", label: "Visible on the site", type: "checkbox" }
      ],
      defaults: { published: 1, sort_order: 100 }
    },
    hunter_ranks: {
      label: "Hunter Ranks", singular: "rank",
      intro: "Gameplay progression ranks (not donor ranks). Empty descriptions show \"Information will be revealed.\"",
      columns: [["code", "Rank"], ["name", "Title"], ["sort_order", "Order"], ["published", "Visible"]],
      fields: [
        { name: "code", label: "Rank code (e.g. E, S, ???)", type: "text", required: true, max: 10 },
        { name: "name", label: "Title (optional)", type: "text", max: 80 },
        { name: "description", label: "Description", type: "textarea", rows: 6, help: FORMAT_HELP },
        { name: "requirements", label: "Requirements", type: "textarea", rows: 5, help: FORMAT_HELP },
        { name: "sort_order", label: "Order (lower = earlier rank)", type: "number" },
        { name: "published", label: "Visible on the site", type: "checkbox" }
      ],
      defaults: { published: 1, sort_order: 100 }
    },
    tensura_skills: {
      label: "Tensura Skills", singular: "skill",
      intro: "Only enter information documented on the official Tensura: Reincarnated wiki (tensura.wiki.gg). Empty fields are hidden on the site.",
      columns: [["name", "Name"], ["skill_type", "Type"], ["category", "Category"], ["published", "Published"]],
      fields: [
        { name: "name", label: "Name", type: "text", required: true, max: 100 },
        { name: "skill_type", label: "Type", type: "select", required: true, options: ["Skill", "Magic", "Battlewill"] },
        { name: "category", label: "Category (as named on the wiki)", type: "text", max: 80, list: "skillCategories" },
        { name: "activation", label: "Passive / Active", type: "select", options: ["", "Passive", "Active", "Passive & Active"] },
        { name: "description", label: "Description", type: "textarea", rows: 5, help: FORMAT_HELP },
        { name: "abilities", label: "Abilities (one per line)", type: "textarea", rows: 5 },
        { name: "obtaining", label: "How to obtain", type: "textarea", rows: 3 },
        { name: "requirements", label: "Requirements", type: "textarea", rows: 3 },
        { name: "mastery", label: "Mastery", type: "textarea", rows: 3 },
        { name: "cost", label: "Cost", type: "textarea", rows: 2 },
        { name: "related", label: "Related abilities (comma separated names)", type: "text", max: 1000 },
        { name: "source_url", label: "Source / reference URL", type: "text", placeholder: "https://tensura.wiki.gg/wiki/…" },
        { name: "slug", label: "URL slug (leave empty to generate)", type: "text", max: 80 },
        { name: "sort_order", label: "Order (optional)", type: "number" },
        { name: "published", label: "Published", type: "checkbox" }
      ],
      defaults: { published: 0, skill_type: "Skill", sort_order: 0 },
      filter: "skill_type"
    }
  };

  const VIEWS = [
    ["settings", "Site Settings"],
    ["home_sections", "Home Sections"],
    ["announcements", "Announcements"],
    ["forum_categories", "Forum Categories"],
    ["forum_posts", "Forum Posts"],
    ["realms", "Realms"],
    ["hunter_ranks", "Hunter Ranks"],
    ["tensura_skills", "Tensura Skills"],
    ["media", "Media"],
    ["activity", "Activity"]
  ];

  const cache = {};
  const load = async (name, force) => {
    if (force || !cache[name]) cache[name] = (await call("GET", name)).items;
    return cache[name];
  };

  // ---------- Navigation ----------
  const current = () => {
    const v = location.hash.replace(/^#\/?/, "").split("/");
    return { view: VIEWS.some(([k]) => k === v[0]) ? v[0] : "settings", id: v[1] || null };
  };
  const go = (view, id) => { location.hash = "#/" + view + (id ? "/" + id : ""); };

  const renderNav = () => {
    const { view } = current();
    nav.replaceChildren(h("ul", null, VIEWS.map(([k, label]) =>
      h("li", null, h("a", { href: "#/" + k, "aria-current": k === view ? "page" : null, text: label })))));
  };

  // Views load data asynchronously; only the most recent navigation may paint.
  let routeSeq = 0;
  const paint = (seq, ...nodes) => { if (seq === routeSeq) main.replaceChildren(...nodes); };

  const route = async () => {
    const seq = ++routeSeq;
    renderNav();
    const { view, id } = current();
    main.replaceChildren(h("p", { class: "muted", text: "Loading…" }));
    try {
      if (view === "settings") await viewSettings(seq);
      else if (view === "media") await viewMedia(seq);
      else if (view === "activity") await viewActivity(seq);
      else if (id) await viewForm(view, id, seq);
      else await viewList(view, seq);
      if (seq === routeSeq) main.focus({ preventScroll: true });
    } catch (err) {
      paint(seq, h("div", { class: "admin-error" }, h("p", { text: err.message })));
    }
  };

  // ---------- Generic list ----------
  const cell = (row, key, def, lookups) => {
    const v = row[key];
    if (key === "published" || key === "pinned") return v ? "Yes" : "—";
    if (key === "category_id") return lookups.cat.get(v) || "?";
    if (key.endsWith("_at")) return fmtDate(v) || "—";
    return v === "" || v == null ? "—" : String(v);
  };

  const viewList = async (name, seq) => {
    const def = RES[name];
    const items = await load(name, true);
    const lookups = { cat: new Map() };
    if (name === "forum_posts") (await load("forum_categories", true)).forEach((c) => lookups.cat.set(c.id, c.section + " › " + c.name));

    let filterVal = sessionStorage.getItem("filter:" + name) || "";
    const table = h("table", { class: "admin-table" });
    const draw = () => {
      const rows = def.filter && filterVal ? items.filter((r) => String(r[def.filter]) === filterVal) : items;
      table.replaceChildren(
        h("thead", null, h("tr", null, def.columns.map(([, l]) => h("th", { scope: "col", text: l })), h("th", { scope: "col" }, h("span", { class: "sr-only", text: "Actions" })))),
        h("tbody", null, rows.length ? rows.map((row) => h("tr", null,
          def.columns.map(([k], i) => i === 0
            ? h("td", null, h("a", { href: "#/" + name + "/" + row.id, text: cell(row, k, def, lookups) }))
            : h("td", { text: cell(row, k, def, lookups) })),
          h("td", { class: "row-actions" },
            h("a", { class: "btn btn-sm", href: "#/" + name + "/" + row.id, text: "Edit" }),
            h("button", { class: "btn btn-sm btn-danger", type: "button", text: "Delete", onclick: () => remove(name, row) })))) :
          h("tr", null, h("td", { colspan: String(def.columns.length + 1), class: "muted", text: "Nothing here yet." }))));
    };

    let filterEl = null;
    if (def.filter) {
      const opts = name === "forum_posts"
        ? [...lookups.cat].map(([id, label]) => [String(id), label])
        : RES[name].fields.find((f) => f.name === def.filter).options.map((o) => [o, o]);
      filterEl = h("label", { class: "admin-filter" }, "Show ",
        h("select", { onchange: (e) => { filterVal = e.target.value; sessionStorage.setItem("filter:" + name, filterVal); draw(); } },
          h("option", { value: "", text: "All" }), opts.map(([v, l]) => h("option", { value: v, text: l, selected: v === filterVal }))));
    }
    draw();
    paint(seq,
      h("div", { class: "admin-head" },
        h("div", null, h("h1", { text: def.label }), def.intro ? h("p", { class: "muted", text: def.intro }) : null),
        h("a", { class: "btn btn-primary btn-sm", href: "#/" + name + "/new", text: "New " + def.singular })),
      filterEl,
      h("div", { class: "table-wrap" }, table));
  };

  const remove = async (name, row) => {
    const label = row.title || row.name || row.code || "this item";
    if (!confirm("Delete \"" + label + "\"? This cannot be undone.")) return;
    try {
      await call("DELETE", name + "/" + row.id);
      toast("Deleted.");
      delete cache[name];
      route();
    } catch (err) { toast(err.message, true); }
  };

  // ---------- Generic form ----------
  const viewForm = async (name, id, seq) => {
    const def = RES[name];
    const isNew = id === "new";
    const items = await load(name, true);
    const row = isNew ? { ...def.defaults } : items.find((r) => String(r.id) === id);
    if (!row) throw new Error("This " + def.singular + " no longer exists.");

    const datalists = {};
    if (name === "forum_categories") datalists.sections = [...new Set(items.map((c) => c.section))];
    if (name === "realms") datalists.statuses = ["Open", "Coming Soon", "Under Development"];
    if (name === "tensura_skills") datalists.skillCategories = [...new Set(items.map((s) => s.category).filter(Boolean))];
    const optionsFrom = {};
    if (def.fields.some((f) => f.optionsFrom === "forum_categories")) {
      optionsFrom.forum_categories = (await load("forum_categories", true)).map((c) => [String(c.id), c.section + " › " + c.name]);
    }
    const media = def.fields.some((f) => f.type === "image") ? (await call("GET", "media")).items : [];

    const inputs = {};
    const fieldEls = def.fields.map((f) => {
      const fid = "f-" + f.name;
      const val = row[f.name];
      let input;
      if (f.type === "checkbox") {
        input = h("input", { type: "checkbox", id: fid, checked: Boolean(val) });
        inputs[f.name] = () => (input.checked ? 1 : 0);
        return h("div", { class: "field field-check" }, input, h("label", { for: fid, text: f.label }));
      }
      if (f.type === "textarea") {
        input = h("textarea", { id: fid, rows: String(f.rows || 4) });
        input.value = val ?? "";
      } else if (f.type === "select") {
        const opts = f.optionsFrom ? optionsFrom[f.optionsFrom] : f.options.map((o) => [o, o || "—"]);
        input = h("select", { id: fid, required: f.required }, f.optionsFrom ? h("option", { value: "", text: "Choose…" }) : null,
          opts.map(([v, l]) => h("option", { value: v, text: l })));
        input.value = val == null ? "" : String(val);
      } else if (f.type === "image") {
        return imageField(f, fid, val, media, inputs);
      } else {
        input = h("input", { id: fid, type: f.type === "number" ? "number" : "text", required: f.required, maxlength: f.max ? String(f.max) : null, placeholder: f.placeholder || null, list: f.list ? "dl-" + f.list : null, step: f.type === "number" ? "1" : null });
        input.value = val ?? "";
      }
      inputs[f.name] = () => input.value;
      return h("div", { class: "field" },
        h("label", { for: fid, text: f.label + (f.required ? " *" : "") }),
        input,
        f.help ? h("p", { class: "help", text: f.help }) : null);
    });

    const saveBtn = h("button", { class: "btn btn-primary", type: "submit", text: isNew ? "Create" : "Save changes" });
    const form = h("form", { class: "admin-form", novalidate: true },
      fieldEls,
      Object.entries(datalists).map(([k, list]) => h("datalist", { id: "dl-" + k }, list.map((v) => h("option", { value: v })))),
      h("div", { class: "form-actions" },
        saveBtn,
        h("a", { class: "btn", href: "#/" + name, text: "Cancel" }),
        !isNew ? h("button", { class: "btn btn-danger", type: "button", text: "Delete", onclick: () => remove(name, row) }) : null,
        !isNew ? viewLink(name, row) : null));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const body = Object.fromEntries(Object.entries(inputs).map(([k, get]) => [k, get()]));
      const missing = def.fields.filter((f) => f.required && (body[f.name] === "" || body[f.name] == null));
      if (missing.length) { toast(missing.map((f) => f.label).join(", ") + " is required.", true); return; }
      saveBtn.disabled = true;
      try {
        const res = await call(isNew ? "POST" : "PUT", name + (isNew ? "" : "/" + row.id), body);
        delete cache[name];
        toast(isNew ? "Created." : "Saved.");
        if (isNew) go(name, res.item.id); else route();
      } catch (err) {
        toast(err.message, true);
      } finally { saveBtn.disabled = false; }
    });

    paint(seq,
      h("div", { class: "admin-head" }, h("div", null,
        h("p", { class: "crumb" }, h("a", { href: "#/" + name, text: def.label })),
        h("h1", { text: isNew ? "New " + def.singular : (row.title || row.name || row.code) }),
        !isNew && row.updated_at ? h("p", { class: "muted", text: "Last updated " + fmtDate(row.updated_at) }) : null)),
      form);
  };

  const viewLink = (name, row) => {
    const map = {
      forum_posts: row.published ? "/forums?p=" + row.id : null,
      forum_categories: row.published ? "/forums?c=" + row.slug : null,
      tensura_skills: row.published ? "/tensura?skill=" + row.slug : null,
      realms: "/#realms", hunter_ranks: "/#ranks", announcements: "/#announcements", home_sections: "/"
    };
    return map[name] ? h("a", { class: "btn btn-ghost", href: map[name], target: "_blank", rel: "noopener", text: "View on site" }) : null;
  };

  const imageField = (f, fid, val, media, inputs) => {
    const select = h("select", { id: fid }, h("option", { value: "", text: "No image" }),
      media.map((m) => h("option", { value: String(m.id), text: "#" + m.id + " " + m.filename })));
    select.value = val == null ? "" : String(val);
    const preview = h("div", { class: "image-preview" });
    const showPreview = () => {
      const m = media.find((x) => String(x.id) === select.value);
      preview.replaceChildren(m ? h("img", { src: m.url, alt: m.alt || "" }) : h("span", { class: "muted", text: "No image selected." }));
    };
    select.addEventListener("change", showPreview);
    const file = h("input", { type: "file", accept: "image/png,image/jpeg,image/webp,image/gif,image/avif" });
    const upload = h("button", { class: "btn btn-sm", type: "button", text: "Upload new image", onclick: async () => {
      if (!file.files[0]) { file.click(); return; }
      const fd = new FormData(); fd.append("file", file.files[0]);
      upload.disabled = true;
      try {
        const { item } = await call("POST", "media", fd);
        media.unshift(item);
        select.insertBefore(h("option", { value: String(item.id), text: "#" + item.id + " " + item.filename }), select.options[1] || null);
        select.value = String(item.id);
        showPreview();
        file.value = "";
        toast("Image uploaded.");
      } catch (err) { toast(err.message, true); } finally { upload.disabled = false; }
    } });
    file.addEventListener("change", () => { if (file.files[0]) upload.click(); });
    showPreview();
    inputs[f.name] = () => select.value;
    return h("div", { class: "field" }, h("label", { for: fid, text: f.label }), select, preview,
      h("div", { class: "upload-row" }, file, upload), h("p", { class: "help", text: "PNG, JPEG, WebP, GIF or AVIF, up to 1.5 MB." }));
  };

  // ---------- Settings ----------
  const viewSettings = async (seq) => {
    const { settings, fields } = await call("GET", "settings");
    const inputs = {};
    const groups = new Map();
    for (const [key, f] of Object.entries(fields)) {
      if (!groups.has(f.group)) groups.set(f.group, []);
      const fid = "s-" + key;
      let el;
      if (f.type === "bool") {
        const input = h("input", { type: "checkbox", id: fid, checked: settings[key] === "1" });
        inputs[key] = () => (input.checked ? "1" : "0");
        el = h("div", { class: "field field-check" }, input, h("label", { for: fid, text: f.label }));
      } else {
        const long = (f.max || 0) > 200;
        const input = long ? h("textarea", { id: fid, rows: "3", maxlength: String(f.max) }) : h("input", { id: fid, type: "text", maxlength: f.max ? String(f.max) : null });
        input.value = settings[key] ?? "";
        inputs[key] = () => input.value;
        el = h("div", { class: "field" }, h("label", { for: fid, text: f.label }), input);
      }
      groups.get(f.group).push(el);
    }
    const saveBtn = h("button", { class: "btn btn-primary", type: "submit", text: "Save settings" });
    const form = h("form", { class: "admin-form", novalidate: true },
      [...groups].map(([g, els]) => h("fieldset", null, h("legend", { text: g }), els)),
      h("div", { class: "form-actions" }, saveBtn));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      saveBtn.disabled = true;
      try {
        await call("PUT", "settings", Object.fromEntries(Object.entries(inputs).map(([k, get]) => [k, get()])));
        toast("Settings saved. Changes appear on the site within about 30 seconds.");
      } catch (err) { toast(err.message, true); } finally { saveBtn.disabled = false; }
    });
    paint(seq,
      h("div", { class: "admin-head" }, h("div", null, h("h1", { text: "Site Settings" }),
        h("p", { class: "muted", text: "Server details, links, home page text, the announcement banner and SEO. Everything here is public; never paste passwords or API keys." }))),
      form);
  };

  // ---------- Media ----------
  const viewMedia = async (seq) => {
    const { items } = await call("GET", "media");
    const file = h("input", { type: "file", id: "m-file", accept: "image/png,image/jpeg,image/webp,image/gif,image/avif", required: true });
    const alt = h("input", { type: "text", id: "m-alt", maxlength: "200" });
    const btn = h("button", { class: "btn btn-primary btn-sm", type: "submit", text: "Upload" });
    const form = h("form", { class: "admin-form upload-form" },
      h("div", { class: "field" }, h("label", { for: "m-file", text: "Image (PNG, JPEG, WebP, GIF or AVIF, up to 1.5 MB)" }), file),
      h("div", { class: "field" }, h("label", { for: "m-alt", text: "Description (alt text)" }), alt),
      h("div", { class: "form-actions" }, btn));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!file.files[0]) { toast("Choose an image first.", true); return; }
      const fd = new FormData(); fd.append("file", file.files[0]); fd.append("alt", alt.value);
      btn.disabled = true;
      try { await call("POST", "media", fd); toast("Image uploaded."); route(); }
      catch (err) { toast(err.message, true); } finally { btn.disabled = false; }
    });
    paint(seq,
      h("div", { class: "admin-head" }, h("div", null, h("h1", { text: "Media" }),
        h("p", { class: "muted", text: "Images uploaded here can be used for realms. Deleting an image removes it from any realm that uses it." }))),
      form,
      items.length ? h("ul", { class: "media-grid" }, items.map((m) => h("li", null,
        h("img", { src: m.url, alt: m.alt || "", loading: "lazy" }),
        h("div", { class: "media-meta" },
          h("strong", { text: "#" + m.id + " " + m.filename }),
          h("span", { class: "muted", text: Math.round(m.size / 1024) + " KB · " + fmtDate(m.created_at) }),
          h("div", { class: "row-actions" },
            h("a", { class: "btn btn-sm", href: m.url, target: "_blank", rel: "noopener", text: "Open" }),
            h("button", { class: "btn btn-sm btn-danger", type: "button", text: "Delete", onclick: async () => {
              if (!confirm("Delete this image?")) return;
              try { await call("DELETE", "media/" + m.id); toast("Deleted."); route(); } catch (err) { toast(err.message, true); }
            } })))))) : h("p", { class: "muted", text: "No images uploaded yet." }));
  };

  // ---------- Activity ----------
  const viewActivity = async (seq) => {
    const { admins, audit } = await call("GET", "admins");
    paint(seq,
      h("div", { class: "admin-head" }, h("div", null, h("h1", { text: "Activity" }),
        h("p", { class: "muted", text: "Who can sign in is controlled by Cloudflare Access and the ADMIN_EMAILS secret." }))),
      h("h2", { class: "admin-sub", text: "Admins who have signed in" }),
      h("div", { class: "table-wrap" }, h("table", { class: "admin-table" },
        h("thead", null, h("tr", null, h("th", { text: "Email" }), h("th", { text: "First seen" }), h("th", { text: "Last seen" }))),
        h("tbody", null, admins.map((a) => h("tr", null, h("td", { text: a.email }), h("td", { text: fmtDate(a.first_seen) }), h("td", { text: fmtDate(a.last_seen) })))))),
      h("h2", { class: "admin-sub", text: "Recent changes" }),
      h("div", { class: "table-wrap" }, h("table", { class: "admin-table" },
        h("thead", null, h("tr", null, h("th", { text: "When" }), h("th", { text: "Who" }), h("th", { text: "Action" }), h("th", { text: "What" }))),
        h("tbody", null, audit.length ? audit.map((a) => h("tr", null, h("td", { text: fmtDate(a.created_at) }), h("td", { text: a.email }), h("td", { text: a.action }),
          h("td", { text: a.resource + (a.record_id != null ? " #" + a.record_id : "") }))) : h("tr", null, h("td", { colspan: "4", class: "muted", text: "No changes yet." }))))));
  };

  // ---------- Start ----------
  const start = async () => {
    main.tabIndex = -1;
    try {
      const me = await call("GET", "me");
      $("[data-admin-email]").textContent = me.email + (me.dev ? " (local dev)" : "");
      if (me.dev) $("[data-logout]").hidden = true;
    } catch (err) {
      nav.replaceChildren();
      main.replaceChildren(h("div", { class: "admin-error" }, h("h1", { text: "Admin unavailable" }), h("p", { text: err.message })));
      return;
    }
    window.addEventListener("hashchange", route);
    route();
  };
  start();
})();
