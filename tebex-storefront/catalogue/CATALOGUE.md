# OVERTHRONE SMP – Tebex Store Catalogue

*“Don’t reach the throne. Overthrow it.”*

182 packages across 12 categories. Prices are recommendations in AUD.
Package IDs match `packages.csv`, `DEVELOPER-HANDOFF.md`, `IMAGE-PROMPTS.md` and the image files in `images/`.

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
| 1 | **SUPPORTER** | @Supporter | Supporter Rank (RANK-001) | `#E0434F` | 🔴 | A$9.99 |
| 2 | **ELITE** | @Elite | Elite Rank (RANK-002) | `#9B6BFF` | 💎 | A$19.99 |
| 3 | **CHAMPION** | @Champion | Champion Rank (RANK-003) | `#E39B5B` | 🏆 | A$34.99 |
| 4 | **OVERLORD** | @Overlord | Overlord Rank (RANK-004) | `#F2C14E` | 👑 | A$49.99 |
| 5 | **SOVEREIGN** | @Sovereign | Sovereign Rank (RANK-005) | `#D7DAE0` | ⚜️ | A$74.99 |
| 6 | **USURPER** | @Usurper | Usurper Rank (RANK-006) | `#FF3B4E` | 🗡️ | A$99.99 |
| 7 | **KINGSLAYER** | @Kingslayer | Kingslayer Rank (RANK-007) | `#B0122C` | ⚔️ | A$149.99 |
| 8 | **THRONEBREAKER** | @Thronebreaker | Thronebreaker Rank (RANK-008) | `#FF2E4D → #F2C14E` | 🔱 | A$249.99 |

### 🔴 SUPPORTER · RANK-001 · A$9.99
- **Lore:** Every rebellion begins with a single spark. Supporters lit the first fire beneath the throne.
- **Short description:** The first mark of the rebellion. A crimson name and a starter cache.
- **Full description:** The Supporter rank is a lifetime rank on OVERTHRONE SMP. The first mark of the rebellion. A crimson name and a starter cache. All perks are cosmetic or convenience only – no gameplay advantage.
- **Perks:**
  - [SUPPORTER] prefix and crimson name in chat and tab
  - @Supporter Discord role
  - Exclusive particle: Crimson Spark
  - 2× Ember Keys and 500 Throne Shards (one-time)
  - Queue priority: tier 1
  - Supporter chat emoji pack
- **Commands required:** <GRANT_RANK:SUPPORTER> + <GIVE_KEYS:EMBER:2> + <GIVE_SHARDS:500> + <GRANT_COSMETIC:PARTICLE_CRIMSON_SPARK> + Tebex Discord Action: add role @Supporter
- **Developer requirements:**
  - Permission group `supporter` inheriting the rank below.
  - Prefix in colour `#E0434F`.
  - Discord role sync (Tebex Discord Action).
  - Rank-exclusive cosmetics registered: PARTICLE_CRIMSON_SPARK.
- **Image:** `images/RANK-001.jpg` · prompt in IMAGE-PROMPTS.md

### 💎 ELITE · RANK-002 · A$19.99
- **Lore:** Hunters who survived their first Gate and came back hungry. The Elite are marked by violet fire.
- **Short description:** Violet prestige, a chosen chat colour and Bloodmoon keys.
- **Full description:** The Elite rank is a lifetime rank on OVERTHRONE SMP. Violet prestige, a chosen chat colour and Bloodmoon keys. All perks are cosmetic or convenience only – no gameplay advantage.
- **Perks:**
  - Everything in Supporter
  - [ELITE] prefix
  - @Elite Discord role
  - /chatcolor with 4 approved colours
  - Exclusive aura: Violet Ember Aura
  - 3× Bloodmoon Keys and 1,000 Throne Shards (one-time)
  - 1 extra cosmetic wardrobe preset
  - Queue priority: tier 2
- **Commands required:** <GRANT_RANK:ELITE> + <GIVE_KEYS:BLOODMOON:3> + <GIVE_SHARDS:1000> + <GRANT_COSMETIC:AURA_VIOLET_EMBER> + Tebex Discord Action: add role @Elite
- **Developer requirements:**
  - Permission group `elite` inheriting the rank below.
  - Prefix in colour `#9B6BFF`.
  - Discord role sync (Tebex Discord Action).
  - Rank-exclusive cosmetics registered: AURA_VIOLET_EMBER.
- **Image:** `images/RANK-002.jpg` · prompt in IMAGE-PROMPTS.md

### 🏆 CHAMPION · RANK-003 · A$34.99
- **Lore:** Champions carry the scars of a hundred Gates. Bronze-forged and battle-proven.
- **Short description:** Join messages, emotes, /hat and Abyssal keys.
- **Full description:** The Champion rank is a lifetime rank on OVERTHRONE SMP. Join messages, emotes, /hat and Abyssal keys. All perks are cosmetic or convenience only – no gameplay advantage.
- **Perks:**
  - Everything in Elite
  - [CHAMPION] prefix
  - @Champion Discord role
  - Custom join message (staff-approved)
  - /hat (cosmetic head slot)
  - Emote pack: Champion Salutes
  - Exclusive kill effect: Bronze Banner
  - 3× Abyssal Keys and 2,000 Throne Shards (one-time)
  - Queue priority: tier 3
- **Commands required:** <GRANT_RANK:CHAMPION> + <GIVE_KEYS:ABYSSAL:3> + <GIVE_SHARDS:2000> + <GRANT_COSMETIC:KILL_BRONZE_BANNER> + <GRANT_COSMETIC:EMOTE_PACK_CHAMPION> + Tebex Discord Action: add role @Champion
- **Developer requirements:**
  - Permission group `champion` inheriting the rank below.
  - Prefix in colour `#E39B5B`.
  - Discord role sync (Tebex Discord Action).
  - Rank-exclusive cosmetics registered: KILL_BRONZE_BANNER, EMOTE_PACK_CHAMPION.
- **Image:** `images/RANK-003.jpg` · prompt in IMAGE-PROMPTS.md

### 👑 OVERLORD · RANK-004 · A$49.99
- **Lore:** Overlords command the ruins between realms. Gold-crowned, feared and followed.
- **Short description:** The golden crown: /nick, an Overlord title and Dreadforge keys.
- **Full description:** The Overlord rank is a lifetime rank on OVERTHRONE SMP. The golden crown: /nick, an Overlord title and Dreadforge keys. All perks are cosmetic or convenience only – no gameplay advantage.
- **Perks:**
  - Everything in Champion
  - [OVERLORD] prefix
  - @Overlord Discord role
  - /nick (staff-moderated nicknames)
  - Exclusive title: the Overlord
  - Exclusive trail: Gilded Ash Trail
  - 3× Dreadforge Keys and 3,500 Throne Shards (one-time)
  - Queue priority: tier 4
