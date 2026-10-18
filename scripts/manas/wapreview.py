# Weapon-aura preview: the player, the held weapon cosmetic and the weapon aura where CosmeticLayer.renderWeaponAura puts it.
import json, math, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import sim, aurasim
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'minecraft', 'manas_cosmetics')

def frame(model, sc):
    """renderWeaponAura: lift = computeWeaponAuraBladeLift, s = clamp(0.4 * heldWeaponLengthBlocks)."""
    b = model.cube_bounds(); blade = b[4] - 0.0                      # grip bone pivot = 0 (our first bone)
    lift = min(max(blade * sc['scale'][1] / 16 * 0.5, 0.15), 1.5)
    a = model.rest_aabb(); L = max((a[3] - a[0]) * sc['scale'][0], (a[4] - a[1]) * sc['scale'][1], (a[5] - a[2]) * sc['scale'][2]) / 16
    return lift, min(max(L * 0.4, 0.12), 1.2)

HAND = sim.T(-5, 2, 0) @ sim.Rx(-18) @ sim.T(-0.48, 10, 0) @ sim.Ry(-35) @ sim.Rz(145) @ sim.axis_rot((-0.819, -0.574, 0), 90)
def render(weapon_id, aura_id, t=0.7, yaw=60, pitch=10, size=360, scale=7.0, dark=True):
    sc = json.load(open(os.path.join(ROOT, 'cosmetics', weapon_id + '.json')))
    m = sim.Model(json.load(open(os.path.join(ROOT, sc['model']))))
    au = json.load(open(os.path.join(ROOT, 'cosmetics', 'weapon_' + aura_id + '.json')))['aura']
    c = sim.Canvas(size, scale, yaw, pitch)
    if dark: c.img[:] = (12, 12, 18); c.ambient = 0.45
    c.player(); c.model(m, sim.slot_matrix('weapon', m, sc), t, 'idle')
    lift, s = frame(m, sc)
    M = HAND @ sim.T(0, (lift + au.get('offset', 0.0)) * 16, 0) @ sim.S(s * 16, s * 16, s * 16)
    c.glow(M, aurasim.particles(au, t))
    return c.image()
