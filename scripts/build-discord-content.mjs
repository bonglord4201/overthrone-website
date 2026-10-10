// Builds discord-bot/content.json: the posts `/server content` puts in the info channels.
// Uses the same data as the website (guide-data.mjs, rules-data.mjs), so Discord, the
// Player Guide and the forums always say the same thing.
//   node scripts/build-discord-content.mjs
//
// {#key} becomes a channel mention at post time (keys are in discord-bot/src/blueprint.js).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SECTIONS } from "./guide-data.mjs";
import { RULES_UPDATED, RULES_INTRO, RULE_SECTIONS } from "./rules-data.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://overthronesmp.net";
const IMG = SITE + "/images/og-card.png";
const sec = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));
const block = (id, type) => sec[id].blocks.find((b) => b[type])[type];
const blocks = (id, type) => sec[id].blocks.filter((b) => b[type]).map((b) => b[type]);
// Site-relative links -> absolute, so they work in Discord.
const d = (t) => String(t).replace(/\]\((\/[^)]*)\)/g, (_, u) => `](${SITE}${u})`);
const key = (k) => (k === "Unbound" ? "*not set*" : k.split(/\s([+/])\s/).map((p, i) => (i % 2 ? ` ${p} ` : "`" + p + "`")).join(""));
const btn = (label, url, emoji) => ({ label, url: url.startsWith("/") ? SITE + url : url, emoji });