- **Commands required:** <GRANT_RANK:OVERLORD> + <GIVE_KEYS:DREADFORGE:3> + <GIVE_SHARDS:3500> + <GRANT_COSMETIC:TITLE_OVERLORD> + <GRANT_COSMETIC:TRAIL_GILDED_ASH> + Tebex Discord Action: add role @Overlord
- **Developer requirements:**
  - Permission group `overlord` inheriting the rank below.
  - Prefix in colour `#F2C14E`.
  - Discord role sync (Tebex Discord Action).
  - Rank-exclusive cosmetics registered: TITLE_OVERLORD, TRAIL_GILDED_ASH.
- **Image:** `images/RANK-004.jpg` · prompt in IMAGE-PROMPTS.md

### ⚜️ SOVEREIGN · RANK-005 · A$74.99
- **Lore:** A Sovereign answers to no crown. Silver-white and cold as the mountain thrones of Aeonia.
- **Short description:** Silver gradient chat, a raven companion and Regalia keys.
- **Full description:** The Sovereign rank is a lifetime rank on OVERTHRONE SMP. Silver gradient chat, a raven companion and Regalia keys. All perks are cosmetic or convenience only – no gameplay advantage.
- **Perks:**
  - Everything in Overlord
  - [SOVEREIGN] prefix
  - @Sovereign Discord role
  - Gradient chat colour: Silver Dawn
  - Exclusive pet: Sovereign Raven
  - Exclusive aura: Frost Crown Aura
  - 3× Regalia Keys and 5,000 Throne Shards (one-time)
  - Queue priority: tier 5
- **Commands required:** <GRANT_RANK:SOVEREIGN> + <GIVE_KEYS:REGALIA:3> + <GIVE_SHARDS:5000> + <GRANT_COSMETIC:CHAT_SILVER_DAWN> + <GRANT_COSMETIC:PET_SOVEREIGN_RAVEN> + <GRANT_COSMETIC:AURA_FROST_CROWN> + Tebex Discord Action: add role @Sovereign
- **Developer requirements:**
  - Permission group `sovereign` inheriting the rank below.
  - Prefix in colour `#D7DAE0`.
  - Discord role sync (Tebex Discord Action).
  - Rank-exclusive cosmetics registered: CHAT_SILVER_DAWN, PET_SOVEREIGN_RAVEN, AURA_FROST_CROWN.
- **Image:** `images/RANK-005.jpg` · prompt in IMAGE-PROMPTS.md

### 🗡️ USURPER · RANK-006 · A$99.99
- **Lore:** The Usurper does not ask for the throne. The Usurper takes it. Blood-red and unapologetic.
- **Short description:** Server-wide arrival announcements, blood-rift teleports and Throne keys.
- **Full description:** The Usurper rank is a lifetime rank on OVERTHRONE SMP. Server-wide arrival announcements, blood-rift teleports and Throne keys. All perks are cosmetic or convenience only – no gameplay advantage.
- **Perks:**
  - Everything in Sovereign
  - [USURPER] prefix
  - @Usurper Discord role
  - Server-wide join announcement
  - Exclusive teleport effect: Usurper's Rift
  - Exclusive death effect: Crimson Requiem
  - 2× Throne Keys, 3× Regalia Keys and 7,500 Throne Shards (one-time)
  - Queue priority: tier 6
- **Commands required:** <GRANT_RANK:USURPER> + <GIVE_KEYS:THRONE:2> + <GIVE_KEYS:REGALIA:3> + <GIVE_SHARDS:7500> + <GRANT_COSMETIC:TP_USURPERS_RIFT> + <GRANT_COSMETIC:DEATH_CRIMSON_REQUIEM> + Tebex Discord Action: add role @Usurper
- **Developer requirements:**
  - Permission group `usurper` inheriting the rank below.
  - Prefix in colour `#FF3B4E`.
  - Discord role sync (Tebex Discord Action).
  - Rank-exclusive cosmetics registered: TP_USURPERS_RIFT, DEATH_CRIMSON_REQUIEM.
- **Image:** `images/RANK-006.jpg` · prompt in IMAGE-PROMPTS.md

### ⚔️ KINGSLAYER · RANK-007 · A$149.99
- **Lore:** Kingslayers have struck down crowns before. Obsidian armour, a blade still wet with crimson.
- **Short description:** Crown Fall kill effect, Kingslayer blade skin and a custom title.
- **Full description:** The Kingslayer rank is a lifetime rank on OVERTHRONE SMP. Crown Fall kill effect, Kingslayer blade skin and a custom title. All perks are cosmetic or convenience only – no gameplay advantage.
- **Perks:**
  - Everything in Usurper
  - [KINGSLAYER] prefix
  - @Kingslayer Discord role
  - Exclusive kill effect: Crown Fall
  - Exclusive weapon skin: Kingslayer's Edge
  - One custom title (staff-approved)
  - 3× Throne Keys and 10,000 Throne Shards (one-time)
  - Queue priority: tier 7
- **Commands required:** <GRANT_RANK:KINGSLAYER> + <GIVE_KEYS:THRONE:3> + <GIVE_SHARDS:10000> + <GRANT_COSMETIC:KILL_CROWN_FALL> + <GRANT_COSMETIC:WEAPON_KINGSLAYERS_EDGE> + <GRANT_COSMETIC:TITLE_CUSTOM_TOKEN> + Tebex Discord Action: add role @Kingslayer
- **Developer requirements:**
  - Permission group `kingslayer` inheriting the rank below.
  - Prefix in colour `#B0122C`.
  - Discord role sync (Tebex Discord Action).
  - Rank-exclusive cosmetics registered: KILL_CROWN_FALL, WEAPON_KINGSLAYERS_EDGE, TITLE_CUSTOM_TOKEN.
- **Image:** `images/RANK-007.jpg` · prompt in IMAGE-PROMPTS.md

### 🔱 THRONEBREAKER · RANK-008 · A$249.99
- **Lore:** The apex. The one who did not reach the throne – but broke it. Crimson and gold, forever.
- **Short description:** The apex rank: Shattered Throne mythic aura, full armour skin set and the Hall of Thrones.
- **Full description:** The Thronebreaker rank is a lifetime rank on OVERTHRONE SMP. The apex rank: Shattered Throne mythic aura, full armour skin set and the Hall of Thrones. All perks are cosmetic or convenience only – no gameplay advantage.
- **Perks:**
  - Everything in Kingslayer
  - [THRONEBREAKER] animated crimson-gold prefix
  - @Thronebreaker Discord role
  - Mythic aura: Shattered Throne
  - Exclusive armour skin set: Thronebreaker Regalia
  - Name in the Hall of Thrones (website and Discord)
  - 5× Throne Keys and 15,000 Throne Shards (one-time)
  - Queue priority: tier 8 (highest)
