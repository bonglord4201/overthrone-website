# Installing OVERTHRONE cosmetics v6 (detail rework + 10 armour & wing sets + 10 set pets)

v6 includes everything from v4 and v5, so you only need this zip.

## What's new in v6
- **Hand-painted textures everywhere.** A new pixel-art painter gives:
  - gold with 5 shading tones and engraved lines
  - bevelled plates with light and shadow edges
  - faceted gems with highlights
  - gold filigree scrolls and dark outlines

  It's used on the armour, helms, crowns, halos, weapons, wing blades and trim.
- **Armour rebuilt like your reference.**
  - A slim painted shell hugs the whole body: a chest design with plates, gold sashes, a gem medallion, belt and tabard; back, sides, arms and legs with plates, gold bands, gems and energy lines.
  - Sculpted 3D layers sit on top: gorget, medallion, belt and buckle, tassets, three-tier pauldrons with ornaments, cuffs, knee guards and boots.
  - Moving parts:
    - a **cape** that sways and lifts when you run or fly
    - **pauldron feathers, spikes and crystals** that flutter
    - a **chest core** that pulses and spins
  - **Particles rise off the shoulders and the core.**
  - Each set has its own pattern: feathered, demonic, sun-rayed, icy, scaled, bone, leaf or royal.
- **Helms** are painted: side plates with filigree, a jewelled brow band, ear plates, and the set's crown, horns or crest. Sparkles drift above them.
- **Weapons** are painted: a bright-edged steel blade with a dark ridge and glowing fuller, a striped wrapped grip, engraved gold guards.
- **Wings:** painted engraved gold blades, and a second particle stream of sparkles shedding off the wingtips.
- **Baby dragons rebuilt** (Storm and Ember):
  - rounded body with overlapping painted scales and a ribbed belly
  - curved horns, frills, fangs and clawed feet
  - glowing back spikes, veined membrane wings, and a 6-part tail with a glowing fin
  - a jaw that opens when they roar (their random trick)
- **10 set pets:**

  | Set | Pet |
  |---|---|
  | Celestial Sovereign | Seraph Chick |
  | Void Overlord | Void Dragonling |
  | Solar Emperor | Sun Fox |
  | Frost Monarch | Frost Fox |
  | Storm Dragon | Storm Dragonling |
  | Blood Demon King | Blood Wisp |
  | Abyssal King | Abyssal Jelly (a glowing jellyfish with a pulsing bell and swaying tentacles) |
  | Soul Reaper | Soul Lantern |
  | Verdant Dragon Emperor | Forest Dragonling |
  | Thronebreaker Ascendant | Crimson Phoenix |

  Each pet is sold on its set's page in the Throne Shop and is also a crate reward.
- Everything is sold in the Throne Shop (3D COSMETICS, plus ARMOUR SETS with one page per set: 8 pieces each). Caverns key drops are off, and Cosmetic Keys are Tebex-only (same as v5).

## Install
Same steps as `INSTALL-V5.md`:
1. Back up in the MintServers panel (Backups → create).
2. Upload `config_manas_cosmetics/models` and `config_manas_cosmetics/cosmetics` into `config/manas_cosmetics/`. Say yes to replacing files, and don't delete anything else.
3. Upload these from `kubejs_server_scripts/` into `kubejs/server_scripts/`, replacing the old ones:
   - `manas_cosmetics.js`
   - `npc_menus.js`
   - `crates.js`
   - `caverns.js`
   - `guide_books.js`
4. Restart the server.
5. Run these commands:
   - `/manas_cosmetics reload`
   - `/crate reward sync cosmetic` (never `reset`)
   - `/crate hologram cosmetic` (stand at the Cosmetic Crate)
6. Players don't need new files.

Rollback: restore the backup from step 1.

## Checked offline
- All JSON, models, paths, IDs, slots and sidecar types pass.
- Armour limb binding and its placement centre pass.
- Weapon grip and type pass.
- Ground decals are flat.
- Every cosmetic has a price and is in `OT_MANAS`.
- Size limits pass.

The preview sheets are in `previews/` (one `set_*.png` per set).

## Needs testing in game
- The armour follows the arms and legs.
- The cape and pauldron ornaments move.
- Weapons point the right way in the hand.
- Sigils lie flat.
- Auras trail behind you.
- The pets' tricks play.
- The glow looks right at night.

Send a video of anything that looks off.
