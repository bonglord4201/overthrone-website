# Offline checks for the Manas Cosmetics files + the OT_MANAS list (shop/crate). Rules come from the mod's own code
# (manas_cosmetics 1.0.6, decompiled): sidecar scale/offset/rotation must be 3-number arrays, slot from the mod's list,
# aura style/particle from AuraSpec, colours as [r,g,b] arrays.
#   python3 minecraft/tests/validate_manas_cosmetics.py
import gzip, json, os, re, subprocess, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MC = os.path.join(ROOT, 'manas_cosmetics')
SLOTS = 'helmet above_head chestplate back front legs boots armor_set ears orbit pet weapon aura weapon_aura ground shield grimoire magic_staff'.split()
SET_PARTS = ['wings', 'helm', 'armor', 'blade', 'blade_aura', 'aura', 'sigil', 'pet']
STYLES = ('rising_motes twin_helix halo circle vortex_shroud rune_circle orbiting_orbs starfield_shimmer ember_crown falling_embers pulse_rings '
          'flame flame_scorched triangle pentagram hexagram magic_circle arcane_array summoning_circle square octagram heptagram square_seal '
          'octagram_array pentacle_array nested_polygons seal_of_solomon sunburst_mandala radiant_sun clockwork_seal astral_compass pulsar_seal').split()
PARTICLES = 'glow orb spark pixel smoke ring crystal star tear comet'.split()
G20 = ('overlord_wings celestial_wings storm_crystal_wings blood_demon_wings seraph_halo_wings void_star_wings frost_shard_wings '
       'verdant_spirit_wings infernal_mech_wings bone_reaper_wings spirit_fox_tails throne_guard_wings blood_rune_circlet throne_halo '
       'void_crown demon_horns crystal_orbit shadow_smoke_aura arcane_rune_aura golden_inferno_aura').split()
