// Builds the OVERTHRONE rank comparison from ranks-data.mjs:
//   public/ranks.html                          website page (overthronesmp.net/ranks)
//   tebex-storefront/ranks/tebex-comparison.html  inline-styled snippet for a Tebex text/HTML block
//   tebex-storefront/ranks/rank-comparison.png    image of the table for a Tebex image block
//
//   node tebex-storefront/ranks/build-ranks.mjs           (pages only)
//   node tebex-storefront/ranks/build-ranks.mjs --png     (also renders the PNG from wrangler dev; needs Playwright)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { RANKS, SECTIONS, COMMANDS, commandValues } from "./ranks-data.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const isNo = (v) => v === false || v === 0 || v === null;
const TITLE = "RANK COMPARISON";
const SUB = "Compare the perks and privileges included with each OVERTHRONE donor rank.";

// ---------------------------------------------------------------- website table (classes, styled by styles.css)
function cellHtml(v, rank, prefix) {
  if (v === true) return `<span class="ck" role="img" aria-label="Included">✓</span>`;
  if (isNo(v)) return `<span class="cx" role="img" aria-label="Not included">✕</span>`;
  return prefix ? `<span class="cp rk-${rank.key}">${esc(v)}</span>` : `<span class="cv">${esc(v)}</span>`;
}
const head = `<thead><tr><th scope="col" class="cf">Feature</th>${RANKS.map((r, i) =>
  `<th scope="col" class="cr rk-${r.key}"><span class="cr-tier">Tier ${i + 1}</span><span class="cr-name">${r.name}</span></th>`).join("")}</tr></thead>`;
const sectionRow = (title) => `<tr class="cs"><th colspan="${RANKS.length + 1}" scope="colgroup"><span>${esc(title)}</span></th></tr>`;
const featureRows = SECTIONS.map((s) => sectionRow(s.title) + s.rows.map((row) =>
  `<tr><th scope="row" class="cf">${esc(row.label)}${row.note ? `<small>${esc(row.note)}</small>` : ""}</th>${row.values.map((v, i) => `<td>${cellHtml(v, RANKS[i], row.prefix)}</td>`).join("")}</tr>`).join("")).join("");
const commandRows = COMMANDS.map((g) => sectionRow(g.title) + g.rows.map(([c, rank]) =>
  `<tr><th scope="row" class="cf"><code>${esc(c)}</code></th>${commandValues(rank).map((v) => `<td>${cellHtml(v)}</td>`).join("")}</tr>`).join("")).join("");
const table = `<table class="compare-table"><caption class="sr-only">${TITLE}: features and commands for each rank</caption>${head}<tbody>${featureRows}${commandRows}</tbody></table>`;

const tiles = RANKS.map((r, i) => `
      <article class="rank-tile rk-${r.key}">
        <p class="rank-tile-tier">Tier ${i + 1}${i === RANKS.length - 1 ? " · Highest rank" : ""}</p>
        <h2>[${r.name.toUpperCase()}]</h2>
        <a class="btn btn-primary btn-sm" href="/store">View in Store</a>
      </article>`).join("");

const main = `<main id="main">
<div class="page-head">
  <div class="embers embers-low" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
  <div class="container">
    <p class="eyebrow">OVERTHRONE SMP</p>
    <h1>Ranks</h1>
    <p>Lifetime donor ranks, from Ronin to Overlord. Every rank includes everything from the ranks below it.</p>
  </div>
</div>
<div class="container ranks-page">
  <div class="rank-tiles">${tiles}
  </div>
  <section class="compare" aria-labelledby="compare-title">
    <div class="section-head"><p class="eyebrow">Ronin → Overlord</p><h2 id="compare-title">Rank Comparison</h2><p>${SUB}</p></div>
    <div class="compare-legend"><span><span class="ck">✓</span> Included</span><span><span class="cx">✕</span> Not included</span><span>Numbers show limits for that rank</span></div>
    <div class="compare-wrap" role="region" aria-labelledby="compare-title" tabindex="0">
      ${table}
    </div>
    <p class="compare-note">Higher ranks inherit every perk and command of the ranks below them. Swipe sideways on phones to see every rank.</p>
  </section>
</div>
</main>`;

