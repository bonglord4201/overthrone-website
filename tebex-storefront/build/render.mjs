// Renders the OVERTHRONE SMP Tebex storefront image pack.
//
//   node tebex-storefront/build/render.mjs
//
// Uses the official logo and Lora font from public/ (never redrawn), and the
// same colour palette as overthronesmp.net. Output goes to tebex-storefront/assets/.
// Requires Playwright (Chromium). Set PLAYWRIGHT_PATH if it is not resolvable.

import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const out = path.join(root, "tebex-storefront/assets");
const pub = (p) => pathToFileURL(path.join(root, "public", p)).href;

const LOGO = pub("images/overthrone-logo-800.webp");
const FONT = pub("fonts/lora-var.woff");

// ---------- shared pieces ----------

// Deterministic "random" so every build produces identical images.
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function embers(count, seed, { w, h, minY = 0 }) {
  const r = rng(seed);
  let html = "";
  for (let i = 0; i < count; i++) {
    const size = 1.5 + r() * 3.5;
    const x = r() * w;
    const y = minY + r() * (h - minY);
    const o = 0.18 + r() * 0.6;
    const blur = r() < 0.25 ? 1.5 : 0;
    html += `<i style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;opacity:${o.toFixed(2)};filter:blur(${blur}px)"></i>`;
  }
  return `<div class="embers">${html}</div>`;
}

const BASE_CSS = `
@font-face{font-family:Lora;src:url("${FONT}") format("woff");font-weight:400 700}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:transparent}
body{font-family:Lora,Georgia,serif;color:#efebe4;-webkit-font-smoothing:antialiased}
.canvas{position:relative;overflow:hidden}
.bg{position:absolute;inset:0;background:
  radial-gradient(ellipse 60% 70% at var(--gx,50%) var(--gy,45%),rgba(165,22,45,.42),transparent 70%),
  radial-gradient(ellipse 120% 60% at 50% 110%,rgba(92,11,24,.55),transparent 70%),
  linear-gradient(180deg,#0d0809 0%,#060505 55%,#030303 100%)}
.smoke{position:absolute;inset:-10%;background:
  radial-gradient(ellipse 30% 22% at 18% 30%,rgba(255,255,255,.035),transparent 70%),
  radial-gradient(ellipse 28% 18% at 78% 70%,rgba(255,255,255,.03),transparent 70%),
  radial-gradient(ellipse 40% 25% at 60% 20%,rgba(197,28,56,.08),transparent 70%)}
.vignette{position:absolute;inset:0;background:radial-gradient(ellipse 110% 100% at 50% 50%,transparent 55%,rgba(0,0,0,.85))}
.embers{position:absolute;inset:0}
.embers i{position:absolute;border-radius:50%;background:#ff6b7d;box-shadow:0 0 8px 2px rgba(197,28,56,.8)}
.silver{background:linear-gradient(180deg,#ffffff 0%,#d9dbe0 38%,#8e939b 52%,#e9ebee 70%,#a7acb3 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.eyebrow{font-family:system-ui,"Segoe UI",Arial,sans-serif;font-weight:700;letter-spacing:.32em;text-transform:uppercase;color:#e8546a}
.rule{height:2px;background:linear-gradient(90deg,#c51c38,rgba(197,28,56,0))}
.frame{position:absolute;inset:var(--inset,22px);border:1px solid rgba(255,255,255,.12)}
.frame:before,.frame:after{content:"";position:absolute;width:34px;height:34px;border:2px solid rgba(195,198,204,.55)}
.frame:before{left:-2px;top:-2px;border-right:0;border-bottom:0}
.frame:after{right:-2px;bottom:-2px;border-left:0;border-top:0}
.logo{display:block;filter:drop-shadow(0 0 40px rgba(165,22,45,.35))}
`;

