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
  { title: "🛒 Shop, Kits & Cosmetics", description: [
    "**In-game** (or right-click the NPCs in the hub)",
    "`/throneshop` Throne Shop: ranks, crate keys, tags, statuses, join messages, name/chat/glow colours, gradients, flight",
    "`/cratemenu` Every crate, your keys and how to get more",
    "`/kitmenu` Your rank kits and their cooldowns",
    "`/levelguide` Your level, XP and how to level up",
    "`/links` Discord, website, store, rules and vote links in chat",
    "`/cosmetics` Equip everything you bought from the Throne Shop",
    "`/tags` · `/namecolor` · `/chatcolor` · `/glowcolor` · `/gradient` · `/status` · `/joinmessage` Equip one kind",
    "`/flytime` Turn bought flight on/off (time only counts down while flying) · `/flytime left` Time left",
    "`/crate keys` How many crate keys you have · `/vote` Vote for free keys",
    "`/afkshard` Your AFK Shards and Keys · `/warp afk` AFK room: 1 AFK Shard every 30 min, 6 shards = 1 AFK Key"
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

// ---------------------------------------------------------------- changelog (#changelog: everything that's new)
channels.push({ key: "changelog", messages: pack([
  { title: "📋 OVERTHRONE: What's New", description: [
    "Here's everything we've added lately. Full patch notes are on the website: https://overthronesmp.net/forums?c=server-updates",
    "",
    "**🆕 Update 1.4: The Caverns**",
    "🔸 **The Caverns** (`/warp caverns`): a deep mine full of mobs, bosses and every kind of node. No level needed",
    "🔸 Every mob kill and node gathered in the Caverns pays **$100 to $10,000**. Bosses pay the most",
    "🔸 New **Cavern Guide** NPC + `/caverns`: track your kills, bosses slain, nodes, cash earned, best payout and time spent",
    "🔸 Skills and explosions can't damage the **hub** or the **RPG world** any more",
    "🔸 **Barghests** toned down: 40 health and max 5 damage a hit"
  ].join("\n") },
  { title: "⚔️ Season 1 · Update 1.3: Professions & Stats", description: [
    "🔸 **Stats:** 1 stat point every level. Build your character with Strength, Vitality, Defense, Attack Speed, Crits, Dodge, Lifesteal, Speed and Mining Speed (`/stats`)",
    "🔸 **Professions:** Mining, Gemology, Farming, Foraging and Combat, levels 1-100 with perks (`/professions`)",
    "🔸 **Gathering nodes:** hit a glowing node 3 times for XP. It respawns after 1 minute",
    "🔸 **AFK Crate:** win kits, a Legendary Key, Throne Shards and more just for being in the AFK room (`/warp afk`)",
    "🔸 **Kit Selector** (`/kits`) with the free Starter kit and your rank kits",
    "🔸 **Redesigned crate menus**, and claim blocks in the Voting Crate",
    "🔸 **The SMP world** (`/smp`): no claims, raiding allowed",
    "🔸 `/wild` takes you to a random spot in the overworld",
    "🔸 **Safe zones:** no damage in the hub or the RPG world"
  ].join("\n") },
  { title: "🛠️ Fixes & Improvements", description: [
    "🔸 Much smoother server performance: big lag spikes fixed",
    "🔸 Players sometimes couldn't take damage anywhere: fixed",
    "🔸 Kits won from crates now always get given",
    "🔸 The anti-cheat no longer flags long-reach weapons and big mobs",
    "🔸 The race selection screen no longer closes on your first join",
    "🔸 The server is now backed up every night",
    "",
    "**Kicked with \"Failed to decode packet\"?** It's a Solo Leveling mod bug. Fully close Minecraft and your launcher, then rejoin.",
    "",
    "Need help? Open a ticket. Got an idea? Drop it in suggestions!"
  ].join("\n") }
]) });

// ---------------------------------------------------------------- staff commands (staff-only channel, /server staffcommands)
channels.push({ key: "staffcommands", messages: pack([
  { title: "📋 Staff Commands", description: [
    "Our own server commands (not the normal Minecraft ones). In-game, you need op. `<...>` = fill in, `[a|b]` = pick one.",
    "Crates: **vote**, **armor**, **weapon**."
  ].join("\n") },
  { title: "🎁 Crates: setup", description: [
    "`/crate create <crate>` **Look at** the block (or stand on it), makes it that crate. Run again to move it",
    "`/crate remove <crate>` Removes the crate (sneak + break the block as staff)",
    "`/crate list` Where every crate is",
    "`/crate hologram <crate>` Re-places the floating text",
    "`/crate preview <crate>` Opens the rewards menu",
    "`/crate infoboard place [height]` CRATES INFO board above you, facing where you look (default 3 up) · `/crate infoboard flip` · `/crate infoboard remove`",
    "Players: left-click or sneak + right-click = preview, right-click with a key = open"
  ].join("\n") },
  { title: "✏️ Crates: rewards", description: [
    "`/crate edit <crate>` In-game editor: click an item in **your inventory** to add it",
    "  Vote crate: left-click = more common, right-click = rarer, shift-left = announce on/off, shift-right = remove",
    "  Armor/Weapon: left-click = cost +1 key, right-click = cost -1, shift-right = remove",
    "`/crate reward cmd <crate> <weight> <command>` Command reward (hold the icon item). `{p}` = player",
    "  e.g. `/crate reward cmd vote 20 eco give {p} 1000`",
    "`/crate reward list <crate>` Every reward with its chance or cost",
    "`/crate reward reset <crate>` Back to the default rewards"
  ].join("\n") },
  { title: "🔑 Keys", description: [
    "`/crate key give <player> <crate> <amount>` Gives key items",
    "`/crate key take <player> <crate> <amount>` Takes keys",
    "`/crate keys` (anyone) How many keys you have",
    "Tebex purchase: `crate key give {username} armor 1` (or `weapon`). Refund/chargeback: `crate key take {username} armor 1`",
    "Tebex chargeback also: `ban {username} Chargeback on the store. Open a ticket on our Discord to appeal.` · unban: `pardon <name>`",
    "Votes also give the vote mod's Vote Key, which works on the vote crate"
  ].join("\n") },
  { title: "✨ Crate particles", description: [
    "`/cratefx here <name> <style> <colour>` Stand on the crate",
    "Styles: `helix` `orbit` `halo` `vortex`",
    "Colours: `ember` `bloodmoon` `abyssal` `dreadforge` `regalia` `throne` `red` `gold` `purple` `aqua` `green` `white`",
    "`/cratefx remove <name>` · `/cratefx list` · `/cratefx burst <name>`",
    "Crates already have their own moving particles, so only add one style if you want extra"
  ].join("\n") },
  { title: "💎 Throne Shards & money", description: [
    "`shards give <player> <amount>` Gives Throne Shards",
    "`eco give <player> <amount>` Gives money"
  ].join("\n") },
  { title: "📈 Levels", description: [
    "`/level` Your level (anyone)",
    "`/level info <player>` Someone's level (anyone)",
    "`/level set <player> <level>` · `/level reset <player>`",
    "`/level xp give <player> <amount>` · `/level xp take <player> <amount>`",
    "`/level debug` Checks the level system and the sidebar match"
  ].join("\n") },
  { title: "🎒 Rank kits", description: [
    "Ranks: **Ronin, Valkyrie, Monarch, Godborn, Overlord**",
    "Put the kit items in your inventory first (your own stuff in a chest), then:",
    "`/deletekit <rank>` then `/createkit <rank> 432000` (432000 = 5 days)",
    "`/kit <rank>` Claim / test a kit",
    "`/kitcd check <player>` Kit cooldowns · `/kitcd reset <player>` Clear them",
    "Each rank needs the permission `neoessentials.kits.<rank>`"
  ].join("\n") },
  { title: "👑 Ranks", description: [
    "`giverank <player> <rank>` Gives the rank + all lower ranks, prefix and class tokens (console / op level 4)",
    "`takerank <player>` Removes all donor ranks (staff ranks stay)",
    "Tebex: purchase `giverank {username} <rank>` · refund/chargeback `takerank {username}` (+ ban on chargeback)"
  ].join("\n") },
  { title: "🧍 Menu NPCs", description: [
    "`/npcmenu spawn <cosmetics|crates|throneshop|kits|levels|links|claims|smp|professions|caverns>` New glowing NPC with hologram where you stand",
    "`/npcmenu spawncmd <title> <command>` NPC that runs a command, e.g. `/npcmenu spawncmd Hunters warp hunters`",
    "`/npcmenu attach <cosmetics|crates|throneshop|kits|levels|links|claims|smp|professions|caverns>` Look at an NPC: it opens that menu",
    "`/npcmenu attachcmd <command>` Look at an NPC: it runs that command · `/npcmenu detach` back to normal",
    "`/npcmenu grab` then `/npcmenu put` Move an NPC + its hologram to where you stand",
    "`/npcmenu hologram <text>` New hologram text (`|` = new line, `&` colours) · `/npcmenu remove` Delete NPC",
    "`/npcmenu styleall` Every other NPC within 64 blocks gets the same glow + big title + RIGHT-CLICK TO VIEW (clicking them is unchanged)",
    "`/npcmenu style [title]` Same for the NPC you look at · `/npcmenu unstyle` Undo",
    "`/npcmenu glow off` / `/npcmenu glow on` Glow off/on for the NPC you look at (stays that way)",
    "`/npcmenu clearholo [radius]` Delete all floating text near you (not crates), then `/npcmenu fixall` + `/npcmenu styleall`",
    "`/npcmenu fixall` Hide NPC name tags + redo all holograms nearby · `/npcmenu debug` Click debug on/off",
    "Easy NPC wand / mover / sneak-click still work on menu NPCs (skins etc.)"
  ].join("\n") },
  { title: "🗣️ Hub dialog NPCs", description: [
    "`/npcfix apply` Updates Ranks / Server Info / Crates / Hunters texts in npc_texts.json (backup kept)",
    "`/npcfix refresh` Puts the new texts on the NPCs without moving them",
    "`/npcfix look <crates|ranks|info|hunters>` Updates the NPC you look at · `/npcfix hunters` Places the Hunters NPC"
  ].join("\n") },
  { title: "🛒 Throne Shop & flight", description: [
    "`/throneshop debug` Shows the shard balance the shop reads (check this works before selling!)",
    "`/throneshop placeholder <text|auto>` Set the balance placeholder by hand",
    "Purchases take shards with `shards take <player> <amount>`",
    "`/flytime give <player> <minutes>` Give flight time · `/flytime take <player>` Remove all of it",
    "`otcosmetic give|take <player> <kind> <id>` Give/take a cosmetic (Tebex uses this) · `otcosmetic list <kind>` All ids",
    "Kinds: `tag` `namecolor` `chatcolor` `glow` `gradient` `status` `joinmessage` · players equip with `/cosmetics`"
  ].join("\n") },
  { title: "🛡️ AntiCheat & ClearLag", description: [
    "Alerts show in staff chat automatically (X-ray-like mining, kill-aura/auto-click, impossible item stacks)",
    "Strikes: 1st warning, 2nd kick, 3rd ban (staff/ops are never punished). X-ray mining is alert-only: check before banning",
    "`/ac log` Last 20 alerts · `/ac check <player>` Strikes + mining numbers · `/ac strikes reset <player>` · `/ac alerts` Your alerts on/off",
    "Ground items are cleared every hour (warnings at 1 min, 30 s and a 10 s countdown)",
    "`/clearlag now` Clear in 10 seconds · `/clearlag status` Time to the next clear"
  ].join("\n") },
  { title: "💤 AFK Room", description: [
    "`/afkzone pos1` + `/afkzone pos2` Stand in opposite corners of the room to set it",
    "`/afkzone board [height]` Info board where you stand · `/afkzone board flip` · `/afkzone board remove`",
    "`/afkzone info` · `/afkzone give <player> <n>` Give AFK Shards (testing)",
    "1 AFK Shard every 30 min in the room, 6 shards = 1 AFK Key (AFK Crate: `/crate create afk`, fill with `/crate edit afk`)",
    "Players: `/afkshard` · `/warp afk` (make it with your warp command while standing in the room)"
  ].join("\n") },
  { title: "⛏️ Professions & Nodes", description: [
    "Professions: `mining` `gemology` `farming` `foraging` + `combat` from mob kills (levels 1-100). Nodes give profession XP + half as normal level XP, **drop nothing**, and respawn after 1 minute with a countdown",
    "**Look at the block** (within 6 blocks), then:",
    "`/node create <profession> <level> <xp> [name]` Make it a node, e.g. `/node create mining 25 100 Diamond` (crops: use FULLY grown ones)",
    "`/node remove` Back to a normal block (deletes its text) · `/node info` What node it is + respawn time",
    "Anywhere:",
    "`/node list` Nodes within 64 blocks with coordinates · `/node respawnall` Respawn every gathered node now",
    "`/node holo` Re-place missing floating texts near you · `/node fixall` Fix every node: real block back + fresh floating text (run near nodes in unloaded areas)",
    "Can't see a node to remove it? `/node list` → go there → `/node respawnall` → look at it → `/node remove`",
    "`/professions <player>` Someone's levels · `/profession set <player> <profession> <level>` Set a level",
    "Players: `/professions` (levels in chat) · `/professionmenu` (menu) · NPC: `/npcmenu spawn professions`",
    "Gathering needs survival and the profession level of the node. Creative can't gather. Put nodes where players can break blocks (not claimed/protected)"
  ].join("\n") },
  { title: "⛏️ Node presets: Mining", description: [
    "Look at the ore, then paste (level · XP):",
    "`/node create mining 1 10 Coal` Coal Ore (Lv 1 · 10 XP)",
    "`/node create mining 3 15 Copper` Copper Ore (Lv 3 · 15 XP)",
    "`/node create mining 5 25 Iron` Iron Ore (Lv 5 · 25 XP)",
    "`/node create mining 10 40 Gold` Gold Ore (Lv 10 · 40 XP)",
    "`/node create mining 12 45 Redstone` Redstone Ore (Lv 12 · 45 XP)",
    "`/node create mining 15 55 Lapis` Lapis Ore (Lv 15 · 55 XP)",
    "`/node create mining 25 100 Diamond` Diamond Ore (Lv 25 · 100 XP)",
    "`/node create mining 30 120 Emerald` Emerald Ore (Lv 30 · 120 XP)",
    "`/node create mining 40 180 Ancient Debris` Ancient Debris (Lv 40 · 180 XP)"
  ].join("\n") },
  { title: "💎 Node presets: Gemology", description: [
    "Look at the gem block, then paste:",
    "`/node create gemology 1 15 Amethyst` Amethyst Cluster / Budding Amethyst (Lv 1 · 15 XP)",
    "`/node create gemology 5 25 Quartz` Nether Quartz Ore (Lv 5 · 25 XP)",
    "`/node create gemology 20 90 Diamond` Diamond Ore (Lv 20 · 90 XP)",
    "`/node create gemology 25 110 Emerald` Emerald Ore (Lv 25 · 110 XP)",
    "`/node create gemology <level> <xp> <name>` Modded gem ores work too: same command with your own level/XP/name"
  ].join("\n") },
  { title: "🌾 Node presets: Farming", description: [
    "Look at a **fully grown** crop on farmland, then paste:",
    "`/node create farming 1 10 Wheat` Wheat (Lv 1 · 10 XP)",
    "`/node create farming 3 12 Carrot` Carrots (Lv 3 · 12 XP)",
    "`/node create farming 5 15 Potato` Potatoes (Lv 5 · 15 XP)",
    "`/node create farming 8 20 Beetroot` Beetroots (Lv 8 · 20 XP)",
    "`/node create farming 12 30 Pumpkin` Pumpkin (Lv 12 · 30 XP)",
    "`/node create farming 15 35 Melon` Melon (Lv 15 · 35 XP)",
    "`/node create farming 25 60 Nether Wart` Nether Wart, fully grown (Lv 25 · 60 XP)"
  ].join("\n") },
  { title: "🌲 Node presets: Foraging", description: [
    "Look at the log, then paste:",
    "`/node create foraging 1 10 Oak` Oak Log (Lv 1 · 10 XP)",
    "`/node create foraging 3 12 Birch` Birch Log (Lv 3 · 12 XP)",
    "`/node create foraging 5 15 Spruce` Spruce Log (Lv 5 · 15 XP)",
    "`/node create foraging 10 25 Jungle` Jungle Log (Lv 10 · 25 XP)",
    "`/node create foraging 15 35 Dark Oak` Dark Oak Log (Lv 15 · 35 XP)",
    "`/node create foraging 20 45 Cherry` Cherry Log (Lv 20 · 45 XP)"
  ].join("\n") },
  { title: "📊 Stats & Combat", description: [
    "Players get **1 stat point per level** and spend them in the Level Guide NPC → **YOUR STATS** (or `/stats`)",
    "Stats (each has a max): Strength +25% dmg · Vitality +25% HP · Defense +20% armor · Attack Speed +15% · Crit Chance +10% · Crit Damage +50% · Dodge +5% · Lifesteal +5% · Speed +5% · Mining Speed +30%",
    "Reset: 500 Throne Shards or $2,000,000 (in the menu)",
    "`/stats check <player>` Their points + stats · `/stats reset <player>` Free reset",
    "`/stats debug` Checks shards/money can be read + every stat works · `/stats moneyplaceholder <text|auto>` Set the money placeholder by hand",
    "**Combat** profession: killing mobs gives Combat XP (max 400/min). Perks at Lv 100: Combat +10% melee damage, Mining +20% mining speed"
  ].join("\n") },
  { title: "🔍 Player checks", description: [
    "`/shardcheck <player>` Throne Shards · `/flytime check <player>` Bought flight + can they fly",
    "`/racecheck <player>` Tensura race · `/kitmenu <player>` Their kits + cooldowns (view only)",
    "`/fly <player>` Turn off leftover flight (race flight, e.g. Dragonoid, is normal and comes back)"
  ].join("\n") },
  { title: "⛏️ The Caverns", description: [
    "Every mob kill and every node gathered **inside the Caverns area** pays $100-$10,000 (mobs by max health, nodes by level, ±20%). Max $50,000 per player per minute",
    "`/cavernadmin pos1` Stand at one corner (floor) · `/cavernadmin pos2` Opposite corner (ceiling), same world",
    "`/cavernadmin info` Shows the area + whether you're inside it",
    "`/cavernadmin stats <player>` Their kills, bosses, nodes, cash, best payout, time · `/cavernadmin reset <player>` Clear them",
    "NPC: `/npcmenu spawn caverns` (Cavern Guide) · Players: `/caverns` menu, `/warp caverns`",
    "Settings (cash min/max, per-minute cap, how much mobs/nodes pay) are at the top of `caverns.js`"
  ].join("\n") },
  { title: "👹 Mob & boss spawns", description: [
    "Place the mob with its spawn egg, **look at it**, then: `/setmob [minutes]` or `/setboss [minutes]` (default 60 min)",
    "It never despawns, gets pulled back if it wanders 32+ blocks, and respawns at the same spot after it's killed. Floating text shows its **real name** + a respawn countdown. Boss kills are announced",
    "`/mobspawn list` Spawns in this world · `/mobspawn info` Nearest spawn details + puts its text back · `/mobspawn respawnall` Respawn every killed one now · `/mobspawn holo` Put floating texts back",
    "Bosses stay within 8 blocks of their spot (mobs 24). While a boss is dead, players within 48 blocks see a red bar counting down to its return",
    "Near a spawn: `/mobspawn time <minutes>` Change its timer · `/mobspawn remove` Stop tracking it (the mob stays alive)",
    "Bosses set with `/setboss` count as bosses for Caverns cash + trackers"
  ].join("\n") },
  { title: "⚖️ Mob tweaks", description: [
    "`mob_tweaks.js` sets a mob's health and caps how hard it hits. Now: **Barghest** + 40 HP, **Direwolf** 5 HP + max 2 damage per hit (Barghest max 5) (fire still works)",
    "`/mobtweaks` Lists the tweaks + matching mobs within 64 blocks",
    "Check a mob's health: `/data get entity @e[type=tensura:barghest,limit=1,sort=nearest] Health`",
    "Add a mob: copy the line `{ match: 'barghest', hp: 40, damage: 5 },` in the file, change the name and numbers, then `/reload`"
  ].join("\n") },
  { title: "🛡️ Hub protection & claims", description: [
    "Hub + RPG world are FTB Chunks claims owned by the `hub` team. **TenSura Compat: FTB** stops skills breaking blocks in claims (`config/tensura/ftb_config`: keep `abilityGrief = false`)",
    "`/ftbchunks info` Who owns the chunk you're in · `/ftbchunks admin claim_as hub#0d6da155 <radius in blocks>` Claim more for the hub team (use Tab on the team name)",
    "`/ftbchunks admin bypass_protection` Toggle your bypass (on = you can build/use skills in claims). Test as a player with it OFF",
    "`/gamerule skillGriefing true` Keep this ON (it's server-wide: false stops skills everywhere)",
    "`/safeexplosions` Explosions blocked in hub/RPG? · `/damagezones` Is this world a no-damage safe zone?",
    "New players: no damage while picking a race + first 15 min of play (below level 5). `/newbieshield <player> <minutes>` give/extend it (0 = end it)"
  ].join("\n") },
  { title: "🚫 Banned skills", description: [
    "Banned: Predator, Gluttony, Creator, Fusionist, Infinity Prison, Cultivator, Pride, Jinchuriki, Crasher, Coalescence, Victorious Harbinger",
    "They're out of the reincarnation rolls (`config/tensura/reincarnation_config.toml`) and `skill_blacklist.js` removes them from anyone who has one (on login + every 30 s)",
    "`/skillban check <player>` What banned skills they have · `/skillban scan` Remove from everyone online now",
    "`/skillban list` · `/skillban status` (is the skill system found?) · Edit the `BANNED` list at the top of the file to change it"
  ].join("\n") },
  { title: "🧬 Tensura", description: [
    "`/tensura edit forceevo <player> demonLord` Make someone a Demon Lord",
    "`/tensura edit race <player> tensura:god_slime true true` Set a race"
  ].join("\n") },
  { title: "📢 Chat & votes", description: [
    "`/announce` Send the next server announcement now (they also go out every 30 min)",
    "`/announce welcome` See the join message",
    "`/vote` Vote menu (anyone)",
    "`/neoessentials config split` Clears the NeoEssentials \"config splitting\" notice"
  ].join("\n") }
]) });

fs.writeFileSync(path.join(root, "discord-bot/content.json"), JSON.stringify({ generatedFrom: "scripts/build-discord-content.mjs", channels }, null, 2) + "\n");
console.log("wrote discord-bot/content.json:", channels.map((c) => `${c.key} (${c.messages.length})`).join(", "));
