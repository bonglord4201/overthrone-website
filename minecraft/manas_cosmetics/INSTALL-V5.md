# Installing OVERTHRONE cosmetics v5: 10 armour & wing sets, plus everything sold in the shop

## What's in this update
- **10 premium sets, 7 pieces each (70 new cosmetics):**
  - Celestial Sovereign
  - Void Overlord
  - Solar Emperor
  - Frost Monarch
  - Storm Dragon
  - Blood Demon King
  - Abyssal King
  - Soul Reaper
  - Verdant Dragon Emperor
  - Thronebreaker Ascendant (the endgame set, rarest and priciest)
- **The 7 pieces of each set:**
  - **Wings** (back slot): 2–4 layered wing sets (feathers, obsidian plates, crystals, dragon or fin membranes, bone wings), gold blade arcs, glowing gems, floating crystals and built-in effects. They flap, fold and glide like the v4 wings.
  - **Helm** (helmet slot): a crown or helmet in the set's style: feathered royal crown, horned, sun crown, frozen diadem, dragon helm, demon horns, fin crest, skull helm, antlers, or the imperial crown with a floating crystal.
  - **Armour** (armor_set slot), a full suit:
    - chestplate with a glowing core that pulses and turns
    - layered pauldrons with feathers, spikes, crystals, scales, bones, leaves or fins
    - vambraces and gauntlets
    - tassets, knee guards, greaves and boots
    - Each part is bound to its limb by the mod, so it moves with the arms and legs.
  - **Weapon skin** (weapon slot): a sword, greatsword, spear, crystal blade, dragon blade, jagged blade, trident, scythe or leaf blade. It shows over **any sword you hold**.
  - **Blade Aura** (weapon aura): set-coloured particles along your weapon.
  - **Aura:** set-coloured magic around you that **trails behind you when you move**.
  - **Sigil** (ground slot): a glowing rune circle under your feet with two rings turning in opposite directions, faster when you walk.
- **Everything is sold now.** The Throne Shop "3D COSMETICS" section lists every cosmetic (all 161) with a Throne Shard price, plus a new **ARMOUR SETS** section with one page per set.
  - Cosmetics that used to be crate-only (Divine Sovereign Wings, Galaxy Wings, Throne Halo and so on) now have prices too. They're still rare Cosmetic Crate rewards.
  - Set pieces are also crate rewards (Thronebreaker is the rarest).
- **Crate keys:**
  - Caverns kills no longer drop crate keys.
  - The Cosmetic Crate now says "Keys only at overthronesmp.tebex.store".
  - The crates info board lists Cosmetic Keys with the Tebex keys.

## Install (step by step)
1. **Back up:** MintServers panel → Backups → create a backup. For a quick manual backup instead, download these:
   - `config/manas_cosmetics/`
   - the five scripts listed in step 3
2. Unzip `overthrone-cosmetics-v5.zip`. Upload the `models` and `cosmetics` folders from `config_manas_cosmetics/` into `config/manas_cosmetics/`. Say yes to replacing files.
   - It adds three new model folders: `armor_set`, `weapon` and `ground`.
   - Don't delete anything else in that folder.
3. From `kubejs_server_scripts/`, upload these into `kubejs/server_scripts/`, replacing the old ones:
   - `manas_cosmetics.js`: all 161 cosmetics with prices, the 10 sets and the set list
   - `npc_menus.js`: the shop shows every priced cosmetic, plus the ARMOUR SETS section
   - `crates.js`: the Cosmetic Crate includes the sets and reads the Tebex-only key text
   - `caverns.js`: no more crate key drops
   - `guide_books.js`: removed the "kills drop crate keys" line

   Nothing else changes. `keep_inventory.js`, classes, skills, races and all other scripts are untouched.
4. Restart the server.
5. In game, as an op:
   - `/manas_cosmetics reload`
   - `/crate reward sync cosmetic` adds every new cosmetic to the crate and keeps all existing rewards. Never use `reset`.
   - `/crate hologram cosmetic` (stand at the Cosmetic Crate) refreshes its floating text to the Tebex line.
   - `/crate infoboard place` (stand where the info board goes) refreshes the info board, if you use it.
6. Players don't need new files. The server sends the models (about 2.8 MB compressed in total).

## Rollback
- **Quickest:** restore the backup from step 1 in the MintServers panel.
- **Manual:**
  1. Put back the five old scripts you downloaded.
  2. Delete `config/manas_cosmetics/models/armor_set`, `models/weapon` and `models/ground`, and the new `cosmetics/*.json` files whose names start with a set name (e.g. `celestial_sovereign_*`).
  3. Put back the old `config/manas_cosmetics` if you saved it.
  4. Restart and run `/manas_cosmetics reload`.
- Players who already own a set piece keep it in their owned list. It just won't render while its files are gone.

## Changed files (repo paths)
- `minecraft/manas_cosmetics/models/**` and `cosmetics/**`: 70 new set cosmetics, 20 new auras and weapon auras, Divine Sovereign Wings
- `minecraft/kubejs/server_scripts/manas_cosmetics.js`, `npc_menus.js`, `crates.js`, `caverns.js`, `guide_books.js`
- Generators: `scripts/manas/sets5.py`, `scripts/manas/setdefs.py`, `scripts/manas/look5.py`, `scripts/manas/sim.py`, `scripts/manas/paint.py`, `scripts/build-manas-models.py`, `scripts/build-manas-auras.py`
- `minecraft/tests/validate_manas_cosmetics.py`
- `scripts/build-discord-content.mjs` + `discord-bot/content.json`: the Caverns key-drop text is corrected (only matters if you redeploy the bot)

## What I checked offline (all passed)
- All JSON parses.
- Every model is a valid Blockbench model with an embedded texture and the `idle` clip first.
- Every model path exists.
- All 161 IDs are unique, and every existing ID is still there.
- Every slot is one the mod accepts, and every sidecar value has the type the mod expects.
- Armour bone names and sides match the mod's limb binding, and the armour placement centre is exactly 12.
- Weapon skins use the `sword` type with the grip at the origin.
- Sigils are flat decals.
- Every cosmetic is in `OT_MANAS` with a price.
- No model is over the mod's 1 MB size limit.
- Placement was checked with the preview renderer, which copies the mod's maths (see `previews/set_*.png`).

## What must be tested in game (I can't run Minecraft)
- The armour pieces sit on the body and follow the arms and legs when walking. The armor_set binding is read from the mod's code but hasn't been seen in game.
- The weapon skins point the right way in the hand and in first person.
- The sigils lie flat under the feet and turn.
- The set auras trail behind you when you move.
- The glow, soft lights and effects look right at night.
- The ARMOUR SETS shop pages open and buying unlocks the piece in `/wardrobe`.

If anything sits wrong, send a screenshot or short video.
