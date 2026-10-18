# Installing OVERTHRONE cosmetics v7 (blade-fitted weapon auras, walking pets, new wing style, crate hologram auto-refresh)

v7 includes everything from v4, v5 and v6, so you only need this zip.

## What's new in v7
- **Weapon auras now sit on the blade.**
  - The old ones used a radius of 1 block, so the mod spread them in a big ball around your hand.
  - All 20 are now fitted to the blade: tight to the edge and running from the guard to the tip.
  - Each set's blade aura is measured against that set's own weapon model.
  - How each style now looks:
    - **Flame:** licks up the blade.
    - **Twin helix:** spirals round it.
    - **Vortex:** smoke ribbon wrapping it.
    - **Falling embers:** petals or embers drift down it.
    - **Orbiting orbs:** comets circle the middle of the blade.
    - **Starfield:** sparkles along it.
- **Pets rebuilt, and they walk.** The mod only plays walk and run animations for pets that don't float, and the foxes and dragons were set to float. Now:
  - **Foxes** (Kitsune, Spirit Fox, Sun Fox, Frost Fox):
    - built as standing foxes with jointed legs (knees and paws), a ruff, cheek fluff, a muzzle and fluffy multi-part tails
    - animations:
      - idle: looks around, ear twitches, tails sway
      - walk: a real 4-leg gait
      - run: a gallop with ears back
      - fly: legs stretched mid-jump
      - swim: paddling
    - tricks: sits down, tilts its head and wags; or play-bows, hops and spins
  - **Dragonlings** (Baby Storm, Baby Ember, Void, Storm, Forest):
    - built with jointed legs, a 2-part neck, a jaw, fangs and a tongue, horns, wings with an arm bone and a 7-part spiked tail
    - they walk with their wings folded and flap only when airborne
    - tricks: rears up and breathes fire or frost; or stretches its wings, yawns and shakes
  - **Phoenix pets** (Phoenix Chick, Seraph Chick, Crimson Phoenix):
    - wings with a wrist (coverts and primaries), a flame crest, a hooked beak and 3 rippling tail streamers
    - tricks: a loop-the-loop; or spreads its wings in a flame burst
  - **Wisps** (Shadow Wisp, Blood Wisp, Soul Lantern):
    - a living flame: rings of flickering flame tongues, a wispy tail and orbiting souls
    - the Soul Lantern has an iron cage
  - **Slimes** hop properly: they squash, spring up, stretch and land. Rimuru has a glowing core.
- **Demon and bat wings restyled** after the Lucifer's Wings reference: thick shaded 3D bones and knuckles, a membrane that goes from dark at the bones to deep colour in the middle, and a dark stepped rim. This covers Demon Lord, Shattered Monarch, Bone Demon, Void, Overlord, Blood Demon, Void Star and Bone Reaper.
- **Crate holograms update themselves.** You don't need `/crate hologram` again.
  - Every 5 seconds, when a player is within 24 blocks of a crate, the hologram already above it gets the current text written into it, in place.
  - A missing line is put back in the same spot.
  - The CRATES INFO board is rewritten the same way and keeps its position and facing.

## Install
1. Back up in the MintServers panel (Backups → create).
2. Upload `config_manas_cosmetics/models` and `config_manas_cosmetics/cosmetics` into `config/manas_cosmetics/`. Say yes to replacing files, and don't delete anything else.
3. Upload these from `kubejs_server_scripts/` into `kubejs/server_scripts/`, replacing the old ones:
   - `manas_cosmetics.js`
   - `npc_menus.js`
   - `crates.js`
   - `caverns.js`
   - `guide_books.js`
4. Restart the server.
5. Run `/manas_cosmetics reload`.
6. Run `/crate reward sync cosmetic`. Never use `reset`.
7. Don't place any new holograms. Walk up to the Cosmetic Crate, and within about 5 seconds its hologram text updates by itself.
8. Players who already have a fox or dragon pet out should unequip it and equip it again, so it respawns as a walking pet.
9. Players don't need new files.

Rollback: restore the backup from step 1.

## Checked offline
- All JSON, models, paths, IDs, slots and sidecar types pass.
- Each weapon aura is fitted to its blade. A new check makes sure the radius stays tight and an offset is set.
- Every walking pet has a walk clip, and every floating pet has a fly clip.
- Every cosmetic has a price and is in `OT_MANAS`.
- Size limits pass.
- The previews in `previews/` use the mod's own placement maths. The weapon-aura checks used a port of the mod's aura particle code (`scripts/manas/aurasim.py`).

## Needs testing in game
- Weapon auras hug the blade. Try one on a set weapon and one on a plain sword.
- Pets walk, run and do their tricks, and the dragons flap when they jump down.
- The crate hologram text updates when you walk up to it, with no duplicate lines.
- The new wing look at night.

Send a video of anything that looks off.
