# OVERTHRONE SMP: full handoff (read all of this before changing anything)

Last updated: 2026-10-17 (second update that day). Written by Claude (Claude Code) for whoever works on the project next.
The owner is **__SK1TZ__**. They are not a coder: explain things simply, step by step, and give **complete
files** to drag and drop (not snippets). They upload files to the server themselves through the
MintServers file manager. Nobody can upload for them.

---------------------------------------------------------------------------------------------------

## 0. The owner's rules (follow these exactly)

1. **Never send code that breaks or conflicts with the server.** If unsure, ask them for the file or the log first.
2. **Do not guess mechanics, APIs, event names, skill IDs or config syntax.** Check or ask.
3. **Every new staff command must also be added to the Discord staff commands**
   (`scripts/build-discord-content.mjs` → run `node scripts/build-discord-content.mjs` → creates `discord-bot/content.json`).
4. Secrets: no passwords or tokens in JavaScript or frontend code. The Discord bot token and RCON password stay in
   `discord-bot/.env` (never committed). No Tebex secret keys in public code. Never repeat secrets from screenshots.
5. Don't say something is tested unless it really was. Tell them which files changed, where each one goes, and
   what to type afterwards (`/reload` or restart).
6. They want to save credits: batch questions and ask for **everything you need in one message**.
7. **Every time you work on the server, finish by sending an updated copy of this handoff file** (update the date,
   sections 3–6 and 9).
8. Don't re-send fixes they say they've already done themselves (e.g. the SMP item drops).

---------------------------------------------------------------------------------------------------

## 1. Server environment

- Minecraft **1.21.1**, **NeoForge 21.1.251**, Java 21, hosted on **MintServers**.
- **KubeJS 2101.7.2-build.377** (with Rhino). All custom gameplay code is KubeJS server scripts.
- Big mods: **Tensura: Reincarnated 2.0.1.3**, Tensura: Mysticism, Tensura N.E.B. (Not Enough Bosses),
  TensuraKumodesu, SlimeThroneExtras, Tensura-Leveling, **ManasCore 4.0.0.2** (skills/races API),
  **SoloCraft: Reawakening / Solo Leveling (SLR) 1.3.3**, Epic Fight, Iron's Spells, Apotheosis,
  Cataclysm, Mowzie's Mobs, Aether, **Multiworld** (worlds), **NeoEssentials** (warps, kits, eco, placeholders),
  **FTB Chunks / FTB Teams / FTB Ranks / FTB Quests**, **Flan** (player land claims), Open Parties and Claims,
  **TenSura Compat: FTB** and **TenSura Compat: OPAC** (stop skills griefing claimed land), Easy NPC,
  Lightman's Currency, EconomyCraft, Tebex, Votifier, Sophisticated Backpacks, Curios, Accessories, Waystones,
  Lootr, LootJS, WorldEdit, Chunky, spark, ModernFix, Lithium, FerriteCore.
- Server address: `overthronesmp.net`. Website: https://overthronesmp.net. Store: https://overthronesmp.tebex.store.
  Discord: https://discord.gg/overthronesmp.

### Worlds (Multiworld ids)

| What players call it | Real world id | Notes |
|---|---|---|
| Hub | `multiworld:hub` | Safe: no damage, no block breaking, no explosions. Spawn is set by `hub_spawn.js`. |
| RPG World | `multiworld:rpg` | Safe city (no damage, build-protected, has a world border), **except the Caverns area**, which is a combat zone. |
| **SMP** (`/smp`) | **`multiworld:wild`** | The world is still called `wild` on purpose: renaming a Multiworld world creates a new empty world. No claims, raiding allowed. **The only world where players lose their items on death.** |
| Wild (`/wild`) | `minecraft:overworld` | Random teleport into the overworld. |
| Survival / Resource | `multiworld:survival`, `multiworld:resource` | |

Config for worlds and warps: `config/serversetup/worlds.json` and `config/serversetup/coordinates.json`.

---------------------------------------------------------------------------------------------------

## 2. KubeJS rules on THIS server (learned the hard way)

- **All server scripts share one global scope.** Top-level `const`/`let` names clash between files
  (e.g. two files with `const Events` = "redeclaration" error). **Wrap every script in `(function () { ... })()`**
  and give shared helpers unique names (caverns.js deliberately exposes `otCavernsArea`, `otCavernsLoad`,
  `otInCaverns`, `otCavernsStats`, `otCavernsPay`; professions.js calls `otOnNodeGathered`).
- `global` is read-only: you can't assign to it.
- `getClass`, `java.lang.Class` and reflection are **blocked** by KubeJS's class filter.
- UUIDs: `getStringUUID()` / `getUUID()` don't work. Use `e.getStringUuid()` (fallbacks: `e.getUuid()`, `e.uuid`).
- `entity.getType()` returns a String in KubeJS. For the real id use `e.getEncodeId()` (e.g. `"tensura:orc"`).
  The name translation key is `'entity.' + id.replace(':', '.')`.
