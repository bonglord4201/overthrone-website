// Builds the OVERTHRONE Tebex catalogue documents from catalogue-data.mjs.
//
//   node tebex-storefront/catalogue/build-catalogue.mjs
//
// Outputs (in this folder):
//   packages.json          normalised package list (also used by render-images.mjs)
//   packages.csv           master package database (open in Excel / Google Sheets)
//   CATALOGUE.md           the full store catalogue
//   DEVELOPER-HANDOFF.md   backend systems + per-package delivery spec
//   IMAGE-PROMPTS.md       one image-generation prompt per package, crate and category

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as D from "./catalogue-data.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = (f, s) => { fs.writeFileSync(path.join(here, f), s); console.log("wrote", f); };
const { fmt } = D;
const money = (n) => Math.max(0.99, Math.ceil(n) - 0.01);
const num = (n) => n.toLocaleString("en-AU");
const pad = (n) => String(n).padStart(3, "0");

const crate = Object.fromEntries(D.CRATES.map((c) => [c.key, c]));
const rank = Object.fromEntries(D.RANKS.map((r) => [r.key, r]));
const cos = Object.fromEntries(D.COSMETICS.map((c) => [c.code, c]));

// Value helpers (used to show bundle savings honestly, from this catalogue's own prices).
const SHARD_RATE = 4.99 / 1000;
const keysValue = (keys = {}) => Object.entries(keys).reduce((s, [k, n]) => s + crate[k].base * n, 0);
const cosValue = (codes = []) => codes.reduce((s, c) => s + (cos[c] ? D.RARITY_PRICE[cos[c].rarity] : 0), 0);
const describeContents = (c) => [
  c.rank ? `${rank[c.rank].name} rank` : null,
  ...Object.entries(c.keys || {}).map(([k, n]) => `${n}× ${crate[k].keyName}`),
  c.shards ? `${num(c.shards)} Throne Shards` : null,
  ...(c.cosmetics || []).map((code) => cos[code] ? `${cos[code].name} (${cos[code].type})` : code.replace(/_/g, " ").toLowerCase())
].filter(Boolean).join("; ");
const commandsFor = (c) => [
  c.rank ? `<GRANT_RANK:${c.rank}>` : null,
  ...Object.entries(c.keys || {}).map(([k, n]) => `<GIVE_KEYS:${k}:${n}>`),
  c.shards ? `<GIVE_SHARDS:${c.shards}>` : null,
  ...(c.cosmetics || []).map((code) => `<GRANT_COSMETIC:${code}>`)
].filter(Boolean).join(" + ");
const systemsFor = (c) => [...new Set([
  c.rank && "SYS-RANKS", Object.keys(c.keys || {}).length && "SYS-KEYS",
  c.shards && "SYS-SHARDS", (c.cosmetics || []).length && "SYS-COSMETICS"
].filter(Boolean))].join(", ");

const COLOR_WORD = (hex) => ({
  "#E0434F": "crimson", "#9B6BFF": "violet", "#E39B5B": "burnished bronze", "#F2C14E": "molten gold",
  "#D7DAE0": "cold silver-white", "#FF3B4E": "blood-red", "#B0122C": "deep blood-crimson", "#FF2E4D": "crimson and dark-gold",
  "#F2A541": "amber ember", "#D61F3C": "blood-moon red", "#7B4DFF": "violet void", "#FF6A1A": "molten orange", "#E6C068": "dark gold"
}[hex] || "crimson");
const RARITY_COLOR = { Common: "#A39D94", Rare: "#4FA3FF", Epic: "#9B6BFF", Legendary: "#F2C14E", Mythic: "#FF2E4D" };

// ------------------------------------------------------------------ build package list
const P = [];
const add = (p) => P.push({ status: "Ready – awaiting dev command", gift: "Enable Tebex gifting", ...p });

for (const r of D.RANKS) {
  add({
    id: r.id, category: "Ranks", name: `${r.name} Rank`, price: r.price, type: "Rank (lifetime)", rarity: `Tier ${r.tier}`,
    contents: r.perks.join("; "), description: r.short, system: "SYS-RANKS, SYS-KEYS, SYS-SHARDS, SYS-COSMETICS, SYS-QUEUE, SYS-DISCORD",
    command: `<GRANT_RANK:${r.key}> + ${Object.entries(r.grants.keys).map(([k, n]) => `<GIVE_KEYS:${k}:${n}>`).join(" + ")} + <GIVE_SHARDS:${r.grants.shards}> + ${r.grants.cosmetics.map((c) => `<GRANT_COSMETIC:${c}>`).join(" + ")} + Tebex Discord Action: add role @${r.discord}`,
    color: r.color, icon: "crown", label: `TIER ${r.tier} RANK`, sub: r.name.toUpperCase(),
    art: `a majestic ${COLOR_WORD(r.color)} crown-and-crest rank emblem for the "${r.name}" rank – ${r.lore}`
  });
}

