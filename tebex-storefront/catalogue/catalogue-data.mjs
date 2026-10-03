// OVERTHRONE SMP – Tebex product catalogue (single source of truth).
//
// Everything here is designed to pass Tebex store review under Mojang's
// Minecraft Usage Guidelines:
//   • No item, ability or access that makes a paying player stronger than a
//     non-paying player (no gear, no fly, no personal XP/drop boosts).
//   • Crates and Throne Shards only ever grant cosmetics (or more shards).
//   • Boosters are GLOBAL: every online player benefits equally.
//   • No capes or cape-like back cosmetics.
//
// Prices are recommendations in AUD. Command placeholders (<...>) are NOT real
// commands – the server developer replaces each one with the real command.

export const BRAND = {
  name: "OVERTHRONE SMP",
  slogan: "Don’t reach the throne. Overthrow it.",
  currency: "AUD"
};

// ------------------------------------------------------------------ helpers
const money = (n) => Math.max(0.99, Math.ceil(n) - 0.01);
export const fmt = (n) => "A$" + n.toFixed(2);

// ------------------------------------------------------------------ categories (store order)
export const CATEGORIES = [
  { key: "featured", name: "Featured", icon: "featured", note: "Rotating spotlight: limited-time and seasonal highlights." },
  { key: "ranks", name: "Ranks", icon: "ranks", note: "Lifetime supporter ranks. Cosmetic and convenience perks only." },
  { key: "crate-keys", name: "Crate Keys", icon: "crate-keys", note: "Keys for the six Gate Crates. All crate rewards are cosmetic or Throne Shards." },
  { key: "throne-shards", name: "Throne Shards", icon: "shards", note: "Premium cosmetic currency, spent in the in-game Throne Vault." },
  { key: "bundles", name: "Bundles", icon: "bundles", note: "Best-value combinations of ranks, keys, shards and cosmetics." },
  { key: "cosmetics", name: "Cosmetics", icon: "cosmetics", note: "Auras, trails, effects, titles, skins and more." },
  { key: "pets", name: "Pets", icon: "pet", note: "Cosmetic companions. They follow you; they never fight." },
  { key: "boosters", name: "Boosters", icon: "booster", note: "Global boosts: every player online benefits." },
  { key: "starter", name: "Starter", icon: "starter", note: "One-time welcome packs for new Hunters." },
  { key: "seasonal", name: "Seasonal", icon: "seasonal", note: "Event packages. Hidden until their event is live." },
  { key: "utility", name: "Utility", icon: "utility", note: "Name, chat and convenience tokens with no gameplay effect." },
  { key: "gifts", name: "Gifts", icon: "gift", note: "Buy for a friend. Enter their Minecraft username at checkout." }
];

// ------------------------------------------------------------------ server facts (from the owner's mod summary)
// Minecraft 1.21.1 · NeoForge 21.1.251 · Java 21.
// The confirmed mod list has NO permissions/prefix mod, NO essentials-style mod (homes, /hat, /nick…),
// NO economy, NO auction house, NO crate mod and NO cosmetics mod. Every store perk therefore needs a
// DEV SYSTEM (new mod, KubeJS script or config). Commands are placeholders until the developer
// supplies real ones. "Suggested" mods are options for the developer, not confirmed installs.
export const CONFIRMED_MODS = [
  "Solo Leveling: Reawakening (SLR)", "Tensura: Reincarnated", "Tensura Leveling SLR: True Isekai", "Beyond Adventures",
  "Pufferfish's Skills", "FTB Quests", "KubeJS", "RenderJS", "Easy NPC", "Epic Fight", "Epic Fight Skill Tree",
  "Iron's Spells 'n Spellbooks", "Apothic Attributes", "Open Parties and Claims", "Lootr", "Sophisticated Backpacks",
  "Waystones", "Xaero's Minimap / World Map", "Simply Swords", "Weapons of Miracles", "The Aether",
  "YUNG's Better Dungeons", "Dungeons and Taverns", "Jade / Jade Addons"
];

// ------------------------------------------------------------------ ranks (EXACTLY FIVE; Overlord is the permanent top rank)
export const RANK_ORDER = ["SUPPORTER", "ELITE", "CHAMPION", "WARLORD", "OVERLORD"];
export const RANKS = [
  { id: "RANK-001", key: "SUPPORTER", name: "Supporter", price: 9.99, color: "#E0434F", tier: 1, icon: "🔴", discord: "Supporter",
    lore: "Every rebellion begins with a single spark. Supporters lit the first fire beneath the throne.",
    short: "The first mark of the rebellion.", grants: { keys: { EMBER: 2 }, shards: 500, cosmetics: ["PARTICLE_CRIMSON_SPARK"] } },
  { id: "RANK-002", key: "ELITE", name: "Elite", price: 24.99, color: "#9B6BFF", tier: 2, icon: "💎", discord: "Elite",
    lore: "Hunters who survived their first Gate and came back hungry. The Elite are marked by violet fire.",
    short: "Violet prestige for proven Hunters.", grants: { keys: { BLOODMOON: 3 }, shards: 1000, cosmetics: ["AURA_VIOLET_EMBER"] } },
  { id: "RANK-003", key: "CHAMPION", name: "Champion", price: 49.99, color: "#E39B5B", tier: 3, icon: "🏆", discord: "Champion",
    lore: "Champions carry the scars of a hundred Gates. Bronze-forged and battle-proven.",
    short: "Battle-proven bronze, with join messages and /hat.", grants: { keys: { ABYSSAL: 3 }, shards: 2000, cosmetics: ["KILL_BRONZE_BANNER"] } },
  { id: "RANK-005", key: "WARLORD", name: "Warlord", price: 89.99, color: "#E25822", tier: 4, icon: "⚔️", discord: "Warlord",
    lore: "Warlords lead guilds through the deepest Gates. Their banners burn crimson-orange across Netherfall.",
    short: "Command the battlefield: /nick, the Warlord title and Dreadforge keys.", grants: { keys: { DREADFORGE: 3 }, shards: 3500, cosmetics: ["TITLE_WARLORD", "TRAIL_WAR_BANNER"] } },
  { id: "RANK-004", key: "OVERLORD", name: "Overlord", price: 149.99, color: "#F2C14E", tier: 5, icon: "👑", discord: "Overlord",
    lore: "The highest donor rank. Overlords stand closest to the throne – and closest to tearing it down.",
    short: "The highest donor rank: the golden crown, an animated prefix and the Hall of Thrones.", grants: { keys: { THRONE: 3, REGALIA: 3 }, shards: 6000, cosmetics: ["AURA_OVERLORD_CROWN", "TITLE_OVERLORD", "PET_OVERLORD_RAVEN"] } }
];

