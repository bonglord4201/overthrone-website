# Offline checks for the Manas Cosmetics files + the OT_MANAS list (shop/crate). Rules come from the mod's own code
# (manas_cosmetics 1.0.6, decompiled): sidecar scale/offset/rotation must be 3-number arrays, slot from the mod's list,
# aura style/particle from AuraSpec, colours as [r,g,b] arrays.
#   python3 minecraft/tests/validate_manas_cosmetics.py
import json, os, re, subprocess, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MC = os.path.join(ROOT, 'manas_cosmetics')
SLOTS = 'helmet above_head chestplate back front legs boots armor_set ears orbit pet weapon aura weapon_aura ground shield grimoire magic_staff'.split()
STYLES = ('rising_motes twin_helix halo circle vortex_shroud rune_circle orbiting_orbs starfield_shimmer ember_crown falling_embers pulse_rings '
          'flame flame_scorched triangle pentagram hexagram magic_circle arcane_array summoning_circle square octagram heptagram square_seal '
          'octagram_array pentacle_array nested_polygons seal_of_solomon sunburst_mandala radiant_sun clockwork_seal astral_compass pulsar_seal').split()
PARTICLES = 'glow orb spark pixel smoke ring crystal star tear comet'.split()
G20 = ('overlord_wings celestial_wings storm_crystal_wings blood_demon_wings seraph_halo_wings void_star_wings frost_shard_wings '
       'verdant_spirit_wings infernal_mech_wings bone_reaper_wings spirit_fox_tails throne_guard_wings blood_rune_circlet throne_halo '
       'void_crown demon_horns crystal_orbit shadow_smoke_aura arcane_rune_aura golden_inferno_aura').split()
errors = []
notes = []
def err(m): errors.append(m)

ids = {}
for fn in sorted(os.listdir(os.path.join(MC, 'cosmetics'))):
    p = os.path.join(MC, 'cosmetics', fn)
    try: d = json.load(open(p))
    except Exception as e: err(fn + ': bad JSON ' + str(e)); continue
    cid = d.get('id', '')
    if not re.match(r'^[a-z0-9_.-]+:[a-z0-9_./-]+$', cid): err(fn + ': bad id ' + cid)
    if cid in ids: err(fn + ': duplicate id ' + cid + ' (also ' + ids[cid] + ')')
    ids[cid] = fn
    if d.get('slot') not in SLOTS: err(fn + ': invalid slot ' + str(d.get('slot')))
    for k in ('scale', 'offset', 'rotation'):
        if k in d and not (isinstance(d[k], list) and len(d[k]) == 3 and all(isinstance(v, (int, float)) for v in d[k])):
            err(fn + ': ' + k + ' must be a 3-number array')
    if d.get('slot') in ('aura', 'weapon_aura'):
        a = d.get('aura') or {}
        if a.get('style') not in STYLES: err(fn + ': aura style ' + str(a.get('style')))
        if a.get('particle') not in PARTICLES: err(fn + ': aura particle ' + str(a.get('particle')))
        c = a.get('colors', [])
        if not c or not all(isinstance(x, list) and len(x) == 3 and all(isinstance(v, int) and 0 <= v <= 255 for v in x) for x in c):
            err(fn + ': colors must be [[r,g,b],...]')
    else:
        mp = os.path.join(MC, d.get('model', '-'))
        if not os.path.isfile(mp): err(fn + ': model missing ' + d.get('model', ''))
        else:
            try:
                m = json.load(open(mp))
                if not m.get('elements'): err(fn + ': model has no cubes')
                if not m.get('textures') or not str(m['textures'][0].get('source', '')).startswith('data:image/png;base64,'):
                    err(fn + ': model texture not embedded')
                if not any(a.get('name') == 'idle' for a in m.get('animations', [])): notes.append(fn + ': no idle animation (static model)')
            except Exception as e: err(fn + ': bad bbmodel ' + str(e))

# OT_MANAS (shop + crate list)
js = open(os.path.join(ROOT, 'kubejs', 'server_scripts', 'manas_cosmetics.js')).read()
out = subprocess.run(['node', '-e', 'var s=require("fs").readFileSync(0,"utf8");eval(s.split(";(function")[0]+";global.O=OT_MANAS");'
                      'console.log(JSON.stringify(O))'], input=js, capture_output=True, text=True)
if out.returncode: err('manas_cosmetics.js does not run: ' + out.stderr); listed = []
else: listed = [c for v in json.loads(out.stdout).values() for c in v]
seen = set()
for c in listed:
    if c['id'] in seen: err('OT_MANAS duplicate ' + c['id'])
    seen.add(c['id'])
    if c['id'] not in ids: err('OT_MANAS lists ' + c['id'] + ' but there is no cosmetics file for it')
    if not c.get('crate') and not c.get('price'): err(c['id'] + ': neither price nor crate')
for i in ids:
    if i not in seen: err(i + ' has a file but is not in OT_MANAS (not in shop or crate)')
for g in G20:
    if 'overthrone:' + g not in ids: err('OVERTHRONE 20: missing ' + g)
    if 'overthrone:' + g not in seen: err('OVERTHRONE 20: not in OT_MANAS ' + g)

print(len(ids), 'cosmetic files,', len(listed), 'in OT_MANAS,', sum(1 for c in listed if c.get('crate')), 'crate-only')
for n in notes: print('note', n)
if errors:
    print('\n'.join('FAIL ' + e for e in errors)); sys.exit(1)
print('OK: all checks passed')
