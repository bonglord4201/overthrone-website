import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import catalog4, sim
from PIL import Image, ImageDraw
OUT = sys.argv[1]; only = sys.argv[2:] or list(catalog4.HEADS)
rows = []
for cid in only:
    name, slot, fn, kw = catalog4.HEADS[cid]
    m = fn(cid, **kw); p = os.path.join(OUT, cid + '.bbmodel'); m.write(p)
    sc = {'slot': slot, 'scale': [1, 1, 1], 'offset': [0, 0, 0], 'rotation': [0, 0, 0]}
    ims = [sim.preview(p, sc, t=0.0, yaw=25, pitch=12, size=260, scale=7), sim.preview(p, sc, t=1.3, yaw=150, pitch=20, size=260, scale=7),
           sim.preview(p, sc, t=0.6, yaw=90, pitch=0, size=260, scale=7), sim.preview(p, sc, t=2.0, yaw=30, pitch=12, size=260, scale=7, dark=True)]
    rows.append((name + ' (' + str(os.path.getsize(p) // 1024) + ' KB)', ims)); print(cid, flush=True)
for st in range(0, len(rows), 7):
    ch = rows[st:st + 7]
    o = Image.new('RGB', (1040, 282 * len(ch)), (15, 15, 20)); d = ImageDraw.Draw(o)
    for r, (l, ims) in enumerate(ch):
        for c, im in enumerate(ims): o.paste(im, (c * 260, r * 282))
        d.text((6, r * 282 + 264), l, fill=(255, 255, 255))
    o.save(os.path.join(OUT, 'heads_%d.png' % (st // 7)))
