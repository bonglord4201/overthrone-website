# OVERTHRONE SMP – Tebex Store Catalogue (v2)

*“Don’t reach the throne. Overthrow it.”*

180 packages in 12 categories. Prices are recommendations in AUD.
Every package has a **ready-to-paste Tebex description** (below, and in `packages.csv`) and an **image prompt** in `IMAGE-PROMPTS.md`.

## Read first: what your server can deliver today

Your confirmed mod list (Minecraft 1.21.1, NeoForge 21.1.251):
Solo Leveling: Reawakening (SLR), Tensura: Reincarnated, Tensura Leveling SLR: True Isekai, Beyond Adventures, Pufferfish's Skills, FTB Quests, KubeJS, RenderJS, Easy NPC, Epic Fight, Epic Fight Skill Tree, Iron's Spells 'n Spellbooks, Apothic Attributes, Open Parties and Claims, Lootr, Sophisticated Backpacks, Waystones, Xaero's Minimap / World Map, Simply Swords, Weapons of Miracles, The Aether, YUNG's Better Dungeons, Dungeons and Taverns, Jade / Jade Addons.

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
| 1 | 🔴 **SUPPORTER** | [SUPPORTER] | `#E0434F` | @Supporter | A$9.99 | RANK-001 |
| 2 | 💎 **ELITE** | [ELITE] | `#9B6BFF` | @Elite | A$24.99 | RANK-002 |
| 3 | 🏆 **CHAMPION** | [CHAMPION] | `#E39B5B` | @Champion | A$49.99 | RANK-003 |
| 4 | ⚔️ **WARLORD** | [WARLORD] | `#E25822` | @Warlord | A$89.99 | RANK-005 |
| 5 | 👑 **OVERLORD** | [OVERLORD] | `#F2C14E` | @Overlord | A$149.99 | RANK-004 |

> IDs: RANK-001 to RANK-004 keep their old IDs. **Warlord is new (RANK-005)** and sits between Champion and Overlord.
> Sovereign, Usurper, Kingslayer and Thronebreaker are removed (old RANK-005 to RANK-008).

### 🔴 SUPPORTER · A$9.99 · RANK-001

**Tebex description (paste as-is):**

```
🔴 SUPPORTER RANK · LIFETIME

Every rebellion begins with a single spark. Supporters lit the first fire beneath the throne.

PERKS:
• Rank prefix in chat & tab: [SUPPORTER]
• Coloured name: Crimson
• Discord role: @Supporter
• Join queue priority: Tier 1
• Chat emoji pack
• Homes (/sethome): 2
• Bonus claim chunks (Open Parties and Claims): +25
• Auction House listing slots: 5

ON PURCHASE:
• Throne Shards: 500
• Crate keys: 2× Ember
• Rank-exclusive cosmetic: Crimson Spark particle
• Class Reset Tokens: 1

Lifetime rank. Cosmetic and convenience perks. Delivered automatically in-game. Questions? Join our Discord.
```

- **Delivery placeholders:** `<SET_RANK_COMMAND player={username} rank=supporter> + <GIVE_CRATE_KEY_COMMAND player={username} crate=ember amount=2> + <GIVE_SHARDS_COMMAND player={username} amount=500> + <GRANT_COSMETIC_COMMAND player={username} id=particle_crimson_spark> + <GIVE_TOKEN_COMMAND player={username} token=class_reset amount=1> + Tebex Discord Action: add role @Supporter`
- **Compliance:** Borderline (homes/claims/AH/reset tokens – see table)
- **Optional Risky perks (not included; your call):** Sophisticated Backpack on purchase: Iron

### 💎 ELITE · A$24.99 · RANK-002

**Tebex description (paste as-is):**

```
💎 ELITE RANK · LIFETIME

Hunters who survived their first Gate and came back hungry. The Elite are marked by violet fire.

ALL SUPPORTER PERKS, AND:
• Rank prefix in chat & tab: [ELITE]
• Coloured name: Violet
• Discord role: @Elite
• Join queue priority: Tier 2
• Chat colours (/chatcolor): 4 colours
• Homes (/sethome): 3
• Bonus claim chunks (Open Parties and Claims): +50
• Auction House listing slots: 7

ON PURCHASE:
• Throne Shards: 1,000
• Crate keys: 3× Bloodmoon
• Rank-exclusive cosmetic: Violet Ember aura
• Class Reset Tokens: 2

Lifetime rank. Cosmetic and convenience perks. Delivered automatically in-game. Questions? Join our Discord.
```

- **Delivery placeholders:** `<SET_RANK_COMMAND player={username} rank=elite> + <GIVE_CRATE_KEY_COMMAND player={username} crate=bloodmoon amount=3> + <GIVE_SHARDS_COMMAND player={username} amount=1000> + <GRANT_COSMETIC_COMMAND player={username} id=aura_violet_ember> + <GIVE_TOKEN_COMMAND player={username} token=class_reset amount=2> + Tebex Discord Action: add role @Elite`
- **Compliance:** Borderline (homes/claims/AH/reset tokens – see table)
- **Optional Risky perks (not included; your call):** Sophisticated Backpack on purchase: Gold; Waystones Warp/Return Scrolls on purchase: 3

### 🏆 CHAMPION · A$49.99 · RANK-003

**Tebex description (paste as-is):**

```
🏆 CHAMPION RANK · LIFETIME

Champions carry the scars of a hundred Gates. Bronze-forged and battle-proven.

ALL ELITE PERKS, AND:
• Rank prefix in chat & tab: [CHAMPION]
• Coloured name: Bronze
• Discord role: @Champion
• Join queue priority: Tier 3
• Chat colours (/chatcolor): 8 colours
• Custom join message
• /hat
• Emotes: Champion Salutes
• Homes (/sethome): 4
• Bonus claim chunks (Open Parties and Claims): +75
• Auction House listing slots: 9

ON PURCHASE:
• Throne Shards: 2,000
• Crate keys: 3× Abyssal
• Rank-exclusive cosmetic: Bronze Banner kill effect
• Class Reset Tokens: 3
• Race Reset Token (Tensura): 1

Lifetime rank. Cosmetic and convenience perks. Delivered automatically in-game. Questions? Join our Discord.
```

- **Delivery placeholders:** `<SET_RANK_COMMAND player={username} rank=champion> + <GIVE_CRATE_KEY_COMMAND player={username} crate=abyssal amount=3> + <GIVE_SHARDS_COMMAND player={username} amount=2000> + <GRANT_COSMETIC_COMMAND player={username} id=kill_bronze_banner> + <GIVE_TOKEN_COMMAND player={username} token=class_reset amount=3> + <GIVE_TOKEN_COMMAND player={username} token=race_reset amount=1> + Tebex Discord Action: add role @Champion`
- **Compliance:** Borderline (homes/claims/AH/reset tokens – see table)
- **Optional Risky perks (not included; your call):** Sophisticated Backpack on purchase: Diamond; Waystones Warp/Return Scrolls on purchase: 5; Iron's Spells ink/scrolls on purchase: Rare ink ×2

### ⚔️ WARLORD · A$89.99 · RANK-005

**Tebex description (paste as-is):**

```
⚔️ WARLORD RANK · LIFETIME

Warlords lead guilds through the deepest Gates. Their banners burn crimson-orange across Netherfall.

ALL CHAMPION PERKS, AND:
• Rank prefix in chat & tab: [WARLORD]
• Coloured name: Flame
• Discord role: @Warlord
• Join queue priority: Tier 4
• Chat colours (/chatcolor): 12 colours
• Server-wide arrival announcement
• /nick (staff-moderated)
• Emotes: War Cries
• /fly in the OVERTHRONE hub only
• Homes (/sethome): 5
• Bonus claim chunks (Open Parties and Claims): +100
• Auction House listing slots: 11

ON PURCHASE:
• Throne Shards: 3,500
• Crate keys: 3× Dreadforge
• Rank-exclusive cosmetic: Warlord title + War Banner trail
• Class Reset Tokens: 4
• Race Reset Token (Tensura): 1

Lifetime rank. Cosmetic and convenience perks. Delivered automatically in-game. Questions? Join our Discord.
```

- **Delivery placeholders:** `<SET_RANK_COMMAND player={username} rank=warlord> + <GIVE_CRATE_KEY_COMMAND player={username} crate=dreadforge amount=3> + <GIVE_SHARDS_COMMAND player={username} amount=3500> + <GRANT_COSMETIC_COMMAND player={username} id=title_warlord> + <GRANT_COSMETIC_COMMAND player={username} id=trail_war_banner> + <GIVE_TOKEN_COMMAND player={username} token=class_reset amount=4> + <GIVE_TOKEN_COMMAND player={username} token=race_reset amount=1> + Tebex Discord Action: add role @Warlord`
- **Compliance:** Borderline (homes/claims/AH/reset tokens – see table)
- **Optional Risky perks (not included; your call):** /back after death: ✓; Sophisticated Backpack on purchase: Netherite; Waystones Warp/Return Scrolls on purchase: 8; Iron's Spells ink/scrolls on purchase: Epic ink ×2; Pufferfish's Skills points on purchase: 2; Rank kit (/kit): Weekly

### 👑 OVERLORD · A$149.99 · RANK-004

**Tebex description (paste as-is):**

```
👑 OVERLORD RANK · LIFETIME

The highest donor rank. Overlords stand closest to the throne – and closest to tearing it down.

ALL WARLORD PERKS, AND:
• Rank prefix in chat & tab: [OVERLORD] (animated)
• Coloured name: Gold
• Discord role: @Overlord
• Join queue priority: Tier 5
• Chat colours (/chatcolor): All + gradients
• /sit & /lay
• Emotes: All rank emotes
• Hall of Thrones listing (website + Discord)
• Homes (/sethome): 6
• Bonus claim chunks (Open Parties and Claims): +150
• Auction House listing slots: 15

ON PURCHASE:
• Throne Shards: 6,000
• Crate keys: 3× Throne + 3× Regalia
• Rank-exclusive cosmetic: Overlord Crown aura + title + Overlord Raven pet
• Class Reset Tokens: 5
• Race Reset Token (Tensura): 2

Lifetime rank. Cosmetic and convenience perks. Delivered automatically in-game. Questions? Join our Discord.
```

- **Delivery placeholders:** `<SET_RANK_COMMAND player={username} rank=overlord> + <GIVE_CRATE_KEY_COMMAND player={username} crate=throne amount=3> + <GIVE_CRATE_KEY_COMMAND player={username} crate=regalia amount=3> + <GIVE_SHARDS_COMMAND player={username} amount=6000> + <GRANT_COSMETIC_COMMAND player={username} id=aura_overlord_crown> + <GRANT_COSMETIC_COMMAND player={username} id=title_overlord> + <GRANT_COSMETIC_COMMAND player={username} id=pet_overlord_raven> + <GIVE_TOKEN_COMMAND player={username} token=class_reset amount=5> + <GIVE_TOKEN_COMMAND player={username} token=race_reset amount=2> + Tebex Discord Action: add role @Overlord`
- **Compliance:** Borderline (homes/claims/AH/reset tokens – see table)
- **Optional Risky perks (not included; your call):** /back after death: ✓; Sophisticated Backpack on purchase: Netherite + upgrades; Waystones Warp/Return Scrolls on purchase: 12; Iron's Spells ink/scrolls on purchase: Legendary ink ×1; Pufferfish's Skills points on purchase: 4; Rank kit (/kit): Daily; Keep XP on death: ✓; /fly in survival worlds: ✓


## 2. Rank comparison table

Features as rows, ranks as columns. The rating and status of each perk are shown in the last columns.

