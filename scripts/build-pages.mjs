// Builds the static Rules and Vote pages, and the migration that pins the rules in the forums.
//   node scripts/build-pages.mjs
//
// Outputs:
//   public/rules.html                         /rules
//   public/vote.html                          /vote (vote links come from Admin → Site Settings → Voting)
//   migrations/0003_rules_forum_post.sql      pinned "Official Server Rules" post in Forums → Rules
//   public/guide.html                         /guide (Player Guide, from scripts/guide-data.mjs)
//   migrations/0006_guides_and_forums.sql     guide posts + missing categories in the forums, RPG world realm
//   migrations/0007_races_forum.sql           Races category + the pinned Races & Evolution post
//
// Both pages reuse the store page's head, header and footer so they match the site.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RULES_UPDATED, RULES_INTRO, RULE_SECTIONS } from "./rules-data.mjs";
import { VOTE_SLOTS } from "./vote-data.mjs";
import { GUIDE_UPDATED, GUIDE_INTRO, SECTIONS, FORUM_POSTS, NEW_CATEGORIES, CATEGORY_WELCOMES, RACES_CATEGORY, RACES_POST } from "./guide-data.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const bold = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
const embers = `<div class="embers embers-low" aria-hidden="true">${"<span></span>".repeat(10)}</div>`;
const updated = new Date(RULES_UPDATED + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const store = fs.readFileSync(path.join(root, "public/store.html"), "utf8");

function page({ slug, title, description, main }) {
  let html = store.slice(0, store.indexOf('<main id="main">')) + main + store.slice(store.indexOf("</main>") + "</main>".length);
  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${title} | OVERTHRONE SMP</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, "$1" + esc(description))
    .replace(/(<meta property="og:description" content=")[^"]*/, "$1" + esc(description))
    .replace(/(<meta name="twitter:description" content=")[^"]*/, "$1" + esc(description))
    .replaceAll("https://overthronesmp.net/store", "https://overthronesmp.net/" + slug)
    .replaceAll("Store | OVERTHRONE SMP", `${title} | OVERTHRONE SMP`)
    .replace('data-page="store"', `data-page="${slug}"`)
    .replace('<li><a href="/store" aria-current="page">Store</a></li>', '<li><a href="/store">Store</a></li>');
  html = html.replace(`<li><a href="/${slug}">`, `<li><a href="/${slug}" aria-current="page">`);
  fs.writeFileSync(path.join(root, "public", slug + ".html"), html);
  console.log("wrote public/" + slug + ".html");
}

// ---------------------------------------------------------------- /rules
const toc = RULE_SECTIONS.map((s, i) => `<li><a href="#${s.id}"><span>${i + 1}</span>${esc(s.title)}</a></li>`).join("");
const sections = RULE_SECTIONS.map((s, i) => `
    <section class="rule-section" id="${s.id}" aria-labelledby="${s.id}-title">
      <h2 id="${s.id}-title"><span class="rule-num">${i + 1}</span>${esc(s.title)}</h2>
      <p class="rule-intro">${esc(s.intro)}</p>
      <ol class="rule-list">${s.rules.map((r, j) => `<li><span class="rule-code">${i + 1}.${j + 1}</span><p>${bold(r)}</p></li>`).join("")}</ol>
    </section>`).join("");

page({
  slug: "rules",
  title: "Rules",
  description: "The official OVERTHRONE SMP rules for the Minecraft server, Discord, forums and store.",
  main: `<main id="main">
<div class="page-head">
  ${embers}
  <div class="container">
    <p class="eyebrow">OVERTHRONE SMP</p>
    <h1>Rules</h1>
    <p>Last updated ${updated}. Read them before you play.</p>
  </div>
</div>
<div class="container rules-page">
  <div class="rules-intro">${RULES_INTRO.map((p) => `<p>${bold(p)}</p>`).join("")}</div>
  <nav class="rules-toc" aria-label="Rule sections"><ol>${toc}</ol></nav>
  <div class="rules-body">${sections}
  </div>
  <div class="rules-help">
    <h2>Need help or want to report someone?</h2>
    <p>Open a ticket in our Discord, or post with proof in <a class="inline-link" href="/forums?c=player-reports">Player Reports</a>.</p>
    <p><a class="btn btn-primary" href="https://discord.gg/overthronesmp" data-discord target="_blank" rel="noopener noreferrer">Join the Discord</a> <a class="btn btn-ghost" href="/vote">Vote for the server</a></p>
  </div>
</div>
</main>`
});