// Perk matrix. values[] follow RANK_ORDER. rating: Safe / Borderline / Risky (Mojang Usage Guidelines + Tebex review).
// default: include in the rank by default? Risky perks default to false – the owner decides.
const P = (perk, values, rating, system, status, alt, opts = {}) => ({ perk, values, rating, system, status, alt, include: rating !== "Risky", ...opts });
export const PERKS = [
  P("Rank prefix in chat & tab", ["[SUPPORTER]", "[ELITE]", "[CHAMPION]", "[WARLORD]", "[OVERLORD] (animated)"], "Safe", "Permissions + prefix mod (suggested: LuckPerms or FTB Ranks – not in mod list)", "DEV SYSTEM REQUIRED", ""),
  P("Coloured name", ["Crimson", "Violet", "Bronze", "Flame", "Gold"], "Safe", "Prefix/chat formatting mod", "DEV SYSTEM REQUIRED", ""),
  P("Discord role", ["@Supporter", "@Elite", "@Champion", "@Warlord", "@Overlord"], "Safe", "Tebex Discord Actions (built into Tebex)", "Ready in Tebex", ""),
  P("Join queue priority", ["Tier 1", "Tier 2", "Tier 3", "Tier 4", "Tier 5"], "Safe", "Queue/proxy system", "DEV SYSTEM REQUIRED", ""),
  P("Throne Shards on purchase", ["500", "1,000", "2,000", "3,500", "6,000"], "Safe", "Throne Shard currency (cosmetic-only)", "DEV SYSTEM REQUIRED", "", { kind: "grant" }),
  P("Crate keys on purchase", ["2× Ember", "3× Bloodmoon", "3× Abyssal", "3× Dreadforge", "3× Throne + 3× Regalia"], "Safe", "Crate system (cosmetic reward pool)", "DEV SYSTEM REQUIRED", "If crates use the gear pool this becomes Risky.", { kind: "grant" }),
  P("Rank-exclusive cosmetic", ["Crimson Spark particle", "Violet Ember aura", "Bronze Banner kill effect", "Warlord title + War Banner trail", "Overlord Crown aura + title + Overlord Raven pet"], "Safe", "Cosmetics system", "DEV SYSTEM REQUIRED", "", { kind: "grant" }),
  P("Chat colours (/chatcolor)", ["✗", "4 colours", "8 colours", "12 colours", "All + gradients"], "Safe", "Chat formatting mod or KubeJS", "DEV SYSTEM REQUIRED", ""),
  P("Chat emoji pack", ["✓", "✓", "✓", "✓", "✓"], "Safe", "Chat formatting / resource pack", "DEV SYSTEM REQUIRED", ""),
  P("Custom join message", ["✗", "✗", "✓", "✓", "✓"], "Safe", "Join-message mod or KubeJS", "DEV SYSTEM REQUIRED", ""),
  P("Server-wide arrival announcement", ["✗", "✗", "✗", "✓", "✓"], "Safe", "KubeJS (on player join)", "DEV SYSTEM REQUIRED", ""),
  P("/hat", ["✗", "✗", "✓", "✓", "✓"], "Safe", "Essentials-style mod (suggested: FTB Essentials – not in mod list) or KubeJS", "DEV SYSTEM REQUIRED", ""),
  P("/nick (staff-moderated)", ["✗", "✗", "✗", "✓", "✓"], "Safe", "Essentials-style mod or KubeJS", "DEV SYSTEM REQUIRED", ""),
  P("/sit & /lay", ["✗", "✗", "✗", "✗", "✓"], "Safe", "Sit mod or KubeJS (not in mod list)", "DEV SYSTEM REQUIRED", ""),
  P("Emotes", ["✗", "✗", "Champion Salutes", "War Cries", "All rank emotes"], "Safe", "Emote mod (not in mod list)", "DEV SYSTEM REQUIRED", ""),
  P("/fly in the OVERTHRONE hub only", ["✗", "✗", "✗", "✓", "✓"], "Safe", "Per-world permission (hub only)", "DEV SYSTEM REQUIRED", "Must be disabled in every gameplay world."),
  P("Hall of Thrones listing (website + Discord)", ["✗", "✗", "✗", "✗", "✓"], "Safe", "Website admin panel + Discord", "Ready (manual)", ""),
  P("Homes (/sethome)", ["2", "3", "4", "5", "6"], "Borderline", "Essentials-style mod (not in mod list)", "DEV SYSTEM REQUIRED", "Give every player the same home count; ranks get cosmetic home icons instead."),
  P("Bonus claim chunks (Open Parties and Claims)", ["+25", "+50", "+75", "+100", "+150"], "Borderline", "Open Parties and Claims + permission-based claim limits", "UNVERIFIED (OPAC permission support must be confirmed)", "Same claim limit for everyone; earn extra chunks through Hunter rank progression."),
  P("Auction House listing slots", ["5", "7", "9", "11", "15"], "Borderline", "Auction House mod (not in mod list)", "DEV SYSTEM REQUIRED", "Same slots for everyone; ranks get a cosmetic listing highlight."),
  P("Class Reset Tokens on purchase", ["1", "2", "3", "4", "5"], "Borderline", "Custom class system (Warrior/Assassin/Mage/Ranger/Guardian)", "DEV SYSTEM REQUIRED", "Make class resets free on a cooldown for everyone.", { kind: "grant" }),
  P("Race Reset Token on purchase (Tensura)", ["✗", "✗", "1", "1", "2"], "Borderline", "Tensura: Reincarnated race reset", "UNVERIFIED (no confirmed reset command)", "Offer resets in-game via a quest item for everyone.", { kind: "grant" }),
  P("/back after death", ["✗", "✗", "✗", "✓", "✓"], "Risky", "Essentials-style mod", "DEV SYSTEM REQUIRED", "Remove. Use a cosmetic death effect instead."),
  P("Sophisticated Backpack on purchase", ["Iron", "Gold", "Diamond", "Netherite", "Netherite + upgrades"], "Risky", "Sophisticated Backpacks (installed)", "Real mod – item ID UNVERIFIED", "Replace with Throne Shards of equal value.", { kind: "grant" }),
  P("Waystones Warp/Return Scrolls on purchase", ["✗", "3", "5", "8", "12"], "Risky", "Waystones (installed)", "Real mod – item IDs UNVERIFIED", "Remove; travel stays earned."),
  P("Iron's Spells ink/scrolls on purchase", ["✗", "✗", "Rare ink ×2", "Epic ink ×2", "Legendary ink ×1"], "Risky", "Iron's Spells 'n Spellbooks (installed)", "Real mod – item IDs UNVERIFIED", "Remove; offer a cosmetic spell-cast particle."),
  P("Pufferfish's Skills points on purchase", ["✗", "✗", "✗", "2", "4"], "Risky", "Pufferfish's Skills (installed)", "Command UNVERIFIED", "Remove; skill points stay earned."),
  P("Rank kit (/kit)", ["✗", "✗", "✗", "Weekly", "Daily"], "Risky", "Kit mod (not in mod list)", "DEV SYSTEM REQUIRED", "Cosmetic-only kit (titles/particles) or remove."),
  P("Keep XP on death", ["✗", "✗", "✗", "✗", "✓"], "Risky", "KubeJS or gamerule per player (custom)", "DEV SYSTEM REQUIRED", "Remove; use a cosmetic death effect."),
  P("/fly in survival worlds", ["✗", "✗", "✗", "✗", "✓"], "Risky", "Permissions", "DEV SYSTEM REQUIRED", "Hub-only /fly (already included).")
];

