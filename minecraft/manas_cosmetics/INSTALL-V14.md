# OVERTHRONE cosmetics v14: designed effects, 3D halos, 3D auras

Install this on top of v12 and v13. The cosmetic IDs are unchanged, so the Throne Shop, the Cosmetic Crate and player ownership are untouched, and no scripts change. The full audit is in `AUDIT-V14.md`.

## What was wrong, and why (found in the files and the mod's code)
1. **Random floating cubes around the wings (your screenshot), and around halos, crowns, helms, armour and pets.**
   - **Cause:** my old "particles" were tiny glowing cubes at random positions, moving in straight lines.
   - **Scale:** 37 of 37 wings had them, plus about 40 other cosmetics.
   - **Fix:** removed everywhere. The audit now finds 0.
2. **No flowing light.**
   - **Cause:** the mod supports animated textures (a strip of frames, played at `frame_time`), but nothing used them.
   - **Fix:** every wing now uses one.
3. **Flat halos, and auras you can't see from the side.**
   - **Halos:** they were flat painted discs.
   - **Auras:** the 13 "magic circle" aura styles are drawn by the mod as lines lying on the ground.
   - **Fix:** both are now 3D (see below).

## What's new
### Every wing (34) has a designed effect identity (`scripts/manas/essence.py`)
- **Streams of light essence:** each has a bright core, a soft glow and a bright pulse with a fading tail that travels along a curved path, shedding sparks.
  - **One stream rides the wing:** it follows the leading edge from the root, past the wrist, and curls off the tip, fading away. It sits on the wing bones, so it bends and wraps with the wing.
  - **One stream sweeps round the outside:** it goes from the wing root, under the wing and forward past the hip, swaying.
  - **A light spiral:** it turns behind your back between the wings.
  - **Bat wings:** the stream runs along the arm and the longest finger, and a short trail leaves every claw.
- **Wing-root energy:** a pulsing core with expanding rings at the back gem. On Celestial, cyan energy also runs from the gem along the wing.
- **Motes from deliberate points:** they come from the feather tips, the claws, the edge of the wing skin, the stream ends and the gem. They fly curved paths, tumble and dissolve.
- **The ten collections each have their own identity:**

| Collection | Streams | Motes and extras |
|---|---|---|
| Celestial Sovereign | gold-white | cyan energy, falling glowing feathers, twinkling sparkles |
| Void Overlord | violet, with a crimson core | shadow wisps |
| Solar Emperor | sun gold | embers |
| Frost Monarch | pale blue | snow crystals and ice shards |
| Storm Dragon | lightning arcs that flicker and re-strike | sparks |
| Blood Demon King | crimson | embers and blood drops |
| Abyssal King | turquoise | deep-blue wisps |
| Soul Reaper | violet | spectral wisps |
| Verdant Dragon Emperor | green-gold | falling leaves |
| Thronebreaker Ascendant | crimson to gold | embers |

- Every other wing gets the same system, coloured from its own palette.

### Celestial Sovereign helm: an animated halo
- **The ring:** a solid gold ring with cyan gems and crown points, floating above the crown.
- **Runes:** a band of glowing runes stands round its rim, with a highlight running round it.
- **Motion and light:** a spiked inner ring turns the other way, with a soft bloom and sparkles rising off it.
- **Position:** it's part of the helm, so it follows your head.

### All halos are now solid 3D rings
- Hero, Fallen (still broken into pieces), Void, Crimson Crystal, Radiant Double, Throne and the Demon Sigil.
- Each one now has:
  - a thick ring with a rounded profile
  - a glowing rune band round the rim
  - sparkles instead of cubes
- They are visible from the side, not just from above.

### Auras: none of them is flat any more
The 16 auras that used flat ground circles moved to styles the mod draws with camera-facing particles, so they read from every angle:

| Style | Auras |
|---|---|
| Particle sigils | True Hero, Arcane Sage, Seal of the Demon King, Cursed Pentagram, Clockwork King, Eightfold Seal |
| Rune ring with rising stars | Celestial Sovereign |
| Dark DNA spiral | Void Overlord |
| Sun halo of light | Solar Emperor |
| Falling ice crystals | Frost Monarch |
| Crimson-gold fire ring | Thronebreaker |
| Starfield | Astral Navigator |
| Particle crown over the head | Solar Crown |
| Orbiting comets | Pulsar |
| Spiral | Dimension Rift |
| Ankle ring | Blood Moon |

They still stay locked to you (from v13).

## Install (MintServers)
1. Back up the server.
2. Upload `config_manas_cosmetics/models` and `config_manas_cosmetics/cosmetics` into `config/manas_cosmetics/`. Say yes to replacing files.
3. Run `/manas_cosmetics reload`, or restart the server.

**Download size:** players now download about 11 MB of models when they join (it was 6.5 MB), because of the animated textures. It's sent in 512 KB pieces.

## Rollback
`rollback/` holds the complete previous `models` and `cosmetics` folders (v13). They're also in the repo at `minecraft/manas_cosmetics/backups/pre_v14/`.
1. Upload them over the new files.
2. Run `/manas_cosmetics reload`.

## Checked offline only (NOT in game)
- **Validator:** passes on all 171 cosmetics.
- **The validator now also checks:**
  - animated strip textures have the right shape and a `frame_time`
  - no aura uses a flat ground style
  - every aura has `motion_response` 0
- **Audit:** 0 cube particles left in 114 models.
- **Previews:** every one in `previews/v14_*` is an offline render made with renderers that copy the mod's code, including the animated texture frames. I could not run Minecraft: this environment's network blocks Mojang, NeoForge and mod downloads.

## Please test in game and send a video
- The streams move along the wings (one pulse every 2.4 s), and the motes leave from the wing tips.
- The halo shows above the Celestial helm and turns.
- The halos look solid from the side.
- The auras show from the side.
- Download time on join is acceptable.

## Still to do (next stages)
- Rebuild the armour and helms of the other 9 sets. Their geometry is still the v6 build; only their particles changed here.
- New crown and horn shapes. They have sparkles now, but the same geometry.
- Divine Sovereign Wings and the two tail cosmetics: they no longer have cubes, but they don't have streams yet.
- Pets.
