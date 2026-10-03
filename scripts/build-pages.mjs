// Builds the static Rules and Vote pages, and the migration that pins the rules in the forums.
//   node scripts/build-pages.mjs
//
// Outputs:
//   public/rules.html                         /rules
//   public/vote.html                          /vote (vote links come from Admin → Site Settings → Voting)
//   migrations/0003_rules_forum_post.sql      pinned "Official Server Rules" post in Forums → Rules
//
// Both pages reuse the store page's head, header and footer so they match the site.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RULES_UPDATED, RULES_INTRO, RULE_SECTIONS } from "./rules-data.mjs";
import { VOTE_SLOTS } from "./vote-data.mjs";

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
  if (slug === "vote") html = html.replace('<li><a href="/vote">Vote</a></li>', '<li><a href="/vote" aria-current="page">Vote</a></li>');
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
      <p data-setting="vote_rewards">Voting rewards are coming soon.</p>
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