// ------------------------------------------------------------------ crates
const TIERS = ["Common", "Rare", "Epic", "Legendary", "Mythic"];
export const CRATES = [
  {
    key: "EMBER", name: "Ember Crate", keyName: "Ember Key", tier: 1, prestige: "Common", color: "#F2A541", base: 1.99,
    lore: "Embers drift up from the cracked earth wherever a Gate has opened. Hunters gather them by the handful.",
    keyArt: "a blackened iron key with a glowing amber ember core in its bow, faint sparks drifting off the teeth",
    crateArt: "a small soot-black iron-banded chest with amber light leaking through its seams and embers rising from the lid",
    odds: [62, 27, 8, 2.5, 0.5],
    rewards: ["150–300 Throne Shards; Common trails and chat tags", "400–600 Throne Shards; Rare particles and titles", "1,000 Throne Shards; Epic kill and death effects", "2,500 Throne Shards; Legendary auras", "Jackpot: Ashen Halo aura (crate exclusive)"],
    jackpot: "Ashen Halo – a slow-turning ring of ash and amber embers above the head"
  },
  {
    key: "BLOODMOON", name: "Bloodmoon Crate", keyName: "Bloodmoon Key", tier: 2, prestige: "Uncommon", color: "#D61F3C", base: 3.49,
    lore: "When the moon bleeds, the Gates widen. Bloodmoon Crates wash up in the red light, sealed with old wax.",
    keyArt: "a crimson-steel key whose bow is a blood-red moon disc in a thorned frame, dripping red light",
    crateArt: "a dark wooden reliquary chest sealed with blood-red wax, a full crimson moon glowing behind it",
    odds: [55, 30, 11, 3.4, 0.6],
    rewards: ["250–500 Throne Shards; Common and Rare cosmetics", "600–900 Throne Shards; Rare titles, tags and trails", "1,500 Throne Shards; Epic kill effects and teleport effects", "3,500 Throne Shards; Legendary auras and pets", "Jackpot: Bloodmoon Eclipse aura (crate exclusive)"],
    jackpot: "Bloodmoon Eclipse – a red moon eclipses behind the player while crimson light pulses outward"
  },
  {
    key: "ABYSSAL", name: "Abyssal Crate", keyName: "Abyssal Key", tier: 3, prestige: "Rare", color: "#7B4DFF", base: 4.99,
    lore: "Dredged from the bottom of the deepest Gates, where light forgets itself.",
    keyArt: "an obsidian key with violet-black void energy swirling inside a cracked glass bow, chains wrapped around the shaft",
    crateArt: "an obsidian chest bound in chains, a violet void portal swirling where the lock should be",
    odds: [48, 32, 14, 5, 1],
    rewards: ["400–700 Throne Shards; Rare cosmetics", "900–1,200 Throne Shards; Epic trails and particles", "2,000 Throne Shards; Epic pets and teleport effects", "5,000 Throne Shards; Legendary weapon skins", "Jackpot: Voidborn Wraith pet (crate exclusive)"],
    jackpot: "Voidborn Wraith – a cosmetic shadow-wraith companion trailing violet mist"
  },
  {
    key: "DREADFORGE", name: "Dreadforge Crate", keyName: "Dreadforge Key", tier: 4, prestige: "Epic", color: "#FF6A1A", base: 6.99,
    lore: "Hammered in the forges beneath Netherfall, where the dead still work the bellows.",
    keyArt: "a heavy blackened-steel key glowing molten orange along its cracks, hammered rivets and a skull-shaped bow",
    crateArt: "a massive anvil-shaped forged-iron crate glowing molten orange from within, sparks and smoke rising",
    odds: [40, 34, 18, 6.5, 1.5],
    rewards: ["600–900 Throne Shards; Epic cosmetics", "1,200–1,600 Throne Shards; Epic armour and weapon skins", "2,500 Throne Shards; Legendary kill effects", "6,000 Throne Shards; Legendary armour skin sets", "Jackpot: Molten Throne armour skin set (crate exclusive)"],
    jackpot: "Molten Throne – a cosmetic armour skin set with glowing magma seams"
  },
  {
    key: "REGALIA", name: "Regalia Crate", keyName: "Regalia Key", tier: 5, prestige: "Legendary", color: "#E6C068", base: 9.99,
    lore: "Treasures of fallen kings: sceptres, signets and stolen crowns, sealed in gold for whoever claims them next.",
    keyArt: "an ornate dark-gold key with a crown-shaped bow set with a single crimson gemstone, fine engraved filigree",
    crateArt: "a royal black-and-gold treasure coffer with crown motifs, crimson velvet inside and golden light spilling out",
    odds: [30, 36, 22, 9.5, 2.5],
    rewards: ["900–1,300 Throne Shards; Epic cosmetics", "1,800–2,400 Throne Shards; Legendary titles and tags", "3,500 Throne Shards; Legendary pets and auras", "8,000 Throne Shards; Mythic chat and teleport effects", "Jackpot: Gilded Regalia weapon skin set (crate exclusive)"],
    jackpot: "Gilded Regalia – a set of cosmetic weapon skins in black steel and gold filigree"
  },
  {
    key: "THRONE", name: "Throne Crate", keyName: "Throne Key", tier: 6, prestige: "Mythic", color: "#FF2E4D", base: 14.99,
    lore: "There is only one throne. Every Throne Crate holds a fragment of it.",
    keyArt: "a legendary key forged from a shard of a broken obsidian throne, crimson energy veins, gold crown-shaped bow",
    crateArt: "a monolithic obsidian crate shaped like a miniature broken throne, crimson cracks glowing, dark-gold trim and drifting embers",
    odds: [20, 35, 28, 13, 4],
    rewards: ["1,500–2,000 Throne Shards; Legendary cosmetics", "3,000 Throne Shards; Legendary auras and pets", "5,000 Throne Shards; Mythic effects", "12,000 Throne Shards; Mythic armour skin sets", "Jackpot: The Empty Throne aura + title “Throne Taker” (crate exclusive)"],
    jackpot: "The Empty Throne – a spectral broken throne rises behind the player; awards the title “Throne Taker”"
  }
];
// Optional GEAR reward pools using items from installed mods. Every row is RISKY under Mojang's
// guidelines (paid crates containing gameplay items). They are listed so the owner can choose; the
// default crates use the cosmetic pool above. Item IDs are UNVERIFIED – the developer must confirm them.
export const GEAR_POOLS = {
  EMBER: ["Sophisticated Backpacks: Copper Backpack", "Waystones: Return Scroll ×2", "Iron's Spells: Common Ink ×3"],
  BLOODMOON: ["Sophisticated Backpacks: Iron Backpack", "Waystones: Warp Scroll ×2", "Iron's Spells: Uncommon Ink ×2"],
  ABYSSAL: ["Sophisticated Backpacks: Gold Backpack", "Iron's Spells: Rare Ink ×2", "Epic Fight: Skill Book (choose)"],
  DREADFORGE: ["Simply Swords: a unique weapon (choose item)", "Sophisticated Backpacks: Diamond Backpack", "Iron's Spells: Epic Ink"],
  REGALIA: ["Weapons of Miracles: a weapon (choose item)", "Sophisticated Backpacks: Netherite Backpack", "Iron's Spells: Legendary Ink"],
  THRONE: ["SLR / Tensura: a high-tier item (choose item)", "Weapons of Miracles: a top-tier weapon (choose item)", "Sophisticated Backpacks: Netherite Backpack + upgrades"]
};