const doc = (w, h, body, extraCss = "") =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}${extraCss}
  .canvas{width:${w}px;height:${h}px}</style></head><body><div class="canvas">${body}</div></body></html>`;

const backdrop = (w, h, seed, opts = {}) =>
  `<div class="bg" style="--gx:${opts.gx || "50%"};--gy:${opts.gy || "45%"}"></div><div class="smoke"></div>${embers(opts.count ?? Math.round((w * h) / 26000), seed, { w, h, minY: opts.minY || 0 })}<div class="vignette"></div>`;

// ---------- category icons (drawn for OVERTHRONE; silver with crimson accents) ----------

const DEFS = `<defs>
  <linearGradient id="silver" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f4f5f7"/><stop offset=".35" stop-color="#b9bec6"/>
    <stop offset=".5" stop-color="#4a4e55"/><stop offset=".62" stop-color="#9aa0a8"/><stop offset="1" stop-color="#e2e4e8"/>
  </linearGradient>
  <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#dfe2e6"/><stop offset=".5" stop-color="#6b7078"/><stop offset="1" stop-color="#c4c8ce"/>
  </linearGradient>
  <linearGradient id="crimson" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ff6a7e"/><stop offset=".45" stop-color="#d11e3c"/><stop offset="1" stop-color="#5a0816"/>
  </linearGradient>
  <radialGradient id="gem" cx=".35" cy=".3" r=".8">
    <stop offset="0" stop-color="#ffd0d7"/><stop offset=".25" stop-color="#ff4d66"/><stop offset=".7" stop-color="#a5162d"/><stop offset="1" stop-color="#3d0610"/>
  </radialGradient>
