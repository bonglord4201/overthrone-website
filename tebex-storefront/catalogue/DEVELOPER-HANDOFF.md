# OVERTHRONE SMP – Developer Handoff (Tebex packages)

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
- **Placeholder syntax:** `<ACTION:ARG:ARG>`. A `{recipient}` argument means "deliver to the gift recipient (Tebex Variable)". Otherwise deliver to `{username}`.

## Backend systems required

| ID | System | What it must do |
|---|---|---|
| SYS-TEBEX | Tebex plugin | Install the Tebex plugin that supports NeoForge 1.21.1 (confirm compatibility) and add the store secret key on the server only. Commands use Tebex's `{username}` placeholder. Prefer offline-safe delivery. |
| SYS-RANKS | Rank groups | 8 lifetime groups (supporter → thronebreaker), each inheriting the one below. Prefix, coloured name, chat/tab formatting. Thronebreaker has an animated crimson-gold prefix. Upgrades remove the lower group. |
| SYS-DISCORD | Discord role sync | Use Tebex's built-in **Discord Actions** deliverable to add roles @Supporter … @Thronebreaker. Requires linking the Tebex Discord bot. |
| SYS-QUEUE | Queue priority | Join-queue priority tiers 1–8 (by rank) plus a 30-day pass (UTIL). No gameplay effect. |
| SYS-CRATES | Gate Crates | 6 crates (Ember, Bloodmoon, Abyssal, Dreadforge, Regalia, Throne) plus event crates. Odds per the catalogue. Cosmetic/shard rewards only. Duplicate → shards. Odds shown in-game. Opening animation in a Crate Hall at spawn. |
| SYS-KEYS | Virtual keys | Key balances per player and crate; deliverable while offline. Free key sources in gameplay (voting, events, Gate clears, Global Luck Boost). |
| SYS-SHARDS | Throne Shards + Throne Vault | Premium currency balance per player; deliverable while offline. In-game Throne Vault GUI that sells ONLY cosmetics. Never convertible to gameplay currency or items. |
| SYS-COSMETICS | Cosmetics engine | Auras, trails, particles, kill effects, death effects, spawn effects and teleport effects. Players toggle them in a /cosmetics wardrobe. Per-player unlock storage. |
| SYS-TITLES | Titles and chat tags | Selectable titles under the name, chat tags before the name. Custom-title token (staff approval). |
| SYS-CHAT | Chat effects | Chat colours, gradients (Silver Dawn, Crimson Gradient), Gilded Name Shimmer, emoji packs. |
| SYS-PETS | Cosmetic pets | Follower pets with no combat, collision or item pickup. Summon or dismiss from the wardrobe. Custom pet names (Thronebreaker). |
| SYS-SKINS | Weapon, armour and mount skins | Resource-pack models (e.g. custom model data) that change appearance only, never stats. Applied via the wardrobe. |
| SYS-EMOTES | Emotes | Emote playback (an emote mod or equivalent). |
| SYS-BOOSTERS | Global boosters | Server-wide timed boosts (XP, currency, drops, key-find luck, Hunter XP, Gate rewards, party). Same-type boosts queue; announce the buyer; boss bar timer; effect caps. |
| SYS-TOKENS | Tokens and temporary permissions | Nick (30 days), name colour, prefix colour, wardrobe slots, guild banner slot. Temporary permissions expire automatically. |
| SYS-GIFTS | Gift delivery | Gift packages read the recipient's username from a Tebex Variable and deliver to that player instead of the buyer. |
| SYS-EVENTS | Event content | Event-only cosmetics, event crates and keys; toggled on for each event. |
| SYS-HALL | Hall of Thrones | List of Thronebreaker holders. Can be posted on the website (admin panel) and Discord. |

## Placeholder reference

| Placeholder | Meaning |
|---|---|
| `<GRANT_RANK:RANK>` | Add the player to the rank group (permanent) |
| `<GIVE_KEYS:CRATE:N>` | Give N virtual keys for the crate |
| `<GIVE_SHARDS:N>` | Add N Throne Shards |
| `<GRANT_COSMETIC:CODE>` | Unlock the cosmetic CODE (permanent) |
| `<START_GLOBAL_BOOST:TYPE:MINUTES>` | Start (or queue) a server-wide boost |
| `<GRANT_TOKEN:TYPE:N>` | Give N single-use tokens |
| `<GRANT_TEMP_PERMISSION:PERM:30d>` | Temporary permission that expires |
| Tebex Discord Action | Configured in Tebex, not a server command |

## Cosmetic codes to implement (38 catalogue + rank/event exclusives)

| Code | Name | Type | Rarity |
|---|---|---|---|
| `AURA_CRIMSON_HALO` | Crimson Halo | Aura | Epic |
| `AURA_OBSIDIAN_CROWN` | Obsidian Crown | Aura | Legendary |
| `AURA_ABYSSAL_FLAME` | Abyssal Flame | Aura | Mythic |
| `TRAIL_BLOODSTEP` | Bloodstep | Trail | Rare |
| `TRAIL_EMBER_WAKE` | Ember Wake | Trail | Common |
| `TRAIL_CRYSTAL_SHARD` | Shattered Crystal | Trail | Epic |
| `PARTICLE_FALLING_ASH` | Falling Ash | Particle | Common |
| `PARTICLE_ORBITING_RUNES` | Orbiting Runes | Particle | Rare |
| `KILL_BLOODMOON_ECLIPSE` | Bloodmoon Eclipse | Kill Effect | Legendary |
| `KILL_THRONE_SHATTER` | Throne Shatter | Kill Effect | Epic |
| `KILL_CHAINBIND` | Chainbind | Kill Effect | Rare |
| `DEATH_SOUL_ASCENSION` | Soul Ascension | Death Effect | Rare |
| `DEATH_ASHEN_COLLAPSE` | Ashen Collapse | Death Effect | Epic |
| `TITLE_GATEBREAKER` | Gatebreaker | Title | Rare |
| `TITLE_CRIMSON_HUNTER` | Crimson Hunter | Title | Common |
| `TITLE_ASHBORN` | Ashborn | Title | Epic |
| `TITLE_OATHLESS` | Oathless | Title | Legendary |
| `TAG_CRIMSON_SIGIL` | Crimson Sigil | Chat Tag | Rare |
| `TAG_BLACK_CROWN` | Black Crown | Chat Tag | Epic |
| `MOUNT_NIGHTMARE_STEED` | Nightmare Steed | Mount Skin | Legendary |
| `MOUNT_ASHEN_CHARGER` | Ashen Charger | Mount Skin | Epic |
| `WEAPON_BLOODMOON_BLADE` | Bloodmoon Blade | Weapon Skin | Epic |
| `WEAPON_ABYSSAL_SCYTHE` | Abyssal Scythe | Weapon Skin | Legendary |
| `WEAPON_THRONE_EDGE` | Throne Edge | Weapon Skin | Mythic |
| `ARMOUR_DREADFORGE_PLATE` | Dreadforge Plate | Armour Skin | Legendary |
| `ARMOUR_CRIMSON_WARDEN` | Crimson Warden | Armour Skin | Epic |
| `EMOTE_KNEEL` | Kneel Before the Throne | Emote | Rare |
| `EMOTE_BLADE_SALUTE` | Blade Salute | Emote | Common |
| `SPAWN_CRIMSON_ARRIVAL` | Crimson Arrival | Spawn Effect | Epic |
| `TP_BLOOD_RIFT` | Blood Rift | Teleport Effect | Epic |
| `TP_SHADOW_STEP` | Shadow Step | Teleport Effect | Rare |
| `CHAT_CRIMSON_GRADIENT` | Crimson Gradient | Chat Effect | Epic |
| `CHAT_GILDED_SHIMMER` | Gilded Name Shimmer | Chat Effect | Legendary |
| `PET_EMBER_WISP` | Ember Wisp | Pet | Rare |
| `PET_OBSIDIAN_RAVEN` | Obsidian Raven | Pet | Epic |
| `PET_GATE_GOLEM` | Mini Gate Golem | Pet | Legendary |
| `PET_CRIMSON_FOX` | Crimson Fox Spirit | Pet | Epic |
| `PET_VOID_HATCHLING` | Void Hatchling | Pet | Mythic |

**Also required** (exclusives referenced by ranks, crates, featured and events):
`PARTICLE_CRIMSON_SPARK`, `AURA_VIOLET_EMBER`, `KILL_BRONZE_BANNER`, `EMOTE_PACK_CHAMPION`, `TITLE_OVERLORD`, `TRAIL_GILDED_ASH`, `CHAT_SILVER_DAWN`, `PET_SOVEREIGN_RAVEN`, `AURA_FROST_CROWN`, `TP_USURPERS_RIFT`, `DEATH_CRIMSON_REQUIEM`, `KILL_CROWN_FALL`, `WEAPON_KINGSLAYERS_EDGE`, `TITLE_CUSTOM_TOKEN`, `AURA_SHATTERED_THRONE`, `ARMOUR_THRONEBREAKER_REGALIA`, `HALL_OF_THRONES_ENTRY`, `AURA_CRIMSON_ECLIPSE_LIMITED`, `TITLE_FOUNDER`, `MONTHLY_RELIC`, `SET_AEONIA_EXPLORER`, `SET_NETHERFALL_EXPLORER`, `TITLE_BLOODMOON_REAPER`, `PET_HOLLOW_LANTERN`, `TITLE_HALLOWED`, `AURA_FROSTBOUND`, `TITLE_WINTERS_CROWN`, `TITLE_ANNIVERSARY`, `TAG_ANNIVERSARY`, `TAG_FOUNDER`, `TITLE_SEASON_N`, `TITLE_OUTBREAK`, `AURA_FESTIVAL_CROWN`, `EMOJI_PACK_DARK_COURT`