| Perk | Supporter | Elite | Champion | Warlord | Overlord | Rating | Status | Compliant alternative |
|---|---|---|---|---|---|---|---|---|
| Rank prefix in chat & tab | [SUPPORTER] | [ELITE] | [CHAMPION] | [WARLORD] | [OVERLORD] (animated) | **Safe** | DEV SYSTEM REQUIRED | – |
| Coloured name | Crimson | Violet | Bronze | Flame | Gold | **Safe** | DEV SYSTEM REQUIRED | – |
| Discord role | @Supporter | @Elite | @Champion | @Warlord | @Overlord | **Safe** | Ready in Tebex | – |
| Join queue priority | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 | **Safe** | DEV SYSTEM REQUIRED | – |
| Throne Shards on purchase | 500 | 1,000 | 2,000 | 3,500 | 6,000 | **Safe** | DEV SYSTEM REQUIRED | – |
| Crate keys on purchase | 2× Ember | 3× Bloodmoon | 3× Abyssal | 3× Dreadforge | 3× Throne + 3× Regalia | **Safe** | DEV SYSTEM REQUIRED | If crates use the gear pool this becomes Risky. |
| Rank-exclusive cosmetic | Crimson Spark particle | Violet Ember aura | Bronze Banner kill effect | Warlord title + War Banner trail | Overlord Crown aura + title + Overlord Raven pet | **Safe** | DEV SYSTEM REQUIRED | – |
| Chat colours (/chatcolor) | ✗ | 4 colours | 8 colours | 12 colours | All + gradients | **Safe** | DEV SYSTEM REQUIRED | – |
| Chat emoji pack | ✓ | ✓ | ✓ | ✓ | ✓ | **Safe** | DEV SYSTEM REQUIRED | – |
| Custom join message | ✗ | ✗ | ✓ | ✓ | ✓ | **Safe** | DEV SYSTEM REQUIRED | – |
| Server-wide arrival announcement | ✗ | ✗ | ✗ | ✓ | ✓ | **Safe** | DEV SYSTEM REQUIRED | – |
| /hat | ✗ | ✗ | ✓ | ✓ | ✓ | **Safe** | DEV SYSTEM REQUIRED | – |
| /nick (staff-moderated) | ✗ | ✗ | ✗ | ✓ | ✓ | **Safe** | DEV SYSTEM REQUIRED | – |
| /sit & /lay | ✗ | ✗ | ✗ | ✗ | ✓ | **Safe** | DEV SYSTEM REQUIRED | – |
| Emotes | ✗ | ✗ | Champion Salutes | War Cries | All rank emotes | **Safe** | DEV SYSTEM REQUIRED | – |
| /fly in the OVERTHRONE hub only | ✗ | ✗ | ✗ | ✓ | ✓ | **Safe** | DEV SYSTEM REQUIRED | Must be disabled in every gameplay world. |
| Hall of Thrones listing (website + Discord) | ✗ | ✗ | ✗ | ✗ | ✓ | **Safe** | Ready (manual) | – |
| Homes (/sethome) | 2 | 3 | 4 | 5 | 6 | **Borderline** | DEV SYSTEM REQUIRED | Give every player the same home count; ranks get cosmetic home icons instead. |
| Bonus claim chunks (Open Parties and Claims) | +25 | +50 | +75 | +100 | +150 | **Borderline** | UNVERIFIED (OPAC permission support must be confirmed) | Same claim limit for everyone; earn extra chunks through Hunter rank progression. |
| Auction House listing slots | 5 | 7 | 9 | 11 | 15 | **Borderline** | DEV SYSTEM REQUIRED | Same slots for everyone; ranks get a cosmetic listing highlight. |
| Class Reset Tokens on purchase | 1 | 2 | 3 | 4 | 5 | **Borderline** | DEV SYSTEM REQUIRED | Make class resets free on a cooldown for everyone. |
| Race Reset Token on purchase (Tensura) | ✗ | ✗ | 1 | 1 | 2 | **Borderline** | UNVERIFIED (no confirmed reset command) | Offer resets in-game via a quest item for everyone. |
| /back after death *(optional)* | ✗ | ✗ | ✗ | ✓ | ✓ | **Risky** | DEV SYSTEM REQUIRED | Remove. Use a cosmetic death effect instead. |
| Sophisticated Backpack on purchase *(optional)* | Iron | Gold | Diamond | Netherite | Netherite + upgrades | **Risky** | Real mod – item ID UNVERIFIED | Replace with Throne Shards of equal value. |
| Waystones Warp/Return Scrolls on purchase *(optional)* | ✗ | 3 | 5 | 8 | 12 | **Risky** | Real mod – item IDs UNVERIFIED | Remove; travel stays earned. |
| Iron's Spells ink/scrolls on purchase *(optional)* | ✗ | ✗ | Rare ink ×2 | Epic ink ×2 | Legendary ink ×1 | **Risky** | Real mod – item IDs UNVERIFIED | Remove; offer a cosmetic spell-cast particle. |
| Pufferfish's Skills points on purchase *(optional)* | ✗ | ✗ | ✗ | 2 | 4 | **Risky** | Command UNVERIFIED | Remove; skill points stay earned. |
| Rank kit (/kit) *(optional)* | ✗ | ✗ | ✗ | Weekly | Daily | **Risky** | DEV SYSTEM REQUIRED | Cosmetic-only kit (titles/particles) or remove. |
| Keep XP on death *(optional)* | ✗ | ✗ | ✗ | ✗ | ✓ | **Risky** | DEV SYSTEM REQUIRED | Remove; use a cosmetic death effect. |
| /fly in survival worlds *(optional)* | ✗ | ✗ | ✗ | ✗ | ✓ | **Risky** | DEV SYSTEM REQUIRED | Hub-only /fly (already included). |

**Rank upgrades (optional):** create "Upgrade: Elite → Champion" style packages priced at the difference. The developer removes the old rank when granting the new one.

---

## 3. Crates

**Key command:** `<GIVE_CRATE_KEY_COMMAND player={username} crate=<name> amount=<n>>`: **DEV SYSTEM REQUIRED** (no crate mod is installed; KubeJS is one option).

Default reward pool: **cosmetics and Throne Shards only (Safe)**. Duplicate cosmetics convert to Throne Shards.

| Crate | Prestige | Key | Colour | 1 key | Common | Rare | Epic | Legendary | Mythic |
|---|---|---|---|---|---|---|---|---|---|
| **Ember Crate** | Common | Ember Key | `#F2A541` | A$1.99 | 62% | 27% | 8% | 2.5% | 0.5% |
| **Bloodmoon Crate** | Uncommon | Bloodmoon Key | `#D61F3C` | A$3.49 | 55% | 30% | 11% | 3.4% | 0.6% |
| **Abyssal Crate** | Rare | Abyssal Key | `#7B4DFF` | A$4.99 | 48% | 32% | 14% | 5% | 1% |
| **Dreadforge Crate** | Epic | Dreadforge Key | `#FF6A1A` | A$6.99 | 40% | 34% | 18% | 6.5% | 1.5% |
| **Regalia Crate** | Legendary | Regalia Key | `#E6C068` | A$9.99 | 30% | 36% | 22% | 9.5% | 2.5% |
| **Throne Crate** | Mythic | Throne Key | `#FF2E4D` | A$14.99 | 20% | 35% | 28% | 13% | 4% |

### Ember Crate (Common)
- **Lore:** Embers drift up from the cracked earth wherever a Gate has opened. Hunters gather them by the handful.
- **Key art:** a blackened iron key with a glowing amber ember core in its bow, faint sparks drifting off the teeth
- **Crate art:** a small soot-black iron-banded chest with amber light leaking through its seams and embers rising from the lid
- **Cosmetic pool (Safe, default):**
  - Common (62%): 150–300 Throne Shards; Common trails and chat tags
  - Rare (27%): 400–600 Throne Shards; Rare particles and titles
  - Epic (8%): 1,000 Throne Shards; Epic kill and death effects
  - Legendary (2.5%): 2,500 Throne Shards; Legendary auras
  - Mythic (0.5%): Jackpot: Ashen Halo aura (crate exclusive)
- **Optional gear pool (Risky, not default), items from installed mods with IDs UNVERIFIED:** Sophisticated Backpacks: Copper Backpack · Waystones: Return Scroll ×2 · Iron's Spells: Common Ink ×3.
  Alternative: keep the cosmetic pool.
- **Key prices:** ×1 A$1.99 · ×5 A$8.99 · ×10 A$16.99 · ×25 A$39.99 · ×50 A$74.99 · ×100 A$139.99

### Bloodmoon Crate (Uncommon)
- **Lore:** When the moon bleeds, the Gates widen. Bloodmoon Crates wash up in the red light, sealed with old wax.
- **Key art:** a crimson-steel key whose bow is a blood-red moon disc in a thorned frame, dripping red light
- **Crate art:** a dark wooden reliquary chest sealed with blood-red wax, a full crimson moon glowing behind it
- **Cosmetic pool (Safe, default):**
  - Common (55%): 250–500 Throne Shards; Common and Rare cosmetics
  - Rare (30%): 600–900 Throne Shards; Rare titles, tags and trails
  - Epic (11%): 1,500 Throne Shards; Epic kill effects and teleport effects
  - Legendary (3.4%): 3,500 Throne Shards; Legendary auras and pets
  - Mythic (0.6%): Jackpot: Bloodmoon Eclipse aura (crate exclusive)
- **Optional gear pool (Risky, not default), items from installed mods with IDs UNVERIFIED:** Sophisticated Backpacks: Iron Backpack · Waystones: Warp Scroll ×2 · Iron's Spells: Uncommon Ink ×2.
  Alternative: keep the cosmetic pool.
- **Key prices:** ×1 A$3.99 · ×5 A$15.99 · ×10 A$29.99 · ×25 A$69.99 · ×50 A$130.99 · ×100 A$244.99

### Abyssal Crate (Rare)
- **Lore:** Dredged from the bottom of the deepest Gates, where light forgets itself.
- **Key art:** an obsidian key with violet-black void energy swirling inside a cracked glass bow, chains wrapped around the shaft
- **Crate art:** an obsidian chest bound in chains, a violet void portal swirling where the lock should be
- **Cosmetic pool (Safe, default):**
  - Common (48%): 400–700 Throne Shards; Rare cosmetics
  - Rare (32%): 900–1,200 Throne Shards; Epic trails and particles
  - Epic (14%): 2,000 Throne Shards; Epic pets and teleport effects
  - Legendary (5%): 5,000 Throne Shards; Legendary weapon skins
  - Mythic (1%): Jackpot: Voidborn Wraith pet (crate exclusive)
- **Optional gear pool (Risky, not default), items from installed mods with IDs UNVERIFIED:** Sophisticated Backpacks: Gold Backpack · Iron's Spells: Rare Ink ×2 · Epic Fight: Skill Book (choose).
  Alternative: keep the cosmetic pool.
- **Key prices:** ×1 A$4.99 · ×5 A$22.99 · ×10 A$42.99 · ×25 A$99.99 · ×50 A$187.99 · ×100 A$349.99

### Dreadforge Crate (Epic)
- **Lore:** Hammered in the forges beneath Netherfall, where the dead still work the bellows.
- **Key art:** a heavy blackened-steel key glowing molten orange along its cracks, hammered rivets and a skull-shaped bow
- **Crate art:** a massive anvil-shaped forged-iron crate glowing molten orange from within, sparks and smoke rising
- **Cosmetic pool (Safe, default):**
  - Common (40%): 600–900 Throne Shards; Epic cosmetics
  - Rare (34%): 1,200–1,600 Throne Shards; Epic armour and weapon skins
  - Epic (18%): 2,500 Throne Shards; Legendary kill effects
  - Legendary (6.5%): 6,000 Throne Shards; Legendary armour skin sets
  - Mythic (1.5%): Jackpot: Molten Throne armour skin set (crate exclusive)
- **Optional gear pool (Risky, not default), items from installed mods with IDs UNVERIFIED:** Simply Swords: a unique weapon (choose item) · Sophisticated Backpacks: Diamond Backpack · Iron's Spells: Epic Ink.
  Alternative: keep the cosmetic pool.
- **Key prices:** ×1 A$6.99 · ×5 A$31.99 · ×10 A$59.99 · ×25 A$139.99 · ×50 A$262.99 · ×100 A$489.99

### Regalia Crate (Legendary)
- **Lore:** Treasures of fallen kings: sceptres, signets and stolen crowns, sealed in gold for whoever claims them next.
- **Key art:** an ornate dark-gold key with a crown-shaped bow set with a single crimson gemstone, fine engraved filigree
- **Crate art:** a royal black-and-gold treasure coffer with crown motifs, crimson velvet inside and golden light spilling out
- **Cosmetic pool (Safe, default):**
  - Common (30%): 900–1,300 Throne Shards; Epic cosmetics
  - Rare (36%): 1,800–2,400 Throne Shards; Legendary titles and tags
  - Epic (22%): 3,500 Throne Shards; Legendary pets and auras
  - Legendary (9.5%): 8,000 Throne Shards; Mythic chat and teleport effects
  - Mythic (2.5%): Jackpot: Gilded Regalia weapon skin set (crate exclusive)
- **Optional gear pool (Risky, not default), items from installed mods with IDs UNVERIFIED:** Weapons of Miracles: a weapon (choose item) · Sophisticated Backpacks: Netherite Backpack · Iron's Spells: Legendary Ink.
  Alternative: keep the cosmetic pool.
- **Key prices:** ×1 A$9.99 · ×5 A$44.99 · ×10 A$84.99 · ×25 A$199.99 · ×50 A$374.99 · ×100 A$699.99

### Throne Crate (Mythic)
- **Lore:** There is only one throne. Every Throne Crate holds a fragment of it.
- **Key art:** a legendary key forged from a shard of a broken obsidian throne, crimson energy veins, gold crown-shaped bow
- **Crate art:** a monolithic obsidian crate shaped like a miniature broken throne, crimson cracks glowing, dark-gold trim and drifting embers
- **Cosmetic pool (Safe, default):**
  - Common (20%): 1,500–2,000 Throne Shards; Legendary cosmetics
  - Rare (35%): 3,000 Throne Shards; Legendary auras and pets
  - Epic (28%): 5,000 Throne Shards; Mythic effects
  - Legendary (13%): 12,000 Throne Shards; Mythic armour skin sets
  - Mythic (4%): Jackpot: The Empty Throne aura + title “Throne Taker” (crate exclusive)
- **Optional gear pool (Risky, not default), items from installed mods with IDs UNVERIFIED:** SLR / Tensura: a high-tier item (choose item) · Weapons of Miracles: a top-tier weapon (choose item) · Sophisticated Backpacks: Netherite Backpack + upgrades.
  Alternative: keep the cosmetic pool.
- **Key prices:** ×1 A$14.99 · ×5 A$67.99 · ×10 A$127.99 · ×25 A$299.99 · ×50 A$562.99 · ×100 A$1049.99


## 4. All packages, with Tebex descriptions

### Featured (15)

Rotating spotlight: limited-time and seasonal highlights.

| ID | Package | Price | Contents | Compliance |
|---|---|---|---|---|
| FEAT-001 | Crimson Eclipse Aura (Limited) | A$14.99 | A limited aura: a crimson eclipse forms a halo behind you. Leaves the store when the rotation ends. | Safe |
| FEAT-002 | Founder's Crown Title | A$9.99 | Title “Founder”, available only during the server's launch month. Never returns. | Safe |
| FEAT-003 | Weekend Throne Rush | A$39.99 | 3 Throne Keys and 3 Regalia Keys at a weekend price. | Safe |
| FEAT-004 | Monthly Relic Box | A$12.99 | One cosmetic relic chosen for the month, plus 1,000 Throne Shards. The month's relic is listed in the description. | Safe |
| FEAT-005 | Throne of Ash Set | A$24.99 | Ashborn title, Ashen Collapse death effect and Falling Ash particles in one set. | Safe |
| FEAT-006 | Gatekeeper's Sigil Set | A$17.99 | Crimson Sigil tag, Orbiting Runes and the Shadow Step teleport effect. | Safe |
| FEAT-007 | Double Shard Weekend: Coffer | A$22.99 | 5,000 Throne Shards + 5,000 bonus shards during Double Shard weekends. | Safe |
| FEAT-008 | Crimson Fox Companion | A$9.99 | Spotlight price on the Crimson Fox Spirit pet. | Safe |
| FEAT-009 | Bloodmoon Hunt Pass | A$19.99 | 5 Bloodmoon Keys and the Bloodmoon Eclipse kill effect. | Safe |
| FEAT-010 | Obsidian Monarch Set | A$34.99 | Obsidian Crown aura, Black Crown tag and Obsidian Raven pet. | Safe |
| FEAT-011 | Dreadforge Spotlight Keys | A$29.99 | 5 Dreadforge Keys at a spotlight price. | Safe |
| FEAT-012 | Realm Explorer Set (Aeonia) | A$19.99 | A divine-themed cosmetic set released with the Aeonia realm. | Safe |
| FEAT-013 | Realm Explorer Set (Netherfall) | A$19.99 | An underworld-themed cosmetic set released with the Netherfall realm. | Safe |
| FEAT-014 | Gate Clear Celebration Pack | A$14.99 | 2 Abyssal Keys, 2,500 Throne Shards and the Gatebreaker title. | Safe |
| FEAT-015 | Spotlight: Shattered Crystal Trail | A$5.99 | Spotlight price on the Shattered Crystal trail. | Safe |

