// Builds the OVERTHRONE Tebex catalogue documents from catalogue-data.mjs.
//
//   node tebex-storefront/catalogue/build-catalogue.mjs
//
// Outputs: packages.json, packages.csv, CATALOGUE.md, DEVELOPER-HANDOFF.md, IMAGE-PROMPTS.md

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
const ORDER = D.RANK_ORDER.map((k) => rank[k]);

// ------------------------------------------------------------------ placeholders
// Internal shorthand in catalogue-data.mjs → the owner's placeholder style.
// {username} is Tebex's real placeholder for the buyer; {recipient} is a Tebex package variable (gifts).
const who = (x) => (x ? x : "{username}");
function cmd(s) {
  return s
    .replace(/<GRANT_RANK:(\w+)(?::(\{recipient\}))?>/g, (_, r, p) => `<SET_RANK_COMMAND player=${who(p)} rank=${r.toLowerCase()}>`)
    .replace(/<GIVE_KEYS:(\w+):(\d+)(?::(\{recipient\}))?>/g, (_, c, n, p) => `<GIVE_CRATE_KEY_COMMAND player=${who(p)} crate=${c.toLowerCase()} amount=${n}>`)
    .replace(/<GIVE_SHARDS:(\d+)(?::(\{recipient\}))?>/g, (_, n, p) => `<GIVE_SHARDS_COMMAND player=${who(p)} amount=${n}>`)
    .replace(/<GRANT_COSMETIC:(\w+)(?::(\{recipient\}))?>/g, (_, c, p) => `<GRANT_COSMETIC_COMMAND player=${who(p)} id=${c.toLowerCase()}>`)
    .replace(/<START_GLOBAL_BOOST:(\w+):(\d+)>/g, (_, t, m) => `<START_GLOBAL_BOOST_COMMAND type=${t.toLowerCase()} minutes=${m} buyer={username}>`)
    .replace(/<GRANT_TOKEN:(\w+):(\d+)>/g, (_, t, n) => `<GIVE_TOKEN_COMMAND player={username} token=${t.toLowerCase()} amount=${n}>`)
    .replace(/<GRANT_TEMP_PERMISSION:(\w+):(\w+)>/g, (_, p, d) => `<GRANT_TEMP_PERMISSION_COMMAND player={username} permission=${p.toLowerCase()} duration=${d}>`);
}
const keysCmd = (keys = {}) => Object.entries(keys).map(([k, n]) => `<GIVE_KEYS:${k}:${n}>`);
const contentsCmd = (c) => cmd([c.rank ? `<GRANT_RANK:${c.rank}>` : null, ...keysCmd(c.keys), c.shards ? `<GIVE_SHARDS:${c.shards}>` : null, ...(c.cosmetics || []).map((x) => `<GRANT_COSMETIC:${x}>`)].filter(Boolean).join(" + "));
const cosName = (code) => cos[code] ? `${cos[code].name} (${cos[code].type})` : code.split("_").slice(1).map((w) => w[0] + w.slice(1).toLowerCase()).join(" ") + ` (${code.split("_")[0].toLowerCase()})`;
const describeContents = (c) => [
  c.rank ? `${rank[c.rank].name} rank` : null,
  ...Object.entries(c.keys || {}).map(([k, n]) => `${n}× ${crate[k].keyName}`),
  c.shards ? `${num(c.shards)} Throne Shards` : null,
  ...(c.cosmetics || []).map(cosName)
].filter(Boolean);

const SHARD_RATE = 4.99 / 1000;
const keysValue = (keys = {}) => Object.entries(keys).reduce((s, [k, n]) => s + crate[k].base * n, 0);
const cosValue = (codes = []) => codes.reduce((s, c) => s + (cos[c] ? D.RARITY_PRICE[cos[c].rarity] : 0), 0);
const RARITY_COLOR = { Common: "#A39D94", Rare: "#4FA3FF", Epic: "#9B6BFF", Legendary: "#F2C14E", Mythic: "#FF2E4D" };

const FOOT = "Delivered automatically in-game. Questions? Join our Discord.";
const block = (title, lines, footer = FOOT) => [title, "", ...lines, "", footer].join("\n");
const bullets = (arr) => arr.map((x) => `• ${x}`);
const oddsLines = (c) => D.CRATE_TIERS.map((t, i) => `• ${t} (${c.odds[i]}%): ${c.rewards[i]}`);