let k = 0;
for (const c of D.CRATES) {
  for (const q of D.KEY_QTYS) {
    k++;
    const price = money(c.base * q.qty * (1 - q.discount));
    add({
      id: `KEY-${pad(k)}`, category: "Crate Keys", name: `${c.keyName} ×${q.qty}`, price, type: "Crate key",
      rarity: c.prestige, contents: `${q.qty}× ${c.keyName} for the ${c.name}${q.discount ? ` (${Math.round(q.discount * 100)}% bulk saving)` : ""}`,
      description: `${q.qty === 1 ? "One" : q.qty} ${c.keyName}${q.qty > 1 ? "s" : ""}. ${c.lore} All rewards are cosmetic or Throne Shards; odds are shown in the description.`,
      system: "SYS-CRATES, SYS-KEYS", command: `<GIVE_KEYS:${c.key}:${q.qty}>`,
      color: c.color, icon: "key", label: `${c.prestige.toUpperCase()} KEY`, sub: `×${q.qty}`, qty: q.qty,
      art: `${q.qty === 1 ? c.keyArt : `${q.qty > 10 ? "a large heap" : "a small cluster"} of ${c.keyName}s – each ${c.keyArt}`}`
    });
  }
}
for (const [i, kb] of [
  { name: "Gate Key Sampler", price: 29.99, keys: { EMBER: 1, BLOODMOON: 1, ABYSSAL: 1, DREADFORGE: 1, REGALIA: 1, THRONE: 1 }, desc: "One key for every Gate Crate – try them all.", art: "six different keys (amber, crimson, violet, molten orange, gold and crimson-gold) laid in a fan on black velvet" },
  { name: "Lower Gates Key Cache", price: 24.99, keys: { EMBER: 5, BLOODMOON: 3, ABYSSAL: 2 }, desc: "A mix of Ember, Bloodmoon and Abyssal keys.", art: "an iron key cache box holding amber, crimson and violet keys" },
  { name: "High Gates Key Vault", price: 89.99, keys: { DREADFORGE: 3, REGALIA: 3, THRONE: 3 }, desc: "Dreadforge, Regalia and Throne keys for the prestige crates.", art: "a black-and-gold vault door ajar with molten, gold and crimson keys inside" }
].entries()) {
  add({
    id: `KEY-${pad(37 + i)}`, category: "Crate Keys", name: kb.name, price: kb.price, type: "Key bundle", rarity: "Mixed",
    contents: describeContents({ keys: kb.keys }), description: kb.desc, system: "SYS-CRATES, SYS-KEYS", command: commandsFor({ keys: kb.keys }),
    color: "#FF2E4D", icon: "key", label: "KEY BUNDLE", sub: "MIXED KEYS", art: kb.art,
    value: keysValue(kb.keys)
  });
}

D.SHARD_PACKS.forEach((s, i) => {
  const total = Math.round(s.qty * (1 + s.bonus));
  add({
    id: `SHARD-${pad(i + 1)}`, category: "Throne Shards", name: `${D.SHARD_NAMES[i]}: ${num(s.qty)} Throne Shards`, price: s.price, type: "Premium currency",
    rarity: ["Common", "Common", "Rare", "Rare", "Epic", "Legendary", "Mythic"][i],
    contents: `${num(s.qty)} Throne Shards${s.bonus ? ` + ${Math.round(s.bonus * 100)}% bonus (${num(total - s.qty)}) = ${num(total)}` : ""}`,
    description: `${num(total)} Throne Shards to spend in the in-game Throne Vault on cosmetics.${s.bonus ? ` Includes a ${Math.round(s.bonus * 100)}% bonus.` : ""} Shards can't buy gameplay items.`,
    system: "SYS-SHARDS", command: `<GIVE_SHARDS:${total}>`, color: "#FF2E4D", icon: "shards",
    label: s.bonus ? `+${Math.round(s.bonus * 100)}% BONUS` : "THRONE SHARDS", sub: num(s.qty), bonus: s.bonus,
    art: `${["a small pouch of", "a satchel of", "a small coffer of", "a chest of", "a vault pile of", "a towering hoard of", "a royal treasury overflowing with"][i]} glowing blood-red throne shard crystals with dark-gold flecks`
  });
});

