// Renders one branded 800×800 image per package, crate and category.
//
//   node tebex-storefront/catalogue/build-catalogue.mjs   (first, writes packages.json)
//   node tebex-storefront/catalogue/render-images.mjs
//
// Same visual language as the existing category tiles: black, crimson glow,
// silver emblem, thin frame with corner brackets. Names come from packages.json.
// Requires Playwright (set PLAYWRIGHT_PATH / CHROMIUM_PATH if needed).

import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { CRATES, CATEGORIES } from "./catalogue-data.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const FONT = pathToFileURL(path.join(root, "public/fonts/lora-var.woff")).href;
const packages = JSON.parse(fs.readFileSync(path.join(here, "packages.json"), "utf8"));
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;

// ---------- colour helpers
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (h, t, a) => { const [r, g, b] = hex(h); const [x, y, z] = hex(t); return `rgb(${Math.round(r + (x - r) * a)},${Math.round(g + (y - g) * a)},${Math.round(b + (z - b) * a)})`; };
const rgba = (h, a) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; };

// ---------- icons (viewBox 0 0 200 200), silver body + tinted gem
const S = 'fill="url(#silver)" stroke="#0c0c0e" stroke-width="2.4" stroke-linejoin="round"';
const T = 'fill="url(#steel)" stroke="#0c0c0e" stroke-width="2" stroke-linejoin="round"';
const G = 'fill="url(#gem)" stroke="#1d0509" stroke-width="1.8" stroke-linejoin="round"';
const HL = 'fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.2" stroke-linecap="round"';
const star4 = (x, y, r) => `<path d="M${x} ${y - r} L${x + r * .22} ${y - r * .22} L${x + r} ${y} L${x + r * .22} ${y + r * .22} L${x} ${y + r} L${x - r * .22} ${y + r * .22} L${x - r} ${y} L${x - r * .22} ${y - r * .22} Z" ${S}/>`;
const ICONS = {
  crown: `<path d="M36 150 L26 70 L58 104 L66 56 L84 92 L100 22 L116 92 L134 56 L142 104 L174 70 L164 150 Z" ${S}/>
    <path d="M100 22 L100 8 M93 14 L107 14" stroke="#c9ccd2" stroke-width="5" stroke-linecap="round"/>
    <rect x="30" y="148" width="140" height="26" rx="2" ${T}/><path d="M36 155 H164" ${HL}/>
    <path d="M100 58 L110 76 L100 96 L90 76 Z" ${G}/>
    <circle cx="26" cy="68" r="7" ${G}/><circle cx="66" cy="54" r="6" ${G}/><circle cx="134" cy="54" r="6" ${G}/><circle cx="174" cy="68" r="7" ${G}/>
    <path d="M100 152 L110 161 L100 170 L90 161 Z" ${G}/><circle cx="62" cy="161" r="5.5" ${G}/><circle cx="138" cy="161" r="5.5" ${G}/>`,
  key: `<g transform="rotate(-40 100 100)">
    <path d="M50 64 C70 64 78 80 78 100 C78 120 70 136 50 136 C30 136 22 120 22 100 C22 80 30 64 50 64 Z M50 80 C40 80 36 90 36 100 C36 110 40 120 50 120 C60 120 64 110 64 100 C64 90 60 80 50 80 Z" ${S} fill-rule="evenodd"/>
    <path d="M50 56 L56 66 L44 66 Z M50 144 L56 134 L44 134 Z M14 100 L24 94 L24 106 Z" ${T}/>
    <path d="M50 86 L62 100 L50 114 L38 100 Z" ${G}/>
    <path d="M76 94 L186 94 L192 100 L186 106 L76 106 Z" ${S}/><path d="M80 97 H184" ${HL}/>
    <rect x="86" y="88" width="10" height="24" rx="2" ${T}/>
    <path d="M150 106 h12 v26 h-6 v-8 h-6 Z M168 106 h12 v18 h-12 Z" ${T}/></g>`,
  shards: `<path d="M100 20 L126 70 L112 168 L88 168 L74 70 Z" ${G}/>
    <path d="M100 20 L112 70 L100 168 Z" fill="rgba(255,255,255,.2)"/>
    <path d="M52 70 L72 104 L62 170 L44 170 L34 104 Z" ${G}/>
    <path d="M148 70 L166 104 L156 170 L138 170 L128 104 Z" ${G}/>
    <path d="M30 172 H170 L160 184 H40 Z" ${T}/>`,
  featured: `<circle cx="100" cy="100" r="70" fill="none" stroke="url(#gem)" stroke-width="3" opacity=".9"/>
    <path transform="rotate(45 100 100)" d="M100 46 L108 92 L154 100 L108 108 L100 154 L92 108 L46 100 L92 92 Z" ${T}/>
    <path d="M100 10 L113 87 L190 100 L113 113 L100 190 L87 113 L10 100 L87 87 Z" ${S}/>
    <path d="M100 86 L114 100 L100 114 L86 100 Z" ${G}/>`,
  bundle: `<path d="M30 98 Q30 50 100 50 Q170 50 170 98 Z" ${S}/><path d="M40 92 Q42 62 100 60" ${HL}/>
    <rect x="30" y="98" width="140" height="78" rx="3" ${S}/><path d="M30 98 h140" stroke="#0c0c0e" stroke-width="3"/>
    <rect x="52" y="52" width="14" height="124" ${T}/><rect x="134" y="52" width="14" height="124" ${T}/>
    <path d="M100 82 L120 96 L120 122 L100 136 L80 122 L80 96 Z" ${T}/><path d="M100 90 L112 100 L112 118 L100 128 L88 118 L88 100 Z" ${G}/>`,
  aura: `<ellipse cx="100" cy="64" rx="66" ry="18" fill="none" stroke="url(#gem)" stroke-width="7"/>
    <ellipse cx="100" cy="64" rx="66" ry="18" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1.2"/>
    <path d="M70 186 C70 140 78 110 100 100 C122 110 130 140 130 186 Z" ${T}/>
    <circle cx="100" cy="92" r="22" ${S}/>
    ${star4(40, 40, 10)}${star4(164, 44, 8)}${star4(158, 120, 9)}${star4(42, 128, 7)}`,
  trail: `<path d="M20 160 C60 150 80 120 110 110 C140 100 160 70 184 40" fill="none" stroke="url(#gem)" stroke-width="10" stroke-linecap="round"/>
    <path d="M20 160 C60 150 80 120 110 110 C140 100 160 70 184 40" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2" stroke-linecap="round"/>
    <path d="M30 130 L42 136 L36 148 Z M70 104 L84 108 L76 122 Z M118 78 L132 80 L126 94 Z" ${G}/>
    ${star4(176, 40, 14)}${star4(60, 172, 7)}${star4(140, 140, 8)}`,
  skull: `<path d="M100 26 C58 26 36 56 36 92 C36 116 48 132 62 140 L62 168 L138 168 L138 140 C152 132 164 116 164 92 C164 56 142 26 100 26 Z" ${S}/>
    <path d="M70 92 C70 80 92 80 92 94 C92 106 70 110 70 92 Z M108 94 C108 80 130 80 130 92 C130 110 108 106 108 94 Z" ${G}/>
    <path d="M100 110 L108 126 L92 126 Z" fill="#160408"/>
    <path d="M76 150 V168 M92 150 V168 M108 150 V168 M124 150 V168" stroke="#0c0c0e" stroke-width="3"/><path d="M60 60 C70 44 84 38 100 38" ${HL}/>`,
  scroll: `<rect x="44" y="40" width="112" height="120" rx="4" ${S}/>
    <path d="M36 40 C36 28 56 28 56 40 L56 46 L36 46 Z M144 154 C144 166 164 166 164 154 L164 148 L144 148 Z" ${T}/>
    <path d="M62 70 H138 M62 90 H138 M62 110 H120" stroke="#3b3e44" stroke-width="5" stroke-linecap="round"/>
    <circle cx="128" cy="138" r="16" ${G}/><path d="M120 150 L116 172 L128 164 L140 172 L136 150" ${G}/>`,
  sigil: `<path d="M100 18 L172 60 L172 140 L100 182 L28 140 L28 60 Z" ${S}/>
    <path d="M100 38 L154 70 L154 130 L100 162 L46 130 L46 70 Z" ${T}/>
    <path d="M100 58 L120 100 L100 142 L80 100 Z" ${G}/><path d="M64 100 H136" stroke="url(#gem)" stroke-width="5"/>`,
  horseshoe: `<path d="M50 40 C30 80 34 150 100 170 C166 150 170 80 150 40 L124 40 C140 80 138 136 100 146 C62 136 60 80 76 40 Z" ${S}/>
    <circle cx="62" cy="70" r="5" ${G}/><circle cx="138" cy="70" r="5" ${G}/><circle cx="66" cy="110" r="5" ${G}/><circle cx="134" cy="110" r="5" ${G}/>
    <path d="M100 150 L110 160 L100 172 L90 160 Z" ${G}/>`,
  sword: `<path d="M100 6 L113 30 L112 126 L88 126 L87 30 Z" ${S}/><path d="M100 18 L100 120" stroke="#3b3e44" stroke-width="3"/>
    <path d="M44 120 C60 132 80 126 100 126 C120 126 140 132 156 120 L160 132 C140 146 120 140 100 140 C80 140 60 146 40 132 Z" ${S}/>
    <path d="M100 124 L110 133 L100 142 L90 133 Z" ${G}/><rect x="92" y="140" width="16" height="36" rx="2" ${T}/>
    <path d="M100 174 L112 184 L100 196 L88 184 Z" ${G}/>`,
  shield: `<path d="M100 18 L166 40 L162 104 C158 144 132 168 100 184 C68 168 42 144 38 104 L34 40 Z" ${S}/>
    <path d="M100 36 L148 52 L145 102 C142 134 124 152 100 166 C76 152 58 134 55 102 L52 52 Z" ${T}/>
    <path d="M100 64 L118 98 L100 138 L82 98 Z" ${G}/><path d="M48 46 L100 28" ${HL}/>`,
  banner: `<rect x="56" y="22" width="8" height="170" rx="2" ${T}/><circle cx="60" cy="18" r="8" ${G}/>
    <path d="M64 34 H156 L140 72 L156 110 H64 Z" fill="url(#gem)" stroke="#1d0509" stroke-width="2"/>
    <path d="M100 52 L110 72 L100 92 L90 72 Z" ${S}/>`,
  portal: `<ellipse cx="100" cy="100" rx="58" ry="80" fill="none" stroke="url(#silver)" stroke-width="12"/>
    <ellipse cx="100" cy="100" rx="44" ry="66" fill="url(#gem)" opacity=".85"/>
    <path d="M100 50 C80 70 120 90 100 110 C80 130 120 140 100 152" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="3"/>
    ${star4(160, 40, 9)}${star4(40, 160, 8)}`,
  bubble: `<path d="M30 40 H170 V132 H92 L58 166 L62 132 H30 Z" ${S}/>
    <path d="M52 70 H148 M52 98 H120" stroke="url(#gem)" stroke-width="8" stroke-linecap="round"/>`,
  pet: `<path d="M100 26 C128 56 146 84 140 120 C136 150 118 170 100 170 C82 170 64 150 60 120 C54 84 72 56 100 26 Z" fill="url(#gem)" stroke="#1d0509" stroke-width="2"/>
    <path d="M100 60 C114 80 120 100 116 124 C112 142 104 150 100 150 C96 150 88 142 84 124 C80 100 86 80 100 60 Z" fill="rgba(255,255,255,.3)"/>
    <circle cx="88" cy="110" r="6" fill="#160408"/><circle cx="112" cy="110" r="6" fill="#160408"/>
    <path d="M40 178 H160" stroke="url(#silver)" stroke-width="6" stroke-linecap="round"/>${star4(48, 60, 9)}${star4(156, 72, 7)}`,
  booster: `<path d="M56 24 H144 V40 C144 70 112 86 112 100 C112 114 144 130 144 160 V176 H56 V160 C56 130 88 114 88 100 C88 86 56 70 56 40 Z" ${S}/>
    <path d="M70 44 H130 C130 66 106 80 100 94 C94 80 70 66 70 44 Z M100 120 C108 134 128 142 128 160 H72 C72 142 92 134 100 120 Z" ${G}/>
    <rect x="44" y="16" width="112" height="12" rx="3" ${T}/><rect x="44" y="172" width="112" height="12" rx="3" ${T}/>`,
  starter: `<path d="M100 18 L172 46 L164 112 C158 150 132 172 100 186 C68 172 42 150 36 112 L28 46 Z" ${S}/>
    <path d="M100 44 L116 80 L156 84 L126 110 L134 150 L100 130 L66 150 L74 110 L44 84 L84 80 Z" ${G}/>`,
  moon: `<circle cx="100" cy="96" r="70" fill="url(#gem)" stroke="#1d0509" stroke-width="2"/>
    <circle cx="128" cy="78" r="62" fill="#0a0607"/>
    <path d="M30 178 L60 140 L80 160 L104 128 L130 160 L150 144 L172 178 Z" ${T}/>${star4(162, 40, 9)}${star4(40, 50, 7)}`,
  gift: `<rect x="34" y="78" width="132" height="98" rx="3" ${S}/><rect x="26" y="58" width="148" height="26" rx="3" ${T}/>
    <rect x="90" y="58" width="20" height="118" fill="url(#gem)" stroke="#1d0509" stroke-width="1.5"/>
    <path d="M100 58 C80 26 52 30 62 50 C68 60 88 58 100 58 C112 58 132 60 138 50 C148 30 120 26 100 58 Z" ${G}/>`,
  token: `<circle cx="100" cy="100" r="74" ${S}/><circle cx="100" cy="100" r="58" ${T}/>
    <path d="M100 56 L124 100 L100 144 L76 100 Z" ${G}/><path d="M48 70 C60 46 80 36 100 34" ${HL}/>`,
  chest: `<path d="M30 98 Q30 50 100 50 Q170 50 170 98 Z" ${S}/><rect x="30" y="98" width="140" height="78" rx="3" ${S}/>
    <path d="M30 98 h140" stroke="#0c0c0e" stroke-width="3"/><rect x="52" y="52" width="14" height="124" ${T}/><rect x="134" y="52" width="14" height="124" ${T}/>
    <rect x="88" y="86" width="24" height="30" rx="4" ${G}/>`,
  "crate-keys": null, ranks: null, cosmetics: null, bundles: null
};
ICONS["crate-keys"] = ICONS.key; ICONS.ranks = ICONS.crown; ICONS.cosmetics = ICONS.aura; ICONS.bundles = ICONS.bundle;
ICONS.utility = ICONS.token; ICONS.seasonal = ICONS.moon;