// ---------------------------------------------------------------- /vote
const slots = VOTE_SLOTS.map((n) => `
      <a class="vote-card" data-vote="${n}" data-vote-slot="${n}" href="/vote" target="_blank" rel="noopener noreferrer" hidden>
        <span class="vote-card-num" aria-hidden="true">${String(n).padStart(2, "0")}</span>
        <span class="vote-card-body">
          <strong class="vote-card-name" data-vote-name="${n}">Vote site ${n}</strong>
          <span class="vote-card-host" data-vote-host="${n}"></span>
        </span>
        <span class="vote-card-btn"><span class="vote-card-label">Vote</span><span class="vote-card-done">Voted today ✓</span></span>
      </a>`).join("");

page({
  slug: "vote",
  title: "Vote",
  description: "Vote for OVERTHRONE SMP every day to help new players find the server and earn voting rewards.",
  main: `<main id="main">
<section class="vote-hero">
  ${embers}
  <div class="container vote-hero-inner">
    <div class="vote-hero-text">
      <p class="eyebrow">Support the realm</p>
      <h1>Vote for OVERTHRONE</h1>
      <p>Every vote pushes OVERTHRONE SMP up the server lists and brings new Hunters into the realm. Vote on every site, every day.</p>
      <div class="vote-hero-stats" data-vote-progress hidden>
        <span class="vote-stat"><strong data-vote-done>0</strong> / <strong data-vote-total>0</strong> voted today</span>
        <span class="vote-meter" aria-hidden="true"><span data-vote-meter></span></span>
      </div>
    </div>
    <figure class="vote-banner">
      <video poster="/images/vote-banner-poster.webp" autoplay muted loop playsinline preload="auto" width="936" height="120" aria-label="OVERTHRONE SMP animated banner"><source src="/images/vote-banner.webm" type="video/webm"><source src="/images/vote-banner.mp4" type="video/mp4"></video>
    </figure>
  </div>
</section>
<div class="container vote-page">
  <section aria-labelledby="vote-sites-title">
    <div class="vote-sites-head">
      <h2 id="vote-sites-title">Vote Sites</h2>
      <p>Click a site, enter your <strong>exact Minecraft username</strong>, and vote. Votes reset every 24 hours.</p>
    </div>
    <div class="vote-list">${slots}
    </div>
    <div class="empty-box" data-vote-empty><p>Vote links are coming soon.</p><p class="muted">Join the Discord to hear when voting opens.</p></div>
  </section>
  <div class="vote-info">
    <section class="vote-panel vote-panel-rewards" aria-labelledby="vote-rewards-title">
      <p class="eyebrow">Rewards</p>
      <h2 id="vote-rewards-title">Vote Rewards</h2>
      <p data-setting="vote_rewards">Every vote rewards you with 1x Vote Key and $50,000 in-game balance.</p>
    </section>
    <section class="vote-panel" aria-labelledby="vote-how-title">
      <p class="eyebrow">Guide</p>
      <h2 id="vote-how-title">How to vote</h2>
      <ol class="vote-steps">
        <li>Pick a vote site above. It opens in a new tab.</li>
        <li>Enter your <strong>exact Minecraft username</strong>.</li>
        <li>Complete the captcha and press vote.</li>
        <li>Be online on the server to receive your reward.</li>
        <li>Come back tomorrow and vote again.</li>
      </ol>
    </section>
  </div>
</div>
</main>`
});

