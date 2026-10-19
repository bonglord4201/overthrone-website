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
