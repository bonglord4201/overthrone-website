# What Manas Cosmetics 1.0.6 can actually render (checked in the decompiled mod, 2026-10-19)

Sources:
- `core/bbmodel/BBModelParser.java` (parseBone, parseCube, parseFace)
- `core/bbmodel/BBModelData.java` (record Cube, record Face, record Bone)
- `client/renderer/BBModelRenderer.java` (render types)
- `client/renderer/CosmeticRenderTypes.java`

| Question | Answer from the code |
|---|---|
| 1. Cuboids only? | **Yes.** An element is read as `Cube(name, from, to, pivot, rotation, faces, inflate)`. Nothing reads `vertices` or mesh faces, so Blockbench *mesh* elements are not supported (they would load as an empty cube). |
| 2. Rotated cuboids, pivots, groups? | **Yes.** Each cube has its own `origin` (pivot) and `rotation` [x, y, z], applied Z, then Y, then X. The values are free floats, not limited to Blockbench's 22.5° steps. Groups (bones) nest, and each has its own pivot, rotation and animation. |
| 3. Tapered or custom shapes? | **Not as one element.** A taper or curve has to be built from several cuboids: stepped slices, or segments rotated a little more each time. A silhouette can also be cut out of a face with texture alpha: the default render type is `entityCutout`, so transparent pixels are holes. |
| 4. Were the wings identical cuboids? | **Yes.** In v8/v9 every flight feather was a flat 0.1 px plate, cut out from 1–2 shared feather textures, plus a thin "rachis" bar. That's why they read as rows of identical sticks. |
| 5. Textures / UVs | One rectangle per face (`uv` = 4 floats, plus a texture index). There is no per-face UV rotation. The v8/v9 armour pasted a painted silhouette on a paper-thin plate with a gold copy behind it. The UVs were technically correct, but the result reads as stickers because there is no real volume behind the painting. |
| 6. Renderer limits | Cuboids only; per-face UV rectangles; cutout alpha. A texture with more half-transparent than opaque pixels switches to translucent. Textures whose name ends `_e` are full bright. Entity lighting; no normal maps; molang animation on bones. |
| 7. Can it show more sophisticated geometry? | **Yes, within cuboids.** Real 3D shapes can be built from many small rotated cuboids, each with its own pivot and textured faces. That's how premium cuboid cosmetics such as Aurion are made. |

## Conclusion: what changes in the process

The renderer wasn't the bottleneck. The generator was: it made flat plates and decorated them.

The new generator (`scripts/manas/vox.py`) builds **solid plates with real thickness**:
1. A 2D silhouette (polygon, holes allowed) is rasterised at 0.25 px and cut into stepped cuboid strips (scanline extrusion). Edges taper in real geometry, like the stepped pixel edges of the Lucifer's Wings reference.
2. Every plate is built from **layers**: a gold frame layer with the full outline, then an ivory layer inset by ½–1 px and raised in front of it. The gold edging is the real side and rim of the plate, not a painted stripe.
3. Each strip's front face samples its own slice of one painted texture for the whole plate, so shading and engraving run continuously across the strips. The sides use rim materials.
4. Plates are angled and layered on purpose (bevelled halves meeting in a ridge, lames overlapping, flares) to change the player's silhouette.
5. Feathers use the same extrusion: broad, tapered, solid feather shapes with varied profiles (primary, secondary, covert), not shared flat sticks.

## v14 additions (checked in the same decompiled jar)

| Feature | What the code does |
|---|---|
| **Animated textures** | `BBModelRenderer.computeUv`: if a texture's PNG width equals its `uv_width` and its PNG height is a whole number (more than 1) of `uv_height` frames, the face uv is read inside one frame. The frame shown is `floor(ticks / frame_time) % frames`. Frames are synced to players with the model (`SyncCosmeticRegistryPayload`). Used for travelling light streams, rune bands, pulsing cores and twinkling sparkles. |
| **`render_mode`** | Read per texture. `emissive` (or a name ending `_e`) means full-bright. `additive` is NOT additive blending in 1.0.6: `openPass` gives it `entityCutout` plus full-bright. If any texture is `layered` or `emissive` and all textures are the same size, every texture is drawn over every face as a layer (`layeredTextures`). We never set `render_mode` and use the `_e` name instead. |
| **See-through textures** | `detectTranslucentAlpha` decodes the PNG (8-bit RGBA, non-interlaced, any size) and counts half-transparent against opaque pixels. More half-transparent pixels means `cosmeticTranslucent` (normal alpha blend, not additive). Our flow textures keep alpha at 248 or below, so they always qualify. |
| **Shading** | Every face, full-bright ones included, gets vanilla entity diffuse light, which depends on its normal. Upright planes come out at about 60–75%, up-facing ones at 100%. Light sprites get an extra horizontal plane so they don't turn grey. |
| **Helmet / above_head placement** | A fixed lift (`applyAutoOrient`), not the bounding box. A halo can be added to a helm without moving it, as long as no bone is named `head`. Back models ARE centred on their rest bounding box (handled by `W4.place_back`). |
| **Aura styles drawn flat** | The `MagicCircleStyle` family (magic_circle, arcane_array, summoning_circle, the seals and arrays, nested_polygons, sunburst_mandala, radiant_sun, astral_compass) draws its lines as quads lying on the ground (`bandSeg` / `flatQuad`), so they vanish side-on. Every other style draws camera-facing particles. The validator rejects the flat ones for the aura slot. |

The tools that build on these facts are in `scripts/manas/essence.py`:
- `FlowAtlas`: the animated texture
- `ribbon`: crossed planes along a Catmull-Rom curve
- `Motes`: sprites flying Bezier paths
- `ring3d` / `torus`: solid rings
