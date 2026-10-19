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
# v13 (owner's video: "they look bad and fall behind"):
#  - motion_response 0 on every aura. The mod moves each particle back by velocity x 4 x motion_response (AuraMotionTracker
#    + every *Style.render), so anything above 0 leaves the aura behind you when you walk or sprint. 0 = locked to you.
#  - The mod blends aura particles as see-through sprites (normal alpha blending, not additive glow) and shades them like
#    entities, so pale and dark colours turn grey/brown in daylight. Palettes stay bright and saturated to the last stop
#    (dark stops only on smoke), and solid particle shapes (orb / pixel / tear / comet) replace the soft 'glow' fog.
#  - Line-art circles use size ~2 (the band width is 0.022 x size) with the orb/pixel texture so the lines are bold.
#  - Designed and checked with scripts/manas/auraview.py (day + night scene, sprinting test).
AURAS = [
  ('demon_lord_awakening', 'Demon Lord Awakening', 'flame_scorched', 'orb', [[255, 196, 66], [255, 76, 10], [236, 0, 32], [184, 0, 44]], 0.56, 1.0, 1.0, 1.05, 1.0, 760),
  ('shadow_monarch', 'Shadow Monarch', 'vortex_shroud', 'orb', [[240, 220, 255], [176, 96, 255], [112, 34, 232], [70, 0, 150]], 0.95, 0.9, 1.05, 1.05, 1.0, 960),
  ('true_hero', 'True Hero', 'hexagram', 'orb', [[255, 255, 240], [255, 226, 110], [255, 184, 40], [255, 245, 190]], 0.62, 1.0, 1.15, 1.0, 0.6, 1000),
  ('storm_dragon', 'Storm Dragon', 'twin_helix', 'spark', [[255, 255, 255], [160, 244, 255], [50, 180, 255], [90, 100, 255]], 2.6, 1.35, 1.1, 1.05, 1.5, 720),
  ('black_flame', 'Black Flame', 'flame', 'orb', [[214, 126, 255], [156, 46, 255], [112, 0, 232], [84, 0, 176]], 0.56, 1.0, 0.88, 1.12, 1.0, 800),
  ('inferno', 'Inferno', 'flame', 'orb', [[255, 222, 66], [255, 146, 0], [255, 76, 0], [232, 24, 0]], 0.56, 1.05, 0.88, 1.12, 1.0, 800),
  ('scorched_earth', 'Scorched Earth', 'flame_scorched', 'pixel', [[255, 206, 66], [255, 116, 0], [222, 54, 0], [156, 126, 116]], 0.5, 0.9, 1.05, 0.95, 1.0, 720),
  ('arcane_sage', 'Arcane Sage', 'arcane_array', 'orb', [[255, 255, 255], [150, 222, 255], [116, 128, 255], [196, 120, 255]], 2.0, 1.0, 1.3, 1.0, 0.55, 240),
  ('sakura_spirit', 'Sakura Spirit', 'falling_embers', 'tear', [[255, 244, 250], [255, 186, 220], [255, 128, 186], [240, 84, 156]], 1.55, 0.7, 1.3, 1.05, 1.0, 340),
  ('frost_queen', 'Frost Queen', 'rune_circle', 'crystal', [[255, 255, 255], [196, 242, 255], [116, 206, 255], [76, 146, 255]], 2.7, 0.9, 1.15, 1.1, 0.7, 600),
  ('great_sage', 'Great Sage', 'orbiting_orbs', 'orb', [[255, 255, 255], [166, 250, 255], [50, 186, 255], [40, 80, 230]], 1.15, 1.0, 1.0, 1.0, 1.0, 112),
  ('celestial', 'Celestial', 'starfield_shimmer', 'star', [[255, 255, 255], [255, 240, 196], [206, 186, 255], [156, 126, 255]], 3.2, 0.8, 1.2, 1.15, 1.0, 380),
  ('void_pulse', 'Void Pulse', 'pulse_rings', 'orb', [[255, 232, 255], [234, 126, 255], [166, 56, 255], [116, 20, 220]], 1.1, 0.85, 1.05, 1.0, 1.0, 600),
  ('solomon_seal', 'Seal of the Demon King', 'seal_of_solomon', 'orb', [[255, 250, 206], [255, 216, 96], [255, 172, 34], [255, 232, 150]], 2.0, 1.0, 1.3, 1.0, 0.5, 255),
  ('blood_moon', 'Blood Moon', 'magic_circle', 'orb', [[255, 176, 156], [255, 56, 56], [212, 0, 44], [255, 126, 96]], 2.0, 1.0, 1.3, 1.0, 0.55, 260),
  ('spirit_ascension', 'Spirit Ascension', 'rising_motes', 'orb', [[255, 255, 255], [204, 255, 220], [96, 255, 166], [0, 214, 146]], 0.7, 0.9, 1.35, 1.5, 1.0, 720),
  ('pentagram_curse', 'Cursed Pentagram', 'pentacle_array', 'orb', [[255, 186, 244], [255, 66, 206], [196, 0, 176], [255, 126, 232]], 2.0, 1.0, 1.3, 1.0, 0.55, 255),
  ('clockwork_king', 'Clockwork King', 'clockwork_seal', 'pixel', [[255, 238, 176], [236, 186, 86], [206, 136, 44], [255, 222, 136]], 1.9, 1.0, 1.3, 1.0, 0.5, 255),
  ('astral_navigator', 'Astral Navigator', 'astral_compass', 'orb', [[255, 255, 255], [176, 214, 255], [96, 146, 255], [206, 176, 255]], 2.0, 1.0, 1.35, 1.0, 0.45, 250),
  ('solar_crown', 'Solar Crown', 'sunburst_mandala', 'orb', [[255, 255, 230], [255, 222, 80], [255, 160, 20], [255, 240, 170]], 1.5, 1.0, 0.5, 1.0, 0.8, 260, {'offset': 2.12}),
  ('pulsar', 'Pulsar', 'pulsar_seal', 'orb', [[236, 255, 255], [116, 232, 255], [46, 156, 255], [166, 96, 255]], 2.0, 1.0, 1.3, 1.0, 0.8, 255),
  ('eightfold_path', 'Eightfold Seal', 'octagram_array', 'orb', [[236, 255, 240], [126, 255, 176], [36, 214, 136], [186, 255, 216]], 2.0, 1.0, 1.3, 1.0, 0.5, 260),
  ('dimension_rift', 'Dimension Rift', 'nested_polygons', 'pixel', [[255, 255, 255], [255, 96, 255], [86, 232, 255], [166, 86, 255]], 2.0, 1.0, 1.3, 1.0, 0.9, 250),
  ('ember_monarch', 'Ember Monarch', 'ember_crown', 'orb', [[255, 236, 120], [255, 176, 30], [255, 100, 10], [236, 50, 0]], 1.0, 1.0, 1.1, 1.0, 1.0, 420),
  ('shadow_smoke_aura', 'Shadow Smoke Aura', 'flame', 'smoke', [[255, 96, 116], [196, 14, 46], [110, 0, 36], [56, 0, 26]], 1.35, 0.8, 0.95, 1.1, 1.0, 520),
  ('arcane_rune_aura', 'Arcane Rune Aura', 'rune_circle', 'pixel', [[255, 255, 255], [126, 255, 255], [0, 214, 255], [66, 116, 255]], 1.0, 0.85, 1.15, 1.1, 0.7, 560),
  ('golden_inferno_aura', 'Golden Inferno Aura', 'flame', 'orb', [[255, 238, 96], [255, 198, 0], [255, 142, 0], [255, 98, 0]], 0.56, 0.95, 0.88, 1.12, 1.0, 800),
]
# the 10 premium set auras: the most elaborate looks, each themed to its set (scripts/manas/setdefs.py titles)
SET_DESIGN = {
  'celestial_sovereign': ('arcane_array', 'orb', [[255, 255, 255], [156, 242, 255], [255, 216, 106], [255, 246, 206]], 2.2, 1.0, 1.4, 1.0, 0.5, 240),
  'void_overlord': ('summoning_circle', 'orb', [[255, 146, 126], [255, 44, 56], [186, 0, 46], [255, 96, 86]], 2.2, 1.0, 1.4, 1.0, 0.5, 260),
  'solar_emperor': ('radiant_sun', 'orb', [[255, 255, 226], [255, 220, 76], [255, 156, 10], [255, 240, 166]], 2.2, 1.0, 1.4, 1.0, 0.6, 250),
  'frost_monarch': ('magic_circle', 'orb', [[255, 255, 255], [186, 240, 255], [96, 196, 255], [156, 226, 255]], 2.2, 1.0, 1.4, 1.0, 0.45, 260),
  'storm_dragon': ('twin_helix', 'comet', [[255, 255, 255], [146, 240, 255], [40, 170, 255], [116, 96, 255]], 1.1, 1.4, 1.15, 1.05, 1.6, 1000),
  'blood_demon_king': ('flame_scorched', 'orb', [[255, 96, 86], [236, 14, 42], [190, 0, 34], [140, 0, 32]], 0.56, 0.95, 1.05, 1.05, 1.0, 760),
  'abyssal_king': ('vortex_shroud', 'orb', [[226, 255, 255], [66, 236, 240], [0, 166, 206], [26, 80, 186]], 0.95, 0.85, 1.05, 1.05, 1.0, 960),
  'soul_reaper': ('rising_motes', 'comet', [[236, 255, 246], [110, 255, 210], [56, 186, 196], [126, 76, 226]], 1.15, 0.75, 1.3, 1.6, 1.0, 640),
  'verdant_dragon': ('rune_circle', 'tear', [[255, 255, 206], [156, 255, 126], [46, 222, 116], [0, 156, 96]], 1.45, 0.85, 1.15, 1.1, 0.7, 560),
  'thronebreaker': ('square_seal', 'orb', [[255, 242, 176], [255, 204, 66], [234, 44, 44], [255, 222, 126]], 2.2, 1.0, 1.4, 1.0, 0.5, 250),
}
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