- **Commands required:** <GRANT_RANK:THRONEBREAKER> + <GIVE_KEYS:THRONE:5> + <GIVE_SHARDS:15000> + <GRANT_COSMETIC:AURA_SHATTERED_THRONE> + <GRANT_COSMETIC:ARMOUR_THRONEBREAKER_REGALIA> + <GRANT_COSMETIC:HALL_OF_THRONES_ENTRY> + Tebex Discord Action: add role @Thronebreaker
- **Developer requirements:**
  - Permission group `thronebreaker` inheriting the rank below.
  - Prefix in colour `#FF2E4D` (animated gradient).
  - Discord role sync (Tebex Discord Action).
  - Rank-exclusive cosmetics registered: AURA_SHATTERED_THRONE, ARMOUR_THRONEBREAKER_REGALIA, HALL_OF_THRONES_ENTRY.
- **Image:** `images/RANK-008.jpg` · prompt in IMAGE-PROMPTS.md

**Upgrades:** you can later add "Upgrade to X" packages priced at the difference between ranks. The developer just needs to remove the old group when granting the new one.

---

## 2. Crate system

Every crate has five reward tiers. All rewards are cosmetic or Throne Shards. Duplicate cosmetics convert to Throne Shards.

| Crate | Prestige | Key | Colour | Base key price | Common | Rare | Epic | Legendary | Mythic (jackpot) |
|---|---|---|---|---|---|---|---|---|---|
| **Ember Crate** | Common | Ember Key | `#F2A541` | A$1.99 | 62% | 27% | 8% | 2.5% | 0.5% |
| **Bloodmoon Crate** | Uncommon | Bloodmoon Key | `#D61F3C` | A$3.49 | 55% | 30% | 11% | 3.4% | 0.6% |
| **Abyssal Crate** | Rare | Abyssal Key | `#7B4DFF` | A$4.99 | 48% | 32% | 14% | 5% | 1% |
| **Dreadforge Crate** | Epic | Dreadforge Key | `#FF6A1A` | A$6.99 | 40% | 34% | 18% | 6.5% | 1.5% |
| **Regalia Crate** | Legendary | Regalia Key | `#E6C068` | A$9.99 | 30% | 36% | 22% | 9.5% | 2.5% |
| **Throne Crate** | Mythic | Throne Key | `#FF2E4D` | A$14.99 | 20% | 35% | 28% | 13% | 4% |

### Ember Crate
- **Lore:** Embers drift up from the cracked earth wherever a Gate has opened. Hunters gather them by the handful.
- **Tier:** 1 (Common)
- **Key:** Ember Key
- **Key art:** a blackened iron key with a glowing amber ember core in its bow, faint sparks drifting off the teeth
- **Crate art:** a small soot-black iron-banded chest with amber light leaking through its seams and embers rising from the lid
- **Rewards by tier:**
  - **Common** (62%): 150–300 Throne Shards; Common trails and chat tags
  - **Rare** (27%): 400–600 Throne Shards; Rare particles and titles
  - **Epic** (8%): 1,000 Throne Shards; Epic kill and death effects
  - **Legendary** (2.5%): 2,500 Throne Shards; Legendary auras
  - **Mythic** (0.5%): Jackpot: Ashen Halo aura (crate exclusive)
- **Jackpot:** Ashen Halo – a slow-turning ring of ash and amber embers above the head
- **Key prices:** 1× A$1.99 · 5× A$8.99 · 10× A$16.99 · 25× A$39.99 · 50× A$74.99 · 100× A$139.99
- **Developer requirements:**
  - Crate `ember` with the odds above.
  - Virtual keys delivered by command; works when the player is offline.
  - Duplicate → shards conversion.
  - Odds visible in-game.
  - In-game key sources (vote, events, Gate drops) so the crate is also free to earn.

### Bloodmoon Crate
- **Lore:** When the moon bleeds, the Gates widen. Bloodmoon Crates wash up in the red light, sealed with old wax.
- **Tier:** 2 (Uncommon)
- **Key:** Bloodmoon Key
- **Key art:** a crimson-steel key whose bow is a blood-red moon disc in a thorned frame, dripping red light
- **Crate art:** a dark wooden reliquary chest sealed with blood-red wax, a full crimson moon glowing behind it
- **Rewards by tier:**
  - **Common** (55%): 250–500 Throne Shards; Common and Rare cosmetics
  - **Rare** (30%): 600–900 Throne Shards; Rare titles, tags and trails
  - **Epic** (11%): 1,500 Throne Shards; Epic kill effects and teleport effects
  - **Legendary** (3.4%): 3,500 Throne Shards; Legendary auras and pets
  - **Mythic** (0.6%): Jackpot: Bloodmoon Eclipse aura (crate exclusive)
- **Jackpot:** Bloodmoon Eclipse – a red moon eclipses behind the player while crimson light pulses outward
- **Key prices:** 1× A$3.99 · 5× A$15.99 · 10× A$29.99 · 25× A$69.99 · 50× A$130.99 · 100× A$244.99
- **Developer requirements:**
  - Crate `bloodmoon` with the odds above.
  - Virtual keys delivered by command; works when the player is offline.
  - Duplicate → shards conversion.
  - Odds visible in-game.
  - In-game key sources (vote, events, Gate drops) so the crate is also free to earn.

### Abyssal Crate
- **Lore:** Dredged from the bottom of the deepest Gates, where light forgets itself.
- **Tier:** 3 (Rare)
- **Key:** Abyssal Key
- **Key art:** an obsidian key with violet-black void energy swirling inside a cracked glass bow, chains wrapped around the shaft
- **Crate art:** an obsidian chest bound in chains, a violet void portal swirling where the lock should be
- **Rewards by tier:**
  - **Common** (48%): 400–700 Throne Shards; Rare cosmetics
  - **Rare** (32%): 900–1,200 Throne Shards; Epic trails and particles
  - **Epic** (14%): 2,000 Throne Shards; Epic pets and teleport effects
  - **Legendary** (5%): 5,000 Throne Shards; Legendary weapon skins
  - **Mythic** (1%): Jackpot: Voidborn Wraith pet (crate exclusive)
- **Jackpot:** Voidborn Wraith – a cosmetic shadow-wraith companion trailing violet mist
- **Key prices:** 1× A$4.99 · 5× A$22.99 · 10× A$42.99 · 25× A$99.99 · 50× A$187.99 · 100× A$349.99
- **Developer requirements:**
  - Crate `abyssal` with the odds above.
  - Virtual keys delivered by command; works when the player is offline.
  - Duplicate → shards conversion.
  - Odds visible in-game.
  - In-game key sources (vote, events, Gate drops) so the crate is also free to earn.