let ci = 0, pi = 0;
for (const c of D.COSMETICS) {
  const isPet = c.cat === "pets";
  add({
    id: isPet ? `PET-${pad(++pi)}` : `COS-${pad(++ci)}`, category: isPet ? "Pets" : "Cosmetics", name: c.name, price: D.RARITY_PRICE[c.rarity],
    type: c.type, rarity: c.rarity, contents: `${c.name} (${c.type})`, description: c.desc,
    system: c.type === "Pet" ? "SYS-PETS" : /Skin/.test(c.type) ? "SYS-SKINS" : c.type === "Emote" ? "SYS-EMOTES" : /Title|Tag/.test(c.type) ? "SYS-TITLES" : c.type === "Chat Effect" ? "SYS-CHAT" : "SYS-COSMETICS",
    command: `<GRANT_COSMETIC:${c.code}>`, color: RARITY_COLOR[c.rarity], icon: iconForType(c.type),
    label: `${c.rarity.toUpperCase()} ${c.type.toUpperCase()}`, sub: c.type.toUpperCase(), art: c.art, code: c.code
  });
}
function iconForType(t) {
  return { Aura: "aura", Trail: "trail", Particle: "aura", "Kill Effect": "skull", "Death Effect": "skull", Title: "scroll", "Chat Tag": "sigil",
    "Mount Skin": "horseshoe", "Weapon Skin": "sword", "Armour Skin": "shield", Emote: "banner", "Spawn Effect": "portal",
    "Teleport Effect": "portal", "Chat Effect": "bubble", Pet: "pet" }[t] || "aura";
}

for (const b of D.BUNDLES) {
  const value = (b.contents.rank ? rank[b.contents.rank].price : 0) + keysValue(b.contents.keys) + (b.contents.shards || 0) * SHARD_RATE + cosValue(b.contents.cosmetics);
  const price = money(value * 0.62);
  add({
    id: b.id, category: "Bundles", name: b.name, price, type: "Bundle", rarity: b.rarity, contents: describeContents(b.contents),
    description: b.desc, system: systemsFor(b.contents), command: commandsFor(b.contents),
    color: RARITY_COLOR[b.rarity], icon: "bundle", label: `${b.rarity.toUpperCase()} BUNDLE`, sub: "BUNDLE", art: b.art,
    value: Math.round(value * 100) / 100
  });
}

D.FEATURED.forEach((f, i) => add({
  id: `FEAT-${pad(i + 1)}`, category: "Featured", name: f.name, price: f.price, type: `Featured (${f.window})`, rarity: f.rarity,
  contents: f.desc, description: f.desc, system: sysFromCmd(f.deliver), command: f.deliver, color: RARITY_COLOR[f.rarity], icon: "featured",
  label: "FEATURED", sub: f.window.toUpperCase(), art: f.art, status: "Rotation – enable while featured"
}));

D.BOOSTERS.forEach((b, i) => D.BOOST_DURATIONS.forEach((d, j) => add({
  id: `BOOST-${pad(i * 4 + j + 1)}`, category: "Boosters", name: `${b.name} (${d.label})`, price: d.price, type: "Global booster",
  rarity: ["Common", "Rare", "Epic", "Legendary"][j], contents: `${b.effect} for ${d.label.toLowerCase()}`,
  description: `${b.effect} for ${d.label.toLowerCase()}. Global: everyone online benefits, and your name is announced as the booster. Boosts of the same type queue rather than stack.`,
  system: "SYS-BOOSTERS", command: `<START_GLOBAL_BOOST:${b.code}:${d.mins}>`, color: ["#4FA3FF", "#9B6BFF", "#F2C14E", "#FF2E4D"][j],
  icon: "booster", label: "GLOBAL BOOST", sub: d.label.toUpperCase(), art: `${b.art}, with a glowing hourglass motif`, gift: "Not giftable (global)"
})));

D.STARTERS.forEach((s, i) => add({
  id: `START-${pad(i + 1)}`, category: "Starter", name: s.name, price: s.price, type: "Starter pack (limit 1 per player)", rarity: "Starter",
  contents: s.desc, description: s.desc + " One per player.", system: sysFromCmd(s.deliver), command: s.deliver,
  color: "#E0434F", icon: "starter", label: "STARTER PACK", sub: "NEW HUNTERS", art: s.art
}));

D.EVENTS.forEach((e, i) => add({
  id: `EVENT-${pad(i + 1)}`, category: "Seasonal", name: e.name, price: e.price, type: `Event: ${e.event}`, rarity: "Event",
  contents: e.desc, description: `[${e.event.toUpperCase()} EVENT] ${e.desc} Available during the event only.`, system: sysFromCmd(e.deliver) + ", SYS-EVENTS",
  command: e.deliver, color: "#D61F3C", icon: "moon", label: `${e.event.toUpperCase()} EVENT`, sub: "LIMITED", art: e.art,
  status: "Event – keep disabled until the event"
}));

