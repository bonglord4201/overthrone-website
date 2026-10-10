// Content for the Player Guide page (/guide) and the guide posts pinned in the forums.
// Edit here, then run:  node scripts/build-pages.mjs
//
// Keybinds are the mods' real defaults, checked in each mod's source code for the
// versions on the server (Epic Fight 21.17, Iron's Spells 3.16, Simple Voice Chat 2.6,
// Sophisticated Backpacks 3.26, FTB Chunks 2101, Open Parties and Claims, Iris 1.8).
// Xaero's maps are closed source; their keys are the long-standing defaults.
//
// Inline formatting: **bold** and [text](/link). Keep it plain: these strings are
// escaped for the page and reused as forum post text.

export const GUIDE_UPDATED = "2026-10-10";

export const GUIDE_INTRO =
  "Everything you need to play OVERTHRONE SMP: installing the modpack, the keybinds that matter, quests, coins, warps, bosses and fixes for common problems.";

export const SECTIONS = [
  {
    id: "start",
    title: "Start Here",
    icon: "flag",
    intro: "OVERTHRONE is a modded Minecraft server (NeoForge 1.21.1, around 100 mods). You need the modpack to join, as a normal Minecraft client can't connect.",
    blocks: [
      { steps: [
        { t: "Get the modpack", d: "Download the OVERTHRONE modpack and import it into your launcher (CurseForge, Prism or the Modrinth app). The download link is posted in our Discord.", modpack: true },
        { t: "Give Minecraft enough memory", d: "In your launcher, set the memory (RAM) for the pack to **6–8 GB**. Less than that causes lag spikes and crashes with this many mods." },
        { t: "Join the server", d: "Add a server with the address **overthronesmp.net** and join. The first load takes a while because of the mods. That's normal.", copy: true },
        { t: "Fix your keybinds", d: "Several mods share the same default keys. Spend two minutes on the [keybind fixes](/guide#keybinds) before you fight anything." },
        { t: "Read the rules", d: "Short version: no cheats, no griefing, be decent. Full list on the [rules page](/rules)." },
        { t: "Link your Discord", d: "In our Discord, run **/link** with your Minecraft name while you're online in-game. You'll get a 6-digit code in Minecraft chat. Then run **/verify** with that code in Discord." }
      ] }
    ]
  },
  {
    id: "first-hour",
    title: "Your First Hour",
    icon: "compass",
    intro: "A quick route through the server so you know where everything is.",
    blocks: [
      { steps: [
        { t: "Explore the hub", d: "You spawn in the OVERTHRONE hub, a city above the clouds. The warp boards there list every destination, or type **/warp hub** to come back any time." },
        { t: "Go to the RPG world", d: "Type **/rpg**. The RPG world is a protected city where nobody can break or place blocks. It holds the Quest Board, the Arcade & Trade Hall and the Arcanum." },
        { t: "Talk to Questmaster Orin", d: "Right-click Orin in the RPG world to open the quest book. You can also open it with the quest book button in your inventory. Start with the first quests to earn coins and gear." },
        { t: "Visit the Arcade", d: "Type **/warp arcade** to see the gacha machines, the vending machines and the exchange counter. Everything there is paid for with coins you earn in game." },
        { t: "Pick a home", d: "Head to the survival world with **/warp survival**, find a spot and claim it with Open Parties and Claims (press **'**, the apostrophe key) so nobody can grief it." }
      ] }
    ]
  },
  {
    id: "keybinds",
    title: "Keybinds",
    icon: "list",
    intro: "These are the default keys for the main mods. Change any of them in Options → Controls → Key Binds. If your modpack already came with different keys, use those.",
    blocks: [
      { keys: { title: "Epic Fight (combat)", rows: [
        ["R", "Switch between battle mode and mining mode"],
        ["Left Mouse", "Attack (in battle mode)"],
        ["Right Mouse", "Guard / block"],
        ["Left Alt", "Dodge"],
        ["Space", "Movement skill (for example a double jump), when you have one equipped"],
        ["Left Mouse", "Weapon skill. It shares the attack button by default; many players move it to a mouse side button"],
        ["G", "Lock on to a target"],
        ["← / →", "Switch lock-on target"],
        ["Middle Mouse", "Move the lock-on freely"],
        ["K", "Skill menu (equip and upgrade skills)"],
        ["Y", "Emote wheel"]
      ] } },
      { keys: { title: "Iron's Spells 'n Spellbooks (magic)", rows: [
        ["R", "Spell wheel: pick a spell from your spellbook"],
        ["V", "Cast the selected spell"],
        ["Left Alt + Scroll", "Scroll through the spell bar"],
        ["Unbound", "Quick-cast slots 1–15: bind these if you use a lot of spells"]
      ] } },
      { keys: { title: "Maps, waypoints and claims", rows: [
        ["M", "Xaero's World Map"],
        ["Y", "Xaero's Minimap settings"],
        ["B", "Xaero's: add a waypoint"],
        ["U", "Xaero's: waypoint list"],
        ["M", "FTB Chunks map (the pack has both map mods)"],
        ["' (apostrophe)", "Open Parties and Claims menu: claims, parties and settings"]
      ] } },
      { keys: { title: "Voice chat, backpacks and other mods", rows: [
        ["V", "Simple Voice Chat menu (proximity voice)"],
        ["M", "Mute your microphone"],
        ["N", "Turn voice chat off/on"],
        ["H", "Hide voice chat icons"],
        ["G", "Voice chat groups"],
        ["B", "Open your Sophisticated Backpack"],
        ["Alt + Z / Alt + X", "Toggle backpack upgrades 1 and 2"],
        ["R / U", "JEI: recipes / uses of the item under your mouse (in inventories)"],
        ["O", "Iris: choose a shader pack"],
        ["K", "Iris: turn shaders on/off"],
        ["R", "Iris: reload shaders"]
      ] } },
      { callout: { kind: "tip", text: "**Tensura: Reincarnated** and other mods add their own keys for skills and menus. Open Options → Controls → Key Binds and look through the Tensura categories." } }
    ]
  },
  {
    id: "key-conflicts",
    title: "Fix Key Conflicts",
    icon: "bug",
    intro: "With the default keys, one button does several things at once. For example, R switches Epic Fight mode, opens the spell wheel and reloads shaders. Here's a setup that fixes all of them.",
    blocks: [
      { table: { head: ["Key", "Used by (defaults)", "Change this one", "Suggested new key"], rows: [
        ["R", "Epic Fight mode switch · Iron's spell wheel · Iris reload shaders", "Iron's Spells: Spell Wheel", "Z"],
        ["R", "(same as above)", "Iris: Reload Shaders", "Unbind it"],
        ["V", "Iron's cast spell · Voice chat menu", "Iron's Spells: Cast Spell", "X or a mouse side button"],
        ["K", "Epic Fight skill menu · Iris toggle shaders", "Iris: Toggle Shaders", "Unbind it (use O instead)"],
        ["M", "Xaero's World Map · FTB Chunks map · Voice chat mute", "FTB Chunks: Map", "Unbind it (use Xaero's)"],
        ["M", "(same as above)", "Voice Chat: Mute Microphone", "J"],
        ["G", "Epic Fight lock-on · Voice chat groups", "Voice Chat: Groups", "Unbind it (groups are in the V menu)"],
        ["B", "Backpack · Xaero's add waypoint", "Xaero's: New Waypoint", "Unbind it (add waypoints from the map)"],
        ["Y", "Epic Fight emotes · Xaero's minimap settings", "Xaero's: Minimap Settings", "Unbind it"]
      ] } },
      { callout: { kind: "tip", text: "Conflicting keys show in red in Options → Controls → Key Binds. If a button suddenly does two things, check there first." } }
    ]
  },
  {
    id: "combat",
    title: "Combat, Magic & Skills",
    icon: "shield",
    intro: "Fighting on OVERTHRONE uses Epic Fight, so it plays very differently from vanilla Minecraft.",
    blocks: [
      { list: [
        "**Battle mode vs mining mode.** Press **R** to swap. Battle mode gives you combos, guarding and dodging with weapons. Mining mode is normal Minecraft for building and digging.",
        "**Dodge, don't tank.** **Left Alt** dodges through attacks. Big bosses hit hard, so learn their patterns and dodge their big swings.",
        "**Guard** with **Right Mouse**. Blocking at the right moment is much better than eating hits.",
        "**Weapon skills.** Each weapon type has its own skill and combo. Weapons from Weapons of Miracles and Simply Swords have special movesets.",
        "**Skill menu (K).** Equip skills like dodges and passives, and grow them with the Epic Fight Skill Tree.",
        "**Magic.** Iron's Spells 'n Spellbooks adds spellbooks, scrolls and mana. Put spells into your spellbook at an Inscription Table, choose one with the spell wheel and cast it.",
        "**Tensura: Reincarnated** is the core of the server: your race, unique and extra skills, magic and battlewills. Browse them on the [Tensura Skills](/tensura) page.",
        "**Classes.** Visit **/warp classes** in the hub to see the classes."
      ] },
      { callout: { kind: "tip", text: "Damage numbers (from Combat Numbers) pop up when you hit something, so you can see which weapon and skills actually do more damage." } }
    ]
  },
  {
    id: "races",
    title: "Races & Evolution",
    icon: "crown",
    intro: "Tensura: Reincarnated asks you to pick a race the first time you join. Your race decides your starting health, magic and strength, the skills you're born with and every evolution you can reach. Here's every starting race, who it suits and how to evolve it.",
    blocks: [
      { list: [
        "**Pick on your first join.** A race menu opens when you first join. Each race shows a difficulty: Easy races start strong, Hard and Extreme ones start weak but can end up just as powerful.",
        "**EP is your power level.** Existence Points are your max Magicules (MP) plus your max Aura (AP). Kill mobs to gain EP: by default you get 3% of what you kill.",
        "**Magic or might.** Majin races (Slime, Wight, Ghoul, Lesser Daemon) turn most of that EP into MP for skills and magic. Every other race turns most of it into AP for battlewills and fighting.",
        "**How to evolve.** Press **B** (Status Menu) and open the **Evolution Menu**. It lists the evolutions you can reach and how close you are. Press **Track** to show the goal on screen, then **Evolve** when it hits 100%.",
        "**Changed your mind?** Talk to **Seris the Rebirth Keeper** for a **Race Reset Scroll** (one every 12 hours). It resets your race, stats and race skills so you can pick again."
      ] },
      { table: { head: ["Race", "Difficulty", "Best for", "Start MP / AP"], rows: [
        ["Giant", "Easy", "Raw power, the strongest start", "6,000–8,000 / 4,000–6,000"],
        ["Lesser Daemon", "Easy", "Flying spellcaster", "5,000–6,000 / 2,000–3,000"],
        ["Ogre", "Easy", "Melee fighter, the most evolution paths", "300–600 / 1,500–2,500"],
        ["Beastfolk", "Easy", "Fast melee with regeneration", "300–600 / 1,500–2,500"],
        ["Harpy", "Easy", "Magic with wings to glide", "1,500–2,500 / 300–600"],
        ["Elf", "Intermediate", "Elemental magic, fast", "320–600 / 600–800"],
        ["Merfolk", "Intermediate", "Oceans and water combat", "400–600 / 500–600"],
        ["Lizardman", "Intermediate", "Dragon path that ends with flight", "100–200 / 600–800"],
        ["Orc", "Intermediate", "Tank with a hunger skill", "50–100 / 400–600"],
        ["Human", "Hard", "Weapons and battlewills, can become a Vampire", "50–70 / 760–1,140"],
        ["Dwarf", "Hard", "Tough, slow, hard-hitting", "80–120 / 720–1,080"],
        ["Goblin", "Hard", "Weak start, quick first evolutions", "700 / 300"],
        ["Wight", "Hard", "Undead mage, hates sunlight", "2,000–3,000 / 100–500"],
        ["Ghoul", "Hard", "The road to Divine Vampire", "2,000–3,000 / 1,000–2,000"],
        ["Slime", "Extreme", "Experts: weakest start, huge payoff", "200–500 / 200–500"]
      ] } },
      { cards: [
        { k: "Easy", t: "Giant", d: "The strongest start in the game: 50 HP, 6 attack damage, big MP and AP, and **Giantification** to grow huge. **Path:** Giant → Ancient Giant (300,000 EP + 20 Ancient Debris) → Divine Giant (2,000,000 EP)." },
        { k: "Easy", t: "Lesser Daemon", d: "Flies from day one, has the biggest magic pool of any starter and comes with a pile of spells. Majin. **Path:** Lesser Daemon → Greater Daemon (20,000 EP) → Arch Daemon (140,000 EP) → Daemon Lord (2 of: a body, a name, an awakening) → Devil Lord (all 3)." },
        { k: "Easy", t: "Ogre", d: "Strong, tough melee fighter with **Strength** and the most branches of any race. Bonds with Fire Spirits more easily. **Path:** Ogre → Kijin (get a Spirit) or Enlightened Ogre (100,000 EP) → Mystic Oni (10 Elemental Essence) or Wicked Oni (10 Daemon Essence) → Spirit Oni or Death Oni (400,000 EP) → Divine Oni or Divine Fighter (2,000,000 EP)." },
        { k: "Easy", t: "Beastfolk", d: "Fast, high Aura, with **Beast Transformation** and **Self Regeneration**, so you can keep fighting without rest. A great first melee race. **Path:** Beastfolk → Beast Lord (100,000 EP) → Spirit Beast (400,000 EP + 4 bosses) → Divine Beast (2,000,000 EP)." },
        { k: "Easy", t: "Harpy", d: "A big magic pool, **Magic Jamming**, and wings that let you glide like an elytra. Good for mages who like to move. **Path:** Harpy → Harpy Queen (200,000 EP) → Spirit Bird (800,000 EP) → Divine Bird (2,000,000 EP)." },
        { k: "Intermediate", t: "Elf", d: "Quick on your feet with a talent for elemental magic. Bonds with Wind Spirits more easily. **Path:** Elf → Enlightened Elf (100,000 EP) → Elf Saint (400,000 EP + 4 bosses) → Divine Elf (2,000,000 EP)." },
        { k: "Intermediate", t: "Merfolk", d: "Breathes underwater and shoots through it with **Hydraulic Propulsion**. Bonds with Water Spirits more easily. **Path:** Merfolk → Enlightened Merfolk (100,000 EP) → Merfolk Saint (400,000 EP + 4 bosses) → Divine Fish (2,000,000 EP)." },
        { k: "Intermediate", t: "Lizardman", d: "**Scale Armor** and a dragon bloodline. Dragonewts get Flame Breath and Thunder Breath, and the last two forms grow real wings. **Path:** Lizardman → Dragonewt (10 Dragon Essence) → True Dragonewt (800,000 EP) → Divine Dragon (2,000,000 EP)." },
        { k: "Intermediate", t: "Orc", d: "Tanky (28 HP) but low on magic. The Orc Lord route learns **Starved**, a hunger skill. **Path:** Orc → High Orc (5,000 EP) → Orc Lord (10 Royal Blood) → Orc Disaster (200,000 EP + mastered Starved) → Spirit Boar (400,000 EP) → Divine Boar (2,000,000 EP). High Orc can also go straight to Spirit Boar at 400,000 EP." },
        { k: "Hard", t: "Human", d: "Very little magic but solid Aura, so you fight with weapons and battlewills. **Path:** Human → Enlightened Human (100,000 EP) → Human Saint (400,000 EP + 4 bosses) → Divine Human (2,000,000 EP). **Or** drink 5 Zane Blood to become a **Vampire** and join the vampire line." },
        { k: "Hard", t: "Dwarf", d: "Tough and hits harder than most starters, but slow and low on magic. Bonds with Earth Spirits more easily. **Path:** Dwarf → Enlightened Dwarf (100,000 EP) → Dwarf Saint (400,000 EP + 4 bosses) → Divine Dwarf (2,000,000 EP)." },
        { k: "Hard", t: "Goblin", d: "Only 12 HP, but you evolve fast: Hobgoblin at just 2,000 EP. **Path:** Goblin → Hobgoblin (2,000 EP) → Enlightened Hobgoblin (100,000 EP) → Hobgoblin Saint (400,000 EP + 4 bosses) → Divine Oni (2,000,000 EP). **Or** a Hobgoblin that defeats (or dies to) the Elemental Colossus becomes an **Ogre**." },
        { k: "Hard", t: "Wight", d: "Undead with a huge magic pool, and undead mobs leave you alone. Sunlight burns and weakens you (a helmet stops the burning; roofs and rain stop it all). **Path:** Wight → Wight King (200,000 EP) → Spirit Skeleton (800,000 EP) → Divine Skeleton (2,000,000 EP). **Or** turn **Human** by eating an Enchanted Golden Apple while you have Weakness." },
        { k: "Hard", t: "Ghoul", d: "A vampire thrall: big MP, **Paralysis**, **Strength** and **Self Regeneration**, but sunlight cripples you. This is the road to Divine Vampire. **Path:** Ghoul → Vampire (1 Zane Blood) → Vampire Overcomer (150,000 EP) → Vampire Lord (400,000 EP) → Divine Vampire (2,000,000 EP)." },
        { k: "Extreme", t: "Slime", d: "The hardest start: 10 HP and slow. But slimes take **50% less physical damage**, have **Absorb & Dissolve** and **Self Regeneration**, and end as one of the strongest races. **Path:** Slime → Metal Slime (absorb 100 Magic Ore with Absorb & Dissolve) → Demon Slime (awaken as True Demon Lord or True Hero) → God Slime (2,000,000 EP)." }
      ] },
      { list: [
        "**EP goals.** Most first evolutions need about 100,000 EP, the third stage 400,000 to 800,000, and the final Divine forms 2,000,000 EP.",
        "**Defeat 4 bosses.** Saint-tier evolutions also need you to beat four different bosses.",
        "**Items.** Some evolutions need an item instead of EP: Zane Blood, Royal Blood, Dragon Essence, Elemental Essence, Daemon Essence, Magic Ore or Ancient Debris.",
        "**Harvest Festival.** When a player awakens as a **True Demon Lord**, their subordinates nearby evolve for free. Many early evolutions list it as an alternative.",
        "**Naming.** A stronger player can name you (default key **N**). Their Evolve option can push you to your next form if it doesn't need an awakening.",
        "**Awakening.** True Demon Lord (Majin with 200,000 EP, then collect 10,000 souls) or True Hero. Some evolutions, like Demon Slime, need one."
      ] },
      { faq: [
        { q: "Vampire weaknesses: Ghoul, Vampire and Vampire Overcomer", a: "Ghouls and Vampires get heavy debuffs and burn in sunlight. A helmet stops the burning (it slowly loses durability), and roofs or rain stop the debuffs. Vampire Overcomer still gets Weakness III and Slowness II in sunlight. **Vampire Lord** and **Divine Vampire** have no sunlight weakness at all. Every vampire is weaker on a **New Moon**, and every vampire can turn into a **swarm of bats** (Race Ability, **Ctrl + E**)." },
        { q: "What does a final Divine race give me?", a: "Every Divine form has up to 1,000,000 MP and 1,000,000 AP, around 900 to 1,200 HP, and **Divine Ki Release**: +50 battlewill damage (+100 mastered), extra armour damage, and it can hit spiritual enemies. Some get more: Divine Vampire gets **Infinite Regeneration**, Divine Giant gets **Titanification** and **Ultraspeed Regeneration**, Divine Fighter gets **Divine Berserker**." },
        { q: "Which races can fly?", a: "**Lesser Daemon** and every daemon after it fly from the start (creative-style flight). **True Dragonewt** and **Divine Dragon** grow wings. **Harpies** and their evolutions glide like an elytra. Vampires can turn into bats." },
        { q: "What's the Race/Mount Ability key?", a: "**Ctrl + E** by default (Options → Controls → Tensura). It uses your race's special ability, like the vampire bat swarm or the slime super jump." },
        { q: "Can I change race later?", a: "Yes. Get a **Race Reset Scroll** from Seris the Rebirth Keeper (one every 12 hours). It resets your statistics, naming and awakening status, spirits, resistances and race with its intrinsic skills, so only use it if you're sure." }
      ] },
      { callout: { kind: "tip", text: "Race stats and requirements are the Tensura: Reincarnated defaults for version 2.0.1. Press **B** in game: your Evolution Menu always shows the exact requirement for your next form." } }
    ]
  },
  {
    id: "quests",
    title: "Quests",
    icon: "scroll",
    intro: "There are over 1,100 quests in the quest book. Open it by talking to Questmaster Orin in the RPG world, or with the quest book button in your inventory.",
    blocks: [
      { cards: [
        { t: "The Quest Board", k: "100 quests", d: "The Hunter's path from E-Rank to S-Rank. Every 10th quest is a Rank Trial. Rewards are balance, XP and gear that gets better at each rank." },
        { t: "The Hunter's Ledger", k: "1,012 quests", d: "Ten Ledgers of coin quests covering farming, exploring, crafting, fishing, the Nether, magic, caves, bounties, the End and legendary feats. Finishing all of them pays about 1,500 Netherite coins." }
      ] },
      { table: { head: ["Quest Board rank", "Quests", "Chapter"], rows: [
        ["E-Rank", "1–20", "The Awakening"],
        ["D-Rank", "21–40", "The Wilds"],
        ["C-Rank", "41–60", "Into the Depths"],
        ["B-Rank", "61–80", "The Hunt Beyond"],
        ["S-Rank", "81–100", "Overthrow"]
      ] } },
      { table: { head: ["Ledger", "Theme"], rows: [
        ["I. Homestead", "Farming, food and animals"],
        ["II. Wanderlust", "Exploring biomes and structures"],
        ["III. Artisan's Guild", "Crafting and building"],
        ["IV. Tides & Tails", "Fishing and the ocean"],
        ["V. Into the Nether", "The Nether and its fortresses"],
        ["VI. Arcane Arts", "Enchanting, brewing and magic"],
        ["VII. The Deep Below", "Caves, mining and the deep dark"],
        ["VIII. Bounty Board", "Hunting mobs"],
        ["IX. The Far End", "The End"],
        ["X. Legends of the Realm", "The hardest feats and bosses"]
      ] } },
      { list: [
        "Each Ledger unlocks once you've finished entry 50 of the one before it.",
        "Every 10th Ledger entry and each finale also gives **enchanted gear**. The strongest modded weapons, armour and spellbooks come from the late Ledgers.",
        "Hand-in quests take the items from your inventory, so don't hand in anything you want to keep."
      ] }
    ]
  },
  {
    id: "economy",
    title: "Coins & the Arcade",
    icon: "coin",
    intro: "The server runs on Lightman's Currency coins: real items you carry, spend and trade.",
    blocks: [
      { coins: ["Copper", "Iron", "Gold", "Emerald", "Diamond", "Netherite"] },
      { p: "10 of each coin is worth 1 of the next. So 1 Netherite coin = 100,000 Copper." },
      { cards: [
        { t: "Earn", k: "In game only", d: "Quest rewards (especially the Ledger), voting, trading with players and selling what you gather." },
        { t: "Spend", k: "/warp arcade", d: "The Arcade & Trade Hall in the RPG world: gacha machines for weapons, armour, enchants, runes and misc items, vending machines, and the exchange counter." },
        { t: "Share", k: "Community Chest", d: "Leave spare gear for new players, or grab something to get started. Take what you need, not everything." }
      ] },
      { callout: { kind: "tip", text: "**Everything in the Arcade is grindable for free.** Coins come from playing. You can't buy them with real money, and selling coins or items for real money breaks [rule 1.5](/rules#global-bans)." } },
      { p: "Vote for the server every day on the [Vote page](/vote) for extra rewards." }
    ]
  },
  {
    id: "worlds",
    title: "Worlds & Warps",
    icon: "globe",
    intro: "Use warps to get around fast. The warp boards in the hub list every destination.",
    blocks: [
      { chips: [
        { t: "/warp hub", d: "OVERTHRONE hub" },
        { t: "/warp survival", d: "Survival world" },
        { t: "/warp realms", d: "Realm portals" },
        { t: "/warp market", d: "Market" },
        { t: "/warp tavern", d: "Tavern" },
        { t: "/warp classes", d: "Classes" },
        { t: "/warp hunters", d: "Hunters" },
        { t: "/warp crates", d: "Crates" },
        { t: "/warp afk", d: "AFK area" },
        { t: "/rpg", d: "RPG world" },
        { t: "/warp arcade", d: "Arcade & Trade Hall" },
        { t: "/warp arcanum", d: "The Arcanum: enchanting & runes" }
      ] },
      { list: [
        "**The RPG world is protected.** You can't break or place blocks, and buckets, flint and steel, fire charges and explosions are blocked. It's a city to visit, not to build in.",
        "**Back to the hub:** walk through the portal in the RPG world to return to the hub.",
        "**Travel further:** activate Waystones as you find them to teleport between them. Use Nature's Compass to find a biome.",
        "**Maps:** Xaero's Minimap and World Map (**M**) show where you are and your waypoints."
      ] }
    ]
  },
  {
    id: "bosses",
    title: "Bosses & Dungeons",
    icon: "skull",
    intro: "The pack adds a lot of things that want you dead. Gear up, bring food, and don't fight the big ones alone.",
    blocks: [
      { cards: [
        { t: "L_Ender's Cataclysm", k: "Bosses", d: "Huge boss fights in their own structures: Ignis, the Netherite Monstrosity, the Ender Guardian, the Leviathan, the Harbinger, the Ancient Remnant, Maledictus and Scylla." },
        { t: "Mowzie's Mobs", k: "Bosses", d: "The Ferrous Wroughtnaut, Frostmaw, Umvuthi and the Naga, each with its own attack pattern to learn." },
        { t: "The Aether", k: "Sky dimension", d: "A floating dimension with dungeons and bosses: the Slider, the Valkyrie Queen and the Sun Spirit." },
        { t: "Deeper and Darker", k: "The Otherside", d: "A dimension reached from Ancient Cities in the deep dark, home to the Stalker. Sneak, and be quiet." },
        { t: "Born in Chaos", k: "Night mobs", d: "Nightmarish monsters that make the night much more dangerous. Don't wander far from a light source." },
        { t: "Dungeons & loot", k: "Explore", d: "YUNG's Better Dungeons, Dungeons and Taverns and Explorify add structures everywhere. Lootr gives every player their own loot from the same chest." }
      ] },
      { callout: { kind: "warn", text: "**Apotheosis** can make any mob an elite with extra powers, and gives gear random affixes and gem sockets. If a mob has a name and glows, be careful." } }
    ]
  },
  {
    id: "claims",
    title: "Claims, Parties & Voice",
    icon: "user",
    intro: "Protect your base and play with friends.",
    blocks: [
      { list: [
        "**Claim your land.** Press **'** (apostrophe) to open Open Parties and Claims, then claim chunks on the map. Claimed blocks and containers are protected from other players.",
        "**Make a party.** Create a party in the same menu and invite your friends so they can build and open chests in your claims.",
        "**Proximity voice chat.** Simple Voice Chat lets you talk to players near you. Press **V** to open its menu and test your microphone. Set push-to-talk in the controls if you don't want an open mic."
      ] }
    ]
  },
  {
    id: "fixes",
    title: "Known Issues & Fixes",
    icon: "help",
    intro: "Common problems and how to fix them.",
    blocks: [
      { faq: [
        { q: "My armour is invisible in Epic Fight battle mode", a: "This is a known incompatibility between Epic Fight and some modded armour, including Tensura armour. Your armour still protects you; it just isn't drawn in battle mode. Press **R** to switch to mining mode to see it again." },
        { q: "My camera glitches in third person", a: "This happens when two lock-on systems run together: Epic Fight's lock-on (**G**) and Better Lock On. Use only one. Unbind the one you don't want in Options → Controls → Key Binds." },
        { q: "The game crashes or freezes while loading", a: "Usually not enough memory. Give the pack **6–8 GB** of RAM in your launcher, then restart. Close other heavy programs." },
        { q: "My FPS is low", a: "Turn shaders off with **O** (pick \"None\"), lower Render Distance to 8–12 and Simulation Distance to 6–8 in Video Settings. Sodium's extra options are under Video Settings too." },
        { q: "My keys do two things at once", a: "Follow the [key conflict fixes](/guide#key-conflicts)." },
        { q: "Nobody can hear me in voice chat", a: "Press **V**, open the settings and pick the right microphone. Make sure you aren't muted (**M**) and that voice chat isn't turned off (**N**)." },
        { q: "I found a bug or exploit", a: "Report it privately in a Discord ticket. Don't abuse it; using bugs for an advantage is against [rule 1.2](/rules#global-bans)." }
      ] }
    ]
  },
  {
    id: "mods",
    title: "Mod List",
    icon: "spark",
    intro: "The main mods that change how you play. The full pack also has libraries and performance mods.",
    blocks: [
      { mods: [
        { group: "Core", items: ["Tensura: Reincarnated", "Tensura: Kumo Desu", "Tensura Leveling", "Epic Fight", "Epic Fight Extra", "Epic Fight Skill Tree", "Weapons of Miracles"] },
        { group: "Magic & gear", items: ["Iron's Spells 'n Spellbooks", "Simply Swords", "Apotheosis", "Apothic Enchanting", "Apothic Attributes", "Artifacts", "Sophisticated Backpacks"] },
        { group: "Bosses & mobs", items: ["L_Ender's Cataclysm", "Mowzie's Mobs", "Born in Chaos", "Deeper and Darker"] },
        { group: "Worlds & exploring", items: ["The Aether", "Regions Unexplored", "ChoiceTheorem's Overhauled Village", "YUNG's Better Dungeons", "Dungeons and Taverns", "Explorify", "Lootr", "Waystones", "Nature's Compass"] },
        { group: "Quests & economy", items: ["FTB Quests", "Lightman's Currency", "Jobs+"] },
        { group: "Friends & claims", items: ["Open Parties and Claims", "FTB Teams", "FTB Chunks", "Simple Voice Chat"] },
        { group: "Helpful", items: ["JEI", "Jade", "Xaero's Minimap", "Xaero's World Map", "Combat Numbers", "Better Lock On"] },
        { group: "Performance & visuals", items: ["Sodium", "Iris Shaders", "ImmediatelyFast", "ModernFix", "FerriteCore", "Entity Culling", "Dynamic FPS"] }
      ] }
    ]
  },
  {
    id: "faq",
    title: "FAQ",
    icon: "chat",
    intro: "Quick answers.",
    blocks: [
      { faq: [
        { q: "Is the server free?", a: "Yes. You need Minecraft: Java Edition and the OVERTHRONE modpack." },
        { q: "Can Bedrock or console players join?", a: "No. Modded servers only work with Java Edition on PC." },
        { q: "Can I add my own mods?", a: "Only client-side mods that don't give an advantage, such as minimaps you already have, shaders or performance mods. X-ray, freecam and other cheat mods get you banned. If you're not sure, ask in a Discord ticket first." },
        { q: "What version is it?", a: "Minecraft 1.21.1 with NeoForge. Use the modpack so every mod version matches the server." },
        { q: "Where do I get help?", a: "Open a ticket in the Discord, or check the [forums](/forums)." }
      ] }
    ]
  }
];