// ------------------------------------------------------------------ packages
const P = [];
const add = (p) => P.push({ compliance: "Safe", status: "DEV SYSTEM REQUIRED", gift: "Enable Tebex gifting", ...p });

// ----- ranks (OG-style perk lists built from the perk matrix)
const inc = D.PERKS.filter((p) => p.include);
const risky = D.PERKS.filter((p) => !p.include);
ORDER.forEach((r, i) => {
  const prev = ORDER[i - 1];
  const lines = inc.filter((p) => p.values[i] !== "✗" && p.values[i] !== (prev ? p.values[i - 1] : undefined) && p.kind !== "grant")
    .map((p) => (p.values[i] === "✓" ? p.perk : `${p.perk}: ${p.values[i]}`));
  const grants = inc.filter((p) => p.kind === "grant" && p.values[i] !== "✗").map((p) => `${p.perk.replace(" on purchase", "")}: ${p.values[i]}`);
  const optional = risky.filter((p) => p.values[i] !== "✗").map((p) => `${p.perk}: ${p.values[i]}`);
  const desc = block(`${r.icon} ${r.name.toUpperCase()} RANK · LIFETIME`, [
    r.lore, "",
    prev ? `ALL ${prev.name.toUpperCase()} PERKS, AND:` : "PERKS:",
    ...bullets(lines), "", "ON PURCHASE:", ...bullets(grants)
  ], "Lifetime rank. Cosmetic and convenience perks. " + FOOT);
  const ratings = inc.filter((p) => p.values[i] !== "✗").map((p) => p.rating);
  add({
    id: r.id, category: "Ranks", name: `${r.name} Rank`, price: r.price, type: `Donor rank (tier ${r.tier} of 5, lifetime)`, rarity: `Tier ${r.tier}`,
    contents: [...lines, ...grants].join("; "), tebex: desc, optional: optional.join("; "),
    system: "Permissions/prefix mod, crate system, Throne Shards, cosmetics, queue, Tebex Discord Actions",
    command: [cmd(`<GRANT_RANK:${r.key}>`), contentsCmd({ keys: r.grants.keys, shards: r.grants.shards, cosmetics: r.grants.cosmetics }),
      ...[["Class Reset Tokens on purchase", "class_reset"], ["Race Reset Token on purchase (Tensura)", "race_reset"]]
        .map(([perk, token]) => { const v = D.PERKS.find((x) => x.perk === perk).values[i]; return /^\d+$/.test(v) ? `<GIVE_TOKEN_COMMAND player={username} token=${token} amount=${v}>` : null; })
        .filter(Boolean), `Tebex Discord Action: add role @${r.discord}`].join(" + "),
    compliance: ratings.includes("Borderline") ? "Borderline (homes/claims/AH/reset tokens – see table)" : "Safe",
    color: r.color, art: `a majestic ${r.name} rank crest – ${r.lore} Main colour: ${r.color} on black, with crown, crest and banner motifs`
  });
});

