// Compact Tebex "Custom HTML" block for the rank comparison (one <style> + class names).
//   node tebex-storefront/ranks/build-tebex-compact.mjs  ->  tebex-custom-html.html
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RANKS, SECTIONS, COMMANDS, commandValues } from "./ranks-data.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const isNo = (v) => v === false || v === 0 || v === null;
const cell = (v, r, prefix) => isNo(v) ? `<td class="n">✕</td>` : v === true ? `<td class="y">✓</td>`
  : prefix ? `<td class="${r.key}">${esc(v)}</td>` : `<td>${esc(v)}</td>`;
const sec = (t) => `<tr class="s"><td colspan="6">${esc(t)}</td></tr>`;
const rows = SECTIONS.map((s) => sec(s.title) + s.rows.map((row) => `<tr><th>${esc(row.label)}</th>${row.values.map((v, i) => cell(v, RANKS[i], row.prefix)).join("")}</tr>`).join("")).join("")
  + COMMANDS.map((g) => sec(g.title) + g.rows.map(([c, rank]) => `<tr><th><code>${esc(c)}</code></th>${commandValues(rank).map((v) => cell(v)).join("")}</tr>`).join("")).join("");
const css = `.otc{background:#0b0809;border:1px solid #2a2224;padding:24px 0 10px;color:#efebe4;font-family:Inter,Arial,sans-serif;margin:24px 0}
.otc h2{margin:0 16px 6px;text-align:center;letter-spacing:.12em;color:#fff;font-size:28px}
.otc p{margin:0 16px 16px;text-align:center;color:#a39d94;font-size:14px}
.otc .w{overflow-x:auto;-webkit-overflow-scrolling:touch}
.otc table{width:100%;min-width:720px;border-collapse:collapse;background:#110c0d}
.otc th,.otc td{padding:9px 10px;border-bottom:1px solid #2a2224;text-align:center;font-size:14px;color:#efebe4}
.otc tbody th{text-align:left;font-weight:600;white-space:nowrap;position:sticky;left:0;background:#110c0d}
.otc thead th{font-size:15px;letter-spacing:.08em;font-weight:700}
.otc thead th:first-child{text-align:left;color:#a39d94;font-size:12px;letter-spacing:.16em}
.otc code{font-family:monospace;color:#e6c98f}
.otc .s td{text-align:left;background:#1a1214;color:#e8546a;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;box-shadow:inset 3px 0 0 #e8546a}
.otc .y{color:#3ddc84;font-weight:700}.otc .n{color:#e8546a;font-weight:700}
${RANKS.map((r) => `.otc .${r.key}{color:${r.color};font-weight:700}`).join("")}
${RANKS.map((r, i) => `.otc thead th:nth-child(${i + 2}){color:${r.color};border-bottom:2px solid ${r.color}}`).join("")}`;
const html = `<style>${css.replace(/\n/g, "")}</style>
<div class="otc"><h2>RANK COMPARISON</h2><p>Compare the perks and privileges included with each OVERTHRONE donor rank.</p>
<div class="w"><table><thead><tr><th>FEATURE</th>${RANKS.map((r) => `<th>${r.name.toUpperCase()}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>
<p>Every rank includes all perks and commands of the ranks below it.</p></div>
`;
fs.writeFileSync(path.join(here, "tebex-custom-html.html"), html);
console.log("wrote tebex-storefront/ranks/tebex-custom-html.html", html.length, "chars");
