import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sim
from PIL import Image
def combo(paths, t, yaw, pitch, size, scale, cy=-4, dark=False):
    c = sim.Canvas(size, scale, yaw, pitch, center_y=cy)
    if dark: c.img[:] = (8, 8, 14); c.ambient = 0.35
    c.player()
    for slot, p in paths:
        sc = {'slot': slot, 'scale': [1, 1, 1], 'offset': [0, 0, 0], 'rotation': [0, 0, 0], 'needs_y_flip': slot == 'back'}
        m = sim.Model(json.load(open(p))); c.model(m, sim.slot_matrix(slot, m, sc), t)
    return c.image()
if __name__ == '__main__':
    d, sid, out = sys.argv[1], sys.argv[2], sys.argv[3]
    P = [('armor_set', os.path.join(d, sid + '_armor.bbmodel')), ('helmet', os.path.join(d, sid + '_helm.bbmodel'))]
    ims = [combo(P, 0.0, 15, 6, 600, 10.5, cy=-15), combo(P, 0.0, 195, 6, 600, 10.5, cy=-15), combo(P, 0.4, 70, 6, 600, 10.5, cy=-15)]
    o = Image.new('RGB', (1800, 600)); [o.paste(im, (i * 600, 0)) for i, im in enumerate(ims)]; o.save(out)