D.GIFTS.forEach((g, i) => add({
  id: `GIFT-${pad(i + 1)}`, category: "Gifts", name: g.name, price: g.price, type: "Gift (recipient username variable)", rarity: "Gift",
  contents: g.desc, description: g.desc, system: sysFromCmd(g.deliver) + ", SYS-GIFTS", command: g.deliver,
  color: "#E6C068", icon: "gift", label: "GIFT", sub: "FOR A FRIEND", art: g.art, gift: "Is a gift package"
}));

D.UTILITY.forEach((u, i) => add({
  id: `UTIL-${pad(i + 1)}`, category: "Utility", name: u.name, price: u.price, type: "Utility token", rarity: "Utility",
  contents: u.desc, description: u.desc + " No gameplay effect.", system: "SYS-TOKENS" + (/QUEUE/.test(u.deliver) ? ", SYS-QUEUE" : ""),
  command: u.deliver, color: "#C3C6CC", icon: "token", label: "UTILITY", sub: "TOKEN", art: u.art
}));

function sysFromCmd(cmd) {
  const s = new Set();
  if (/GRANT_RANK/.test(cmd)) s.add("SYS-RANKS");
  if (/GIVE_KEYS/.test(cmd)) s.add("SYS-KEYS");
  if (/GIVE_SHARDS/.test(cmd)) s.add("SYS-SHARDS");
  if (/GRANT_COSMETIC/.test(cmd)) s.add("SYS-COSMETICS");
  if (/GLOBAL_BOOST/.test(cmd)) s.add("SYS-BOOSTERS");
  if (/TOKEN|TEMP_PERMISSION/.test(cmd)) s.add("SYS-TOKENS");
  return [...s].join(", ");
}

// image file per package
for (const p of P) p.image = `images/${p.id}.jpg`;

// ------------------------------------------------------------------ outputs
out("packages.json", JSON.stringify(P, null, 2));

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const cols = ["ID", "CATEGORY", "PACKAGE", "PRICE AUD", "TYPE", "CONTENTS", "RARITY", "DEV SYSTEM", "COMMAND PLACEHOLDER", "IMAGE", "STATUS", "DESCRIPTION", "GIFTING"];
out("packages.csv", "﻿" + [cols.map(csvCell).join(","), ...P.map((p) =>
  [p.id, p.category, p.name, p.price.toFixed(2), p.type, p.contents, p.rarity, p.system, p.command, p.image, p.status, p.description, p.gift].map(csvCell).join(","))].join("\r\n"));

// ---------- CATALOGUE.md
const byCat = (c) => P.filter((p) => p.category === c);
let md = `# OVERTHRONE SMP – Tebex Store Catalogue

*“${D.BRAND.slogan}”*

${P.length} packages across ${D.CATEGORIES.length} categories. Prices are recommendations in AUD.
Package IDs match \`packages.csv\`, \`DEVELOPER-HANDOFF.md\`, \`IMAGE-PROMPTS.md\` and the image files in \`images/\`.

## Store rules (read first)

This catalogue is built to pass **Tebex store review** under Mojang's Minecraft Usage Guidelines:

- **Nothing sold makes a paying player stronger.** No gear, kits, /fly, extra lives, personal XP or drop boosts, or paid-only content access.
- **Ranks** give prestige, cosmetics, chat perks, queue priority, Discord roles and one-time cosmetic currency or keys.
- **Crates** only contain cosmetics or Throne Shards. Odds are published, and keys are also earnable through play (voting, events, Gates).
- **Throne Shards** can only be spent on cosmetics in the in-game Throne Vault.
- **Boosters are global.** Everyone online benefits equally.
- **No capes or cape-like back cosmetics.** These are not allowed under the guidelines.
- **Hunter Ranks (E → ???) are earned through gameplay and are never sold.**

---

## 1. Final rank system

Lifetime ranks, cumulative: each rank includes everything below it.

| Tier | Rank | Discord role | Tebex package | Colour | Icon | Price |
|---|---|---|---|---|---|---|
${D.RANKS.map((r) => `| ${r.tier} | **${r.name.toUpperCase()}** | @${r.discord} | ${r.name} Rank (${r.id}) | \`${r.gradient ? r.gradient.join(" → ") : r.color}\` | ${r.icon} | ${fmt(r.price)} |`).join("\n")}

