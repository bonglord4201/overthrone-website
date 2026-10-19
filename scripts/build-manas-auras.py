# Builds the OVERTHRONE aura + weapon-aura cosmetics for Manas Cosmetics (config/manas_cosmetics/cosmetics/*.json).
# No model files: the mod draws these itself. Every style/particle name below is from the mod's own list
# (AuraSpec.KNOWN_STYLES / KNOWN_PARTICLES in manas_cosmetics 1.0.6):
#   styles: rising_motes twin_helix halo circle vortex_shroud rune_circle orbiting_orbs starfield_shimmer ember_crown
#           falling_embers pulse_rings flame flame_scorched triangle pentagram hexagram magic_circle arcane_array
#           summoning_circle square octagram heptagram square_seal octagram_array pentacle_array nested_polygons
#           seal_of_solomon sunburst_mandala radiant_sun clockwork_seal astral_compass pulsar_seal
#   particles: glow orb spark pixel smoke ring crystal star tear comet
# slot "aura" = around the player, slot "weapon_aura" = along the held weapon (the mod scales it to the weapon).
# Tune any of them in game with /manas_cosmetics edit <id> (live preview), then Save & Reload.
#   python3 scripts/build-manas-auras.py
import json, os
OUT = os.path.join(os.path.dirname(__file__), '..', 'minecraft', 'manas_cosmetics', 'cosmetics')
os.makedirs(OUT, exist_ok=True)
for fn in os.listdir(OUT):
    if fn.startswith('aura_') or fn.startswith('weapon_'): os.remove(os.path.join(OUT, fn))