- **Never put a `//` comment in the middle of a line that has more code after it.** It swallowed code once
  ("undefined" spawns).
- `/reload` re-runs scripts. `ServerEvents.loaded` only fires on a real server start, so state loaded there is
  empty after `/reload`. Load it lazily (see `otCavernsLoad`).
- **NEVER add KubeJS listeners to ManasCore/Tensura/Architectury events** (UNLOCK_SKILL, skill learn/use, etc.).
  It **crashed the server** (Architectury got a null EventResult). Only READ and FORGET skills via
  `Java.loadClass('io.github.manasmods.manascore.skill.api.SkillAPI').getSkillsFrom(entity)` →
  `.getLearnedSkills()`, `.getSkill(rl)`, `.forgetSkill(rl)`.
- The NeoForge damage event works fine:
  `NativeEvents.onEvent('net.neoforged.neoforge.event.entity.living.LivingIncomingDamageEvent', e => ...)`
  (`e.getSource()`, `e.getAmount()`, `e.setAmount()`, `e.setCanceled(true)`).
- Floating text = vanilla `text_display` entities summoned with `runCommandSilent`. Use `translate` components
  so mod names show correctly. SNBT escaping:
  `JSON.stringify(x).replace(/\\/g,'\\\\').replace(/'/g,"\\'")` inside `text:'...'`.
- Boss bars via commands: `bossbar add/set/remove` + `execute positioned ... players @a[distance=..48]`.
- **Mobs do not target invulnerable players** (vanilla `canBeSeenAsEnemy`). `damage_zones.js` uses the player's
  invulnerable flag for safe zones, so in safe zones mobs ignore players. This is why the Caverns are carved out.

---------------------------------------------------------------------------------------------------

## 3. Every KubeJS server script (`kubejs/server_scripts/`) and what it does

Staff commands need op. In this repo the scripts are in `minecraft/kubejs/server_scripts/`.

