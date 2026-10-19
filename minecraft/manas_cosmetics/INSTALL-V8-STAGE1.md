# OVERTHRONE premium sets: Stage 1, Celestial Sovereign

This is the first of the 10 rebuilt sets. Test it in game before I build the other nine the same way.

## What was rebuilt
The IDs stay the same, so the Throne Shop, the Cosmetic Crate and players who already own these keep working.

| Piece | Cosmetic ID | What's new |
|---|---|---|
| Wings | `overthrone:celestial_sovereign_wings` | See "Wings" below. |
| Armour | `overthrone:celestial_sovereign_armor` | See "Armour" below. |
| Helm | `overthrone:celestial_sovereign_helm` | See "Helm" below. |
| Greatsword | `overthrone:celestial_sovereign_blade` | Winged gold guard, steel blade with a glowing cyan rune channel, gems orbiting the blade. |

**Wings** (the showcase design, rebuilt 2026-10-19 after your video; 930 pieces):
- Built on the layout of the Divine Sovereign wings you liked: three radiating feather layers that make a spiky, glowing burst, sweeping gold blades and a glowing sigil in the middle.
- Every feather is now a **solid 3D slab** with a stepped pixel tip, like the Angel Wings and Lucifer's Wings references, instead of a flat sheet.
- The feather faces are hand-painted (shaft, barbs, split barbs, lavender shading, outline) and drawn full bright so the wings glow. The solid sides keep the 3D shading.
- Gold-tipped feathers, and the primaries end in a glowing cyan point.
- A chunky bevelled gold frame, with set cyan crystals at the shoulder, elbow and wrist.
- 8 solid gold blades, the main ones tipped with crystals.
- The sigil: a gold outer disc and a cyan inner disc turning opposite ways, inside a 3D gold ring with a big cyan gem and 4 orbiting crystals.
- Effects: 14 gold motes rising, 12 cyan sparkles streaming off the wingtips, and 8 feathers drifting down and spinning.

**Armour** (147 pieces):
- A painted shell at 4× detail: a dark navy undersuit with ivory plates, gold trim and cyan gems.
- Sculpted 3D parts:
  - gorget, sternum plate, pulsing chest gem with gold wings, belt and buckle
  - front and back tabards that sway
  - layered pauldrons with a gold crescent and a feather fan
  - vambraces with swept gold fins
  - knee cops with gems, greaves, and sabatons with little gold ankle wings
- Cyan motes rising off the shoulders and the core.

**Helm:**
- A navy helm with an ivory face plate, a T-visor with glowing eyes and a pointed gold brow.
- A gold crest fin, and feathered wing crests with gold blades at the temples.
- Ear gems, a back ridge, and a floating halo that turns.

**Animations, as written in the model files:**
- **Wings:** idle (slow breathing flap), walk, run (wings swept back), jump and fly (big flaps). Each primary feather ripples, and the sigil ring turns.
- **Armour:** the tabards sway more as you move faster, the shoulder ornaments bob, and the chest gem pulses and spins.
- **Helm:** the halo floats and turns, and the wing crests bob.
- **Greatsword:** the gems orbit the blade.

## Changed files
Upload these into `config/manas_cosmetics/models/`, replacing the old ones:
- `back/celestial_sovereign_wings.bbmodel`
- `helmet/celestial_sovereign_helm.bbmodel`
- `armor_set/celestial_sovereign_armor.bbmodel`
- `weapon/celestial_sovereign_blade.bbmodel`

No JSON, script, shop or crate changes. Don't touch anything else.

## Install (MintServers)
1. Back up the server first (Backups → create). Or download the four old files above so you can put them back.
2. Upload the four `.bbmodel` files from `config_manas_cosmetics/models/...` into the same folders on the server, replacing the old ones.
3. Run `/manas_cosmetics reload`. A restart works too.
4. Players don't need new files. The mod sends models to players when they join.

## Test checklist (in game)
Equip each piece in `/wardrobe`, then check:
1. **Wings:** they sit on the shoulder blades and don't cut into the body. They flap when you jump or fly. The ring turns behind your head.
2. **Armour:** the plates follow your arms and legs when you walk. The tabards swing. The pauldrons don't float off the shoulders.
3. **Helm:** it sits on your head (not too high or low), and the halo floats above it.
4. **Greatsword:** hold a sword. It should point the right way, with the gold guard at your hand.
5. Look at everything from the front, back and side, in daylight and at night.

Send a video, especially of anything that clips, floats or points the wrong way. I'll fix Celestial first, then build the other nine sets the same way.

## Rollback
Restore the backup from step 1, or put the four old `.bbmodel` files back, then run `/manas_cosmetics reload`.

## What was checked offline (not in game)
- The models parse, and the slots are correct.
- Every animation points at a real bone.
- Every face points at a real texture.
- The textures match the model resolution.
- The armour bone layout and centre match what the mod expects.
- The weapon grip is at the origin.
- The sizes are under the mod's limit: wings 194 KB, armour 44 KB, helm 14 KB and sword 5 KB, compressed. The mod's limit is 1024 KB.
- The preview pictures use the mod's own placement maths.

None of this has been seen in game yet.
