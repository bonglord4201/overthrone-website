// Loads published content from the Worker API (/api/public/*) and renders it.
// Every page ships with static fallback markup, so if the API is unreachable
// the page keeps what it already shows. All user content is inserted as text
// nodes, never as HTML.
(() => {
  "use strict";

  const page = document.body.dataset.page;
  const $ = (sel, root = document) => root.querySelector(sel);
  const params = new URLSearchParams(location.search);

  const h = (tag, attrs, ...children) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) if (c != null && c !== false) el.append(c);
    return el;
  };

  const api = async (path) => {
    const res = await fetch("/api/public/" + path, { headers: { Accept: "application/json" } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const err = new Error(data.error || "Request failed"); err.status = res.status; throw err; }
    return data;
  };

  const dateFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });
  const fmtDate = (iso) => { const d = iso ? new Date(iso) : null; return d && !isNaN(d) ? dateFmt.format(d) : ""; };
  const timeEl = (iso) => (iso ? h("time", { datetime: iso, text: fmtDate(iso) }) : null);

  // ---------- Safe rich text: paragraphs, "- " lists, "## " headings, **bold**, [links](https://...) ----------
  const inline = (text) => {
    const out = [];
    const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push(text.slice(last, m.index));
      if (m[1]) out.push(h("strong", { text: m[1] }));
      else {
        const external = /^https?:/i.test(m[3]);
        out.push(h("a", { class: "inline-link", href: m[3], text: m[2], target: external ? "_blank" : null, rel: external ? "noopener noreferrer" : null }));
      }
      last = re.lastIndex;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  };

  const rich = (text) => {
    const frag = document.createDocumentFragment();
    const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
    let para = [], list = null;
    const flushPara = () => {
      if (!para.length) return;
      const p = h("p");
      para.forEach((l, i) => { if (i) p.append(h("br")); p.append(...inline(l)); });
      frag.append(p);
      para = [];
    };
    const flushList = () => { if (list) frag.append(list); list = null; };
    for (const raw of lines) {
      const line = raw.trim();
      let m;
      if (!line) { flushPara(); flushList(); continue; }
      if ((m = line.match(/^#{1,3}\s+(.*)$/))) { flushPara(); flushList(); frag.append(h("h3", null, inline(m[1]))); continue; }
      if ((m = line.match(/^[-*•]\s+(.*)$/))) {
        flushPara();
        if (!list) list = h("ul");
        list.append(h("li", null, inline(m[1])));
        continue;
      }
      flushList();
      para.push(line);
    }
    flushPara(); flushList();
    return frag;
  };

  // ---------- Icons (simple line icons, drawn for this site) ----------
  const ICONS = {
    megaphone: "M3 11v2a1 1 0 0 0 1 1h2l5 4V6l-5 4H4a1 1 0 0 0-1 1zM15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12",
    scroll: "M8 3h10a2 2 0 0 1 2 2v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1h11v1a2 2 0 0 0 2 2M8 3a2 2 0 0 0-2 2v11M10 8h6M10 12h6",
    refresh: "M20 11a8 8 0 0 0-14.9-3.9M4 4v4h4M4 13a8 8 0 0 0 14.9 3.9M20 20v-4h-4",
    list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
    chat: "M4 5h16v11H9l-5 4z",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
    image: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 8.5h.01",
    bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z",
    crown: "M3 7l4 4 5-6 5 6 4-4-2 11H5zM5 21h14",
    spark: "M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z",
    globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9M12 3C9.5 5.7 8.2 8.7 8.2 12s1.3 6.3 3.8 9",
    gate: "M4 21V10a8 8 0 0 1 16 0v11M8 21v-9a4 4 0 0 1 8 0v9M2 21h20",
    skull: "M12 3a8 8 0 0 0-8 8c0 2.6 1.3 4.6 3 5.7V20h10v-3.3c1.7-1.1 3-3.1 3-5.7a8 8 0 0 0-8-8zM9 11h.01M15 11h.01M10 20v-2M14 20v-2",
    compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z",
    shield: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z",
    coin: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 6v12M15 9.5c0-1.1-1.3-2-3-2s-3 .9-3 2 1.3 2 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2",
    help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01",
    bug: "M9 7a3 3 0 0 1 6 0M7 9h10v5a5 5 0 0 1-10 0zM12 9v10M3 13h4M17 13h4M4 8l3 2M20 8l-3 2M4 19l3-2M20 19l-3-2",
    flag: "M5 21V4M5 4h12l-2 4 2 4H5",
    pin: "M9 4h6l-1 6 3 3H7l3-3zM12 13v8"
  };
  const NS = "http://www.w3.org/2000/svg";
  const icon = (name) => {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", ICONS[name] || ICONS.chat);
    svg.append(path);
    return svg;
  };
  const fillIcons = (root = document) => {
    root.querySelectorAll("[data-icon]").forEach((el) => { if (!el.firstChild) el.append(icon(el.dataset.icon)); });
  };

  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  const SOON = "Information will be revealed.";

  // ---------- Home ----------
  const realmCard = (r, i) => h("article", { class: "realm" + (r.image_url ? " has-image" : "") },
    r.image_url ? h("div", { class: "realm-media" }, h("img", { src: r.image_url, alt: "", loading: "lazy", decoding: "async" })) : null,
    h("span", { class: "realm-num", "aria-hidden": "true", text: ROMAN[i] || String(i + 1) }),
    h("div", { class: "realm-body" },
      r.subtitle ? h("p", { class: "realm-sub", text: r.subtitle }) : null,
      h("h3", { text: r.name }),
      h("p", { class: "realm-desc", text: r.description || SOON }),
      r.status ? h("p", { class: "realm-status", text: r.status }) : null));

  const renderRanks = (root, ranks) => {
    if (!root || !ranks.length) return;
    const strip = h("div", { class: "rank-strip", role: "tablist", "aria-label": "Hunter ranks, lowest to highest" });
    const panel = h("div", { class: "rank-panel", role: "tabpanel", id: "rank-panel", tabindex: "0" });
    const tabs = ranks.map((r, i) => h("button", {
      type: "button", role: "tab", id: "rank-tab-" + i, class: "rank-tab" + (r.code === "???" ? " is-final" : ""),
      "aria-controls": "rank-panel", "aria-selected": "false", tabindex: "-1", text: r.code
    }));
    const select = (i, focus) => {
      tabs.forEach((t, j) => { t.setAttribute("aria-selected", String(i === j)); t.tabIndex = i === j ? 0 : -1; });
      if (focus) tabs[i].focus();
      const r = ranks[i];
      panel.setAttribute("aria-labelledby", tabs[i].id);
      panel.replaceChildren(
        h("div", { class: "rank-letter" + (r.code === "???" ? " is-final" : ""), "aria-hidden": "true", text: r.code }),
        h("div", { class: "rank-copy" },
          h("p", { class: "eyebrow", text: "Hunter Rank " + (i + 1) + " of " + ranks.length }),
          h("h3", { text: r.name || r.code + " Rank" }),
          r.description ? h("div", { class: "rich" }, rich(r.description)) : h("p", { class: "muted", text: SOON }),
          r.requirements ? h("div", { class: "rank-req" }, h("h4", { text: "Requirements" }), h("div", { class: "rich" }, rich(r.requirements))) : null));
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(i));
      t.addEventListener("keydown", (e) => {
        const k = e.key;
        if (k === "ArrowRight" || k === "ArrowDown") { e.preventDefault(); select((i + 1) % tabs.length, true); }
        else if (k === "ArrowLeft" || k === "ArrowUp") { e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
        else if (k === "Home") { e.preventDefault(); select(0, true); }
        else if (k === "End") { e.preventDefault(); select(tabs.length - 1, true); }
      });
    });
    strip.append(...tabs);
    root.replaceChildren(strip, panel);
    select(0);
  };

  const initHome = async () => {
    const rankRoot = $("[data-ranks]");
    const fallbackRanks = ["E", "D", "C", "B", "A", "S", "???"].map((code) => ({ code }));
    renderRanks(rankRoot, fallbackRanks);

    const [site, realms, ranks] = await Promise.allSettled([api("site"), api("realms"), api("ranks")]);

    if (realms.status === "fulfilled") {
      const list = $("[data-realm-list]");
      if (list) list.replaceChildren(...realms.value.realms.map(realmCard));
    }
    if (ranks.status === "fulfilled" && ranks.value.ranks.length) renderRanks(rankRoot, ranks.value.ranks);

    if (site.status === "fulfilled") {
      const { announcements, sections } = site.value;
      const annSection = $("[data-announcements]");
      if (annSection && announcements.length) {
        $("[data-announcement-list]").replaceChildren(...announcements.map((a) => h("article", { class: "announcement" + (a.pinned ? " is-pinned" : "") },
          h("div", { class: "announcement-meta" }, a.pinned ? h("span", { class: "tag", text: "Pinned" }) : null, timeEl(a.published_at)),
          h("h3", { text: a.title }),
          a.body ? h("div", { class: "rich" }, rich(a.body)) : null,
          a.link_url ? h("a", { class: "inline-link", href: a.link_url, text: "Read more", target: /^https?:/i.test(a.link_url) ? "_blank" : null, rel: /^https?:/i.test(a.link_url) ? "noopener noreferrer" : null }) : null)));
        annSection.hidden = false;
      }
      const holder = $("[data-home-sections]");
      if (holder) {
        holder.replaceChildren(...sections.map((s, i) => h("section", { class: "section" + (i % 2 === 0 ? " section-alt" : "") },
          h("div", { class: "container" },
            h("div", { class: "section-head" }, h("h2", { text: s.title })),
            h("div", { class: "rich" }, rich(s.body))))));
      }
    }
  };

  // ---------- Forums ----------
  const setHead = ({ eyebrow, title, intro, crumbs }) => {
    const eb = $("[data-forum-eyebrow]"), t = $("[data-forum-title]"), i = $("[data-forum-intro]"), c = $("[data-crumbs]");
    if (eb) eb.textContent = eyebrow || "";
    if (t) t.textContent = title;
    if (i) i.textContent = intro || "";
    if (c) {
      if (crumbs && crumbs.length) {
        c.replaceChildren(h("ol", null, crumbs.map(([label, href]) => h("li", null, href ? h("a", { href, text: label }) : h("span", { "aria-current": "page", text: label })))));
        c.hidden = false;
      } else c.hidden = true;
    }
    document.title = title + " | OVERTHRONE SMP";
  };

  const plural = (n, word) => n + " " + word + (n === 1 ? "" : "s");

  const forumIndex = (categories) => {
    const groups = new Map();
    for (const c of categories) {
      if (!groups.has(c.section)) groups.set(c.section, []);
      groups.get(c.section).push(c);
    }
    if (!groups.size) return [h("p", { class: "empty", text: "No forum categories yet." })];
    return [...groups].map(([section, cats]) => h("section", { class: "forum-group" },
      h("h2", { class: "forum-group-head", text: section }),
      h("ul", { class: "forum-rows" }, cats.map((c) => h("li", { class: "forum-row" },
        h("span", { class: "forum-icon" }, icon(c.icon)),
        h("div", { class: "forum-info" },
          h("a", { class: "forum-title", href: "/forums?c=" + encodeURIComponent(c.slug), text: c.name }),
          c.description ? h("p", { text: c.description }) : null),
        h("div", { class: "forum-stat" }, h("strong", { text: String(c.post_count) }), h("span", { text: c.post_count === 1 ? "post" : "posts" })),
        h("div", { class: "forum-latest" }, c.latest
          ? [h("a", { href: "/forums?p=" + c.latest.id, text: c.latest.title }),
             h("span", null, [c.latest.author_name ? "by " + c.latest.author_name : null, c.latest.author_name && c.latest.published_at ? " · " : null, timeEl(c.latest.published_at)])]
          : h("span", { class: "muted", text: "No discussions yet." })))))));
  };

  const initForums = async () => {
    const root = $("[data-forum-root]");
    if (!root) return;
    fillIcons(root);
    const cat = params.get("c"), post = params.get("p");
    const fail = (msg) => root.replaceChildren(h("div", { class: "empty-box" }, h("p", { text: msg }), h("a", { class: "btn btn-ghost", href: "/forums", text: "Back to Forums" })));
    try {
      if (post) {
        if (!/^\d+$/.test(post)) throw Object.assign(new Error(), { status: 404 });
        const { post: p } = await api("posts/" + post);
        setHead({ eyebrow: p.category_name, title: p.title, intro: "", crumbs: [["Forums", "/forums"], [p.category_name, "/forums?c=" + encodeURIComponent(p.category_slug)], [p.title]] });
        root.replaceChildren(h("article", { class: "post" },
          h("header", { class: "post-meta" },
            p.pinned ? h("span", { class: "tag", text: "Pinned" }) : null,
            p.author_name ? h("span", { class: "post-author", text: p.author_name }) : null,
            timeEl(p.published_at),
            p.updated_at && p.published_at && p.updated_at.slice(0, 10) !== p.published_at.slice(0, 10) ? h("span", { class: "muted" }, "Edited ", timeEl(p.updated_at)) : null),
          h("div", { class: "rich post-body" }, rich(p.body)),
          h("footer", { class: "post-foot" }, h("a", { class: "btn btn-ghost btn-sm", href: "/forums?c=" + encodeURIComponent(p.category_slug), text: "Back to " + p.category_name }))));
      } else if (cat) {
        const { category, posts } = await api("forums/" + encodeURIComponent(cat));
        setHead({ eyebrow: category.section, title: category.name, intro: category.description, crumbs: [["Forums", "/forums"], [category.name]] });
        root.replaceChildren(h("section", { class: "forum-group" },
          h("h2", { class: "forum-group-head" }, h("span", { class: "forum-icon forum-icon-sm" }, icon(category.icon)), category.name, h("span", { class: "head-count", text: plural(posts.length, "post") })),
          posts.length
            ? h("ul", { class: "forum-rows" }, posts.map((p) => h("li", { class: "forum-row thread-row" + (p.pinned ? " is-pinned" : "") },
                h("span", { class: "forum-icon" }, icon(p.pinned ? "pin" : category.icon)),
                h("div", { class: "forum-info" },
                  h("a", { class: "forum-title", href: "/forums?p=" + p.id, text: p.title }),
                  h("p", null, p.pinned ? h("span", { class: "tag", text: "Pinned" }) : null, p.author_name ? h("span", { text: "by " + p.author_name + " " }) : null, timeEl(p.published_at))))))
            : h("p", { class: "empty", text: "No discussions yet." })));
      } else {
        const { categories } = await api("forums");
        root.replaceChildren(...forumIndex(categories));
      }
    } catch (err) {
      if (post) { setHead({ eyebrow: "Forums", title: "Discussion not found", crumbs: [["Forums", "/forums"], ["Not found"]] }); fail(err.status === 404 ? "This discussion does not exist or is no longer available." : "The forums could not be loaded. Please try again later."); }
      else if (cat) { setHead({ eyebrow: "Forums", title: "Category not found", crumbs: [["Forums", "/forums"], ["Not found"]] }); fail(err.status === 404 ? "This category does not exist." : "The forums could not be loaded. Please try again later."); }
      // The index keeps its static category list if the API is unavailable.
    }
  };

  // ---------- Tensura Skills ----------
  const SKILL_FIELDS = [
    ["abilities", "Abilities", "list"],
    ["obtaining", "Obtaining", "rich"],
    ["requirements", "Requirements", "rich"],
    ["mastery", "Mastery", "rich"],
    ["cost", "Cost", "rich"]
  ];
  const TYPE_LABEL = { Skill: "Skill", Magic: "Magic", Battlewill: "Battlewill" };

  const initTensura = async () => {
    const list = $("[data-skill-list]");
    if (!list) return;
    const search = $("[data-skill-search]"), catSel = $("[data-skill-category]"), count = $("[data-skill-count]");
    const chips = [...document.querySelectorAll("[data-type]")];
    const state = { type: TYPE_LABEL[params.get("type")] ? params.get("type") : "", q: "", category: "" };
    let skills = [];
    try {
      ({ skills } = await api("skills"));
    } catch {
      list.replaceChildren(h("p", { class: "empty", text: "Skills could not be loaded right now. Please try again later." }));
      return;
    }
    const bySlug = new Map(skills.map((s) => [s.name.toLowerCase(), s.slug]));
    const cats = [...new Set(skills.map((s) => s.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    catSel.append(...cats.map((c) => h("option", { value: c, text: c })));

    const card = (s) => {
      const rows = SKILL_FIELDS.filter(([k]) => s[k] && s[k].trim()).map(([k, label, kind]) =>
        h("div", { class: "skill-field" }, h("h4", { text: label }),
          kind === "list"
            ? h("ul", null, s[k].split("\n").map((l) => l.replace(/^[-*•]\s*/, "").trim()).filter(Boolean).map((l) => h("li", null, inline(l))))
            : h("div", { class: "rich" }, rich(s[k]))));
      const related = (s.related || "").split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
      if (related.length) {
        rows.push(h("div", { class: "skill-field" }, h("h4", { text: "Related" }),
          h("ul", { class: "related" }, related.map((name) => {
            const slug = bySlug.get(name.toLowerCase());
            return h("li", null, slug ? h("a", { class: "inline-link", href: "/tensura?skill=" + encodeURIComponent(slug), "data-skill-link": slug, text: name }) : name);
          }))));
      }
      return h("details", { class: "skill", id: "skill-" + s.slug, "data-slug": s.slug },
        h("summary", null,
          h("span", { class: "skill-name", text: s.name }),
          h("span", { class: "skill-badges" },
            h("span", { class: "tag tag-type", text: s.skill_type }),
            s.category ? h("span", { class: "tag", text: s.category }) : null,
            s.activation ? h("span", { class: "tag tag-quiet", text: s.activation }) : null)),
        h("div", { class: "skill-body" },
          s.description ? h("div", { class: "rich" }, rich(s.description)) : null,
          rows.length ? h("div", { class: "skill-fields" }, rows) : null,
          s.source_url ? h("p", { class: "skill-source" }, "Source: ", h("a", { class: "inline-link", href: s.source_url, target: "_blank", rel: "noopener noreferrer", text: new URL(s.source_url).hostname })) : null));
    };

    const render = () => {
      const q = state.q.trim().toLowerCase();
      const shown = skills.filter((s) =>
        (!state.type || s.skill_type === state.type) &&
        (!state.category || s.category === state.category) &&
        (!q || [s.name, s.category, s.description, s.abilities].join(" ").toLowerCase().includes(q)));
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.type === state.type)));
      if (!skills.length) {
        count.textContent = "";
        list.replaceChildren(h("div", { class: "empty-box" },
          h("p", { text: "No skills have been published yet." }),
          h("p", { class: "muted", text: "Entries are added from the official Tensura: Reincarnated documentation." })));
        return;
      }
      count.textContent = shown.length + (shown.length === 1 ? " entry" : " entries");
      list.replaceChildren(...(shown.length ? shown.map(card) : [h("p", { class: "empty", text: "No skills match your filters." })]));
    };

    const open = (slug) => {
      const el = document.getElementById("skill-" + slug);
      if (!el) return;
      el.open = true;
      el.scrollIntoView({ block: "start" });
      el.querySelector("summary").focus({ preventScroll: true });
    };

    chips.forEach((c) => c.addEventListener("click", () => { state.type = c.dataset.type; render(); }));
    search.addEventListener("input", () => { state.q = search.value; render(); });
    catSel.addEventListener("change", () => { state.category = catSel.value; render(); });
    list.addEventListener("click", (e) => {
      const a = e.target.closest("[data-skill-link]");
      if (!a) return;
      e.preventDefault();
      state.type = ""; state.category = ""; state.q = "";
      search.value = ""; catSel.value = "";
      render();
      open(a.dataset.skillLink);
      history.replaceState(null, "", a.href);
    });
    render();
    if (params.get("skill")) open(params.get("skill"));
  };

  fillIcons();
  if (page === "home") initHome();
  else if (page === "forums") initForums();
  else if (page === "tensura") initTensura();
})();