| File | What it does | Main commands |
|---|---|---|
| `afkzone.js` | AFK room: 30-min boss-bar timer, 1 AFK Shard per 30 min, 6 shards = AFK Key. Info board. | `/afkshard`, `/afkzone pos1/pos2/board/test` |
| `anticheat.js` | Mod-friendly anti-cheat (x-ray ratio alerts etc.; never punishes modded flight/reach). | `/ac ...` |
| `caverns.js` | **The Caverns**: inside the area set with pos1/pos2, every mob kill and node pays $100–$10,000 (`eco give`), 50k/min cap per player. Trackers. **Crate keys**: each kill 0.5% (bosses placed with /setboss 5%) gives a random Legendary/Mythic/Cosmetic key, announced in chat. Warning boards. | `/cavernadmin pos1/pos2/info/stats/reset/board [height]/board flip/remove/removeall`, players `/caverns` |
| `claims.js` | Flan claim helper: gives a golden-shovel claim tool and how-to. | `/claimtool`, `/claiminfo` |
| `clearlag.js` | Clears ground items hourly with countdown. | `/clearlag now/status` |
| `crate_fx.js` | Particle effects around crates. | `/cratefx ...` |
| `crates.js` | OG-style crates (vote, armor, weapon, legendary, mythic, event, spawner, afk, cosmetic, rune...). Keys are real items. Rewards are edited in-game. | `/crate create/remove/list/edit/hologram/infoboard`, `/crate key give/take <player> <crate> <n>` |
| `damage_debug.js` | `/whyhurt`: tells you what damages you (type, attacker, amount). Read-only. | `/whyhurt` |
| `damage_zones.js` | Safe worlds = hub + RPG world, using the invulnerable flag. **The Caverns area is NOT safe** (combat zone). New player shield: no damage while picking a race, then 15 min while below level 5. | `/damagezones`, `/newbieshield <player> <minutes>` |
| `dmg_debug.js` | Older damage debugger (hurts you 1 hp and reports where damage is blocked). | `/dmgdebug` |
| `dump_item_ids.js` | One-time helper that dumps all item ids. | `/dumpitems` |
| `gate_waves.js` | Solo Leveling gates: keeps 3 gates per hour. | `/gatewave ...` |
| `holograms.js` | Generic floating text. | `/holo place/...` |
| `hub_npcs.js` | Hub NPC text + clickable links. | `/links`, `/npcfix apply` |
| `hub_spawn.js` | Sends new players to the hub. After race pick, only if they're still at the overworld spawn (so Daemon/Angel races that start in their own world aren't pulled back). | `/hubspawn ...` |
| `keep_inventory.js` | keepInventory on everywhere; **in `multiworld:wild` (SMP) items drop on death**. **The owner manages this one themselves and it works: don't touch or re-send it.** | `/keepinv` |
| `kit_cooldown.js` | Enforces NeoEssentials kit cooldowns. | `/kitcd check/reset` |
| `leveling.js` | Player levels 1–5000 (XP from quests, mobs, ores, daily login). Mirrored to scoreboard objectives for the HUD. | `/level ...` |
| `grief_guard.js` | Hub + RPG World (incl. Caverns): any `minecraft:falling_block` that appears is cancelled and its block put back at its start position (skills that lift/move/suck up blocks); NeoForge `EntityMobGriefingEvent` denied there. Added 2026-10-18 because skills (e.g. Black Lightning) still moved blocks; the owner was probably testing as a member of the hub claim team or with FTB admin bypass, which the claims allow. Untested; `/griefguard` counters show which part catches what. | `/griefguard` |
| `cosmetics_fx.js` | Animated particle cosmetics (auras, trails, kill effects), 100% server side. Global `OT_FX` list is read by npc_menus.js, which adds kinds `aura`/`trail`/`killfx` to its cosmetics system (/cosmetics row 2, /aura /trail /killeffect, Throne Shop "PARTICLE EFFECTS" replacing the old Lootboxes "soon" tile, `/otcosmetic give <p> aura|trail|killeffect <id>`). `crate: true` items are not sold in the shop (crate rewards only). Ownership `ot_owned` "aura:<id>", equipped `ot_aura`/`ot_trail`/`ot_killfx`. Particles via `ServerLevel.sendParticles` (falls back to /particle). Test: `node minecraft/tests/cosmetics_fx/fxtest.js minecraft/kubejs/server_scripts/cosmetics_fx.js`. | `/cosfx preview <kind> <id>` |
| `slr_death_guard.js` | Crash guard for the SLR bug (section 5): orphaned boss clones are removed instead of dying; kills by them become plain deaths. | `/slrguard` |
| `mob_infighting.js` | **Crash guard**: in the RPG world, wild mobs can't damage other mobs (see section 5). | `/mobinfighting` |
| `mob_spawns.js` | **Fixed mob/boss spawns** (see section 4). | `/setmob`, `/setboss`, `/mobspawn ...` |
| `mob_tweaks.js` | Per-mob HP and max hit: barghest 40 HP / 5 dmg, direwolf 5 HP / 2 dmg (total max health, accounting for Tensura bonuses, re-checked every 5 s). | `/mobtweaks` |
| `npc_menus.js` (2026-10-18: `/npcmenu attach/attachcmd/detach` now pick the CLOSEST NPC on your line of sight, flash it and print its name+position; duplicated NPCs sharing an `ot_mid_` id get a fresh id) | NPCs that open chest menus (Throne Shop, Kit Selector, Level Guide, Links, Claims, SMP, Professions, Cosmetics, Crates, **Caverns** "Cavern Guide"), command NPCs, name plates. | `/npcmenu spawn <type>`, `/npcmenu spawncmd ...` |
| `overthrone_quests.js` | **SWITCHED OFF on the server** (renamed `overthrone_quests.js.off`): the old chat quest board (100 quests), replaced by the FTB Quest Book. Keep it off; never tell the owner to upload/enable it (quests would run twice). | (`/quest`) |
| `professions.js` | Professions (Mining, Gemology, Farming, Foraging, Combat 1–100) and gathering **nodes**: hit 3x, progress bar on the floating text and actionbar, respawn after 1 min, no item drops. | `/node create/remove/fixall/...`, `/professions` |
| `kill_credit.js` | Shared `otKillerOf(event)`: which player gets a kill's rewards (also Tensura skill kills, pets/summons → owner). Used by caverns, leveling, professions, quests, cosmetics_fx, mob_spawns. | `/killcredit` |
| `guide_books.js` | Written books "Tensura Guide" (every Tensura race + path, EP, evolving, awakening, naming, skills, sunlight, flying, Divine forms, race reset; Mysticism races with the mod's own descriptions) and "Solo Leveling Guide" (evaluation, ranks, statues, gates, levels, Caverns; shows the player's rank/class). Global `otGiveGuideBook(p, 'tensura'|'sl')`, 30 s cooldown. Text is word-wrapped and paginated automatically (14 lines x 112 px per page). Content = verified facts only (website guide / mod lang / confirmed server facts); SL dungeons NOT included until the SLR lang file is checked. Given from START HERE + the book tile in the Tensura/SL guide menus (npc_menus.js `giveBook`). | `/tensurabook`, `/slbook` |
| `race_scroll.js` | NPC Seris gives a Tensura Race Reset Scroll every 12 h. Finds Seris by name OR `persistentData ot_style_title` (styleall clears names). | `/racescroll ...` |
| `rpg_border.js` | World border for the RPG world. | `/rpgborder` |
| `rpg_protect.js` | No breaking/placing/buckets/fire in the RPG world except ops or tag `rpg_builder`. | |
| `safe_explosions.js` | Cancels explosions in hub + RPG world. | `/safeexplosions` |
| `skill_blacklist.js` | **Banned skills** removed from players on login and every 30 s: predator, gluttony, creator, fusionist, infinity_prison, cultivator, pride, jinchuriki, crasher, coalescence, victorious_harbinger. **Unique replacement (2026-10-17):** if a banned *unique* is removed, the player gets a random allowed unique (the `UNIQUES` list = `startingSkills` from the config) via ManasCore `getSkillsFrom(p).learnSkill(ResourceLocation.parse(id))`. Every player is also checked **once** (flag `ot_unique_checked`, 30 s after they have a race): no unique from the list → given one. | `/skillban list/status/check/scan/unique <p>/giveunique <p>` |
| `smp.js` | The SMP world (`multiworld:wild`) command and info. | `/smp` |
| `vote_links.js` | `/vote` clickable links (keep it: the vote menu mod needs /vote to exist). | `/vote` |
| `welcome.js` | Join message + rotating announcements. | `/announce`, `/announce welcome` |
| `serversetup/worlddamage.js` | The owner's own protection script (now in the repo with its config `config/serversetup/world_damage.json`): cancels ALL damage to players in `protected_worlds` (hub + rpg) at HIGHEST priority, except void and /kill. **Edited 2026-10-17: players inside the Caverns area are not protected** (`wdInCaverns`). Uses helpers `ssReadJson`, `ssDimId`, `ssMsg` from other serversetup files that are not in the repo. | `/worlddamage`, `/worlddamage reload` |
| `serversetup/scoreboard.js` | Per-player sidebar using NeoEssentials placeholders from `config/serversetup/scoreboard.json`. Extra lines: hub = "ONLINE", RPG = "Use /wild to leave spawn", **every other world = "Use /hub to return to spawn"**. | `/sidebar`, `/sidebar test/where` |