export const KEY_QTYS = [
  { qty: 1, discount: 0 }, { qty: 5, discount: 0.10 }, { qty: 10, discount: 0.15 },
  { qty: 25, discount: 0.20 }, { qty: 50, discount: 0.25 }, { qty: 100, discount: 0.30 }
];
export const CRATE_TIERS = TIERS;

// ------------------------------------------------------------------ cosmetics
export const RARITY_PRICE = { Common: 2.99, Rare: 4.99, Epic: 7.99, Legendary: 12.99, Mythic: 19.99 };
// [code, name, type, rarity, description, art]
const C = (code, name, type, rarity, desc, art, cat = "cosmetics") => ({ code, name, type, rarity, desc, art, cat });
export const COSMETICS = [
  C("AURA_CRIMSON_HALO", "Crimson Halo", "Aura", "Epic", "A slow ring of crimson light orbits your head, pulsing like a heartbeat.", "a floating ring of crimson light and tiny red runes hovering above an empty dark-iron helmet"),
  C("AURA_OBSIDIAN_CROWN", "Obsidian Crown", "Aura", "Legendary", "A spectral crown of black glass hovers above you, shedding crimson sparks.", "a translucent obsidian crown floating in midair, crimson sparks falling from its points"),
  C("AURA_ABYSSAL_FLAME", "Abyssal Flame", "Aura", "Mythic", "Black-violet fire licks upward around you without ever burning.", "a column of black and violet flame swirling around an invisible figure"),
  C("TRAIL_BLOODSTEP", "Bloodstep", "Trail", "Rare", "Each footstep leaves a fading crimson sigil on the ground.", "glowing crimson footprint sigils fading on cracked black stone"),
  C("TRAIL_EMBER_WAKE", "Ember Wake", "Trail", "Common", "A soft wake of drifting embers follows wherever you walk.", "a trail of amber embers drifting across dark ground"),
  C("TRAIL_CRYSTAL_SHARD", "Shattered Crystal", "Trail", "Epic", "Red crystal shards sprout and shatter behind you.", "small glowing red crystal shards erupting from black ground and shattering"),
  C("PARTICLE_FALLING_ASH", "Falling Ash", "Particle", "Common", "Grey ash drifts down around you like a quiet funeral.", "slow falling grey ash flakes against a black background with faint red light"),
  C("PARTICLE_ORBITING_RUNES", "Orbiting Runes", "Particle", "Rare", "Three crimson runes slowly orbit your body.", "three glowing crimson runic glyphs orbiting in a circle"),
  C("KILL_BLOODMOON_ECLIPSE", "Bloodmoon Eclipse", "Kill Effect", "Legendary", "A red moon flashes overhead as your opponent falls.", "a crimson moon eclipse flash above a dark battlefield"),
  C("KILL_THRONE_SHATTER", "Throne Shatter", "Kill Effect", "Epic", "A miniature throne appears – and shatters into crimson glass.", "a small obsidian throne exploding into crimson glass fragments"),
  C("KILL_CHAINBIND", "Chainbind", "Kill Effect", "Rare", "Spectral chains burst from the ground where they fell.", "spectral iron chains erupting from cracked ground with red glow"),
  C("DEATH_SOUL_ASCENSION", "Soul Ascension", "Death Effect", "Rare", "Your soul rises in a pale crimson column when you fall.", "a pale crimson soul light rising upward in a column of mist"),
  C("DEATH_ASHEN_COLLAPSE", "Ashen Collapse", "Death Effect", "Epic", "You crumble into ash that scatters on the wind.", "a silhouette crumbling into grey ash and embers"),
  C("TITLE_GATEBREAKER", "Gatebreaker", "Title", "Rare", "Title: “the Gatebreaker”, shown under your name.", "an ornate dark-gold title plaque reading GATEBREAKER on black velvet"),
  C("TITLE_CRIMSON_HUNTER", "Crimson Hunter", "Title", "Common", "Title: “Crimson Hunter”.", "an engraved crimson-steel title plate with a hunter's mark sigil"),
  C("TITLE_ASHBORN", "Ashborn", "Title", "Epic", "Title: “Ashborn”, glowing with ember edges.", "a scorched obsidian title tablet with glowing ember-lit letters"),
  C("TITLE_OATHLESS", "Oathless", "Title", "Legendary", "Title: “the Oathless”, with a broken-chain flourish.", "a broken chain wrapped around a black title banner with crimson lettering"),
  C("TAG_CRIMSON_SIGIL", "Crimson Sigil", "Chat Tag", "Rare", "A crimson sigil tag shown before your name in chat.", "a small glowing crimson sigil emblem on black obsidian"),
  C("TAG_BLACK_CROWN", "Black Crown", "Chat Tag", "Epic", "A black crown tag in chat and tab.", "a small black iron crown icon with a crimson gem"),
  C("MOUNT_NIGHTMARE_STEED", "Nightmare Steed", "Mount Skin", "Legendary", "Cosmetic skin for your horse: shadow-black hide and crimson eyes. No stat changes.", "a black spectral warhorse with crimson eyes and smoke trailing from its mane"),
  C("MOUNT_ASHEN_CHARGER", "Ashen Charger", "Mount Skin", "Epic", "Cosmetic skin for your horse: ash-grey armour plates with ember seams. No stat changes.", "an armoured ash-grey warhorse with glowing ember seams in its barding"),
  C("WEAPON_BLOODMOON_BLADE", "Bloodmoon Blade", "Weapon Skin", "Epic", "Cosmetic sword skin: a crescent blade glowing blood-red. No stat changes.", "a crescent-shaped black sword with a blood-red glowing edge"),
  C("WEAPON_ABYSSAL_SCYTHE", "Abyssal Scythe", "Weapon Skin", "Legendary", "Cosmetic skin: a void-black scythe silhouette. No stat changes.", "a void-black scythe with violet energy running along the blade"),
  C("WEAPON_THRONE_EDGE", "Throne Edge", "Weapon Skin", "Mythic", "Cosmetic sword skin forged from a throne shard. No stat changes.", "a greatsword made of black throne-stone with crimson veins and a gold crown crossguard"),
  C("ARMOUR_DREADFORGE_PLATE", "Dreadforge Plate", "Armour Skin", "Legendary", "Cosmetic armour skin set with riveted black steel and molten seams. No stat changes.", "a full suit of black riveted plate armour with molten orange seams on a stand"),
  C("ARMOUR_CRIMSON_WARDEN", "Crimson Warden", "Armour Skin", "Epic", "Cosmetic armour skin set in lacquered crimson and dark gold. No stat changes.", "a lacquered crimson and dark-gold armour set displayed on a stand"),
  C("EMOTE_KNEEL", "Kneel Before the Throne", "Emote", "Rare", "Kneel, head bowed, as a faint crown glows above you.", "a silhouette kneeling before a glowing crimson throne"),
  C("EMOTE_BLADE_SALUTE", "Blade Salute", "Emote", "Common", "Raise your blade in a knight's salute.", "a silhouette raising a sword in salute against a crimson sky"),
  C("SPAWN_CRIMSON_ARRIVAL", "Crimson Arrival", "Spawn Effect", "Epic", "You arrive in a burst of crimson light and falling embers.", "a burst of crimson light and embers erupting on a dark stone platform"),
  C("TP_BLOOD_RIFT", "Blood Rift", "Teleport Effect", "Epic", "Teleports tear a crimson rift in the air.", "a vertical tear of crimson light ripping open in dark air"),
  C("TP_SHADOW_STEP", "Shadow Step", "Teleport Effect", "Rare", "You vanish in a puff of black smoke.", "a puff of black smoke with faint red sparks where a figure vanished"),
  C("CHAT_CRIMSON_GRADIENT", "Crimson Gradient", "Chat Effect", "Epic", "Your chat messages fade from crimson to dark red.", "a scroll of glowing text fading from bright crimson to deep red"),
  C("CHAT_GILDED_SHIMMER", "Gilded Name Shimmer", "Chat Effect", "Legendary", "Your name shimmers in dark gold in chat.", "a name plate in shimmering dark gold with a soft glint"),
  // pets (own category)
  C("PET_EMBER_WISP", "Ember Wisp", "Pet", "Rare", "A tiny floating ember spirit that follows you around.", "a small floating ember spirit with a flickering amber flame body", "pets"),
  C("PET_OBSIDIAN_RAVEN", "Obsidian Raven", "Pet", "Epic", "A glass-black raven that perches near your shoulder.", "a raven made of black obsidian glass with crimson eyes", "pets"),
  C("PET_GATE_GOLEM", "Mini Gate Golem", "Pet", "Legendary", "A pocket-sized stone golem carved from a Gate's keystone.", "a tiny carved stone golem with glowing crimson rune cracks", "pets"),
  C("PET_CRIMSON_FOX", "Crimson Fox Spirit", "Pet", "Epic", "A spectral fox wreathed in crimson flame.", "a spectral fox spirit with a crimson flame tail", "pets"),
  C("PET_VOID_HATCHLING", "Void Hatchling", "Pet", "Mythic", "A baby void drake that curls around you. Purely cosmetic.", "a small baby void drake with violet-black scales and glowing eyes", "pets")
];

