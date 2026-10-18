# OVERTHRONE custom cosmetics for Manas Cosmetics (v4)

Goes on the server in `config/manas_cosmetics/` (layout from the mod's own README, manas_cosmetics 1.0.6):

- `models/<slot>/*.bbmodel`: 3D models (open/edit them in Blockbench: blockbench.net). They have an `idle` animation,
  which the mod plays (wings flap, halos spin, crystals orbit).
- `cosmetics/*.json`: one settings file per cosmetic. `aura_*` (around the player) and `weapon_*` (along the held weapon)
  have only this file: the mod draws them itself.
- `previews/`: pictures of the models (not needed on the server).

Rebuild: `python3 scripts/build-manas-models.py` and `python3 scripts/build-manas-auras.py`. Designs live in
`scripts/manas/catalog4.py` (ids, names, colours) and `wings4.py` / `heads4.py` / `pets4.py`; preview a single model with
`scripts/manas/look.py`. Check everything with `python3 minecraft/tests/validate_manas_cosmetics.py`.
Install guide for the v4 rework: `INSTALL-V4.md`.
Shop/crate list: `minecraft/kubejs/server_scripts/manas_cosmetics.js` (every id there must have a file here).

## Adding bought or self-made models
1. The model must be a Blockbench project (`.bbmodel`) with its texture saved inside it (Blockbench: File > Save Project).
2. Put it in `models/<slot>/` (back, helmet, above_head, orbit, pet, weapon/<type>, ...).
3. In game: `/manas_cosmetics generate` (writes its .json), `/manas_cosmetics reload`, then `/manas_cosmetics edit <id>` to
   position it. Name an animation `idle` in Blockbench if it should move.
4. Add it to `manas_cosmetics.js` with a price (or `crate: true`) so it appears in the shop and the Cosmetic Crate.