**The server has more files in `kubejs/server_scripts/serversetup/` that are NOT in this repo**
(the helpers `ssReadJson`, `ssDimId`, `ssMsg`, `ssLegacyToJson` and others). Ask the owner to upload any of them before editing anything that touches them.

---------------------------------------------------------------------------------------------------

## 4. The Caverns + mob/boss spawn system (`mob_spawns.js`)

- Staff place a mob with a spawn egg, look at it and run `/setmob` or `/setboss` (aliases: `/mobspawn mob|boss [minutes]`).
- Saved in server persistentData `ot_spawns` (rotations in `ot_spawn_groups`). Each spawn: dim, x/y/z, type
  (`getEncodeId`), name key, kind (mob/boss), minutes, uuid, down (death time).
- The mob is never renamed. A `text_display` above it shows its real name (gold for mobs, red with skulls for
  bosses), and a respawn countdown when dead. Dead bosses show a red countdown bossbar to players within 48 blocks.
  `SHOW_ALIVE_BAR = false` (the owner doesn't want bars on living bosses).
- Mobs are pulled back if they go more than `LEASH = 28` blocks from their spot.
- **Bosses (changed 2026-10-17):** `FREEZE_BOSSES = false`, so bosses chase players but are put back if they go more
  than `BOSS_ROAM = 10` blocks. A boss still frozen by the old version (movement speed base 0) is discarded once
  (no death event) and respawns fresh (`sp.unfrozen` flag, so it happens only once per spawn).
- **Boss strength, Caverns only:** /setboss bosses standing inside the Caverns area get `BOSS_HP_BONUS = 100` (%) extra
  max health and `BOSS_DAMAGE_BONUS = 50` (%) extra attack damage (attribute modifiers `overthrone:boss_hp` /
  `overthrone:boss_damage`, add_multiplied_base, value/100). Outside the Caverns: no change. In game:
  `/mobspawn power` (show), `/mobspawn power <health%> <damage%>` (-90..1000, for every boss of the rotation near
  you, or the nearest boss), `/mobspawn power reset`. Stored per spawn (`sp.hpB`, `sp.dmgB`). The applied value is kept on
  the boss (persistentData `ot_buff`) and updated within 5 s, keeping the boss's health %.
- `STRIP_SKILLS = ['nullification','regeneration']`: those Tensura skills are removed from spawned mobs (on adopt
  and every 5 s) because they made bosses unkillable.
- **Boss rotations:** `/mobspawn rotation [minutes]` (default 30) turns all boss spawns within 32 blocks into
  one rotation. One boss at a time, shuffled cycle, never the same twice in a row. The text shows
  "☠ Random Boss ☠ Arrives in mm:ss". `/mobspawn rotation next` and `/mobspawn rotation off`.
- Other commands: `remove`, `remove kill`, `time`, `move` (moves a spot; in a rotation it moves all its bosses),
  `info` (debug line), `list`, `respawnall`, `holo`, `clearall`, `skills`.
- Tracking (changed 2026-10-17): a spawn's mob is found by UUID, then by its tag `ot_sp_<id>`, then by taking
  over an **untagged mob of the same type near the spot** (some mod bosses replace themselves on phase change).
  "Loaded" now uses `ServerLevel.isPositionEntityTicking(BlockPos)` (falls back to the old chunk/player check),
  so a boss whose chunk loaded before its entities isn't counted as missing and spawned twice.
  A mob missing for 15 s while the area is loaded counts as gone and respawns.
- Bosses in the Caverns really have **up to 7 armour layers** (a mod mechanic) that must be broken before they
  take damage. That's why "no damage" was reported, not a bug. The warning boards (`/cavernadmin board`) explain it.

---------------------------------------------------------------------------------------------------

- **Mob pile-up bug fixed 2026-10-18:** `spawnNow` summoned, then looked for the new mob only within 2 blocks; if it wasn't
  found (pushed away in a crowd) it returned false and summoned AGAIN every second, piling up dozens of mobs (High Orcs).
  Now: one summon, then 60 s (`sp.pendingAt`) of looking for the newest untagged mob of that type within the leash range.
  Every 5 s, extra living mobs carrying the same spawn tag are discarded (`dedupe`). `/mobspawn cleanup` discards untracked
  mobs of a spawn's type within 32 blocks of its spot (player-owned pets are kept).

- **Orcs still piling up (2026-10-18, second fix):** `/mobspawn cleanup` removed 0 because the piled-up mobs were High Orcs,
  NOT the spawn's exact type, and cleanup only matched the exact type. The cause of the extra High Orcs is NOT verified
  (could be natural spawns, a boss's summons, or mobs that turned into another mob). Fix that works whatever the cause:
  a **crowd guard** in mob_spawns.js (`CROWD_CAP = 8`, `CROWD_RADIUS = 24`; 0 = off). Every 5 s, around each loaded spawn
  spot, "loose" mobs (monster category OR same mod namespace as a spawn in that world; untracked; not owned by a player incl.
  offline players via the profile cache; no custom name; not easy_npc/armor stands) above the cap are discarded, youngest
  first, a living mob's own summons last, old-spawn-tag leftovers first. `/mobspawn cleanup` now removes ALL loose mobs within
  32 blocks of any spot (any type). New `/mobspawn scan [radius]` lists mobs near you by type: tracked / loose / summoned by a
  mob / old spawn tag / pets / named. Ask the owner for its output if pile-ups continue. Test: `tests/mob_spawns/test5.js`.

- **No cash / no level XP for Caverns kills (2026-10-18):** caverns.js, leveling.js, professions.js (Combat XP),
  overthrone_quests.js (kill quests; that file is switched off on the server), cosmetics_fx.js (kill effects) and mob_spawns.js (boss kill message) found the killer
  with `event.source.getPlayer()`. Kills made with Tensura skills use Tensura damage types that hide the attacker from KubeJS,
  so no player was found = no rewards, while vanilla still dropped XP orbs (it uses its own kill credit). New
  **kill_credit.js** defines global `otKillerOf(event)`: source player → source attacker/actual → direct/immediate entity
  (projectile) → `entity.getKillCredit()` (vanilla credit, same as XP orbs) → `getLastHurtByMob()`; a player-owned pet/summon
  credits its owner. Read-only. Callers use `typeof otKillerOf === 'function' ? otKillerOf(event) : event.source.getPlayer()`.
  **Rule: never use `event.source.getPlayer()` alone for kill rewards; use otKillerOf.** `/killcredit` (op) shows the last 8
  mob kills, who got credit and how. The exact cause on the live server is not verified; ask for `/killcredit` output.
- **"CLIENT-SIDE" label on cosmetics_fx.js in the MintServers file manager:** that's the panel's own guess from the file
  contents (particles). Any file in `kubejs/server_scripts/` runs on the server; the effects are vanilla particles sent by
  the server, so nothing is needed on the client.

- **KubeJS can't see `getYRot()` / `getXRot()` on players here** (TypeError "Cannot find function getYRot in object
  ServerPlayer"). Use the KubeJS names `p.yaw` / `p.pitch` (with fallbacks). This broke every aura (the render threw before
  drawing) and made npc_menus `looked()` fall back to the old ray trace (= the "attach picks the wrong NPC" bug). Both fixed.
  cosmetics_fx sends commands through the server from the tick event (`SRV`), logs each distinct error once, and
  `/cosfx debug` now reports the test burst's own result plus a raw `/particle end_rod` for comparison.
- **Manas Cosmetics (owner wants it instead of / next to particles):** engine only, each cosmetic = `.bbmodel` + JSON sidecar
  (position/scale/rotation), in-game editor `/manas_cosmetics edit`, 14 slots incl. aura/back/pet. The sidecar format and
  folder are NOT verified: get the mod jar from the owner before making any.

- **Particle cosmetics showed nothing (2026-10-18, cosmetics_fx.js):** they used `ServerLevel.sendParticles` via
  Java.loadClass (ParticleTypes / DustParticleOptions); in game nothing appeared and errors were swallowed. Now every
  particle is a vanilla `/particle` command like crate_fx.js (proven on this server):
  `execute in <dim> positioned x y z run particle <id|dust{color:[r,g,b],scale:s}> ~ ~ ~ dx dy dz speed count force @a[distance=..48]`.
  `// priority: 10` header so it loads before npc_menus.js (which builds the menus from `OT_FX`). `/cosfx debug` (op) shows
  owned/equipped effects + error count and fires a test burst. Effects only show when OWNED and equipped (or previewed).

- **Caverns NPC showing Silas (2026-10-18, npc_menus.js):** a copied Easy NPC keeps the original's `ot_mid_` id tag (and
  its `ss_npc_anchor` lock spot). `/npcmenu put` teleported EVERY hologram with that tag, so the original's hologram
  ("SILAS THE MERCHANT") was moved over the copy. Now `put` calls `refreshHolo` (idOf gives a copy its own id, then its own
  hologram is placed fresh from its type / style / stored `ot_menu_title`). When idOf finds a copy during attach/fixall it
  also gives it its own lock spot where it stands (`ownAnchor`). `/npcmenu fixall` also removes holograms floating away
  from their NPC. New `/npcmenu info`. Not verified how the owner placed the NPC; this was the only code path that moves
  another NPC's hologram.