# the 10 premium sets (scripts/manas/setdefs.py)
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'manas'))
import setdefs
SET_AURAS, SET_BLADES = [], []
for sid, d in setdefs.SETS.items():
    SET_AURAS.append((sid + '_aura', d['title'] + ' Aura') + SET_DESIGN[sid])
    st, part, cols = d['blade_aura']; SET_BLADES.append((sid + '_blade_aura', d['title'] + ' Blade Aura', st, part, cols, 1.1, 1.0, 1.0, 1.0, 1.0, 0))

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

def vivid(colors, floor=150):
    # v13: weapon-aura palettes faded to near-black, which goes muddy brown under the mod's alpha blending; lift any dark
    # stop so its brightest channel is at least `floor` (keeps the hue)
    out = []
    for c in colors:
        m = max(c); k = floor / m if 0 < m < floor else 1.0
        out.append([min(255, int(round(v * k))) for v in c] if m > 0 else [floor // 3] * 3)
    return out

def write(prefix, slot, rows):
    for row in rows:
        (i, name, style, part, colors, size, speed, radius, height, rot, count), extra = row[:11], (row[11] if len(row) > 11 else {})
        d = {'id': 'overthrone:' + i, 'display_name': name, 'slot': slot}
        if slot == 'weapon_aura': d['weapon_type'] = 'any'; d['force_equip_allowed'] = True
        d['aura'] = {'style': style, 'particle': part, 'colors': colors, 'particle_count': count, 'size': size, 'speed': speed,
                     'radius': radius, 'height': height, 'alpha': 1.0, 'rotation_speed': rot, 'emissive': True, 'motion_response': 0.0}
        d['aura'].update(extra)
        if slot == 'weapon_aura':
            d['aura']['colors'] = vivid(colors)
            r, hgt, sz, n = BLADE_FIT[style]
            blade = os.path.join(MODELS, i[:-len('_aura')] + '.bbmodel') if i.endswith('_blade_aura') else None
            d['aura'].update({'radius': r, 'height': hgt, 'size': round(sz * size, 3), 'particle_count': n, 'offset': blade_offset(blade)})
        with open(os.path.join(OUT, prefix + i + '.json'), 'w') as f: json.dump(d, f, indent=2)
write('aura_', 'aura', AURAS + SET_AURAS)
write('weapon_', 'weapon_aura', WEAPON + SET_BLADES)
print('wrote', len(AURAS) + len(SET_AURAS), 'auras +', len(WEAPON) + len(SET_BLADES), 'weapon auras to', os.path.normpath(OUT))