${D.RANKS.map((r) => `### ${r.icon} ${r.name.toUpperCase()} · ${r.id} · ${fmt(r.price)}
- **Lore:** ${r.lore}
- **Short description:** ${r.short}
- **Full description:** The ${r.name} rank is a lifetime rank on OVERTHRONE SMP. ${r.short} All perks are cosmetic or convenience only – no gameplay advantage.
- **Perks:**
${r.perks.map((x) => `  - ${x}`).join("\n")}
- **Commands required:** ${P.find((p) => p.id === r.id).command}
- **Developer requirements:**
  - Permission group \`${r.key.toLowerCase()}\` inheriting the rank below.
  - Prefix in colour \`${r.color}\`${r.gradient ? " (animated gradient)" : ""}.
  - Discord role sync (Tebex Discord Action).
  - Rank-exclusive cosmetics registered: ${r.grants.cosmetics.join(", ")}.
- **Image:** \`images/${r.id}.jpg\` · prompt in IMAGE-PROMPTS.md
`).join("\n")}
**Upgrades:** you can later add "Upgrade to X" packages priced at the difference between ranks. The developer just needs to remove the old group when granting the new one.

---

## 2. Crate system

Every crate has five reward tiers. All rewards are cosmetic or Throne Shards. Duplicate cosmetics convert to Throne Shards.

| Crate | Prestige | Key | Colour | Base key price | Common | Rare | Epic | Legendary | Mythic (jackpot) |
|---|---|---|---|---|---|---|---|---|---|
${D.CRATES.map((c) => `| **${c.name}** | ${c.prestige} | ${c.keyName} | \`${c.color}\` | ${fmt(c.base)} | ${c.odds.join("% | ")}% |`).join("\n")}

${D.CRATES.map((c) => `### ${c.name}
- **Lore:** ${c.lore}
- **Tier:** ${c.tier} (${c.prestige})
- **Key:** ${c.keyName}
- **Key art:** ${c.keyArt}
- **Crate art:** ${c.crateArt}
- **Rewards by tier:**
${D.CRATE_TIERS.map((t, i) => `  - **${t}** (${c.odds[i]}%): ${c.rewards[i]}`).join("\n")}
- **Jackpot:** ${c.jackpot}
- **Key prices:** ${D.KEY_QTYS.map((q) => `${q.qty}× ${fmt(money(c.base * q.qty * (1 - q.discount)))}`).join(" · ")}
- **Developer requirements:**
  - Crate \`${c.key.toLowerCase()}\` with the odds above.
  - Virtual keys delivered by command; works when the player is offline.
  - Duplicate → shards conversion.
  - Odds visible in-game.
  - In-game key sources (vote, events, Gate drops) so the crate is also free to earn.
`).join("\n")}
---

## 3. Crate key packages

| ID | Package | Price | Contents |
|---|---|---|---|
${byCat("Crate Keys").map((p) => `| ${p.id} | ${p.name} | ${fmt(p.price)} | ${p.contents} |`).join("\n")}

Bulk discounts: 5 keys −10%, 10 keys −15%, 25 keys −20%, 50 keys −25%, 100 keys −30%.

---

## 4. Throne Shard packages

Throne Shards are a premium **cosmetic-only** currency, spent in the in-game **Throne Vault**.

| ID | Package | Price | Contents |
|---|---|---|---|
${byCat("Throne Shards").map((p) => `| ${p.id} | ${p.name} | ${fmt(p.price)} | ${p.contents} |`).join("\n")}

---

## 5. Cosmetics and pets (${byCat("Cosmetics").length + byCat("Pets").length})

All cosmetics are visual only. Skins never change stats; pets never fight.
Prices by rarity: ${Object.entries(D.RARITY_PRICE).map(([r, v]) => `${r} ${fmt(v)}`).join(" · ")}

| ID | Name | Category | Rarity | Price | Description | Dev system |
|---|---|---|---|---|---|---|
${[...byCat("Cosmetics"), ...byCat("Pets")].map((p) => `| ${p.id} | ${p.name} | ${p.type} | ${p.rarity} | ${fmt(p.price)} | ${p.description} | ${p.system} |`).join("\n")}

---

## 6. Bundles (${byCat("Bundles").length})

"Value" is the sum of the items at this catalogue's own prices. Bundles are priced at about 38% off.

| ID | Bundle | Contents | Value | Price | Saving |
|---|---|---|---|---|---|
${byCat("Bundles").map((p) => `| ${p.id} | **${p.name}** | ${p.contents} | ${fmt(p.value)} | ${fmt(p.price)} | ${Math.round((1 - p.price / p.value) * 100)}% |`).join("\n")}

${byCat("Bundles").map((p) => `- **${p.name}:** ${p.description}`).join("\n")}

---

