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
    <p><a class="btn btn-primary" href="https://discord.gg/overthonesmp" data-discord target="_blank" rel="noopener noreferrer">Join the Discord</a> <a class="btn btn-ghost" href="/vote">Vote for the server</a></p>
  </div>
</div>
</main>`
});

// ---------------------------------------------------------------- /vote
const slots = VOTE_SLOTS.map((n) => `
      <a class="vote-card" data-vote="${n}" href="/vote" target="_blank" rel="noopener noreferrer" hidden>
        <span class="vote-card-num">Site ${n}</span>
        <strong class="vote-card-name" data-vote-name="${n}">Vote site ${n}</strong>
        <span class="vote-card-go">Vote now <span aria-hidden="true">→</span></span>
      </a>`).join("");

page({
  slug: "vote",
  title: "Vote",
  description: "Vote for OVERTHRONE SMP every day to help new players find the server and earn voting rewards.",
  main: `<main id="main">
<div class="page-head">
  ${embers}
  <div class="container">
    <p class="eyebrow">OVERTHRONE SMP</p>
    <h1>Vote</h1>
    <p>Vote for OVERTHRONE SMP every day. Each vote pushes us up the server lists and helps new players find the realm.</p>
  </div>
</div>
<div class="container vote-page">
  <section aria-labelledby="vote-sites-title">
    <div class="section-head"><p class="eyebrow">Daily</p><h2 id="vote-sites-title">Vote Sites</h2><p>You can vote once on every site each day.</p></div>
    <div class="vote-grid">${slots}
    </div>
    <div class="empty-box" data-vote-empty><p>Vote links are coming soon.</p><p class="muted">Join the Discord to hear when voting opens.</p></div>
  </section>
  <div class="vote-info">
    <section class="vote-panel" aria-labelledby="vote-rewards-title">
      <h2 id="vote-rewards-title">Rewards</h2>
      <p data-setting="vote_rewards">Voting rewards are coming soon.</p>
    </section>
    <section class="vote-panel" aria-labelledby="vote-how-title">
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