</defs>`;
const S = 'fill="url(#silver)" stroke="#0c0c0e" stroke-width="2.4" stroke-linejoin="round"';
const T = 'fill="url(#steel)" stroke="#0c0c0e" stroke-width="2" stroke-linejoin="round"';
const C = 'fill="url(#gem)" stroke="#1d0509" stroke-width="1.8" stroke-linejoin="round"';
const HL = 'fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.2" stroke-linecap="round"';

const ICONS = {
  featured: `
    <circle cx="100" cy="100" r="70" fill="none" stroke="url(#crimson)" stroke-width="3" opacity=".8"/>
    <circle cx="100" cy="100" r="62" fill="none" stroke="url(#steel)" stroke-width="1.5" opacity=".6"/>
    <path transform="rotate(45 100 100)" d="M100 46 L108 92 L154 100 L108 108 L100 154 L92 108 L46 100 L92 92 Z" ${T}/>
    <path d="M100 10 L113 87 L190 100 L113 113 L100 190 L87 113 L10 100 L87 87 Z" ${S}/>
    <path d="M100 18 L100 84 M100 116 L100 182 M18 100 L84 100 M116 100 L182 100" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/>
    <path d="M100 86 L114 100 L100 114 L86 100 Z" ${C}/>`,
  ranks: `
    <path d="M36 150 L26 70 L58 104 L66 56 L84 92 L100 22 L116 92 L134 56 L142 104 L174 70 L164 150 Z" ${S}/>
    <path d="M100 22 L100 8 M93 14 L107 14" stroke="#c9ccd2" stroke-width="5" stroke-linecap="round"/>
    <path d="M44 140 L36 84 M156 140 L164 84" ${HL} opacity=".6"/>
    <rect x="30" y="148" width="140" height="26" rx="2" ${T}/>
    <path d="M36 155 H164" ${HL}/>
    <path d="M100 58 L110 76 L100 96 L90 76 Z" ${C}/>
    <circle cx="26" cy="68" r="7" ${C}/><circle cx="66" cy="54" r="6" ${C}/><circle cx="134" cy="54" r="6" ${C}/><circle cx="174" cy="68" r="7" ${C}/>
    <path d="M100 152 L110 161 L100 170 L90 161 Z" ${C}/><circle cx="62" cy="161" r="5.5" ${C}/><circle cx="138" cy="161" r="5.5" ${C}/>`,
  "crate-keys": `
    <g transform="rotate(-40 100 100)">
      <path d="M50 64 C70 64 78 80 78 100 C78 120 70 136 50 136 C30 136 22 120 22 100 C22 80 30 64 50 64 Z M50 80 C40 80 36 90 36 100 C36 110 40 120 50 120 C60 120 64 110 64 100 C64 90 60 80 50 80 Z" ${S} fill-rule="evenodd"/>
      <path d="M50 56 L56 66 L44 66 Z M50 144 L56 134 L44 134 Z M14 100 L24 94 L24 106 Z" ${T}/>
      <path d="M50 88 L60 100 L50 112 L40 100 Z" ${C}/>
      <path d="M76 94 L186 94 L192 100 L186 106 L76 106 Z" ${S}/>
      <path d="M80 97 H184" ${HL}/>
      <rect x="86" y="88" width="10" height="24" rx="2" ${T}/>
      <path d="M150 106 h12 v26 h-6 v-8 h-6 Z M168 106 h12 v18 h-12 Z" ${T}/>
    </g>`,
  cosmetics: `
    <path d="M100 18 L140 62 L118 180 L82 180 L60 62 Z" fill="none"/>
    <path d="M100 26 L138 66 L100 178 L62 66 Z" ${C}/>
    <path d="M100 26 L116 66 L100 178 Z" fill="rgba(255,255,255,.18)"/>
    <path d="M62 66 L138 66 M100 26 L84 66 L100 178 M100 26 L116 66" stroke="rgba(255,220,226,.55)" stroke-width="1.2" fill="none"/>
    <path d="M56 66 L100 20 L144 66 L136 66 L100 30 L64 66 Z" ${T}/>
    <path d="M52 62 h96 v8 h-96 Z" ${S}/>
    <path d="M36 44 L40 54 L50 58 L40 62 L36 72 L32 62 L22 58 L32 54 Z" ${S}/>
    <path d="M166 110 L169 118 L177 121 L169 124 L166 132 L163 124 L155 121 L163 118 Z" ${S}/>
    <path d="M150 34 L152 39 L157 41 L152 43 L150 48 L148 43 L143 41 L148 39 Z" ${S}/>
    <path d="M44 128 L46 133 L51 135 L46 137 L44 142 L42 137 L37 135 L42 133 Z" ${S}/>`,
  "special-items": `
    <path d="M100 6 L113 30 L112 126 L88 126 L87 30 Z" ${S}/>
    <path d="M100 18 L100 120" stroke="#3b3e44" stroke-width="3"/><path d="M104 30 L104 118" ${HL}/>
    <path d="M44 120 C60 132 80 126 100 126 C120 126 140 132 156 120 L160 132 C140 146 120 140 100 140 C80 140 60 146 40 132 Z" ${S}/>
    <path d="M40 132 L30 116 L44 120 Z M160 132 L170 116 L156 120 Z" ${T}/>
    <path d="M100 124 L110 133 L100 142 L90 133 Z" ${C}/>
    <rect x="92" y="140" width="16" height="36" rx="2" ${T}/>
    <path d="M92 148 h16 M92 156 h16 M92 164 h16" stroke="#0c0c0e" stroke-width="1.5"/>
    <path d="M100 174 L112 184 L100 196 L88 184 Z" ${C}/>`,
  bundles: `
    <path d="M30 98 Q30 50 100 50 Q170 50 170 98 Z" ${S}/>
    <path d="M40 92 Q42 62 100 60" ${HL}/>
    <rect x="30" y="98" width="140" height="78" rx="3" ${S}/>
    <path d="M30 98 h140" stroke="#0c0c0e" stroke-width="3"/>
    <rect x="52" y="52" width="14" height="124" ${T}/><rect x="134" y="52" width="14" height="124" ${T}/>
    <path d="M30 162 h22 v14 h-22 Z M148 162 h22 v14 h-22 Z M30 98 h22 v14 h-22 Z M148 98 h22 v14 h-22 Z" ${T}/>
    <path d="M100 82 L120 96 L120 122 L100 136 L80 122 L80 96 Z" ${T}/>
    <path d="M100 90 L112 100 L112 118 L100 128 L88 118 L88 100 Z" ${C}/>
    <circle cx="100" cy="106" r="3.5" fill="#1d0509"/><rect x="98.5" y="108" width="3" height="9" fill="#1d0509"/>`
};

const iconSvg = (key, size) =>
  `<svg viewBox="0 0 200 200" width="${size}" height="${size}" style="overflow:visible;filter:drop-shadow(0 0 22px rgba(197,28,56,.55)) drop-shadow(0 8px 18px rgba(0,0,0,.8))">${DEFS}${ICONS[key]}</svg>`;

// ---------- image definitions ----------

const IMAGES = [];
const add = (file, w, h, html, opts = {}) => IMAGES.push({ file, w, h, html, ...opts });

// Logos ------------------------------------------------------------
add("logo/overthrone-logo-800.png", 800, 800,
  `<img class="logo" src="${LOGO}" width="800" height="800" style="filter:none">`, { transparent: true });

add("logo/overthrone-logo-wide-1200x300.png", 1200, 300,
  `<div style="position:absolute;inset:0;display:flex;align-items:center;gap:34px;padding:0 20px">
     <img src="${LOGO}" width="280" height="280" style="flex:none">
     <div>
       <div class="silver" style="font-size:96px;font-weight:600;letter-spacing:.12em;line-height:1">OVERTHRONE</div>
       <div class="eyebrow" style="font-size:26px;margin-top:14px;letter-spacing:.62em">SMP · OFFICIAL STORE</div>
     </div>
   </div>`, { transparent: true });

// Hero / carousel slides ---------------------------------------------
const heroText = (size) => `
  <p class="eyebrow" style="font-size:${size * 0.2}px;margin-bottom:${size * 0.22}px">Official Store</p>
  <div class="silver" style="font-size:${size}px;font-weight:600;letter-spacing:.08em;line-height:1">OVERTHRONE</div>
  <div class="rule" style="width:${size * 1.4}px;margin:${size * 0.28}px 0 ${size * 0.26}px"></div>
  <p style="font-size:${size * 0.36}px;color:#e9e4da">Don’t reach the throne. Overthrow it.</p>
  <p style="font-family:system-ui,'Segoe UI',Arial,sans-serif;font-size:${size * 0.19}px;letter-spacing:.24em;color:#a39d94;margin-top:${size * 0.3}px">SERVER&nbsp;&nbsp;<span style="color:#efebe4;font-weight:700;letter-spacing:.12em">OVERTHRONESMP.NET</span></p>`;

add("carousel/01-hero-1920x640.jpg", 1920, 640,
  `${backdrop(1920, 640, 11, { gx: "32%", gy: "50%" })}<div class="frame" style="--inset:20px"></div>
   <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:90px">
     <img class="logo" src="${LOGO}" width="520" height="520">
     <div>${heroText(118)}</div>
   </div>`);

add("carousel/01-hero-mobile-1080x1080.jpg", 1080, 1080,
  `${backdrop(1080, 1080, 12, { gy: "36%" })}<div class="frame" style="--inset:20px"></div>
   <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
     <img class="logo" src="${LOGO}" width="560" height="560" style="margin-top:-30px">
     <p style="font-size:44px;color:#e9e4da;margin-top:10px">Don’t reach the throne. Overthrow it.</p>
     <div class="rule" style="width:260px;margin:30px auto 26px;background:linear-gradient(90deg,transparent,#c51c38,transparent)"></div>
     <p style="font-family:system-ui,'Segoe UI',Arial,sans-serif;font-size:26px;letter-spacing:.24em;color:#a39d94">SERVER&nbsp;&nbsp;<span style="color:#efebe4;font-weight:700">OVERTHRONESMP.NET</span></p>
   </div>`);

const slide = (file, w, h, seed, eyebrow, title, sub, extra = "") =>
  add(file, w, h, `${backdrop(w, h, seed, { gx: "50%", gy: "55%" })}<div class="frame" style="--inset:20px"></div>
   <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 80px">
     <p class="eyebrow" style="font-size:${w > 1100 ? 24 : 28}px;margin-bottom:24px">${eyebrow}</p>
     <div class="silver" style="font-size:${w > 1100 ? 104 : 96}px;font-weight:600;letter-spacing:.06em;line-height:1.05">${title}</div>
     <div class="rule" style="width:300px;margin:34px auto 30px;background:linear-gradient(90deg,transparent,#c51c38,transparent)"></div>
     <p style="font-size:${w > 1100 ? 36 : 40}px;color:#e9e4da;max-width:1200px">${sub}</p>
     ${extra}
   </div>`);

const realmRow = (px) => `<p style="font-family:system-ui,'Segoe UI',Arial,sans-serif;font-weight:700;font-size:${px}px;letter-spacing:.22em;color:#c3c6cc;margin-top:34px;line-height:1.9">OVERTHRONE <span style="color:#c51c38">◆</span> THE REALM <span style="color:#c51c38">◆</span> THE FRONTIER<br>THE GATES <span style="color:#c51c38">◆</span> AEONIA <span style="color:#c51c38">◆</span> NETHERFALL</p>`;
const playRow = (px, wrap) => `<p style="font-family:system-ui,'Segoe UI',Arial,sans-serif;font-size:${px}px;letter-spacing:.22em;color:#a39d94;margin-top:34px;line-height:1.9">MINECRAFT 1.21.1 <span style="color:#c51c38">◆</span> NEOFORGE ${wrap ? "<br>" : '<span style="color:#c51c38">◆</span> '}TENSURA: REINCARNATED</p>`;

slide("carousel/02-realms-1920x640.jpg", 1920, 640, 21, "The World of OVERTHRONE", "SIX REALMS AWAIT", "", realmRow(24));
slide("carousel/02-realms-mobile-1080x1080.jpg", 1080, 1080, 22, "The World of OVERTHRONE", "SIX REALMS<br>AWAIT", "", realmRow(26));
slide("carousel/03-play-1920x640.jpg", 1920, 640, 31, "Join the Hunt", "OVERTHRONESMP.NET", "Copy the address and enter the realm.", playRow(22));
slide("carousel/03-play-mobile-1080x1080.jpg", 1080, 1080, 32, "Join the Hunt", "OVERTHRONE<br>SMP.NET", "Copy the address and enter the realm.", playRow(24, true));
slide("carousel/04-discord-1920x640.jpg", 1920, 640, 41, "Community", "JOIN THE DISCORD", "News, events and support from the OVERTHRONE team.");
slide("carousel/04-discord-mobile-1080x1080.jpg", 1080, 1080, 42, "Community", "JOIN THE<br>DISCORD", "News, events and support from the OVERTHRONE team.");

// Category tiles (no text: Tebex shows the category name itself) ------
for (const key of Object.keys(ICONS)) {
  add(`categories/${key}-800.png`, 800, 800,
    `${backdrop(800, 800, key.length * 97, { gy: "48%", count: 26 })}<div class="frame" style="--inset:26px"></div>
     <div style="position:absolute;inset:0;display:grid;place-items:center">${iconSvg(key, 440)}</div>`);
}

// Default package image (for packages without their own artwork) ------
add("packages/package-default-800.png", 800, 800,
  `${backdrop(800, 800, 77, { gy: "46%", count: 24 })}<div class="frame" style="--inset:26px"></div>
   <div style="position:absolute;inset:0;display:grid;place-items:center"><img class="logo" src="${LOGO}" width="520" height="520"></div>`);

// Store background -------------------------------------------------
add("background/store-background-1920x1080.jpg", 1920, 1080,
  `${backdrop(1920, 1080, 99, { gy: "18%", count: 60 })}`);
add("background/store-background-2560x1440.jpg", 2560, 1440,
  `${backdrop(2560, 1440, 98, { gy: "18%", count: 90 })}`);

// ---------- render ----------

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const img of IMAGES) {
  const file = path.join(out, img.file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.setViewportSize({ width: img.w, height: img.h });
  const tmp = path.join(here, ".render.html");
  fs.writeFileSync(tmp, doc(img.w, img.h, img.html));
  await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const isJpg = file.endsWith(".jpg");
  await page.locator(".canvas").screenshot({
    path: file,
    type: isJpg ? "jpeg" : "png",
    quality: isJpg ? 90 : undefined,
    omitBackground: Boolean(img.transparent)
  });
  fs.rmSync(tmp);
  console.log("rendered", img.file);
}
await browser.close();
