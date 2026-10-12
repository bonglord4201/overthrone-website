// Builds tebex-storefront/cosmetics/COSMETICS-TEBEX.md from the cosmetics in npc_menus.js,
// so the Tebex package list always matches what the server can give.
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const src = fs.readFileSync(path.join(root, "minecraft/kubejs/server_scripts/npc_menus.js"), "utf8");
const cut = (a, b) => src.slice(src.indexOf(a), src.indexOf(b));
let code = cut("  const TAGS = [", "  const keyItems") + cut("  const KINDS = {", "  // ---- chat: tag") + cut("  const strip = ", "  const owned = ");
code = code.replace(/const /g, "var ") + "; return { KINDS, strip };";
const { KINDS, strip } = new Function(code)();

// OG Network's Tebex prices (AUD). Their store: symbol tags 6.29, statuses + word tags 7.86, gradient bundles 39.40.
// Kinds OG doesn't sell on Tebex use OG's same rate (399 petals = 6.29 AUD) on our in-game price.
const rate = 6.29 / 399;
const aud = (shards) => (Math.round(shards * rate * 100) / 100).toFixed(2);
const TAG_NAMES = { heart: "Heart", star: "Star", crown: "Crown", skull: "Skull", swords: "Swords", flower: "Flower", bolt: "Lightning", snow: "Snowflake", music: "Music", sun: "Sun" };
const title = (id) => id.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
const CATS = [
  { kind: "status", cmdKind: "status", cat: "Statuses", price: () => "7.86", name: (c) => strip(c.name).replace(/ Status$/, "") + " Status",
    desc: (c) => [`Show off this status above your head!`, `Shows: **${strip(c.text)}**`, `Equip it in game with **/status**`] },
  { kind: "tag", cmdKind: "tag", cat: "Custom Tags", price: (c) => (c.price <= 399 ? "6.29" : "7.86"), name: (c) => (TAG_NAMES[c.id] || strip(c.show)) + " Tag",
    desc: (c) => [`Show off this tag when you type in chat!`, `Shows: **[${strip(c.show)}]** before your name`, `Equip it in game with **/tags**`] },
  { kind: "join", cmdKind: "joinmessage", cat: "Join & Quit Messages", price: (c) => aud(c.price), name: (c) => title(c.id) + " Join & Quit Message",
    desc: (c) => [`Arrive and leave in style! Everyone sees it.`, `Join: *${c.join.replace("{p}", "YourName")}*`, `Leave: *${c.leave.replace("{p}", "YourName")}*`, `Equip it in game with **/joinmessage**`] },
  { kind: "grad", cmdKind: "gradient", cat: "Gradient Bundles", price: () => "39.40", name: (c) => strip(c.name),
    desc: (c) => [`Spice up your name and chat with colours!`, `1x Name Color Gradient`, `1x Matching Chat Color`, `Equip it in game with **/gradient**`] },
  { kind: "nc", cmdKind: "namecolor", cat: "Name Colors", price: (c) => aud(c.price), name: (c) => strip(c.name),
    desc: (c) => [`Colour your name in chat!`, `Equip it in game with **/namecolor**`] },
  { kind: "cc", cmdKind: "chatcolor", cat: "Chat Colors", price: (c) => aud(c.price), name: (c) => strip(c.name),
    desc: (c) => [`Colour your chat messages!`, `Equip it in game with **/chatcolor**`] },
  { kind: "glow", cmdKind: "glow", cat: "Glow Colors", price: (c) => aud(c.price), name: (c) => strip(c.name),
    desc: (c) => [`Glow in this colour so everyone can see you, even through walls!`, `Equip it in game with **/glowcolor**`] },
];

const out = [];
out.push("# Cosmetics on Tebex (OG Network style)", "",
  "Every package gives the cosmetic with **one console command**, made for this server: `otcosmetic`.",
  "It's our own command (no other mod uses that name), so it can't clash with anything.", "",
  "## How to add a package", "",
  "1. Tebex → **Packages → Create Category** for each category below (Statuses, Custom Tags, ...).",
  "2. In the category: **Create Package**, then copy the **Title**, **Price** and **Description**.",
  "3. **Game server commands** → add the 4 commands from the table. Pick *When the package is purchased / refunded / charged back* in the dropdown.",
  "4. Settings for the give/take commands: **Require player to be online: ON** (Tebex waits until they join). The ban: **OFF**.",
  "5. Don't start commands with `/`. Keep `{username}` exactly as written.", "",
  "Test: Tebex → Payments → Create manual payment for yourself, be online, and you get \"You received ...\" in chat. Or type in the console: `otcosmetic give <you> status loot_goblin`.",
  "Staff: `otcosmetic list status` shows every id.", "",
  "| Category | Packages | Price (AUD) |", "|---|---|---|");
for (const C of CATS) {
  const list = KINDS[C.kind].list;
  const prices = [...new Set(list.map((c) => C.price(c)))].join(" / ");
  out.push(`| ${C.cat} | ${list.length} | ${prices} |`);
}
out.push("", "Prices: Statuses 7.86, word Tags 7.86, symbol Tags 6.29 and Gradient Bundles 39.40 are OG Network's exact prices. Join & Quit Messages, Name/Chat/Glow Colors use OG's same price rate.", "");
for (const C of CATS) {
  out.push(`---`, ``, `## ${C.cat}`, ``);
  for (const c of KINDS[C.kind].list) {
    const give = `otcosmetic give {username} ${C.cmdKind} ${c.id}`, take = `otcosmetic take {username} ${C.cmdKind} ${c.id}`;
    out.push(`### ${C.name(c)}`, ``, `**Price:** ${C.price(c)} AUD`, ``, `**Description:**`, ``, C.desc(c).join("  \n"), ``,
      `| When | Command | Require online |`, `|---|---|---|`,
      `| Purchase | \`${give}\` | ON |`, `| Refund | \`${take}\` | ON |`, `| Chargeback | \`${take}\` | ON |`,
      `| Chargeback | \`ban {username} Chargeback on the store. Open a ticket on our Discord to appeal.\` | OFF |`, ``);
  }
}
fs.writeFileSync(path.join(root, "tebex-storefront/cosmetics/COSMETICS-TEBEX.md"), out.join("\n") + "\n");
console.log("wrote tebex-storefront/cosmetics/COSMETICS-TEBEX.md:", CATS.map((C) => `${C.cat} ${KINDS[C.kind].list.length}`).join(", "));