- **Stuck nodes (2026-10-18, professions.js):** when a node's timer ended while its area was unloaded, `respawn` deleted the
  timer but `setblock` did nothing there, so the node stayed empty forever with a frozen "Respawns in 36s" text (the restart
  respawn in `ServerEvents.loaded` had the same problem). Now: `respawn` waits until the block's chunk is loaded
  (`level.isLoaded(BlockPos)`), staff commands force it; every 5 s ready nodes that are empty get their block back (`heal`);
  floating texts are kept by `syncHolos` once a second (one per node, extras/orphans removed, text written by UUID, no more
  `data merge ... limit=1`). Test: `node minecraft/tests/professions/test.js minecraft/kubejs/server_scripts/professions.js`.

- **2026-10-18 07:09 crash:** the guard WAS loaded but threw `Cannot find function getEntity in object DamageSource
  (tensura.paralyzing)`: Tensura's own DamageSource subclasses don't expose getEntity() to KubeJS, so the guard stopped and
  the death went through. **Rule: never call `src.getEntity()` directly on damage sources here**; use the `attackerOf(src)`
  helper (getEntity → getActual/actual → direct entity's owner), now in slr_death_guard.js, mob_infighting.js and mob_tweaks.js.
  The victim check runs before anything touches the damage source.

- **Guide NPC menus (2026-10-18, npc_menus.js):** new menu types `serverguide`, `tensuraguide` (+ race pages: 15 Tensura races
  with paths from the website guide, and the Mysticism/Kumodesu/SlimeThrone races which only say "B → Evolution Menu" because
  their paths aren't verified yet), `slguide`, `hunters` (Hunter Association), `market` (Silas). Generic `guidePage()` builder.
  Commands `/serverguide /tensuraguide /slguide /huntermenu /marketmenu`. They replace the old Easy NPC dialog NPCs when
  attached. NOT done yet (needs the SLR jar): opening SLR's Hunter Evaluation screen straight from the NPC; Solo Leveling
  job change / dungeon details; Mysticism evolution paths.

- **Floating text rewrite (2026-10-18, mob_spawns.js):** stacked names + frozen timers came from text_display entities
  being removed with `kill @e[...]` (only reaches LOADED areas) and re-summoned blind (startup, changes while unloaded),
  and `setHolo` updating only one copy (`limit=1`). Now `syncHolos()` runs every second: per world it scans all our
  text_displays (tag `ot_spawnholo` + `ot_sp_<id>` / `ot_grp_<gid>`), keeps exactly one per spawn (none for dormant
  rotation members), discards extras and leftovers of deleted spawns, writes the text only when it changes, moves it back
  if misplaced, and only acts where the area is entity-ticking. Startup no longer places texts. Duplicate spawn entries
  (same type/kind on the same block) are merged at startup. findMob's "take over an untagged mob" is bosses-only now.
  spawnNow adopts the YOUNGEST (<5 s) untagged mob of the type near the spot.
  **Tests:** `sh minecraft/tests/mob_spawns/run.sh` simulates the script on a fake world (node). Run it after every change.

- **NPC grab/put fix (2026-10-18):** `/npcmenu put` now saves the new spot as the NPC lock anchor (`npSetAnchor` from
  serversetup/npcprotect.js, or the `ss_npc_anchor` compound) BEFORE teleporting, then runs `npProtect`. The old code removed the
  anchor and ran `/npclock here` without its required radius (failed silently), leaving the NPC unanchored and pushable.
- **Mysticism elemental realm (`mysticism:elemental_realm`)** spawns (from the mod jar's biome files): fire biome
  tensura:salamander, earth tensura:beast_gnome, water tensura:aqua_frog, wind tensura:feathered_serpent, space
  tensura:winged_cat, darkness mysticism:shadow_imp, every biome mysticism:memoires + vex (+ blazes/allays as creatures).
  Mysticism race evolution requirements live in its config files (config classes io/github/Memoires/mysticism/config/race),
  so they must be read from the server's config folder, not guessed.

## 5. Known mod bugs and their workarounds

- **Solo Leveling (SLR 1.3.3) crash:** `XPGainTShadowProcedure.java:53` NullPointerException ("Ticking entity")
  when a mob kills another mob (e.g. Tensura Orc kills Goblin in the RPG world). Workaround: `mob_infighting.js`.
  Don't clear those mobs with `/kill` (it might trigger the same code). A fixed SLR version would be the real fix.
- **Same SLR crash, 2026-10-18:** a player killed by `tensura_neb:rimuru_clone` in the Caverns (multiworld:rpg). Every crash
  so far: the killer was a Tensura tamable-type mob (TensuraTamableEntity / PlayerLikeEntity) with no player owner. No KubeJS
  frames in the stack: the NPE is inside SLR's own LivingDeathEvent listener. It only started for players in the RPG world
  because the Caverns became a combat zone (before that, players couldn't die there). **Workaround:** `slr_death_guard.js`
  (LivingDamageEvent$Pre: if a hit from a tamable mob whose owner isn't a player would kill, damage is set to 0 and the
  victim is killed one tick later with `kill()`, i.e. a death with no killer). Line 53 of XPGainTShadowProcedure has NOT
  been read yet: the SLR jar (`mods/SLR1.3.3.jar`) is needed to confirm the exact null. Remove the guard when SLR fixes it.
- **2026-10-18 update:** `slr_death_guard.js` did NOT stop the crash (owner reported it still crashed; no new crash report
  seen yet). Owner told to delete it. **The Caverns combat zone is switched OFF** (`CAVERNS_COMBAT = false` in
  damage_zones.js, `WD_CAVERNS_COMBAT = false` in serversetup/worlddamage.js), so the whole RPG world is safe again, which was
  the state before the crashes. Turn both back to true only after SLR is fixed/patched. Still needed from the owner:
  `mods/SLR1.3.3.jar` (to read XPGainTShadowProcedure line 53 with javap), the newest crash report and latest.log.
- **2026-10-18 (later): new evidence.** Killing a boss (Ifrit, Rimuru) leaves clones/summons whose owner is the boss. Vanilla
  `OwnableEntity.getOwner()` only looks owners up among PLAYERS, so for boss-owned mobs it returns null; SLR then calls
  getCapability on that null owner. Crashes happened both when such a clone killed a player AND when a player killed a clone.
  `slr_death_guard.js` v2 (LivingDamageEvent$Pre, lethal hits only): victim owned + owner not an online player ->
  damage 0 and `discard()` (no death event); offline players' pets (owner UUID in the server's profile cache) are never
  discarded, the lethal hit is just blocked. Killer owner-type + owner not an online player -> damage 0, victim `kill()`ed
  next tick. `/slrguard` shows which event was hooked and counters. **Caverns combat zone is ON again** (owner insisted).
  mob_spawns.js no longer adopts owned mobs (clones) as a missing boss. Still unconfirmed: SLR line 53 itself (need the jar).
- **Tensura skill events:** never hook them (crash, see section 2).
- **Skills griefing the hub/RPG world:** fixed by the **TenSura Compat: FTB** mod (server-side only,
  `abilityGrief=false`) plus FTB Chunks claims owned by team `hub#0d6da155` over the hub and RPG world.
  Keep `/gamerule skillGriefing true` (false disables skills everywhere).
- "Failed to decode packet clientbound/minecraft:custom_payload" kicks = Solo Leveling bug. Fully restart the game.
- The server host is short on RAM/swap (seen in crash reports). Lag can come from that.

---------------------------------------------------------------------------------------------------

## 6. Tensura config edits

- `minecraft/config-edits/reincarnation_config.toml` = full replacement for `config/tensura/reincarnation_config.toml`,
  with the banned skills taken out of `startingSkills` and `secondSkills`.
- **Tensura already gives every player ONE random unique skill when they first pick their race**
  (`skillNumber = 1`, pool = `startingSkills`). **Don't build a second "random skill on join" system.**
  Problem the owner reported: players whose unique was banned (removed by skill_blacklist.js) ended up with no unique.
  Fixed in `skill_blacklist.js` (replacement + one-time check, see section 3). If `startingSkills` changes, update `UNIQUES`
  in skill_blacklist.js to match.

---------------------------------------------------------------------------------------------------

## 7. Website (this repo, `bonglord4201/overthrone-website`)

- Cloudflare Worker + static assets (`public/`) + D1 database `overthrone-db`. It deploys from GitHub `main`
  (`npm run deploy` = `wrangler deploy` + D1 migrations). Admin panel `/admin` (Cloudflare Access).
- Generated content: `scripts/guide-data.mjs` (Player Guide sections + update posts) → `node scripts/build-pages.mjs`
  → writes `public/guide.html`, `public/rules.html` and the migrations. Never hand-edit generated files.
- Update posts so far: 1.3 (`0009`), 1.4 Caverns (`0010`), 1.5 Caverns Bosses (`0011`: announcements,
  server-updates, changelog posts, and it refreshes "The Caverns Guide" post only if unedited). New updates =
  new `UPDATEXX_POSTS` in guide-data.mjs + a new numbered migration in build-pages.mjs. Never edit an applied migration.
- **Update 1.6** (2026-10-17): `UPDATE16_POSTS` + migration `0012_update_1_6.sql` (Caverns combat zone, tougher bosses,
  crate key drops, keep inventory except SMP, unique skill replacement, fixes). It refreshes "The Caverns Guide" post only if
  it still equals `CAVERNS_GUIDE_1_5` in build-pages.mjs. Discord: `#changelog` has an Update 1.6 block, and the @everyone text is
  in `discord-bot/announcement-update-1-6.txt`. Next update = `UPDATE17_POSTS` + `0013`, freezing the current Caverns guide
  body as `CAVERNS_GUIDE_1_6` first.
- Work branch used by Claude: `claude/trusting-hawking-0enn7u`. PR #16 (Update 1.5) is merged; Update 1.6 is in a new PR. Merging to `main`
  deploys the site.
- Other docs in the repo: `PROJECT-STATUS.md` (website/Tebex status), `tebex-storefront/`, `marketing/`, `notes/`.

## 8. Discord bot (`discord-bot/`)

- Node bot. `content.json` is generated by `node scripts/build-discord-content.mjs` from
  `scripts/build-discord-content.mjs` (channels: welcome, link, rules, links, faq, commands, mods, quests, bosses,
  races, changelog, staffcommands).
- To update Discord: upload the new `content.json` to the bot, then in Discord run `/server content only:<channel>`
  (e.g. `changelog`) or `/server staffcommands` for the staff channel.
- Announcements: `/announce channel:#announcements title:... message:... ping:...` (`\n` = new line).
  Ready text for Update 1.5: `discord-bot/announcement-update-1-5.txt`.
- Staff command sections already documented: Crates, Caverns (+ board + key drops), Mob & boss spawns, Boss
  rotations, Mob tweaks, Hub protection & claims, Banned skills, `/whyhurt`, `/mobinfighting`, `/keepinv`.

---------------------------------------------------------------------------------------------------

## 9. Open items (as of 2026-10-17)

1. **Upload and test** the 2026-10-17 changes (none tested in game yet): `damage_zones.js`, `serversetup/worlddamage.js`,
   `mob_spawns.js`, `skill_blacklist.js`. Tests: `/damagezones` and `/worlddamage` inside the Caverns = damage on,
   elsewhere in the RPG world = protected. Mobs/bosses chase and hit in the Caverns. `/mobspawn power` shows +100%/+50%.
   `/skillban unique <player>` shows a unique for players who lost theirs.
2. ManasCore `learnSkill` was checked against ManasCore's GitHub source (1.21.1 branch), not against the exact jar on the
   server (4.0.0.2). If `/skillban giveunique` fails, check the server log line `[skill_blacklist] could not give`.
3. **Playtime on the sidebar looks reset** (it showed hours, then 55m). It comes from a NeoEssentials placeholder in
   `config/serversetup/scoreboard.json`. Get that file to see which placeholder it uses (session vs total).
4. "Display entity Not a string" log error and names shown twice: needs `logs/latest.log` from when it happens.
   It isn't from any of Claude's scripts as far as checked.
5. The "Supermassive Slime" boss may still be unkillable (unconfirmed).

## 10. Already decided (don't undo)

- Items drop on death only in `multiworld:wild` (SMP). The owner has confirmed this works.
- Bosses don't show a health bar while alive. Only the dead-boss countdown bar shows.
- Mobs roam 28 blocks. Bosses 10 blocks.
- Boss buffs apply only inside the Caverns, never to bosses elsewhere.
- Don't change player classes or class skills.
- Banned skills list (section 3) is final unless the owner changes it.