## 7. Featured products (${byCat("Featured").length}, rotate through the year)

| ID | Product | Window | Price | Description |
|---|---|---|---|---|
${byCat("Featured").map((p) => `| ${p.id} | ${p.name} | ${p.type.slice(10, -1)} | ${fmt(p.price)} | ${p.description} |`).join("\n")}

Limited items ("Founder", monthly relics) should be retired after their window and never re-sold, so they stay meaningful.

---

## 8. Global boosters (${byCat("Boosters").length})

Every booster is **server-wide**: all online players get the effect and the buyer is announced.
Same-type boosts **queue** rather than stack, and each effect is capped.

| Booster | 1 Hour | 3 Hours | 6 Hours | 24 Hours |
|---|---|---|---|---|
${D.BOOSTERS.map((b, i) => `| **${b.name}**: ${b.effect} | ${D.BOOST_DURATIONS.map((d, j) => `${fmt(d.price)} (BOOST-${pad(i * 4 + j + 1)})`).join(" | ")} |`).join("\n")}

---

## 9. Starter products (${byCat("Starter").length}, limit 1 per player)

| ID | Package | Price | Contents |
|---|---|---|---|
${byCat("Starter").map((p) => `| ${p.id} | ${p.name} | ${fmt(p.price)} | ${p.contents} |`).join("\n")}

---

## 10. Seasonal and event products (${byCat("Seasonal").length})

Keep these **disabled** in Tebex until their event starts.

| ID | Event | Package | Price | Contents |
|---|---|---|---|---|
${byCat("Seasonal").map((p) => `| ${p.id} | ${p.type.replace("Event: ", "")} | ${p.name} | ${fmt(p.price)} | ${p.contents} |`).join("\n")}

---

## 11. Gift products (${byCat("Gifts").length}) and utility (${byCat("Utility").length})

Gift packages use a Tebex **Variable** for the recipient's username (Package → Variables tab).
Every other package can also be gifted with Tebex's built-in **Gifting** tab.

| ID | Package | Price | Contents |
|---|---|---|---|
${[...byCat("Gifts"), ...byCat("Utility")].map((p) => `| ${p.id} | ${p.name} | ${fmt(p.price)} | ${p.contents} |`).join("\n")}

---

## 12. Package database

See **\`packages.csv\`** (${P.length} rows). Columns: ID, CATEGORY, PACKAGE, PRICE AUD, TYPE, CONTENTS, RARITY, DEV SYSTEM, COMMAND PLACEHOLDER, IMAGE, STATUS, DESCRIPTION, GIFTING.

## 13. Developer handoff

See **\`DEVELOPER-HANDOFF.md\`**.

## 14–16. Images and prompts

- Ready-made branded images for every package and category are in \`images/\` and \`images/categories/\`.
- **\`IMAGE-PROMPTS.md\`** has an individual AI-art prompt for every package, crate and category, if you want to replace any image with painted artwork later.

---

## 17. Final Tebex store structure

Create the categories in this order:

${D.CATEGORIES.map((c, i) => `${i + 1}. **${c.name}** – ${c.note} (${P.filter((p) => p.category === c.name).length} packages)`).join("\n")}

**Recommended Tebex settings:**
- Enable gifting on ranks, keys, shards and cosmetics.
- Set "limit 1 per customer" on Starter packages and Founder items.
- Set "require player online" OFF wherever the developer supports offline delivery.
- Put crate odds in every key package description.
- Keep Seasonal packages disabled until their event.
`;
out("CATALOGUE.md", md);