const defs = (c) => `<defs>
  <linearGradient id="silver" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f5f7"/><stop offset=".35" stop-color="#b9bec6"/><stop offset=".5" stop-color="#4a4e55"/><stop offset=".62" stop-color="#9aa0a8"/><stop offset="1" stop-color="#e2e4e8"/></linearGradient>
  <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dfe2e6"/><stop offset=".5" stop-color="#6b7078"/><stop offset="1" stop-color="#c4c8ce"/></linearGradient>
  <radialGradient id="gem" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="${mix(c, "#FFFFFF", .7)}"/><stop offset=".3" stop-color="${mix(c, "#FFFFFF", .15)}"/><stop offset=".7" stop-color="${c}"/><stop offset="1" stop-color="${mix(c, "#000000", .7)}"/></radialGradient>
</defs>`;

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const seedOf = (str) => [...str].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
function embers(seed, color) {
  const r = rng(seed); let h = "";
  for (let i = 0; i < 26; i++) {
    const s = 1.5 + r() * 3.2;
    h += `<i style="left:${(r() * 800).toFixed(0)}px;top:${(r() * 800).toFixed(0)}px;width:${s.toFixed(1)}px;height:${s.toFixed(1)}px;opacity:${(.2 + r() * .55).toFixed(2)};background:${mix(color, "#FFFFFF", .35)};box-shadow:0 0 8px 2px ${rgba(color, .7)}"></i>`;
  }
  return h;
}