// ----- crate keys
let k = 0;
for (const c of D.CRATES) {
  for (const q of D.KEY_QTYS) {
    k++;
    const price = money(c.base * q.qty * (1 - q.discount));
    add({
      id: `KEY-${pad(k)}`, category: "Crate Keys", name: `${c.keyName} ×${q.qty}`, price, type: "Crate key", rarity: c.prestige,
      contents: `${q.qty}× ${c.keyName}${q.discount ? ` (${Math.round(q.discount * 100)}% bulk saving)` : ""}`,
      tebex: block(`🗝️ ${c.keyName.toUpperCase()} ×${q.qty}`, [c.lore, "", `Opens the ${c.name} (${c.prestige}). Rewards and odds:`, ...oddsLines(c), "", `Jackpot: ${c.jackpot}.`, "Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game."]),
      system: "Crate system", command: cmd(`<GIVE_KEYS:${c.key}:${q.qty}>`),
      compliance: "Safe (cosmetic pool) · Risky if the optional gear pool is used",
      color: c.color, art: q.qty === 1 ? c.keyArt : `${q.qty > 10 ? "a heap" : "a small cluster"} of ${c.keyName}s, each ${c.keyArt}`
    });
  }
}
[
  { name: "Gate Key Sampler", price: 29.99, keys: { EMBER: 1, BLOODMOON: 1, ABYSSAL: 1, DREADFORGE: 1, REGALIA: 1, THRONE: 1 }, desc: "One key for every Gate Crate – try them all.", art: "six different ornate keys (amber, crimson, violet, molten orange, gold, crimson-gold) fanned on black velvet" },
  { name: "Lower Gates Key Cache", price: 24.99, keys: { EMBER: 5, BLOODMOON: 3, ABYSSAL: 2 }, desc: "A mix of Ember, Bloodmoon and Abyssal keys.", art: "an iron key cache box holding amber, crimson and violet keys" },
  { name: "High Gates Key Vault", price: 89.99, keys: { DREADFORGE: 3, REGALIA: 3, THRONE: 3 }, desc: "Dreadforge, Regalia and Throne keys for the prestige crates.", art: "a black-and-gold vault door ajar with molten, gold and crimson keys inside" }
].forEach((kb, i) => add({
  id: `KEY-${pad(37 + i)}`, category: "Crate Keys", name: kb.name, price: kb.price, type: "Key bundle", rarity: "Mixed",
  contents: describeContents({ keys: kb.keys }).join("; "), tebex: block(`🗝️ ${kb.name.toUpperCase()}`, [kb.desc, "", ...bullets(describeContents({ keys: kb.keys })), "", "See each crate key for rewards and odds."]),
  system: "Crate system", command: contentsCmd({ keys: kb.keys }), compliance: "Safe (cosmetic pool) · Risky if the gear pool is used", color: "#FF2E4D", art: kb.art
}));

// ----- throne shards
D.SHARD_PACKS.forEach((s, i) => {
  const total = Math.round(s.qty * (1 + s.bonus));
  add({
    id: `SHARD-${pad(i + 1)}`, category: "Throne Shards", name: `${D.SHARD_NAMES[i]}: ${num(s.qty)} Throne Shards`, price: s.price, type: "Premium currency (cosmetic-only)",
    rarity: ["Common", "Common", "Rare", "Rare", "Epic", "Legendary", "Mythic"][i],
    contents: `${num(s.qty)} Throne Shards${s.bonus ? ` + ${Math.round(s.bonus * 100)}% bonus = ${num(total)}` : ""}`,
    tebex: block(`💎 ${num(total)} THRONE SHARDS`, [`${num(s.qty)} Throne Shards${s.bonus ? ` + ${Math.round(s.bonus * 100)}% BONUS (${num(total - s.qty)} extra)` : ""}.`, "", "Spend Throne Shards in the in-game Throne Vault on auras, trails, titles, pets, skins and more.", "Throne Shards can only be spent on cosmetics."]),
    system: "Throne Shard currency + Throne Vault", command: cmd(`<GIVE_SHARDS:${total}>`), color: "#FF2E4D",
    art: `${["a small leather pouch of", "a satchel of", "a small coffer of", "a chest of", "a vault pile of", "a towering hoard of", "a royal treasury overflowing with"][i]} glowing blood-red throne-shard crystals with dark-gold flecks`
  });
});

// ----- cosmetics & pets
let ci = 0, pi = 0;
for (const c of D.COSMETICS) {
  const isPet = c.cat === "pets";
  add({
    id: isPet ? `PET-${pad(++pi)}` : `COS-${pad(++ci)}`, category: isPet ? "Pets" : "Cosmetics", name: c.name, price: D.RARITY_PRICE[c.rarity],
    type: c.type, rarity: c.rarity, contents: `${c.name} (${c.type})`,
    tebex: block(`✦ ${c.name.toUpperCase()} · ${c.rarity.toUpperCase()} ${c.type.toUpperCase()}`, [c.desc, "", "Purely cosmetic: no stats, no gameplay effect.", "Equip it from your in-game wardrobe."]),
    system: /Skin/.test(c.type) ? "Cosmetics system + resource pack models" : isPet ? "Cosmetic pet system" : "Cosmetics system",
    command: cmd(`<GRANT_COSMETIC:${c.code}>`), color: RARITY_COLOR[c.rarity], art: c.art
  });
}