# id, name, style, particle, colors (1-4 stops over each particle's life), size, speed, radius, height, rotation_speed, count(0=style default)
AURAS = [
  # v12 overhaul: every aura has its own structure. 3-4 colour stops (hot core -> body -> dark fade), counts ~1.5-2x the
  # style default (well under the mod's 4000 particles/frame budget), tuned rotation, and motion_response so the aura
  # trails behind you when you move (column 12 below; 1.0 = default).
  ('demon_lord_awakening', 'Demon Lord Awakening', 'summoning_circle', 'glow', [[255, 230, 160], [255, 70, 50], [190, 0, 25], [50, 0, 10]], 1.3, 0.8, 1.35, 1.0, 0.55, 420),
  ('shadow_monarch', 'Shadow Monarch', 'vortex_shroud', 'smoke', [[210, 160, 255], [140, 70, 255], [60, 0, 140], [6, 0, 16]], 1.5, 0.95, 1.05, 1.2, 1.1, 420),
  ('true_hero', 'True Hero', 'radiant_sun', 'star', [[255, 255, 255], [255, 240, 170], [255, 200, 70], [255, 140, 20]], 1.15, 1.0, 1.15, 1.0, 0.8, 400),
  ('storm_dragon', 'Storm Dragon', 'twin_helix', 'spark', [[255, 255, 255], [180, 245, 255], [60, 200, 255], [20, 70, 200]], 1.1, 1.5, 1.05, 1.25, 1.5, 320),
  ('black_flame', 'Black Flame', 'flame', 'glow', [[230, 190, 255], [150, 70, 255], [60, 0, 120], [5, 0, 10]], 1.3, 1.05, 1.0, 1.15, 1.0, 520),
  ('inferno', 'Inferno', 'flame', 'glow', [[255, 255, 210], [255, 210, 70], [255, 100, 15], [140, 15, 5]], 1.3, 1.15, 1.05, 1.2, 1.0, 560),
  ('scorched_earth', 'Scorched Earth', 'flame_scorched', 'smoke', [[255, 210, 120], [255, 120, 30], [120, 30, 10], [30, 20, 20]], 1.25, 0.95, 1.15, 1.0, 1.0, 480),
  ('arcane_sage', 'Arcane Sage', 'arcane_array', 'glow', [[255, 255, 255], [190, 235, 255], [90, 160, 255], [60, 40, 210]], 1.05, 0.85, 1.2, 1.0, 0.65, 380),
  ('sakura_spirit', 'Sakura Spirit', 'falling_embers', 'tear', [[255, 245, 250], [255, 200, 225], [255, 140, 190], [220, 70, 145]], 1.2, 0.65, 1.35, 1.2, 0.6, 300),
  ('frost_queen', 'Frost Queen', 'rune_circle', 'crystal', [[255, 255, 255], [200, 240, 255], [120, 200, 255], [60, 120, 230]], 1.05, 0.9, 1.2, 1.0, 0.75, 320),
  ('great_sage', 'Great Sage', 'orbiting_orbs', 'orb', [[230, 255, 255], [140, 240, 255], [40, 160, 255], [20, 50, 180]], 1.15, 1.0, 1.05, 1.0, 1.0, 112),
  ('celestial', 'Celestial', 'starfield_shimmer', 'star', [[255, 255, 255], [220, 230, 255], [170, 150, 255], [120, 80, 230]], 1.1, 0.8, 1.3, 1.3, 0.8, 300),
  ('void_pulse', 'Void Pulse', 'pulse_rings', 'ring', [[255, 220, 255], [230, 140, 255], [130, 40, 210], [30, 0, 60]], 1.05, 1.0, 1.2, 1.0, 1.0, 180),
  ('solomon_seal', 'Seal of the Demon King', 'seal_of_solomon', 'glow', [[255, 250, 210], [255, 225, 120], [235, 160, 35], [110, 50, 0]], 1.05, 0.8, 1.2, 1.0, 0.55, 400),
  ('blood_moon', 'Blood Moon', 'magic_circle', 'glow', [[255, 210, 200], [255, 110, 110], [205, 0, 35], [50, 0, 10]], 1.15, 0.8, 1.25, 1.0, 0.65, 420),
  ('spirit_ascension', 'Spirit Ascension', 'rising_motes', 'glow', [[255, 255, 255], [220, 255, 225], [130, 255, 180], [30, 170, 110]], 1.05, 1.0, 1.0, 1.35, 1.0, 420),
  ('pentagram_curse', 'Cursed Pentagram', 'pentacle_array', 'glow', [[255, 200, 240], [255, 90, 200], [170, 0, 130], [40, 0, 40]], 1.05, 0.8, 1.2, 1.0, 0.65, 400),
  ('clockwork_king', 'Clockwork King', 'clockwork_seal', 'spark', [[255, 250, 220], [250, 225, 150], [210, 160, 70], [110, 75, 30]], 1.05, 0.8, 1.25, 1.0, 0.55, 400),
  ('astral_navigator', 'Astral Navigator', 'astral_compass', 'star', [[255, 255, 255], [210, 230, 255], [120, 160, 255], [70, 40, 200]], 1.05, 0.8, 1.25, 1.0, 0.55, 380),
  ('solar_crown', 'Solar Crown', 'sunburst_mandala', 'glow', [[255, 255, 230], [255, 230, 110], [255, 170, 30], [230, 100, 0]], 1.05, 0.9, 1.25, 1.0, 0.7, 420),
  ('pulsar', 'Pulsar', 'pulsar_seal', 'comet', [[240, 255, 255], [150, 240, 255], [60, 170, 255], [130, 60, 255]], 1.05, 1.15, 1.2, 1.0, 1.0, 400),
  ('eightfold_path', 'Eightfold Seal', 'octagram_array', 'glow', [[240, 255, 240], [170, 245, 190], [80, 210, 130], [20, 100, 70]], 1.05, 0.8, 1.25, 1.0, 0.55, 400),
  ('dimension_rift', 'Dimension Rift', 'nested_polygons', 'pixel', [[255, 255, 255], [255, 120, 255], [90, 220, 255], [20, 0, 60]], 1.05, 1.0, 1.2, 1.0, 1.0, 400),
  ('ember_monarch', 'Ember Monarch', 'ember_crown', 'glow', [[255, 250, 200], [255, 200, 90], [255, 90, 30], [110, 10, 10]], 1.2, 1.0, 1.05, 1.0, 1.0, 160),
  ('shadow_smoke_aura', 'Shadow Smoke Aura', 'vortex_shroud', 'smoke', [[200, 60, 80], [120, 0, 25], [30, 10, 35], [4, 0, 6]], 1.5, 0.8, 1.1, 1.2, 0.9, 420),
  ('arcane_rune_aura', 'Arcane Rune Aura', 'rune_circle', 'glow', [[255, 255, 255], [200, 255, 255], [40, 210, 245], [60, 90, 255]], 1.15, 0.8, 1.25, 1.0, 0.7, 320),
  ('golden_inferno_aura', 'Golden Inferno Aura', 'flame', 'glow', [[255, 255, 220], [255, 235, 140], [255, 175, 20], [190, 75, 0]], 1.3, 1.1, 1.1, 1.2, 1.0, 560),
]
MOTION = {'shadow_monarch': 1.4, 'storm_dragon': 1.5, 'black_flame': 1.3, 'inferno': 1.3, 'great_sage': 1.6, 'spirit_ascension': 1.3,
          'shadow_smoke_aura': 1.4, 'golden_inferno_aura': 1.3, 'ember_monarch': 1.3, 'pulsar': 1.2}