Plus the crate jackpots: Ashen Halo, Bloodmoon Eclipse aura, Voidborn Wraith, Molten Throne set, Gilded Regalia set, The Empty Throne + "Throne Taker".

## Per-package delivery (182 packages)

### Featured

**FEAT-001: Crimson Eclipse Aura (Limited)** (A$14.99)
- System required: SYS-COSMETICS
- Delivery: A limited aura: a crimson eclipse forms a halo behind you. Leaves the store when the rotation ends.
- Tebex command: `<GRANT_COSMETIC:AURA_CRIMSON_ECLIPSE_LIMITED>`
- Real command: ____________________

**FEAT-002: Founder's Crown Title** (A$9.99)
- System required: SYS-COSMETICS
- Delivery: Title “Founder”, available only during the server's launch month. Never returns.
- Tebex command: `<GRANT_COSMETIC:TITLE_FOUNDER>`
- Real command: ____________________

**FEAT-003: Weekend Throne Rush** (A$39.99)
- System required: SYS-KEYS
- Delivery: 3 Throne Keys and 3 Regalia Keys at a weekend price.
- Tebex command: `<GIVE_KEYS:THRONE:3> + <GIVE_KEYS:REGALIA:3>`
- Real command: ____________________

**FEAT-004: Monthly Relic Box** (A$12.99)
- System required: SYS-SHARDS, SYS-COSMETICS
- Delivery: One cosmetic relic chosen for the month, plus 1,000 Throne Shards. The month's relic is listed in the description.
- Tebex command: `<GRANT_COSMETIC:MONTHLY_RELIC> + <GIVE_SHARDS:1000>`
- Real command: ____________________

**FEAT-005: Throne of Ash Set** (A$24.99)
- System required: SYS-COSMETICS
- Delivery: Ashborn title, Ashen Collapse death effect and Falling Ash particles in one set.
- Tebex command: `<GRANT_COSMETIC:TITLE_ASHBORN> + <GRANT_COSMETIC:DEATH_ASHEN_COLLAPSE> + <GRANT_COSMETIC:PARTICLE_FALLING_ASH>`
- Real command: ____________________

**FEAT-006: Gatekeeper's Sigil Set** (A$17.99)
- System required: SYS-COSMETICS
- Delivery: Crimson Sigil tag, Orbiting Runes and the Shadow Step teleport effect.
- Tebex command: `<GRANT_COSMETIC:TAG_CRIMSON_SIGIL> + <GRANT_COSMETIC:PARTICLE_ORBITING_RUNES> + <GRANT_COSMETIC:TP_SHADOW_STEP>`
- Real command: ____________________

**FEAT-007: Double Shard Weekend: Coffer** (A$22.99)
- System required: SYS-SHARDS
- Delivery: 5,000 Throne Shards + 5,000 bonus shards during Double Shard weekends.
- Tebex command: `<GIVE_SHARDS:10000>`
- Real command: ____________________

**FEAT-008: Crimson Fox Companion** (A$9.99)
- System required: SYS-COSMETICS
- Delivery: Spotlight price on the Crimson Fox Spirit pet.
- Tebex command: `<GRANT_COSMETIC:PET_CRIMSON_FOX>`
- Real command: ____________________

**FEAT-009: Bloodmoon Hunt Pass** (A$19.99)
- System required: SYS-KEYS, SYS-COSMETICS
- Delivery: 5 Bloodmoon Keys and the Bloodmoon Eclipse kill effect.
- Tebex command: `<GIVE_KEYS:BLOODMOON:5> + <GRANT_COSMETIC:KILL_BLOODMOON_ECLIPSE>`
- Real command: ____________________

**FEAT-010: Obsidian Monarch Set** (A$34.99)
- System required: SYS-COSMETICS
- Delivery: Obsidian Crown aura, Black Crown tag and Obsidian Raven pet.
- Tebex command: `<GRANT_COSMETIC:AURA_OBSIDIAN_CROWN> + <GRANT_COSMETIC:TAG_BLACK_CROWN> + <GRANT_COSMETIC:PET_OBSIDIAN_RAVEN>`
- Real command: ____________________

**FEAT-011: Dreadforge Spotlight Keys** (A$29.99)
- System required: SYS-KEYS
- Delivery: 5 Dreadforge Keys at a spotlight price.
- Tebex command: `<GIVE_KEYS:DREADFORGE:5>`
- Real command: ____________________

**FEAT-012: Realm Explorer Set (Aeonia)** (A$19.99)
- System required: SYS-COSMETICS
- Delivery: A divine-themed cosmetic set released with the Aeonia realm.
- Tebex command: `<GRANT_COSMETIC:SET_AEONIA_EXPLORER>`
- Real command: ____________________

**FEAT-013: Realm Explorer Set (Netherfall)** (A$19.99)
- System required: SYS-COSMETICS
- Delivery: An underworld-themed cosmetic set released with the Netherfall realm.
- Tebex command: `<GRANT_COSMETIC:SET_NETHERFALL_EXPLORER>`
- Real command: ____________________

**FEAT-014: Gate Clear Celebration Pack** (A$14.99)
- System required: SYS-KEYS, SYS-SHARDS, SYS-COSMETICS
- Delivery: 2 Abyssal Keys, 2,500 Throne Shards and the Gatebreaker title.
- Tebex command: `<GIVE_KEYS:ABYSSAL:2> + <GIVE_SHARDS:2500> + <GRANT_COSMETIC:TITLE_GATEBREAKER>`
- Real command: ____________________

**FEAT-015: Spotlight: Shattered Crystal Trail** (A$5.99)
- System required: SYS-COSMETICS
- Delivery: Spotlight price on the Shattered Crystal trail.
- Tebex command: `<GRANT_COSMETIC:TRAIL_CRYSTAL_SHARD>`
- Real command: ____________________

### Ranks

**RANK-001: Supporter Rank** (A$9.99)
- System required: SYS-RANKS, SYS-KEYS, SYS-SHARDS, SYS-COSMETICS, SYS-QUEUE, SYS-DISCORD
- Delivery: [SUPPORTER] prefix and crimson name in chat and tab; @Supporter Discord role; Exclusive particle: Crimson Spark; 2× Ember Keys and 500 Throne Shards (one-time); Queue priority: tier 1; Supporter chat emoji pack
- Tebex command: `<GRANT_RANK:SUPPORTER> + <GIVE_KEYS:EMBER:2> + <GIVE_SHARDS:500> + <GRANT_COSMETIC:PARTICLE_CRIMSON_SPARK> + Tebex Discord Action: add role @Supporter`
- Real command: ____________________

**RANK-002: Elite Rank** (A$19.99)
- System required: SYS-RANKS, SYS-KEYS, SYS-SHARDS, SYS-COSMETICS, SYS-QUEUE, SYS-DISCORD
- Delivery: Everything in Supporter; [ELITE] prefix; @Elite Discord role; /chatcolor with 4 approved colours; Exclusive aura: Violet Ember Aura; 3× Bloodmoon Keys and 1,000 Throne Shards (one-time); 1 extra cosmetic wardrobe preset; Queue priority: tier 2
- Tebex command: `<GRANT_RANK:ELITE> + <GIVE_KEYS:BLOODMOON:3> + <GIVE_SHARDS:1000> + <GRANT_COSMETIC:AURA_VIOLET_EMBER> + Tebex Discord Action: add role @Elite`
- Real command: ____________________

**RANK-003: Champion Rank** (A$34.99)
- System required: SYS-RANKS, SYS-KEYS, SYS-SHARDS, SYS-COSMETICS, SYS-QUEUE, SYS-DISCORD
- Delivery: Everything in Elite; [CHAMPION] prefix; @Champion Discord role; Custom join message (staff-approved); /hat (cosmetic head slot); Emote pack: Champion Salutes; Exclusive kill effect: Bronze Banner; 3× Abyssal Keys and 2,000 Throne Shards (one-time); Queue priority: tier 3
- Tebex command: `<GRANT_RANK:CHAMPION> + <GIVE_KEYS:ABYSSAL:3> + <GIVE_SHARDS:2000> + <GRANT_COSMETIC:KILL_BRONZE_BANNER> + <GRANT_COSMETIC:EMOTE_PACK_CHAMPION> + Tebex Discord Action: add role @Champion`
- Real command: ____________________

**RANK-004: Overlord Rank** (A$49.99)
- System required: SYS-RANKS, SYS-KEYS, SYS-SHARDS, SYS-COSMETICS, SYS-QUEUE, SYS-DISCORD
- Delivery: Everything in Champion; [OVERLORD] prefix; @Overlord Discord role; /nick (staff-moderated nicknames); Exclusive title: the Overlord; Exclusive trail: Gilded Ash Trail; 3× Dreadforge Keys and 3,500 Throne Shards (one-time); Queue priority: tier 4
- Tebex command: `<GRANT_RANK:OVERLORD> + <GIVE_KEYS:DREADFORGE:3> + <GIVE_SHARDS:3500> + <GRANT_COSMETIC:TITLE_OVERLORD> + <GRANT_COSMETIC:TRAIL_GILDED_ASH> + Tebex Discord Action: add role @Overlord`
- Real command: ____________________