// ----- bundles
for (const b of D.BUNDLES) {
  const value = (b.contents.rank ? rank[b.contents.rank].price : 0) + keysValue(b.contents.keys) + (b.contents.shards || 0) * SHARD_RATE + cosValue(b.contents.cosmetics);
  const price = money(value * 0.62);
  add({
    id: b.id, category: "Bundles", name: b.name, price, type: "Bundle", rarity: b.rarity, contents: describeContents(b.contents).join("; "),
    tebex: block(`📦 ${b.name.toUpperCase()}`, [b.desc, "", "CONTAINS:", ...bullets(describeContents(b.contents)), "", `Worth ${fmt(Math.round(value * 100) / 100)}: save ${Math.round((1 - price / value) * 100)}%.`]),
    system: "Ranks / crates / shards / cosmetics", command: contentsCmd(b.contents), color: RARITY_COLOR[b.rarity], art: b.art,
    value: Math.round(value * 100) / 100, compliance: b.contents.rank ? "Borderline (includes a rank)" : "Safe"
  });
}

// ----- simple lists
const simple = (list, prefix, category, extra) => list.forEach((x, i) => add({
  id: `${prefix}-${pad(i + 1)}`, category, name: x.name, price: x.price, contents: x.desc, command: cmd(x.deliver), art: x.art, ...extra(x, i)
}));
simple(D.FEATURED, "FEAT", "Featured", (f) => ({
  type: `Featured (${f.window})`, rarity: f.rarity, color: RARITY_COLOR[f.rarity], system: sysFromCmd(f.deliver), status: "DEV SYSTEM REQUIRED · enable only while featured",
  tebex: block(`★ ${f.name.toUpperCase()}`, [f.desc, "", `Availability: ${f.window}.`])
}));
D.BOOSTERS.forEach((b, i) => D.BOOST_DURATIONS.forEach((d, j) => add({
  id: `BOOST-${pad(i * 4 + j + 1)}`, category: "Boosters", name: `${b.name} (${d.label})`, price: d.price, type: "Global booster",
  rarity: ["Common", "Rare", "Epic", "Legendary"][j], contents: `${b.effect} for ${d.label.toLowerCase()}`,
  tebex: block(`⏳ ${b.name.toUpperCase()} · ${d.label.toUpperCase()}`, [`${b.effect} for ${d.label.toLowerCase()}.`, "", "GLOBAL: every player online benefits, and your name is announced as the booster.", "Boosts of the same type queue up instead of stacking."]),
  system: "Global booster system", command: cmd(`<START_GLOBAL_BOOST:${b.code}:${d.mins}>`), color: ["#4FA3FF", "#9B6BFF", "#F2C14E", "#FF2E4D"][j],
  art: `${b.art}, with a glowing hourglass motif`, gift: "Not giftable (global)", compliance: "Borderline (global boosts benefit everyone; safest when tied to community goals)"
})));
simple(D.STARTERS, "START", "Starter", (s) => ({
  type: "Starter pack (limit 1 per player)", rarity: "Starter", color: "#E0434F", system: sysFromCmd(s.deliver),
  tebex: block(`🛡️ ${s.name.toUpperCase()} · STARTER`, [s.desc, "", "One per player. Welcome to the hunt."])
}));
simple(D.EVENTS, "EVENT", "Seasonal", (e) => ({
  type: `Event: ${e.event}`, rarity: "Event", color: "#D61F3C", system: sysFromCmd(e.deliver) + ", event toggles", status: "DEV SYSTEM REQUIRED · keep DISABLED until the event",
  tebex: block(`🌑 ${e.name.toUpperCase()} · ${e.event.toUpperCase()} EVENT`, [e.desc, "", "Available during the event only."])
}));
simple(D.GIFTS, "GIFT", "Gifts", (g) => ({
  type: "Gift (recipient username variable)", rarity: "Gift", color: "#E6C068", system: sysFromCmd(g.deliver) + ", gift delivery", gift: "Is a gift package",
  compliance: /GRANT_RANK/.test(g.deliver) ? "Borderline (rank)" : "Safe",
  tebex: block(`🎁 ${g.name.toUpperCase()}`, [g.desc, "", "Enter your friend's Minecraft username at checkout. They receive it in-game."])
}));
simple(D.UTILITY, "UTIL", "Utility", (u) => ({
  type: "Utility token", rarity: "Utility", color: "#C3C6CC", system: sysFromCmd(u.deliver),
  tebex: block(`⚙️ ${u.name.toUpperCase()}`, [u.desc, "", "No gameplay effect."])
}));

