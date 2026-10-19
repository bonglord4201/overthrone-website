# Celestial Sovereign v11 (new wings; armour, helm and sword carried over from v10)

## What changed and why
The Aurion video shows that its wings look premium because of the **painting**, not the number of parts. Each layer of the wing is one surface carrying many individually outlined feathers, shaded white to soft lavender, with uneven ragged tips.

v10 had built every feather as its own stack of 3D boxes. That gave 1,435 boxes that looked like rows of repeated strips.

v11 rebuilds the wings the way the reference does it, with a new feather painter (`scripts/manas/plumage.py`):
- **Six painted feather layers per wing:**
  - two rows of long primaries, with gold-edged tips and thin glowing cyan lines in some of them
  - long secondaries along the forearm
  - tertials near the body
  - three rows of rounded coverts (greater, median and small) over the feather roots
- **Every feather is different:** each has its own outline, length, width and angle, with a pointed, round or split tip, and some have a notch.
- **Depth:** each layer sits at its own depth and angle, with a second copy behind it for thickness.
- **Bright from both sides:** the feather faces are full bright (white like the reference), and the feather painting also shows on the side facing the front.
- **Frame:** a gold-and-ivory leading edge, two long gold blades sweeping past the tips, a cyan-gem crest at each wrist, and a jewelled harness on the back.
- **Size and animation:** the wings are taller and wider than v10. They use the same animations as before (idle, walk, run, jump, fly).
- **Parts:** 270 boxes (v10 had 1,435), 141 KB compressed.

The helm, armour and greatsword are the v10 models, unchanged.

## Install (MintServers)
1. Back up the server first.
2. Upload `config_manas_cosmetics/models/back/celestial_sovereign_wings.bbmodel` into `config/manas_cosmetics/models/back/`.
   - The other three `.bbmodel` files in the zip are identical to v10. Upload them too if you never installed v10.
3. Run `/manas_cosmetics reload`.
4. Players don't need new files.

The cosmetic IDs are unchanged, so the Throne Shop, the Cosmetic Crate and player ownership are untouched. No scripts change.

## Rollback
`rollback/` in the zip holds the v10 files. They're also in the repo at `minecraft/manas_cosmetics/backups/celestial_v10/`.
1. Upload them over the new files.
2. Run `/manas_cosmetics reload`.

## Validation (offline only)
- The validator (`python3 minecraft/tests/validate_manas_cosmetics.py`) passes:
  - 171 cosmetics, all in OT_MANAS
  - back model has `needs_y_flip` set
  - armour bone layout and centre are correct
  - animations only drive bones that exist
  - every texture index is valid
  - sizes are under the limit
- The previews are offline renders of the real installed files, using the mod's own placement maths. None of this has been tested in game.
