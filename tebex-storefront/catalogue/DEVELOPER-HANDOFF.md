# OVERTHRONE SMP – Developer Handoff (Tebex)

Hi! The owner has designed the full Tebex store. **Every package needs a real command** in place of its placeholder.

Please do the following:
1. Build or choose the systems below.
2. Fill in the "Real command" line for each package ID.
3. Send the list back.

**Server:** Minecraft 1.21.1 · NeoForge 21.1.251 · Java 21.

**Confirmed mods:** Solo Leveling: Reawakening (SLR), Tensura: Reincarnated, Tensura Leveling SLR: True Isekai, Beyond Adventures, Pufferfish's Skills, FTB Quests, KubeJS, RenderJS, Easy NPC, Epic Fight, Epic Fight Skill Tree, Iron's Spells 'n Spellbooks, Apothic Attributes, Open Parties and Claims, Lootr, Sophisticated Backpacks, Waystones, Xaero's Minimap / World Map, Simply Swords, Weapons of Miracles, The Aether, YUNG's Better Dungeons, Dungeons and Taverns, Jade / Jade Addons.
There is no permissions, essentials, economy, auction, crate or cosmetics mod in that list.

**Placeholder format:** `<NAME_COMMAND key=value …>`.
- `{username}` is Tebex's buyer placeholder.
- `{recipient}` is a Tebex package variable used by gift packages.

**Never put the Tebex secret key in the website, GitHub or Discord.**

## Systems required

| System | What it must do |
|---|---|
| Tebex delivery | Install a Tebex plugin/mod compatible with NeoForge 1.21.1 (compatibility UNVERIFIED – confirm before purchase), or use RCON. Store secret key only on the server. Commands use Tebex's {username} placeholder; gift packages use a {recipient} package variable. |
| Ranks + prefixes | No permissions/prefix mod in the list. Needed: 5 groups (supporter → overlord) with inheritance, coloured prefixes, an animated Overlord prefix. Options: LuckPerms or FTB Ranks (NeoForge builds – confirm). Provide <SET_RANK_COMMAND>. |
| Discord roles | Tebex Discord Actions (built into Tebex) – link the Tebex Discord bot. No server command needed. |
| Throne Shards | Cosmetic-only currency. One option with REAL vanilla syntax: `scoreboard objectives add throne_shards dummy` then `scoreboard players add {username} throne_shards <amount>` (works only while the player is online unless queued). Or a KubeJS/currency mod. Must never buy gameplay items. Provide <GIVE_SHARDS_COMMAND>. |
| Throne Vault | In-game GUI/NPC (Easy NPC + KubeJS are installed) that sells cosmetics for Throne Shards. |
| Crates + keys | 6 crates with the odds in CATALOGUE.md, virtual keys, duplicate → shards, odds visible in-game, free key sources in gameplay. No crate mod installed – KubeJS or a crate mod. Provide <GIVE_CRATE_KEY_COMMAND>. |
| Cosmetics | Auras, trails, particles, kill/death/spawn/teleport effects, titles, chat tags, chat effects, emotes, pets, weapon/armour/mount skins (resource-pack models, appearance only). RenderJS/KubeJS are installed and may help. Provide <GRANT_COSMETIC_COMMAND>. |
| Chat formatting | Chat colours, gradients, emoji packs, join messages, server-wide arrival announcement. |
| Essentials commands | /hat, /nick (moderated), /sit, /lay, hub-only /fly, homes (if kept). None in the mod list – essentials-style mod or KubeJS. |
| Claims (Borderline) | Open Parties and Claims is installed. Bonus claim chunks per rank need permission-based limits – confirm OPAC supports this with the chosen permission mod (UNVERIFIED). |
| Auction House (Borderline) | No auction mod in the list. Needed only if AH listing slots stay as a rank perk. |
| Class / race reset tokens (Borderline) | Custom class system (Warrior/Assassin/Mage/Ranger/Guardian) + Tensura race reset – commands UNVERIFIED. Provide <GIVE_TOKEN_COMMAND>. |
| Global boosters | Server-wide timed boosts (XP, currency, drops, key-find, Hunter XP, Gate rewards, party). Queue same-type boosts, announce the buyer, show a timer. Provide <START_GLOBAL_BOOST_COMMAND>. |
| Tokens / temp permissions | Nick 30d, name/prefix colour, wardrobe slots, guild banner slot, queue pass. Provide <GIVE_TOKEN_COMMAND> and <GRANT_TEMP_PERMISSION_COMMAND>. |
| Queue priority | Join-queue priority by rank (needs a queue/proxy setup). |
| Events | Event cosmetics/crates toggled per event. |
| Optional Risky perks | Only if the owner chooses them: Sophisticated Backpacks / Waystones / Iron's Spells items, Pufferfish skill points, kits, keep-XP, survival /fly, /back. Real item IDs and commands must be confirmed – none are assumed here. |

## Placeholders

| Placeholder | Meaning |
|---|---|
| `<SET_RANK_COMMAND player rank>` | Give a lifetime donor rank (remove the lower rank on upgrades) |
| `<GIVE_CRATE_KEY_COMMAND player crate amount>` | Give virtual crate keys |
| `<GIVE_SHARDS_COMMAND player amount>` | Add Throne Shards |
| `<GRANT_COSMETIC_COMMAND player id>` | Unlock a cosmetic |
| `<START_GLOBAL_BOOST_COMMAND type minutes buyer>` | Start or queue a server-wide boost |
| `<GIVE_TOKEN_COMMAND player token amount>` | Give tokens (class reset, name colour, wardrobe…) |
| `<GRANT_TEMP_PERMISSION_COMMAND player permission duration>` | Temporary permission |

## Rank perk matrix (what each rank must unlock)