function sysFromCmd(c) {
  const s = new Set();
  if (/GRANT_RANK/.test(c)) s.add("Ranks");
  if (/GIVE_KEYS/.test(c)) s.add("Crate system");
  if (/GIVE_SHARDS/.test(c)) s.add("Throne Shards");
  if (/GRANT_COSMETIC/.test(c)) s.add("Cosmetics system");
  if (/GLOBAL_BOOST/.test(c)) s.add("Global boosters");
  if (/TOKEN|TEMP_PERMISSION/.test(c)) s.add("Tokens/permissions");
  return [...s].join(", ");
}

// ------------------------------------------------------------------ outputs
out("packages.json", JSON.stringify(P, null, 2));

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const cols = ["ID", "CATEGORY", "PACKAGE", "PRICE AUD", "TYPE", "CONTENTS", "RARITY", "DEV SYSTEM", "COMMAND PLACEHOLDER", "COMPLIANCE", "STATUS", "TEBEX DESCRIPTION (paste)", "IMAGE PROMPT", "GIFTING"];
out("packages.csv", "﻿" + [cols.map(csvCell).join(","), ...P.map((p) =>
  [p.id, p.category, p.name, p.price.toFixed(2), p.type, p.contents, p.rarity, p.system, p.command, p.compliance, p.status, p.tebex, `IMAGE-PROMPTS.md → ${p.id}`, p.gift].map(csvCell).join(","))].join("\r\n"));

const byCat = (c) => P.filter((p) => p.category === c);
const R = (id) => P.find((p) => p.id === id);
const fence = (s) => "```\n" + s + "\n```";

// ---------- CATALOGUE.md
const md = `# OVERTHRONE SMP – Tebex Store Catalogue (v2)

*“${D.BRAND.slogan}”*

${P.length} packages in ${D.CATEGORIES.length} categories. Prices are recommendations in AUD.
Every package has a **ready-to-paste Tebex description** (below, and in \`packages.csv\`) and an **image prompt** in \`IMAGE-PROMPTS.md\`.

## Read first: what your server can deliver today

Your confirmed mod list (Minecraft 1.21.1, NeoForge 21.1.251):
${D.CONFIRMED_MODS.join(", ")}.

**None of these mods provide:**
- ranks or prefixes
- homes, /hat or /nick
- an economy or auction house
- crates
- cosmetics

So **every store command is a placeholder** marked **DEV SYSTEM REQUIRED** until your developer adds those systems (new mods, KubeJS scripts or config) and gives you the real commands.

Nothing here is an invented command. Suggested mods (e.g. LuckPerms, FTB Ranks, FTB Essentials) are **options for the developer**, not confirmed installs.

**Compliance ratings** (Mojang's Minecraft Usage Guidelines, which Tebex checks in review):
- **Safe:** cosmetic, chat or convenience with no gameplay effect.
- **Borderline:** limits (homes, claims, auction slots, reset tokens). Many servers sell these, but review can question them.
- **Risky:** paid gameplay items or advantages (gear, kits, keep-XP, survival /fly, skill points). These are **not included by default**. They're listed in the rank table so **you** decide.

---

## 1. Donor ranks (exactly five, Overlord is the top rank)

| Tier | Rank | Prefix | Colour | Discord role | Price | Package |
|---|---|---|---|---|---|---|
${ORDER.map((r) => `| ${r.tier} | ${r.icon} **${r.name.toUpperCase()}** | [${r.name.toUpperCase()}] | \`${r.color}\` | @${r.discord} | ${fmt(r.price)} | ${r.id} |`).join("\n")}