# weapon auras: drawn along the weapon you hold (any weapon)
WEAPON = [
  ('black_flame_blade', 'Black Flame Blade', 'flame', 'glow', [[190, 110, 255], [80, 0, 140], [5, 0, 10]], 1.0, 1.0, 1.0, 1.0, 1.0, 0),
  ('inferno_edge', 'Inferno Edge', 'flame', 'glow', [[255, 235, 120], [255, 110, 20], [150, 20, 10]], 1.0, 1.0, 1.0, 1.0, 1.0, 0),
  ('frostbite_edge', 'Frostbite Edge', 'rising_motes', 'crystal', [[245, 255, 255], [150, 220, 255], [60, 130, 230]], 1.0, 0.8, 1.0, 1.0, 1.0, 0),
  ('storm_blade', 'Storm Blade', 'twin_helix', 'spark', [[230, 255, 255], [70, 210, 255], [20, 80, 210]], 1.0, 1.4, 1.0, 1.0, 1.4, 0),
  ('shadow_extraction', 'Shadow Extraction', 'vortex_shroud', 'smoke', [[160, 90, 255], [70, 0, 150], [8, 0, 20]], 1.0, 0.9, 1.0, 1.0, 1.0, 0),
  ('holy_blade', 'Holy Blade', 'rising_motes', 'star', [[255, 255, 240], [255, 220, 110], [255, 170, 40]], 1.0, 0.9, 1.0, 1.0, 1.0, 0),
  ('bloodthirst', 'Bloodthirst', 'flame_scorched', 'tear', [[255, 120, 120], [190, 0, 25], [50, 0, 5]], 1.0, 1.0, 1.0, 1.0, 1.0, 0),
  ('void_edge', 'Void Edge', 'orbiting_orbs', 'comet', [[235, 150, 255], [120, 30, 210], [20, 0, 50]], 1.0, 1.1, 1.0, 1.0, 1.2, 0),
  ('sakura_edge', 'Sakura Edge', 'falling_embers', 'tear', [[255, 225, 240], [255, 150, 195], [225, 80, 150]], 1.0, 0.7, 1.0, 1.0, 0.8, 0),
  ('predator_mist', 'Predator Mist', 'starfield_shimmer', 'glow', [[150, 240, 255], [40, 160, 255], [20, 60, 190]], 1.0, 0.9, 1.0, 1.0, 1.0, 0),
]

