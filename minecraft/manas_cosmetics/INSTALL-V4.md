# Installing the OVERTHRONE v4 cosmetics (full rework)

Every model cosmetic has been rebuilt: 27 wings and tails, 9 halos, 9 crowns and horns, the Soul Crystals orbit and 8 pets. There's also one new crate cosmetic, **Divine Sovereign Wings**. The IDs are the same as before, so everyone keeps what they own and nothing is reset.

## What's new
- **Wings**
  - **Solid layered designs**, no more "comb" gaps:
    - feathers: overlapping primaries, secondaries and coverts
    - demon wings: real bat-wing membranes with finger bones and claws
    - solid faceted 3D crystals
    - armoured mech blades on hinges
  - **Glowing parts** that light up in the dark: feather tips, veins, gems, blade edges, runes.
  - **Soft magic glow** behind the magical wings.
  - **Built-in effects:** falling feathers, rising embers, sparkles, stars, snow, petals, soul wisps and thruster flames.
  - **New animation:** the flap rolls along the wing (shoulder, then elbow, then wingtip) and the feathers ripple. The wings breathe slowly when you stand still, flap more when walking, fold back when running, and flap hard when you jump or glide with an elytra.
- **Divine Sovereign Wings (new, Cosmetic Crate only):** three layers of lavender seraph wings, gold blade arcs, and a glowing gold magic circle whose two rings turn in opposite directions, with orbiting orbs, gold sparkles and drifting feathers.
- **Halos:**
  - full-bright 3D rings with bloom and spinning rune sigils
  - a broken Fallen Halo with drifting chunks
  - crystals and orbiting orbs
  - Throne Halo: a vertical golden sunburst behind the head
- **Crowns and horns:** grand crowns with glowing gems (Royal has a velvet cap and cross; Demon King has spikes and swept-back horns). There are also floating crystal crowns, smooth curved horns with glowing tips, and a rune circlet with orbiting glyphs.
- **Pets:**
  - painted faces with eyes that blink
  - round squishy slimes (the Crimson one wears a crown)
  - foxes with swaying tails and fox fire
  - dragons with glowing membrane wings and spikes
  - a fiery phoenix chick
  - a ghostly wisp with orbiting soul flames
  - Every pet sometimes does a little trick while you stand still: a hop, spin, roar or vanish.

## Install
1. **Back up** in the MintServers panel (Backups → create).
2. Unzip `overthrone-cosmetics-v4.zip`. Upload the `models` and `cosmetics` folders from inside `config_manas_cosmetics/` into `config/manas_cosmetics/` on the server. Say yes to replacing files.
   - Every file has the same name as before, so they simply replace the old ones.
   - Don't delete the folder itself or any other file in it.
3. Upload `manas_cosmetics.js` from `kubejs_server_scripts/` into `kubejs/server_scripts/`, replacing the old one. It adds Divine Sovereign Wings to the list. No other scripts change; `keep_inventory.js` and `crates.js` are untouched.
4. Restart the server.
5. In game, as an op:
   - `/manas_cosmetics reload`
   - `/crate reward sync cosmetic` adds Divine Sovereign Wings to the Cosmetic Crate and keeps every existing reward. Don't use `reset`.
6. Players don't need any new files; the server sends the models (about 1.6 MB compressed in total).

## Test in game (can't be checked offline)
- `/manas_cosmetics list` should show 91 cosmetics. If one is missing, search the server log for `manas`.
- Give yourself the new wings: `/manas_cosmetics unlock <you> overthrone:divine_sovereign_wings`. Open `/wardrobe` and check:
  - wings sit upright on the back
  - glowing parts glow at night
  - effects move
  - the wings fold back when running and flap hard when jumping
- Try a few halos, crowns and pets. Pets do their trick after standing still for a few seconds.
- If a cosmetic sits wrong, reset any **Personalise** or `/manas_cosmetics edit` changes you made to it earlier. Custom offsets turn off the automatic fitting.