| Perk | Supporter | Elite | Champion | Warlord | Overlord | Rating | Status |
|---|---|---|---|---|---|---|---|
| Rank prefix in chat & tab | [SUPPORTER] | [ELITE] | [CHAMPION] | [WARLORD] | [OVERLORD] (animated) | Safe | DEV SYSTEM REQUIRED |
| Coloured name | Crimson | Violet | Bronze | Flame | Gold | Safe | DEV SYSTEM REQUIRED |
| Discord role | @Supporter | @Elite | @Champion | @Warlord | @Overlord | Safe | Ready in Tebex |
| Join queue priority | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 | Safe | DEV SYSTEM REQUIRED |
| Throne Shards on purchase | 500 | 1,000 | 2,000 | 3,500 | 6,000 | Safe | DEV SYSTEM REQUIRED |
| Crate keys on purchase | 2× Ember | 3× Bloodmoon | 3× Abyssal | 3× Dreadforge | 3× Throne + 3× Regalia | Safe | DEV SYSTEM REQUIRED |
| Rank-exclusive cosmetic | Crimson Spark particle | Violet Ember aura | Bronze Banner kill effect | Warlord title + War Banner trail | Overlord Crown aura + title + Overlord Raven pet | Safe | DEV SYSTEM REQUIRED |
| Chat colours (/chatcolor) | ✗ | 4 colours | 8 colours | 12 colours | All + gradients | Safe | DEV SYSTEM REQUIRED |
| Chat emoji pack | ✓ | ✓ | ✓ | ✓ | ✓ | Safe | DEV SYSTEM REQUIRED |
| Custom join message | ✗ | ✗ | ✓ | ✓ | ✓ | Safe | DEV SYSTEM REQUIRED |
| Server-wide arrival announcement | ✗ | ✗ | ✗ | ✓ | ✓ | Safe | DEV SYSTEM REQUIRED |
| /hat | ✗ | ✗ | ✓ | ✓ | ✓ | Safe | DEV SYSTEM REQUIRED |
| /nick (staff-moderated) | ✗ | ✗ | ✗ | ✓ | ✓ | Safe | DEV SYSTEM REQUIRED |
| /sit & /lay | ✗ | ✗ | ✗ | ✗ | ✓ | Safe | DEV SYSTEM REQUIRED |
| Emotes | ✗ | ✗ | Champion Salutes | War Cries | All rank emotes | Safe | DEV SYSTEM REQUIRED |
| /fly in the OVERTHRONE hub only | ✗ | ✗ | ✗ | ✓ | ✓ | Safe | DEV SYSTEM REQUIRED |
| Hall of Thrones listing (website + Discord) | ✗ | ✗ | ✗ | ✗ | ✓ | Safe | Ready (manual) |
| Homes (/sethome) | 2 | 3 | 4 | 5 | 6 | Borderline | DEV SYSTEM REQUIRED |
| Bonus claim chunks (Open Parties and Claims) | +25 | +50 | +75 | +100 | +150 | Borderline | UNVERIFIED (OPAC permission support must be confirmed) |
| Auction House listing slots | 5 | 7 | 9 | 11 | 15 | Borderline | DEV SYSTEM REQUIRED |
| Class Reset Tokens on purchase | 1 | 2 | 3 | 4 | 5 | Borderline | DEV SYSTEM REQUIRED |
| Race Reset Token on purchase (Tensura) | ✗ | ✗ | 1 | 1 | 2 | Borderline | UNVERIFIED (no confirmed reset command) |
| /back after death (optional, Risky) | ✗ | ✗ | ✗ | ✓ | ✓ | Risky | DEV SYSTEM REQUIRED |
| Sophisticated Backpack on purchase (optional, Risky) | Iron | Gold | Diamond | Netherite | Netherite + upgrades | Risky | Real mod – item ID UNVERIFIED |
| Waystones Warp/Return Scrolls on purchase (optional, Risky) | ✗ | 3 | 5 | 8 | 12 | Risky | Real mod – item IDs UNVERIFIED |
| Iron's Spells ink/scrolls on purchase (optional, Risky) | ✗ | ✗ | Rare ink ×2 | Epic ink ×2 | Legendary ink ×1 | Risky | Real mod – item IDs UNVERIFIED |
| Pufferfish's Skills points on purchase (optional, Risky) | ✗ | ✗ | ✗ | 2 | 4 | Risky | Command UNVERIFIED |
| Rank kit (/kit) (optional, Risky) | ✗ | ✗ | ✗ | Weekly | Daily | Risky | DEV SYSTEM REQUIRED |
| Keep XP on death (optional, Risky) | ✗ | ✗ | ✗ | ✗ | ✓ | Risky | DEV SYSTEM REQUIRED |
| /fly in survival worlds (optional, Risky) | ✗ | ✗ | ✗ | ✗ | ✓ | Risky | DEV SYSTEM REQUIRED |

## Cosmetic IDs to implement

`armour_crimson_warden`, `armour_dreadforge_plate`, `aura_abyssal_flame`, `aura_crimson_eclipse_limited`, `aura_crimson_halo`, `aura_festival_crown`, `aura_frostbound`, `aura_obsidian_crown`, `aura_overlord_crown`, `aura_violet_ember`, `chat_crimson_gradient`, `chat_gilded_shimmer`, `death_ashen_collapse`, `death_soul_ascension`, `emoji_pack_dark_court`, `emote_blade_salute`, `emote_kneel`, `kill_bloodmoon_eclipse`, `kill_bronze_banner`, `kill_chainbind`, `kill_throne_shatter`, `monthly_relic`, `mount_ashen_charger`, `mount_nightmare_steed`, `particle_crimson_spark`, `particle_falling_ash`, `particle_orbiting_runes`, `pet_crimson_fox`, `pet_ember_wisp`, `pet_gate_golem`, `pet_hollow_lantern`, `pet_obsidian_raven`, `pet_overlord_raven`, `pet_void_hatchling`, `set_aeonia_explorer`, `set_netherfall_explorer`, `spawn_crimson_arrival`, `tag_anniversary`, `tag_black_crown`, `tag_crimson_sigil`, `tag_founder`, `title_anniversary`, `title_ashborn`, `title_bloodmoon_reaper`, `title_crimson_hunter`, `title_founder`, `title_gatebreaker`, `title_hallowed`, `title_oathless`, `title_outbreak`, `title_overlord`, `title_season_n`, `title_warlord`, `title_winters_crown`, `tp_blood_rift`, `tp_shadow_step`, `trail_bloodstep`, `trail_crystal_shard`, `trail_ember_wake`, `trail_war_banner`, `weapon_abyssal_scythe`, `weapon_bloodmoon_blade`, `weapon_throne_edge`

## Per-package commands (180)

### Featured

**FEAT-001: Crimson Eclipse Aura (Limited)**
- Delivers: A limited aura: a crimson eclipse forms a halo behind you. Leaves the store when the rotation ends.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=aura_crimson_eclipse_limited>`
- Real command: ____________________

**FEAT-002: Founder's Crown Title**
- Delivers: Title “Founder”, available only during the server's launch month. Never returns.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=title_founder>`
- Real command: ____________________

**FEAT-003: Weekend Throne Rush**
- Delivers: 3 Throne Keys and 3 Regalia Keys at a weekend price.
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=throne amount=3> + <GIVE_CRATE_KEY_COMMAND player={username} crate=regalia amount=3>`
- Real command: ____________________

**FEAT-004: Monthly Relic Box**
- Delivers: One cosmetic relic chosen for the month, plus 1,000 Throne Shards. The month's relic is listed in the description.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=monthly_relic> + <GIVE_SHARDS_COMMAND player={username} amount=1000>`
- Real command: ____________________

**FEAT-005: Throne of Ash Set**
- Delivers: Ashborn title, Ashen Collapse death effect and Falling Ash particles in one set.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=title_ashborn> + <GRANT_COSMETIC_COMMAND player={username} id=death_ashen_collapse> + <GRANT_COSMETIC_COMMAND player={username} id=particle_falling_ash>`
- Real command: ____________________

**FEAT-006: Gatekeeper's Sigil Set**
- Delivers: Crimson Sigil tag, Orbiting Runes and the Shadow Step teleport effect.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=tag_crimson_sigil> + <GRANT_COSMETIC_COMMAND player={username} id=particle_orbiting_runes> + <GRANT_COSMETIC_COMMAND player={username} id=tp_shadow_step>`
- Real command: ____________________

**FEAT-007: Double Shard Weekend: Coffer**
- Delivers: 5,000 Throne Shards + 5,000 bonus shards during Double Shard weekends.
- Placeholder: `<GIVE_SHARDS_COMMAND player={username} amount=10000>`
- Real command: ____________________

**FEAT-008: Crimson Fox Companion**
- Delivers: Spotlight price on the Crimson Fox Spirit pet.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=pet_crimson_fox>`
- Real command: ____________________

**FEAT-009: Bloodmoon Hunt Pass**
- Delivers: 5 Bloodmoon Keys and the Bloodmoon Eclipse kill effect.
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=bloodmoon amount=5> + <GRANT_COSMETIC_COMMAND player={username} id=kill_bloodmoon_eclipse>`
- Real command: ____________________

**FEAT-010: Obsidian Monarch Set**
- Delivers: Obsidian Crown aura, Black Crown tag and Obsidian Raven pet.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=aura_obsidian_crown> + <GRANT_COSMETIC_COMMAND player={username} id=tag_black_crown> + <GRANT_COSMETIC_COMMAND player={username} id=pet_obsidian_raven>`
- Real command: ____________________

**FEAT-011: Dreadforge Spotlight Keys**
- Delivers: 5 Dreadforge Keys at a spotlight price.
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=dreadforge amount=5>`
- Real command: ____________________