// ------------------------------------------------------------------ throne shards
export const SHARD_PACKS = [
  { qty: 1000, price: 4.99, bonus: 0 },
  { qty: 2500, price: 11.99, bonus: 0.05 },
  { qty: 5000, price: 22.99, bonus: 0.10 },
  { qty: 10000, price: 44.99, bonus: 0.15 },
  { qty: 25000, price: 104.99, bonus: 0.20 },
  { qty: 50000, price: 199.99, bonus: 0.25 },
  { qty: 100000, price: 379.99, bonus: 0.30 }
];
export const SHARD_NAMES = ["Shard Pouch", "Shard Satchel", "Shard Coffer", "Shard Chest", "Shard Vault", "Shard Hoard", "Throne Treasury"];

// ------------------------------------------------------------------ boosters (GLOBAL ONLY)
export const BOOSTERS = [
  { code: "XP", name: "Global XP Boost", effect: "+50% vanilla XP for every online player", art: "a glowing green-gold experience orb wrapped in crimson energy" },
  { code: "CURRENCY", name: "Global Currency Boost", effect: "+25% in-game currency earned by every online player", art: "a stack of dark-gold coins stamped with a crown, crimson light rising" },
  { code: "DROP", name: "Global Drop Boost", effect: "+25% mob drops for every online player", art: "a cracked monster trophy skull spilling glowing loot" },
  { code: "LUCK", name: "Global Luck Boost", effect: "Higher chance for everyone to find free crate keys from gameplay", art: "a crimson four-pointed star inside a golden horseshoe-shaped sigil" },
  { code: "HUNTER", name: "Global Hunter XP Boost", effect: "+25% Hunter Progression XP for every online player", art: "a hunter's insignia badge glowing crimson with rank letters E to S" },
  { code: "GATE", name: "Global Gate Boost", effect: "+25% Gate and dungeon rewards for every online player", art: "an ancient stone gate with a crimson portal swirling in its arch" },
  { code: "PARTY", name: "Global Party Boost", effect: "+25% bonus for every player in a party or guild", art: "three crossed banners around a crimson flame, symbolising a party" }
];
export const BOOST_DURATIONS = [
  { label: "1 Hour", mins: 60, price: 4.99 },
  { label: "3 Hours", mins: 180, price: 11.99 },
  { label: "6 Hours", mins: 360, price: 19.99 },
  { label: "24 Hours", mins: 1440, price: 59.99 }
];

// ------------------------------------------------------------------ bundles (contents reference other items)
// contents: rank: KEY, keys: {CRATE: n}, shards: n, cosmetics: [code]
export const BUNDLES = [
  { id: "BND-001", name: "Hunter's Oath", rarity: "Rare", desc: "Swear the oath. Start strong with keys, shards and your first title.", contents: { keys: { EMBER: 5, BLOODMOON: 2 }, shards: 2500, cosmetics: ["TITLE_CRIMSON_HUNTER", "TRAIL_EMBER_WAKE"] }, art: "a hunter's oath scroll sealed with crimson wax beside an ember key" },
  { id: "BND-002", name: "Gatebreaker's Cache", rarity: "Epic", desc: "For those who break Gates open: Abyssal keys, a Gatebreaker title and a rift teleport.", contents: { keys: { ABYSSAL: 5 }, shards: 5000, cosmetics: ["TITLE_GATEBREAKER", "TP_BLOOD_RIFT"] }, art: "a cracked stone gate bursting open with violet and crimson light" },
  { id: "BND-003", name: "Bloodmoon Covenant", rarity: "Epic", desc: "Everything under the red moon: Bloodmoon keys, the Bloodstep trail and the Bloodmoon Blade.", contents: { keys: { BLOODMOON: 10 }, shards: 5000, cosmetics: ["TRAIL_BLOODSTEP", "WEAPON_BLOODMOON_BLADE"] }, art: "a blood-red moon over a black altar holding a crescent blade" },
  { id: "BND-004", name: "Abyss Walker", rarity: "Legendary", desc: "Walk where light forgets itself: Abyssal keys, the Abyssal Scythe and the Abyssal Flame aura.", contents: { keys: { ABYSSAL: 10 }, shards: 7500, cosmetics: ["WEAPON_ABYSSAL_SCYTHE", "AURA_ABYSSAL_FLAME"] }, art: "a void portal with a scythe silhouette and violet-black flame" },
  { id: "BND-005", name: "Dreadforge Arsenal", rarity: "Legendary", desc: "Forged beneath Netherfall: Dreadforge keys and the full Dreadforge Plate skin set.", contents: { keys: { DREADFORGE: 10 }, shards: 7500, cosmetics: ["ARMOUR_DREADFORGE_PLATE", "MOUNT_ASHEN_CHARGER"] }, art: "a molten anvil with black plate armour and an ashen horse helm" },
  { id: "BND-006", name: "Regalia Trove", rarity: "Legendary", desc: "Royal treasure: Regalia keys, a Gilded Name Shimmer and the Obsidian Crown aura.", contents: { keys: { REGALIA: 10 }, shards: 10000, cosmetics: ["CHAT_GILDED_SHIMMER", "AURA_OBSIDIAN_CROWN"] }, art: "an open gold-and-black treasure coffer overflowing with crowns and signet rings" },
  { id: "BND-007", name: "Crimson Court", rarity: "Epic", desc: "Dress for court: Crimson Warden armour skin, Crimson Halo and Crimson Gradient chat.", contents: { keys: { BLOODMOON: 5 }, shards: 5000, cosmetics: ["ARMOUR_CRIMSON_WARDEN", "AURA_CRIMSON_HALO", "CHAT_CRIMSON_GRADIENT"] }, art: "a crimson-draped throne room with lacquered armour on display" },
  { id: "BND-008", name: "Ashen Legion", rarity: "Epic", desc: "A party pack: 10 Ember Keys for you plus effects to show off with your guild.", contents: { keys: { EMBER: 10, BLOODMOON: 5 }, shards: 3000, cosmetics: ["DEATH_ASHEN_COLLAPSE", "EMOTE_BLADE_SALUTE", "TITLE_ASHBORN"] }, art: "a row of ashen legion banners over a field of embers" },
  { id: "BND-009", name: "Apex Predator", rarity: "Mythic", desc: "Endgame collection: Throne keys, Throne Edge, Nightmare Steed and the Void Hatchling.", contents: { keys: { THRONE: 5, REGALIA: 5 }, shards: 15000, cosmetics: ["WEAPON_THRONE_EDGE", "MOUNT_NIGHTMARE_STEED", "PET_VOID_HATCHLING"] }, art: "a black throne-stone greatsword planted before a nightmare steed and a void drake" },
  { id: "BND-010", name: "The Overthrone", rarity: "Mythic", desc: "The ultimate package: the Overlord rank plus a mountain of keys, shards and Mythic cosmetics.", contents: { rank: "OVERLORD", keys: { THRONE: 10, REGALIA: 10 }, shards: 25000, cosmetics: ["AURA_ABYSSAL_FLAME", "WEAPON_THRONE_EDGE", "PET_VOID_HATCHLING"] }, art: "a shattered obsidian throne with a crimson-gold crown hovering above the pieces" },
  { id: "BND-011", name: "Collector's Ascension", rarity: "Legendary", desc: "Rank up and collect: the Overlord rank with extra Dreadforge keys and shards.", contents: { rank: "OVERLORD", keys: { DREADFORGE: 5 }, shards: 7500, cosmetics: ["PET_OBSIDIAN_RAVEN"] }, art: "a golden crown resting on a stack of dreadforge keys beside an obsidian raven" },
  { id: "BND-012", name: "Champion's Rise", rarity: "Epic", desc: "Rank up: the Champion rank with Abyssal keys and the Throne Shatter kill effect.", contents: { rank: "CHAMPION", keys: { ABYSSAL: 5 }, shards: 3000, cosmetics: ["KILL_THRONE_SHATTER"] }, art: "a bronze champion's trophy wreathed in crimson fire" }
];

