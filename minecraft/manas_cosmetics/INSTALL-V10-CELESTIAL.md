# Celestial Sovereign v10: wearable wings + full armour (rebuilt with solid sculpted plates)

## What's in this set
The cosmetic IDs are unchanged, so the Throne Shop, the Cosmetic Crate and player ownership keep working.

| Piece | ID | Slot | Model file | Size |
|---|---|---|---|---|
| Wings | `overthrone:celestial_sovereign_wings` | back | `models/back/celestial_sovereign_wings.bbmodel` | 1,435 cubes, 240 KB compressed |
| Helm | `overthrone:celestial_sovereign_helm` | helmet | `models/helmet/celestial_sovereign_helm.bbmodel` | 229 cubes, 20 KB |
| Armour | `overthrone:celestial_sovereign_armor` | armor_set | `models/armor_set/celestial_sovereign_armor.bbmodel` | 543 cubes, 46 KB |
| Greatsword | `overthrone:celestial_sovereign_blade` | weapon | `models/weapon/celestial_sovereign_blade.bbmodel` | 35 cubes, 5 KB |

- The JSON definitions in `cosmetics/` are the same files already on the server. They're included so the zip is a complete set.
- The textures are embedded in each `.bbmodel`, the same way as all the other working OVERTHRONE cosmetics: a main texture plus a full-bright `_glow_e` texture.

## Install (MintServers)
1. Back up the server first (Backups → create).
2. Upload the four `.bbmodel` files from `config_manas_cosmetics/models/...` into the same folders under `config/manas_cosmetics/models/` on the server, replacing the old ones.
3. Optional: also upload the four `.json` files from `config_manas_cosmetics/cosmetics/` into `config/manas_cosmetics/cosmetics/`. They're identical to the ones already there.
4. Run `/manas_cosmetics reload`, or restart the server.
5. Players don't need new files. The mod sends models to players when they join.

No scripts, shop, crate rewards or other cosmetics change.

## Rollback
The previous versions of the four files are in `rollback/` in this zip. They're also in the repo at `minecraft/manas_cosmetics/backups/celestial_v8_stage1/`.
1. Upload them back over the new files in the same folders.
2. Run `/manas_cosmetics reload`.

## Checked offline (not in game)
- The validator (`python3 minecraft/tests/validate_manas_cosmetics.py`) passed: 171 cosmetics, all present in OT_MANAS.
- **Armour layout:** the armour has exactly the top-level bones body/arm_r/arm_l/leg_r/leg_l on the correct sides, and its box is centred at 12.
- **Animations and textures:** every animation drives bones that exist, and every face points at a texture that exists.
- **Format:**
  - Back models use `needs_y_flip: true`.
  - The weapon's grip bone is at the origin.
  - Every model is under the mod's 1024 KB network limit.
- **Previews:** rendered from the actual installed `.bbmodel` files using the mod's own placement maths (`scripts/manas/sim.py`).

## NOT tested
None of this has been tested in game, so I can't confirm any of the following yet:
- that the wings sit right on the back
- that they flap
- that the plates follow the arms and legs
- the full-bright feathers at night
- frame rate with 1,435 wing cubes

Please equip all four pieces in `/wardrobe` and send a video from the front, back and side.