// ---------------------------------------------------------------- pinned forum post
const body = [
  ...RULES_INTRO.map((p) => p + "\n"),
  "[Open the full rules page](/rules)\n",
  ...RULE_SECTIONS.map((s, i) => `## ${i + 1}. ${s.title}\n${s.intro}\n\n${s.rules.map((r, j) => `- ${i + 1}.${j + 1} ${r}`).join("\n")}\n`),
  `Last updated ${updated}.`
].join("\n");
const sq = (s) => "'" + s.replace(/'/g, "''") + "'";
const sql = `-- Pins the official rules in Forums → Rules. Generated by scripts/build-pages.mjs from scripts/rules-data.mjs.
-- Only inserts if the post does not exist yet, so edits made in /admin are never overwritten.
INSERT INTO forum_posts (category_id, title, body, author_name, pinned, published, published_at)
SELECT id, 'Official Server Rules', ${sq(body)}, 'OVERTHRONE Staff', 1, 1, strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
FROM forum_categories
WHERE slug = 'rules'
  AND NOT EXISTS (SELECT 1 FROM forum_posts WHERE title = 'Official Server Rules');
`;
fs.writeFileSync(path.join(root, "migrations/0003_rules_forum_post.sql"), sql);
console.log("wrote migrations/0003_rules_forum_post.sql");

// ---------------------------------------------------------------- /guide
// **bold** and [text](/link or https://...) on top of HTML escaping.
const fmt = (s) => esc(s)
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g, (_, t, u) =>
    /^https?:/.test(u) ? `<a class="inline-link" href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>` : `<a class="inline-link" href="${u}">${t}</a>`);
const kbd = (k) => k === "Unbound" ? '<span class="g-unbound">Not set</span>'
  : k.split(/\s([+/])\s/).map((part, i) => (i % 2 ? `<span class="g-kbd-sep">${part}</span>` : `<kbd>${esc(part)}</kbd>`)).join("");
