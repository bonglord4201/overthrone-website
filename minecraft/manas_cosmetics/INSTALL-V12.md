# OVERTHRONE cosmetics v12: wings, halos, auras and weapon effects overhaul

## What changed
The cosmetic IDs are unchanged, so the Throne Shop, the Cosmetic Crate and player ownership are untouched. No scripts change.

### All 34 wings rebuilt with a new wing system (`scripts/manas/wingkit.py`, designs in `wingdefs.py`)
- **Painted layers instead of plain sticks.**
  - Each wing is made of up to 9 painted layers: two primary rows, secondaries, tertials and three covert rows. Every feather is drawn individually, with its own outline, length, width and angle.
  - Tip shapes depend on the style:
    - **angelic:** pointed, round or split tips
    - **dark:** ragged, tattered tips
    - **flame:** burning tongues
    - **crystal:** faceted shards
    - **leaf:** veined leaves
    - **mech:** armoured plates with glowing seams
- **Membrane wings rebuilt** (demon, void, bone, overlord, blood, void star, bone reaper, storm dragon, blood demon king, abyssal king, soul reaper):
  - thick sculpted bones and knuckles
  - painted membranes, dark near the bones with a stepped dark rim
  - branching glowing veins
  - dragon scales, tears, claws and arm spikes, depending on the wing
- **The wings wrap around the body**, like your reference: they arch over the shoulders and curve forward.
- **Real motion.** The flap travels along the wing as a wave: the shoulder leads, then the elbow, then the wrist. Every feather layer and every membrane finger also ripples on its own.
  - **idle:** a slow wrapped breathing motion
  - **walk:** a sway
  - **run:** swept back
  - **jump:** an opening beat
  - **fly:** fully spread with big strokes
- **Effects on every wing**, matched to its theme:
  - shed glowing feathers, wingtip sparkle trails and rising light (angelic)
  - embers (flame and demon)
  - snow and ice glints (frost)
  - drifting leaves (nature)
  - sparks (storm)
  - void wisps
  - blood embers and drops
- **Fixes found in your in-game video:**
  - The wings looked grey from the front. Minecraft shades every face by which way it points, glowing textures included, so the layers are now tilted to catch the light.
  - The painted sheets showed a mirrored ghost copy. Both sides of each sheet now line up.
- The three items not rebuilt this round: Divine Sovereign Wings (unchanged at your request; you liked it) and the two tail cosmetics (Nine Kitsune Tails and Spirit Fox Tails).

### Six halos rebuilt (`scripts/manas/headkit.py`)
Hero, Fallen, Void, Crimson Crystal, Radiant Double and Throne Halo.
- An ornate painted ring with bevelled metal, a band of runes (glowing on some), gem sockets with raised 3D gems, and spikes or rays.
- Some have an inner ring turning the opposite way, orbiting crystals, or broken drifting pieces (Fallen Halo).
- A soft glow, a gentle bob, and themed particles: sparkles, embers or drips.

### All 37 auras retuned (`scripts/build-manas-auras.py`)
- 4-colour gradients: hot core, body, colour, then a dark fade.
- Particle counts about 1.5–2× the style default, staying inside the mod's 4,000 particles per frame budget.
- Tuned rotation and size.
- Trails behind you when you move, stronger on the fire, storm and shadow auras.

### Real particles on the 10 set weapons
The mod's weapon particle system: the server sends vanilla particles when you swing, use or charge the weapon.

| Set | Particle |
|---|---|
| Celestial | end rod |
| Void Overlord | reverse portal |
| Solar | flame |
| Frost | snowflake |
| Storm | electric spark |
| Blood Demon King | crimson spore |
| Abyssal | glow |
| Soul Reaper | sculk soul |
| Verdant | composter |
| Thronebreaker | soul fire |

Each burst is 14 particles, so it's light on the server.

## Install (MintServers)
1. Back up the server first.
2. Upload the `config_manas_cosmetics/models` and `config_manas_cosmetics/cosmetics` folders into `config/manas_cosmetics/`. Say yes to replacing files, and don't delete anything else.
3. Run `/manas_cosmetics reload`, or restart the server.
4. Players don't need new files.
   - The models are now about 6.5 MB compressed in total (it was 4.3 MB), sent once to each player when they join, in 512 KB pieces.

## Rollback
`rollback/` in the zip holds the complete previous `models` and `cosmetics` folders (pre-v12). They're also in the repo at `minecraft/manas_cosmetics/backups/pre_v12/`.
1. Upload them over the new files.
2. Run `/manas_cosmetics reload`.

## Checked offline (not in game)
- The validator passes:
  - 171 cosmetics, all in OT_MANAS and all priced
  - slots, back models' `needs_y_flip`, armour bone layout and centre, weapon grip
  - animations only drive bones that exist, and every texture index is valid
  - sizes are under the limit
  - weapon particle IDs are vanilla simple particles, with valid triggers and counts
- My preview renderer was corrected this round to match the game:
  - every face is drawn from both sides
  - every face is shaded by which way it points, glowing textures included
- The before/after sheets and animation GIFs in `previews/` are offline renders of the real files.

## Needs testing in game
- The wings wrap without cutting through your arms, and they animate while you walk and fly.
- The particles are visible.
- The halos float above the head.
- The new aura intensity is right for you.
- The weapon particles appear when you swing.

Please send a video.

## Not in this batch (next)
- The other 9 armour sets and helms (Celestial's armour is the v10 rebuild).
- Crowns and horns (they keep their particles but aren't rebuilt yet).
- Pets.