errors = []
notes = []
sizes = []
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
    if 'particles' in d:   # WeaponParticleSpec: only weapon slots read it; the id must be a vanilla simple particle
        pp = d['particles']
        if d.get('slot') != 'weapon': err(fn + ': "particles" is only read for the weapon slot')
        SIMPLE = 'end_rod reverse_portal flame snowflake electric_spark crimson_spore glow sculk_soul composter soul_fire_flame soul enchanted_hit crit totem_of_undying wax_on scrape cherry_leaves portal small_flame witch firework'.split()
        if str(pp.get('particle', '')).replace('minecraft:', '') not in SIMPLE: err(fn + ': particles.particle must be a vanilla simple particle')
        if not set(pp.get('on', [])) <= {'attack', 'use', 'charging'} or not pp.get('on'): err(fn + ': particles.on must use attack/use/charging')
        if not 1 <= pp.get('count', 6) <= 64: err(fn + ': particles.count must be 1..64')
    if d.get('slot') in ('aura', 'weapon_aura'):
        a = d.get('aura') or {}
        if a.get('style') not in STYLES: err(fn + ': aura style ' + str(a.get('style')))
        if a.get('particle') not in PARTICLES: err(fn + ': aura particle ' + str(a.get('particle')))
        c = a.get('colors', [])
        if not c or not all(isinstance(x, list) and len(x) == 3 and all(isinstance(v, int) and 0 <= v <= 255 for v in x) for x in c):
            err(fn + ': colors must be [[r,g,b],...]')
        if a.get('motion_response', 1.0) != 0:   # the mod pushes particles back by velocity x 4 x motion_response (missing = 1.0)
            err(fn + ': motion_response must be 0, otherwise the aura falls behind the player when they move')
        if d.get('slot') == 'weapon_aura' and (a.get('radius', 1) > 0.5 or 'offset' not in a):
            err(fn + ': weapon auras must be fitted to the blade (radius <= 0.5 and an offset; see build-manas-auras.py BLADE_FIT)')
    else:
        mp = os.path.join(MC, d.get('model', '-'))
        if not os.path.isfile(mp): err(fn + ': model missing ' + d.get('model', ''))
        else:
            try:
                m = json.load(open(mp))
                if not m.get('elements'): err(fn + ': model has no cubes')
                if not m.get('textures') or not str(m['textures'][0].get('source', '')).startswith('data:image/png;base64,'):
                    err(fn + ': model texture not embedded')
                bone_ids = set()
                def _walk(g):
                    if isinstance(g, dict):
                        bone_ids.add(g.get('uuid')); [_walk(c) for c in g.get('children', [])]
                [_walk(g) for g in m.get('outliner', [])]
                for an in m.get('animations', []):
                    bad = [v.get('name') for k_, v in (an.get('animators') or {}).items() if k_ not in bone_ids]
                    if bad: err(fn + ': animation ' + str(an.get('name')) + ' drives bones that do not exist: ' + ', '.join(map(str, bad[:5])))
                tex_n = len(m.get('textures', []))
                if any(isinstance(f_.get('texture'), int) and f_['texture'] >= tex_n for e_ in m['elements'] for f_ in e_.get('faces', {}).values()):
                    err(fn + ': a face points at a texture index that does not exist')
                if not any(a.get('name') == 'idle' for a in m.get('animations', [])): notes.append(fn + ': no idle animation (static model)')
                elif m['animations'][0].get('name') != 'idle': err(fn + ': the first clip must be idle (the mod bakes the rest pose from it)')
                gz = len(gzip.compress(json.dumps(m, separators=(',', ':')).encode()))
                if gz > 900 * 1024: err(fn + ': %d KB compressed, the mod drops cosmetics over 1024 KB on the wire' % (gz // 1024))
                sizes.append(gz)
                res = m.get('resolution', {})
                for t in m.get('textures', []):
                    if t.get('uv_width') != res.get('width') or t.get('uv_height') != res.get('height'): err(fn + ': texture ' + t.get('name', '') + ' size differs from the model resolution')
                if d.get('slot') == 'back' and d.get('needs_y_flip') is not True: err(fn + ': back cosmetics need "needs_y_flip": true')
                ys = [v for e in m['elements'] for v in (e['from'][1], e['to'][1])]
                tops = [g for g in m['outliner'] if isinstance(g, dict)]
                if d.get('slot') == 'armor_set':
                    # CosmeticLayer.renderArmorSet / classifyRegion: limb binding by bone name + pivot side; lift = 12 - box centre
                    if d.get('needs_y_flip') is not False: err(fn + ': armor_set must have "needs_y_flip": false (authored Y-down)')
                    if abs((min(ys) + max(ys)) / 2 - 12) > 0.01: err(fn + ': armour box centre must be 12 (is %.2f)' % ((min(ys) + max(ys)) / 2))
                    names = {g['name']: g.get('origin', [0, 0, 0]) for g in tops}
                    for b, ok in (('body', lambda o: True), ('arm_r', lambda o: o[0] < -2.5), ('arm_l', lambda o: o[0] > 2.5), ('leg_r', lambda o: o[0] < -0.5), ('leg_l', lambda o: o[0] > 0.5)):
                        if b not in names or not ok(names[b]): err(fn + ': armour needs a top-level bone ' + b + ' on the right side')
                    if set(names) - {'body', 'arm_r', 'arm_l', 'leg_r', 'leg_l'}: err(fn + ': unexpected top-level bones ' + str(set(names) - {'body', 'arm_r', 'arm_l', 'leg_r', 'leg_l'}))
                if d.get('slot') == 'weapon':
                    if d.get('weapon_type') not in ('sword', 'greatsword', 'longsword', 'katana', 'scythe', 'spear', 'axe', 'hammer'): err(fn + ': weapon cosmetics need a weapon type (not any)')
                    if tops and any(tops[0].get('origin', [0, 0, 0])): err(fn + ': the first bone is the grip anchor and must sit at the origin')
                if d.get('slot') == 'ground' and max(ys) - min(ys) > 0.5: err(fn + ': ground sigils must be flat decals')
                if d.get('slot') == 'pet':
                    names = {an.get('name') for an in m.get('animations', [])}
                    if not d.get('floats') and not {'walk', 'run'} & names: err(fn + ': a walking pet (floats false) needs a walk clip')
                    if d.get('floats') and 'fly' not in names: err(fn + ': a floating pet always plays "fly" and needs that clip')
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

sys.path.insert(0, os.path.join(ROOT, '..', 'scripts', 'manas'))
import setdefs
for sid in setdefs.SETS:
    for part in SET_PARTS:
        if 'overthrone:%s_%s' % (sid, part) not in ids: err('set ' + sid + ': missing ' + part)
        if 'overthrone:%s_%s' % (sid, part) not in seen: err('set ' + sid + ': ' + part + ' not in OT_MANAS')
missing_price = [c['id'] for c in listed if not c.get('price')]
if missing_price: err('not sold in the Throne Shop (no price): ' + ', '.join(missing_price))
print(len(ids), 'cosmetic files,', len(listed), 'in OT_MANAS (all sold in the Throne Shop),', sum(1 for c in listed if c.get('crate')), 'also rare crate rewards')
if sizes: print('models: %d, biggest %d KB, total %d KB compressed (sent to each player on join, in 512 KB chunks)' % (len(sizes), max(sizes) // 1024, sum(sizes) // 1024))
for n in notes: print('note', n)
if errors:
    print('\n'.join('FAIL ' + e for e in errors)); sys.exit(1)
print('OK: all checks passed')