const guideUpdated = new Date(GUIDE_UPDATED + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const DISCORD = "https://discord.gg/overthronesmp";

const blockHtml = (b) => {
  if (b.p) return `<p>${fmt(b.p)}</p>`;
  if (b.steps) return `<ol class="g-steps">${b.steps.map((st, i) => `<li><span class="g-step-num">${String(i + 1).padStart(2, "0")}</span><div><h3>${esc(st.t)}</h3><p>${fmt(st.d)}</p>${
    st.modpack ? `<p class="g-step-actions"><a class="btn btn-sm btn-primary" data-modpack href="${DISCORD}" target="_blank" rel="noopener noreferrer" hidden>Download the modpack</a><a class="btn btn-sm btn-ghost" href="${DISCORD}" data-discord data-modpack-fallback target="_blank" rel="noopener noreferrer">Get it in Discord</a></p>` : ""}${
    st.copy ? `<p class="g-step-actions"><button class="btn btn-sm btn-ghost" type="button" data-copy-ip><span data-label>Copy address</span></button></p>` : ""}</div></li>`).join("")}</ol>`;
  if (b.keys) return `<div class="g-keys"><h3>${esc(b.keys.title)}</h3><table class="g-table"><tbody>${b.keys.rows.map(([k, d]) => `<tr><th scope="row">${kbd(k)}</th><td>${fmt(d)}</td></tr>`).join("")}</tbody></table></div>`;
  if (b.table) {
    const keyed = b.table.head[0] === "Key";
    return `<div class="g-table-wrap"><table class="g-table g-grid"><thead><tr>${b.table.head.map((x) => `<th scope="col">${esc(x)}</th>`).join("")}</tr></thead><tbody>${
      b.table.rows.map((r) => `<tr>${r.map((c, i) => i === 0 ? `<th scope="row">${keyed ? kbd(c) : esc(c)}</th>` : `<td>${keyed && i === 3 && !/^Unbind/.test(c) ? kbd(c.replace(/ or .*/, "")) + esc(c.replace(/^[^ ]+( or .*)?$/, "$1")) : fmt(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  if (b.list) return `<ul class="g-list">${b.list.map((x) => `<li>${fmt(x)}</li>`).join("")}</ul>`;
  if (b.callout) return `<div class="g-callout g-callout-${b.callout.kind}"><span class="g-callout-label">${b.callout.kind === "warn" ? "Warning" : "Tip"}</span><p>${fmt(b.callout.text)}</p></div>`;
  if (b.chips) return `<ul class="g-chips">${b.chips.map((c) => `<li><code>${esc(c.t)}</code><span>${esc(c.d)}</span></li>`).join("")}</ul>`;
  if (b.coins) return `<ol class="g-coins" aria-label="Coin values, lowest to highest">${b.coins.map((c, i) => `<li><span class="g-coin g-coin-${c.toLowerCase()}" aria-hidden="true"></span><strong>${esc(c)}</strong>${i ? `<small>= 10 ${esc(b.coins[i - 1])}</small>` : "<small>Base coin</small>"}</li>`).join("")}</ol>`;
  if (b.cards) return `<div class="g-cards">${b.cards.map((c) => `<article class="g-card"><span class="g-card-kicker">${esc(c.k)}</span><h3>${esc(c.t)}</h3><p>${fmt(c.d)}</p></article>`).join("")}</div>`;
  if (b.mods) return `<div class="g-mods">${b.mods.map((g) => `<div class="g-mod-group"><h3>${esc(g.group)}</h3><ul>${g.items.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></div>`).join("")}</div>`;
  if (b.faq) return `<div class="g-faq">${b.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${fmt(f.a)}</p></details>`).join("")}</div>`;
  throw new Error("Unknown guide block: " + JSON.stringify(b).slice(0, 80));
};

const guideToc = SECTIONS.map((s, i) => `<li><a href="#${s.id}"><span>${String(i + 1).padStart(2, "0")}</span>${esc(s.title)}</a></li>`).join("");
const guideSections = SECTIONS.map((s, i) => `
    <section class="g-section" id="${s.id}" aria-labelledby="${s.id}-title">
      <h2 id="${s.id}-title"><span class="rule-num">${i + 1}</span>${esc(s.title)}</h2>
      <p class="g-intro">${fmt(s.intro)}</p>
      ${s.blocks.map(blockHtml).join("\n      ")}
    </section>`).join("");

page({
  slug: "guide",
  title: "Player Guide",
  description: "How to join OVERTHRONE SMP: modpack install, keybinds and key conflict fixes, quests, coins, warps, bosses and the full mod list.",
  main: `<main id="main">
<div class="page-head">
  ${embers}
  <div class="container">
    <p class="eyebrow">OVERTHRONE SMP</p>
    <h1>Player Guide</h1>
    <p>${esc(GUIDE_INTRO)}</p>
    <p class="g-updated">Updated ${guideUpdated}</p>
  </div>
</div>
<div class="container guide-page">
  <nav class="guide-toc" aria-label="Guide sections"><p class="guide-toc-title">On this page</p><ol>${guideToc}</ol></nav>
  <div class="guide-body">${guideSections}
    <div class="rules-help">
      <h2>Still stuck?</h2>
      <p>Open a General Support ticket in our Discord and staff will help you out.</p>
      <p><a class="btn btn-primary" href="${DISCORD}" data-discord target="_blank" rel="noopener noreferrer">Join the Discord</a> <a class="btn btn-ghost" href="/forums?c=guides">Guides in the forums</a></p>
    </div>
  </div>
</div>
</main>`
});

// ---------------------------------------------------------------- guide posts in the forums
const blockText = (b) => {
  if (b.p) return b.p;
  if (b.steps) return b.steps.map((st, i) => `- **${i + 1}. ${st.t}** ${st.d}`).join("\n");
  if (b.keys) return `**${b.keys.title}**\n` + b.keys.rows.map(([k, d]) => `- **${k === "Unbound" ? "Not set" : k}**: ${d}`).join("\n");
  if (b.table) {
    if (b.table.head[0] === "Key") return b.table.rows.map((r) => {
      const shared = r[1].startsWith("(") ? "" : ` (shared by ${r[1]})`;
      const fix = /^Unbind it/.test(r[3]) ? `unbind **${r[2]}** ${r[3].replace(/^Unbind it\s*/, "")}` : `change **${r[2]}** to **${r[3]}**`;
      return `- **${r[0]}**: ${fix.trim()}${shared}`;
    }).join("\n");
    return `**${b.table.head.join(" · ")}**\n` + b.table.rows.map((r) => `- **${r[0]}**: ${r.slice(1).join(" · ")}`).join("\n");
  }
  if (b.list) return b.list.map((x) => `- ${x}`).join("\n");
  if (b.callout) return b.callout.text;
  if (b.chips) return b.chips.map((c) => `- **${c.t}**: ${c.d}`).join("\n");
  if (b.coins) return "**Coins, lowest to highest:** " + b.coins.join(" → ");
  if (b.cards) return b.cards.map((c) => `- **${c.t}** (${c.k}): ${c.d}`).join("\n");
  if (b.mods) return b.mods.map((g) => `**${g.group}:** ${g.items.join(", ")}`).join("\n\n");
  if (b.faq) return b.faq.map((f) => `**${f.q}**\n${f.a}`).join("\n\n");
  return "";
};
const sectionText = (s) => `## ${s.title}\n${s.intro}\n\n${s.blocks.map(blockText).join("\n\n")}`;
const byId = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));
const postSql = (category, title, body, pinned) => `INSERT INTO forum_posts (category_id, title, body, author_name, pinned, published, published_at)
SELECT id, ${sq(title)}, ${sq(body)}, 'OVERTHRONE Staff', ${pinned ? 1 : 0}, 1, strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
FROM forum_categories
WHERE slug = ${sq(category)}
  AND NOT EXISTS (SELECT 1 FROM forum_posts WHERE title = ${sq(title)});`;

const guideSql = [
  "-- Player Guide posts, missing forum categories and the RPG world realm.",
  "-- Generated by scripts/build-pages.mjs from scripts/guide-data.mjs. Every statement only adds",
  "-- what is missing (or replaces untouched seed text), so edits made in /admin are never overwritten.",
  "",
  ...NEW_CATEGORIES.map((c) => `INSERT OR IGNORE INTO forum_categories (section, name, slug, description, icon, sort_order) VALUES (${sq(c.section)}, ${sq(c.name)}, ${sq(c.slug)}, ${sq(c.description)}, ${sq(c.icon)}, ${c.sort_order});`),
  "",
  ...FORUM_POSTS.map((fp) => postSql(fp.category, fp.title,
    fp.sections.map((id) => sectionText(byId[id])).join("\n\n") + `\n\n[Open the full Player Guide](/guide#${fp.sections[0]})`, fp.pinned)),
  "",
  ...CATEGORY_WELCOMES.map((w) => postSql(w.category, w.title, w.body, true)),
  "",
  "INSERT OR IGNORE INTO realms (name, slug, subtitle, description, status, sort_order) VALUES",
  "  ('THE RPG WORLD', 'rpg-world', 'Quests & Trade', 'A protected city of quests, trade and magic: Questmaster Orin and the Quest Board, the Arcade & Trade Hall and the Arcanum.', '', 15);",
  "UPDATE site_settings SET value = 'Seven realms, each with its own role.' WHERE key = 'realms_intro' AND value = 'Six realms, each with its own role.';",
  "",
  `UPDATE home_sections SET body = ${sq("OVERTHRONE SMP is a modded dark-fantasy MMORPG server: Tensura: Reincarnated, Epic Fight combat, over 1,100 quests, bosses and a coin economy you grind for in game.\n\nNew here? The [Player Guide](/guide) walks you through installing the modpack, the keybinds and your first hour.")}, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`,
  "WHERE title = 'Getting Started' AND instr(body, 'is currently under development.') > 0;",
  ""
].join("\n");
fs.writeFileSync(path.join(root, "migrations/0006_guides_and_forums.sql"), guideSql);
console.log("wrote migrations/0006_guides_and_forums.sql");

// ---------------------------------------------------------------- races in the forums
const c = RACES_CATEGORY;
const racesSql = [
  "-- Races category and the pinned Races & Evolution post in the forums.",
  "-- Generated by scripts/build-pages.mjs from scripts/guide-data.mjs (section \"races\"). Only adds what is missing.",
  "",
  `INSERT OR IGNORE INTO forum_categories (section, name, slug, description, icon, sort_order) VALUES (${sq(c.section)}, ${sq(c.name)}, ${sq(c.slug)}, ${sq(c.description)}, ${sq(c.icon)}, ${c.sort_order});`,
  "",
  postSql(RACES_POST.category, RACES_POST.title,
    RACES_POST.sections.map((id) => sectionText(byId[id])).join("\n\n") + `\n\n[Open the Races section of the Player Guide](/guide#${RACES_POST.sections[0]})`, RACES_POST.pinned),
  ""
].join("\n");
fs.writeFileSync(path.join(root, "migrations/0007_races_forum.sql"), racesSql);
console.log("wrote migrations/0007_races_forum.sql");