**RANK-005: Sovereign Rank** (A$74.99)
- System required: SYS-RANKS, SYS-KEYS, SYS-SHARDS, SYS-COSMETICS, SYS-QUEUE, SYS-DISCORD
- Delivery: Everything in Overlord; [SOVEREIGN] prefix; @Sovereign Discord role; Gradient chat colour: Silver Dawn; Exclusive pet: Sovereign Raven; Exclusive aura: Frost Crown Aura; 3× Regalia Keys and 5,000 Throne Shards (one-time); Queue priority: tier 5
- Tebex command: `<GRANT_RANK:SOVEREIGN> + <GIVE_KEYS:REGALIA:3> + <GIVE_SHARDS:5000> + <GRANT_COSMETIC:CHAT_SILVER_DAWN> + <GRANT_COSMETIC:PET_SOVEREIGN_RAVEN> + <GRANT_COSMETIC:AURA_FROST_CROWN> + Tebex Discord Action: add role @Sovereign`
- Real command: ____________________

**RANK-006: Usurper Rank** (A$99.99)
- System required: SYS-RANKS, SYS-KEYS, SYS-SHARDS, SYS-COSMETICS, SYS-QUEUE, SYS-DISCORD
- Delivery: Everything in Sovereign; [USURPER] prefix; @Usurper Discord role; Server-wide join announcement; Exclusive teleport effect: Usurper's Rift; Exclusive death effect: Crimson Requiem; 2× Throne Keys, 3× Regalia Keys and 7,500 Throne Shards (one-time); Queue priority: tier 6
- Tebex command: `<GRANT_RANK:USURPER> + <GIVE_KEYS:THRONE:2> + <GIVE_KEYS:REGALIA:3> + <GIVE_SHARDS:7500> + <GRANT_COSMETIC:TP_USURPERS_RIFT> + <GRANT_COSMETIC:DEATH_CRIMSON_REQUIEM> + Tebex Discord Action: add role @Usurper`
- Real command: ____________________

**RANK-007: Kingslayer Rank** (A$149.99)
- System required: SYS-RANKS, SYS-KEYS, SYS-SHARDS, SYS-COSMETICS, SYS-QUEUE, SYS-DISCORD
- Delivery: Everything in Usurper; [KINGSLAYER] prefix; @Kingslayer Discord role; Exclusive kill effect: Crown Fall; Exclusive weapon skin: Kingslayer's Edge; One custom title (staff-approved); 3× Throne Keys and 10,000 Throne Shards (one-time); Queue priority: tier 7
- Tebex command: `<GRANT_RANK:KINGSLAYER> + <GIVE_KEYS:THRONE:3> + <GIVE_SHARDS:10000> + <GRANT_COSMETIC:KILL_CROWN_FALL> + <GRANT_COSMETIC:WEAPON_KINGSLAYERS_EDGE> + <GRANT_COSMETIC:TITLE_CUSTOM_TOKEN> + Tebex Discord Action: add role @Kingslayer`
- Real command: ____________________

**RANK-008: Thronebreaker Rank** (A$249.99)
- System required: SYS-RANKS, SYS-KEYS, SYS-SHARDS, SYS-COSMETICS, SYS-QUEUE, SYS-DISCORD
- Delivery: Everything in Kingslayer; [THRONEBREAKER] animated crimson-gold prefix; @Thronebreaker Discord role; Mythic aura: Shattered Throne; Exclusive armour skin set: Thronebreaker Regalia; Name in the Hall of Thrones (website and Discord); 5× Throne Keys and 15,000 Throne Shards (one-time); Queue priority: tier 8 (highest)
- Tebex command: `<GRANT_RANK:THRONEBREAKER> + <GIVE_KEYS:THRONE:5> + <GIVE_SHARDS:15000> + <GRANT_COSMETIC:AURA_SHATTERED_THRONE> + <GRANT_COSMETIC:ARMOUR_THRONEBREAKER_REGALIA> + <GRANT_COSMETIC:HALL_OF_THRONES_ENTRY> + Tebex Discord Action: add role @Thronebreaker`
- Real command: ____________________

### Crate Keys

