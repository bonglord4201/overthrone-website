# Builds the OVERTHRONE model cosmetics + pets for Manas Cosmetics (v3) and renders previews with a renderer that copies
# the mod's own placement maths (scripts/manas/sim.py), so the previews show what players will see.
#   python3 scripts/build-manas-models.py         (needs Pillow + numpy)
# Output: minecraft/manas_cosmetics/models/<slot>/*.bbmodel, cosmetics/*.json, previews/*.png
import json, os, shutil, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'manas'))
import designs as D, sim
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(__file__), '..', 'minecraft', 'manas_cosmetics')
PREV = os.path.join(ROOT, 'previews')
for slot in ['back', 'above_head', 'helmet', 'orbit', 'pet']: shutil.rmtree(os.path.join(ROOT, 'models', slot), ignore_errors=True)
os.makedirs(os.path.join(ROOT, 'cosmetics'), exist_ok=True)
for fn in os.listdir(os.path.join(ROOT, 'cosmetics')):
    if not fn.startswith('aura_') and not fn.startswith('weapon_'): os.remove(os.path.join(ROOT, 'cosmetics', fn))

built = []
def save(cid, name, slot, model, extra=None):
    path = os.path.join(ROOT, 'models', slot, cid + '.bbmodel'); model.write(path)
    sc = {'id': 'overthrone:' + cid, 'display_name': name, 'slot': slot, 'weapon_type': 'any', 'force_equip_allowed': True,
          'model': 'models/' + slot + '/' + cid + '.bbmodel', 'scale': [1.0, 1.0, 1.0], 'offset': [0.0, 0.0, 0.0], 'rotation': [0.0, 0.0, 0.0]}
    if extra: sc.update(extra)
    json.dump(sc, open(os.path.join(ROOT, 'cosmetics', cid + '.json'), 'w'), indent=2)
    built.append((cid, name, slot, path, sc))

for cid, (name, style, pal) in D.WINGS.items(): save(cid, name, 'back', D.build_wing(cid, style, pal))
save('kitsune_tails', 'Nine Kitsune Tails', 'back', D.kitsune_tails('kitsune_tails'))
save('hero_halo', 'Hero Halo', 'above_head', D.halo('hero_halo', (255, 255, 230), (255, 190, 40)))
save('fallen_halo', 'Fallen Halo', 'above_head', D.halo('fallen_halo', (255, 140, 140), (130, 0, 20), broken=True))
save('void_halo', 'Void Halo', 'above_head', D.halo('void_halo', (235, 190, 255), (95, 20, 170)))
save('crimson_crystal_halo', 'Crimson Crystal Halo', 'above_head', D.halo('crimson_crystal_halo', (255, 120, 120), (170, 0, 25), crystals=[(240, 30, 50)]))
save('radiant_double_halo', 'Radiant Double Halo', 'above_head', D.halo('radiant_double_halo', (255, 250, 210), (255, 180, 30), double=True, gems=(255, 230, 120)))
save('blood_crystal_ring', 'Blood Crystal Ring', 'above_head', D.crystal_ring('blood_crystal_ring', (230, 25, 45)))
save('demon_sigil', 'Demon Sigil', 'above_head', D.sigil('demon_sigil', (255, 60, 60)))
save('royal_crown', 'Royal Crown', 'helmet', D.crown('royal_crown', (215, 160, 40), (255, 230, 120), [(220, 20, 40), (40, 140, 255), (40, 200, 90)]))
save('demon_king_crown', 'Demon King Crown', 'helmet', D.crown('demon_king_crown', (30, 26, 34), (110, 100, 125), [(230, 20, 40), (160, 40, 230)], tall=1.5))
save('ice_crown', 'Ice Crown', 'helmet', D.crown('ice_crown', (70, 150, 210), (225, 250, 255), [(160, 230, 255), (255, 255, 255)], tall=1.6, shard=True))
save('shard_crown', 'Shattered Crown', 'helmet', D.crown('shard_crown', (25, 15, 25), (70, 50, 70), [(220, 20, 40), (160, 10, 30)], tall=1.7, shard=True, float_shards=True))
save('demon_horns', 'Demon Lord Horns', 'helmet', D.horns('demon_horns', (25, 10, 12), (10, 0, 0), glow=(255, 50, 40), path='demon', scale=1.2))
save('oni_horns', 'Oni Horns', 'helmet', D.horns('oni_horns', (240, 230, 210), (130, 90, 60), path='oni'))
save('ram_horns', 'Ram Horns', 'helmet', D.horns('ram_horns', (160, 130, 100), (70, 50, 40), path='ram'))
save('soul_crystals', 'Soul Crystals', 'orbit', D.soul_crystals('soul_crystals'))
for cid, (name, fn, floats) in D.PETS.items(): save(cid, name, 'pet', fn(cid), {'floats': True} if floats else None)

# ------------------------------------------------------------------ previews (mod-exact placement)
os.makedirs(PREV, exist_ok=True)
for f in os.listdir(PREV): os.remove(os.path.join(PREV, f))
def sheet(items, fname, cols=4, cell=300):
    rows = (len(items) + cols - 1) // cols
    out = Image.new('RGB', (cell * cols, (cell + 22) * rows), (20, 20, 26)); d = ImageDraw.Draw(out)
    for i, (label, im) in enumerate(items):
        x, y = (i % cols) * cell, (i // cols) * (cell + 22)
        out.paste(im.resize((cell, cell)), (x, y)); d.text((x + 6, y + cell + 4), label, fill=(255, 255, 255))
    out.save(os.path.join(PREV, fname))
groups = {}
for cid, name, slot, path, sc in built:
    pet = slot == 'pet'
    if slot == 'back': views = [('back', 180, 15, 0.0), ('back, mid-flap', 180, 15, 1.2), ('side', 120, 10, 0.0), ('front', 0, 8, 0.0)]
    elif pet: views = [('', 35, 15, 0.0), ('', 35, 15, 0.6)]
    else: views = [('', 30, 12, 0.0), ('', 30, 12, 1.0)]
    for label, yaw, pitch, t in views:
        im = sim.preview(path, sc, t=t, yaw=yaw, pitch=pitch, size=300, pet=pet)
        groups.setdefault(slot, []).append((name + (' (' + label + ')' if label else ''), im))
sheet(groups['back'], 'wings_and_tails.png', cols=4)
sheet(groups['above_head'] + groups['helmet'] + groups['orbit'], 'head_and_orbit.png', cols=4)
sheet(groups['pet'], 'pets.png', cols=4)
print('built', len(built), 'models; previews in', os.path.normpath(PREV))