<details><summary>Tebex descriptions (Featured)</summary>

**FEAT-001: Crimson Eclipse Aura (Limited)**
```
★ CRIMSON ECLIPSE AURA (LIMITED)

A limited aura: a crimson eclipse forms a halo behind you. Leaves the store when the rotation ends.

Availability: Monthly rotation.

Delivered automatically in-game. Questions? Join our Discord.
```

**FEAT-002: Founder's Crown Title**
```
★ FOUNDER'S CROWN TITLE

Title “Founder”, available only during the server's launch month. Never returns.

Availability: Launch month only.

Delivered automatically in-game. Questions? Join our Discord.
```

**FEAT-003: Weekend Throne Rush**
```
★ WEEKEND THRONE RUSH

3 Throne Keys and 3 Regalia Keys at a weekend price.

Availability: Selected weekends.

Delivered automatically in-game. Questions? Join our Discord.
```

**FEAT-004: Monthly Relic Box**
```
★ MONTHLY RELIC BOX

One cosmetic relic chosen for the month, plus 1,000 Throne Shards. The month's relic is listed in the description.

Availability: Changes monthly.

Delivered automatically in-game. Questions? Join our Discord.
```

**FEAT-005: Throne of Ash Set**
```
★ THRONE OF ASH SET

Ashborn title, Ashen Collapse death effect and Falling Ash particles in one set.

Availability: Rotation.

Delivered automatically in-game. Questions? Join our Discord.
```

**FEAT-006: Gatekeeper's Sigil Set**
```
★ GATEKEEPER'S SIGIL SET

Crimson Sigil tag, Orbiting Runes and the Shadow Step teleport effect.

Availability: Rotation.

Delivered automatically in-game. Questions? Join our Discord.
```

**FEAT-007: Double Shard Weekend: Coffer**
```
★ DOUBLE SHARD WEEKEND: COFFER

5,000 Throne Shards + 5,000 bonus shards during Double Shard weekends.

Availability: Double Shard weekends.

Delivered automatically in-game. Questions? Join our Discord.
```

**FEAT-008: Crimson Fox Companion**
```
★ CRIMSON FOX COMPANION

Spotlight price on the Crimson Fox Spirit pet.

Availability: Rotation.

Delivered automatically in-game. Questions? Join our Discord.
```

**FEAT-009: Bloodmoon Hunt Pass**
```
★ BLOODMOON HUNT PASS

5 Bloodmoon Keys and the Bloodmoon Eclipse kill effect.

Availability: Bloodmoon nights.

Delivered automatically in-game. Questions? Join our Discord.
```

**FEAT-010: Obsidian Monarch Set**
```
★ OBSIDIAN MONARCH SET

Obsidian Crown aura, Black Crown tag and Obsidian Raven pet.

Availability: Rotation.

Delivered automatically in-game. Questions? Join our Discord.
```

**FEAT-011: Dreadforge Spotlight Keys**
```
★ DREADFORGE SPOTLIGHT KEYS

5 Dreadforge Keys at a spotlight price.

Availability: Rotation.

Delivered automatically in-game. Questions? Join our Discord.
```

**FEAT-012: Realm Explorer Set (Aeonia)**
```
★ REALM EXPLORER SET (AEONIA)

A divine-themed cosmetic set released with the Aeonia realm.

Availability: When Aeonia opens.

Delivered automatically in-game. Questions? Join our Discord.
```

**FEAT-013: Realm Explorer Set (Netherfall)**
```
★ REALM EXPLORER SET (NETHERFALL)

An underworld-themed cosmetic set released with the Netherfall realm.

Availability: When Netherfall opens.

Delivered automatically in-game. Questions? Join our Discord.
```

**FEAT-014: Gate Clear Celebration Pack**
```
★ GATE CLEAR CELEBRATION PACK

2 Abyssal Keys, 2,500 Throne Shards and the Gatebreaker title.

Availability: After major Gate updates.

Delivered automatically in-game. Questions? Join our Discord.
```

**FEAT-015: Spotlight: Shattered Crystal Trail**
```
★ SPOTLIGHT: SHATTERED CRYSTAL TRAIL

Spotlight price on the Shattered Crystal trail.

Availability: Rotation.

Delivered automatically in-game. Questions? Join our Discord.
```

</details>

### Crate Keys (39)

Keys for the six Gate Crates. All crate rewards are cosmetic or Throne Shards.

