# OVERTHRONE cosmetics v13: all auras rebuilt, and they stay with you

This is installed on top of v12. Only aura and weapon-aura `.json` files change: no models, no scripts. The IDs are the same, so the shop, crate and ownership are untouched.

## Why the auras fell behind you (found in the mod's code)
Manas Cosmetics moves every aura particle backwards by **your speed × 4 × `motion_response`**. That happens in `AuraMotionTracker` and in every style's `render` code. If the field is missing, it counts as 1.0. My earlier auras used 1.0 to 1.8, so when you sprinted the aura sat up to about 2 blocks behind you.

**Fix:** every aura now has `"motion_response": 0`, so it is locked to you. The validator now rejects any aura without this.

## Why they looked muddy and beige (also found in the mod's code)
- **Blending:** the mod blends aura particles as see-through sprites, not as glowing light that adds up.
- **Shading:** they get Minecraft's entity shading.
- **Flame flicker:** the `flame` style darkens each particle to as little as 44% brightness for its flicker.

So pale colours, dark end colours and big soft `glow` particles all turned into brown fog, which is what your video shows. My old preview tool drew them as glowing light on black, so it made them look better than they really are. The new preview tool (`scripts/manas/auraview.py`) copies the mod exactly:
- the particle textures
- normal see-through blending
- entity shading
- a daytime spawn scene and a night scene

It reproduces the beige look from your video.

## What changed
- **All 37 auras redesigned**, each with its own look and theme:
  - crisp magic circles and seals with bold lines
  - fine, dense fire with saturated colours (no pale start colour, which caused the beige)
  - DNA-style lightning spirals
  - frost rune rings with rising crystals
  - starfields, orbiting comets, sakura petals and spirit motes
  - a floating **Solar Crown** above the head, using the aura's `offset` field
- **The 10 set auras** get the most elaborate designs: an arcane array, a summoning circle, a radiant sun, a frost magic circle, a dense storm spiral, a blood fire ring, an abyssal vortex, soul comets, a verdant rune ring and the Thronebreaker seal.
- **20 weapon auras:** the near-black colour stops are lifted so they don't smear brown on the blade.

## Install (MintServers)
1. Back up the server.
2. Upload `config_manas_cosmetics/cosmetics/` into `config/manas_cosmetics/cosmetics/`. Say yes to replacing files.
3. Run `/manas_cosmetics reload`, or restart the server.

## Rollback
1. Upload the files in `rollback/cosmetics/` (the 57 previous aura and weapon-aura files) over the new ones. They're also in the repo at `minecraft/manas_cosmetics/backups/pre_v13/`.
2. Run `/manas_cosmetics reload`.

## Checked offline (not in game)
- The validator passes all 171 cosmetics.
- Every aura has `motion_response` 0.
- The before/after sheets in `previews/v13_auras_before_after_*.png` show five columns: before, before while sprinting, after, after while sprinting, and after at night.
- `previews/anim_auras_v13.gif` is an offline animation.

## Needs testing in game
- The auras stay with you when you walk, sprint and fly.
- The colours look right in daylight on your spawn.
- The Solar Crown floats above your head.

Please send a video.
