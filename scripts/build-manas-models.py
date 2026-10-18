# Builds every OVERTHRONE model cosmetic + pet for Manas Cosmetics (v4) and renders preview sheets with a renderer that copies
# the mod's own placement maths (scripts/manas/sim.py), so the previews show what players will see.
#   python3 scripts/build-manas-models.py          (needs Pillow + numpy; ~4 minutes)
# Output: minecraft/manas_cosmetics/models/<slot>/*.bbmodel, cosmetics/*.json, previews/*.png
# Designs: scripts/manas/catalog4.py (ids, names, palettes) -> wings4.py, heads4.py, pets4.py; the 10 armour & wing sets:
# scripts/manas/setdefs.py -> sets5.py. Auras (incl. the sets' auras): build-manas-auras.py.
import json, os, shutil, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'manas'))
import catalog4 as C, sim, setdefs, sets5 as S5, sets6 as S6, look5, pets4, pets6, pets7
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(__file__), '..', 'minecraft', 'manas_cosmetics')
PREV = os.path.join(ROOT, 'previews')
for slot in ['back', 'above_head', 'helmet', 'orbit', 'pet', 'armor_set', 'weapon', 'ground']: shutil.rmtree(os.path.join(ROOT, 'models', slot), ignore_errors=True)
os.makedirs(os.path.join(ROOT, 'cosmetics'), exist_ok=True)
for fn in os.listdir(os.path.join(ROOT, 'cosmetics')):
    if not fn.startswith('aura_') and not fn.startswith('weapon_'): os.remove(os.path.join(ROOT, 'cosmetics', fn))

built = []
def save(cid, name, slot, model, extra=None):
    path = os.path.join(ROOT, 'models', slot, cid + '.bbmodel'); model.write(path)
    sc = {'id': 'overthrone:' + cid, 'display_name': name, 'slot': slot, 'weapon_type': 'any', 'force_equip_allowed': True,
          'model': 'models/' + slot + '/' + cid + '.bbmodel', 'scale': [1.0, 1.0, 1.0], 'offset': [0.0, 0.0, 0.0], 'rotation': [0.0, 0.0, 0.0]}
    if slot == 'back': sc['needs_y_flip'] = True     # always flip back models upright (our models are authored below y=0)
    if slot == 'armor_set': sc['needs_y_flip'] = False   # authored Y-down in player space (see sets5.py)
    if slot == 'weapon': sc['weapon_type'] = 'sword'      # shows over any held sword (weapon_type/sword tag); 'any' would show it in an empty hand
    if extra: sc.update(extra)
    with open(os.path.join(ROOT, 'cosmetics', cid + '.json'), 'w') as f: json.dump(sc, f, indent=2)
    built.append((cid, name, slot, path, sc)); print('built', cid, os.path.getsize(path) // 1024, 'KB', flush=True)

for cid, (name, fn, pal) in C.BACK.items(): save(cid, name, 'back', fn(cid, pal))
for cid, (name, slot, fn, kw) in C.HEADS.items(): save(cid, name, slot, fn(cid, **kw))
for cid, (name, fn, kw, floats) in C.PETS.items(): save(cid, name, 'pet', fn(cid, **kw), {'floats': True} if floats else None)
# the 10 premium sets (auras + weapon auras for them are written by build-manas-auras.py)
WEAPON_WORD = {'spear': 'Spear', 'trident': 'Trident', 'scythe': 'Scythe', 'great': 'Greatsword', 'royal': 'Greatsword', 'long': 'Sword'}
for sid, d in setdefs.SETS.items():
    t = d['title']
    save(sid + '_wings', t + ' Wings', 'back', S5.wings(sid + '_wings', d['wings']))
    save(sid + '_helm', t + ' Helm', 'helmet', S6.helm(sid + '_helm', d['helm']))
    save(sid + '_armor', t + ' Armour', 'armor_set', S6.armor(sid + '_armor', d['armor']))
    save(sid + '_blade', t + ' ' + WEAPON_WORD.get(d['weapon']['shape'], 'Blade'), 'weapon', S6.weapon(sid + '_blade', d['weapon']))
    kind, kw, floats, pname = setdefs.PETS[sid]
    fn = {'phoenix': pets7.phoenix7, 'fox': pets7.fox7, 'wisp': pets7.wisp7, 'dragon': pets7.dragon7, 'jelly': pets6.jelly}[kind]
    save(sid + '_pet', pname + ' (' + t + ')', 'pet', fn(sid + '_pet', **kw), {'floats': True} if floats else None)
    save(sid + '_sigil', t + ' Sigil', 'ground', S5.sigil(sid + '_sigil', d['sigil']))

# ------------------------------------------------------------------ previews (mod-exact placement)
os.makedirs(PREV, exist_ok=True)
for f in os.listdir(PREV): os.remove(os.path.join(PREV, f))
def sheet(items, fname, cols=4, cell=300):
    for part in range(0, len(items), cols * 6):
        chunk = items[part:part + cols * 6]
        rows = (len(chunk) + cols - 1) // cols
        out = Image.new('RGB', (cell * cols, (cell + 22) * rows), (20, 20, 26)); d = ImageDraw.Draw(out)
        for i, (label, im) in enumerate(chunk):
            x, y = (i % cols) * cell, (i // cols) * (cell + 22)
            out.paste(im.resize((cell, cell)), (x, y)); d.text((x + 6, y + cell + 4), label, fill=(255, 255, 255))
        out.save(os.path.join(PREV, fname.replace('.png', '_%d.png' % (part // (cols * 6) + 1))))
groups = {}
for cid, name, slot, path, sc in built:
    if slot in ('helmet', 'armor_set', 'weapon', 'ground') and any(cid.startswith(sid + '_') for sid in setdefs.SETS): continue   # set sheets below
    if slot == 'back' and any(cid == sid + '_wings' for sid in setdefs.SETS): continue
    pet = slot == 'pet'
    if slot == 'back': views = [('back', 180, 12, 0.0, False), ('flap', 160, 12, 1.6, False), ('front', 0, 8, 0.0, False), ('night', 170, 12, 2.4, True)]
    elif pet: views = [('', 30, 12, 0.0, False), ('', 150, 15, 0.6, False), ('night', 30, 12, 2.0, True), ('', 70, 10, 1.2, False)]
    else: views = [('', 30, 12, 0.0, False), ('', 150, 15, 1.0, False), ('night', 30, 12, 2.0, True), ('', 90, 0, 0.5, False)]
    for label, yaw, pitch, t, dark in views:
        im = sim.preview(path, sc, t=t, yaw=yaw, pitch=pitch, size=300, scale=4.2 if slot == 'back' else (4.6 if pet else 7.0), pet=pet, dark=dark)
        groups.setdefault('back' if slot == 'back' else ('pet' if pet else 'head'), []).append((name + (' (' + label + ')' if label else ''), im))
sheet(groups['back'], 'wings_and_tails.png')
sheet(groups['head'], 'head_and_orbit.png')
sheet(groups['pet'], 'pets.png')
import tempfile
for sid in setdefs.SETS:   # one sheet per set: armour front/back, full set, flap, night, helmet close-up
    look5.sheet(sid, tempfile.mkdtemp(), os.path.join(PREV, 'set_' + sid + '.png'))
print('built', len(built), 'models; previews in', os.path.normpath(PREV))