// Forum posts generated from the guide. Each post copies the listed sections.
// Inserted only if a post with the same title doesn't exist, so edits in /admin are kept.
export const FORUM_POSTS = [
  { category: "guides", title: "Start Here: Joining OVERTHRONE", pinned: true, sections: ["start", "first-hour"] },
  { category: "guides", title: "Keybinds & Fixing Key Conflicts", pinned: true, sections: ["keybinds", "key-conflicts"] },
  { category: "guides", title: "Combat, Magic & Skills", pinned: false, sections: ["combat"] },
  { category: "guides", title: "Claims, Parties & Voice Chat", pinned: false, sections: ["claims"] },
  { category: "guides", title: "Full Mod List", pinned: false, sections: ["mods"] },
  { category: "help", title: "Known Issues & Fixes", pinned: true, sections: ["fixes"] },
  { category: "help", title: "FAQ", pinned: true, sections: ["faq"] },
  { category: "economy", title: "Coins, the Arcade & Trading", pinned: true, sections: ["economy"] },
  { category: "quests", title: "How Quests Work", pinned: true, sections: ["quests"] },
  { category: "bosses", title: "Bosses & Dungeons Guide", pinned: true, sections: ["bosses"] },
  { category: "realms", title: "Worlds & Warps", pinned: true, sections: ["worlds"] }
];