**FEAT-012: Realm Explorer Set (Aeonia)**
- Delivers: A divine-themed cosmetic set released with the Aeonia realm.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=set_aeonia_explorer>`
- Real command: ____________________

**FEAT-013: Realm Explorer Set (Netherfall)**
- Delivers: An underworld-themed cosmetic set released with the Netherfall realm.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=set_netherfall_explorer>`
- Real command: ____________________

**FEAT-014: Gate Clear Celebration Pack**
- Delivers: 2 Abyssal Keys, 2,500 Throne Shards and the Gatebreaker title.
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=abyssal amount=2> + <GIVE_SHARDS_COMMAND player={username} amount=2500> + <GRANT_COSMETIC_COMMAND player={username} id=title_gatebreaker>`
- Real command: ____________________

**FEAT-015: Spotlight: Shattered Crystal Trail**
- Delivers: Spotlight price on the Shattered Crystal trail.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=trail_crystal_shard>`
- Real command: ____________________

### Ranks

**RANK-001: Supporter Rank**
- Delivers: Rank prefix in chat & tab: [SUPPORTER]; Coloured name: Crimson; Discord role: @Supporter; Join queue priority: Tier 1; Chat emoji pack; Homes (/sethome): 2; Bonus claim chunks (Open Parties and Claims): +25; Auction House listing slots: 5; Throne Shards: 500; Crate keys: 2× Ember; Rank-exclusive cosmetic: Crimson Spark particle; Class Reset Tokens: 1
- Placeholder: `<SET_RANK_COMMAND player={username} rank=supporter> + <GIVE_CRATE_KEY_COMMAND player={username} crate=ember amount=2> + <GIVE_SHARDS_COMMAND player={username} amount=500> + <GRANT_COSMETIC_COMMAND player={username} id=particle_crimson_spark> + <GIVE_TOKEN_COMMAND player={username} token=class_reset amount=1> + Tebex Discord Action: add role @Supporter`
- Real command: ____________________

**RANK-002: Elite Rank**
- Delivers: Rank prefix in chat & tab: [ELITE]; Coloured name: Violet; Discord role: @Elite; Join queue priority: Tier 2; Chat colours (/chatcolor): 4 colours; Homes (/sethome): 3; Bonus claim chunks (Open Parties and Claims): +50; Auction House listing slots: 7; Throne Shards: 1,000; Crate keys: 3× Bloodmoon; Rank-exclusive cosmetic: Violet Ember aura; Class Reset Tokens: 2
- Placeholder: `<SET_RANK_COMMAND player={username} rank=elite> + <GIVE_CRATE_KEY_COMMAND player={username} crate=bloodmoon amount=3> + <GIVE_SHARDS_COMMAND player={username} amount=1000> + <GRANT_COSMETIC_COMMAND player={username} id=aura_violet_ember> + <GIVE_TOKEN_COMMAND player={username} token=class_reset amount=2> + Tebex Discord Action: add role @Elite`
- Real command: ____________________

**RANK-003: Champion Rank**
- Delivers: Rank prefix in chat & tab: [CHAMPION]; Coloured name: Bronze; Discord role: @Champion; Join queue priority: Tier 3; Chat colours (/chatcolor): 8 colours; Custom join message; /hat; Emotes: Champion Salutes; Homes (/sethome): 4; Bonus claim chunks (Open Parties and Claims): +75; Auction House listing slots: 9; Throne Shards: 2,000; Crate keys: 3× Abyssal; Rank-exclusive cosmetic: Bronze Banner kill effect; Class Reset Tokens: 3; Race Reset Token (Tensura): 1
- Placeholder: `<SET_RANK_COMMAND player={username} rank=champion> + <GIVE_CRATE_KEY_COMMAND player={username} crate=abyssal amount=3> + <GIVE_SHARDS_COMMAND player={username} amount=2000> + <GRANT_COSMETIC_COMMAND player={username} id=kill_bronze_banner> + <GIVE_TOKEN_COMMAND player={username} token=class_reset amount=3> + <GIVE_TOKEN_COMMAND player={username} token=race_reset amount=1> + Tebex Discord Action: add role @Champion`
- Real command: ____________________

**RANK-005: Warlord Rank**
- Delivers: Rank prefix in chat & tab: [WARLORD]; Coloured name: Flame; Discord role: @Warlord; Join queue priority: Tier 4; Chat colours (/chatcolor): 12 colours; Server-wide arrival announcement; /nick (staff-moderated); Emotes: War Cries; /fly in the OVERTHRONE hub only; Homes (/sethome): 5; Bonus claim chunks (Open Parties and Claims): +100; Auction House listing slots: 11; Throne Shards: 3,500; Crate keys: 3× Dreadforge; Rank-exclusive cosmetic: Warlord title + War Banner trail; Class Reset Tokens: 4; Race Reset Token (Tensura): 1
- Placeholder: `<SET_RANK_COMMAND player={username} rank=warlord> + <GIVE_CRATE_KEY_COMMAND player={username} crate=dreadforge amount=3> + <GIVE_SHARDS_COMMAND player={username} amount=3500> + <GRANT_COSMETIC_COMMAND player={username} id=title_warlord> + <GRANT_COSMETIC_COMMAND player={username} id=trail_war_banner> + <GIVE_TOKEN_COMMAND player={username} token=class_reset amount=4> + <GIVE_TOKEN_COMMAND player={username} token=race_reset amount=1> + Tebex Discord Action: add role @Warlord`
- Real command: ____________________

**RANK-004: Overlord Rank**
- Delivers: Rank prefix in chat & tab: [OVERLORD] (animated); Coloured name: Gold; Discord role: @Overlord; Join queue priority: Tier 5; Chat colours (/chatcolor): All + gradients; /sit & /lay; Emotes: All rank emotes; Hall of Thrones listing (website + Discord); Homes (/sethome): 6; Bonus claim chunks (Open Parties and Claims): +150; Auction House listing slots: 15; Throne Shards: 6,000; Crate keys: 3× Throne + 3× Regalia; Rank-exclusive cosmetic: Overlord Crown aura + title + Overlord Raven pet; Class Reset Tokens: 5; Race Reset Token (Tensura): 2
- Placeholder: `<SET_RANK_COMMAND player={username} rank=overlord> + <GIVE_CRATE_KEY_COMMAND player={username} crate=throne amount=3> + <GIVE_CRATE_KEY_COMMAND player={username} crate=regalia amount=3> + <GIVE_SHARDS_COMMAND player={username} amount=6000> + <GRANT_COSMETIC_COMMAND player={username} id=aura_overlord_crown> + <GRANT_COSMETIC_COMMAND player={username} id=title_overlord> + <GRANT_COSMETIC_COMMAND player={username} id=pet_overlord_raven> + <GIVE_TOKEN_COMMAND player={username} token=class_reset amount=5> + <GIVE_TOKEN_COMMAND player={username} token=race_reset amount=2> + Tebex Discord Action: add role @Overlord`
- Real command: ____________________

### Crate Keys

**KEY-001: Ember Key ×1**
- Delivers: 1× Ember Key
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=ember amount=1>`
- Real command: ____________________

**KEY-002: Ember Key ×5**
- Delivers: 5× Ember Key (10% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=ember amount=5>`
- Real command: ____________________

