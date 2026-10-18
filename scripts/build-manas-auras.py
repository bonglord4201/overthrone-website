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
  ('demon_lord_awakening', 'Demon Lord Awakening', 'summoning_circle', 'glow', [[255, 70, 50], [190, 0, 25], [60, 0, 10]], 1.2, 0.8, 1.25, 1.0, 0.6, 0),
  ('shadow_monarch', 'Shadow Monarch', 'vortex_shroud', 'smoke', [[160, 90, 255], [70, 0, 150], [8, 0, 20]], 1.35, 0.9, 1.0, 1.15, 1.0, 0),
  ('true_hero', 'True Hero', 'radiant_sun', 'star', [[255, 255, 235], [255, 215, 90], [255, 150, 20]], 1.1, 1.0, 1.1, 1.0, 0.8, 0),
  ('storm_dragon', 'Storm Dragon', 'twin_helix', 'spark', [[230, 255, 255], [70, 210, 255], [20, 80, 210]], 1.0, 1.4, 1.0, 1.2, 1.4, 0),
  ('black_flame', 'Black Flame', 'flame', 'glow', [[190, 110, 255], [80, 0, 140], [5, 0, 10]], 1.25, 1.0, 1.0, 1.1, 1.0, 0),
  ('inferno', 'Inferno', 'flame', 'glow', [[255, 235, 120], [255, 110, 20], [150, 20, 10]], 1.2, 1.1, 1.0, 1.1, 1.0, 0),
  ('scorched_earth', 'Scorched Earth', 'flame_scorched', 'smoke', [[255, 140, 40], [120, 30, 10], [30, 20, 20]], 1.2, 0.9, 1.1, 1.0, 1.0, 0),
  ('arcane_sage', 'Arcane Sage', 'arcane_array', 'glow', [[210, 245, 255], [90, 170, 255], [40, 60, 210]], 1.0, 0.8, 1.15, 1.0, 0.7, 0),
  ('sakura_spirit', 'Sakura Spirit', 'falling_embers', 'tear', [[255, 225, 240], [255, 150, 195], [225, 80, 150]], 1.1, 0.7, 1.25, 1.15, 0.6, 0),
  ('frost_queen', 'Frost Queen', 'rune_circle', 'crystal', [[245, 255, 255], [160, 225, 255], [70, 140, 235]], 1.0, 0.9, 1.15, 1.0, 0.8, 0),
  ('great_sage', 'Great Sage', 'orbiting_orbs', 'orb', [[140, 240, 255], [40, 160, 255], [20, 60, 190]], 1.0, 1.0, 1.0, 1.0, 1.0, 0),
  ('celestial', 'Celestial', 'starfield_shimmer', 'star', [[255, 255, 255], [190, 210, 255], [160, 110, 255]], 1.0, 0.8, 1.25, 1.25, 0.8, 0),
  ('void_pulse', 'Void Pulse', 'pulse_rings', 'ring', [[230, 140, 255], [130, 40, 210], [30, 0, 60]], 1.0, 1.0, 1.15, 1.0, 1.0, 0),
  ('solomon_seal', 'Seal of the Demon King', 'seal_of_solomon', 'glow', [[255, 235, 140], [235, 165, 35], [120, 60, 0]], 1.0, 0.8, 1.15, 1.0, 0.6, 0),
  ('blood_moon', 'Blood Moon', 'magic_circle', 'glow', [[255, 130, 130], [205, 0, 35], [60, 0, 10]], 1.1, 0.8, 1.2, 1.0, 0.7, 0),
  ('spirit_ascension', 'Spirit Ascension', 'rising_motes', 'glow', [[235, 255, 235], [130, 255, 180], [30, 180, 120]], 1.0, 1.0, 1.0, 1.25, 1.0, 0),
  ('pentagram_curse', 'Cursed Pentagram', 'pentacle_array', 'glow', [[255, 100, 210], [170, 0, 130], [40, 0, 40]], 1.0, 0.8, 1.15, 1.0, 0.7, 0),
  # new
  ('clockwork_king', 'Clockwork King', 'clockwork_seal', 'spark', [[255, 240, 190], [220, 170, 70], [120, 80, 30]], 1.0, 0.8, 1.2, 1.0, 0.6, 0),
  ('astral_navigator', 'Astral Navigator', 'astral_compass', 'star', [[220, 240, 255], [120, 160, 255], [70, 40, 200]], 1.0, 0.8, 1.2, 1.0, 0.6, 0),
  ('solar_crown', 'Solar Crown', 'sunburst_mandala', 'glow', [[255, 255, 210], [255, 200, 60], [255, 120, 0]], 1.0, 0.9, 1.2, 1.0, 0.7, 0),
  ('pulsar', 'Pulsar', 'pulsar_seal', 'comet', [[200, 255, 255], [60, 200, 255], [130, 60, 255]], 1.0, 1.1, 1.15, 1.0, 1.0, 0),
  ('eightfold_path', 'Eightfold Seal', 'octagram_array', 'glow', [[220, 255, 220], [90, 220, 140], [20, 110, 80]], 1.0, 0.8, 1.2, 1.0, 0.6, 0),
  ('dimension_rift', 'Dimension Rift', 'nested_polygons', 'pixel', [[255, 120, 255], [90, 220, 255], [20, 0, 60]], 1.0, 1.0, 1.15, 1.0, 1.0, 0),
  ('ember_monarch', 'Ember Monarch', 'ember_crown', 'glow', [[255, 220, 120], [255, 90, 30], [120, 10, 10]], 1.1, 1.0, 1.0, 1.0, 1.0, 0),
  # the "OVERTHRONE 20" auras (ids/names from ChatGPT's pack; its versions used a style/particles/colour format the mod rejects)
  ('shadow_smoke_aura', 'Shadow Smoke Aura', 'vortex_shroud', 'smoke', [[120, 0, 25], [30, 10, 35], [5, 0, 8]], 1.4, 0.8, 1.05, 1.15, 0.9, 0),
  ('arcane_rune_aura', 'Arcane Rune Aura', 'rune_circle', 'glow', [[210, 255, 255], [40, 210, 245], [60, 90, 255]], 1.1, 0.8, 1.2, 1.0, 0.7, 0),
  ('golden_inferno_aura', 'Golden Inferno Aura', 'flame', 'glow', [[255, 245, 150], [255, 175, 20], [200, 80, 0]], 1.25, 1.1, 1.05, 1.15, 1.0, 0),
]
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
    st, part, cols = d['aura']; SET_AURAS.append((sid + '_aura', d['title'] + ' Aura', st, part, cols, 1.25, 1.0, 1.15, 1.15, 0.9, 0))
    st, part, cols = d['blade_aura']; SET_BLADES.append((sid + '_blade_aura', d['title'] + ' Blade Aura', st, part, cols, 1.1, 1.0, 1.0, 1.0, 1.0, 0))
TRAIL = {r[0] for r in SET_AURAS}

def write(prefix, slot, rows):
    for (i, name, style, part, colors, size, speed, radius, height, rot, count) in rows:
        d = {'id': 'overthrone:' + i, 'display_name': name, 'slot': slot}
        if slot == 'weapon_aura': d['weapon_type'] = 'any'; d['force_equip_allowed'] = True
        d['aura'] = {'style': style, 'particle': part, 'colors': colors, 'particle_count': count, 'size': size, 'speed': speed,
                     'radius': radius, 'height': height, 'alpha': 1.0, 'rotation_speed': rot, 'emissive': True, 'motion_response': 1.8 if i in TRAIL else 1.0}
        with open(os.path.join(OUT, prefix + i + '.json'), 'w') as f: json.dump(d, f, indent=2)
write('aura_', 'aura', AURAS + SET_AURAS)
write('weapon_', 'weapon_aura', WEAPON + SET_BLADES)
print('wrote', len(AURAS) + len(SET_AURAS), 'auras +', len(WEAPON) + len(SET_BLADES), 'weapon auras to', os.path.normpath(OUT))