### Dreadforge Crate
- **Lore:** Hammered in the forges beneath Netherfall, where the dead still work the bellows.
- **Tier:** 4 (Epic)
- **Key:** Dreadforge Key
- **Key art:** a heavy blackened-steel key glowing molten orange along its cracks, hammered rivets and a skull-shaped bow
- **Crate art:** a massive anvil-shaped forged-iron crate glowing molten orange from within, sparks and smoke rising
- **Rewards by tier:**
  - **Common** (40%): 600–900 Throne Shards; Epic cosmetics
  - **Rare** (34%): 1,200–1,600 Throne Shards; Epic armour and weapon skins
  - **Epic** (18%): 2,500 Throne Shards; Legendary kill effects
  - **Legendary** (6.5%): 6,000 Throne Shards; Legendary armour skin sets
  - **Mythic** (1.5%): Jackpot: Molten Throne armour skin set (crate exclusive)
- **Jackpot:** Molten Throne – a cosmetic armour skin set with glowing magma seams
- **Key prices:** 1× A$6.99 · 5× A$31.99 · 10× A$59.99 · 25× A$139.99 · 50× A$262.99 · 100× A$489.99
- **Developer requirements:**
  - Crate `dreadforge` with the odds above.
  - Virtual keys delivered by command; works when the player is offline.
  - Duplicate → shards conversion.
  - Odds visible in-game.
  - In-game key sources (vote, events, Gate drops) so the crate is also free to earn.

### Regalia Crate
- **Lore:** Treasures of fallen kings: sceptres, signets and stolen crowns, sealed in gold for whoever claims them next.
- **Tier:** 5 (Legendary)
- **Key:** Regalia Key
- **Key art:** an ornate dark-gold key with a crown-shaped bow set with a single crimson gemstone, fine engraved filigree
- **Crate art:** a royal black-and-gold treasure coffer with crown motifs, crimson velvet inside and golden light spilling out
- **Rewards by tier:**
  - **Common** (30%): 900–1,300 Throne Shards; Epic cosmetics
  - **Rare** (36%): 1,800–2,400 Throne Shards; Legendary titles and tags
  - **Epic** (22%): 3,500 Throne Shards; Legendary pets and auras
  - **Legendary** (9.5%): 8,000 Throne Shards; Mythic chat and teleport effects
  - **Mythic** (2.5%): Jackpot: Gilded Regalia weapon skin set (crate exclusive)
- **Jackpot:** Gilded Regalia – a set of cosmetic weapon skins in black steel and gold filigree
- **Key prices:** 1× A$9.99 · 5× A$44.99 · 10× A$84.99 · 25× A$199.99 · 50× A$374.99 · 100× A$699.99
- **Developer requirements:**
  - Crate `regalia` with the odds above.
  - Virtual keys delivered by command; works when the player is offline.
  - Duplicate → shards conversion.
  - Odds visible in-game.
  - In-game key sources (vote, events, Gate drops) so the crate is also free to earn.

### Throne Crate
- **Lore:** There is only one throne. Every Throne Crate holds a fragment of it.
- **Tier:** 6 (Mythic)
- **Key:** Throne Key
- **Key art:** a legendary key forged from a shard of a broken obsidian throne, crimson energy veins, gold crown-shaped bow
- **Crate art:** a monolithic obsidian crate shaped like a miniature broken throne, crimson cracks glowing, dark-gold trim and drifting embers
- **Rewards by tier:**
  - **Common** (20%): 1,500–2,000 Throne Shards; Legendary cosmetics
  - **Rare** (35%): 3,000 Throne Shards; Legendary auras and pets
  - **Epic** (28%): 5,000 Throne Shards; Mythic effects
  - **Legendary** (13%): 12,000 Throne Shards; Mythic armour skin sets
  - **Mythic** (4%): Jackpot: The Empty Throne aura + title “Throne Taker” (crate exclusive)
- **Jackpot:** The Empty Throne – a spectral broken throne rises behind the player; awards the title “Throne Taker”
- **Key prices:** 1× A$14.99 · 5× A$67.99 · 10× A$127.99 · 25× A$299.99 · 50× A$562.99 · 100× A$1049.99
- **Developer requirements:**
  - Crate `throne` with the odds above.
  - Virtual keys delivered by command; works when the player is offline.
  - Duplicate → shards conversion.
  - Odds visible in-game.
  - In-game key sources (vote, events, Gate drops) so the crate is also free to earn.

---

## 3. Crate key packages

| ID | Package | Price | Contents |
|---|---|---|---|
| KEY-001 | Ember Key ×1 | A$1.99 | 1× Ember Key for the Ember Crate |
| KEY-002 | Ember Key ×5 | A$8.99 | 5× Ember Key for the Ember Crate (10% bulk saving) |
| KEY-003 | Ember Key ×10 | A$16.99 | 10× Ember Key for the Ember Crate (15% bulk saving) |
| KEY-004 | Ember Key ×25 | A$39.99 | 25× Ember Key for the Ember Crate (20% bulk saving) |
| KEY-005 | Ember Key ×50 | A$74.99 | 50× Ember Key for the Ember Crate (25% bulk saving) |
| KEY-006 | Ember Key ×100 | A$139.99 | 100× Ember Key for the Ember Crate (30% bulk saving) |
| KEY-007 | Bloodmoon Key ×1 | A$3.99 | 1× Bloodmoon Key for the Bloodmoon Crate |
| KEY-008 | Bloodmoon Key ×5 | A$15.99 | 5× Bloodmoon Key for the Bloodmoon Crate (10% bulk saving) |
| KEY-009 | Bloodmoon Key ×10 | A$29.99 | 10× Bloodmoon Key for the Bloodmoon Crate (15% bulk saving) |
| KEY-010 | Bloodmoon Key ×25 | A$69.99 | 25× Bloodmoon Key for the Bloodmoon Crate (20% bulk saving) |
| KEY-011 | Bloodmoon Key ×50 | A$130.99 | 50× Bloodmoon Key for the Bloodmoon Crate (25% bulk saving) |
| KEY-012 | Bloodmoon Key ×100 | A$244.99 | 100× Bloodmoon Key for the Bloodmoon Crate (30% bulk saving) |
| KEY-013 | Abyssal Key ×1 | A$4.99 | 1× Abyssal Key for the Abyssal Crate |
| KEY-014 | Abyssal Key ×5 | A$22.99 | 5× Abyssal Key for the Abyssal Crate (10% bulk saving) |
| KEY-015 | Abyssal Key ×10 | A$42.99 | 10× Abyssal Key for the Abyssal Crate (15% bulk saving) |
| KEY-016 | Abyssal Key ×25 | A$99.99 | 25× Abyssal Key for the Abyssal Crate (20% bulk saving) |
| KEY-017 | Abyssal Key ×50 | A$187.99 | 50× Abyssal Key for the Abyssal Crate (25% bulk saving) |
| KEY-018 | Abyssal Key ×100 | A$349.99 | 100× Abyssal Key for the Abyssal Crate (30% bulk saving) |
| KEY-019 | Dreadforge Key ×1 | A$6.99 | 1× Dreadforge Key for the Dreadforge Crate |
| KEY-020 | Dreadforge Key ×5 | A$31.99 | 5× Dreadforge Key for the Dreadforge Crate (10% bulk saving) |
| KEY-021 | Dreadforge Key ×10 | A$59.99 | 10× Dreadforge Key for the Dreadforge Crate (15% bulk saving) |
| KEY-022 | Dreadforge Key ×25 | A$139.99 | 25× Dreadforge Key for the Dreadforge Crate (20% bulk saving) |
| KEY-023 | Dreadforge Key ×50 | A$262.99 | 50× Dreadforge Key for the Dreadforge Crate (25% bulk saving) |
| KEY-024 | Dreadforge Key ×100 | A$489.99 | 100× Dreadforge Key for the Dreadforge Crate (30% bulk saving) |
| KEY-025 | Regalia Key ×1 | A$9.99 | 1× Regalia Key for the Regalia Crate |
| KEY-026 | Regalia Key ×5 | A$44.99 | 5× Regalia Key for the Regalia Crate (10% bulk saving) |
| KEY-027 | Regalia Key ×10 | A$84.99 | 10× Regalia Key for the Regalia Crate (15% bulk saving) |
| KEY-028 | Regalia Key ×25 | A$199.99 | 25× Regalia Key for the Regalia Crate (20% bulk saving) |
| KEY-029 | Regalia Key ×50 | A$374.99 | 50× Regalia Key for the Regalia Crate (25% bulk saving) |
| KEY-030 | Regalia Key ×100 | A$699.99 | 100× Regalia Key for the Regalia Crate (30% bulk saving) |
| KEY-031 | Throne Key ×1 | A$14.99 | 1× Throne Key for the Throne Crate |
| KEY-032 | Throne Key ×5 | A$67.99 | 5× Throne Key for the Throne Crate (10% bulk saving) |
| KEY-033 | Throne Key ×10 | A$127.99 | 10× Throne Key for the Throne Crate (15% bulk saving) |
| KEY-034 | Throne Key ×25 | A$299.99 | 25× Throne Key for the Throne Crate (20% bulk saving) |
| KEY-035 | Throne Key ×50 | A$562.99 | 50× Throne Key for the Throne Crate (25% bulk saving) |
| KEY-036 | Throne Key ×100 | A$1049.99 | 100× Throne Key for the Throne Crate (30% bulk saving) |
| KEY-037 | Gate Key Sampler | A$29.99 | 1× Ember Key; 1× Bloodmoon Key; 1× Abyssal Key; 1× Dreadforge Key; 1× Regalia Key; 1× Throne Key |
| KEY-038 | Lower Gates Key Cache | A$24.99 | 5× Ember Key; 3× Bloodmoon Key; 2× Abyssal Key |
| KEY-039 | High Gates Key Vault | A$89.99 | 3× Dreadforge Key; 3× Regalia Key; 3× Throne Key |

