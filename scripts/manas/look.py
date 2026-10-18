# Quick preview sheet for one model: python3 look.py <module.func> <slot> <out.png> [kwargs-json]
import sys, json, os, importlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sim
from PIL import Image, ImageDraw
def sheet(m, slot, out, views=None, pet=False):
    path = out.replace('.png', '.bbmodel'); m.write(path)
    sc = {'slot': slot, 'scale': [1, 1, 1], 'offset': [0, 0, 0], 'rotation': [0, 0, 0]}
    if slot == 'back': sc['needs_y_flip'] = True
    if views is None:
        if slot == 'back': views = [('back', 180, 12, 0.0, 'idle', False), ('back t=1.6', 180, 12, 1.6, 'idle', False), ('3/4', 140, 15, 0.8, 'idle', False),
                                    ('side', 95, 5, 0.0, 'idle', False), ('front', 0, 8, 0.0, 'idle', False), ('fly', 160, 20, 0.35, 'fly', False),
                                    ('run', 150, 10, 0.5, 'run', False), ('night', 165, 12, 2.5, 'idle', True)]
        else: views = [('', 30, 12, 0.0, 'idle', False), ('', 210, 12, 1.0, 'idle', False), ('', 90, 5, 2.0, 'idle', False), ('night', 30, 12, 0.5, 'idle', True)]
    ims = []
    for label, yaw, pitch, t, anim, dark in views:
        ims.append((label, sim.preview(path, sc, t=t, yaw=yaw, pitch=pitch, size=360, scale=5.0 if slot == 'back' else 7.0, pet=pet, anim=anim, dark=dark)))
    cols = 4; rows = (len(ims) + cols - 1) // cols
    o = Image.new('RGB', (360 * cols, 380 * rows), (15, 15, 20)); d = ImageDraw.Draw(o)
    for i, (l, im) in enumerate(ims):
        x, y = (i % cols) * 360, (i // cols) * 380; o.paste(im, (x, y)); d.text((x + 6, y + 362), l, fill=(255, 255, 255))
    o.save(out); print('saved', out, os.path.getsize(path) // 1024, 'KB')