> IDs: RANK-001 to RANK-004 keep their old IDs. **Warlord is new (RANK-005)** and sits between Champion and Overlord.
> Sovereign, Usurper, Kingslayer and Thronebreaker are removed (old RANK-005 to RANK-008).

${ORDER.map((r) => {
  const p = R(r.id);
  return `### ${r.icon} ${r.name.toUpperCase()} · ${fmt(r.price)} · ${r.id}

**Tebex description (paste as-is):**

${fence(p.tebex)}

- **Delivery placeholders:** \`${p.command}\`
- **Compliance:** ${p.compliance}
- **Optional Risky perks (not included; your call):** ${p.optional || "none"}
`;
}).join("\n")}

## 2. Rank comparison table

Features as rows, ranks as columns. The rating and status of each perk are shown in the last columns.

| Perk | ${ORDER.map((r) => r.name).join(" | ")} | Rating | Status | Compliant alternative |
|---|${ORDER.map(() => "---").join("|")}|---|---|---|
${D.PERKS.map((p) => `| ${p.perk}${p.include ? "" : " *(optional)*"} | ${p.values.join(" | ")} | **${p.rating}** | ${p.status} | ${p.alt || "–"} |`).join("\n")}

**Rank upgrades (optional):** create "Upgrade: Elite → Champion" style packages priced at the difference. The developer removes the old rank when granting the new one.

---

## 3. Crates

**Key command:** \`<GIVE_CRATE_KEY_COMMAND player={username} crate=<name> amount=<n>>\`: **DEV SYSTEM REQUIRED** (no crate mod is installed; KubeJS is one option).

Default reward pool: **cosmetics and Throne Shards only (Safe)**. Duplicate cosmetics convert to Throne Shards.

| Crate | Prestige | Key | Colour | 1 key | Common | Rare | Epic | Legendary | Mythic |
|---|---|---|---|---|---|---|---|---|---|
${D.CRATES.map((c) => `| **${c.name}** | ${c.prestige} | ${c.keyName} | \`${c.color}\` | ${fmt(c.base)} | ${c.odds.join("% | ")}% |`).join("\n")}

${D.CRATES.map((c) => `### ${c.name} (${c.prestige})
- **Lore:** ${c.lore}
- **Key art:** ${c.keyArt}
- **Crate art:** ${c.crateArt}
- **Cosmetic pool (Safe, default):**
${D.CRATE_TIERS.map((t, i) => `  - ${t} (${c.odds[i]}%): ${c.rewards[i]}`).join("\n")}
- **Optional gear pool (Risky, not default), items from installed mods with IDs UNVERIFIED:** ${D.GEAR_POOLS[c.key].join(" · ")}.
  Alternative: keep the cosmetic pool.
- **Key prices:** ${D.KEY_QTYS.map((q) => `×${q.qty} ${fmt(money(c.base * q.qty * (1 - q.discount)))}`).join(" · ")}
`).join("\n")}

## 4. All packages, with Tebex descriptions

${D.CATEGORIES.filter((c) => c.key !== "ranks").map((c) => {
  const items = byCat(c.name);
  if (!items.length) return "";
  return `### ${c.name} (${items.length})

${c.note}

| ID | Package | Price | Contents | Compliance |
|---|---|---|---|---|
${items.map((p) => `| ${p.id} | ${p.name} | ${fmt(p.price)} | ${p.contents} | ${p.compliance} |`).join("\n")}

<details><summary>Tebex descriptions (${c.name})</summary>

${items.map((p) => `**${p.id}: ${p.name}**\n${fence(p.tebex)}`).join("\n\n")}

</details>
`;
}).join("\n")}

---

## 5. Store structure (category order)

${D.CATEGORIES.map((c, i) => `${i + 1}. **${c.name}** (${byCat(c.name).length}): ${c.note}`).join("\n")}