Bulk discounts: 5 keys −10%, 10 keys −15%, 25 keys −20%, 50 keys −25%, 100 keys −30%.

---

## 4. Throne Shard packages

Throne Shards are a premium **cosmetic-only** currency, spent in the in-game **Throne Vault**.

| ID | Package | Price | Contents |
|---|---|---|---|
| SHARD-001 | Shard Pouch: 1,000 Throne Shards | A$4.99 | 1,000 Throne Shards |
| SHARD-002 | Shard Satchel: 2,500 Throne Shards | A$11.99 | 2,500 Throne Shards + 5% bonus (125) = 2,625 |
| SHARD-003 | Shard Coffer: 5,000 Throne Shards | A$22.99 | 5,000 Throne Shards + 10% bonus (500) = 5,500 |
| SHARD-004 | Shard Chest: 10,000 Throne Shards | A$44.99 | 10,000 Throne Shards + 15% bonus (1,500) = 11,500 |
| SHARD-005 | Shard Vault: 25,000 Throne Shards | A$104.99 | 25,000 Throne Shards + 20% bonus (5,000) = 30,000 |
| SHARD-006 | Shard Hoard: 50,000 Throne Shards | A$199.99 | 50,000 Throne Shards + 25% bonus (12,500) = 62,500 |
| SHARD-007 | Throne Treasury: 100,000 Throne Shards | A$379.99 | 100,000 Throne Shards + 30% bonus (30,000) = 130,000 |

---

## 5. Cosmetics and pets (38)

All cosmetics are visual only. Skins never change stats; pets never fight.
Prices by rarity: Common A$2.99 · Rare A$4.99 · Epic A$7.99 · Legendary A$12.99 · Mythic A$19.99