// Reuse the store page's head, header and footer so the page matches the site.
const store = fs.readFileSync(path.join(root, "public/store.html"), "utf8");
let page = store.slice(0, store.indexOf("<main id=\"main\">")) + main + store.slice(store.indexOf("</main>") + "</main>".length);
page = page
  .replace(/<title>[^<]*<\/title>/, "<title>Ranks | OVERTHRONE SMP</title>")
  .replace(/(<meta name="description" content=")[^"]*/, "$1Compare OVERTHRONE SMP donor ranks: Ronin, Valkyrie, Monarch, Godborn and Overlord – perks, limits and commands.")
  .replaceAll("https://overthronesmp.net/store", "https://overthronesmp.net/ranks")
  .replaceAll("Store | OVERTHRONE SMP", "Ranks | OVERTHRONE SMP")
  .replace(/(<meta property="og:description" content=")[^"]*/, "$1Compare every OVERTHRONE donor rank.")
  .replace(/(<meta name="twitter:description" content=")[^"]*/, "$1Compare every OVERTHRONE donor rank.")
  .replace('data-page="store"', 'data-page="ranks"')
  .replace('<li><a href="/store" aria-current="page">Store</a></li>', '<li><a href="/store">Store</a></li>');
fs.writeFileSync(path.join(root, "public/ranks.html"), page);
console.log("wrote public/ranks.html");

// ---------------------------------------------------------------- Tebex snippet (inline styles only)
const C = { bg: "#0b0809", panel: "#110c0d", line: "#2a2224", text: "#efebe4", muted: "#a39d94", yes: "#3ddc84", no: "#e8546a", sec: "#1a1214" };
const td = `padding:9px 10px;border-bottom:1px solid ${C.line};text-align:center;font-size:14px;color:${C.text}`;
const thf = `padding:9px 12px;border-bottom:1px solid ${C.line};text-align:left;font-size:14px;font-weight:600;color:${C.text};white-space:nowrap`;
const tCell = (v, r, prefix) => isNo(v) ? `<span style="color:${C.no};font-weight:700">✕</span>` : v === true ? `<span style="color:${C.yes};font-weight:700">✓</span>`
  : prefix ? `<span style="color:${r.color};font-weight:700">${esc(v)}</span>` : esc(v);
const tSec = (t) => `<tr><td colspan="${RANKS.length + 1}" style="padding:10px 12px;background:${C.sec};color:#e8546a;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;border-bottom:1px solid ${C.line}">${esc(t)}</td></tr>`;
const snippet = `<div style="background:${C.bg};border:1px solid ${C.line};padding:20px 0 8px;color:${C.text};font-family:Inter,Arial,sans-serif">
<h2 style="margin:0 16px 4px;text-align:center;letter-spacing:.12em;color:#fff">${TITLE}</h2>
<p style="margin:0 16px 16px;text-align:center;color:${C.muted};font-size:14px">${SUB}</p>
<div style="overflow-x:auto">
<table style="width:100%;min-width:720px;border-collapse:collapse;background:${C.panel}">
<thead><tr><th style="${thf};color:${C.muted};font-size:12px;letter-spacing:.16em">FEATURE</th>${RANKS.map((r) => `<th style="${td};color:${r.color};font-size:15px;letter-spacing:.08em;border-bottom:2px solid ${r.color}">${r.name.toUpperCase()}</th>`).join("")}</tr></thead>
<tbody>
${SECTIONS.map((s) => tSec(s.title) + s.rows.map((row) => `<tr><td style="${thf}">${esc(row.label)}</td>${row.values.map((v, i) => `<td style="${td}">${tCell(v, RANKS[i], row.prefix)}</td>`).join("")}</tr>`).join("\n")).join("\n")}
${COMMANDS.map((g) => tSec(g.title) + g.rows.map(([c, rank]) => `<tr><td style="${thf};font-family:monospace">${esc(c)}</td>${commandValues(rank).map((v) => `<td style="${td}">${tCell(v)}</td>`).join("")}</tr>`).join("\n")).join("\n")}
</tbody></table></div>
<p style="margin:12px 16px 8px;text-align:center;color:${C.muted};font-size:13px">Every rank includes all perks and commands of the ranks below it.</p>
</div>`;
fs.writeFileSync(path.join(here, "tebex-comparison.html"), snippet);
console.log("wrote tebex-storefront/ranks/tebex-comparison.html");

// ---------------------------------------------------------------- PNG (for a Tebex image block)
// Screenshots the live page so fonts and styles match exactly. Start `npx wrangler dev` first,
// or pass another URL: --png=https://overthronesmp.net/ranks
const pngArg = process.argv.find((a) => a.startsWith("--png"));
if (pngArg) {
  const url = pngArg.includes("=") ? pngArg.split("=")[1] : "http://127.0.0.1:8787/ranks";
  const require = createRequire(import.meta.url);
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(url, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.locator(".compare").screenshot({ path: path.join(here, "rank-comparison.png") });
  await browser.close();
  console.log("wrote tebex-storefront/ranks/rank-comparison.png");
}