**Tebex settings:**
- Enable gifting on ranks, keys, shards and cosmetics.
- Set limit 1 per customer on Starter and Founder items.
- Keep Seasonal packages disabled until their event.
- Keep every package **disabled** until the developer supplies its real command.
`;
out("CATALOGUE.md", md);

// ---------- DEVELOPER-HANDOFF.md
const SYSTEMS = [
  ["Tebex delivery", "Install a Tebex plugin/mod compatible with NeoForge 1.21.1 (compatibility UNVERIFIED – confirm before purchase), or use RCON. Store secret key only on the server. Commands use Tebex's {username} placeholder; gift packages use a {recipient} package variable."],
  ["Ranks + prefixes", "No permissions/prefix mod in the list. Needed: 5 groups (supporter → overlord) with inheritance, coloured prefixes, an animated Overlord prefix. Options: LuckPerms or FTB Ranks (NeoForge builds – confirm). Provide <SET_RANK_COMMAND>."],
  ["Discord roles", "Tebex Discord Actions (built into Tebex) – link the Tebex Discord bot. No server command needed."],
  ["Throne Shards", "Cosmetic-only currency. One option with REAL vanilla syntax: `scoreboard objectives add throne_shards dummy` then `scoreboard players add {username} throne_shards <amount>` (works only while the player is online unless queued). Or a KubeJS/currency mod. Must never buy gameplay items. Provide <GIVE_SHARDS_COMMAND>."],
  ["Throne Vault", "In-game GUI/NPC (Easy NPC + KubeJS are installed) that sells cosmetics for Throne Shards."],
  ["Crates + keys", "6 crates with the odds in CATALOGUE.md, virtual keys, duplicate → shards, odds visible in-game, free key sources in gameplay. No crate mod installed – KubeJS or a crate mod. Provide <GIVE_CRATE_KEY_COMMAND>."],
  ["Cosmetics", "Auras, trails, particles, kill/death/spawn/teleport effects, titles, chat tags, chat effects, emotes, pets, weapon/armour/mount skins (resource-pack models, appearance only). RenderJS/KubeJS are installed and may help. Provide <GRANT_COSMETIC_COMMAND>."],
  ["Chat formatting", "Chat colours, gradients, emoji packs, join messages, server-wide arrival announcement."],
  ["Essentials commands", "/hat, /nick (moderated), /sit, /lay, hub-only /fly, homes (if kept). None in the mod list – essentials-style mod or KubeJS."],
  ["Claims (Borderline)", "Open Parties and Claims is installed. Bonus claim chunks per rank need permission-based limits – confirm OPAC supports this with the chosen permission mod (UNVERIFIED)."],
  ["Auction House (Borderline)", "No auction mod in the list. Needed only if AH listing slots stay as a rank perk."],
  ["Class / race reset tokens (Borderline)", "Custom class system (Warrior/Assassin/Mage/Ranger/Guardian) + Tensura race reset – commands UNVERIFIED. Provide <GIVE_TOKEN_COMMAND>."],
  ["Global boosters", "Server-wide timed boosts (XP, currency, drops, key-find, Hunter XP, Gate rewards, party). Queue same-type boosts, announce the buyer, show a timer. Provide <START_GLOBAL_BOOST_COMMAND>."],
  ["Tokens / temp permissions", "Nick 30d, name/prefix colour, wardrobe slots, guild banner slot, queue pass. Provide <GIVE_TOKEN_COMMAND> and <GRANT_TEMP_PERMISSION_COMMAND>."],
  ["Queue priority", "Join-queue priority by rank (needs a queue/proxy setup)."],
  ["Events", "Event cosmetics/crates toggled per event."],
  ["Optional Risky perks", "Only if the owner chooses them: Sophisticated Backpacks / Waystones / Iron's Spells items, Pufferfish skill points, kits, keep-XP, survival /fly, /back. Real item IDs and commands must be confirmed – none are assumed here."]
];
const dev = `# OVERTHRONE SMP – Developer Handoff (Tebex)

Hi! The owner has designed the full Tebex store. **Every package needs a real command** in place of its placeholder.

Please do the following:
1. Build or choose the systems below.
2. Fill in the "Real command" line for each package ID.
3. Send the list back.

**Server:** Minecraft 1.21.1 · NeoForge 21.1.251 · Java 21.

**Confirmed mods:** ${D.CONFIRMED_MODS.join(", ")}.
There is no permissions, essentials, economy, auction, crate or cosmetics mod in that list.

