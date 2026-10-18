# Preview sheet of one set: wings, armour + helmet on the body, weapon in hand, ground sigil.
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sets5 as S5, setdefs, sim
import numpy as np
from PIL import Image, ImageDraw
def render_combo(paths, t, yaw, pitch, size, scale, dark=False):
    c = sim.Canvas(size, scale, yaw, pitch)
    if dark: c.img[:] = (8, 8, 14); c.ambient = 0.35
    c.player()
    for slot, p, sc in paths:
        m = sim.Model(json.load(open(p))); c.model(m, sim.slot_matrix(slot, m, sc), t)
    return c.image()
def sheet(set_id, out_dir, png=None):
    d = setdefs.SETS[set_id]
    parts = [('back', 'wings', S5.wings), ('helmet', 'helm', S5.helm), ('armor_set', 'armor', S5.armor), ('weapon', 'weapon', S5.weapon), ('ground', 'sigil', S5.sigil)]
    paths = []
    for slot, key, fn in parts:
        p = os.path.join(out_dir, set_id + '_' + key + '.bbmodel'); fn(set_id + '_' + key, d[key]).write(p)
        sc = {'slot': slot, 'scale': [1, 1, 1], 'offset': [0, 0, 0], 'rotation': [0, 0, 0]}
        if slot == 'back': sc['needs_y_flip'] = True
        if slot == 'armor_set': sc['needs_y_flip'] = False
        paths.append((slot, p, sc))
    body = [x for x in paths if x[0] in ('helmet', 'armor_set', 'weapon', 'ground')]
    ims = [('front, armour', render_combo(body, 0.0, 20, 8, 380, 9.0)), ('back, armour', render_combo(body, 0.0, 200, 10, 380, 9.0)),
           ('full set, back', render_combo(paths, 0.0, 165, 12, 380, 4.6)), ('full set, front', render_combo(paths, 1.2, 20, 10, 380, 4.6)),
           ('flap', render_combo(paths, 1.8, 140, 15, 380, 4.6)), ('night', render_combo(paths, 2.4, 30, 10, 380, 4.6, dark=True)),
           ('helmet close', render_combo([paths[1]], 0.0, 35, 12, 380, 16.0)), ('armour side', render_combo(body, 0.0, 95, 5, 380, 9.0))]
    o = Image.new('RGB', (380 * 4, 400 * 2), (15, 15, 20)); dr = ImageDraw.Draw(o)
    for i, (l, im) in enumerate(ims):
        x, y = (i % 4) * 380, (i // 4) * 400; o.paste(im, (x, y)); dr.text((x + 6, y + 382), d['title'] + ' - ' + l, fill=(255, 255, 255))
    p = png or os.path.join(out_dir, set_id + '.png'); o.save(p); print('saved', p)
if __name__ == '__main__':
    os.makedirs(sys.argv[1], exist_ok=True)
    for sid in sys.argv[2:]: sheet(sid, sys.argv[1])