| ID | Package | Price | Contents | Compliance |
|---|---|---|---|---|
| KEY-001 | Ember Key ×1 | A$1.99 | 1× Ember Key | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-002 | Ember Key ×5 | A$8.99 | 5× Ember Key (10% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-003 | Ember Key ×10 | A$16.99 | 10× Ember Key (15% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-004 | Ember Key ×25 | A$39.99 | 25× Ember Key (20% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-005 | Ember Key ×50 | A$74.99 | 50× Ember Key (25% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-006 | Ember Key ×100 | A$139.99 | 100× Ember Key (30% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-007 | Bloodmoon Key ×1 | A$3.99 | 1× Bloodmoon Key | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-008 | Bloodmoon Key ×5 | A$15.99 | 5× Bloodmoon Key (10% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-009 | Bloodmoon Key ×10 | A$29.99 | 10× Bloodmoon Key (15% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-010 | Bloodmoon Key ×25 | A$69.99 | 25× Bloodmoon Key (20% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-011 | Bloodmoon Key ×50 | A$130.99 | 50× Bloodmoon Key (25% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-012 | Bloodmoon Key ×100 | A$244.99 | 100× Bloodmoon Key (30% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-013 | Abyssal Key ×1 | A$4.99 | 1× Abyssal Key | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-014 | Abyssal Key ×5 | A$22.99 | 5× Abyssal Key (10% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-015 | Abyssal Key ×10 | A$42.99 | 10× Abyssal Key (15% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-016 | Abyssal Key ×25 | A$99.99 | 25× Abyssal Key (20% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-017 | Abyssal Key ×50 | A$187.99 | 50× Abyssal Key (25% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-018 | Abyssal Key ×100 | A$349.99 | 100× Abyssal Key (30% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-019 | Dreadforge Key ×1 | A$6.99 | 1× Dreadforge Key | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-020 | Dreadforge Key ×5 | A$31.99 | 5× Dreadforge Key (10% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-021 | Dreadforge Key ×10 | A$59.99 | 10× Dreadforge Key (15% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-022 | Dreadforge Key ×25 | A$139.99 | 25× Dreadforge Key (20% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-023 | Dreadforge Key ×50 | A$262.99 | 50× Dreadforge Key (25% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-024 | Dreadforge Key ×100 | A$489.99 | 100× Dreadforge Key (30% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-025 | Regalia Key ×1 | A$9.99 | 1× Regalia Key | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-026 | Regalia Key ×5 | A$44.99 | 5× Regalia Key (10% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-027 | Regalia Key ×10 | A$84.99 | 10× Regalia Key (15% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-028 | Regalia Key ×25 | A$199.99 | 25× Regalia Key (20% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-029 | Regalia Key ×50 | A$374.99 | 50× Regalia Key (25% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-030 | Regalia Key ×100 | A$699.99 | 100× Regalia Key (30% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-031 | Throne Key ×1 | A$14.99 | 1× Throne Key | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-032 | Throne Key ×5 | A$67.99 | 5× Throne Key (10% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-033 | Throne Key ×10 | A$127.99 | 10× Throne Key (15% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-034 | Throne Key ×25 | A$299.99 | 25× Throne Key (20% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-035 | Throne Key ×50 | A$562.99 | 50× Throne Key (25% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-036 | Throne Key ×100 | A$1049.99 | 100× Throne Key (30% bulk saving) | Safe (cosmetic pool) · Risky if the optional gear pool is used |
| KEY-037 | Gate Key Sampler | A$29.99 | 1× Ember Key; 1× Bloodmoon Key; 1× Abyssal Key; 1× Dreadforge Key; 1× Regalia Key; 1× Throne Key | Safe (cosmetic pool) · Risky if the gear pool is used |
| KEY-038 | Lower Gates Key Cache | A$24.99 | 5× Ember Key; 3× Bloodmoon Key; 2× Abyssal Key | Safe (cosmetic pool) · Risky if the gear pool is used |
| KEY-039 | High Gates Key Vault | A$89.99 | 3× Dreadforge Key; 3× Regalia Key; 3× Throne Key | Safe (cosmetic pool) · Risky if the gear pool is used |

<details><summary>Tebex descriptions (Crate Keys)</summary>

**KEY-001: Ember Key ×1**
```
🗝️ EMBER KEY ×1

Embers drift up from the cracked earth wherever a Gate has opened. Hunters gather them by the handful.

Opens the Ember Crate (Common). Rewards and odds:
• Common (62%): 150–300 Throne Shards; Common trails and chat tags
• Rare (27%): 400–600 Throne Shards; Rare particles and titles
• Epic (8%): 1,000 Throne Shards; Epic kill and death effects
• Legendary (2.5%): 2,500 Throne Shards; Legendary auras
• Mythic (0.5%): Jackpot: Ashen Halo aura (crate exclusive)

Jackpot: Ashen Halo – a slow-turning ring of ash and amber embers above the head.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-002: Ember Key ×5**
```
🗝️ EMBER KEY ×5

Embers drift up from the cracked earth wherever a Gate has opened. Hunters gather them by the handful.

Opens the Ember Crate (Common). Rewards and odds:
• Common (62%): 150–300 Throne Shards; Common trails and chat tags
• Rare (27%): 400–600 Throne Shards; Rare particles and titles
• Epic (8%): 1,000 Throne Shards; Epic kill and death effects
• Legendary (2.5%): 2,500 Throne Shards; Legendary auras
• Mythic (0.5%): Jackpot: Ashen Halo aura (crate exclusive)

Jackpot: Ashen Halo – a slow-turning ring of ash and amber embers above the head.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-003: Ember Key ×10**
```
🗝️ EMBER KEY ×10

Embers drift up from the cracked earth wherever a Gate has opened. Hunters gather them by the handful.

Opens the Ember Crate (Common). Rewards and odds:
• Common (62%): 150–300 Throne Shards; Common trails and chat tags
• Rare (27%): 400–600 Throne Shards; Rare particles and titles
• Epic (8%): 1,000 Throne Shards; Epic kill and death effects
• Legendary (2.5%): 2,500 Throne Shards; Legendary auras
• Mythic (0.5%): Jackpot: Ashen Halo aura (crate exclusive)

Jackpot: Ashen Halo – a slow-turning ring of ash and amber embers above the head.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-004: Ember Key ×25**
```
🗝️ EMBER KEY ×25

Embers drift up from the cracked earth wherever a Gate has opened. Hunters gather them by the handful.

Opens the Ember Crate (Common). Rewards and odds:
• Common (62%): 150–300 Throne Shards; Common trails and chat tags
• Rare (27%): 400–600 Throne Shards; Rare particles and titles
• Epic (8%): 1,000 Throne Shards; Epic kill and death effects
• Legendary (2.5%): 2,500 Throne Shards; Legendary auras
• Mythic (0.5%): Jackpot: Ashen Halo aura (crate exclusive)

Jackpot: Ashen Halo – a slow-turning ring of ash and amber embers above the head.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-005: Ember Key ×50**
```
🗝️ EMBER KEY ×50

Embers drift up from the cracked earth wherever a Gate has opened. Hunters gather them by the handful.

Opens the Ember Crate (Common). Rewards and odds:
• Common (62%): 150–300 Throne Shards; Common trails and chat tags
• Rare (27%): 400–600 Throne Shards; Rare particles and titles
• Epic (8%): 1,000 Throne Shards; Epic kill and death effects
• Legendary (2.5%): 2,500 Throne Shards; Legendary auras
• Mythic (0.5%): Jackpot: Ashen Halo aura (crate exclusive)

Jackpot: Ashen Halo – a slow-turning ring of ash and amber embers above the head.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-006: Ember Key ×100**
```
🗝️ EMBER KEY ×100

Embers drift up from the cracked earth wherever a Gate has opened. Hunters gather them by the handful.

Opens the Ember Crate (Common). Rewards and odds:
• Common (62%): 150–300 Throne Shards; Common trails and chat tags
• Rare (27%): 400–600 Throne Shards; Rare particles and titles
• Epic (8%): 1,000 Throne Shards; Epic kill and death effects
• Legendary (2.5%): 2,500 Throne Shards; Legendary auras
• Mythic (0.5%): Jackpot: Ashen Halo aura (crate exclusive)

Jackpot: Ashen Halo – a slow-turning ring of ash and amber embers above the head.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-007: Bloodmoon Key ×1**
```
🗝️ BLOODMOON KEY ×1

When the moon bleeds, the Gates widen. Bloodmoon Crates wash up in the red light, sealed with old wax.

Opens the Bloodmoon Crate (Uncommon). Rewards and odds:
• Common (55%): 250–500 Throne Shards; Common and Rare cosmetics
• Rare (30%): 600–900 Throne Shards; Rare titles, tags and trails
• Epic (11%): 1,500 Throne Shards; Epic kill effects and teleport effects
• Legendary (3.4%): 3,500 Throne Shards; Legendary auras and pets
• Mythic (0.6%): Jackpot: Bloodmoon Eclipse aura (crate exclusive)

Jackpot: Bloodmoon Eclipse – a red moon eclipses behind the player while crimson light pulses outward.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-008: Bloodmoon Key ×5**
```
🗝️ BLOODMOON KEY ×5

When the moon bleeds, the Gates widen. Bloodmoon Crates wash up in the red light, sealed with old wax.

Opens the Bloodmoon Crate (Uncommon). Rewards and odds:
• Common (55%): 250–500 Throne Shards; Common and Rare cosmetics
• Rare (30%): 600–900 Throne Shards; Rare titles, tags and trails
• Epic (11%): 1,500 Throne Shards; Epic kill effects and teleport effects
• Legendary (3.4%): 3,500 Throne Shards; Legendary auras and pets
• Mythic (0.6%): Jackpot: Bloodmoon Eclipse aura (crate exclusive)

Jackpot: Bloodmoon Eclipse – a red moon eclipses behind the player while crimson light pulses outward.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-009: Bloodmoon Key ×10**
```
🗝️ BLOODMOON KEY ×10

When the moon bleeds, the Gates widen. Bloodmoon Crates wash up in the red light, sealed with old wax.

Opens the Bloodmoon Crate (Uncommon). Rewards and odds:
• Common (55%): 250–500 Throne Shards; Common and Rare cosmetics
• Rare (30%): 600–900 Throne Shards; Rare titles, tags and trails
• Epic (11%): 1,500 Throne Shards; Epic kill effects and teleport effects
• Legendary (3.4%): 3,500 Throne Shards; Legendary auras and pets
• Mythic (0.6%): Jackpot: Bloodmoon Eclipse aura (crate exclusive)

Jackpot: Bloodmoon Eclipse – a red moon eclipses behind the player while crimson light pulses outward.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-010: Bloodmoon Key ×25**
```
🗝️ BLOODMOON KEY ×25

When the moon bleeds, the Gates widen. Bloodmoon Crates wash up in the red light, sealed with old wax.

Opens the Bloodmoon Crate (Uncommon). Rewards and odds:
• Common (55%): 250–500 Throne Shards; Common and Rare cosmetics
• Rare (30%): 600–900 Throne Shards; Rare titles, tags and trails
• Epic (11%): 1,500 Throne Shards; Epic kill effects and teleport effects
• Legendary (3.4%): 3,500 Throne Shards; Legendary auras and pets
• Mythic (0.6%): Jackpot: Bloodmoon Eclipse aura (crate exclusive)

Jackpot: Bloodmoon Eclipse – a red moon eclipses behind the player while crimson light pulses outward.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-011: Bloodmoon Key ×50**
```
🗝️ BLOODMOON KEY ×50

When the moon bleeds, the Gates widen. Bloodmoon Crates wash up in the red light, sealed with old wax.

Opens the Bloodmoon Crate (Uncommon). Rewards and odds:
• Common (55%): 250–500 Throne Shards; Common and Rare cosmetics
• Rare (30%): 600–900 Throne Shards; Rare titles, tags and trails
• Epic (11%): 1,500 Throne Shards; Epic kill effects and teleport effects
• Legendary (3.4%): 3,500 Throne Shards; Legendary auras and pets
• Mythic (0.6%): Jackpot: Bloodmoon Eclipse aura (crate exclusive)

Jackpot: Bloodmoon Eclipse – a red moon eclipses behind the player while crimson light pulses outward.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-012: Bloodmoon Key ×100**
```
🗝️ BLOODMOON KEY ×100

When the moon bleeds, the Gates widen. Bloodmoon Crates wash up in the red light, sealed with old wax.

Opens the Bloodmoon Crate (Uncommon). Rewards and odds:
• Common (55%): 250–500 Throne Shards; Common and Rare cosmetics
• Rare (30%): 600–900 Throne Shards; Rare titles, tags and trails
• Epic (11%): 1,500 Throne Shards; Epic kill effects and teleport effects
• Legendary (3.4%): 3,500 Throne Shards; Legendary auras and pets
• Mythic (0.6%): Jackpot: Bloodmoon Eclipse aura (crate exclusive)

Jackpot: Bloodmoon Eclipse – a red moon eclipses behind the player while crimson light pulses outward.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-013: Abyssal Key ×1**
```
🗝️ ABYSSAL KEY ×1

Dredged from the bottom of the deepest Gates, where light forgets itself.

Opens the Abyssal Crate (Rare). Rewards and odds:
• Common (48%): 400–700 Throne Shards; Rare cosmetics
• Rare (32%): 900–1,200 Throne Shards; Epic trails and particles
• Epic (14%): 2,000 Throne Shards; Epic pets and teleport effects
• Legendary (5%): 5,000 Throne Shards; Legendary weapon skins
• Mythic (1%): Jackpot: Voidborn Wraith pet (crate exclusive)

Jackpot: Voidborn Wraith – a cosmetic shadow-wraith companion trailing violet mist.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-014: Abyssal Key ×5**
```
🗝️ ABYSSAL KEY ×5

Dredged from the bottom of the deepest Gates, where light forgets itself.

Opens the Abyssal Crate (Rare). Rewards and odds:
• Common (48%): 400–700 Throne Shards; Rare cosmetics
• Rare (32%): 900–1,200 Throne Shards; Epic trails and particles
• Epic (14%): 2,000 Throne Shards; Epic pets and teleport effects
• Legendary (5%): 5,000 Throne Shards; Legendary weapon skins
• Mythic (1%): Jackpot: Voidborn Wraith pet (crate exclusive)

Jackpot: Voidborn Wraith – a cosmetic shadow-wraith companion trailing violet mist.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-015: Abyssal Key ×10**
```
🗝️ ABYSSAL KEY ×10

Dredged from the bottom of the deepest Gates, where light forgets itself.

Opens the Abyssal Crate (Rare). Rewards and odds:
• Common (48%): 400–700 Throne Shards; Rare cosmetics
• Rare (32%): 900–1,200 Throne Shards; Epic trails and particles
• Epic (14%): 2,000 Throne Shards; Epic pets and teleport effects
• Legendary (5%): 5,000 Throne Shards; Legendary weapon skins
• Mythic (1%): Jackpot: Voidborn Wraith pet (crate exclusive)

Jackpot: Voidborn Wraith – a cosmetic shadow-wraith companion trailing violet mist.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-016: Abyssal Key ×25**
```
🗝️ ABYSSAL KEY ×25

Dredged from the bottom of the deepest Gates, where light forgets itself.

Opens the Abyssal Crate (Rare). Rewards and odds:
• Common (48%): 400–700 Throne Shards; Rare cosmetics
• Rare (32%): 900–1,200 Throne Shards; Epic trails and particles
• Epic (14%): 2,000 Throne Shards; Epic pets and teleport effects
• Legendary (5%): 5,000 Throne Shards; Legendary weapon skins
• Mythic (1%): Jackpot: Voidborn Wraith pet (crate exclusive)

Jackpot: Voidborn Wraith – a cosmetic shadow-wraith companion trailing violet mist.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-017: Abyssal Key ×50**
```
🗝️ ABYSSAL KEY ×50

Dredged from the bottom of the deepest Gates, where light forgets itself.

Opens the Abyssal Crate (Rare). Rewards and odds:
• Common (48%): 400–700 Throne Shards; Rare cosmetics
• Rare (32%): 900–1,200 Throne Shards; Epic trails and particles
• Epic (14%): 2,000 Throne Shards; Epic pets and teleport effects
• Legendary (5%): 5,000 Throne Shards; Legendary weapon skins
• Mythic (1%): Jackpot: Voidborn Wraith pet (crate exclusive)

Jackpot: Voidborn Wraith – a cosmetic shadow-wraith companion trailing violet mist.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-018: Abyssal Key ×100**
```
🗝️ ABYSSAL KEY ×100

Dredged from the bottom of the deepest Gates, where light forgets itself.

Opens the Abyssal Crate (Rare). Rewards and odds:
• Common (48%): 400–700 Throne Shards; Rare cosmetics
• Rare (32%): 900–1,200 Throne Shards; Epic trails and particles
• Epic (14%): 2,000 Throne Shards; Epic pets and teleport effects
• Legendary (5%): 5,000 Throne Shards; Legendary weapon skins
• Mythic (1%): Jackpot: Voidborn Wraith pet (crate exclusive)

Jackpot: Voidborn Wraith – a cosmetic shadow-wraith companion trailing violet mist.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-019: Dreadforge Key ×1**
```
🗝️ DREADFORGE KEY ×1

Hammered in the forges beneath Netherfall, where the dead still work the bellows.

Opens the Dreadforge Crate (Epic). Rewards and odds:
• Common (40%): 600–900 Throne Shards; Epic cosmetics
• Rare (34%): 1,200–1,600 Throne Shards; Epic armour and weapon skins
• Epic (18%): 2,500 Throne Shards; Legendary kill effects
• Legendary (6.5%): 6,000 Throne Shards; Legendary armour skin sets
• Mythic (1.5%): Jackpot: Molten Throne armour skin set (crate exclusive)

Jackpot: Molten Throne – a cosmetic armour skin set with glowing magma seams.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-020: Dreadforge Key ×5**
```
🗝️ DREADFORGE KEY ×5

Hammered in the forges beneath Netherfall, where the dead still work the bellows.

Opens the Dreadforge Crate (Epic). Rewards and odds:
• Common (40%): 600–900 Throne Shards; Epic cosmetics
• Rare (34%): 1,200–1,600 Throne Shards; Epic armour and weapon skins
• Epic (18%): 2,500 Throne Shards; Legendary kill effects
• Legendary (6.5%): 6,000 Throne Shards; Legendary armour skin sets
• Mythic (1.5%): Jackpot: Molten Throne armour skin set (crate exclusive)

Jackpot: Molten Throne – a cosmetic armour skin set with glowing magma seams.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-021: Dreadforge Key ×10**
```
🗝️ DREADFORGE KEY ×10

Hammered in the forges beneath Netherfall, where the dead still work the bellows.

Opens the Dreadforge Crate (Epic). Rewards and odds:
• Common (40%): 600–900 Throne Shards; Epic cosmetics
• Rare (34%): 1,200–1,600 Throne Shards; Epic armour and weapon skins
• Epic (18%): 2,500 Throne Shards; Legendary kill effects
• Legendary (6.5%): 6,000 Throne Shards; Legendary armour skin sets
• Mythic (1.5%): Jackpot: Molten Throne armour skin set (crate exclusive)

Jackpot: Molten Throne – a cosmetic armour skin set with glowing magma seams.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-022: Dreadforge Key ×25**
```
🗝️ DREADFORGE KEY ×25

Hammered in the forges beneath Netherfall, where the dead still work the bellows.

Opens the Dreadforge Crate (Epic). Rewards and odds:
• Common (40%): 600–900 Throne Shards; Epic cosmetics
• Rare (34%): 1,200–1,600 Throne Shards; Epic armour and weapon skins
• Epic (18%): 2,500 Throne Shards; Legendary kill effects
• Legendary (6.5%): 6,000 Throne Shards; Legendary armour skin sets
• Mythic (1.5%): Jackpot: Molten Throne armour skin set (crate exclusive)

Jackpot: Molten Throne – a cosmetic armour skin set with glowing magma seams.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-023: Dreadforge Key ×50**
```
🗝️ DREADFORGE KEY ×50

Hammered in the forges beneath Netherfall, where the dead still work the bellows.

Opens the Dreadforge Crate (Epic). Rewards and odds:
• Common (40%): 600–900 Throne Shards; Epic cosmetics
• Rare (34%): 1,200–1,600 Throne Shards; Epic armour and weapon skins
• Epic (18%): 2,500 Throne Shards; Legendary kill effects
• Legendary (6.5%): 6,000 Throne Shards; Legendary armour skin sets
• Mythic (1.5%): Jackpot: Molten Throne armour skin set (crate exclusive)

Jackpot: Molten Throne – a cosmetic armour skin set with glowing magma seams.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-024: Dreadforge Key ×100**
```
🗝️ DREADFORGE KEY ×100

Hammered in the forges beneath Netherfall, where the dead still work the bellows.

Opens the Dreadforge Crate (Epic). Rewards and odds:
• Common (40%): 600–900 Throne Shards; Epic cosmetics
• Rare (34%): 1,200–1,600 Throne Shards; Epic armour and weapon skins
• Epic (18%): 2,500 Throne Shards; Legendary kill effects
• Legendary (6.5%): 6,000 Throne Shards; Legendary armour skin sets
• Mythic (1.5%): Jackpot: Molten Throne armour skin set (crate exclusive)

Jackpot: Molten Throne – a cosmetic armour skin set with glowing magma seams.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-025: Regalia Key ×1**
```
🗝️ REGALIA KEY ×1

Treasures of fallen kings: sceptres, signets and stolen crowns, sealed in gold for whoever claims them next.

Opens the Regalia Crate (Legendary). Rewards and odds:
• Common (30%): 900–1,300 Throne Shards; Epic cosmetics
• Rare (36%): 1,800–2,400 Throne Shards; Legendary titles and tags
• Epic (22%): 3,500 Throne Shards; Legendary pets and auras
• Legendary (9.5%): 8,000 Throne Shards; Mythic chat and teleport effects
• Mythic (2.5%): Jackpot: Gilded Regalia weapon skin set (crate exclusive)

Jackpot: Gilded Regalia – a set of cosmetic weapon skins in black steel and gold filigree.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-026: Regalia Key ×5**
```
🗝️ REGALIA KEY ×5

Treasures of fallen kings: sceptres, signets and stolen crowns, sealed in gold for whoever claims them next.

Opens the Regalia Crate (Legendary). Rewards and odds:
• Common (30%): 900–1,300 Throne Shards; Epic cosmetics
• Rare (36%): 1,800–2,400 Throne Shards; Legendary titles and tags
• Epic (22%): 3,500 Throne Shards; Legendary pets and auras
• Legendary (9.5%): 8,000 Throne Shards; Mythic chat and teleport effects
• Mythic (2.5%): Jackpot: Gilded Regalia weapon skin set (crate exclusive)

Jackpot: Gilded Regalia – a set of cosmetic weapon skins in black steel and gold filigree.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-027: Regalia Key ×10**
```
🗝️ REGALIA KEY ×10

Treasures of fallen kings: sceptres, signets and stolen crowns, sealed in gold for whoever claims them next.

Opens the Regalia Crate (Legendary). Rewards and odds:
• Common (30%): 900–1,300 Throne Shards; Epic cosmetics
• Rare (36%): 1,800–2,400 Throne Shards; Legendary titles and tags
• Epic (22%): 3,500 Throne Shards; Legendary pets and auras
• Legendary (9.5%): 8,000 Throne Shards; Mythic chat and teleport effects
• Mythic (2.5%): Jackpot: Gilded Regalia weapon skin set (crate exclusive)

Jackpot: Gilded Regalia – a set of cosmetic weapon skins in black steel and gold filigree.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-028: Regalia Key ×25**
```
🗝️ REGALIA KEY ×25

Treasures of fallen kings: sceptres, signets and stolen crowns, sealed in gold for whoever claims them next.

Opens the Regalia Crate (Legendary). Rewards and odds:
• Common (30%): 900–1,300 Throne Shards; Epic cosmetics
• Rare (36%): 1,800–2,400 Throne Shards; Legendary titles and tags
• Epic (22%): 3,500 Throne Shards; Legendary pets and auras
• Legendary (9.5%): 8,000 Throne Shards; Mythic chat and teleport effects
• Mythic (2.5%): Jackpot: Gilded Regalia weapon skin set (crate exclusive)

Jackpot: Gilded Regalia – a set of cosmetic weapon skins in black steel and gold filigree.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-029: Regalia Key ×50**
```
🗝️ REGALIA KEY ×50

Treasures of fallen kings: sceptres, signets and stolen crowns, sealed in gold for whoever claims them next.

Opens the Regalia Crate (Legendary). Rewards and odds:
• Common (30%): 900–1,300 Throne Shards; Epic cosmetics
• Rare (36%): 1,800–2,400 Throne Shards; Legendary titles and tags
• Epic (22%): 3,500 Throne Shards; Legendary pets and auras
• Legendary (9.5%): 8,000 Throne Shards; Mythic chat and teleport effects
• Mythic (2.5%): Jackpot: Gilded Regalia weapon skin set (crate exclusive)

Jackpot: Gilded Regalia – a set of cosmetic weapon skins in black steel and gold filigree.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-030: Regalia Key ×100**
```
🗝️ REGALIA KEY ×100

Treasures of fallen kings: sceptres, signets and stolen crowns, sealed in gold for whoever claims them next.

Opens the Regalia Crate (Legendary). Rewards and odds:
• Common (30%): 900–1,300 Throne Shards; Epic cosmetics
• Rare (36%): 1,800–2,400 Throne Shards; Legendary titles and tags
• Epic (22%): 3,500 Throne Shards; Legendary pets and auras
• Legendary (9.5%): 8,000 Throne Shards; Mythic chat and teleport effects
• Mythic (2.5%): Jackpot: Gilded Regalia weapon skin set (crate exclusive)

Jackpot: Gilded Regalia – a set of cosmetic weapon skins in black steel and gold filigree.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-031: Throne Key ×1**
```
🗝️ THRONE KEY ×1

There is only one throne. Every Throne Crate holds a fragment of it.

Opens the Throne Crate (Mythic). Rewards and odds:
• Common (20%): 1,500–2,000 Throne Shards; Legendary cosmetics
• Rare (35%): 3,000 Throne Shards; Legendary auras and pets
• Epic (28%): 5,000 Throne Shards; Mythic effects
• Legendary (13%): 12,000 Throne Shards; Mythic armour skin sets
• Mythic (4%): Jackpot: The Empty Throne aura + title “Throne Taker” (crate exclusive)

Jackpot: The Empty Throne – a spectral broken throne rises behind the player; awards the title “Throne Taker”.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-032: Throne Key ×5**
```
🗝️ THRONE KEY ×5

There is only one throne. Every Throne Crate holds a fragment of it.

Opens the Throne Crate (Mythic). Rewards and odds:
• Common (20%): 1,500–2,000 Throne Shards; Legendary cosmetics
• Rare (35%): 3,000 Throne Shards; Legendary auras and pets
• Epic (28%): 5,000 Throne Shards; Mythic effects
• Legendary (13%): 12,000 Throne Shards; Mythic armour skin sets
• Mythic (4%): Jackpot: The Empty Throne aura + title “Throne Taker” (crate exclusive)

Jackpot: The Empty Throne – a spectral broken throne rises behind the player; awards the title “Throne Taker”.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-033: Throne Key ×10**
```
🗝️ THRONE KEY ×10

There is only one throne. Every Throne Crate holds a fragment of it.

Opens the Throne Crate (Mythic). Rewards and odds:
• Common (20%): 1,500–2,000 Throne Shards; Legendary cosmetics
• Rare (35%): 3,000 Throne Shards; Legendary auras and pets
• Epic (28%): 5,000 Throne Shards; Mythic effects
• Legendary (13%): 12,000 Throne Shards; Mythic armour skin sets
• Mythic (4%): Jackpot: The Empty Throne aura + title “Throne Taker” (crate exclusive)

Jackpot: The Empty Throne – a spectral broken throne rises behind the player; awards the title “Throne Taker”.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-034: Throne Key ×25**
```
🗝️ THRONE KEY ×25

There is only one throne. Every Throne Crate holds a fragment of it.

Opens the Throne Crate (Mythic). Rewards and odds:
• Common (20%): 1,500–2,000 Throne Shards; Legendary cosmetics
• Rare (35%): 3,000 Throne Shards; Legendary auras and pets
• Epic (28%): 5,000 Throne Shards; Mythic effects
• Legendary (13%): 12,000 Throne Shards; Mythic armour skin sets
• Mythic (4%): Jackpot: The Empty Throne aura + title “Throne Taker” (crate exclusive)

Jackpot: The Empty Throne – a spectral broken throne rises behind the player; awards the title “Throne Taker”.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-035: Throne Key ×50**
```
🗝️ THRONE KEY ×50

There is only one throne. Every Throne Crate holds a fragment of it.

Opens the Throne Crate (Mythic). Rewards and odds:
• Common (20%): 1,500–2,000 Throne Shards; Legendary cosmetics
• Rare (35%): 3,000 Throne Shards; Legendary auras and pets
• Epic (28%): 5,000 Throne Shards; Mythic effects
• Legendary (13%): 12,000 Throne Shards; Mythic armour skin sets
• Mythic (4%): Jackpot: The Empty Throne aura + title “Throne Taker” (crate exclusive)

Jackpot: The Empty Throne – a spectral broken throne rises behind the player; awards the title “Throne Taker”.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-036: Throne Key ×100**
```
🗝️ THRONE KEY ×100

There is only one throne. Every Throne Crate holds a fragment of it.

Opens the Throne Crate (Mythic). Rewards and odds:
• Common (20%): 1,500–2,000 Throne Shards; Legendary cosmetics
• Rare (35%): 3,000 Throne Shards; Legendary auras and pets
• Epic (28%): 5,000 Throne Shards; Mythic effects
• Legendary (13%): 12,000 Throne Shards; Mythic armour skin sets
• Mythic (4%): Jackpot: The Empty Throne aura + title “Throne Taker” (crate exclusive)

Jackpot: The Empty Throne – a spectral broken throne rises behind the player; awards the title “Throne Taker”.
Duplicate cosmetics convert to Throne Shards. Keys can also be earned in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-037: Gate Key Sampler**
```
🗝️ GATE KEY SAMPLER

One key for every Gate Crate – try them all.

• 1× Ember Key
• 1× Bloodmoon Key
• 1× Abyssal Key
• 1× Dreadforge Key
• 1× Regalia Key
• 1× Throne Key

See each crate key for rewards and odds.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-038: Lower Gates Key Cache**
```
🗝️ LOWER GATES KEY CACHE

A mix of Ember, Bloodmoon and Abyssal keys.

• 5× Ember Key
• 3× Bloodmoon Key
• 2× Abyssal Key

See each crate key for rewards and odds.

Delivered automatically in-game. Questions? Join our Discord.
```

**KEY-039: High Gates Key Vault**
```
🗝️ HIGH GATES KEY VAULT

Dreadforge, Regalia and Throne keys for the prestige crates.

• 3× Dreadforge Key
• 3× Regalia Key
• 3× Throne Key

See each crate key for rewards and odds.

Delivered automatically in-game. Questions? Join our Discord.
```

</details>

### Throne Shards (7)

Premium cosmetic currency, spent in the in-game Throne Vault.

| ID | Package | Price | Contents | Compliance |
|---|---|---|---|---|
| SHARD-001 | Shard Pouch: 1,000 Throne Shards | A$4.99 | 1,000 Throne Shards | Safe |
| SHARD-002 | Shard Satchel: 2,500 Throne Shards | A$11.99 | 2,500 Throne Shards + 5% bonus = 2,625 | Safe |
| SHARD-003 | Shard Coffer: 5,000 Throne Shards | A$22.99 | 5,000 Throne Shards + 10% bonus = 5,500 | Safe |
| SHARD-004 | Shard Chest: 10,000 Throne Shards | A$44.99 | 10,000 Throne Shards + 15% bonus = 11,500 | Safe |
| SHARD-005 | Shard Vault: 25,000 Throne Shards | A$104.99 | 25,000 Throne Shards + 20% bonus = 30,000 | Safe |
| SHARD-006 | Shard Hoard: 50,000 Throne Shards | A$199.99 | 50,000 Throne Shards + 25% bonus = 62,500 | Safe |
| SHARD-007 | Throne Treasury: 100,000 Throne Shards | A$379.99 | 100,000 Throne Shards + 30% bonus = 130,000 | Safe |

<details><summary>Tebex descriptions (Throne Shards)</summary>

**SHARD-001: Shard Pouch: 1,000 Throne Shards**
```
💎 1,000 THRONE SHARDS

1,000 Throne Shards.

Spend Throne Shards in the in-game Throne Vault on auras, trails, titles, pets, skins and more.
Throne Shards can only be spent on cosmetics.

Delivered automatically in-game. Questions? Join our Discord.
```

**SHARD-002: Shard Satchel: 2,500 Throne Shards**
```
💎 2,625 THRONE SHARDS

2,500 Throne Shards + 5% BONUS (125 extra).

Spend Throne Shards in the in-game Throne Vault on auras, trails, titles, pets, skins and more.
Throne Shards can only be spent on cosmetics.

Delivered automatically in-game. Questions? Join our Discord.
```

**SHARD-003: Shard Coffer: 5,000 Throne Shards**
```
💎 5,500 THRONE SHARDS

5,000 Throne Shards + 10% BONUS (500 extra).

Spend Throne Shards in the in-game Throne Vault on auras, trails, titles, pets, skins and more.
Throne Shards can only be spent on cosmetics.

Delivered automatically in-game. Questions? Join our Discord.
```

**SHARD-004: Shard Chest: 10,000 Throne Shards**
```
💎 11,500 THRONE SHARDS

10,000 Throne Shards + 15% BONUS (1,500 extra).

Spend Throne Shards in the in-game Throne Vault on auras, trails, titles, pets, skins and more.
Throne Shards can only be spent on cosmetics.

Delivered automatically in-game. Questions? Join our Discord.
```

**SHARD-005: Shard Vault: 25,000 Throne Shards**
```
💎 30,000 THRONE SHARDS

25,000 Throne Shards + 20% BONUS (5,000 extra).

Spend Throne Shards in the in-game Throne Vault on auras, trails, titles, pets, skins and more.
Throne Shards can only be spent on cosmetics.

Delivered automatically in-game. Questions? Join our Discord.
```

**SHARD-006: Shard Hoard: 50,000 Throne Shards**
```
💎 62,500 THRONE SHARDS

50,000 Throne Shards + 25% BONUS (12,500 extra).

Spend Throne Shards in the in-game Throne Vault on auras, trails, titles, pets, skins and more.
Throne Shards can only be spent on cosmetics.

Delivered automatically in-game. Questions? Join our Discord.
```

**SHARD-007: Throne Treasury: 100,000 Throne Shards**
```
💎 130,000 THRONE SHARDS

100,000 Throne Shards + 30% BONUS (30,000 extra).

Spend Throne Shards in the in-game Throne Vault on auras, trails, titles, pets, skins and more.
Throne Shards can only be spent on cosmetics.

Delivered automatically in-game. Questions? Join our Discord.
```

</details>

### Bundles (12)

Best-value combinations of ranks, keys, shards and cosmetics.

| ID | Package | Price | Contents | Compliance |
|---|---|---|---|---|
| BND-001 | Hunter's Oath | A$21.99 | 5× Ember Key; 2× Bloodmoon Key; 2,500 Throne Shards; Crimson Hunter (Title); Ember Wake (Trail) | Safe |
| BND-002 | Gatebreaker's Cache | A$38.99 | 5× Abyssal Key; 5,000 Throne Shards; Gatebreaker (Title); Blood Rift (Teleport Effect) | Safe |
| BND-003 | Bloodmoon Covenant | A$45.99 | 10× Bloodmoon Key; 5,000 Throne Shards; Bloodstep (Trail); Bloodmoon Blade (Weapon Skin) | Safe |
| BND-004 | Abyss Walker | A$74.99 | 10× Abyssal Key; 7,500 Throne Shards; Abyssal Scythe (Weapon Skin); Abyssal Flame (Aura) | Safe |
| BND-005 | Dreadforge Arsenal | A$79.99 | 10× Dreadforge Key; 7,500 Throne Shards; Dreadforge Plate (Armour Skin); Ashen Charger (Mount Skin) | Safe |
| BND-006 | Regalia Trove | A$108.99 | 10× Regalia Key; 10,000 Throne Shards; Gilded Name Shimmer (Chat Effect); Obsidian Crown (Aura) | Safe |
| BND-007 | Crimson Court | A$41.99 | 5× Bloodmoon Key; 5,000 Throne Shards; Crimson Warden (Armour Skin); Crimson Halo (Aura); Crimson Gradient (Chat Effect) | Safe |
| BND-008 | Ashen Legion | A$44.99 | 10× Ember Key; 5× Bloodmoon Key; 3,000 Throne Shards; Ashen Collapse (Death Effect); Blade Salute (Emote); Ashborn (Title) | Safe |
| BND-009 | Apex Predator | A$156.99 | 5× Throne Key; 5× Regalia Key; 15,000 Throne Shards; Throne Edge (Weapon Skin); Nightmare Steed (Mount Skin); Void Hatchling (Pet) | Safe |
| BND-010 | The Overthrone | A$362.99 | Overlord rank; 10× Throne Key; 10× Regalia Key; 25,000 Throne Shards; Abyssal Flame (Aura); Throne Edge (Weapon Skin); Void Hatchling (Pet) | Borderline (includes a rank) |
| BND-011 | Collector's Ascension | A$142.99 | Overlord rank; 5× Dreadforge Key; 7,500 Throne Shards; Obsidian Raven (Pet) | Borderline (includes a rank) |
| BND-012 | Champion's Rise | A$60.99 | Champion rank; 5× Abyssal Key; 3,000 Throne Shards; Throne Shatter (Kill Effect) | Borderline (includes a rank) |

<details><summary>Tebex descriptions (Bundles)</summary>

**BND-001: Hunter's Oath**
```
📦 HUNTER'S OATH

Swear the oath. Start strong with keys, shards and your first title.

CONTAINS:
• 5× Ember Key
• 2× Bloodmoon Key
• 2,500 Throne Shards
• Crimson Hunter (Title)
• Ember Wake (Trail)

Worth A$35.39: save 38%.

Delivered automatically in-game. Questions? Join our Discord.
```

**BND-002: Gatebreaker's Cache**
```
📦 GATEBREAKER'S CACHE

For those who break Gates open: Abyssal keys, a Gatebreaker title and a rift teleport.

CONTAINS:
• 5× Abyssal Key
• 5,000 Throne Shards
• Gatebreaker (Title)
• Blood Rift (Teleport Effect)

Worth A$62.88: save 38%.

Delivered automatically in-game. Questions? Join our Discord.
```

**BND-003: Bloodmoon Covenant**
```
📦 BLOODMOON COVENANT

Everything under the red moon: Bloodmoon keys, the Bloodstep trail and the Bloodmoon Blade.

CONTAINS:
• 10× Bloodmoon Key
• 5,000 Throne Shards
• Bloodstep (Trail)
• Bloodmoon Blade (Weapon Skin)

Worth A$72.83: save 37%.

Delivered automatically in-game. Questions? Join our Discord.
```

**BND-004: Abyss Walker**
```
📦 ABYSS WALKER

Walk where light forgets itself: Abyssal keys, the Abyssal Scythe and the Abyssal Flame aura.

CONTAINS:
• 10× Abyssal Key
• 7,500 Throne Shards
• Abyssal Scythe (Weapon Skin)
• Abyssal Flame (Aura)

Worth A$120.31: save 38%.

Delivered automatically in-game. Questions? Join our Discord.
```

**BND-005: Dreadforge Arsenal**
```
📦 DREADFORGE ARSENAL

Forged beneath Netherfall: Dreadforge keys and the full Dreadforge Plate skin set.

CONTAINS:
• 10× Dreadforge Key
• 7,500 Throne Shards
• Dreadforge Plate (Armour Skin)
• Ashen Charger (Mount Skin)

Worth A$128.31: save 38%.

Delivered automatically in-game. Questions? Join our Discord.
```

**BND-006: Regalia Trove**
```
📦 REGALIA TROVE

Royal treasure: Regalia keys, a Gilded Name Shimmer and the Obsidian Crown aura.

CONTAINS:
• 10× Regalia Key
• 10,000 Throne Shards
• Gilded Name Shimmer (Chat Effect)
• Obsidian Crown (Aura)

Worth A$175.78: save 38%.

Delivered automatically in-game. Questions? Join our Discord.
```

**BND-007: Crimson Court**
```
📦 CRIMSON COURT

Dress for court: Crimson Warden armour skin, Crimson Halo and Crimson Gradient chat.

CONTAINS:
• 5× Bloodmoon Key
• 5,000 Throne Shards
• Crimson Warden (Armour Skin)
• Crimson Halo (Aura)
• Crimson Gradient (Chat Effect)

Worth A$66.37: save 37%.

Delivered automatically in-game. Questions? Join our Discord.
```

**BND-008: Ashen Legion**
```
📦 ASHEN LEGION

A party pack: 10 Ember Keys for you plus effects to show off with your guild.

CONTAINS:
• 10× Ember Key
• 5× Bloodmoon Key
• 3,000 Throne Shards
• Ashen Collapse (Death Effect)
• Blade Salute (Emote)
• Ashborn (Title)

Worth A$71.29: save 37%.

Delivered automatically in-game. Questions? Join our Discord.
```

**BND-009: Apex Predator**
```
📦 APEX PREDATOR

Endgame collection: Throne keys, Throne Edge, Nightmare Steed and the Void Hatchling.

CONTAINS:
• 5× Throne Key
• 5× Regalia Key
• 15,000 Throne Shards
• Throne Edge (Weapon Skin)
• Nightmare Steed (Mount Skin)
• Void Hatchling (Pet)

Worth A$252.72: save 38%.

Delivered automatically in-game. Questions? Join our Discord.
```

**BND-010: The Overthrone**
```
📦 THE OVERTHRONE

The ultimate package: the Overlord rank plus a mountain of keys, shards and Mythic cosmetics.

CONTAINS:
• Overlord rank
• 10× Throne Key
• 10× Regalia Key
• 25,000 Throne Shards
• Abyssal Flame (Aura)
• Throne Edge (Weapon Skin)
• Void Hatchling (Pet)

Worth A$584.51: save 38%.

Delivered automatically in-game. Questions? Join our Discord.
```

**BND-011: Collector's Ascension**
```
📦 COLLECTOR'S ASCENSION

Rank up and collect: the Overlord rank with extra Dreadforge keys and shards.

CONTAINS:
• Overlord rank
• 5× Dreadforge Key
• 7,500 Throne Shards
• Obsidian Raven (Pet)

Worth A$230.36: save 38%.

Delivered automatically in-game. Questions? Join our Discord.
```

**BND-012: Champion's Rise**
```
📦 CHAMPION'S RISE

Rank up: the Champion rank with Abyssal keys and the Throne Shatter kill effect.

CONTAINS:
• Champion rank
• 5× Abyssal Key
• 3,000 Throne Shards
• Throne Shatter (Kill Effect)

Worth A$97.90: save 38%.

Delivered automatically in-game. Questions? Join our Discord.
```

</details>

### Cosmetics (33)

Auras, trails, effects, titles, skins and more.

| ID | Package | Price | Contents | Compliance |
|---|---|---|---|---|
| COS-001 | Crimson Halo | A$7.99 | Crimson Halo (Aura) | Safe |
| COS-002 | Obsidian Crown | A$12.99 | Obsidian Crown (Aura) | Safe |
| COS-003 | Abyssal Flame | A$19.99 | Abyssal Flame (Aura) | Safe |
| COS-004 | Bloodstep | A$4.99 | Bloodstep (Trail) | Safe |
| COS-005 | Ember Wake | A$2.99 | Ember Wake (Trail) | Safe |
| COS-006 | Shattered Crystal | A$7.99 | Shattered Crystal (Trail) | Safe |
| COS-007 | Falling Ash | A$2.99 | Falling Ash (Particle) | Safe |
| COS-008 | Orbiting Runes | A$4.99 | Orbiting Runes (Particle) | Safe |
| COS-009 | Bloodmoon Eclipse | A$12.99 | Bloodmoon Eclipse (Kill Effect) | Safe |
| COS-010 | Throne Shatter | A$7.99 | Throne Shatter (Kill Effect) | Safe |
| COS-011 | Chainbind | A$4.99 | Chainbind (Kill Effect) | Safe |
| COS-012 | Soul Ascension | A$4.99 | Soul Ascension (Death Effect) | Safe |
| COS-013 | Ashen Collapse | A$7.99 | Ashen Collapse (Death Effect) | Safe |
| COS-014 | Gatebreaker | A$4.99 | Gatebreaker (Title) | Safe |
| COS-015 | Crimson Hunter | A$2.99 | Crimson Hunter (Title) | Safe |
| COS-016 | Ashborn | A$7.99 | Ashborn (Title) | Safe |
| COS-017 | Oathless | A$12.99 | Oathless (Title) | Safe |
| COS-018 | Crimson Sigil | A$4.99 | Crimson Sigil (Chat Tag) | Safe |
| COS-019 | Black Crown | A$7.99 | Black Crown (Chat Tag) | Safe |
| COS-020 | Nightmare Steed | A$12.99 | Nightmare Steed (Mount Skin) | Safe |
| COS-021 | Ashen Charger | A$7.99 | Ashen Charger (Mount Skin) | Safe |
| COS-022 | Bloodmoon Blade | A$7.99 | Bloodmoon Blade (Weapon Skin) | Safe |
| COS-023 | Abyssal Scythe | A$12.99 | Abyssal Scythe (Weapon Skin) | Safe |
| COS-024 | Throne Edge | A$19.99 | Throne Edge (Weapon Skin) | Safe |
| COS-025 | Dreadforge Plate | A$12.99 | Dreadforge Plate (Armour Skin) | Safe |
| COS-026 | Crimson Warden | A$7.99 | Crimson Warden (Armour Skin) | Safe |
| COS-027 | Kneel Before the Throne | A$4.99 | Kneel Before the Throne (Emote) | Safe |
| COS-028 | Blade Salute | A$2.99 | Blade Salute (Emote) | Safe |
| COS-029 | Crimson Arrival | A$7.99 | Crimson Arrival (Spawn Effect) | Safe |
| COS-030 | Blood Rift | A$7.99 | Blood Rift (Teleport Effect) | Safe |
| COS-031 | Shadow Step | A$4.99 | Shadow Step (Teleport Effect) | Safe |
| COS-032 | Crimson Gradient | A$7.99 | Crimson Gradient (Chat Effect) | Safe |
| COS-033 | Gilded Name Shimmer | A$12.99 | Gilded Name Shimmer (Chat Effect) | Safe |

<details><summary>Tebex descriptions (Cosmetics)</summary>

**COS-001: Crimson Halo**
```
✦ CRIMSON HALO · EPIC AURA

A slow ring of crimson light orbits your head, pulsing like a heartbeat.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-002: Obsidian Crown**
```
✦ OBSIDIAN CROWN · LEGENDARY AURA

A spectral crown of black glass hovers above you, shedding crimson sparks.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-003: Abyssal Flame**
```
✦ ABYSSAL FLAME · MYTHIC AURA

Black-violet fire licks upward around you without ever burning.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-004: Bloodstep**
```
✦ BLOODSTEP · RARE TRAIL

Each footstep leaves a fading crimson sigil on the ground.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-005: Ember Wake**
```
✦ EMBER WAKE · COMMON TRAIL

A soft wake of drifting embers follows wherever you walk.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-006: Shattered Crystal**
```
✦ SHATTERED CRYSTAL · EPIC TRAIL

Red crystal shards sprout and shatter behind you.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-007: Falling Ash**
```
✦ FALLING ASH · COMMON PARTICLE

Grey ash drifts down around you like a quiet funeral.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-008: Orbiting Runes**
```
✦ ORBITING RUNES · RARE PARTICLE

Three crimson runes slowly orbit your body.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-009: Bloodmoon Eclipse**
```
✦ BLOODMOON ECLIPSE · LEGENDARY KILL EFFECT

A red moon flashes overhead as your opponent falls.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-010: Throne Shatter**
```
✦ THRONE SHATTER · EPIC KILL EFFECT

A miniature throne appears – and shatters into crimson glass.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-011: Chainbind**
```
✦ CHAINBIND · RARE KILL EFFECT

Spectral chains burst from the ground where they fell.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-012: Soul Ascension**
```
✦ SOUL ASCENSION · RARE DEATH EFFECT

Your soul rises in a pale crimson column when you fall.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-013: Ashen Collapse**
```
✦ ASHEN COLLAPSE · EPIC DEATH EFFECT

You crumble into ash that scatters on the wind.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-014: Gatebreaker**
```
✦ GATEBREAKER · RARE TITLE

Title: “the Gatebreaker”, shown under your name.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-015: Crimson Hunter**
```
✦ CRIMSON HUNTER · COMMON TITLE

Title: “Crimson Hunter”.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-016: Ashborn**
```
✦ ASHBORN · EPIC TITLE

Title: “Ashborn”, glowing with ember edges.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-017: Oathless**
```
✦ OATHLESS · LEGENDARY TITLE

Title: “the Oathless”, with a broken-chain flourish.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-018: Crimson Sigil**
```
✦ CRIMSON SIGIL · RARE CHAT TAG

A crimson sigil tag shown before your name in chat.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-019: Black Crown**
```
✦ BLACK CROWN · EPIC CHAT TAG

A black crown tag in chat and tab.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-020: Nightmare Steed**
```
✦ NIGHTMARE STEED · LEGENDARY MOUNT SKIN

Cosmetic skin for your horse: shadow-black hide and crimson eyes. No stat changes.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-021: Ashen Charger**
```
✦ ASHEN CHARGER · EPIC MOUNT SKIN

Cosmetic skin for your horse: ash-grey armour plates with ember seams. No stat changes.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-022: Bloodmoon Blade**
```
✦ BLOODMOON BLADE · EPIC WEAPON SKIN

Cosmetic sword skin: a crescent blade glowing blood-red. No stat changes.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-023: Abyssal Scythe**
```
✦ ABYSSAL SCYTHE · LEGENDARY WEAPON SKIN

Cosmetic skin: a void-black scythe silhouette. No stat changes.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-024: Throne Edge**
```
✦ THRONE EDGE · MYTHIC WEAPON SKIN

Cosmetic sword skin forged from a throne shard. No stat changes.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-025: Dreadforge Plate**
```
✦ DREADFORGE PLATE · LEGENDARY ARMOUR SKIN

Cosmetic armour skin set with riveted black steel and molten seams. No stat changes.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-026: Crimson Warden**
```
✦ CRIMSON WARDEN · EPIC ARMOUR SKIN

Cosmetic armour skin set in lacquered crimson and dark gold. No stat changes.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-027: Kneel Before the Throne**
```
✦ KNEEL BEFORE THE THRONE · RARE EMOTE

Kneel, head bowed, as a faint crown glows above you.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-028: Blade Salute**
```
✦ BLADE SALUTE · COMMON EMOTE

Raise your blade in a knight's salute.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-029: Crimson Arrival**
```
✦ CRIMSON ARRIVAL · EPIC SPAWN EFFECT

You arrive in a burst of crimson light and falling embers.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-030: Blood Rift**
```
✦ BLOOD RIFT · EPIC TELEPORT EFFECT

Teleports tear a crimson rift in the air.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-031: Shadow Step**
```
✦ SHADOW STEP · RARE TELEPORT EFFECT

You vanish in a puff of black smoke.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-032: Crimson Gradient**
```
✦ CRIMSON GRADIENT · EPIC CHAT EFFECT

Your chat messages fade from crimson to dark red.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**COS-033: Gilded Name Shimmer**
```
✦ GILDED NAME SHIMMER · LEGENDARY CHAT EFFECT

Your name shimmers in dark gold in chat.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

</details>

### Pets (5)

Cosmetic companions. They follow you; they never fight.

| ID | Package | Price | Contents | Compliance |
|---|---|---|---|---|
| PET-001 | Ember Wisp | A$4.99 | Ember Wisp (Pet) | Safe |
| PET-002 | Obsidian Raven | A$7.99 | Obsidian Raven (Pet) | Safe |
| PET-003 | Mini Gate Golem | A$12.99 | Mini Gate Golem (Pet) | Safe |
| PET-004 | Crimson Fox Spirit | A$7.99 | Crimson Fox Spirit (Pet) | Safe |
| PET-005 | Void Hatchling | A$19.99 | Void Hatchling (Pet) | Safe |

<details><summary>Tebex descriptions (Pets)</summary>

**PET-001: Ember Wisp**
```
✦ EMBER WISP · RARE PET

A tiny floating ember spirit that follows you around.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**PET-002: Obsidian Raven**
```
✦ OBSIDIAN RAVEN · EPIC PET

A glass-black raven that perches near your shoulder.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**PET-003: Mini Gate Golem**
```
✦ MINI GATE GOLEM · LEGENDARY PET

A pocket-sized stone golem carved from a Gate's keystone.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**PET-004: Crimson Fox Spirit**
```
✦ CRIMSON FOX SPIRIT · EPIC PET

A spectral fox wreathed in crimson flame.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

**PET-005: Void Hatchling**
```
✦ VOID HATCHLING · MYTHIC PET

A baby void drake that curls around you. Purely cosmetic.

Purely cosmetic: no stats, no gameplay effect.
Equip it from your in-game wardrobe.

Delivered automatically in-game. Questions? Join our Discord.
```

</details>

### Boosters (28)

Global boosts: every player online benefits.

| ID | Package | Price | Contents | Compliance |
|---|---|---|---|---|
| BOOST-001 | Global XP Boost (1 Hour) | A$4.99 | +50% vanilla XP for every online player for 1 hour | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-002 | Global XP Boost (3 Hours) | A$11.99 | +50% vanilla XP for every online player for 3 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-003 | Global XP Boost (6 Hours) | A$19.99 | +50% vanilla XP for every online player for 6 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-004 | Global XP Boost (24 Hours) | A$59.99 | +50% vanilla XP for every online player for 24 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-005 | Global Currency Boost (1 Hour) | A$4.99 | +25% in-game currency earned by every online player for 1 hour | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-006 | Global Currency Boost (3 Hours) | A$11.99 | +25% in-game currency earned by every online player for 3 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-007 | Global Currency Boost (6 Hours) | A$19.99 | +25% in-game currency earned by every online player for 6 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-008 | Global Currency Boost (24 Hours) | A$59.99 | +25% in-game currency earned by every online player for 24 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-009 | Global Drop Boost (1 Hour) | A$4.99 | +25% mob drops for every online player for 1 hour | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-010 | Global Drop Boost (3 Hours) | A$11.99 | +25% mob drops for every online player for 3 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-011 | Global Drop Boost (6 Hours) | A$19.99 | +25% mob drops for every online player for 6 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-012 | Global Drop Boost (24 Hours) | A$59.99 | +25% mob drops for every online player for 24 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-013 | Global Luck Boost (1 Hour) | A$4.99 | Higher chance for everyone to find free crate keys from gameplay for 1 hour | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-014 | Global Luck Boost (3 Hours) | A$11.99 | Higher chance for everyone to find free crate keys from gameplay for 3 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-015 | Global Luck Boost (6 Hours) | A$19.99 | Higher chance for everyone to find free crate keys from gameplay for 6 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-016 | Global Luck Boost (24 Hours) | A$59.99 | Higher chance for everyone to find free crate keys from gameplay for 24 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-017 | Global Hunter XP Boost (1 Hour) | A$4.99 | +25% Hunter Progression XP for every online player for 1 hour | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-018 | Global Hunter XP Boost (3 Hours) | A$11.99 | +25% Hunter Progression XP for every online player for 3 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-019 | Global Hunter XP Boost (6 Hours) | A$19.99 | +25% Hunter Progression XP for every online player for 6 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-020 | Global Hunter XP Boost (24 Hours) | A$59.99 | +25% Hunter Progression XP for every online player for 24 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-021 | Global Gate Boost (1 Hour) | A$4.99 | +25% Gate and dungeon rewards for every online player for 1 hour | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-022 | Global Gate Boost (3 Hours) | A$11.99 | +25% Gate and dungeon rewards for every online player for 3 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-023 | Global Gate Boost (6 Hours) | A$19.99 | +25% Gate and dungeon rewards for every online player for 6 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-024 | Global Gate Boost (24 Hours) | A$59.99 | +25% Gate and dungeon rewards for every online player for 24 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-025 | Global Party Boost (1 Hour) | A$4.99 | +25% bonus for every player in a party or guild for 1 hour | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-026 | Global Party Boost (3 Hours) | A$11.99 | +25% bonus for every player in a party or guild for 3 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-027 | Global Party Boost (6 Hours) | A$19.99 | +25% bonus for every player in a party or guild for 6 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |
| BOOST-028 | Global Party Boost (24 Hours) | A$59.99 | +25% bonus for every player in a party or guild for 24 hours | Borderline (global boosts benefit everyone; safest when tied to community goals) |

<details><summary>Tebex descriptions (Boosters)</summary>

**BOOST-001: Global XP Boost (1 Hour)**
```
⏳ GLOBAL XP BOOST · 1 HOUR

+50% vanilla XP for every online player for 1 hour.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-002: Global XP Boost (3 Hours)**
```
⏳ GLOBAL XP BOOST · 3 HOURS

+50% vanilla XP for every online player for 3 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-003: Global XP Boost (6 Hours)**
```
⏳ GLOBAL XP BOOST · 6 HOURS

+50% vanilla XP for every online player for 6 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-004: Global XP Boost (24 Hours)**
```
⏳ GLOBAL XP BOOST · 24 HOURS

+50% vanilla XP for every online player for 24 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-005: Global Currency Boost (1 Hour)**
```
⏳ GLOBAL CURRENCY BOOST · 1 HOUR

+25% in-game currency earned by every online player for 1 hour.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-006: Global Currency Boost (3 Hours)**
```
⏳ GLOBAL CURRENCY BOOST · 3 HOURS

+25% in-game currency earned by every online player for 3 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-007: Global Currency Boost (6 Hours)**
```
⏳ GLOBAL CURRENCY BOOST · 6 HOURS

+25% in-game currency earned by every online player for 6 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-008: Global Currency Boost (24 Hours)**
```
⏳ GLOBAL CURRENCY BOOST · 24 HOURS

+25% in-game currency earned by every online player for 24 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-009: Global Drop Boost (1 Hour)**
```
⏳ GLOBAL DROP BOOST · 1 HOUR

+25% mob drops for every online player for 1 hour.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-010: Global Drop Boost (3 Hours)**
```
⏳ GLOBAL DROP BOOST · 3 HOURS

+25% mob drops for every online player for 3 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-011: Global Drop Boost (6 Hours)**
```
⏳ GLOBAL DROP BOOST · 6 HOURS

+25% mob drops for every online player for 6 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-012: Global Drop Boost (24 Hours)**
```
⏳ GLOBAL DROP BOOST · 24 HOURS

+25% mob drops for every online player for 24 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-013: Global Luck Boost (1 Hour)**
```
⏳ GLOBAL LUCK BOOST · 1 HOUR

Higher chance for everyone to find free crate keys from gameplay for 1 hour.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-014: Global Luck Boost (3 Hours)**
```
⏳ GLOBAL LUCK BOOST · 3 HOURS

Higher chance for everyone to find free crate keys from gameplay for 3 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-015: Global Luck Boost (6 Hours)**
```
⏳ GLOBAL LUCK BOOST · 6 HOURS

Higher chance for everyone to find free crate keys from gameplay for 6 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-016: Global Luck Boost (24 Hours)**
```
⏳ GLOBAL LUCK BOOST · 24 HOURS

Higher chance for everyone to find free crate keys from gameplay for 24 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-017: Global Hunter XP Boost (1 Hour)**
```
⏳ GLOBAL HUNTER XP BOOST · 1 HOUR

+25% Hunter Progression XP for every online player for 1 hour.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-018: Global Hunter XP Boost (3 Hours)**
```
⏳ GLOBAL HUNTER XP BOOST · 3 HOURS

+25% Hunter Progression XP for every online player for 3 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-019: Global Hunter XP Boost (6 Hours)**
```
⏳ GLOBAL HUNTER XP BOOST · 6 HOURS

+25% Hunter Progression XP for every online player for 6 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-020: Global Hunter XP Boost (24 Hours)**
```
⏳ GLOBAL HUNTER XP BOOST · 24 HOURS

+25% Hunter Progression XP for every online player for 24 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-021: Global Gate Boost (1 Hour)**
```
⏳ GLOBAL GATE BOOST · 1 HOUR

+25% Gate and dungeon rewards for every online player for 1 hour.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-022: Global Gate Boost (3 Hours)**
```
⏳ GLOBAL GATE BOOST · 3 HOURS

+25% Gate and dungeon rewards for every online player for 3 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-023: Global Gate Boost (6 Hours)**
```
⏳ GLOBAL GATE BOOST · 6 HOURS

+25% Gate and dungeon rewards for every online player for 6 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-024: Global Gate Boost (24 Hours)**
```
⏳ GLOBAL GATE BOOST · 24 HOURS

+25% Gate and dungeon rewards for every online player for 24 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-025: Global Party Boost (1 Hour)**
```
⏳ GLOBAL PARTY BOOST · 1 HOUR

+25% bonus for every player in a party or guild for 1 hour.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-026: Global Party Boost (3 Hours)**
```
⏳ GLOBAL PARTY BOOST · 3 HOURS

+25% bonus for every player in a party or guild for 3 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-027: Global Party Boost (6 Hours)**
```
⏳ GLOBAL PARTY BOOST · 6 HOURS

+25% bonus for every player in a party or guild for 6 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

**BOOST-028: Global Party Boost (24 Hours)**
```
⏳ GLOBAL PARTY BOOST · 24 HOURS

+25% bonus for every player in a party or guild for 24 hours.

GLOBAL: every player online benefits, and your name is announced as the booster.
Boosts of the same type queue up instead of stacking.

Delivered automatically in-game. Questions? Join our Discord.
```

</details>

### Starter (10)

One-time welcome packs for new Hunters.

| ID | Package | Price | Contents | Compliance |
|---|---|---|---|---|
| START-001 | First Blood | A$4.99 | Your first mark: Crimson Hunter title, 1 Ember Key and 500 Throne Shards. | Safe |
| START-002 | New Hunter's Mark | A$6.99 | Ember Wake trail, Blade Salute emote and 2 Ember Keys. | Safe |
| START-003 | Ashen Initiate Cache | A$7.99 | Falling Ash particles, 3 Ember Keys and 1,000 Throne Shards. | Safe |
| START-004 | Gate Initiate Pack | A$9.99 | 1 Abyssal Key, 2 Bloodmoon Keys and the Shadow Step teleport effect. | Safe |
| START-005 | First Expedition | A$9.99 | Ember Wisp pet and 1,500 Throne Shards for your first journey. | Safe |
| START-006 | Novice Wardrobe | A$5.99 | Crimson Sigil chat tag and Soul Ascension death effect. | Safe |
| START-007 | Hunter's Key Ring | A$7.99 | One key of each of the first three crates: Ember, Bloodmoon and Abyssal. | Safe |
| START-008 | Rising Hunter Bundle | A$14.99 | Supporter-tier look without the rank: Crimson Halo aura, Bloodstep trail and 1,500 shards. | Safe |
| START-009 | Starter Shard Pouch | A$2.99 | 1,000 Throne Shards at a one-time welcome price. | Safe |
| START-010 | Initiate's Emote Pack | A$3.99 | Kneel Before the Throne and Blade Salute emotes. | Safe |

<details><summary>Tebex descriptions (Starter)</summary>

**START-001: First Blood**
```
🛡️ FIRST BLOOD · STARTER

Your first mark: Crimson Hunter title, 1 Ember Key and 500 Throne Shards.

One per player. Welcome to the hunt.

Delivered automatically in-game. Questions? Join our Discord.
```

**START-002: New Hunter's Mark**
```
🛡️ NEW HUNTER'S MARK · STARTER

Ember Wake trail, Blade Salute emote and 2 Ember Keys.

One per player. Welcome to the hunt.

Delivered automatically in-game. Questions? Join our Discord.
```

**START-003: Ashen Initiate Cache**
```
🛡️ ASHEN INITIATE CACHE · STARTER

Falling Ash particles, 3 Ember Keys and 1,000 Throne Shards.

One per player. Welcome to the hunt.

Delivered automatically in-game. Questions? Join our Discord.
```

**START-004: Gate Initiate Pack**
```
🛡️ GATE INITIATE PACK · STARTER

1 Abyssal Key, 2 Bloodmoon Keys and the Shadow Step teleport effect.

One per player. Welcome to the hunt.

Delivered automatically in-game. Questions? Join our Discord.
```

**START-005: First Expedition**
```
🛡️ FIRST EXPEDITION · STARTER

Ember Wisp pet and 1,500 Throne Shards for your first journey.

One per player. Welcome to the hunt.

Delivered automatically in-game. Questions? Join our Discord.
```

**START-006: Novice Wardrobe**
```
🛡️ NOVICE WARDROBE · STARTER

Crimson Sigil chat tag and Soul Ascension death effect.

One per player. Welcome to the hunt.

Delivered automatically in-game. Questions? Join our Discord.
```

**START-007: Hunter's Key Ring**
```
🛡️ HUNTER'S KEY RING · STARTER

One key of each of the first three crates: Ember, Bloodmoon and Abyssal.

One per player. Welcome to the hunt.

Delivered automatically in-game. Questions? Join our Discord.
```

**START-008: Rising Hunter Bundle**
```
🛡️ RISING HUNTER BUNDLE · STARTER

Supporter-tier look without the rank: Crimson Halo aura, Bloodstep trail and 1,500 shards.

One per player. Welcome to the hunt.

Delivered automatically in-game. Questions? Join our Discord.
```

**START-009: Starter Shard Pouch**
```
🛡️ STARTER SHARD POUCH · STARTER

1,000 Throne Shards at a one-time welcome price.

One per player. Welcome to the hunt.

Delivered automatically in-game. Questions? Join our Discord.
```

**START-010: Initiate's Emote Pack**
```
🛡️ INITIATE'S EMOTE PACK · STARTER

Kneel Before the Throne and Blade Salute emotes.

One per player. Welcome to the hunt.

Delivered automatically in-game. Questions? Join our Discord.
```

</details>

### Seasonal (10)

Event packages. Hidden until their event is live.

| ID | Package | Price | Contents | Compliance |
|---|---|---|---|---|
| EVENT-001 | Bloodmoon Festival Bundle | A$29.99 | Event-exclusive Bloodmoon Reaper title, 10 Bloodmoon Keys and the Bloodmoon Eclipse kill effect. | Safe |
| EVENT-002 | Bloodmoon Event Key ×5 | A$14.99 | 5 Bloodmoon Event Keys for the limited Bloodmoon Event Crate (event cosmetics only). | Safe |
| EVENT-003 | Hallowed Gate Bundle | A$24.99 | Event-exclusive Hollow Lantern pet, Hallowed title and 5 Abyssal Keys. | Safe |
| EVENT-004 | Frostbound Throne Bundle | A$24.99 | Event-exclusive Frostbound aura, Winter's Crown title and 5 Regalia Keys. | Safe |
| EVENT-005 | First Throne Anniversary Pack | A$19.99 | Anniversary title, Anniversary Sigil tag and 5,000 Throne Shards. | Safe |
| EVENT-006 | Founder's Pack | A$29.99 | Launch-only Founder title, Founder chat tag, 3 Throne Keys and 5,000 Throne Shards. | Safe |
| EVENT-007 | New Era Pack | A$19.99 | Season-numbered title, 5 Dreadforge Keys and 2,500 Throne Shards to start the new season in style. | Safe |
| EVENT-008 | Gate Outbreak Bundle | A$24.99 | For server-wide Gate Outbreak events: Outbreak title, 5 Abyssal Keys and the Blood Rift teleport effect. | Safe |
| EVENT-009 | Lunar Eclipse Global Boost | A$24.99 | A 6-hour Global Gate Boost for everyone online during eclipse events. | Safe |
| EVENT-010 | Festival of Crowns | A$34.99 | Crown-themed event cosmetics: Festival Crown aura and 3 Regalia Keys. | Safe |

<details><summary>Tebex descriptions (Seasonal)</summary>

**EVENT-001: Bloodmoon Festival Bundle**
```
🌑 BLOODMOON FESTIVAL BUNDLE · BLOODMOON EVENT

Event-exclusive Bloodmoon Reaper title, 10 Bloodmoon Keys and the Bloodmoon Eclipse kill effect.

Available during the event only.

Delivered automatically in-game. Questions? Join our Discord.
```

**EVENT-002: Bloodmoon Event Key ×5**
```
🌑 BLOODMOON EVENT KEY ×5 · BLOODMOON EVENT

5 Bloodmoon Event Keys for the limited Bloodmoon Event Crate (event cosmetics only).

Available during the event only.

Delivered automatically in-game. Questions? Join our Discord.
```

**EVENT-003: Hallowed Gate Bundle**
```
🌑 HALLOWED GATE BUNDLE · HALLOWEEN EVENT

Event-exclusive Hollow Lantern pet, Hallowed title and 5 Abyssal Keys.

Available during the event only.

Delivered automatically in-game. Questions? Join our Discord.
```

**EVENT-004: Frostbound Throne Bundle**
```
🌑 FROSTBOUND THRONE BUNDLE · WINTER EVENT

Event-exclusive Frostbound aura, Winter's Crown title and 5 Regalia Keys.

Available during the event only.

Delivered automatically in-game. Questions? Join our Discord.
```

**EVENT-005: First Throne Anniversary Pack**
```
🌑 FIRST THRONE ANNIVERSARY PACK · ANNIVERSARY EVENT

Anniversary title, Anniversary Sigil tag and 5,000 Throne Shards.

Available during the event only.

Delivered automatically in-game. Questions? Join our Discord.
```

**EVENT-006: Founder's Pack**
```
🌑 FOUNDER'S PACK · SERVER LAUNCH EVENT

Launch-only Founder title, Founder chat tag, 3 Throne Keys and 5,000 Throne Shards.

Available during the event only.

Delivered automatically in-game. Questions? Join our Discord.
```

**EVENT-007: New Era Pack**
```
🌑 NEW ERA PACK · SEASON RESET EVENT

Season-numbered title, 5 Dreadforge Keys and 2,500 Throne Shards to start the new season in style.

Available during the event only.

Delivered automatically in-game. Questions? Join our Discord.
```

**EVENT-008: Gate Outbreak Bundle**
```
🌑 GATE OUTBREAK BUNDLE · SPECIAL EVENT EVENT

For server-wide Gate Outbreak events: Outbreak title, 5 Abyssal Keys and the Blood Rift teleport effect.

Available during the event only.

Delivered automatically in-game. Questions? Join our Discord.
```

**EVENT-009: Lunar Eclipse Global Boost**
```
🌑 LUNAR ECLIPSE GLOBAL BOOST · SPECIAL EVENT EVENT

A 6-hour Global Gate Boost for everyone online during eclipse events.

Available during the event only.

Delivered automatically in-game. Questions? Join our Discord.
```

**EVENT-010: Festival of Crowns**
```
🌑 FESTIVAL OF CROWNS · SPECIAL EVENT EVENT

Crown-themed event cosmetics: Festival Crown aura and 3 Regalia Keys.

Available during the event only.

Delivered automatically in-game. Questions? Join our Discord.
```

</details>

### Utility (7)

Name, chat and convenience tokens with no gameplay effect.

| ID | Package | Price | Contents | Compliance |
|---|---|---|---|---|
| UTIL-001 | Nickname Token (30 days) | A$3.99 | Use /nick for 30 days (staff-moderated). | Safe |
| UTIL-002 | Name Colour Token | A$2.99 | Change your name colour once from the approved palette. | Safe |
| UTIL-003 | Prefix Recolour Token | A$3.99 | Recolour your rank prefix once (rank holders only). | Safe |
| UTIL-004 | Queue Priority Pass (30 days) | A$4.99 | Priority login when the server is full, for 30 days. No gameplay effect. | Safe |
| UTIL-005 | Guild Banner Design Slot | A$6.99 | Unlock one extra cosmetic banner design for your guild. | Safe |
| UTIL-006 | Wardrobe Expansion | A$4.99 | +3 cosmetic wardrobe presets to switch outfits instantly. | Safe |
| UTIL-007 | Chat Emoji Pack: Dark Court | A$2.99 | Unlock 12 OVERTHRONE chat emojis. | Safe |

<details><summary>Tebex descriptions (Utility)</summary>

**UTIL-001: Nickname Token (30 days)**
```
⚙️ NICKNAME TOKEN (30 DAYS)

Use /nick for 30 days (staff-moderated).

No gameplay effect.

Delivered automatically in-game. Questions? Join our Discord.
```

**UTIL-002: Name Colour Token**
```
⚙️ NAME COLOUR TOKEN

Change your name colour once from the approved palette.

No gameplay effect.

Delivered automatically in-game. Questions? Join our Discord.
```

**UTIL-003: Prefix Recolour Token**
```
⚙️ PREFIX RECOLOUR TOKEN

Recolour your rank prefix once (rank holders only).

No gameplay effect.

Delivered automatically in-game. Questions? Join our Discord.
```

**UTIL-004: Queue Priority Pass (30 days)**
```
⚙️ QUEUE PRIORITY PASS (30 DAYS)

Priority login when the server is full, for 30 days. No gameplay effect.

No gameplay effect.

Delivered automatically in-game. Questions? Join our Discord.
```

**UTIL-005: Guild Banner Design Slot**
```
⚙️ GUILD BANNER DESIGN SLOT

Unlock one extra cosmetic banner design for your guild.

No gameplay effect.

Delivered automatically in-game. Questions? Join our Discord.
```

**UTIL-006: Wardrobe Expansion**
```
⚙️ WARDROBE EXPANSION

+3 cosmetic wardrobe presets to switch outfits instantly.

No gameplay effect.

Delivered automatically in-game. Questions? Join our Discord.
```

**UTIL-007: Chat Emoji Pack: Dark Court**
```
⚙️ CHAT EMOJI PACK: DARK COURT

Unlock 12 OVERTHRONE chat emojis.

No gameplay effect.

Delivered automatically in-game. Questions? Join our Discord.
```

</details>

### Gifts (9)

Buy for a friend. Enter their Minecraft username at checkout.

| ID | Package | Price | Contents | Compliance |
|---|---|---|---|---|
| GIFT-001 | Gift Rank: Supporter | A$9.99 | Gift the Supporter rank to a friend. Enter their Minecraft username at checkout. | Borderline (rank) |
| GIFT-002 | Gift Key Bundle | A$24.99 | Gift 5 Bloodmoon Keys and 5 Abyssal Keys. | Safe |
| GIFT-003 | Gift Shard Bundle | A$22.99 | Gift 5,000 Throne Shards (+10% bonus). | Safe |
| GIFT-004 | Gift Cosmetic Bundle | A$19.99 | Gift Crimson Halo, Bloodstep trail and the Blood Rift teleport effect. | Safe |
| GIFT-005 | Gift Starter Bundle | A$9.99 | Gift the First Blood and Hunter's Key Ring starter packs. | Safe |
| GIFT-006 | Gift Rank: Elite | A$24.99 | Gift the Elite rank to a friend. | Borderline (rank) |
| GIFT-007 | Gift Rank: Champion | A$49.99 | Gift the Champion rank to a friend. | Borderline (rank) |
| GIFT-008 | Gift Rank: Warlord | A$89.99 | Gift the Warlord rank to a friend. | Borderline (rank) |
| GIFT-009 | Gift Rank: Overlord | A$149.99 | Gift the Overlord rank to a friend. | Borderline (rank) |

<details><summary>Tebex descriptions (Gifts)</summary>

**GIFT-001: Gift Rank: Supporter**
```
🎁 GIFT RANK: SUPPORTER

Gift the Supporter rank to a friend. Enter their Minecraft username at checkout.

Enter your friend's Minecraft username at checkout. They receive it in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**GIFT-002: Gift Key Bundle**
```
🎁 GIFT KEY BUNDLE

Gift 5 Bloodmoon Keys and 5 Abyssal Keys.

Enter your friend's Minecraft username at checkout. They receive it in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**GIFT-003: Gift Shard Bundle**
```
🎁 GIFT SHARD BUNDLE

Gift 5,000 Throne Shards (+10% bonus).

Enter your friend's Minecraft username at checkout. They receive it in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**GIFT-004: Gift Cosmetic Bundle**
```
🎁 GIFT COSMETIC BUNDLE

Gift Crimson Halo, Bloodstep trail and the Blood Rift teleport effect.

Enter your friend's Minecraft username at checkout. They receive it in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**GIFT-005: Gift Starter Bundle**
```
🎁 GIFT STARTER BUNDLE

Gift the First Blood and Hunter's Key Ring starter packs.

Enter your friend's Minecraft username at checkout. They receive it in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**GIFT-006: Gift Rank: Elite**
```
🎁 GIFT RANK: ELITE

Gift the Elite rank to a friend.

Enter your friend's Minecraft username at checkout. They receive it in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**GIFT-007: Gift Rank: Champion**
```
🎁 GIFT RANK: CHAMPION

Gift the Champion rank to a friend.

Enter your friend's Minecraft username at checkout. They receive it in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**GIFT-008: Gift Rank: Warlord**
```
🎁 GIFT RANK: WARLORD

Gift the Warlord rank to a friend.

Enter your friend's Minecraft username at checkout. They receive it in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

**GIFT-009: Gift Rank: Overlord**
```
🎁 GIFT RANK: OVERLORD

Gift the Overlord rank to a friend.

Enter your friend's Minecraft username at checkout. They receive it in-game.

Delivered automatically in-game. Questions? Join our Discord.
```

</details>


---

## 5. Store structure (category order)

1. **Featured** (15): Rotating spotlight: limited-time and seasonal highlights.
2. **Ranks** (5): Lifetime supporter ranks. Cosmetic and convenience perks only.
3. **Crate Keys** (39): Keys for the six Gate Crates. All crate rewards are cosmetic or Throne Shards.
4. **Throne Shards** (7): Premium cosmetic currency, spent in the in-game Throne Vault.
5. **Bundles** (12): Best-value combinations of ranks, keys, shards and cosmetics.
6. **Cosmetics** (33): Auras, trails, effects, titles, skins and more.
7. **Pets** (5): Cosmetic companions. They follow you; they never fight.
8. **Boosters** (28): Global boosts: every player online benefits.
9. **Starter** (10): One-time welcome packs for new Hunters.
10. **Seasonal** (10): Event packages. Hidden until their event is live.
11. **Utility** (7): Name, chat and convenience tokens with no gameplay effect.
12. **Gifts** (9): Buy for a friend. Enter their Minecraft username at checkout.

**Tebex settings:**
- Enable gifting on ranks, keys, shards and cosmetics.
- Set limit 1 per customer on Starter and Founder items.
- Keep Seasonal packages disabled until their event.
- Keep every package **disabled** until the developer supplies its real command.
