import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import catalog4, sim
from PIL import Image, ImageDraw
OUT = sys.argv[1]; only = sys.argv[2:] or list(catalog4.PETS)
rows = []
for cid in only:
    name, fn, kw, fl = catalog4.PETS[cid]
    m = fn(cid, **kw); p = os.path.join(OUT, cid + '.bbmodel'); m.write(p)
    sc = {'slot': 'pet', 'scale': [1, 1, 1], 'offset': [0, 0, 0], 'rotation': [0, 0, 0]}
    ims = [sim.preview(p, sc, t=0.0, yaw=30, pitch=12, size=260, pet=True, scale=4.6), sim.preview(p, sc, t=0.3, yaw=150, pitch=15, size=260, pet=True, scale=4.6),
           sim.preview(p, sc, t=0.25, yaw=60, pitch=10, size=260, pet=True, scale=4.6, anim='walk'), sim.preview(p, sc, t=0.5, yaw=30, pitch=12, size=260, pet=True, scale=4.6, anim='special'),
           sim.preview(p, sc, t=2.0, yaw=20, pitch=12, size=260, pet=True, scale=4.6, dark=True)]
    rows.append((name + ' (' + str(os.path.getsize(p) // 1024) + ' KB)', ims)); print(cid, flush=True)
o = Image.new('RGB', (1300, 282 * len(rows)), (15, 15, 20)); d = ImageDraw.Draw(o)
for r, (l, ims) in enumerate(rows):
    for c, im in enumerate(ims): o.paste(im, (c * 260, r * 282))
    d.text((6, r * 282 + 264), l, fill=(255, 255, 255))
o.save(os.path.join(OUT, 'pets.png'))