// ---------- DEVELOPER-HANDOFF.md
const SYSTEMS = [
  ["SYS-TEBEX", "Tebex plugin", "Install the Tebex plugin that supports NeoForge 1.21.1 (confirm compatibility) and add the store secret key on the server only. Commands use Tebex's `{username}` placeholder. Prefer offline-safe delivery."],
  ["SYS-RANKS", "Rank groups", "8 lifetime groups (supporter → thronebreaker), each inheriting the one below. Prefix, coloured name, chat/tab formatting. Thronebreaker has an animated crimson-gold prefix. Upgrades remove the lower group."],
  ["SYS-DISCORD", "Discord role sync", "Use Tebex's built-in **Discord Actions** deliverable to add roles @Supporter … @Thronebreaker. Requires linking the Tebex Discord bot."],
  ["SYS-QUEUE", "Queue priority", "Join-queue priority tiers 1–8 (by rank) plus a 30-day pass (UTIL). No gameplay effect."],
  ["SYS-CRATES", "Gate Crates", "6 crates (Ember, Bloodmoon, Abyssal, Dreadforge, Regalia, Throne) plus event crates. Odds per the catalogue. Cosmetic/shard rewards only. Duplicate → shards. Odds shown in-game. Opening animation in a Crate Hall at spawn."],
  ["SYS-KEYS", "Virtual keys", "Key balances per player and crate; deliverable while offline. Free key sources in gameplay (voting, events, Gate clears, Global Luck Boost)."],
  ["SYS-SHARDS", "Throne Shards + Throne Vault", "Premium currency balance per player; deliverable while offline. In-game Throne Vault GUI that sells ONLY cosmetics. Never convertible to gameplay currency or items."],
  ["SYS-COSMETICS", "Cosmetics engine", "Auras, trails, particles, kill effects, death effects, spawn effects and teleport effects. Players toggle them in a /cosmetics wardrobe. Per-player unlock storage."],
  ["SYS-TITLES", "Titles and chat tags", "Selectable titles under the name, chat tags before the name. Custom-title token (staff approval)."],
  ["SYS-CHAT", "Chat effects", "Chat colours, gradients (Silver Dawn, Crimson Gradient), Gilded Name Shimmer, emoji packs."],
  ["SYS-PETS", "Cosmetic pets", "Follower pets with no combat, collision or item pickup. Summon or dismiss from the wardrobe. Custom pet names (Thronebreaker)."],
  ["SYS-SKINS", "Weapon, armour and mount skins", "Resource-pack models (e.g. custom model data) that change appearance only, never stats. Applied via the wardrobe."],
  ["SYS-EMOTES", "Emotes", "Emote playback (an emote mod or equivalent)."],
  ["SYS-BOOSTERS", "Global boosters", "Server-wide timed boosts (XP, currency, drops, key-find luck, Hunter XP, Gate rewards, party). Same-type boosts queue; announce the buyer; boss bar timer; effect caps."],
  ["SYS-TOKENS", "Tokens and temporary permissions", "Nick (30 days), name colour, prefix colour, wardrobe slots, guild banner slot. Temporary permissions expire automatically."],
  ["SYS-GIFTS", "Gift delivery", "Gift packages read the recipient's username from a Tebex Variable and deliver to that player instead of the buyer."],
  ["SYS-EVENTS", "Event content", "Event-only cosmetics, event crates and keys; toggled on for each event."],
  ["SYS-HALL", "Hall of Thrones", "List of Thronebreaker holders. Can be posted on the website (admin panel) and Discord."]
];
let dev = `# OVERTHRONE SMP – Developer Handoff (Tebex packages)

The store owner has created every package in Tebex. Each one needs a **real command** in place of its **placeholder**.

**How to use this document:**
1. Build the backend systems listed below.
2. For each package, write the real command(s) that perform the "Delivery".
3. Send the owner a list of: **ID → real command(s)**. The owner pastes them into Tebex (Package → Game Server Commands).

**Rules:**
- **Never put the Tebex secret key in the website, GitHub or Discord.** It only goes in the server's Tebex plugin config.
- **Everything must stay non-competitive:**
  - Cosmetics never change stats.
  - Crate and Throne Vault rewards are cosmetic or shards only.
  - Boosters are global.
- **Placeholder syntax:** \`<ACTION:ARG:ARG>\`. A \`{recipient}\` argument means "deliver to the gift recipient (Tebex Variable)". Otherwise deliver to \`{username}\`.

## Backend systems required

| ID | System | What it must do |
|---|---|---|
${SYSTEMS.map(([id, n, d]) => `| ${id} | ${n} | ${d} |`).join("\n")}

## Placeholder reference

| Placeholder | Meaning |
|---|---|
| \`<GRANT_RANK:RANK>\` | Add the player to the rank group (permanent) |
| \`<GIVE_KEYS:CRATE:N>\` | Give N virtual keys for the crate |
| \`<GIVE_SHARDS:N>\` | Add N Throne Shards |
| \`<GRANT_COSMETIC:CODE>\` | Unlock the cosmetic CODE (permanent) |
| \`<START_GLOBAL_BOOST:TYPE:MINUTES>\` | Start (or queue) a server-wide boost |
| \`<GRANT_TOKEN:TYPE:N>\` | Give N single-use tokens |
| \`<GRANT_TEMP_PERMISSION:PERM:30d>\` | Temporary permission that expires |
| Tebex Discord Action | Configured in Tebex, not a server command |

## Cosmetic codes to implement (${D.COSMETICS.length} catalogue + rank/event exclusives)

| Code | Name | Type | Rarity |
|---|---|---|---|
${D.COSMETICS.map((c) => `| \`${c.code}\` | ${c.name} | ${c.type} | ${c.rarity} |`).join("\n")}