**Placeholder format:** \`<NAME_COMMAND key=value …>\`.
- \`{username}\` is Tebex's buyer placeholder.
- \`{recipient}\` is a Tebex package variable used by gift packages.

**Never put the Tebex secret key in the website, GitHub or Discord.**

## Systems required

| System | What it must do |
|---|---|
${SYSTEMS.map(([a, b]) => `| ${a} | ${b} |`).join("\n")}

## Placeholders

| Placeholder | Meaning |
|---|---|
| \`<SET_RANK_COMMAND player rank>\` | Give a lifetime donor rank (remove the lower rank on upgrades) |
| \`<GIVE_CRATE_KEY_COMMAND player crate amount>\` | Give virtual crate keys |
| \`<GIVE_SHARDS_COMMAND player amount>\` | Add Throne Shards |
| \`<GRANT_COSMETIC_COMMAND player id>\` | Unlock a cosmetic |
| \`<START_GLOBAL_BOOST_COMMAND type minutes buyer>\` | Start or queue a server-wide boost |
| \`<GIVE_TOKEN_COMMAND player token amount>\` | Give tokens (class reset, name colour, wardrobe…) |
| \`<GRANT_TEMP_PERMISSION_COMMAND player permission duration>\` | Temporary permission |

## Rank perk matrix (what each rank must unlock)

| Perk | ${ORDER.map((r) => r.name).join(" | ")} | Rating | Status |
|---|${ORDER.map(() => "---").join("|")}|---|---|
${D.PERKS.map((p) => `| ${p.perk}${p.include ? "" : " (optional, Risky)"} | ${p.values.join(" | ")} | ${p.rating} | ${p.status} |`).join("\n")}

## Cosmetic IDs to implement

${[...new Set(P.flatMap((p) => [...p.command.matchAll(/id=([a-z0-9_]+)/g)].map((m) => m[1])))].sort().map((c) => `\`${c}\``).join(", ")}

## Per-package commands (${P.length})

${D.CATEGORIES.map((c) => {
  const items = byCat(c.name);
  if (!items.length) return "";
  return `### ${c.name}

${items.map((p) => `**${p.id}: ${p.name}**
- Delivers: ${p.contents}
- Placeholder: \`${p.command}\`
- Real command: ____________________`).join("\n\n")}
`;
}).join("\n")}
`;
out("DEVELOPER-HANDOFF.md", dev);

// ---------- IMAGE-PROMPTS.md (for ChatGPT image generation, one at a time)
const prompt = (id, name, subject, color) => `### ${id}: ${name}
${fence(`Create a square 1:1 image. Premium dark-fantasy MMORPG game-store item artwork for "${name}".
Subject: ${subject}.
Style: one single centred subject on a pure black background; obsidian surfaces, dark-gold filigree, glowing ${color} accents, drifting crimson embers, thin dark smoke, cinematic rim lighting, intricate detail, high-end painterly 3D render, AAA game store quality.
Do NOT include: any text, letters, numbers, logos, watermarks, borders, collages, grids, multiple panels, Minecraft blocks or screenshots, cartoon or anime style, capes, or characters from existing games.`)}`;
const img = `# OVERTHRONE SMP – Image prompts for ChatGPT

How to use these:
- Paste **one prompt per message** into ChatGPT.
- Download the image, then upload it to the Tebex package with the same ID.
- Never ask for several images at once (no collages or grids).

There are ${P.length + D.CRATES.length + D.CATEGORIES.length} prompts: one per package, one per crate and one per category.

## Packages

${P.map((p) => prompt(p.id, p.name, p.art, p.color)).join("\n\n")}

## Crates

${D.CRATES.map((c, i) => prompt(`CRATE-${pad(i + 1)}`, c.name, c.crateArt, c.color)).join("\n\n")}

## Categories

Match your existing category tiles: one ornate silver emblem with crimson gems, centred on black, inside a thin square frame.

${D.CATEGORIES.map((c) => prompt(`CAT-${c.key.toUpperCase()}`, c.name, `a single ornate silver emblem representing "${c.name}", crimson gemstone accents, inside a thin dark square frame with corner brackets`, "#D61F3C")).join("\n\n")}
`;
out("IMAGE-PROMPTS.md", img);

const counts = {};
for (const p of P) counts[p.category] = (counts[p.category] || 0) + 1;
console.log(P.length, "packages", counts);