// ------------------------------------------------------------------ featured (rotating / limited)
export const FEATURED = [
  { name: "Crimson Eclipse Aura (Limited)", price: 14.99, rarity: "Mythic", window: "Monthly rotation", desc: "A limited aura: a crimson eclipse forms a halo behind you. Leaves the store when the rotation ends.", deliver: "<GRANT_COSMETIC:AURA_CRIMSON_ECLIPSE_LIMITED>", art: "a crimson solar eclipse forming a halo behind an empty helm" },
  { name: "Founder's Crown Title", price: 9.99, rarity: "Legendary", window: "Launch month only", desc: "Title “Founder”, available only during the server's launch month. Never returns.", deliver: "<GRANT_COSMETIC:TITLE_FOUNDER>", art: "a dark-gold crown engraved with the word FOUNDER on black velvet" },
  { name: "Weekend Throne Rush", price: 39.99, rarity: "Legendary", window: "Selected weekends", desc: "3 Throne Keys and 3 Regalia Keys at a weekend price.", deliver: "<GIVE_KEYS:THRONE:3> + <GIVE_KEYS:REGALIA:3>", art: "three throne keys and three regalia keys fanned out on obsidian" },
  { name: "Monthly Relic Box", price: 12.99, rarity: "Epic", window: "Changes monthly", desc: "One cosmetic relic chosen for the month, plus 1,000 Throne Shards. The month's relic is listed in the description.", deliver: "<GRANT_COSMETIC:MONTHLY_RELIC> + <GIVE_SHARDS:1000>", art: "an ornate black relic box with a crimson glowing keyhole and a month sigil" },
  { name: "Throne of Ash Set", price: 24.99, rarity: "Legendary", window: "Rotation", desc: "Ashborn title, Ashen Collapse death effect and Falling Ash particles in one set.", deliver: "<GRANT_COSMETIC:TITLE_ASHBORN> + <GRANT_COSMETIC:DEATH_ASHEN_COLLAPSE> + <GRANT_COSMETIC:PARTICLE_FALLING_ASH>", art: "a throne made of grey ash crumbling at the edges, embers rising" },
  { name: "Gatekeeper's Sigil Set", price: 17.99, rarity: "Epic", window: "Rotation", desc: "Crimson Sigil tag, Orbiting Runes and the Shadow Step teleport effect.", deliver: "<GRANT_COSMETIC:TAG_CRIMSON_SIGIL> + <GRANT_COSMETIC:PARTICLE_ORBITING_RUNES> + <GRANT_COSMETIC:TP_SHADOW_STEP>", art: "a stone gate covered in glowing crimson sigils" },
  { name: "Double Shard Weekend: Coffer", price: 22.99, rarity: "Rare", window: "Double Shard weekends", desc: "5,000 Throne Shards + 5,000 bonus shards during Double Shard weekends.", deliver: "<GIVE_SHARDS:10000>", art: "two shard coffers overflowing with glowing red crystals" },
  { name: "Crimson Fox Companion", price: 9.99, rarity: "Epic", window: "Rotation", desc: "Spotlight price on the Crimson Fox Spirit pet.", deliver: "<GRANT_COSMETIC:PET_CRIMSON_FOX>", art: "a spectral crimson fox curled on a stone pedestal" },
  { name: "Bloodmoon Hunt Pass", price: 19.99, rarity: "Epic", window: "Bloodmoon nights", desc: "5 Bloodmoon Keys and the Bloodmoon Eclipse kill effect.", deliver: "<GIVE_KEYS:BLOODMOON:5> + <GRANT_COSMETIC:KILL_BLOODMOON_ECLIPSE>", art: "a hunter's pass stamped with a blood moon seal" },
  { name: "Obsidian Monarch Set", price: 34.99, rarity: "Legendary", window: "Rotation", desc: "Obsidian Crown aura, Black Crown tag and Obsidian Raven pet.", deliver: "<GRANT_COSMETIC:AURA_OBSIDIAN_CROWN> + <GRANT_COSMETIC:TAG_BLACK_CROWN> + <GRANT_COSMETIC:PET_OBSIDIAN_RAVEN>", art: "an obsidian crown, a black raven and a black crown seal arranged on a throne seat" },
  { name: "Dreadforge Spotlight Keys", price: 29.99, rarity: "Epic", window: "Rotation", desc: "5 Dreadforge Keys at a spotlight price.", deliver: "<GIVE_KEYS:DREADFORGE:5>", art: "five molten dreadforge keys cooling on an anvil" },
  { name: "Realm Explorer Set (Aeonia)", price: 19.99, rarity: "Epic", window: "When Aeonia opens", desc: "A divine-themed cosmetic set released with the Aeonia realm.", deliver: "<GRANT_COSMETIC:SET_AEONIA_EXPLORER>", art: "white-gold divine temple pillars with a crimson sunrise behind them" },
  { name: "Realm Explorer Set (Netherfall)", price: 19.99, rarity: "Epic", window: "When Netherfall opens", desc: "An underworld-themed cosmetic set released with the Netherfall realm.", deliver: "<GRANT_COSMETIC:SET_NETHERFALL_EXPLORER>", art: "volcanic ruins with souls rising from cracks in black rock" },
  { name: "Gate Clear Celebration Pack", price: 14.99, rarity: "Rare", window: "After major Gate updates", desc: "2 Abyssal Keys, 2,500 Throne Shards and the Gatebreaker title.", deliver: "<GIVE_KEYS:ABYSSAL:2> + <GIVE_SHARDS:2500> + <GRANT_COSMETIC:TITLE_GATEBREAKER>", art: "a shattered gate keystone surrounded by confetti of embers" },
  { name: "Spotlight: Shattered Crystal Trail", price: 5.99, rarity: "Epic", window: "Rotation", desc: "Spotlight price on the Shattered Crystal trail.", deliver: "<GRANT_COSMETIC:TRAIL_CRYSTAL_SHARD>", art: "red crystal shards bursting from black ground in a line" }
];

