# Renders a review sheet of every back cosmetic in catalog4 (back view, flap, 3/4, night).
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import catalog4, sim
from PIL import Image, ImageDraw
OUT = sys.argv[1]; only = sys.argv[2:] or list(catalog4.BACK)
sc = {'slot': 'back', 'scale': [1, 1, 1], 'offset': [0, 0, 0], 'rotation': [0, 0, 0], 'needs_y_flip': True}
rows = []
for cid in only:
    name, fn, pal = catalog4.BACK[cid]
    m = fn(cid, pal); p = os.path.join(OUT, cid + '.bbmodel'); m.write(p)
    ims = [sim.preview(p, sc, t=0.0, yaw=180, pitch=12, size=300, scale=4.2), sim.preview(p, sc, t=1.6, yaw=150, pitch=12, size=300, scale=4.2),
           sim.preview(p, sc, t=0.0, yaw=20, pitch=8, size=300, scale=4.2), sim.preview(p, sc, t=2.4, yaw=170, pitch=12, size=300, scale=4.2, dark=True)]
    rows.append((name + '  (' + str(os.path.getsize(p) // 1024) + ' KB)', ims))
    print(cid, os.path.getsize(p) // 1024, 'KB', flush=True)
for start in range(0, len(rows), 7):
    chunk = rows[start:start + 7]
    o = Image.new('RGB', (1200, 322 * len(chunk)), (15, 15, 20)); d = ImageDraw.Draw(o)
    for r, (label, ims) in enumerate(chunk):
        for c, im in enumerate(ims): o.paste(im, (c * 300, r * 322))
        d.text((6, r * 322 + 304), label, fill=(255, 255, 255))
    o.save(os.path.join(OUT, 'review_%d.png' % (start // 7)))