**KEY-001: Ember Key ×1** (A$1.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 1× Ember Key for the Ember Crate
- Tebex command: `<GIVE_KEYS:EMBER:1>`
- Real command: ____________________

**KEY-002: Ember Key ×5** (A$8.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 5× Ember Key for the Ember Crate (10% bulk saving)
- Tebex command: `<GIVE_KEYS:EMBER:5>`
- Real command: ____________________

**KEY-003: Ember Key ×10** (A$16.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 10× Ember Key for the Ember Crate (15% bulk saving)
- Tebex command: `<GIVE_KEYS:EMBER:10>`
- Real command: ____________________

**KEY-004: Ember Key ×25** (A$39.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 25× Ember Key for the Ember Crate (20% bulk saving)
- Tebex command: `<GIVE_KEYS:EMBER:25>`
- Real command: ____________________

**KEY-005: Ember Key ×50** (A$74.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 50× Ember Key for the Ember Crate (25% bulk saving)
- Tebex command: `<GIVE_KEYS:EMBER:50>`
- Real command: ____________________

**KEY-006: Ember Key ×100** (A$139.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 100× Ember Key for the Ember Crate (30% bulk saving)
- Tebex command: `<GIVE_KEYS:EMBER:100>`
- Real command: ____________________

**KEY-007: Bloodmoon Key ×1** (A$3.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 1× Bloodmoon Key for the Bloodmoon Crate
- Tebex command: `<GIVE_KEYS:BLOODMOON:1>`
- Real command: ____________________

**KEY-008: Bloodmoon Key ×5** (A$15.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 5× Bloodmoon Key for the Bloodmoon Crate (10% bulk saving)
- Tebex command: `<GIVE_KEYS:BLOODMOON:5>`
- Real command: ____________________

**KEY-009: Bloodmoon Key ×10** (A$29.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 10× Bloodmoon Key for the Bloodmoon Crate (15% bulk saving)
- Tebex command: `<GIVE_KEYS:BLOODMOON:10>`
- Real command: ____________________

**KEY-010: Bloodmoon Key ×25** (A$69.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 25× Bloodmoon Key for the Bloodmoon Crate (20% bulk saving)
- Tebex command: `<GIVE_KEYS:BLOODMOON:25>`
- Real command: ____________________

**KEY-011: Bloodmoon Key ×50** (A$130.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 50× Bloodmoon Key for the Bloodmoon Crate (25% bulk saving)
- Tebex command: `<GIVE_KEYS:BLOODMOON:50>`
- Real command: ____________________

**KEY-012: Bloodmoon Key ×100** (A$244.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 100× Bloodmoon Key for the Bloodmoon Crate (30% bulk saving)
- Tebex command: `<GIVE_KEYS:BLOODMOON:100>`
- Real command: ____________________

**KEY-013: Abyssal Key ×1** (A$4.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 1× Abyssal Key for the Abyssal Crate
- Tebex command: `<GIVE_KEYS:ABYSSAL:1>`
- Real command: ____________________

**KEY-014: Abyssal Key ×5** (A$22.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 5× Abyssal Key for the Abyssal Crate (10% bulk saving)
- Tebex command: `<GIVE_KEYS:ABYSSAL:5>`
- Real command: ____________________

**KEY-015: Abyssal Key ×10** (A$42.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 10× Abyssal Key for the Abyssal Crate (15% bulk saving)
- Tebex command: `<GIVE_KEYS:ABYSSAL:10>`
- Real command: ____________________

**KEY-016: Abyssal Key ×25** (A$99.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 25× Abyssal Key for the Abyssal Crate (20% bulk saving)
- Tebex command: `<GIVE_KEYS:ABYSSAL:25>`
- Real command: ____________________

**KEY-017: Abyssal Key ×50** (A$187.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 50× Abyssal Key for the Abyssal Crate (25% bulk saving)
- Tebex command: `<GIVE_KEYS:ABYSSAL:50>`
- Real command: ____________________

**KEY-018: Abyssal Key ×100** (A$349.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 100× Abyssal Key for the Abyssal Crate (30% bulk saving)
- Tebex command: `<GIVE_KEYS:ABYSSAL:100>`
- Real command: ____________________

**KEY-019: Dreadforge Key ×1** (A$6.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 1× Dreadforge Key for the Dreadforge Crate
- Tebex command: `<GIVE_KEYS:DREADFORGE:1>`
- Real command: ____________________

**KEY-020: Dreadforge Key ×5** (A$31.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 5× Dreadforge Key for the Dreadforge Crate (10% bulk saving)
- Tebex command: `<GIVE_KEYS:DREADFORGE:5>`
- Real command: ____________________

**KEY-021: Dreadforge Key ×10** (A$59.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 10× Dreadforge Key for the Dreadforge Crate (15% bulk saving)
- Tebex command: `<GIVE_KEYS:DREADFORGE:10>`
- Real command: ____________________

**KEY-022: Dreadforge Key ×25** (A$139.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 25× Dreadforge Key for the Dreadforge Crate (20% bulk saving)
- Tebex command: `<GIVE_KEYS:DREADFORGE:25>`
- Real command: ____________________

**KEY-023: Dreadforge Key ×50** (A$262.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 50× Dreadforge Key for the Dreadforge Crate (25% bulk saving)
- Tebex command: `<GIVE_KEYS:DREADFORGE:50>`
- Real command: ____________________

**KEY-024: Dreadforge Key ×100** (A$489.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 100× Dreadforge Key for the Dreadforge Crate (30% bulk saving)
- Tebex command: `<GIVE_KEYS:DREADFORGE:100>`
- Real command: ____________________

**KEY-025: Regalia Key ×1** (A$9.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 1× Regalia Key for the Regalia Crate
- Tebex command: `<GIVE_KEYS:REGALIA:1>`
- Real command: ____________________

**KEY-026: Regalia Key ×5** (A$44.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 5× Regalia Key for the Regalia Crate (10% bulk saving)
- Tebex command: `<GIVE_KEYS:REGALIA:5>`
- Real command: ____________________

**KEY-027: Regalia Key ×10** (A$84.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 10× Regalia Key for the Regalia Crate (15% bulk saving)
- Tebex command: `<GIVE_KEYS:REGALIA:10>`
- Real command: ____________________

**KEY-028: Regalia Key ×25** (A$199.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 25× Regalia Key for the Regalia Crate (20% bulk saving)
- Tebex command: `<GIVE_KEYS:REGALIA:25>`
- Real command: ____________________

**KEY-029: Regalia Key ×50** (A$374.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 50× Regalia Key for the Regalia Crate (25% bulk saving)
- Tebex command: `<GIVE_KEYS:REGALIA:50>`
- Real command: ____________________

**KEY-030: Regalia Key ×100** (A$699.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 100× Regalia Key for the Regalia Crate (30% bulk saving)
- Tebex command: `<GIVE_KEYS:REGALIA:100>`
- Real command: ____________________

**KEY-031: Throne Key ×1** (A$14.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 1× Throne Key for the Throne Crate
- Tebex command: `<GIVE_KEYS:THRONE:1>`
- Real command: ____________________

**KEY-032: Throne Key ×5** (A$67.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 5× Throne Key for the Throne Crate (10% bulk saving)
- Tebex command: `<GIVE_KEYS:THRONE:5>`
- Real command: ____________________

**KEY-033: Throne Key ×10** (A$127.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 10× Throne Key for the Throne Crate (15% bulk saving)
- Tebex command: `<GIVE_KEYS:THRONE:10>`
- Real command: ____________________

**KEY-034: Throne Key ×25** (A$299.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 25× Throne Key for the Throne Crate (20% bulk saving)
- Tebex command: `<GIVE_KEYS:THRONE:25>`
- Real command: ____________________

**KEY-035: Throne Key ×50** (A$562.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 50× Throne Key for the Throne Crate (25% bulk saving)
- Tebex command: `<GIVE_KEYS:THRONE:50>`
- Real command: ____________________

**KEY-036: Throne Key ×100** (A$1049.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 100× Throne Key for the Throne Crate (30% bulk saving)
- Tebex command: `<GIVE_KEYS:THRONE:100>`
- Real command: ____________________

**KEY-037: Gate Key Sampler** (A$29.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 1× Ember Key; 1× Bloodmoon Key; 1× Abyssal Key; 1× Dreadforge Key; 1× Regalia Key; 1× Throne Key
- Tebex command: `<GIVE_KEYS:EMBER:1> + <GIVE_KEYS:BLOODMOON:1> + <GIVE_KEYS:ABYSSAL:1> + <GIVE_KEYS:DREADFORGE:1> + <GIVE_KEYS:REGALIA:1> + <GIVE_KEYS:THRONE:1>`
- Real command: ____________________

**KEY-038: Lower Gates Key Cache** (A$24.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 5× Ember Key; 3× Bloodmoon Key; 2× Abyssal Key
- Tebex command: `<GIVE_KEYS:EMBER:5> + <GIVE_KEYS:BLOODMOON:3> + <GIVE_KEYS:ABYSSAL:2>`
- Real command: ____________________

**KEY-039: High Gates Key Vault** (A$89.99)
- System required: SYS-CRATES, SYS-KEYS
- Delivery: 3× Dreadforge Key; 3× Regalia Key; 3× Throne Key
- Tebex command: `<GIVE_KEYS:DREADFORGE:3> + <GIVE_KEYS:REGALIA:3> + <GIVE_KEYS:THRONE:3>`
- Real command: ____________________

### Throne Shards

**SHARD-001: Shard Pouch: 1,000 Throne Shards** (A$4.99)
- System required: SYS-SHARDS
- Delivery: 1,000 Throne Shards
- Tebex command: `<GIVE_SHARDS:1000>`
- Real command: ____________________

**SHARD-002: Shard Satchel: 2,500 Throne Shards** (A$11.99)
- System required: SYS-SHARDS
- Delivery: 2,500 Throne Shards + 5% bonus (125) = 2,625
- Tebex command: `<GIVE_SHARDS:2625>`
- Real command: ____________________

**SHARD-003: Shard Coffer: 5,000 Throne Shards** (A$22.99)
- System required: SYS-SHARDS
- Delivery: 5,000 Throne Shards + 10% bonus (500) = 5,500
- Tebex command: `<GIVE_SHARDS:5500>`
- Real command: ____________________

**SHARD-004: Shard Chest: 10,000 Throne Shards** (A$44.99)
- System required: SYS-SHARDS
- Delivery: 10,000 Throne Shards + 15% bonus (1,500) = 11,500
- Tebex command: `<GIVE_SHARDS:11500>`
- Real command: ____________________

**SHARD-005: Shard Vault: 25,000 Throne Shards** (A$104.99)
- System required: SYS-SHARDS
- Delivery: 25,000 Throne Shards + 20% bonus (5,000) = 30,000
- Tebex command: `<GIVE_SHARDS:30000>`
- Real command: ____________________

**SHARD-006: Shard Hoard: 50,000 Throne Shards** (A$199.99)
- System required: SYS-SHARDS
- Delivery: 50,000 Throne Shards + 25% bonus (12,500) = 62,500
- Tebex command: `<GIVE_SHARDS:62500>`
- Real command: ____________________

**SHARD-007: Throne Treasury: 100,000 Throne Shards** (A$379.99)
- System required: SYS-SHARDS
- Delivery: 100,000 Throne Shards + 30% bonus (30,000) = 130,000
- Tebex command: `<GIVE_SHARDS:130000>`
- Real command: ____________________

### Bundles

**BND-001: Hunter's Oath** (A$21.99)
- System required: SYS-KEYS, SYS-SHARDS, SYS-COSMETICS
- Delivery: 5× Ember Key; 2× Bloodmoon Key; 2,500 Throne Shards; Crimson Hunter (Title); Ember Wake (Trail)
- Tebex command: `<GIVE_KEYS:EMBER:5> + <GIVE_KEYS:BLOODMOON:2> + <GIVE_SHARDS:2500> + <GRANT_COSMETIC:TITLE_CRIMSON_HUNTER> + <GRANT_COSMETIC:TRAIL_EMBER_WAKE>`
- Real command: ____________________

**BND-002: Gatebreaker's Cache** (A$38.99)
- System required: SYS-KEYS, SYS-SHARDS, SYS-COSMETICS
- Delivery: 5× Abyssal Key; 5,000 Throne Shards; Gatebreaker (Title); Blood Rift (Teleport Effect)
- Tebex command: `<GIVE_KEYS:ABYSSAL:5> + <GIVE_SHARDS:5000> + <GRANT_COSMETIC:TITLE_GATEBREAKER> + <GRANT_COSMETIC:TP_BLOOD_RIFT>`
- Real command: ____________________

**BND-003: Bloodmoon Covenant** (A$45.99)
- System required: SYS-KEYS, SYS-SHARDS, SYS-COSMETICS
- Delivery: 10× Bloodmoon Key; 5,000 Throne Shards; Bloodstep (Trail); Bloodmoon Blade (Weapon Skin)
- Tebex command: `<GIVE_KEYS:BLOODMOON:10> + <GIVE_SHARDS:5000> + <GRANT_COSMETIC:TRAIL_BLOODSTEP> + <GRANT_COSMETIC:WEAPON_BLOODMOON_BLADE>`
- Real command: ____________________

**BND-004: Abyss Walker** (A$74.99)
- System required: SYS-KEYS, SYS-SHARDS, SYS-COSMETICS
- Delivery: 10× Abyssal Key; 7,500 Throne Shards; Abyssal Scythe (Weapon Skin); Abyssal Flame (Aura)
- Tebex command: `<GIVE_KEYS:ABYSSAL:10> + <GIVE_SHARDS:7500> + <GRANT_COSMETIC:WEAPON_ABYSSAL_SCYTHE> + <GRANT_COSMETIC:AURA_ABYSSAL_FLAME>`
- Real command: ____________________

**BND-005: Dreadforge Arsenal** (A$79.99)
- System required: SYS-KEYS, SYS-SHARDS, SYS-COSMETICS
- Delivery: 10× Dreadforge Key; 7,500 Throne Shards; Dreadforge Plate (Armour Skin); Ashen Charger (Mount Skin)
- Tebex command: `<GIVE_KEYS:DREADFORGE:10> + <GIVE_SHARDS:7500> + <GRANT_COSMETIC:ARMOUR_DREADFORGE_PLATE> + <GRANT_COSMETIC:MOUNT_ASHEN_CHARGER>`
- Real command: ____________________

**BND-006: Regalia Trove** (A$108.99)
- System required: SYS-KEYS, SYS-SHARDS, SYS-COSMETICS
- Delivery: 10× Regalia Key; 10,000 Throne Shards; Gilded Name Shimmer (Chat Effect); Obsidian Crown (Aura)
- Tebex command: `<GIVE_KEYS:REGALIA:10> + <GIVE_SHARDS:10000> + <GRANT_COSMETIC:CHAT_GILDED_SHIMMER> + <GRANT_COSMETIC:AURA_OBSIDIAN_CROWN>`
- Real command: ____________________

**BND-007: Crimson Court** (A$41.99)
- System required: SYS-KEYS, SYS-SHARDS, SYS-COSMETICS
- Delivery: 5× Bloodmoon Key; 5,000 Throne Shards; Crimson Warden (Armour Skin); Crimson Halo (Aura); Crimson Gradient (Chat Effect)
- Tebex command: `<GIVE_KEYS:BLOODMOON:5> + <GIVE_SHARDS:5000> + <GRANT_COSMETIC:ARMOUR_CRIMSON_WARDEN> + <GRANT_COSMETIC:AURA_CRIMSON_HALO> + <GRANT_COSMETIC:CHAT_CRIMSON_GRADIENT>`
- Real command: ____________________

**BND-008: Ashen Legion** (A$44.99)
- System required: SYS-KEYS, SYS-SHARDS, SYS-COSMETICS
- Delivery: 10× Ember Key; 5× Bloodmoon Key; 3,000 Throne Shards; Ashen Collapse (Death Effect); Blade Salute (Emote); Ashborn (Title)
- Tebex command: `<GIVE_KEYS:EMBER:10> + <GIVE_KEYS:BLOODMOON:5> + <GIVE_SHARDS:3000> + <GRANT_COSMETIC:DEATH_ASHEN_COLLAPSE> + <GRANT_COSMETIC:EMOTE_BLADE_SALUTE> + <GRANT_COSMETIC:TITLE_ASHBORN>`
- Real command: ____________________

**BND-009: Apex Predator** (A$156.99)
- System required: SYS-KEYS, SYS-SHARDS, SYS-COSMETICS
- Delivery: 5× Throne Key; 5× Regalia Key; 15,000 Throne Shards; Throne Edge (Weapon Skin); Nightmare Steed (Mount Skin); Void Hatchling (Pet)
- Tebex command: `<GIVE_KEYS:THRONE:5> + <GIVE_KEYS:REGALIA:5> + <GIVE_SHARDS:15000> + <GRANT_COSMETIC:WEAPON_THRONE_EDGE> + <GRANT_COSMETIC:MOUNT_NIGHTMARE_STEED> + <GRANT_COSMETIC:PET_VOID_HATCHLING>`
- Real command: ____________________

**BND-010: The Overthrone** (A$424.99)
- System required: SYS-RANKS, SYS-KEYS, SYS-SHARDS, SYS-COSMETICS
- Delivery: Thronebreaker rank; 10× Throne Key; 10× Regalia Key; 25,000 Throne Shards; Abyssal Flame (Aura); Throne Edge (Weapon Skin); Void Hatchling (Pet)
- Tebex command: `<GRANT_RANK:THRONEBREAKER> + <GIVE_KEYS:THRONE:10> + <GIVE_KEYS:REGALIA:10> + <GIVE_SHARDS:25000> + <GRANT_COSMETIC:AURA_ABYSSAL_FLAME> + <GRANT_COSMETIC:WEAPON_THRONE_EDGE> + <GRANT_COSMETIC:PET_VOID_HATCHLING>`
- Real command: ____________________

**BND-011: Collector's Ascension** (A$80.99)
- System required: SYS-RANKS, SYS-KEYS, SYS-SHARDS, SYS-COSMETICS
- Delivery: Overlord rank; 5× Dreadforge Key; 7,500 Throne Shards; Obsidian Raven (Pet)
- Tebex command: `<GRANT_RANK:OVERLORD> + <GIVE_KEYS:DREADFORGE:5> + <GIVE_SHARDS:7500> + <GRANT_COSMETIC:PET_OBSIDIAN_RAVEN>`
- Real command: ____________________

**BND-012: Champion's Rise** (A$51.99)
- System required: SYS-RANKS, SYS-KEYS, SYS-SHARDS, SYS-COSMETICS
- Delivery: Champion rank; 5× Abyssal Key; 3,000 Throne Shards; Throne Shatter (Kill Effect)
- Tebex command: `<GRANT_RANK:CHAMPION> + <GIVE_KEYS:ABYSSAL:5> + <GIVE_SHARDS:3000> + <GRANT_COSMETIC:KILL_THRONE_SHATTER>`
- Real command: ____________________

### Cosmetics

**COS-001: Crimson Halo** (A$7.99)
- System required: SYS-COSMETICS
- Delivery: Crimson Halo (Aura)
- Tebex command: `<GRANT_COSMETIC:AURA_CRIMSON_HALO>`
- Real command: ____________________

**COS-002: Obsidian Crown** (A$12.99)
- System required: SYS-COSMETICS
- Delivery: Obsidian Crown (Aura)
- Tebex command: `<GRANT_COSMETIC:AURA_OBSIDIAN_CROWN>`
- Real command: ____________________

**COS-003: Abyssal Flame** (A$19.99)
- System required: SYS-COSMETICS
- Delivery: Abyssal Flame (Aura)
- Tebex command: `<GRANT_COSMETIC:AURA_ABYSSAL_FLAME>`
- Real command: ____________________

**COS-004: Bloodstep** (A$4.99)
- System required: SYS-COSMETICS
- Delivery: Bloodstep (Trail)
- Tebex command: `<GRANT_COSMETIC:TRAIL_BLOODSTEP>`
- Real command: ____________________

**COS-005: Ember Wake** (A$2.99)
- System required: SYS-COSMETICS
- Delivery: Ember Wake (Trail)
- Tebex command: `<GRANT_COSMETIC:TRAIL_EMBER_WAKE>`
- Real command: ____________________

**COS-006: Shattered Crystal** (A$7.99)
- System required: SYS-COSMETICS
- Delivery: Shattered Crystal (Trail)
- Tebex command: `<GRANT_COSMETIC:TRAIL_CRYSTAL_SHARD>`
- Real command: ____________________

**COS-007: Falling Ash** (A$2.99)
- System required: SYS-COSMETICS
- Delivery: Falling Ash (Particle)
- Tebex command: `<GRANT_COSMETIC:PARTICLE_FALLING_ASH>`
- Real command: ____________________

**COS-008: Orbiting Runes** (A$4.99)
- System required: SYS-COSMETICS
- Delivery: Orbiting Runes (Particle)
- Tebex command: `<GRANT_COSMETIC:PARTICLE_ORBITING_RUNES>`
- Real command: ____________________

**COS-009: Bloodmoon Eclipse** (A$12.99)
- System required: SYS-COSMETICS
- Delivery: Bloodmoon Eclipse (Kill Effect)
- Tebex command: `<GRANT_COSMETIC:KILL_BLOODMOON_ECLIPSE>`
- Real command: ____________________

**COS-010: Throne Shatter** (A$7.99)
- System required: SYS-COSMETICS
- Delivery: Throne Shatter (Kill Effect)
- Tebex command: `<GRANT_COSMETIC:KILL_THRONE_SHATTER>`
- Real command: ____________________

**COS-011: Chainbind** (A$4.99)
- System required: SYS-COSMETICS
- Delivery: Chainbind (Kill Effect)
- Tebex command: `<GRANT_COSMETIC:KILL_CHAINBIND>`
- Real command: ____________________

**COS-012: Soul Ascension** (A$4.99)
- System required: SYS-COSMETICS
- Delivery: Soul Ascension (Death Effect)
- Tebex command: `<GRANT_COSMETIC:DEATH_SOUL_ASCENSION>`
- Real command: ____________________

**COS-013: Ashen Collapse** (A$7.99)
- System required: SYS-COSMETICS
- Delivery: Ashen Collapse (Death Effect)
- Tebex command: `<GRANT_COSMETIC:DEATH_ASHEN_COLLAPSE>`
- Real command: ____________________

**COS-014: Gatebreaker** (A$4.99)
- System required: SYS-TITLES
- Delivery: Gatebreaker (Title)
- Tebex command: `<GRANT_COSMETIC:TITLE_GATEBREAKER>`
- Real command: ____________________

**COS-015: Crimson Hunter** (A$2.99)
- System required: SYS-TITLES
- Delivery: Crimson Hunter (Title)
- Tebex command: `<GRANT_COSMETIC:TITLE_CRIMSON_HUNTER>`
- Real command: ____________________

**COS-016: Ashborn** (A$7.99)
- System required: SYS-TITLES
- Delivery: Ashborn (Title)
- Tebex command: `<GRANT_COSMETIC:TITLE_ASHBORN>`
- Real command: ____________________

**COS-017: Oathless** (A$12.99)
- System required: SYS-TITLES
- Delivery: Oathless (Title)
- Tebex command: `<GRANT_COSMETIC:TITLE_OATHLESS>`
- Real command: ____________________

**COS-018: Crimson Sigil** (A$4.99)
- System required: SYS-TITLES
- Delivery: Crimson Sigil (Chat Tag)
- Tebex command: `<GRANT_COSMETIC:TAG_CRIMSON_SIGIL>`
- Real command: ____________________

**COS-019: Black Crown** (A$7.99)
- System required: SYS-TITLES
- Delivery: Black Crown (Chat Tag)
- Tebex command: `<GRANT_COSMETIC:TAG_BLACK_CROWN>`
- Real command: ____________________

**COS-020: Nightmare Steed** (A$12.99)
- System required: SYS-SKINS
- Delivery: Nightmare Steed (Mount Skin)
- Tebex command: `<GRANT_COSMETIC:MOUNT_NIGHTMARE_STEED>`
- Real command: ____________________

**COS-021: Ashen Charger** (A$7.99)
- System required: SYS-SKINS
- Delivery: Ashen Charger (Mount Skin)
- Tebex command: `<GRANT_COSMETIC:MOUNT_ASHEN_CHARGER>`
- Real command: ____________________

**COS-022: Bloodmoon Blade** (A$7.99)
- System required: SYS-SKINS
- Delivery: Bloodmoon Blade (Weapon Skin)
- Tebex command: `<GRANT_COSMETIC:WEAPON_BLOODMOON_BLADE>`
- Real command: ____________________

**COS-023: Abyssal Scythe** (A$12.99)
- System required: SYS-SKINS
- Delivery: Abyssal Scythe (Weapon Skin)
- Tebex command: `<GRANT_COSMETIC:WEAPON_ABYSSAL_SCYTHE>`
- Real command: ____________________

**COS-024: Throne Edge** (A$19.99)
- System required: SYS-SKINS
- Delivery: Throne Edge (Weapon Skin)
- Tebex command: `<GRANT_COSMETIC:WEAPON_THRONE_EDGE>`
- Real command: ____________________

**COS-025: Dreadforge Plate** (A$12.99)
- System required: SYS-SKINS
- Delivery: Dreadforge Plate (Armour Skin)
- Tebex command: `<GRANT_COSMETIC:ARMOUR_DREADFORGE_PLATE>`
- Real command: ____________________

**COS-026: Crimson Warden** (A$7.99)
- System required: SYS-SKINS
- Delivery: Crimson Warden (Armour Skin)
- Tebex command: `<GRANT_COSMETIC:ARMOUR_CRIMSON_WARDEN>`
- Real command: ____________________

**COS-027: Kneel Before the Throne** (A$4.99)
- System required: SYS-EMOTES
- Delivery: Kneel Before the Throne (Emote)
- Tebex command: `<GRANT_COSMETIC:EMOTE_KNEEL>`
- Real command: ____________________

**COS-028: Blade Salute** (A$2.99)
- System required: SYS-EMOTES
- Delivery: Blade Salute (Emote)
- Tebex command: `<GRANT_COSMETIC:EMOTE_BLADE_SALUTE>`
- Real command: ____________________

**COS-029: Crimson Arrival** (A$7.99)
- System required: SYS-COSMETICS
- Delivery: Crimson Arrival (Spawn Effect)
- Tebex command: `<GRANT_COSMETIC:SPAWN_CRIMSON_ARRIVAL>`
- Real command: ____________________

**COS-030: Blood Rift** (A$7.99)
- System required: SYS-COSMETICS
- Delivery: Blood Rift (Teleport Effect)
- Tebex command: `<GRANT_COSMETIC:TP_BLOOD_RIFT>`
- Real command: ____________________

**COS-031: Shadow Step** (A$4.99)
- System required: SYS-COSMETICS
- Delivery: Shadow Step (Teleport Effect)
- Tebex command: `<GRANT_COSMETIC:TP_SHADOW_STEP>`
- Real command: ____________________

**COS-032: Crimson Gradient** (A$7.99)
- System required: SYS-CHAT
- Delivery: Crimson Gradient (Chat Effect)
- Tebex command: `<GRANT_COSMETIC:CHAT_CRIMSON_GRADIENT>`
- Real command: ____________________

**COS-033: Gilded Name Shimmer** (A$12.99)
- System required: SYS-CHAT
- Delivery: Gilded Name Shimmer (Chat Effect)
- Tebex command: `<GRANT_COSMETIC:CHAT_GILDED_SHIMMER>`
- Real command: ____________________

### Pets

**PET-001: Ember Wisp** (A$4.99)
- System required: SYS-PETS
- Delivery: Ember Wisp (Pet)
- Tebex command: `<GRANT_COSMETIC:PET_EMBER_WISP>`
- Real command: ____________________

**PET-002: Obsidian Raven** (A$7.99)
- System required: SYS-PETS
- Delivery: Obsidian Raven (Pet)
- Tebex command: `<GRANT_COSMETIC:PET_OBSIDIAN_RAVEN>`
- Real command: ____________________

**PET-003: Mini Gate Golem** (A$12.99)
- System required: SYS-PETS
- Delivery: Mini Gate Golem (Pet)
- Tebex command: `<GRANT_COSMETIC:PET_GATE_GOLEM>`
- Real command: ____________________

**PET-004: Crimson Fox Spirit** (A$7.99)
- System required: SYS-PETS
- Delivery: Crimson Fox Spirit (Pet)
- Tebex command: `<GRANT_COSMETIC:PET_CRIMSON_FOX>`
- Real command: ____________________

**PET-005: Void Hatchling** (A$19.99)
- System required: SYS-PETS
- Delivery: Void Hatchling (Pet)
- Tebex command: `<GRANT_COSMETIC:PET_VOID_HATCHLING>`
- Real command: ____________________

### Boosters

**BOOST-001: Global XP Boost (1 Hour)** (A$4.99)
- System required: SYS-BOOSTERS
- Delivery: +50% vanilla XP for every online player for 1 hour
- Tebex command: `<START_GLOBAL_BOOST:XP:60>`
- Real command: ____________________

**BOOST-002: Global XP Boost (3 Hours)** (A$11.99)
- System required: SYS-BOOSTERS
- Delivery: +50% vanilla XP for every online player for 3 hours
- Tebex command: `<START_GLOBAL_BOOST:XP:180>`
- Real command: ____________________

**BOOST-003: Global XP Boost (6 Hours)** (A$19.99)
- System required: SYS-BOOSTERS
- Delivery: +50% vanilla XP for every online player for 6 hours
- Tebex command: `<START_GLOBAL_BOOST:XP:360>`
- Real command: ____________________

**BOOST-004: Global XP Boost (24 Hours)** (A$59.99)
- System required: SYS-BOOSTERS
- Delivery: +50% vanilla XP for every online player for 24 hours
- Tebex command: `<START_GLOBAL_BOOST:XP:1440>`
- Real command: ____________________

**BOOST-005: Global Currency Boost (1 Hour)** (A$4.99)
- System required: SYS-BOOSTERS
- Delivery: +25% in-game currency earned by every online player for 1 hour
- Tebex command: `<START_GLOBAL_BOOST:CURRENCY:60>`
- Real command: ____________________

**BOOST-006: Global Currency Boost (3 Hours)** (A$11.99)
- System required: SYS-BOOSTERS
- Delivery: +25% in-game currency earned by every online player for 3 hours
- Tebex command: `<START_GLOBAL_BOOST:CURRENCY:180>`
- Real command: ____________________

**BOOST-007: Global Currency Boost (6 Hours)** (A$19.99)
- System required: SYS-BOOSTERS
- Delivery: +25% in-game currency earned by every online player for 6 hours
- Tebex command: `<START_GLOBAL_BOOST:CURRENCY:360>`
- Real command: ____________________

**BOOST-008: Global Currency Boost (24 Hours)** (A$59.99)
- System required: SYS-BOOSTERS
- Delivery: +25% in-game currency earned by every online player for 24 hours
- Tebex command: `<START_GLOBAL_BOOST:CURRENCY:1440>`
- Real command: ____________________

**BOOST-009: Global Drop Boost (1 Hour)** (A$4.99)
- System required: SYS-BOOSTERS
- Delivery: +25% mob drops for every online player for 1 hour
- Tebex command: `<START_GLOBAL_BOOST:DROP:60>`
- Real command: ____________________

**BOOST-010: Global Drop Boost (3 Hours)** (A$11.99)
- System required: SYS-BOOSTERS
- Delivery: +25% mob drops for every online player for 3 hours
- Tebex command: `<START_GLOBAL_BOOST:DROP:180>`
- Real command: ____________________

**BOOST-011: Global Drop Boost (6 Hours)** (A$19.99)
- System required: SYS-BOOSTERS
- Delivery: +25% mob drops for every online player for 6 hours
- Tebex command: `<START_GLOBAL_BOOST:DROP:360>`
- Real command: ____________________

**BOOST-012: Global Drop Boost (24 Hours)** (A$59.99)
- System required: SYS-BOOSTERS
- Delivery: +25% mob drops for every online player for 24 hours
- Tebex command: `<START_GLOBAL_BOOST:DROP:1440>`
- Real command: ____________________

**BOOST-013: Global Luck Boost (1 Hour)** (A$4.99)
- System required: SYS-BOOSTERS
- Delivery: Higher chance for everyone to find free crate keys from gameplay for 1 hour
- Tebex command: `<START_GLOBAL_BOOST:LUCK:60>`
- Real command: ____________________

**BOOST-014: Global Luck Boost (3 Hours)** (A$11.99)
- System required: SYS-BOOSTERS
- Delivery: Higher chance for everyone to find free crate keys from gameplay for 3 hours
- Tebex command: `<START_GLOBAL_BOOST:LUCK:180>`
- Real command: ____________________

**BOOST-015: Global Luck Boost (6 Hours)** (A$19.99)
- System required: SYS-BOOSTERS
- Delivery: Higher chance for everyone to find free crate keys from gameplay for 6 hours
- Tebex command: `<START_GLOBAL_BOOST:LUCK:360>`
- Real command: ____________________

**BOOST-016: Global Luck Boost (24 Hours)** (A$59.99)
- System required: SYS-BOOSTERS
- Delivery: Higher chance for everyone to find free crate keys from gameplay for 24 hours
- Tebex command: `<START_GLOBAL_BOOST:LUCK:1440>`
- Real command: ____________________

**BOOST-017: Global Hunter XP Boost (1 Hour)** (A$4.99)
- System required: SYS-BOOSTERS
- Delivery: +25% Hunter Progression XP for every online player for 1 hour
- Tebex command: `<START_GLOBAL_BOOST:HUNTER:60>`
- Real command: ____________________

**BOOST-018: Global Hunter XP Boost (3 Hours)** (A$11.99)
- System required: SYS-BOOSTERS
- Delivery: +25% Hunter Progression XP for every online player for 3 hours
- Tebex command: `<START_GLOBAL_BOOST:HUNTER:180>`
- Real command: ____________________

**BOOST-019: Global Hunter XP Boost (6 Hours)** (A$19.99)
- System required: SYS-BOOSTERS
- Delivery: +25% Hunter Progression XP for every online player for 6 hours
- Tebex command: `<START_GLOBAL_BOOST:HUNTER:360>`
- Real command: ____________________

**BOOST-020: Global Hunter XP Boost (24 Hours)** (A$59.99)
- System required: SYS-BOOSTERS
- Delivery: +25% Hunter Progression XP for every online player for 24 hours
- Tebex command: `<START_GLOBAL_BOOST:HUNTER:1440>`
- Real command: ____________________

**BOOST-021: Global Gate Boost (1 Hour)** (A$4.99)
- System required: SYS-BOOSTERS
- Delivery: +25% Gate and dungeon rewards for every online player for 1 hour
- Tebex command: `<START_GLOBAL_BOOST:GATE:60>`
- Real command: ____________________

**BOOST-022: Global Gate Boost (3 Hours)** (A$11.99)
- System required: SYS-BOOSTERS
- Delivery: +25% Gate and dungeon rewards for every online player for 3 hours
- Tebex command: `<START_GLOBAL_BOOST:GATE:180>`
- Real command: ____________________

**BOOST-023: Global Gate Boost (6 Hours)** (A$19.99)
- System required: SYS-BOOSTERS
- Delivery: +25% Gate and dungeon rewards for every online player for 6 hours
- Tebex command: `<START_GLOBAL_BOOST:GATE:360>`
- Real command: ____________________

**BOOST-024: Global Gate Boost (24 Hours)** (A$59.99)
- System required: SYS-BOOSTERS
- Delivery: +25% Gate and dungeon rewards for every online player for 24 hours
- Tebex command: `<START_GLOBAL_BOOST:GATE:1440>`
- Real command: ____________________

**BOOST-025: Global Party Boost (1 Hour)** (A$4.99)
- System required: SYS-BOOSTERS
- Delivery: +25% bonus for every player in a party or guild for 1 hour
- Tebex command: `<START_GLOBAL_BOOST:PARTY:60>`
- Real command: ____________________

**BOOST-026: Global Party Boost (3 Hours)** (A$11.99)
- System required: SYS-BOOSTERS
- Delivery: +25% bonus for every player in a party or guild for 3 hours
- Tebex command: `<START_GLOBAL_BOOST:PARTY:180>`
- Real command: ____________________

**BOOST-027: Global Party Boost (6 Hours)** (A$19.99)
- System required: SYS-BOOSTERS
- Delivery: +25% bonus for every player in a party or guild for 6 hours
- Tebex command: `<START_GLOBAL_BOOST:PARTY:360>`
- Real command: ____________________

**BOOST-028: Global Party Boost (24 Hours)** (A$59.99)
- System required: SYS-BOOSTERS
- Delivery: +25% bonus for every player in a party or guild for 24 hours
- Tebex command: `<START_GLOBAL_BOOST:PARTY:1440>`
- Real command: ____________________

### Starter

**START-001: First Blood** (A$4.99)
- System required: SYS-KEYS, SYS-SHARDS, SYS-COSMETICS
- Delivery: Your first mark: Crimson Hunter title, 1 Ember Key and 500 Throne Shards.
- Tebex command: `<GRANT_COSMETIC:TITLE_CRIMSON_HUNTER> + <GIVE_KEYS:EMBER:1> + <GIVE_SHARDS:500>`
- Real command: ____________________

**START-002: New Hunter's Mark** (A$6.99)
- System required: SYS-KEYS, SYS-COSMETICS
- Delivery: Ember Wake trail, Blade Salute emote and 2 Ember Keys.
- Tebex command: `<GRANT_COSMETIC:TRAIL_EMBER_WAKE> + <GRANT_COSMETIC:EMOTE_BLADE_SALUTE> + <GIVE_KEYS:EMBER:2>`
- Real command: ____________________

**START-003: Ashen Initiate Cache** (A$7.99)
- System required: SYS-KEYS, SYS-SHARDS, SYS-COSMETICS
- Delivery: Falling Ash particles, 3 Ember Keys and 1,000 Throne Shards.
- Tebex command: `<GRANT_COSMETIC:PARTICLE_FALLING_ASH> + <GIVE_KEYS:EMBER:3> + <GIVE_SHARDS:1000>`
- Real command: ____________________

**START-004: Gate Initiate Pack** (A$9.99)
- System required: SYS-KEYS, SYS-COSMETICS
- Delivery: 1 Abyssal Key, 2 Bloodmoon Keys and the Shadow Step teleport effect.
- Tebex command: `<GIVE_KEYS:ABYSSAL:1> + <GIVE_KEYS:BLOODMOON:2> + <GRANT_COSMETIC:TP_SHADOW_STEP>`
- Real command: ____________________

**START-005: First Expedition** (A$9.99)
- System required: SYS-SHARDS, SYS-COSMETICS
- Delivery: Ember Wisp pet and 1,500 Throne Shards for your first journey.
- Tebex command: `<GRANT_COSMETIC:PET_EMBER_WISP> + <GIVE_SHARDS:1500>`
- Real command: ____________________

**START-006: Novice Wardrobe** (A$5.99)
- System required: SYS-COSMETICS
- Delivery: Crimson Sigil chat tag and Soul Ascension death effect.
- Tebex command: `<GRANT_COSMETIC:TAG_CRIMSON_SIGIL> + <GRANT_COSMETIC:DEATH_SOUL_ASCENSION>`
- Real command: ____________________

**START-007: Hunter's Key Ring** (A$7.99)
- System required: SYS-KEYS
- Delivery: One key of each of the first three crates: Ember, Bloodmoon and Abyssal.
- Tebex command: `<GIVE_KEYS:EMBER:1> + <GIVE_KEYS:BLOODMOON:1> + <GIVE_KEYS:ABYSSAL:1>`
- Real command: ____________________

**START-008: Rising Hunter Bundle** (A$14.99)
- System required: SYS-SHARDS, SYS-COSMETICS
- Delivery: Supporter-tier look without the rank: Crimson Halo aura, Bloodstep trail and 1,500 shards.
- Tebex command: `<GRANT_COSMETIC:AURA_CRIMSON_HALO> + <GRANT_COSMETIC:TRAIL_BLOODSTEP> + <GIVE_SHARDS:1500>`
- Real command: ____________________

**START-009: Starter Shard Pouch** (A$2.99)
- System required: SYS-SHARDS
- Delivery: 1,000 Throne Shards at a one-time welcome price.
- Tebex command: `<GIVE_SHARDS:1000>`
- Real command: ____________________

**START-010: Initiate's Emote Pack** (A$3.99)
- System required: SYS-COSMETICS
- Delivery: Kneel Before the Throne and Blade Salute emotes.
- Tebex command: `<GRANT_COSMETIC:EMOTE_KNEEL> + <GRANT_COSMETIC:EMOTE_BLADE_SALUTE>`
- Real command: ____________________

### Seasonal

**EVENT-001: Bloodmoon Festival Bundle** (A$29.99)
- System required: SYS-KEYS, SYS-COSMETICS, SYS-EVENTS
- Delivery: Event-exclusive Bloodmoon Reaper title, 10 Bloodmoon Keys and the Bloodmoon Eclipse kill effect.
- Tebex command: `<GRANT_COSMETIC:TITLE_BLOODMOON_REAPER> + <GIVE_KEYS:BLOODMOON:10> + <GRANT_COSMETIC:KILL_BLOODMOON_ECLIPSE>`
- Real command: ____________________

**EVENT-002: Bloodmoon Event Key ×5** (A$14.99)
- System required: SYS-KEYS, SYS-EVENTS
- Delivery: 5 Bloodmoon Event Keys for the limited Bloodmoon Event Crate (event cosmetics only).
- Tebex command: `<GIVE_KEYS:BLOODMOON_EVENT:5>`
- Real command: ____________________

**EVENT-003: Hallowed Gate Bundle** (A$24.99)
- System required: SYS-KEYS, SYS-COSMETICS, SYS-EVENTS
- Delivery: Event-exclusive Hollow Lantern pet, Hallowed title and 5 Abyssal Keys.
- Tebex command: `<GRANT_COSMETIC:PET_HOLLOW_LANTERN> + <GRANT_COSMETIC:TITLE_HALLOWED> + <GIVE_KEYS:ABYSSAL:5>`
- Real command: ____________________

**EVENT-004: Frostbound Throne Bundle** (A$24.99)
- System required: SYS-KEYS, SYS-COSMETICS, SYS-EVENTS
- Delivery: Event-exclusive Frostbound aura, Winter's Crown title and 5 Regalia Keys.
- Tebex command: `<GRANT_COSMETIC:AURA_FROSTBOUND> + <GRANT_COSMETIC:TITLE_WINTERS_CROWN> + <GIVE_KEYS:REGALIA:5>`
- Real command: ____________________

**EVENT-005: First Throne Anniversary Pack** (A$19.99)
- System required: SYS-SHARDS, SYS-COSMETICS, SYS-EVENTS
- Delivery: Anniversary title, Anniversary Sigil tag and 5,000 Throne Shards.
- Tebex command: `<GRANT_COSMETIC:TITLE_ANNIVERSARY> + <GRANT_COSMETIC:TAG_ANNIVERSARY> + <GIVE_SHARDS:5000>`
- Real command: ____________________

**EVENT-006: Founder's Pack** (A$29.99)
- System required: SYS-KEYS, SYS-SHARDS, SYS-COSMETICS, SYS-EVENTS
- Delivery: Launch-only Founder title, Founder chat tag, 3 Throne Keys and 5,000 Throne Shards.
- Tebex command: `<GRANT_COSMETIC:TITLE_FOUNDER> + <GRANT_COSMETIC:TAG_FOUNDER> + <GIVE_KEYS:THRONE:3> + <GIVE_SHARDS:5000>`
- Real command: ____________________

**EVENT-007: New Era Pack** (A$19.99)
- System required: SYS-KEYS, SYS-SHARDS, SYS-COSMETICS, SYS-EVENTS
- Delivery: Season-numbered title, 5 Dreadforge Keys and 2,500 Throne Shards to start the new season in style.
- Tebex command: `<GRANT_COSMETIC:TITLE_SEASON_N> + <GIVE_KEYS:DREADFORGE:5> + <GIVE_SHARDS:2500>`
- Real command: ____________________

**EVENT-008: Gate Outbreak Bundle** (A$24.99)
- System required: SYS-KEYS, SYS-COSMETICS, SYS-EVENTS
- Delivery: For server-wide Gate Outbreak events: Outbreak title, 5 Abyssal Keys and the Blood Rift teleport effect.
- Tebex command: `<GRANT_COSMETIC:TITLE_OUTBREAK> + <GIVE_KEYS:ABYSSAL:5> + <GRANT_COSMETIC:TP_BLOOD_RIFT>`
- Real command: ____________________

**EVENT-009: Lunar Eclipse Global Boost** (A$24.99)
- System required: SYS-BOOSTERS, SYS-EVENTS
- Delivery: A 6-hour Global Gate Boost for everyone online during eclipse events.
- Tebex command: `<START_GLOBAL_BOOST:GATE:360>`
- Real command: ____________________

**EVENT-010: Festival of Crowns** (A$34.99)
- System required: SYS-KEYS, SYS-COSMETICS, SYS-EVENTS
- Delivery: Crown-themed event cosmetics: Festival Crown aura and 3 Regalia Keys.
- Tebex command: `<GRANT_COSMETIC:AURA_FESTIVAL_CROWN> + <GIVE_KEYS:REGALIA:3>`
- Real command: ____________________

### Utility

**UTIL-001: Nickname Token (30 days)** (A$3.99)
- System required: SYS-TOKENS
- Delivery: Use /nick for 30 days (staff-moderated).
- Tebex command: `<GRANT_TEMP_PERMISSION:NICK:30d>`
- Real command: ____________________

**UTIL-002: Name Colour Token** (A$2.99)
- System required: SYS-TOKENS
- Delivery: Change your name colour once from the approved palette.
- Tebex command: `<GRANT_TOKEN:NAME_COLOUR:1>`
- Real command: ____________________

**UTIL-003: Prefix Recolour Token** (A$3.99)
- System required: SYS-TOKENS
- Delivery: Recolour your rank prefix once (rank holders only).
- Tebex command: `<GRANT_TOKEN:PREFIX_COLOUR:1>`
- Real command: ____________________

**UTIL-004: Queue Priority Pass (30 days)** (A$4.99)
- System required: SYS-TOKENS, SYS-QUEUE
- Delivery: Priority login when the server is full, for 30 days. No gameplay effect.
- Tebex command: `<GRANT_TEMP_PERMISSION:QUEUE_PRIORITY:30d>`
- Real command: ____________________

**UTIL-005: Guild Banner Design Slot** (A$6.99)
- System required: SYS-TOKENS
- Delivery: Unlock one extra cosmetic banner design for your guild.
- Tebex command: `<GRANT_TOKEN:GUILD_BANNER_SLOT:1>`
- Real command: ____________________

**UTIL-006: Wardrobe Expansion** (A$4.99)
- System required: SYS-TOKENS
- Delivery: +3 cosmetic wardrobe presets to switch outfits instantly.
- Tebex command: `<GRANT_TOKEN:WARDROBE_SLOT:3>`
- Real command: ____________________

**UTIL-007: Chat Emoji Pack: Dark Court** (A$2.99)
- System required: SYS-TOKENS
- Delivery: Unlock 12 OVERTHRONE chat emojis.
- Tebex command: `<GRANT_COSMETIC:EMOJI_PACK_DARK_COURT>`
- Real command: ____________________

### Gifts

**GIFT-001: Gift Rank: Supporter** (A$9.99)
- System required: SYS-RANKS, SYS-GIFTS
- Delivery: Gift the Supporter rank to a friend. Enter their Minecraft username at checkout.
- Tebex command: `<GRANT_RANK:SUPPORTER:{recipient}>`
- Real command: ____________________

**GIFT-002: Gift Key Bundle** (A$24.99)
- System required: SYS-KEYS, SYS-GIFTS
- Delivery: Gift 5 Bloodmoon Keys and 5 Abyssal Keys.
- Tebex command: `<GIVE_KEYS:BLOODMOON:5:{recipient}> + <GIVE_KEYS:ABYSSAL:5:{recipient}>`
- Real command: ____________________

**GIFT-003: Gift Shard Bundle** (A$22.99)
- System required: SYS-SHARDS, SYS-GIFTS
- Delivery: Gift 5,000 Throne Shards (+10% bonus).
- Tebex command: `<GIVE_SHARDS:5500:{recipient}>`
- Real command: ____________________

**GIFT-004: Gift Cosmetic Bundle** (A$19.99)
- System required: SYS-COSMETICS, SYS-GIFTS
- Delivery: Gift Crimson Halo, Bloodstep trail and the Blood Rift teleport effect.
- Tebex command: `<GRANT_COSMETIC:AURA_CRIMSON_HALO:{recipient}> + <GRANT_COSMETIC:TRAIL_BLOODSTEP:{recipient}> + <GRANT_COSMETIC:TP_BLOOD_RIFT:{recipient}>`
- Real command: ____________________

**GIFT-005: Gift Starter Bundle** (A$9.99)
- System required: SYS-KEYS, SYS-SHARDS, SYS-COSMETICS, SYS-GIFTS
- Delivery: Gift the First Blood and Hunter's Key Ring starter packs.
- Tebex command: `<GRANT_COSMETIC:TITLE_CRIMSON_HUNTER:{recipient}> + <GIVE_KEYS:EMBER:2:{recipient}> + <GIVE_KEYS:BLOODMOON:1:{recipient}> + <GIVE_KEYS:ABYSSAL:1:{recipient}> + <GIVE_SHARDS:500:{recipient}>`
- Real command: ____________________

**GIFT-006: Gift Rank: Elite** (A$19.99)
- System required: SYS-RANKS, SYS-GIFTS
- Delivery: Gift the Elite rank to a friend.
- Tebex command: `<GRANT_RANK:ELITE:{recipient}>`
- Real command: ____________________

**GIFT-007: Gift Rank: Champion** (A$34.99)
- System required: SYS-RANKS, SYS-GIFTS
- Delivery: Gift the Champion rank to a friend.
- Tebex command: `<GRANT_RANK:CHAMPION:{recipient}>`
- Real command: ____________________

**GIFT-008: Gift Rank: Overlord** (A$49.99)
- System required: SYS-RANKS, SYS-GIFTS
- Delivery: Gift the Overlord rank to a friend.
- Tebex command: `<GRANT_RANK:OVERLORD:{recipient}>`
- Real command: ____________________