**Also required** (exclusives referenced by ranks, crates, featured and events):
${[...new Set(P.flatMap((p) => (p.command.match(/GRANT_COSMETIC:([A-Z0-9_]+)/g) || []).map((m) => m.split(":")[1])))].filter((c) => !cos[c]).map((c) => `\`${c}\``).join(", ")}

Plus the crate jackpots: Ashen Halo, Bloodmoon Eclipse aura, Voidborn Wraith, Molten Throne set, Gilded Regalia set, The Empty Throne + "Throne Taker".

## Per-package delivery (${P.length} packages)

${D.CATEGORIES.map((c) => {
  const items = P.filter((p) => p.category === c.name);
  if (!items.length) return "";
  return `### ${c.name}

${items.map((p) => `**${p.id}: ${p.name}** (${fmt(p.price)})
- System required: ${p.system}
- Delivery: ${p.contents}
- Tebex command: \`${p.command}\`
- Real command: ____________________`).join("\n\n")}
`;
}).join("\n")}
`;
out("DEVELOPER-HANDOFF.md", dev);

// ---------- IMAGE-PROMPTS.md
const STYLE = "Square 1:1 premium dark-fantasy MMORPG game-store item artwork. Single centred subject on a pure black background. Obsidian surfaces, dark-gold filigree accents, glowing {ACCENT} energy, drifting crimson embers and thin dark smoke, cinematic rim lighting, intricate detail, high-end painterly 3D render, AAA game store quality.";
const NEG = "text, letters, words, numbers, logo, watermark, signature, border, frame, collage, grid, multiple panels, Minecraft blocks, Minecraft screenshot, pixel art, cartoon, chibi, anime, low detail, blurry, copyrighted characters, existing game logos, capes, cloaks";
const prompt = (id, name, subject, accent) => `### ${id}: ${name}
- **IMAGE ID:** ${id}
- **PACKAGE:** ${name}
- **File:** \`images/${id}.jpg\`
- **Prompt:** ${STYLE.replace("{ACCENT}", accent)} Subject: ${subject}. No text anywhere in the image.
- **Negative prompt:** ${NEG}
`;
const accentFor = (p) => COLOR_WORD(p.color) === "crimson" ? ({ "#4FA3FF": "cold blue-white", "#9B6BFF": "violet", "#F2C14E": "molten gold", "#A39D94": "ash-grey", "#C3C6CC": "silver", "#E6C068": "dark gold" }[p.color] || "crimson") : COLOR_WORD(p.color);
let img = `# OVERTHRONE SMP – Image list and generation prompts

There is **one image per package**, and one per crate and category. Generate them **one at a time**: no collages, no grids, no text in the image.

Every image in this list already exists as a ready-to-use branded image in \`images/\`. Use these prompts if you want painted AI artwork instead.
Upload the result to the matching Tebex package. Recommended size: 1024×1024 or larger, exported as JPG or PNG.

**Shared style (applies to all prompts):** ${STYLE.replace("{ACCENT}", "crimson")}
**Shared negative prompt:** ${NEG}

## 14. Complete image list (${P.length + D.CRATES.length + D.CATEGORIES.length} images)

| IMAGE ID | Package | File |
|---|---|---|
${P.map((p) => `| ${p.id} | ${p.name} | images/${p.id}.jpg |`).join("\n")}
${D.CRATES.map((c, i) => `| CRATE-${pad(i + 1)} | ${c.name} (crate artwork) | images/CRATE-${pad(i + 1)}.jpg |`).join("\n")}
${D.CATEGORIES.map((c) => `| CAT-${c.key.toUpperCase()} | ${c.name} (category) | images/categories/${c.key}.jpg |`).join("\n")}

## 15. Individual prompts

${P.map((p) => prompt(p.id, p.name, p.art, accentFor(p))).join("\n")}

### Crate artwork

${D.CRATES.map((c, i) => prompt(`CRATE-${pad(i + 1)}`, c.name, c.crateArt, COLOR_WORD(c.color))).join("\n")}

## 16. Category art prompts

Keep these matching the existing category tiles: a single silver-and-crimson emblem on a black background with a crimson glow and a thin square frame.

${D.CATEGORIES.map((c) => prompt(`CAT-${c.key.toUpperCase()}`, c.name, `a single ornate silver emblem representing "${c.name}" (${c.note.toLowerCase()}), crimson gemstone accents, centred, inside a thin dark square frame with corner brackets`, "crimson")).join("\n")}
`;
out("IMAGE-PROMPTS.md", img);

console.log(P.length, "packages");
const counts = {};
for (const p of P) counts[p.category] = (counts[p.category] || 0) + 1;
console.log(counts);