const updated = new Date(RULES_UPDATED + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

// Pack embeds into messages: max 10 embeds and 6,000 characters per message.
function pack(embeds, lastButtons) {
  const size = (e) => (e.title ?? "").length + (e.description ?? "").length + (e.fields ?? []).reduce((n, f) => n + f.name.length + f.value.length, 0);
  const msgs = [];
  let cur = [], total = 0;
  for (const e of embeds) {
    if ((e.description ?? "").length > 4096) throw new Error("Embed too long: " + e.title);
    for (const f of e.fields ?? []) if (f.value.length > 1024) throw new Error(`Field too long: ${e.title} / ${f.name} (${f.value.length})`);
    if (cur.length === 10 || total + size(e) > 5800) { msgs.push({ embeds: cur }); cur = []; total = 0; }
    cur.push(e); total += size(e);
  }
  if (cur.length) msgs.push({ embeds: cur });
  if (lastButtons) msgs.at(-1).buttons = lastButtons;
  return msgs;
}

const channels = [];

// ---------------------------------------------------------------- welcome
channels.push({ key: "welcome", messages: [{
  embeds: [{
    title: "⚔️ Welcome to OVERTHRONE SMP",
    description: [
      "*Don't reach the throne. Overthrow it.*",
      "",
      "A modded dark-fantasy MMORPG on **NeoForge 1.21.1**, built around **Tensura: Reincarnated** and **Epic Fight** combat. Over 1,100 quests, bosses, an RPG city and an economy you grind for in game.",
      "",
      "**🚀 Start here**",
      "🔸 Read the {#rules}",
      "🔸 Install the modpack: {#howtoplay}",
      "🔸 Fix your keybinds: {#mods}",
      "🔸 Pick your notifications: {#roles}",
      "🔸 Link your Minecraft account: type `/link` here while you're online in-game",
      "",
      "**🎮 Server address:** `overthronesmp.net`",
      "",
      "Need help? Open a ticket in {#tickets}."
    ].join("\n"),
    image: IMG
  }],
  buttons: [btn("Website", "/", "🌐"), btn("Player Guide", "/guide", "📖"), btn("Rules", "/rules", "📜"), btn("Vote", "/vote", "🗳️")]
}] });

// ---------------------------------------------------------------- account linking panel
channels.push({ key: "link", messages: [{
  embeds: [{
    title: "🔗 Link your Minecraft account",
    description: [
      "Connect your Minecraft account to Discord to get the **Linked** role and your in-game perks.",
      "",
      "**How it works**",
      "🔸 **1.** Join the server (`overthronesmp.net`) and stay online.",
      "🔸 **2.** Click **Link my account** below and type your exact Minecraft username.",
      "🔸 **3.** A **6-digit code** appears in your Minecraft chat. You can click it to copy it.",
      "🔸 **4.** Click **Enter code** and paste it. Done!",
      "",
      "Codes expire after 10 minutes. Only you can see the bot's replies here.",
      "",
      "⚠️ **Staff will never ask for your code.** Never share it with anyone.",
      "Trouble linking? Open a ticket in {#tickets}."
    ].join("\n"),
    thumbnail: "https://overthronesmp.net/images/icon-192.png"
  }],
  buttons: [{ label: "Link my account", id: "link:start", emoji: "🔗" }, { label: "Enter code", id: "link:code", emoji: "🔑", style: "secondary" }]
}] });

// ---------------------------------------------------------------- rules
channels.push({ key: "rules", messages: pack([
  { title: "📜 OVERTHRONE Rules", description: RULES_INTRO.join("\n\n") + `\n\n*Last updated ${updated}.*` },
  ...RULE_SECTIONS.map((s, i) => ({
    title: `${i + 1} · ${s.title}`,
    description: `*${s.intro}*\n\n` + s.rules.map((r, j) => `**${i + 1}.${j + 1}** ${r.replace(/^\*\*([^*]+)\*\*/, "**$1**")}`).join("\n")
  }))
], [btn("Full rules on the website", "/rules", "📜"), btn("Open a ticket", "https://discord.gg/overthronesmp", "🎫")]) });

// ---------------------------------------------------------------- website links
channels.push({ key: "links", messages: [{
  embeds: [{
    title: "🌐 Website & Links",
    description: [
      "🌐 **Website:** " + SITE,
      "📖 **Player Guide:** " + SITE + "/guide",
      "⌨️ **Keybinds:** " + SITE + "/keybinds",
      "💬 **Forums:** " + SITE + "/forums",
      "📜 **Rules:** " + SITE + "/rules",
      "🗳️ **Vote for rewards:** " + SITE + "/vote",
      "🎬 **Trailer:** " + SITE + "/#trailer",
      "",
      "📨 **Invite friends:** https://discord.gg/overthronesmp"
    ].join("\n")
  }],
  buttons: [btn("Website", "/", "🌐"), btn("Player Guide", "/guide", "📖"), btn("Forums", "/forums", "💬"), btn("Vote", "/vote", "🗳️"), btn("Trailer", "/#trailer", "🎬")]
}] });

// ---------------------------------------------------------------- faq
const faq = block("faq", "faq");
const fixes = block("fixes", "faq");
channels.push({ key: "faq", messages: pack([
  { title: "❓ Frequently Asked Questions", description: faq.map((f) => `**🔸 ${f.q}**\n${d(f.a)}`).join("\n\n") },
  { title: "🛠️ Known Issues & Fixes", description: fixes.map((f) => `**🔸 ${f.q}**\n${d(f.a)}`).join("\n\n") }
], [btn("Player Guide", "/guide#fixes", "📖"), btn("Keybind fixes", "/guide#key-conflicts", "⌨️")]) });

// ---------------------------------------------------------------- useful commands
const warps = block("worlds", "chips");
channels.push({ key: "commands", messages: pack([
  { title: "⌨️ Useful Commands", description: "**🧭 Warps** (in-game)\n" + warps.map((w) => `\`${w.t}\` ${w.d}`).join("\n") },
  { title: "🤖 Discord Commands", description: [
    "`/link` Link your Minecraft account (be online in-game)",
    "`/verify` Finish linking with the code from Minecraft chat",
    "`/status` Live server status · `/players` Who's online",
    "`/ip` Server address · `/vote` Vote links · `/rules` Rules · `/website` Website",
    "`/suggest` Suggest something for the server",
    "`/rank` Your chat level · `/leaderboard` Top chatters"
  ].join("\n") },
  { title: "🎮 Keys Worth Knowing", description: [
    "`R` Epic Fight battle / mining mode",
    "`Left Alt` Dodge · `Right Mouse` Guard · `G` Lock on",
    "`'` Claims & parties (Open Parties and Claims)",
    "`M` World map · `B` Backpack · `V` Voice chat",
    "",
    "Several mods share keys by default. Fix them in {#mods}."
  ].join("\n") }
], [btn("All warps & keys", "/guide#worlds", "🧭")]) });

// ---------------------------------------------------------------- mods & keybinds
const mods = block("mods", "mods");
const keyTables = blocks("keybinds", "keys");
const conflicts = block("key-conflicts", "table");
channels.push({ key: "mods", messages: pack([
  { title: "🧩 Mod List", description: d(sec.mods.intro), fields: mods.map((g) => ({ name: g.group, value: g.items.join(" · "), inline: false })) },
  { title: "⌨️ Keybinds", description: d(sec.keybinds.intro), fields: keyTables.map((t) => ({ name: t.title, value: t.rows.map(([k, x]) => `${key(k)} ${x}`).join("\n"), inline: false })) },
  { title: "⚠️ Fix Key Conflicts", description: d(sec["key-conflicts"].intro) + "\n\n" + conflicts.rows.map((r) =>
    /^Unbind/.test(r[3]) ? `\`${r[0]}\` Unbind **${r[2]}** ${r[3].replace(/^Unbind it\s*/, "")}` : `\`${r[0]}\` Set **${r[2]}** to **${r[3]}**`).join("\n") }
], [btn("Full keybind guide", "/guide#keybinds", "⌨️"), btn("Mod list", "/guide#mods", "🧩")]) });

// ---------------------------------------------------------------- quests
const questCards = block("quests", "cards");
const [boardTable, ledgerTable] = blocks("quests", "table");
const questList = block("quests", "list");
channels.push({ key: "quests", messages: pack([
  { title: "📜 Quests", description: d(sec.quests.intro) + "\n\n" + questCards.map((c) => `**📖 ${c.t}** (${c.k})\n${d(c.d)}`).join("\n\n") +
    "\n\n**🚪 SLR Quests**\nSolo Leveling System progression and daily objectives. The full SLR system isn't available straight away." },
  { title: "🗡️ Quest Board Ranks", description: boardTable.rows.map((r) => `**${r[0]}** · quests ${r[1]} · *${r[2]}*`).join("\n") },
  { title: "📒 The Hunter's Ledger", description: ledgerTable.rows.map((r) => `**${r[0]}** · ${r[1]}`).join("\n") + "\n\n" + questList.map((x) => "🔸 " + d(x)).join("\n") }
], [btn("How quests work", "/guide#quests", "📜")]) });

// ---------------------------------------------------------------- bosses
const bossCards = block("bosses", "cards");
const bossWarn = block("bosses", "callout");
channels.push({ key: "bosses", messages: pack([
  { title: "👿 Bosses & Dungeons", description: d(sec.bosses.intro) + "\n\n⚠️ " + d(bossWarn.text),
    fields: bossCards.map((c) => ({ name: `${c.t} · ${c.k}`, value: d(c.d), inline: false })) }
], [btn("Bosses guide", "/guide#bosses", "👿")]) });

// ---------------------------------------------------------------- races
const races = sec.races;
const [raceHow, raceEvolve] = blocks("races", "list");
const raceTable = block("races", "table");
const raceCards = block("races", "cards");
const raceFaq = block("races", "faq");
const tier = { Easy: "🟢", Intermediate: "🟡", Hard: "🟠", Extreme: "🔴" };
const chunks = (a, n) => a.reduce((out, x, i) => (i % n ? out[out.length - 1].push(x) : out.push([x]), out), []);
channels.push({ key: "races", messages: pack([
  { title: "🧬 Races & Evolution", description: d(races.intro) + "\n\n" + raceHow.map((x) => "🔸 " + d(x)).join("\n"), image: IMG },
  { title: "📊 Pick Your Race", description: raceTable.rows.map((r) => `${tier[r[1]]} **${r[0]}** (${r[1]}): ${r[2]} · *MP / AP ${r[3]}*`).join("\n") +
    "\n\n🟢 Easy · 🟡 Intermediate · 🟠 Hard · 🔴 Extreme" },
  ...chunks(raceCards, 5).map((group, i) => ({
    title: i ? "🧬 Races (continued)" : "🧬 Every Race & How to Evolve It",
    fields: group.map((c) => ({ name: `${tier[c.k]} ${c.t} · ${c.k}`, value: d(c.d).replace(" **Path:**", "\n**Path:**").replace(/ \*\*Or\*\* /, "\n**Or** "), inline: false }))
  })),
  { title: "⬆️ How Evolving Works", description: raceEvolve.map((x) => "🔸 " + d(x)).join("\n") },
  { title: "❓ Race FAQ", fields: raceFaq.map((f) => ({ name: f.q, value: d(f.a), inline: false })) }
], [btn("Races guide", "/guide#races", "🧬"), btn("Races forum", "/forums?c=races", "💬")]) });

fs.writeFileSync(path.join(root, "discord-bot/content.json"), JSON.stringify({ generatedFrom: "scripts/build-discord-content.mjs", channels }, null, 2) + "\n");
console.log("wrote discord-bot/content.json:", channels.map((c) => `${c.key} (${c.messages.length})`).join(", "));
