# Builds the OVERTHRONE aura cosmetics for Manas Cosmetics (config/manas_cosmetics/cosmetics/*.json).
# Auras need no model: the mod draws them itself. Format and style/particle names are the ones documented in the mod's
# own README (manas_cosmetics 1.0.6): styles rising_motes, twin_helix, halo, circle, vortex_shroud, rune_circle,
# orbiting_orbs, starfield_shimmer, ember_crown, falling_embers, pulse_rings, triangle, pentagram, hexagram,
# magic_circle, arcane_array, summoning_circle; particles glow, orb, spark, pixel, smoke.
# Tune any of them in game with /manas_cosmetics edit <id> (live preview), then Save & Reload.
#   python3 scripts/build-manas-auras.py
import json, os
OUT = os.path.join(os.path.dirname(__file__), '..', 'minecraft', 'manas_cosmetics', 'cosmetics')
AURAS = [
  # id, name, style, particle, colors, count, size, speed, radius, height, rotation_speed
  ('demon_lord_awakening', 'Demon Lord Awakening', 'summoning_circle', 'glow', [[255, 40, 40], [150, 0, 20], [40, 0, 10]], 0, 1.2, 0.8, 1.2, 1.0, 0.7),
  ('shadow_monarch', 'Shadow Monarch', 'vortex_shroud', 'smoke', [[140, 60, 255], [60, 0, 140], [10, 0, 25]], 0, 1.3, 0.9, 1.0, 1.1, 1.0),
  ('true_hero', 'True Hero', 'halo', 'spark', [[255, 255, 220], [255, 215, 80], [255, 160, 20]], 0, 1.1, 1.0, 1.0, 1.0, 1.0),
  ('storm_dragon', 'Storm Dragon', 'twin_helix', 'spark', [[220, 255, 255], [60, 200, 255], [20, 80, 200]], 0, 1.0, 1.4, 1.0, 1.2, 1.4),
  ('black_flame', 'Black Flame', 'ember_crown', 'glow', [[170, 90, 255], [70, 0, 120], [5, 0, 10]], 0, 1.2, 1.0, 1.0, 1.0, 1.0),
  ('inferno', 'Inferno', 'vortex_shroud', 'glow', [[255, 220, 90], [255, 100, 20], [140, 20, 10]], 0, 1.1, 1.1, 1.0, 1.0, 1.2),
  ('arcane_sage', 'Arcane Sage', 'arcane_array', 'glow', [[200, 240, 255], [80, 160, 255], [40, 60, 200]], 0, 1.0, 0.8, 1.1, 1.0, 0.8),
  ('sakura_spirit', 'Sakura Spirit', 'falling_embers', 'glow', [[255, 220, 235], [255, 150, 190], [230, 90, 150]], 0, 1.0, 0.7, 1.2, 1.1, 0.6),
  ('frost_queen', 'Frost Queen', 'rune_circle', 'spark', [[240, 255, 255], [150, 220, 255], [70, 140, 230]], 0, 1.0, 0.9, 1.1, 1.0, 0.8),
  ('great_sage', 'Great Sage', 'orbiting_orbs', 'orb', [[120, 230, 255], [40, 150, 255], [20, 60, 180]], 0, 1.0, 1.0, 1.0, 1.0, 1.0),
  ('celestial', 'Celestial', 'starfield_shimmer', 'spark', [[255, 255, 255], [180, 200, 255], [150, 100, 255]], 0, 1.0, 0.8, 1.2, 1.2, 0.8),
  ('void_pulse', 'Void Pulse', 'pulse_rings', 'glow', [[220, 120, 255], [120, 30, 200], [30, 0, 60]], 0, 1.0, 1.0, 1.1, 1.0, 1.0),
  ('solomon_seal', 'Seal of the Demon King', 'hexagram', 'glow', [[255, 230, 120], [230, 160, 30], [120, 60, 0]], 0, 1.0, 0.8, 1.1, 1.0, 0.6),
  ('blood_moon', 'Blood Moon', 'magic_circle', 'glow', [[255, 120, 120], [200, 0, 30], [60, 0, 10]], 0, 1.1, 0.8, 1.2, 1.0, 0.7),
  ('spirit_ascension', 'Spirit Ascension', 'rising_motes', 'glow', [[230, 255, 230], [120, 255, 170], [30, 180, 120]], 0, 1.0, 1.0, 1.0, 1.2, 1.0),
  ('pentagram_curse', 'Cursed Pentagram', 'pentagram', 'glow', [[255, 90, 200], [160, 0, 120], [40, 0, 40]], 0, 1.0, 0.8, 1.1, 1.0, 0.7),
]
os.makedirs(OUT, exist_ok=True)
for (i, name, style, part, colors, count, size, speed, radius, height, rot) in AURAS:
  d = {
    'id': 'overthrone:' + i, 'display_name': name, 'slot': 'aura',
    'aura': { 'style': style, 'particle': part, 'colors': colors, 'particle_count': count, 'size': size, 'speed': speed,
              'radius': radius, 'height': height, 'alpha': 1.0, 'rotation_speed': rot, 'emissive': True, 'motion_response': 1.0 },
  }
  with open(os.path.join(OUT, 'aura_' + i + '.json'), 'w') as f: json.dump(d, f, indent=2)
print('wrote', len(AURAS), 'auras to', os.path.normpath(OUT))
