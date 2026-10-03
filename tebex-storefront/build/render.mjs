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

// Carousel slides ----------------------------------------------------
// The Tebex carousel uses one image for every screen size and, on phones,
// crops it to roughly the middle 500px. Everything that must be readable
// sits inside a centred 460px-wide safe zone; the sides are decoration only.
const SANS = "system-ui,'Segoe UI',Arial,sans-serif";
const diamond = '<span style="color:#c51c38">◆</span>';
const watermark = `<div class="silver" style="position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;font-size:330px;font-weight:600;letter-spacing:.12em;opacity:.022;white-space:nowrap">OVERTHRONE</div>`;
const flank = `<div style="position:absolute;top:50%;left:0;right:0;height:0">
  <div style="position:absolute;right:calc(50% + 300px);width:520px;height:1px;background:linear-gradient(270deg,rgba(197,28,56,.8),transparent)"></div>
  <div style="position:absolute;left:calc(50% + 300px);width:520px;height:1px;background:linear-gradient(90deg,rgba(197,28,56,.8),transparent)"></div>
  <div style="position:absolute;right:calc(50% + 294px);top:-5px;width:10px;height:10px;transform:rotate(45deg);background:#c51c38"></div>
  <div style="position:absolute;left:calc(50% + 294px);top:-5px;width:10px;height:10px;transform:rotate(45deg);background:#c51c38"></div></div>`;
const centred = (inner) => `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">${inner}</div>`;
const rule = '<div class="rule" style="width:220px;margin:22px auto;background:linear-gradient(90deg,transparent,#c51c38,transparent)"></div>';
const carousel = (file, seed, inner, withFlank = true) =>
  add(file, 1920, 640, `${backdrop(1920, 640, seed, { gx: "50%", gy: "50%" })}${watermark}${withFlank ? flank : ""}<div class="frame" style="--inset:20px"></div>${centred(inner)}`);

carousel("carousel/01-hero-v2-1920x640.jpg", 11, `
  <img class="logo" src="${LOGO}" width="390" height="390" style="margin-top:-18px">
  <p style="font-size:34px;line-height:1.25;color:#e9e4da;margin-top:2px">Don’t reach the throne.<br>Overthrow it.</p>
  <p style="font-family:${SANS};font-size:17px;letter-spacing:.3em;color:#a39d94;margin-top:16px">OVERTHRONESMP.NET</p>`, false);

carousel("carousel/02-realms-v2-1920x640.jpg", 21, `
  <p class="eyebrow" style="font-size:17px">The World of Overthrone</p>
  <div class="silver" style="font-size:74px;font-weight:600;letter-spacing:.04em;line-height:1.05;margin-top:18px">SIX REALMS<br>AWAIT</div>
  ${rule}
  <p style="font-family:${SANS};font-weight:700;font-size:16px;letter-spacing:.2em;color:#c3c6cc;line-height:2">OVERTHRONE ${diamond} THE REALM<br>THE FRONTIER ${diamond} THE GATES<br>AEONIA ${diamond} NETHERFALL</p>`);

carousel("carousel/03-play-v2-1920x640.jpg", 31, `
  <p class="eyebrow" style="font-size:17px">Join the Hunt</p>
  <div class="silver" style="font-size:58px;font-weight:600;letter-spacing:.03em;line-height:1.1;margin-top:18px">OVERTHRONE<br>SMP.NET</div>
  ${rule}
  <p style="font-size:25px;color:#e9e4da">Copy the address and enter the realm.</p>
  <p style="font-family:${SANS};font-size:15px;letter-spacing:.2em;color:#a39d94;margin-top:16px;line-height:1.9">MINECRAFT 1.21.1 ${diamond} NEOFORGE<br>TENSURA: REINCARNATED</p>`);

carousel("carousel/04-discord-v2-1920x640.jpg", 41, `
  <p class="eyebrow" style="font-size:17px">Community</p>
  <div class="silver" style="font-size:78px;font-weight:600;letter-spacing:.04em;line-height:1.05;margin-top:18px">JOIN THE<br>DISCORD</div>
  ${rule}
  <p style="font-size:26px;line-height:1.35;color:#e9e4da">News, events and support<br>from the OVERTHRONE team.</p>`);

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