| ID | Name | Category | Rarity | Price | Description | Dev system |
|---|---|---|---|---|---|---|
| COS-001 | Crimson Halo | Aura | Epic | A$7.99 | A slow ring of crimson light orbits your head, pulsing like a heartbeat. | SYS-COSMETICS |
| COS-002 | Obsidian Crown | Aura | Legendary | A$12.99 | A spectral crown of black glass hovers above you, shedding crimson sparks. | SYS-COSMETICS |
| COS-003 | Abyssal Flame | Aura | Mythic | A$19.99 | Black-violet fire licks upward around you without ever burning. | SYS-COSMETICS |
| COS-004 | Bloodstep | Trail | Rare | A$4.99 | Each footstep leaves a fading crimson sigil on the ground. | SYS-COSMETICS |
| COS-005 | Ember Wake | Trail | Common | A$2.99 | A soft wake of drifting embers follows wherever you walk. | SYS-COSMETICS |
| COS-006 | Shattered Crystal | Trail | Epic | A$7.99 | Red crystal shards sprout and shatter behind you. | SYS-COSMETICS |
| COS-007 | Falling Ash | Particle | Common | A$2.99 | Grey ash drifts down around you like a quiet funeral. | SYS-COSMETICS |
| COS-008 | Orbiting Runes | Particle | Rare | A$4.99 | Three crimson runes slowly orbit your body. | SYS-COSMETICS |
| COS-009 | Bloodmoon Eclipse | Kill Effect | Legendary | A$12.99 | A red moon flashes overhead as your opponent falls. | SYS-COSMETICS |
| COS-010 | Throne Shatter | Kill Effect | Epic | A$7.99 | A miniature throne appears – and shatters into crimson glass. | SYS-COSMETICS |
| COS-011 | Chainbind | Kill Effect | Rare | A$4.99 | Spectral chains burst from the ground where they fell. | SYS-COSMETICS |
| COS-012 | Soul Ascension | Death Effect | Rare | A$4.99 | Your soul rises in a pale crimson column when you fall. | SYS-COSMETICS |
| COS-013 | Ashen Collapse | Death Effect | Epic | A$7.99 | You crumble into ash that scatters on the wind. | SYS-COSMETICS |
| COS-014 | Gatebreaker | Title | Rare | A$4.99 | Title: “the Gatebreaker”, shown under your name. | SYS-TITLES |
| COS-015 | Crimson Hunter | Title | Common | A$2.99 | Title: “Crimson Hunter”. | SYS-TITLES |
| COS-016 | Ashborn | Title | Epic | A$7.99 | Title: “Ashborn”, glowing with ember edges. | SYS-TITLES |
| COS-017 | Oathless | Title | Legendary | A$12.99 | Title: “the Oathless”, with a broken-chain flourish. | SYS-TITLES |
| COS-018 | Crimson Sigil | Chat Tag | Rare | A$4.99 | A crimson sigil tag shown before your name in chat. | SYS-TITLES |
| COS-019 | Black Crown | Chat Tag | Epic | A$7.99 | A black crown tag in chat and tab. | SYS-TITLES |
| COS-020 | Nightmare Steed | Mount Skin | Legendary | A$12.99 | Cosmetic skin for your horse: shadow-black hide and crimson eyes. No stat changes. | SYS-SKINS |
| COS-021 | Ashen Charger | Mount Skin | Epic | A$7.99 | Cosmetic skin for your horse: ash-grey armour plates with ember seams. No stat changes. | SYS-SKINS |
| COS-022 | Bloodmoon Blade | Weapon Skin | Epic | A$7.99 | Cosmetic sword skin: a crescent blade glowing blood-red. No stat changes. | SYS-SKINS |
| COS-023 | Abyssal Scythe | Weapon Skin | Legendary | A$12.99 | Cosmetic skin: a void-black scythe silhouette. No stat changes. | SYS-SKINS |
| COS-024 | Throne Edge | Weapon Skin | Mythic | A$19.99 | Cosmetic sword skin forged from a throne shard. No stat changes. | SYS-SKINS |
| COS-025 | Dreadforge Plate | Armour Skin | Legendary | A$12.99 | Cosmetic armour skin set with riveted black steel and molten seams. No stat changes. | SYS-SKINS |
| COS-026 | Crimson Warden | Armour Skin | Epic | A$7.99 | Cosmetic armour skin set in lacquered crimson and dark gold. No stat changes. | SYS-SKINS |
| COS-027 | Kneel Before the Throne | Emote | Rare | A$4.99 | Kneel, head bowed, as a faint crown glows above you. | SYS-EMOTES |
| COS-028 | Blade Salute | Emote | Common | A$2.99 | Raise your blade in a knight's salute. | SYS-EMOTES |
| COS-029 | Crimson Arrival | Spawn Effect | Epic | A$7.99 | You arrive in a burst of crimson light and falling embers. | SYS-COSMETICS |
| COS-030 | Blood Rift | Teleport Effect | Epic | A$7.99 | Teleports tear a crimson rift in the air. | SYS-COSMETICS |
| COS-031 | Shadow Step | Teleport Effect | Rare | A$4.99 | You vanish in a puff of black smoke. | SYS-COSMETICS |
| COS-032 | Crimson Gradient | Chat Effect | Epic | A$7.99 | Your chat messages fade from crimson to dark red. | SYS-CHAT |
| COS-033 | Gilded Name Shimmer | Chat Effect | Legendary | A$12.99 | Your name shimmers in dark gold in chat. | SYS-CHAT |
| PET-001 | Ember Wisp | Pet | Rare | A$4.99 | A tiny floating ember spirit that follows you around. | SYS-PETS |
| PET-002 | Obsidian Raven | Pet | Epic | A$7.99 | A glass-black raven that perches near your shoulder. | SYS-PETS |
| PET-003 | Mini Gate Golem | Pet | Legendary | A$12.99 | A pocket-sized stone golem carved from a Gate's keystone. | SYS-PETS |
| PET-004 | Crimson Fox Spirit | Pet | Epic | A$7.99 | A spectral fox wreathed in crimson flame. | SYS-PETS |
| PET-005 | Void Hatchling | Pet | Mythic | A$19.99 | A baby void drake that curls around you. Purely cosmetic. | SYS-PETS |

---

## 6. Bundles (12)

"Value" is the sum of the items at this catalogue's own prices. Bundles are priced at about 38% off.

| ID | Bundle | Contents | Value | Price | Saving |
|---|---|---|---|---|---|
| BND-001 | **Hunter's Oath** | 5× Ember Key; 2× Bloodmoon Key; 2,500 Throne Shards; Crimson Hunter (Title); Ember Wake (Trail) | A$35.39 | A$21.99 | 38% |
| BND-002 | **Gatebreaker's Cache** | 5× Abyssal Key; 5,000 Throne Shards; Gatebreaker (Title); Blood Rift (Teleport Effect) | A$62.88 | A$38.99 | 38% |
| BND-003 | **Bloodmoon Covenant** | 10× Bloodmoon Key; 5,000 Throne Shards; Bloodstep (Trail); Bloodmoon Blade (Weapon Skin) | A$72.83 | A$45.99 | 37% |
| BND-004 | **Abyss Walker** | 10× Abyssal Key; 7,500 Throne Shards; Abyssal Scythe (Weapon Skin); Abyssal Flame (Aura) | A$120.31 | A$74.99 | 38% |
| BND-005 | **Dreadforge Arsenal** | 10× Dreadforge Key; 7,500 Throne Shards; Dreadforge Plate (Armour Skin); Ashen Charger (Mount Skin) | A$128.31 | A$79.99 | 38% |
| BND-006 | **Regalia Trove** | 10× Regalia Key; 10,000 Throne Shards; Gilded Name Shimmer (Chat Effect); Obsidian Crown (Aura) | A$175.78 | A$108.99 | 38% |
| BND-007 | **Crimson Court** | 5× Bloodmoon Key; 5,000 Throne Shards; Crimson Warden (Armour Skin); Crimson Halo (Aura); Crimson Gradient (Chat Effect) | A$66.37 | A$41.99 | 37% |
| BND-008 | **Ashen Legion** | 10× Ember Key; 5× Bloodmoon Key; 3,000 Throne Shards; Ashen Collapse (Death Effect); Blade Salute (Emote); Ashborn (Title) | A$71.29 | A$44.99 | 37% |
| BND-009 | **Apex Predator** | 5× Throne Key; 5× Regalia Key; 15,000 Throne Shards; Throne Edge (Weapon Skin); Nightmare Steed (Mount Skin); Void Hatchling (Pet) | A$252.72 | A$156.99 | 38% |
| BND-010 | **The Overthrone** | Thronebreaker rank; 10× Throne Key; 10× Regalia Key; 25,000 Throne Shards; Abyssal Flame (Aura); Throne Edge (Weapon Skin); Void Hatchling (Pet) | A$684.51 | A$424.99 | 38% |
| BND-011 | **Collector's Ascension** | Overlord rank; 5× Dreadforge Key; 7,500 Throne Shards; Obsidian Raven (Pet) | A$130.36 | A$80.99 | 38% |
| BND-012 | **Champion's Rise** | Champion rank; 5× Abyssal Key; 3,000 Throne Shards; Throne Shatter (Kill Effect) | A$82.90 | A$51.99 | 37% |