// ------------------------------------------------------------------ starter (limit 1 per player)
export const STARTERS = [
  { name: "First Blood", price: 4.99, desc: "Your first mark: Crimson Hunter title, 1 Ember Key and 500 Throne Shards.", deliver: "<GRANT_COSMETIC:TITLE_CRIMSON_HUNTER> + <GIVE_KEYS:EMBER:1> + <GIVE_SHARDS:500>", art: "a single crimson drop falling onto a black hunter's badge" },
  { name: "New Hunter's Mark", price: 6.99, desc: "Ember Wake trail, Blade Salute emote and 2 Ember Keys.", deliver: "<GRANT_COSMETIC:TRAIL_EMBER_WAKE> + <GRANT_COSMETIC:EMOTE_BLADE_SALUTE> + <GIVE_KEYS:EMBER:2>", art: "a freshly branded hunter's mark glowing on a leather bracer" },
  { name: "Ashen Initiate Cache", price: 7.99, desc: "Falling Ash particles, 3 Ember Keys and 1,000 Throne Shards.", deliver: "<GRANT_COSMETIC:PARTICLE_FALLING_ASH> + <GIVE_KEYS:EMBER:3> + <GIVE_SHARDS:1000>", art: "a small ash-grey cache box with ember light inside" },
  { name: "Gate Initiate Pack", price: 9.99, desc: "1 Abyssal Key, 2 Bloodmoon Keys and the Shadow Step teleport effect.", deliver: "<GIVE_KEYS:ABYSSAL:1> + <GIVE_KEYS:BLOODMOON:2> + <GRANT_COSMETIC:TP_SHADOW_STEP>", art: "a small stone gate model with violet light in the archway" },
  { name: "First Expedition", price: 9.99, desc: "Ember Wisp pet and 1,500 Throne Shards for your first journey.", deliver: "<GRANT_COSMETIC:PET_EMBER_WISP> + <GIVE_SHARDS:1500>", art: "an ember wisp lighting a lantern on a dark path into ruins" },
  { name: "Novice Wardrobe", price: 5.99, desc: "Crimson Sigil chat tag and Soul Ascension death effect.", deliver: "<GRANT_COSMETIC:TAG_CRIMSON_SIGIL> + <GRANT_COSMETIC:DEATH_SOUL_ASCENSION>", art: "a small wardrobe chest with a crimson sigil and pale mist" },
  { name: "Hunter's Key Ring", price: 7.99, desc: "One key of each of the first three crates: Ember, Bloodmoon and Abyssal.", deliver: "<GIVE_KEYS:EMBER:1> + <GIVE_KEYS:BLOODMOON:1> + <GIVE_KEYS:ABYSSAL:1>", art: "an iron key ring holding amber, crimson and violet keys" },
  { name: "Rising Hunter Bundle", price: 14.99, desc: "Supporter-tier look without the rank: Crimson Halo aura, Bloodstep trail and 1,500 shards.", deliver: "<GRANT_COSMETIC:AURA_CRIMSON_HALO> + <GRANT_COSMETIC:TRAIL_BLOODSTEP> + <GIVE_SHARDS:1500>", art: "a hunter silhouette rising with a crimson halo above" },
  { name: "Starter Shard Pouch", price: 2.99, desc: "1,000 Throne Shards at a one-time welcome price.", deliver: "<GIVE_SHARDS:1000>", art: "a small leather pouch spilling glowing red shards" },
  { name: "Initiate's Emote Pack", price: 3.99, desc: "Kneel Before the Throne and Blade Salute emotes.", deliver: "<GRANT_COSMETIC:EMOTE_KNEEL> + <GRANT_COSMETIC:EMOTE_BLADE_SALUTE>", art: "two silhouettes, one kneeling and one saluting, before a throne" }
];

