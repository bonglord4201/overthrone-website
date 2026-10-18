# OVERTHRONE custom cosmetics for Manas Cosmetics

Goes on the server in `config/manas_cosmetics/` (layout from the mod's own README, manas_cosmetics 1.0.6):

- `models/<slot>/*.bbmodel`: the 3D models (open/edit them in Blockbench)
- `cosmetics/*.json`: one settings file per cosmetic (auras have only this file, the mod draws them itself)
- `previews/`: pictures of the models, not needed on the server

Rebuild: `python3 scripts/build-manas-models.py` and `python3 scripts/build-manas-auras.py`.
In game (op): `/manas_cosmetics reload`, `/manas_cosmetics list`, `/manas_cosmetics edit <id>` (move/scale/rotate a model,
or design an aura with live preview), `/manas_cosmetics unlock <player> <id>`.
Shop/crate list: `minecraft/kubejs/server_scripts/manas_cosmetics.js`. Players equip with `/wardrobe`.