- **Hunter's Oath:** Swear the oath. Start strong with keys, shards and your first title.
- **Gatebreaker's Cache:** For those who break Gates open: Abyssal keys, a Gatebreaker title and a rift teleport.
- **Bloodmoon Covenant:** Everything under the red moon: Bloodmoon keys, the Bloodstep trail and the Bloodmoon Blade.
- **Abyss Walker:** Walk where light forgets itself: Abyssal keys, the Abyssal Scythe and the Abyssal Flame aura.
- **Dreadforge Arsenal:** Forged beneath Netherfall: Dreadforge keys and the full Dreadforge Plate skin set.
- **Regalia Trove:** Royal treasure: Regalia keys, a Gilded Name Shimmer and the Obsidian Crown aura.
- **Crimson Court:** Dress for court: Crimson Warden armour skin, Crimson Halo and Crimson Gradient chat.
- **Ashen Legion:** A party pack: 10 Ember Keys for you plus effects to show off with your guild.
- **Apex Predator:** Endgame collection: Throne keys, Throne Edge, Nightmare Steed and the Void Hatchling.
- **The Overthrone:** The ultimate package: the Thronebreaker rank plus a mountain of keys, shards and Mythic cosmetics.
- **Collector's Ascension:** Rank up and collect: the Overlord rank with extra Dreadforge keys and shards.
- **Champion's Rise:** Rank up: the Champion rank with Abyssal keys and the Throne Shatter kill effect.

---

## 7. Featured products (15, rotate through the year)

| ID | Product | Window | Price | Description |
|---|---|---|---|---|
| FEAT-001 | Crimson Eclipse Aura (Limited) | Monthly rotation | A$14.99 | A limited aura: a crimson eclipse forms a halo behind you. Leaves the store when the rotation ends. |
| FEAT-002 | Founder's Crown Title | Launch month only | A$9.99 | Title “Founder”, available only during the server's launch month. Never returns. |
| FEAT-003 | Weekend Throne Rush | Selected weekends | A$39.99 | 3 Throne Keys and 3 Regalia Keys at a weekend price. |
| FEAT-004 | Monthly Relic Box | Changes monthly | A$12.99 | One cosmetic relic chosen for the month, plus 1,000 Throne Shards. The month's relic is listed in the description. |
| FEAT-005 | Throne of Ash Set | Rotation | A$24.99 | Ashborn title, Ashen Collapse death effect and Falling Ash particles in one set. |
| FEAT-006 | Gatekeeper's Sigil Set | Rotation | A$17.99 | Crimson Sigil tag, Orbiting Runes and the Shadow Step teleport effect. |
| FEAT-007 | Double Shard Weekend: Coffer | Double Shard weekends | A$22.99 | 5,000 Throne Shards + 5,000 bonus shards during Double Shard weekends. |
| FEAT-008 | Crimson Fox Companion | Rotation | A$9.99 | Spotlight price on the Crimson Fox Spirit pet. |
| FEAT-009 | Bloodmoon Hunt Pass | Bloodmoon nights | A$19.99 | 5 Bloodmoon Keys and the Bloodmoon Eclipse kill effect. |
| FEAT-010 | Obsidian Monarch Set | Rotation | A$34.99 | Obsidian Crown aura, Black Crown tag and Obsidian Raven pet. |
| FEAT-011 | Dreadforge Spotlight Keys | Rotation | A$29.99 | 5 Dreadforge Keys at a spotlight price. |
| FEAT-012 | Realm Explorer Set (Aeonia) | When Aeonia opens | A$19.99 | A divine-themed cosmetic set released with the Aeonia realm. |
| FEAT-013 | Realm Explorer Set (Netherfall) | When Netherfall opens | A$19.99 | An underworld-themed cosmetic set released with the Netherfall realm. |
| FEAT-014 | Gate Clear Celebration Pack | After major Gate updates | A$14.99 | 2 Abyssal Keys, 2,500 Throne Shards and the Gatebreaker title. |
| FEAT-015 | Spotlight: Shattered Crystal Trail | Rotation | A$5.99 | Spotlight price on the Shattered Crystal trail. |

Limited items ("Founder", monthly relics) should be retired after their window and never re-sold, so they stay meaningful.

---

## 8. Global boosters (28)

Every booster is **server-wide**: all online players get the effect and the buyer is announced.
Same-type boosts **queue** rather than stack, and each effect is capped.

| Booster | 1 Hour | 3 Hours | 6 Hours | 24 Hours |
|---|---|---|---|---|
| **Global XP Boost**: +50% vanilla XP for every online player | A$4.99 (BOOST-001) | A$11.99 (BOOST-002) | A$19.99 (BOOST-003) | A$59.99 (BOOST-004) |
| **Global Currency Boost**: +25% in-game currency earned by every online player | A$4.99 (BOOST-005) | A$11.99 (BOOST-006) | A$19.99 (BOOST-007) | A$59.99 (BOOST-008) |
| **Global Drop Boost**: +25% mob drops for every online player | A$4.99 (BOOST-009) | A$11.99 (BOOST-010) | A$19.99 (BOOST-011) | A$59.99 (BOOST-012) |
| **Global Luck Boost**: Higher chance for everyone to find free crate keys from gameplay | A$4.99 (BOOST-013) | A$11.99 (BOOST-014) | A$19.99 (BOOST-015) | A$59.99 (BOOST-016) |
| **Global Hunter XP Boost**: +25% Hunter Progression XP for every online player | A$4.99 (BOOST-017) | A$11.99 (BOOST-018) | A$19.99 (BOOST-019) | A$59.99 (BOOST-020) |
| **Global Gate Boost**: +25% Gate and dungeon rewards for every online player | A$4.99 (BOOST-021) | A$11.99 (BOOST-022) | A$19.99 (BOOST-023) | A$59.99 (BOOST-024) |
| **Global Party Boost**: +25% bonus for every player in a party or guild | A$4.99 (BOOST-025) | A$11.99 (BOOST-026) | A$19.99 (BOOST-027) | A$59.99 (BOOST-028) |

---

## 9. Starter products (10, limit 1 per player)

| ID | Package | Price | Contents |
|---|---|---|---|
| START-001 | First Blood | A$4.99 | Your first mark: Crimson Hunter title, 1 Ember Key and 500 Throne Shards. |
| START-002 | New Hunter's Mark | A$6.99 | Ember Wake trail, Blade Salute emote and 2 Ember Keys. |
| START-003 | Ashen Initiate Cache | A$7.99 | Falling Ash particles, 3 Ember Keys and 1,000 Throne Shards. |
| START-004 | Gate Initiate Pack | A$9.99 | 1 Abyssal Key, 2 Bloodmoon Keys and the Shadow Step teleport effect. |
| START-005 | First Expedition | A$9.99 | Ember Wisp pet and 1,500 Throne Shards for your first journey. |
| START-006 | Novice Wardrobe | A$5.99 | Crimson Sigil chat tag and Soul Ascension death effect. |
| START-007 | Hunter's Key Ring | A$7.99 | One key of each of the first three crates: Ember, Bloodmoon and Abyssal. |
| START-008 | Rising Hunter Bundle | A$14.99 | Supporter-tier look without the rank: Crimson Halo aura, Bloodstep trail and 1,500 shards. |
| START-009 | Starter Shard Pouch | A$2.99 | 1,000 Throne Shards at a one-time welcome price. |
| START-010 | Initiate's Emote Pack | A$3.99 | Kneel Before the Throne and Blade Salute emotes. |