const card = ({ id, color, labelColor, icon, label, title, sub, badge, plain }) => {
  const lc = labelColor || color;
  const len = title.length;
  const size = len > 30 ? 40 : len > 22 ? 48 : len > 14 ? 58 : 70;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Lora;src:url("${FONT}") format("woff");font-weight:400 700}
*{margin:0;padding:0;box-sizing:border-box}
.c{position:relative;width:800px;height:800px;overflow:hidden;font-family:Lora,Georgia,serif;color:#efebe4;
  background:radial-gradient(ellipse 55% 50% at 50% 40%,${rgba(color, .38)},transparent 70%),radial-gradient(ellipse 120% 60% at 50% 115%,rgba(92,11,24,.5),transparent 70%),linear-gradient(180deg,#0d0809,#050404 60%,#030303)}
.v{position:absolute;inset:0;background:radial-gradient(ellipse 110% 100% at 50% 50%,transparent 55%,rgba(0,0,0,.85))}
.e i{position:absolute;border-radius:50%}
.f{position:absolute;inset:26px;border:1px solid rgba(255,255,255,.12)}
.f:before,.f:after{content:"";position:absolute;width:34px;height:34px;border:2px solid rgba(195,198,204,.55)}
.f:before{left:-2px;top:-2px;border-right:0;border-bottom:0}.f:after{right:-2px;bottom:-2px;border-left:0;border-top:0}
.top{position:absolute;left:26px;right:26px;top:26px;height:3px;background:linear-gradient(90deg,transparent,${lc},transparent)}
.lab{position:absolute;top:62px;left:0;right:0;text-align:center;font:700 19px system-ui,'Segoe UI',Arial,sans-serif;letter-spacing:.3em;color:${mix(lc, "#FFFFFF", .25)}}
.ic{position:absolute;left:50%;top:${plain ? 180 : badge ? 118 : 128}px;transform:translateX(-50%);filter:drop-shadow(0 0 26px ${rgba(color, .6)}) drop-shadow(0 10px 18px rgba(0,0,0,.85))}
.t{position:absolute;left:60px;right:60px;bottom:${sub ? 118 : 92}px;text-align:center;font-size:${size}px;font-weight:600;line-height:1.08;letter-spacing:.04em;text-transform:uppercase;
  background:linear-gradient(180deg,#fff 0%,#d9dbe0 40%,#8e939b 55%,#e9ebee 72%,#a7acb3 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.s{position:absolute;left:0;right:0;bottom:74px;text-align:center;font:700 20px system-ui,'Segoe UI',Arial,sans-serif;letter-spacing:.26em;color:#a39d94}
.b{position:absolute;right:58px;top:96px;min-width:118px;padding:10px 18px;border:2px solid ${color};background:rgba(5,5,5,.75);text-align:center;font:700 40px Lora,serif;color:#fff;box-shadow:0 0 22px ${rgba(color, .45)}}
</style></head><body><div class="c"><div class="e">${embers(seedOf(id), color)}</div><div class="v"></div><div class="f"></div><div class="top"></div>
<div class="lab">${label}</div>
<svg class="ic" viewBox="0 0 200 200" width="${plain ? 440 : badge ? 330 : 360}" height="${plain ? 440 : badge ? 330 : 360}" style="overflow:visible">${defs(color)}${ICONS[icon] || ICONS.featured}</svg>
${badge ? `<div class="b">${badge}</div>` : ""}
<div class="t">${title}</div>${sub ? `<div class="s">${sub}</div>` : ""}
</div></body></html>`;
};

// Icon tint: ranks, keys, shards and boosters use their own colour; everything
// else is tinted by its theme (rarity is shown in the label instead).
function accentFor(p) {
  if (["Ranks", "Crate Keys", "Throne Shards", "Boosters"].includes(p.category)) return p.color;
  const n = p.name + " " + (p.art || "");
  if (/Abyss|Void|violet/i.test(p.name)) return "#7B4DFF";
  if (/Ember|Ash|Hunter's Oath|Initiate/i.test(p.name)) return "#F2A541";
  if (/Gild|Regalia|Founder|Crown|Gift|Anniversary|Festival/i.test(p.name)) return "#E6C068";
  if (/Frost|Silver|Winter|Sovereign|Nickname|Token|Wardrobe|Colour|Queue|Banner|Emoji/i.test(p.name)) return "#C3C6CC";
  if (/Dreadforge|Molten|Forge/i.test(n)) return "#FF6A1A";
  return "#D61F3C";
}

// ---------- jobs
const jobs = [];
for (const p of packages) {
  const isKey = p.id.startsWith("KEY-") && p.qty;
  const titles = {
    "Ranks": p.name.replace(" Rank", ""),
    "Crate Keys": isKey ? p.name.replace(/ ×\d+$/, "") : p.name,
    "Throne Shards": `${p.sub} Shards`,
    "Boosters": p.name.replace(/ \(.*\)$/, "")
  };
  const subs = {
    "Ranks": "LIFETIME RANK", "Crate Keys": isKey ? `${p.qty} KEY${p.qty > 1 ? "S" : ""}` : "MIXED KEYS",
    "Throne Shards": p.bonus ? `+${Math.round(p.bonus * 100)}% BONUS` : "THRONE SHARDS", "Boosters": `${p.sub} · GLOBAL`,
    "Cosmetics": p.type.toUpperCase(), "Pets": "COSMETIC PET", "Bundles": "BUNDLE", "Featured": p.sub,
    "Starter": "ONE PER PLAYER", "Seasonal": "EVENT ONLY", "Gifts": "GIFT FOR A FRIEND", "Utility": "UTILITY TOKEN"
  };
  jobs.push({
    file: `images/${p.id}.jpg`, id: p.id, color: accentFor(p), labelColor: p.color, icon: p.icon,
    label: p.category === "Ranks" ? p.label : p.category === "Crate Keys" && isKey ? `${p.rarity.toUpperCase()} CRATE KEY` : (p.rarity && !/Starter|Event|Gift|Utility|Mixed/.test(p.rarity) ? `${p.rarity.toUpperCase()} · ${p.category.toUpperCase()}` : p.category.toUpperCase()),
    title: titles[p.category] || p.name, sub: subs[p.category], badge: isKey ? `×${p.qty}` : p.category === "Boosters" ? p.sub.replace(" HOURS", "H").replace(" HOUR", "H") : null
  });
}
CRATES.forEach((c, i) => jobs.push({ file: `images/CRATE-${String(i + 1).padStart(3, "0")}.jpg`, id: c.key, color: c.color, icon: "chest", label: `${c.prestige.toUpperCase()} CRATE`, title: c.name, sub: "GATE CRATE" }));
// Category tiles carry no text, matching the existing tiles (Tebex prints the name).
CATEGORIES.forEach((c) => jobs.push({ file: `images/categories/${c.key}.jpg`, id: c.key, color: "#D61F3C", icon: c.icon, label: "", title: "", sub: null, plain: true }));

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
let n = 0;
for (const j of jobs) {
  if (only && !only.test(j.file)) continue;
  const file = path.join(here, j.file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = path.join(here, ".card.html");
  fs.writeFileSync(tmp, card(j));
  await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: file, type: "jpeg", quality: 86 });
  n++;
}
fs.rmSync(path.join(here, ".card.html"), { force: true });
await browser.close();
console.log("rendered", n, "images");