# the 10 premium sets (scripts/manas/setdefs.py): each set's aura trails behind you as you move (motion_response 1.8)
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'manas'))
import setdefs
SET_AURAS, SET_BLADES = [], []
for sid, d in setdefs.SETS.items():
    st, part, cols = d['aura']
    cols4 = [[min(255, int(v * 0.35 + 255 * 0.65)) for v in cols[0]]] + cols   # a white-hot core stop in front of the set's gradient
    SET_AURAS.append((sid + '_aura', d['title'] + ' Aura', st, part, cols4[:4], 1.3, 1.0, 1.2, 1.2, 0.85, 420))
    st, part, cols = d['blade_aura']; SET_BLADES.append((sid + '_blade_aura', d['title'] + ' Blade Aura', st, part, cols, 1.1, 1.0, 1.0, 1.0, 1.0, 0))
TRAIL = {r[0] for r in SET_AURAS}

# Weapon auras are drawn by the mod at the hand, moved up the blade by half the blade length (+ "offset", blocks), then
# scaled by 0.4 x the weapon length (CosmeticLayer.renderWeaponAura). Each style's radius/height below is fitted so the
# particles hug the blade from guard to tip (checked with scripts/manas/wapreview.py, which ports the mod's style maths):
#   style: (radius, height, size, count)
BLADE_FIT = {
  'twin_helix': (0.42, 0.75, 1.0, 220), 'flame': (0.22, 0.95, 0.95, 300), 'flame_scorched': (0.2, 0.95, 0.9, 260),
  'rising_motes': (0.2, 9.0, 0.95, 260), 'vortex_shroud': (0.32, 0.78, 1.4, 260), 'orbiting_orbs': (0.3, 0.75, 1.0, 70),
  'falling_embers': (0.22, 0.68, 1.1, 170), 'starfield_shimmer': (0.25, 0.88, 1.25, 170),
}
def blade_offset(model_path):
    # origin at the top of the guard: offset = blade base - lift (blocks). Generic auras (any held weapon): -0.35.
    if not model_path or not os.path.isfile(model_path): return -0.35
    m = json.load(open(model_path)); ys = [v for e in m['elements'] for v in (e['from'][1], e['to'][1])]
    lift = min(max(max(ys) / 16 * 0.5, 0.15), 1.5)
    guard = [e for e in m['elements'] if e['from'][1] > 3 and abs(e['to'][2] - e['from'][2]) >= 7.9]   # the crossguard bar
    base = (max(e['to'][1] for e in guard) if guard else max(ys) * 0.22) / 16
    return round(base - lift, 3)
MODELS = os.path.join(os.path.dirname(__file__), '..', 'minecraft', 'manas_cosmetics', 'models', 'weapon')

def write(prefix, slot, rows):
    for (i, name, style, part, colors, size, speed, radius, height, rot, count) in rows:
        d = {'id': 'overthrone:' + i, 'display_name': name, 'slot': slot}
        if slot == 'weapon_aura': d['weapon_type'] = 'any'; d['force_equip_allowed'] = True
        d['aura'] = {'style': style, 'particle': part, 'colors': colors, 'particle_count': count, 'size': size, 'speed': speed,
                     'radius': radius, 'height': height, 'alpha': 1.0, 'rotation_speed': rot, 'emissive': True, 'motion_response': 1.8 if i in TRAIL else MOTION.get(i, 1.0)}
        if slot == 'weapon_aura':
            r, hgt, sz, n = BLADE_FIT[style]
            blade = os.path.join(MODELS, i[:-len('_aura')] + '.bbmodel') if i.endswith('_blade_aura') else None
            d['aura'].update({'radius': r, 'height': hgt, 'size': round(sz * size, 3), 'particle_count': n, 'offset': blade_offset(blade)})
        with open(os.path.join(OUT, prefix + i + '.json'), 'w') as f: json.dump(d, f, indent=2)
write('aura_', 'aura', AURAS + SET_AURAS)
write('weapon_', 'weapon_aura', WEAPON + SET_BLADES)
print('wrote', len(AURAS) + len(SET_AURAS), 'auras +', len(WEAPON) + len(SET_BLADES), 'weapon auras to', os.path.normpath(OUT))