---

## 10. Seasonal and event products (10)

Keep these **disabled** in Tebex until their event starts.

| ID | Event | Package | Price | Contents |
|---|---|---|---|---|
| EVENT-001 | Bloodmoon | Bloodmoon Festival Bundle | A$29.99 | Event-exclusive Bloodmoon Reaper title, 10 Bloodmoon Keys and the Bloodmoon Eclipse kill effect. |
| EVENT-002 | Bloodmoon | Bloodmoon Event Key ×5 | A$14.99 | 5 Bloodmoon Event Keys for the limited Bloodmoon Event Crate (event cosmetics only). |
| EVENT-003 | Halloween | Hallowed Gate Bundle | A$24.99 | Event-exclusive Hollow Lantern pet, Hallowed title and 5 Abyssal Keys. |
| EVENT-004 | Winter | Frostbound Throne Bundle | A$24.99 | Event-exclusive Frostbound aura, Winter's Crown title and 5 Regalia Keys. |
| EVENT-005 | Anniversary | First Throne Anniversary Pack | A$19.99 | Anniversary title, Anniversary Sigil tag and 5,000 Throne Shards. |
| EVENT-006 | Server Launch | Founder's Pack | A$29.99 | Launch-only Founder title, Founder chat tag, 3 Throne Keys and 5,000 Throne Shards. |
| EVENT-007 | Season Reset | New Era Pack | A$19.99 | Season-numbered title, 5 Dreadforge Keys and 2,500 Throne Shards to start the new season in style. |
| EVENT-008 | Special Event | Gate Outbreak Bundle | A$24.99 | For server-wide Gate Outbreak events: Outbreak title, 5 Abyssal Keys and the Blood Rift teleport effect. |
| EVENT-009 | Special Event | Lunar Eclipse Global Boost | A$24.99 | A 6-hour Global Gate Boost for everyone online during eclipse events. |
| EVENT-010 | Special Event | Festival of Crowns | A$34.99 | Crown-themed event cosmetics: Festival Crown aura and 3 Regalia Keys. |

---

## 11. Gift products (8) and utility (7)

Gift packages use a Tebex **Variable** for the recipient's username (Package → Variables tab).
Every other package can also be gifted with Tebex's built-in **Gifting** tab.

| ID | Package | Price | Contents |
|---|---|---|---|
| GIFT-001 | Gift Rank: Supporter | A$9.99 | Gift the Supporter rank to a friend. Enter their Minecraft username at checkout. |
| GIFT-002 | Gift Key Bundle | A$24.99 | Gift 5 Bloodmoon Keys and 5 Abyssal Keys. |
| GIFT-003 | Gift Shard Bundle | A$22.99 | Gift 5,000 Throne Shards (+10% bonus). |
| GIFT-004 | Gift Cosmetic Bundle | A$19.99 | Gift Crimson Halo, Bloodstep trail and the Blood Rift teleport effect. |
| GIFT-005 | Gift Starter Bundle | A$9.99 | Gift the First Blood and Hunter's Key Ring starter packs. |
| GIFT-006 | Gift Rank: Elite | A$19.99 | Gift the Elite rank to a friend. |
| GIFT-007 | Gift Rank: Champion | A$34.99 | Gift the Champion rank to a friend. |
| GIFT-008 | Gift Rank: Overlord | A$49.99 | Gift the Overlord rank to a friend. |
| UTIL-001 | Nickname Token (30 days) | A$3.99 | Use /nick for 30 days (staff-moderated). |
| UTIL-002 | Name Colour Token | A$2.99 | Change your name colour once from the approved palette. |
| UTIL-003 | Prefix Recolour Token | A$3.99 | Recolour your rank prefix once (rank holders only). |
| UTIL-004 | Queue Priority Pass (30 days) | A$4.99 | Priority login when the server is full, for 30 days. No gameplay effect. |
| UTIL-005 | Guild Banner Design Slot | A$6.99 | Unlock one extra cosmetic banner design for your guild. |
| UTIL-006 | Wardrobe Expansion | A$4.99 | +3 cosmetic wardrobe presets to switch outfits instantly. |
| UTIL-007 | Chat Emoji Pack: Dark Court | A$2.99 | Unlock 12 OVERTHRONE chat emojis. |

---

## 12. Package database

See **`packages.csv`** (182 rows). Columns: ID, CATEGORY, PACKAGE, PRICE AUD, TYPE, CONTENTS, RARITY, DEV SYSTEM, COMMAND PLACEHOLDER, IMAGE, STATUS, DESCRIPTION, GIFTING.

## 13. Developer handoff

See **`DEVELOPER-HANDOFF.md`**.

## 14–16. Images and prompts

- Ready-made branded images for every package and category are in `images/` and `images/categories/`.
- **`IMAGE-PROMPTS.md`** has an individual AI-art prompt for every package, crate and category, if you want to replace any image with painted artwork later.

---

## 17. Final Tebex store structure

Create the categories in this order:

1. **Featured** – Rotating spotlight: limited-time and seasonal highlights. (15 packages)
2. **Ranks** – Lifetime supporter ranks. Cosmetic and convenience perks only. (8 packages)
3. **Crate Keys** – Keys for the six Gate Crates. All crate rewards are cosmetic or Throne Shards. (39 packages)
4. **Throne Shards** – Premium cosmetic currency, spent in the in-game Throne Vault. (7 packages)
5. **Bundles** – Best-value combinations of ranks, keys, shards and cosmetics. (12 packages)
6. **Cosmetics** – Auras, trails, effects, titles, skins and more. (33 packages)
7. **Pets** – Cosmetic companions. They follow you; they never fight. (5 packages)
8. **Boosters** – Global boosts: every player online benefits. (28 packages)
9. **Starter** – One-time welcome packs for new Hunters. (10 packages)
10. **Seasonal** – Event packages. Hidden until their event is live. (10 packages)
11. **Utility** – Name, chat and convenience tokens with no gameplay effect. (7 packages)
12. **Gifts** – Buy for a friend. Enter their Minecraft username at checkout. (8 packages)

**Recommended Tebex settings:**
- Enable gifting on ranks, keys, shards and cosmetics.
- Set "limit 1 per customer" on Starter packages and Founder items.
- Set "require player online" OFF wherever the developer supports offline delivery.
- Put crate odds in every key package description.
- Keep Seasonal packages disabled until their event.