// Races category + post in the forums (migration 0007, since 0006 has already run).
export const RACES_CATEGORY = { section: "OVERTHRONE Gameplay", name: "Races", slug: "races", description: "Every Tensura race, who it suits and how to evolve it.", icon: "crown", sort_order: 25 };
export const RACES_POST = { category: "races", title: "Races & Evolution Guide", pinned: true, sections: ["races"] };

// Forum category for the guide posts (the other categories already exist).
export const NEW_CATEGORIES = [
  { section: "OVERTHRONE Information", name: "Player Guides", slug: "guides", description: "How to join, keybinds, combat, claims and the full mod list.", icon: "compass", sort_order: 15 }
];

// Short pinned posts so no category is left empty.
export const CATEGORY_WELCOMES = [
  { category: "introductions", title: "Introduce Yourself in the Discord", body: "Forum posting for players is coming later. For now, say hi in our Discord and tell us your Minecraft name, what you like to play and how you found OVERTHRONE.\n\n[Join the Discord](https://discord.gg/overthronesmp)" },
  { category: "general-discussion", title: "Where the Community Talks", body: "Most chat happens in our Discord and in-game. Join the Discord to talk with other Hunters, find a party and see what's new.\n\n[Join the Discord](https://discord.gg/overthronesmp)" },
  { category: "screenshots-media", title: "Share Your Screenshots & Videos", body: "Post your builds, boss kills and clips in the media channels on our Discord. The best ones may be featured on the website and in trailers.\n\n[Join the Discord](https://discord.gg/overthronesmp)" },
  { category: "suggestions", title: "How to Suggest Something", body: "Use the **/suggest** command in our Discord. Every suggestion gets a number and staff mark it as accepted, considered or denied.\n\n- Explain the idea and why it helps the server.\n- One idea per suggestion.\n- Check the existing suggestions first.\n\n[Join the Discord](https://discord.gg/overthronesmp)" },
  { category: "player-reports", title: "How to Report a Player", body: "Open a **Report a Player** ticket in our Discord. Include:\n\n- Your Minecraft username\n- Who you're reporting\n- What happened, with **video or screenshots**\n\nReports without proof can't be acted on. Don't call players out in public chat.\n\n[Join the Discord](https://discord.gg/overthronesmp)" },
  { category: "bug-reports", title: "How to Report a Bug", body: "Open a **General Support** ticket in our Discord with:\n\n- What you were doing\n- What happened, and what you expected to happen\n- Screenshots, or your crash report if the game crashed\n\nExploits (duplication glitches and the like) should be reported privately and never used. See [rule 1.2](/rules#global-bans).\n\n[Join the Discord](https://discord.gg/overthronesmp)" },
  { category: "guilds", title: "Parties Now, Guilds Later", body: "A full guild system is planned. Until then, team up with a **party** in Open Parties and Claims: press **'** (apostrophe), create a party and invite your friends so you can share claims, chests and builds.\n\nLooking for people to play with? Ask in our Discord.\n\n[Claims, parties & voice chat](/guide#claims)" },
  { category: "gates", title: "The Gates: Under Development", body: "The Gate and dungeon system is still being built. Gate details will be posted here and in **Announcements** when it's ready.\n\nUntil then, plenty of dungeons are already out there: Cataclysm and Mowzie's Mobs boss arenas, YUNG's Better Dungeons and Dungeons and Taverns.\n\n[Bosses & dungeons](/guide#bosses)" },
  { category: "tensura-skills", title: "Tensura: Reincarnated on OVERTHRONE", body: "**Tensura: Reincarnated** is the core mod of the server: your race, unique and extra skills, magic and battlewills.\n\n- Browse skills, magics and battlewills on the [Tensura Skills](/tensura) page as we add them.\n- Tensura has its own keys for skills and menus. Find them in Options → Controls → Key Binds under the Tensura categories.\n- If your Tensura armour turns invisible in Epic Fight battle mode, that's a known incompatibility. It still protects you. Press **R** for mining mode to see it.\n\n[Combat, magic & skills](/guide#combat)" },
  { category: "hunter-progression", title: "Rank Trials on the Quest Board", body: "The full Hunter rank requirements are still being finalised. Until then, the Quest Board is your path: it runs from **E-Rank to S-Rank**, and every 10th quest is a **Rank Trial**.\n\n- E-Rank: The Awakening (quests 1–20)\n- D-Rank: The Wilds (21–40)\n- C-Rank: Into the Depths (41–60)\n- B-Rank: The Hunt Beyond (61–80)\n- S-Rank: Overthrow (81–100)\n\n[How quests work](/guide#quests)" },
  { category: "announcements", title: "Official Trailer & the New Player Guide", body: "The official OVERTHRONE SMP trailer is out! Watch it on the [home page](/#trailer): sky cities, Epic Fight combat, bosses and the RPG world.\n\nWe've also added a full **[Player Guide](/guide)**: installing the modpack, every important keybind (and how to fix the keys that clash), quests, coins, warps, bosses and fixes for common problems." },
  { category: "server-updates", title: "Update: The Hunter's Ledger, the Arcade & the RPG World", body: "A big content update for OVERTHRONE.\n\n## The Hunter's Ledger\n- **1,012 new quests** across ten Ledgers, from Homestead to Legends of the Realm.\n- Rewards are Lightman's Currency coins, about **1,500 Netherite** for finishing everything, plus enchanted gear every 10th entry.\n- The strongest modded weapons, armour and spellbooks are saved for the late Ledgers.\n\n## The RPG World\n- A protected city: blocks can't be broken or placed, and explosions don't damage it.\n- **Questmaster Orin** opens the quest book.\n- **The Arcade & Trade Hall** (/warp arcade): gacha machines for weapons, armour, enchants, runes and misc, vending machines, the exchange counter and the Community Chest.\n- **The Arcanum** (/warp arcanum): enchanting and runes.\n\n[How quests work](/guide#quests) · [Coins & the Arcade](/guide#economy)" },
  { category: "changelog", title: "Changelog: October 2026", body: "## Gameplay\n- Added the Hunter's Ledger: 1,012 coin quests in ten chapters, alongside the 100-quest Quest Board.\n- Added the RPG world: Quest Board, Arcade & Trade Hall, the Arcanum and the Community Chest.\n- The RPG world is now build-protected and has a world border.\n- Added Questmaster Orin, who opens the quest book.\n\n## Website\n- New [Player Guide](/guide) with verified keybinds and key conflict fixes.\n- Official trailer on the home page.\n- New guide posts across the forums, and the RPG world added to the Realms." }
];
