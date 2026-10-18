# Installing the OVERTHRONE 20 cosmetics

## Why ChatGPT's version did not show up

I checked its files against the Manas Cosmetics 1.0.6 code. These problems stopped them from loading:

1. **Every settings file was refused.** All 20 `cosmetics/*.json` files had `"scale": 1.0`, but the mod needs a list like `[1.0, 1.0, 1.0]`. The mod skips any file it can't read ("Failed to load sidecar"), so none of the 20 were registered.
2. **The head pieces used a slot that doesn't exist.** Five of them used `"slot": "head"`, which the mod rejects. The real slots are `helmet` (sits on the head) and `above_head` (floats above it).
3. **The auras used made-up settings.** The style `orbit` doesn't exist, the particles were `minecraft:end_rod`/`crimson_particle` (the mod only takes glow, orb, spark, pixel, smoke, ring, crystal, star, tear or comet), and the colours were in the wrong format.
4. **The wings would have been upside down.** They were built "Y-up above the neck", but the mod flips back models only when they are built below the neck.
5. **No animation and no real texture.** Every face used the same corner of the texture, and the `textures/` PNGs aren't used by the mod at all.
6. **It broke your Demon Lord Horns.** `demon_horns.json` and `demon_horns.bbmodel` used the same name and ID as your existing horns, so uploading it replaced them.
7. **They were never added to the shop or crate.** The shop and crate read `manas_cosmetics.js`, which didn't list them.

## What's in the new version

- All 20 cosmetics were rebuilt from scratch with the same IDs and names. Each model is layered and 3D, with its own animation (wings flap, halos and crystals spin, tails sway).
- **Demon Lord Horns** keeps your original model. There's only one `overthrone:demon_horns`, so there's no duplicate.
- The 3 auras now use real mod styles:
  - Shadow Smoke: smoke vortex
  - Arcane Rune: rune circle
  - Golden Inferno: flames
- The cosmetics were added to `manas_cosmetics.js`. All 71 cosmetics you already had are unchanged, with the same IDs.
  - **Shop (Throne Shards):**
    - Celestial, Storm Crystal, Blood Demon, Frost Shard and Bone Reaper Wings: 11,000
    - Seraph Halo and Infernal Mech Wings, and Spirit Fox Tails: 12,000
    - Verdant Spirit Wings: 9,000
    - Crimson Crystal Orbit: 9,000
    - Blood Rune Circlet: 6,000
    - Void Crown: 8,000
    - Shadow Smoke and Arcane Rune Auras: 6,000
  - **Cosmetic Crate only (rare):** Overlord Wings, Void Star Wings, Throne Guard Wings, Throne Halo and Golden Inferno Aura.
- New staff command: `/crate reward sync cosmetic` **adds** missing cosmetics to the Cosmetic Crate and keeps every reward already in it. **Do not use `/crate reward reset cosmetic`.**

## Install (step by step)

### 1. Back up first
In the MintServers panel, open **Backups** and create a backup. Or download these and keep them:
- `config/manas_cosmetics/`
- `kubejs/server_scripts/manas_cosmetics.js`
- `kubejs/server_scripts/crates.js`

### 2. Remove ChatGPT's broken files
In the panel's File Manager, open `config/manas_cosmetics/` and delete **only** these:
- the folder `models/head`
- the folder `models/aura`
- the folder `textures`
- `cosmetics/arcane_rune_aura.json`
- `cosmetics/golden_inferno_aura.json`
- `cosmetics/shadow_smoke_aura.json`

The new auras are called `aura_arcane_rune_aura.json` and so on. ChatGPT's 3 aura files would clash with them because they use the same IDs.

### 3. Upload the new cosmetic files
Unzip `overthrone-20-cosmetics.zip`. Inside `config_manas_cosmetics/` there is a `models` folder and a `cosmetics` folder.

Upload those two folders **into** `config/manas_cosmetics/` on the server, merging with the folders that are already there. Say yes to replacing files with the same name.

Do **not** delete or replace the whole `config/manas_cosmetics/` folder.

When you're done, the zip's files should be in these places:
- `config/manas_cosmetics/models/back/`: 12 new `.bbmodel` files (wings and tails)
- `config/manas_cosmetics/models/helmet/`: `blood_rune_circlet.bbmodel`, `void_crown.bbmodel` and `demon_horns.bbmodel` (your original horns, put back)
- `config/manas_cosmetics/models/above_head/`: `throne_halo.bbmodel`, `crystal_orbit.bbmodel`
- `config/manas_cosmetics/cosmetics/`: the 20 `.json` files (17 named after the cosmetic, and 3 starting with `aura_`)

### 4. Replace two scripts
From the zip's `kubejs_server_scripts/` folder, upload these into `kubejs/server_scripts/`, replacing the old ones:
- `manas_cosmetics.js`
- `crates.js`

Don't touch `keep_inventory.js` or any other script.

### 5. Restart and load
1. Restart the server.
2. In game, as an op, run `/manas_cosmetics reload`.
3. Then run `/crate reward sync cosmetic`. It lists the cosmetics it added (up to 19).

### 6. Players
Players only need the **Manas Cosmetics client jar 1.0.6** that's already in the modpack. The models are sent from the server, so players don't need any new files.

## Check it in game (this can't be tested offline)
1. Run `/manas_cosmetics list`. All 20 IDs should be there. If one is missing, the server log says why (search for `manas`).
2. Give yourself one, e.g. `/manas_cosmetics unlock <you> overthrone:overlord_wings`, then open `/wardrobe` and equip it.
3. Check that:
   - the wings sit on your back and point up, not down
   - the halos float above your head
   - the circlet and crown sit on your head
   - the animations move
4. Open the Throne Shop, go to **3D COSMETICS**, and check the new items and prices.
5. Open the Cosmetic Crate preview and check the new rewards are listed.
6. If a cosmetic looks off: if you used **Personalise** or `/manas_cosmetics edit` on it before, reset it. Any custom offset or rotation turns off the mod's automatic fitting.