// ------------------------------------------------------------------ seasonal / events (disabled until the event)
export const EVENTS = [
  { name: "Bloodmoon Festival Bundle", event: "Bloodmoon", price: 29.99, desc: "Event-exclusive Bloodmoon Reaper title, 10 Bloodmoon Keys and the Bloodmoon Eclipse kill effect.", deliver: "<GRANT_COSMETIC:TITLE_BLOODMOON_REAPER> + <GIVE_KEYS:BLOODMOON:10> + <GRANT_COSMETIC:KILL_BLOODMOON_ECLIPSE>", art: "a crimson moon festival with lanterns over black ruins" },
  { name: "Bloodmoon Event Key ×5", event: "Bloodmoon", price: 14.99, desc: "5 Bloodmoon Event Keys for the limited Bloodmoon Event Crate (event cosmetics only).", deliver: "<GIVE_KEYS:BLOODMOON_EVENT:5>", art: "five crimson moon-shaped event keys on an altar" },
  { name: "Hallowed Gate Bundle", event: "Halloween", price: 24.99, desc: "Event-exclusive Hollow Lantern pet, Hallowed title and 5 Abyssal Keys.", deliver: "<GRANT_COSMETIC:PET_HOLLOW_LANTERN> + <GRANT_COSMETIC:TITLE_HALLOWED> + <GIVE_KEYS:ABYSSAL:5>", art: "a carved hollow lantern glowing crimson inside a haunted gate" },
  { name: "Frostbound Throne Bundle", event: "Winter", price: 24.99, desc: "Event-exclusive Frostbound aura, Winter's Crown title and 5 Regalia Keys.", deliver: "<GRANT_COSMETIC:AURA_FROSTBOUND> + <GRANT_COSMETIC:TITLE_WINTERS_CROWN> + <GIVE_KEYS:REGALIA:5>", art: "a frozen black throne covered in frost with crimson light inside the ice" },
  { name: "First Throne Anniversary Pack", event: "Anniversary", price: 19.99, desc: "Anniversary title, Anniversary Sigil tag and 5,000 Throne Shards.", deliver: "<GRANT_COSMETIC:TITLE_ANNIVERSARY> + <GRANT_COSMETIC:TAG_ANNIVERSARY> + <GIVE_SHARDS:5000>", art: "a gold anniversary sigil with the roman numeral I on a crimson banner" },
  { name: "Founder's Pack", event: "Server Launch", price: 29.99, desc: "Launch-only Founder title, Founder chat tag, 3 Throne Keys and 5,000 Throne Shards.", deliver: "<GRANT_COSMETIC:TITLE_FOUNDER> + <GRANT_COSMETIC:TAG_FOUNDER> + <GIVE_KEYS:THRONE:3> + <GIVE_SHARDS:5000>", art: "a founder's seal pressed into crimson wax beside a throne key" },
  { name: "New Era Pack", event: "Season Reset", price: 19.99, desc: "Season-numbered title, 5 Dreadforge Keys and 2,500 Throne Shards to start the new season in style.", deliver: "<GRANT_COSMETIC:TITLE_SEASON_N> + <GIVE_KEYS:DREADFORGE:5> + <GIVE_SHARDS:2500>", art: "an hourglass of crimson sand turning over in front of a new dawn" },
  { name: "Gate Outbreak Bundle", event: "Special Event", price: 24.99, desc: "For server-wide Gate Outbreak events: Outbreak title, 5 Abyssal Keys and the Blood Rift teleport effect.", deliver: "<GRANT_COSMETIC:TITLE_OUTBREAK> + <GIVE_KEYS:ABYSSAL:5> + <GRANT_COSMETIC:TP_BLOOD_RIFT>", art: "dozens of crimson gates opening across a dark sky" },
  { name: "Lunar Eclipse Global Boost", event: "Special Event", price: 24.99, desc: "A 6-hour Global Gate Boost for everyone online during eclipse events.", deliver: "<START_GLOBAL_BOOST:GATE:360>", art: "a lunar eclipse above a glowing stone gate" },
  { name: "Festival of Crowns", event: "Special Event", price: 34.99, desc: "Crown-themed event cosmetics: Festival Crown aura and 3 Regalia Keys.", deliver: "<GRANT_COSMETIC:AURA_FESTIVAL_CROWN> + <GIVE_KEYS:REGALIA:3>", art: "a ring of floating gold crowns with crimson ribbons" }
];

// ------------------------------------------------------------------ gifts (recipient entered via Tebex Variables)
export const GIFTS = [
  { name: "Gift Rank: Supporter", price: 9.99, desc: "Gift the Supporter rank to a friend. Enter their Minecraft username at checkout.", deliver: "<GRANT_RANK:SUPPORTER:{recipient}>", art: "a black gift box tied with crimson ribbon, a red supporter gem on the lid" },
  { name: "Gift Key Bundle", price: 24.99, desc: "Gift 5 Bloodmoon Keys and 5 Abyssal Keys.", deliver: "<GIVE_KEYS:BLOODMOON:5:{recipient}> + <GIVE_KEYS:ABYSSAL:5:{recipient}>", art: "a gift box overflowing with crimson and violet keys" },
  { name: "Gift Shard Bundle", price: 22.99, desc: "Gift 5,000 Throne Shards (+10% bonus).", deliver: "<GIVE_SHARDS:5500:{recipient}>", art: "a gift box filled with glowing red throne shards" },
  { name: "Gift Cosmetic Bundle", price: 19.99, desc: "Gift Crimson Halo, Bloodstep trail and the Blood Rift teleport effect.", deliver: "<GRANT_COSMETIC:AURA_CRIMSON_HALO:{recipient}> + <GRANT_COSMETIC:TRAIL_BLOODSTEP:{recipient}> + <GRANT_COSMETIC:TP_BLOOD_RIFT:{recipient}>", art: "a gift box with crimson light and runes spiralling out" },
  { name: "Gift Starter Bundle", price: 9.99, desc: "Gift the First Blood and Hunter's Key Ring starter packs.", deliver: "<GRANT_COSMETIC:TITLE_CRIMSON_HUNTER:{recipient}> + <GIVE_KEYS:EMBER:2:{recipient}> + <GIVE_KEYS:BLOODMOON:1:{recipient}> + <GIVE_KEYS:ABYSSAL:1:{recipient}> + <GIVE_SHARDS:500:{recipient}>", art: "a small gift box with a hunter's badge and three keys" },
  { name: "Gift Rank: Elite", price: 24.99, desc: "Gift the Elite rank to a friend.", deliver: "<GRANT_RANK:ELITE:{recipient}>", art: "a gift box with a violet elite gem on the lid" },
  { name: "Gift Rank: Champion", price: 49.99, desc: "Gift the Champion rank to a friend.", deliver: "<GRANT_RANK:CHAMPION:{recipient}>", art: "a gift box with a bronze champion trophy on the lid" },
  { name: "Gift Rank: Warlord", price: 89.99, desc: "Gift the Warlord rank to a friend.", deliver: "<GRANT_RANK:WARLORD:{recipient}>", art: "a gift box with a flame-red warlord banner on the lid" },
  { name: "Gift Rank: Overlord", price: 149.99, desc: "Gift the Overlord rank to a friend.", deliver: "<GRANT_RANK:OVERLORD:{recipient}>", art: "a gift box with a golden overlord crown on the lid" }
];

// ------------------------------------------------------------------ utility (no gameplay effect)
export const UTILITY = [
  { name: "Nickname Token (30 days)", price: 3.99, desc: "Use /nick for 30 days (staff-moderated).", deliver: "<GRANT_TEMP_PERMISSION:NICK:30d>", art: "a silver name token engraved with a quill" },
  { name: "Name Colour Token", price: 2.99, desc: "Change your name colour once from the approved palette.", deliver: "<GRANT_TOKEN:NAME_COLOUR:1>", art: "a coin split into crimson, gold and silver segments" },
  { name: "Prefix Recolour Token", price: 3.99, desc: "Recolour your rank prefix once (rank holders only).", deliver: "<GRANT_TOKEN:PREFIX_COLOUR:1>", art: "a small paint vial of crimson ink beside a rank seal" },
  { name: "Queue Priority Pass (30 days)", price: 4.99, desc: "Priority login when the server is full, for 30 days. No gameplay effect.", deliver: "<GRANT_TEMP_PERMISSION:QUEUE_PRIORITY:30d>", art: "a black pass card with a crimson fast-forward chevron" },
  { name: "Guild Banner Design Slot", price: 6.99, desc: "Unlock one extra cosmetic banner design for your guild.", deliver: "<GRANT_TOKEN:GUILD_BANNER_SLOT:1>", art: "a blank crimson guild banner on a black iron pole" },
  { name: "Wardrobe Expansion", price: 4.99, desc: "+3 cosmetic wardrobe presets to switch outfits instantly.", deliver: "<GRANT_TOKEN:WARDROBE_SLOT:3>", art: "an ornate black wardrobe with three glowing crimson slots" },
  { name: "Chat Emoji Pack: Dark Court", price: 2.99, desc: "Unlock 12 OVERTHRONE chat emojis.", deliver: "<GRANT_COSMETIC:EMOJI_PACK_DARK_COURT>", art: "a grid of small crimson and gold emblem icons" }
];