**KEY-003: Ember Key ×10**
- Delivers: 10× Ember Key (15% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=ember amount=10>`
- Real command: ____________________

**KEY-004: Ember Key ×25**
- Delivers: 25× Ember Key (20% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=ember amount=25>`
- Real command: ____________________

**KEY-005: Ember Key ×50**
- Delivers: 50× Ember Key (25% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=ember amount=50>`
- Real command: ____________________

**KEY-006: Ember Key ×100**
- Delivers: 100× Ember Key (30% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=ember amount=100>`
- Real command: ____________________

**KEY-007: Bloodmoon Key ×1**
- Delivers: 1× Bloodmoon Key
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=bloodmoon amount=1>`
- Real command: ____________________

**KEY-008: Bloodmoon Key ×5**
- Delivers: 5× Bloodmoon Key (10% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=bloodmoon amount=5>`
- Real command: ____________________

**KEY-009: Bloodmoon Key ×10**
- Delivers: 10× Bloodmoon Key (15% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=bloodmoon amount=10>`
- Real command: ____________________

**KEY-010: Bloodmoon Key ×25**
- Delivers: 25× Bloodmoon Key (20% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=bloodmoon amount=25>`
- Real command: ____________________

**KEY-011: Bloodmoon Key ×50**
- Delivers: 50× Bloodmoon Key (25% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=bloodmoon amount=50>`
- Real command: ____________________

**KEY-012: Bloodmoon Key ×100**
- Delivers: 100× Bloodmoon Key (30% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=bloodmoon amount=100>`
- Real command: ____________________

**KEY-013: Abyssal Key ×1**
- Delivers: 1× Abyssal Key
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=abyssal amount=1>`
- Real command: ____________________

**KEY-014: Abyssal Key ×5**
- Delivers: 5× Abyssal Key (10% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=abyssal amount=5>`
- Real command: ____________________

**KEY-015: Abyssal Key ×10**
- Delivers: 10× Abyssal Key (15% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=abyssal amount=10>`
- Real command: ____________________

**KEY-016: Abyssal Key ×25**
- Delivers: 25× Abyssal Key (20% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=abyssal amount=25>`
- Real command: ____________________

**KEY-017: Abyssal Key ×50**
- Delivers: 50× Abyssal Key (25% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=abyssal amount=50>`
- Real command: ____________________

**KEY-018: Abyssal Key ×100**
- Delivers: 100× Abyssal Key (30% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=abyssal amount=100>`
- Real command: ____________________

**KEY-019: Dreadforge Key ×1**
- Delivers: 1× Dreadforge Key
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=dreadforge amount=1>`
- Real command: ____________________

**KEY-020: Dreadforge Key ×5**
- Delivers: 5× Dreadforge Key (10% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=dreadforge amount=5>`
- Real command: ____________________

**KEY-021: Dreadforge Key ×10**
- Delivers: 10× Dreadforge Key (15% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=dreadforge amount=10>`
- Real command: ____________________

**KEY-022: Dreadforge Key ×25**
- Delivers: 25× Dreadforge Key (20% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=dreadforge amount=25>`
- Real command: ____________________

**KEY-023: Dreadforge Key ×50**
- Delivers: 50× Dreadforge Key (25% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=dreadforge amount=50>`
- Real command: ____________________

**KEY-024: Dreadforge Key ×100**
- Delivers: 100× Dreadforge Key (30% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=dreadforge amount=100>`
- Real command: ____________________

**KEY-025: Regalia Key ×1**
- Delivers: 1× Regalia Key
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=regalia amount=1>`
- Real command: ____________________

**KEY-026: Regalia Key ×5**
- Delivers: 5× Regalia Key (10% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=regalia amount=5>`
- Real command: ____________________

**KEY-027: Regalia Key ×10**
- Delivers: 10× Regalia Key (15% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=regalia amount=10>`
- Real command: ____________________

**KEY-028: Regalia Key ×25**
- Delivers: 25× Regalia Key (20% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=regalia amount=25>`
- Real command: ____________________

**KEY-029: Regalia Key ×50**
- Delivers: 50× Regalia Key (25% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=regalia amount=50>`
- Real command: ____________________

**KEY-030: Regalia Key ×100**
- Delivers: 100× Regalia Key (30% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=regalia amount=100>`
- Real command: ____________________

**KEY-031: Throne Key ×1**
- Delivers: 1× Throne Key
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=throne amount=1>`
- Real command: ____________________

**KEY-032: Throne Key ×5**
- Delivers: 5× Throne Key (10% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=throne amount=5>`
- Real command: ____________________

**KEY-033: Throne Key ×10**
- Delivers: 10× Throne Key (15% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=throne amount=10>`
- Real command: ____________________

**KEY-034: Throne Key ×25**
- Delivers: 25× Throne Key (20% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=throne amount=25>`
- Real command: ____________________

**KEY-035: Throne Key ×50**
- Delivers: 50× Throne Key (25% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=throne amount=50>`
- Real command: ____________________

**KEY-036: Throne Key ×100**
- Delivers: 100× Throne Key (30% bulk saving)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=throne amount=100>`
- Real command: ____________________

**KEY-037: Gate Key Sampler**
- Delivers: 1× Ember Key; 1× Bloodmoon Key; 1× Abyssal Key; 1× Dreadforge Key; 1× Regalia Key; 1× Throne Key
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=ember amount=1> + <GIVE_CRATE_KEY_COMMAND player={username} crate=bloodmoon amount=1> + <GIVE_CRATE_KEY_COMMAND player={username} crate=abyssal amount=1> + <GIVE_CRATE_KEY_COMMAND player={username} crate=dreadforge amount=1> + <GIVE_CRATE_KEY_COMMAND player={username} crate=regalia amount=1> + <GIVE_CRATE_KEY_COMMAND player={username} crate=throne amount=1>`
- Real command: ____________________

**KEY-038: Lower Gates Key Cache**
- Delivers: 5× Ember Key; 3× Bloodmoon Key; 2× Abyssal Key
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=ember amount=5> + <GIVE_CRATE_KEY_COMMAND player={username} crate=bloodmoon amount=3> + <GIVE_CRATE_KEY_COMMAND player={username} crate=abyssal amount=2>`
- Real command: ____________________

**KEY-039: High Gates Key Vault**
- Delivers: 3× Dreadforge Key; 3× Regalia Key; 3× Throne Key
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=dreadforge amount=3> + <GIVE_CRATE_KEY_COMMAND player={username} crate=regalia amount=3> + <GIVE_CRATE_KEY_COMMAND player={username} crate=throne amount=3>`
- Real command: ____________________

### Throne Shards

**SHARD-001: Shard Pouch: 1,000 Throne Shards**
- Delivers: 1,000 Throne Shards
- Placeholder: `<GIVE_SHARDS_COMMAND player={username} amount=1000>`
- Real command: ____________________

**SHARD-002: Shard Satchel: 2,500 Throne Shards**
- Delivers: 2,500 Throne Shards + 5% bonus = 2,625
- Placeholder: `<GIVE_SHARDS_COMMAND player={username} amount=2625>`
- Real command: ____________________

**SHARD-003: Shard Coffer: 5,000 Throne Shards**
- Delivers: 5,000 Throne Shards + 10% bonus = 5,500
- Placeholder: `<GIVE_SHARDS_COMMAND player={username} amount=5500>`
- Real command: ____________________

**SHARD-004: Shard Chest: 10,000 Throne Shards**
- Delivers: 10,000 Throne Shards + 15% bonus = 11,500
- Placeholder: `<GIVE_SHARDS_COMMAND player={username} amount=11500>`
- Real command: ____________________

**SHARD-005: Shard Vault: 25,000 Throne Shards**
- Delivers: 25,000 Throne Shards + 20% bonus = 30,000
- Placeholder: `<GIVE_SHARDS_COMMAND player={username} amount=30000>`
- Real command: ____________________

**SHARD-006: Shard Hoard: 50,000 Throne Shards**
- Delivers: 50,000 Throne Shards + 25% bonus = 62,500
- Placeholder: `<GIVE_SHARDS_COMMAND player={username} amount=62500>`
- Real command: ____________________

**SHARD-007: Throne Treasury: 100,000 Throne Shards**
- Delivers: 100,000 Throne Shards + 30% bonus = 130,000
- Placeholder: `<GIVE_SHARDS_COMMAND player={username} amount=130000>`
- Real command: ____________________

### Bundles

**BND-001: Hunter's Oath**
- Delivers: 5× Ember Key; 2× Bloodmoon Key; 2,500 Throne Shards; Crimson Hunter (Title); Ember Wake (Trail)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=ember amount=5> + <GIVE_CRATE_KEY_COMMAND player={username} crate=bloodmoon amount=2> + <GIVE_SHARDS_COMMAND player={username} amount=2500> + <GRANT_COSMETIC_COMMAND player={username} id=title_crimson_hunter> + <GRANT_COSMETIC_COMMAND player={username} id=trail_ember_wake>`
- Real command: ____________________

**BND-002: Gatebreaker's Cache**
- Delivers: 5× Abyssal Key; 5,000 Throne Shards; Gatebreaker (Title); Blood Rift (Teleport Effect)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=abyssal amount=5> + <GIVE_SHARDS_COMMAND player={username} amount=5000> + <GRANT_COSMETIC_COMMAND player={username} id=title_gatebreaker> + <GRANT_COSMETIC_COMMAND player={username} id=tp_blood_rift>`
- Real command: ____________________

**BND-003: Bloodmoon Covenant**
- Delivers: 10× Bloodmoon Key; 5,000 Throne Shards; Bloodstep (Trail); Bloodmoon Blade (Weapon Skin)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=bloodmoon amount=10> + <GIVE_SHARDS_COMMAND player={username} amount=5000> + <GRANT_COSMETIC_COMMAND player={username} id=trail_bloodstep> + <GRANT_COSMETIC_COMMAND player={username} id=weapon_bloodmoon_blade>`
- Real command: ____________________

**BND-004: Abyss Walker**
- Delivers: 10× Abyssal Key; 7,500 Throne Shards; Abyssal Scythe (Weapon Skin); Abyssal Flame (Aura)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=abyssal amount=10> + <GIVE_SHARDS_COMMAND player={username} amount=7500> + <GRANT_COSMETIC_COMMAND player={username} id=weapon_abyssal_scythe> + <GRANT_COSMETIC_COMMAND player={username} id=aura_abyssal_flame>`
- Real command: ____________________

**BND-005: Dreadforge Arsenal**
- Delivers: 10× Dreadforge Key; 7,500 Throne Shards; Dreadforge Plate (Armour Skin); Ashen Charger (Mount Skin)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=dreadforge amount=10> + <GIVE_SHARDS_COMMAND player={username} amount=7500> + <GRANT_COSMETIC_COMMAND player={username} id=armour_dreadforge_plate> + <GRANT_COSMETIC_COMMAND player={username} id=mount_ashen_charger>`
- Real command: ____________________

**BND-006: Regalia Trove**
- Delivers: 10× Regalia Key; 10,000 Throne Shards; Gilded Name Shimmer (Chat Effect); Obsidian Crown (Aura)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=regalia amount=10> + <GIVE_SHARDS_COMMAND player={username} amount=10000> + <GRANT_COSMETIC_COMMAND player={username} id=chat_gilded_shimmer> + <GRANT_COSMETIC_COMMAND player={username} id=aura_obsidian_crown>`
- Real command: ____________________

**BND-007: Crimson Court**
- Delivers: 5× Bloodmoon Key; 5,000 Throne Shards; Crimson Warden (Armour Skin); Crimson Halo (Aura); Crimson Gradient (Chat Effect)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=bloodmoon amount=5> + <GIVE_SHARDS_COMMAND player={username} amount=5000> + <GRANT_COSMETIC_COMMAND player={username} id=armour_crimson_warden> + <GRANT_COSMETIC_COMMAND player={username} id=aura_crimson_halo> + <GRANT_COSMETIC_COMMAND player={username} id=chat_crimson_gradient>`
- Real command: ____________________

**BND-008: Ashen Legion**
- Delivers: 10× Ember Key; 5× Bloodmoon Key; 3,000 Throne Shards; Ashen Collapse (Death Effect); Blade Salute (Emote); Ashborn (Title)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=ember amount=10> + <GIVE_CRATE_KEY_COMMAND player={username} crate=bloodmoon amount=5> + <GIVE_SHARDS_COMMAND player={username} amount=3000> + <GRANT_COSMETIC_COMMAND player={username} id=death_ashen_collapse> + <GRANT_COSMETIC_COMMAND player={username} id=emote_blade_salute> + <GRANT_COSMETIC_COMMAND player={username} id=title_ashborn>`
- Real command: ____________________

**BND-009: Apex Predator**
- Delivers: 5× Throne Key; 5× Regalia Key; 15,000 Throne Shards; Throne Edge (Weapon Skin); Nightmare Steed (Mount Skin); Void Hatchling (Pet)
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=throne amount=5> + <GIVE_CRATE_KEY_COMMAND player={username} crate=regalia amount=5> + <GIVE_SHARDS_COMMAND player={username} amount=15000> + <GRANT_COSMETIC_COMMAND player={username} id=weapon_throne_edge> + <GRANT_COSMETIC_COMMAND player={username} id=mount_nightmare_steed> + <GRANT_COSMETIC_COMMAND player={username} id=pet_void_hatchling>`
- Real command: ____________________

**BND-010: The Overthrone**
- Delivers: Overlord rank; 10× Throne Key; 10× Regalia Key; 25,000 Throne Shards; Abyssal Flame (Aura); Throne Edge (Weapon Skin); Void Hatchling (Pet)
- Placeholder: `<SET_RANK_COMMAND player={username} rank=overlord> + <GIVE_CRATE_KEY_COMMAND player={username} crate=throne amount=10> + <GIVE_CRATE_KEY_COMMAND player={username} crate=regalia amount=10> + <GIVE_SHARDS_COMMAND player={username} amount=25000> + <GRANT_COSMETIC_COMMAND player={username} id=aura_abyssal_flame> + <GRANT_COSMETIC_COMMAND player={username} id=weapon_throne_edge> + <GRANT_COSMETIC_COMMAND player={username} id=pet_void_hatchling>`
- Real command: ____________________

**BND-011: Collector's Ascension**
- Delivers: Overlord rank; 5× Dreadforge Key; 7,500 Throne Shards; Obsidian Raven (Pet)
- Placeholder: `<SET_RANK_COMMAND player={username} rank=overlord> + <GIVE_CRATE_KEY_COMMAND player={username} crate=dreadforge amount=5> + <GIVE_SHARDS_COMMAND player={username} amount=7500> + <GRANT_COSMETIC_COMMAND player={username} id=pet_obsidian_raven>`
- Real command: ____________________

**BND-012: Champion's Rise**
- Delivers: Champion rank; 5× Abyssal Key; 3,000 Throne Shards; Throne Shatter (Kill Effect)
- Placeholder: `<SET_RANK_COMMAND player={username} rank=champion> + <GIVE_CRATE_KEY_COMMAND player={username} crate=abyssal amount=5> + <GIVE_SHARDS_COMMAND player={username} amount=3000> + <GRANT_COSMETIC_COMMAND player={username} id=kill_throne_shatter>`
- Real command: ____________________

### Cosmetics

**COS-001: Crimson Halo**
- Delivers: Crimson Halo (Aura)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=aura_crimson_halo>`
- Real command: ____________________

**COS-002: Obsidian Crown**
- Delivers: Obsidian Crown (Aura)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=aura_obsidian_crown>`
- Real command: ____________________

**COS-003: Abyssal Flame**
- Delivers: Abyssal Flame (Aura)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=aura_abyssal_flame>`
- Real command: ____________________

**COS-004: Bloodstep**
- Delivers: Bloodstep (Trail)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=trail_bloodstep>`
- Real command: ____________________

**COS-005: Ember Wake**
- Delivers: Ember Wake (Trail)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=trail_ember_wake>`
- Real command: ____________________

**COS-006: Shattered Crystal**
- Delivers: Shattered Crystal (Trail)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=trail_crystal_shard>`
- Real command: ____________________

**COS-007: Falling Ash**
- Delivers: Falling Ash (Particle)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=particle_falling_ash>`
- Real command: ____________________

**COS-008: Orbiting Runes**
- Delivers: Orbiting Runes (Particle)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=particle_orbiting_runes>`
- Real command: ____________________

**COS-009: Bloodmoon Eclipse**
- Delivers: Bloodmoon Eclipse (Kill Effect)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=kill_bloodmoon_eclipse>`
- Real command: ____________________

**COS-010: Throne Shatter**
- Delivers: Throne Shatter (Kill Effect)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=kill_throne_shatter>`
- Real command: ____________________

**COS-011: Chainbind**
- Delivers: Chainbind (Kill Effect)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=kill_chainbind>`
- Real command: ____________________

**COS-012: Soul Ascension**
- Delivers: Soul Ascension (Death Effect)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=death_soul_ascension>`
- Real command: ____________________

**COS-013: Ashen Collapse**
- Delivers: Ashen Collapse (Death Effect)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=death_ashen_collapse>`
- Real command: ____________________

**COS-014: Gatebreaker**
- Delivers: Gatebreaker (Title)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=title_gatebreaker>`
- Real command: ____________________

**COS-015: Crimson Hunter**
- Delivers: Crimson Hunter (Title)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=title_crimson_hunter>`
- Real command: ____________________

**COS-016: Ashborn**
- Delivers: Ashborn (Title)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=title_ashborn>`
- Real command: ____________________

**COS-017: Oathless**
- Delivers: Oathless (Title)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=title_oathless>`
- Real command: ____________________

**COS-018: Crimson Sigil**
- Delivers: Crimson Sigil (Chat Tag)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=tag_crimson_sigil>`
- Real command: ____________________

**COS-019: Black Crown**
- Delivers: Black Crown (Chat Tag)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=tag_black_crown>`
- Real command: ____________________

**COS-020: Nightmare Steed**
- Delivers: Nightmare Steed (Mount Skin)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=mount_nightmare_steed>`
- Real command: ____________________

**COS-021: Ashen Charger**
- Delivers: Ashen Charger (Mount Skin)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=mount_ashen_charger>`
- Real command: ____________________

**COS-022: Bloodmoon Blade**
- Delivers: Bloodmoon Blade (Weapon Skin)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=weapon_bloodmoon_blade>`
- Real command: ____________________

**COS-023: Abyssal Scythe**
- Delivers: Abyssal Scythe (Weapon Skin)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=weapon_abyssal_scythe>`
- Real command: ____________________

**COS-024: Throne Edge**
- Delivers: Throne Edge (Weapon Skin)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=weapon_throne_edge>`
- Real command: ____________________

**COS-025: Dreadforge Plate**
- Delivers: Dreadforge Plate (Armour Skin)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=armour_dreadforge_plate>`
- Real command: ____________________

**COS-026: Crimson Warden**
- Delivers: Crimson Warden (Armour Skin)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=armour_crimson_warden>`
- Real command: ____________________

**COS-027: Kneel Before the Throne**
- Delivers: Kneel Before the Throne (Emote)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=emote_kneel>`
- Real command: ____________________

**COS-028: Blade Salute**
- Delivers: Blade Salute (Emote)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=emote_blade_salute>`
- Real command: ____________________

**COS-029: Crimson Arrival**
- Delivers: Crimson Arrival (Spawn Effect)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=spawn_crimson_arrival>`
- Real command: ____________________

**COS-030: Blood Rift**
- Delivers: Blood Rift (Teleport Effect)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=tp_blood_rift>`
- Real command: ____________________

**COS-031: Shadow Step**
- Delivers: Shadow Step (Teleport Effect)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=tp_shadow_step>`
- Real command: ____________________

**COS-032: Crimson Gradient**
- Delivers: Crimson Gradient (Chat Effect)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=chat_crimson_gradient>`
- Real command: ____________________

**COS-033: Gilded Name Shimmer**
- Delivers: Gilded Name Shimmer (Chat Effect)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=chat_gilded_shimmer>`
- Real command: ____________________

### Pets

**PET-001: Ember Wisp**
- Delivers: Ember Wisp (Pet)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=pet_ember_wisp>`
- Real command: ____________________

**PET-002: Obsidian Raven**
- Delivers: Obsidian Raven (Pet)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=pet_obsidian_raven>`
- Real command: ____________________

**PET-003: Mini Gate Golem**
- Delivers: Mini Gate Golem (Pet)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=pet_gate_golem>`
- Real command: ____________________

**PET-004: Crimson Fox Spirit**
- Delivers: Crimson Fox Spirit (Pet)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=pet_crimson_fox>`
- Real command: ____________________

**PET-005: Void Hatchling**
- Delivers: Void Hatchling (Pet)
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=pet_void_hatchling>`
- Real command: ____________________

### Boosters

**BOOST-001: Global XP Boost (1 Hour)**
- Delivers: +50% vanilla XP for every online player for 1 hour
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=xp minutes=60 buyer={username}>`
- Real command: ____________________

**BOOST-002: Global XP Boost (3 Hours)**
- Delivers: +50% vanilla XP for every online player for 3 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=xp minutes=180 buyer={username}>`
- Real command: ____________________

**BOOST-003: Global XP Boost (6 Hours)**
- Delivers: +50% vanilla XP for every online player for 6 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=xp minutes=360 buyer={username}>`
- Real command: ____________________

**BOOST-004: Global XP Boost (24 Hours)**
- Delivers: +50% vanilla XP for every online player for 24 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=xp minutes=1440 buyer={username}>`
- Real command: ____________________

**BOOST-005: Global Currency Boost (1 Hour)**
- Delivers: +25% in-game currency earned by every online player for 1 hour
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=currency minutes=60 buyer={username}>`
- Real command: ____________________

**BOOST-006: Global Currency Boost (3 Hours)**
- Delivers: +25% in-game currency earned by every online player for 3 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=currency minutes=180 buyer={username}>`
- Real command: ____________________

**BOOST-007: Global Currency Boost (6 Hours)**
- Delivers: +25% in-game currency earned by every online player for 6 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=currency minutes=360 buyer={username}>`
- Real command: ____________________

**BOOST-008: Global Currency Boost (24 Hours)**
- Delivers: +25% in-game currency earned by every online player for 24 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=currency minutes=1440 buyer={username}>`
- Real command: ____________________

**BOOST-009: Global Drop Boost (1 Hour)**
- Delivers: +25% mob drops for every online player for 1 hour
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=drop minutes=60 buyer={username}>`
- Real command: ____________________

**BOOST-010: Global Drop Boost (3 Hours)**
- Delivers: +25% mob drops for every online player for 3 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=drop minutes=180 buyer={username}>`
- Real command: ____________________

**BOOST-011: Global Drop Boost (6 Hours)**
- Delivers: +25% mob drops for every online player for 6 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=drop minutes=360 buyer={username}>`
- Real command: ____________________

**BOOST-012: Global Drop Boost (24 Hours)**
- Delivers: +25% mob drops for every online player for 24 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=drop minutes=1440 buyer={username}>`
- Real command: ____________________

**BOOST-013: Global Luck Boost (1 Hour)**
- Delivers: Higher chance for everyone to find free crate keys from gameplay for 1 hour
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=luck minutes=60 buyer={username}>`
- Real command: ____________________

**BOOST-014: Global Luck Boost (3 Hours)**
- Delivers: Higher chance for everyone to find free crate keys from gameplay for 3 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=luck minutes=180 buyer={username}>`
- Real command: ____________________

**BOOST-015: Global Luck Boost (6 Hours)**
- Delivers: Higher chance for everyone to find free crate keys from gameplay for 6 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=luck minutes=360 buyer={username}>`
- Real command: ____________________

**BOOST-016: Global Luck Boost (24 Hours)**
- Delivers: Higher chance for everyone to find free crate keys from gameplay for 24 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=luck minutes=1440 buyer={username}>`
- Real command: ____________________

**BOOST-017: Global Hunter XP Boost (1 Hour)**
- Delivers: +25% Hunter Progression XP for every online player for 1 hour
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=hunter minutes=60 buyer={username}>`
- Real command: ____________________

**BOOST-018: Global Hunter XP Boost (3 Hours)**
- Delivers: +25% Hunter Progression XP for every online player for 3 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=hunter minutes=180 buyer={username}>`
- Real command: ____________________

**BOOST-019: Global Hunter XP Boost (6 Hours)**
- Delivers: +25% Hunter Progression XP for every online player for 6 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=hunter minutes=360 buyer={username}>`
- Real command: ____________________

**BOOST-020: Global Hunter XP Boost (24 Hours)**
- Delivers: +25% Hunter Progression XP for every online player for 24 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=hunter minutes=1440 buyer={username}>`
- Real command: ____________________

**BOOST-021: Global Gate Boost (1 Hour)**
- Delivers: +25% Gate and dungeon rewards for every online player for 1 hour
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=gate minutes=60 buyer={username}>`
- Real command: ____________________

**BOOST-022: Global Gate Boost (3 Hours)**
- Delivers: +25% Gate and dungeon rewards for every online player for 3 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=gate minutes=180 buyer={username}>`
- Real command: ____________________

**BOOST-023: Global Gate Boost (6 Hours)**
- Delivers: +25% Gate and dungeon rewards for every online player for 6 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=gate minutes=360 buyer={username}>`
- Real command: ____________________

**BOOST-024: Global Gate Boost (24 Hours)**
- Delivers: +25% Gate and dungeon rewards for every online player for 24 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=gate minutes=1440 buyer={username}>`
- Real command: ____________________

**BOOST-025: Global Party Boost (1 Hour)**
- Delivers: +25% bonus for every player in a party or guild for 1 hour
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=party minutes=60 buyer={username}>`
- Real command: ____________________

**BOOST-026: Global Party Boost (3 Hours)**
- Delivers: +25% bonus for every player in a party or guild for 3 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=party minutes=180 buyer={username}>`
- Real command: ____________________

**BOOST-027: Global Party Boost (6 Hours)**
- Delivers: +25% bonus for every player in a party or guild for 6 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=party minutes=360 buyer={username}>`
- Real command: ____________________

**BOOST-028: Global Party Boost (24 Hours)**
- Delivers: +25% bonus for every player in a party or guild for 24 hours
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=party minutes=1440 buyer={username}>`
- Real command: ____________________

### Starter

**START-001: First Blood**
- Delivers: Your first mark: Crimson Hunter title, 1 Ember Key and 500 Throne Shards.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=title_crimson_hunter> + <GIVE_CRATE_KEY_COMMAND player={username} crate=ember amount=1> + <GIVE_SHARDS_COMMAND player={username} amount=500>`
- Real command: ____________________

**START-002: New Hunter's Mark**
- Delivers: Ember Wake trail, Blade Salute emote and 2 Ember Keys.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=trail_ember_wake> + <GRANT_COSMETIC_COMMAND player={username} id=emote_blade_salute> + <GIVE_CRATE_KEY_COMMAND player={username} crate=ember amount=2>`
- Real command: ____________________

**START-003: Ashen Initiate Cache**
- Delivers: Falling Ash particles, 3 Ember Keys and 1,000 Throne Shards.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=particle_falling_ash> + <GIVE_CRATE_KEY_COMMAND player={username} crate=ember amount=3> + <GIVE_SHARDS_COMMAND player={username} amount=1000>`
- Real command: ____________________

**START-004: Gate Initiate Pack**
- Delivers: 1 Abyssal Key, 2 Bloodmoon Keys and the Shadow Step teleport effect.
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=abyssal amount=1> + <GIVE_CRATE_KEY_COMMAND player={username} crate=bloodmoon amount=2> + <GRANT_COSMETIC_COMMAND player={username} id=tp_shadow_step>`
- Real command: ____________________

**START-005: First Expedition**
- Delivers: Ember Wisp pet and 1,500 Throne Shards for your first journey.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=pet_ember_wisp> + <GIVE_SHARDS_COMMAND player={username} amount=1500>`
- Real command: ____________________

**START-006: Novice Wardrobe**
- Delivers: Crimson Sigil chat tag and Soul Ascension death effect.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=tag_crimson_sigil> + <GRANT_COSMETIC_COMMAND player={username} id=death_soul_ascension>`
- Real command: ____________________

**START-007: Hunter's Key Ring**
- Delivers: One key of each of the first three crates: Ember, Bloodmoon and Abyssal.
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=ember amount=1> + <GIVE_CRATE_KEY_COMMAND player={username} crate=bloodmoon amount=1> + <GIVE_CRATE_KEY_COMMAND player={username} crate=abyssal amount=1>`
- Real command: ____________________

**START-008: Rising Hunter Bundle**
- Delivers: Supporter-tier look without the rank: Crimson Halo aura, Bloodstep trail and 1,500 shards.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=aura_crimson_halo> + <GRANT_COSMETIC_COMMAND player={username} id=trail_bloodstep> + <GIVE_SHARDS_COMMAND player={username} amount=1500>`
- Real command: ____________________

**START-009: Starter Shard Pouch**
- Delivers: 1,000 Throne Shards at a one-time welcome price.
- Placeholder: `<GIVE_SHARDS_COMMAND player={username} amount=1000>`
- Real command: ____________________

**START-010: Initiate's Emote Pack**
- Delivers: Kneel Before the Throne and Blade Salute emotes.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=emote_kneel> + <GRANT_COSMETIC_COMMAND player={username} id=emote_blade_salute>`
- Real command: ____________________

### Seasonal

**EVENT-001: Bloodmoon Festival Bundle**
- Delivers: Event-exclusive Bloodmoon Reaper title, 10 Bloodmoon Keys and the Bloodmoon Eclipse kill effect.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=title_bloodmoon_reaper> + <GIVE_CRATE_KEY_COMMAND player={username} crate=bloodmoon amount=10> + <GRANT_COSMETIC_COMMAND player={username} id=kill_bloodmoon_eclipse>`
- Real command: ____________________

**EVENT-002: Bloodmoon Event Key ×5**
- Delivers: 5 Bloodmoon Event Keys for the limited Bloodmoon Event Crate (event cosmetics only).
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={username} crate=bloodmoon_event amount=5>`
- Real command: ____________________

**EVENT-003: Hallowed Gate Bundle**
- Delivers: Event-exclusive Hollow Lantern pet, Hallowed title and 5 Abyssal Keys.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=pet_hollow_lantern> + <GRANT_COSMETIC_COMMAND player={username} id=title_hallowed> + <GIVE_CRATE_KEY_COMMAND player={username} crate=abyssal amount=5>`
- Real command: ____________________

**EVENT-004: Frostbound Throne Bundle**
- Delivers: Event-exclusive Frostbound aura, Winter's Crown title and 5 Regalia Keys.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=aura_frostbound> + <GRANT_COSMETIC_COMMAND player={username} id=title_winters_crown> + <GIVE_CRATE_KEY_COMMAND player={username} crate=regalia amount=5>`
- Real command: ____________________

**EVENT-005: First Throne Anniversary Pack**
- Delivers: Anniversary title, Anniversary Sigil tag and 5,000 Throne Shards.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=title_anniversary> + <GRANT_COSMETIC_COMMAND player={username} id=tag_anniversary> + <GIVE_SHARDS_COMMAND player={username} amount=5000>`
- Real command: ____________________

**EVENT-006: Founder's Pack**
- Delivers: Launch-only Founder title, Founder chat tag, 3 Throne Keys and 5,000 Throne Shards.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=title_founder> + <GRANT_COSMETIC_COMMAND player={username} id=tag_founder> + <GIVE_CRATE_KEY_COMMAND player={username} crate=throne amount=3> + <GIVE_SHARDS_COMMAND player={username} amount=5000>`
- Real command: ____________________

**EVENT-007: New Era Pack**
- Delivers: Season-numbered title, 5 Dreadforge Keys and 2,500 Throne Shards to start the new season in style.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=title_season_n> + <GIVE_CRATE_KEY_COMMAND player={username} crate=dreadforge amount=5> + <GIVE_SHARDS_COMMAND player={username} amount=2500>`
- Real command: ____________________

**EVENT-008: Gate Outbreak Bundle**
- Delivers: For server-wide Gate Outbreak events: Outbreak title, 5 Abyssal Keys and the Blood Rift teleport effect.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=title_outbreak> + <GIVE_CRATE_KEY_COMMAND player={username} crate=abyssal amount=5> + <GRANT_COSMETIC_COMMAND player={username} id=tp_blood_rift>`
- Real command: ____________________

**EVENT-009: Lunar Eclipse Global Boost**
- Delivers: A 6-hour Global Gate Boost for everyone online during eclipse events.
- Placeholder: `<START_GLOBAL_BOOST_COMMAND type=gate minutes=360 buyer={username}>`
- Real command: ____________________

**EVENT-010: Festival of Crowns**
- Delivers: Crown-themed event cosmetics: Festival Crown aura and 3 Regalia Keys.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=aura_festival_crown> + <GIVE_CRATE_KEY_COMMAND player={username} crate=regalia amount=3>`
- Real command: ____________________

### Utility

**UTIL-001: Nickname Token (30 days)**
- Delivers: Use /nick for 30 days (staff-moderated).
- Placeholder: `<GRANT_TEMP_PERMISSION_COMMAND player={username} permission=nick duration=30d>`
- Real command: ____________________

**UTIL-002: Name Colour Token**
- Delivers: Change your name colour once from the approved palette.
- Placeholder: `<GIVE_TOKEN_COMMAND player={username} token=name_colour amount=1>`
- Real command: ____________________

**UTIL-003: Prefix Recolour Token**
- Delivers: Recolour your rank prefix once (rank holders only).
- Placeholder: `<GIVE_TOKEN_COMMAND player={username} token=prefix_colour amount=1>`
- Real command: ____________________

**UTIL-004: Queue Priority Pass (30 days)**
- Delivers: Priority login when the server is full, for 30 days. No gameplay effect.
- Placeholder: `<GRANT_TEMP_PERMISSION_COMMAND player={username} permission=queue_priority duration=30d>`
- Real command: ____________________

**UTIL-005: Guild Banner Design Slot**
- Delivers: Unlock one extra cosmetic banner design for your guild.
- Placeholder: `<GIVE_TOKEN_COMMAND player={username} token=guild_banner_slot amount=1>`
- Real command: ____________________

**UTIL-006: Wardrobe Expansion**
- Delivers: +3 cosmetic wardrobe presets to switch outfits instantly.
- Placeholder: `<GIVE_TOKEN_COMMAND player={username} token=wardrobe_slot amount=3>`
- Real command: ____________________

**UTIL-007: Chat Emoji Pack: Dark Court**
- Delivers: Unlock 12 OVERTHRONE chat emojis.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={username} id=emoji_pack_dark_court>`
- Real command: ____________________

### Gifts

**GIFT-001: Gift Rank: Supporter**
- Delivers: Gift the Supporter rank to a friend. Enter their Minecraft username at checkout.
- Placeholder: `<SET_RANK_COMMAND player={recipient} rank=supporter>`
- Real command: ____________________

**GIFT-002: Gift Key Bundle**
- Delivers: Gift 5 Bloodmoon Keys and 5 Abyssal Keys.
- Placeholder: `<GIVE_CRATE_KEY_COMMAND player={recipient} crate=bloodmoon amount=5> + <GIVE_CRATE_KEY_COMMAND player={recipient} crate=abyssal amount=5>`
- Real command: ____________________

**GIFT-003: Gift Shard Bundle**
- Delivers: Gift 5,000 Throne Shards (+10% bonus).
- Placeholder: `<GIVE_SHARDS_COMMAND player={recipient} amount=5500>`
- Real command: ____________________

**GIFT-004: Gift Cosmetic Bundle**
- Delivers: Gift Crimson Halo, Bloodstep trail and the Blood Rift teleport effect.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={recipient} id=aura_crimson_halo> + <GRANT_COSMETIC_COMMAND player={recipient} id=trail_bloodstep> + <GRANT_COSMETIC_COMMAND player={recipient} id=tp_blood_rift>`
- Real command: ____________________

**GIFT-005: Gift Starter Bundle**
- Delivers: Gift the First Blood and Hunter's Key Ring starter packs.
- Placeholder: `<GRANT_COSMETIC_COMMAND player={recipient} id=title_crimson_hunter> + <GIVE_CRATE_KEY_COMMAND player={recipient} crate=ember amount=2> + <GIVE_CRATE_KEY_COMMAND player={recipient} crate=bloodmoon amount=1> + <GIVE_CRATE_KEY_COMMAND player={recipient} crate=abyssal amount=1> + <GIVE_SHARDS_COMMAND player={recipient} amount=500>`
- Real command: ____________________

**GIFT-006: Gift Rank: Elite**
- Delivers: Gift the Elite rank to a friend.
- Placeholder: `<SET_RANK_COMMAND player={recipient} rank=elite>`
- Real command: ____________________

**GIFT-007: Gift Rank: Champion**
- Delivers: Gift the Champion rank to a friend.
- Placeholder: `<SET_RANK_COMMAND player={recipient} rank=champion>`
- Real command: ____________________

**GIFT-008: Gift Rank: Warlord**
- Delivers: Gift the Warlord rank to a friend.
- Placeholder: `<SET_RANK_COMMAND player={recipient} rank=warlord>`
- Real command: ____________________

**GIFT-009: Gift Rank: Overlord**
- Delivers: Gift the Overlord rank to a friend.
- Placeholder: `<SET_RANK_COMMAND player={recipient} rank=overlord>`
- Real command: ____________________

