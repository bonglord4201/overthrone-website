# The 10 OVERTHRONE premium sets: palettes and style choices for every piece (sets5.py builds them).
GOLD = (255, 200, 70); AGOLD = (200, 150, 60)
SETS = {}
SETS['celestial_sovereign'] = dict(
    title='Celestial Sovereign', weight=3,
    wings=dict(layers=[dict(kind='feather', k=1.0, pal=dict(root=(255, 255, 255), tip=(205, 218, 240), edge=(255, 255, 255), shaft=(255, 225, 140), streak=(32, 38, 70), glow=(90, 230, 255), cov=(250, 252, 255))),
                       dict(kind='feather', k=0.8, th=-30, dy=-1.5, dz=0.7, pal=dict(root=(250, 252, 255), tip=(190, 205, 235), edge=(255, 255, 255), streak=(32, 38, 70), glow=(90, 230, 255)), counts=(9, 7, 9, 6)),
                       dict(kind='feather', k=0.6, th=-64, dy=-3.0, dz=1.3, pal=dict(root=(245, 248, 255), tip=(180, 195, 230), edge=(255, 255, 255), streak=(32, 38, 70)), counts=(7, 5, 7, 0))],
               arcs=GOLD, gems=(80, 230, 255), soft=(90, 210, 255), fx='feathers'),
    armor=dict(main=(26, 28, 44), panel=(236, 240, 248), trim=GOLD, gem=(70, 230, 255), energy=(90, 235, 255), cloth=(30, 40, 90), pauldron='feathered', feather=(250, 252, 255)),
    helm=dict(main=(26, 28, 44), panel=(236, 240, 248), trim=GOLD, gem=(70, 230, 255), crown='royal', feather=(250, 252, 255)),
    weapon=dict(shape='long', blade=(232, 238, 248), edge=(90, 235, 255), guard=GOLD, grip=(30, 40, 90), gem=(70, 230, 255)),
    sigil=dict(col=(255, 205, 80)),
    aura=('arcane_array', 'star', [[220, 255, 255], [90, 230, 255], [255, 210, 90]]), blade_aura=('rising_motes', 'star', [[230, 255, 255], [90, 230, 255], [255, 220, 120]]),
)

SETS['void_overlord'] = dict(
    title='Void Overlord', weight=3,
    wings=dict(layers=[dict(kind='plate', k=1.1, pal=dict(dark=(22, 18, 26), light=(80, 66, 86), rim=AGOLD, glow=(255, 40, 50), bone=(30, 24, 32))),
                       dict(kind='feather', k=0.8, th=-30, dy=-1.5, dz=0.7, pal=dict(root=(40, 30, 40), tip=(12, 6, 12), edge=(140, 20, 30), streak=(150, 10, 20), glow=(255, 40, 50)), counts=(9, 7, 9, 6)),
                       dict(kind='crystal', k=0.6, th=-62, dy=-3.0, dz=1.3, pal=dict(root=(210, 30, 50), tip=(90, 0, 15), glow=(255, 70, 80)), counts=(6, 4, 0, 0))],
               arcs=AGOLD, gems=(255, 40, 50), soft=(230, 20, 35), fx='embers', fxcol=(255, 80, 60), float_crystals=(220, 20, 40)),
    armor=dict(main=(20, 18, 24), panel=(84, 16, 28), trim=AGOLD, gem=(255, 40, 50), energy=(255, 30, 45), cloth=(90, 10, 20), pauldron='spiked'),
    helm=dict(main=(20, 18, 24), panel=(84, 16, 28), trim=AGOLD, gem=(255, 40, 50), energy=(255, 30, 45), crown='horned'),
    weapon=dict(shape='great', blade=(52, 46, 58), edge=(255, 40, 50), guard=AGOLD, grip=(70, 10, 18), gem=(255, 40, 50)),
    sigil=dict(col=(235, 30, 45)),
    aura=('summoning_circle', 'glow', [[255, 90, 90], [210, 10, 35], [40, 0, 10]]), blade_aura=('flame', 'glow', [[255, 120, 110], [210, 10, 35], [30, 0, 8]]),
)
SETS['solar_emperor'] = dict(
    title='Solar Emperor', weight=3,
    wings=dict(layers=[dict(kind='feather', k=1.05, pal=dict(root=(255, 252, 235), tip=(255, 205, 90), edge=(255, 255, 255), shaft=(255, 210, 90), streak=(215, 140, 30), glow=(255, 175, 40))),
                       dict(kind='feather', k=0.8, th=-30, dy=-1.5, dz=0.7, pal=dict(root=(255, 220, 110), tip=(255, 130, 20), edge=(255, 250, 210), glow=(255, 200, 70), flame=True), counts=(9, 7, 9, 6))],
               arcs=(255, 210, 80), gems=(255, 160, 40), soft=(255, 190, 70), fx='sparkles', fxcol=(255, 225, 130)),
    armor=dict(main=(215, 160, 45), panel=(250, 240, 215), trim=(255, 225, 120), gem=(255, 150, 30), energy=(255, 190, 60), cloth=(190, 60, 20), pauldron='royal'),
    helm=dict(main=(215, 160, 45), panel=(250, 240, 215), trim=(255, 225, 120), gem=(255, 150, 30), energy=(255, 200, 80), crown='solar'),
    weapon=dict(shape='spear', blade=(255, 222, 130), edge=(255, 170, 40), guard=(255, 225, 120), grip=(250, 240, 215), gem=(255, 150, 30)),
    sigil=dict(col=(255, 185, 55)),
    aura=('radiant_sun', 'glow', [[255, 255, 210], [255, 200, 60], [255, 120, 0]]), blade_aura=('flame', 'glow', [[255, 250, 190], [255, 190, 50], [230, 100, 0]]),
)
SETS['frost_monarch'] = dict(
    title='Frost Monarch', weight=3,
    wings=dict(layers=[dict(kind='crystal', k=1.0, pal=dict(root=(240, 252, 255), tip=(110, 180, 240), glow=(200, 245, 255)), counts=(8, 6, 10, 0)),
                       dict(kind='feather', k=0.85, th=-24, dy=-1.0, dz=1.0, pal=dict(root=(250, 255, 255), tip=(170, 215, 255), edge=(255, 255, 255), streak=(120, 170, 220), glow=(180, 240, 255)), counts=(10, 8, 10, 6))],
               arcs=(225, 238, 252), gems=(150, 235, 255), soft=(150, 210, 255), fx='snow', fxcol=(245, 252, 255)),
    armor=dict(main=(190, 202, 220), panel=(238, 246, 255), trim=(232, 242, 255), gem=(140, 230, 255), energy=(170, 240, 255), cloth=(60, 110, 170), pauldron='crystal'),
    helm=dict(main=(190, 202, 220), panel=(238, 246, 255), trim=(232, 242, 255), gem=(150, 235, 255), crown='frost'),
    weapon=dict(shape='crystal', blade=(205, 240, 255), edge=(160, 240, 255), guard=(232, 242, 255), grip=(50, 90, 140), gem=(150, 235, 255)),
    sigil=dict(col=(150, 220, 255)),
    aura=('rune_circle', 'crystal', [[245, 255, 255], [160, 225, 255], [70, 140, 235]]), blade_aura=('rising_motes', 'crystal', [[245, 255, 255], [150, 220, 255], [60, 130, 230]]),
)
SETS['storm_dragon'] = dict(
    title='Storm Dragon', weight=3,
    wings=dict(layers=[dict(kind='membrane', k=1.15, pal=dict(mem=(28, 40, 80), edge=(90, 230, 255), vein=(15, 22, 48), bone=(22, 26, 40), claw=(225, 240, 255), glow_vein=(80, 230, 255), spikes=True)),
                       dict(kind='plate', k=0.55, th=-8, dy=0.5, dz=-0.9, pal=dict(dark=(24, 34, 64), light=(70, 110, 170), rim=(90, 230, 255), glow=(90, 230, 255), bone=(22, 26, 40)), counts=(7, 6, 8, 6))],
               soft=(60, 200, 255), fx='sparkles', fxcol=(160, 245, 255)),
    armor=dict(main=(18, 22, 40), main_style='scale', panel=(32, 54, 96), trim=(150, 172, 205), gem=(60, 230, 255), energy=(80, 235, 255), cloth=(20, 30, 60), pauldron='dragon'),
    helm=dict(main=(18, 22, 40), panel=(32, 54, 96), trim=(150, 172, 205), gem=(60, 230, 255), energy=(80, 235, 255), crown='dragon'),
    weapon=dict(shape='dragon', blade=(150, 176, 212), edge=(80, 235, 255), guard=(40, 52, 84), grip=(20, 26, 42), gem=(60, 230, 255)),
    sigil=dict(col=(70, 220, 255)),
    aura=('twin_helix', 'spark', [[235, 255, 255], [80, 220, 255], [30, 90, 220]]), blade_aura=('twin_helix', 'spark', [[235, 255, 255], [80, 220, 255], [30, 90, 220]]),
)
SETS['blood_demon_king'] = dict(
    title='Blood Demon King', weight=3,
    wings=dict(layers=[dict(kind='membrane', k=1.1, pal=dict(mem=(125, 6, 20), edge=(40, 0, 6), vein=(70, 0, 10), bone=(22, 8, 10), claw=(220, 170, 60), glow_vein=(255, 30, 40), holes=6, spikes=True)),
                       dict(kind='plate', k=0.75, th=-34, dy=-1.5, dz=0.8, pal=dict(dark=(36, 8, 12), light=(110, 24, 30), rim=(220, 170, 60), glow=(255, 30, 40), bone=(22, 8, 10)), counts=(8, 6, 8, 5))],
               gems=(255, 35, 45), soft=(220, 0, 20), fx='embers', fxcol=(255, 70, 40)),
    armor=dict(main=(26, 12, 14), panel=(115, 15, 24), trim=(220, 170, 60), gem=(255, 30, 40), energy=(255, 40, 40), cloth=(70, 5, 12), pauldron='horned'),
    helm=dict(main=(26, 12, 14), panel=(115, 15, 24), trim=(220, 170, 60), gem=(255, 30, 40), energy=(255, 40, 40), crown='demon'),
    weapon=dict(shape='jagged', blade=(70, 22, 28), edge=(255, 40, 40), guard=(220, 170, 60), grip=(32, 10, 12), gem=(255, 30, 40)),
    sigil=dict(col=(220, 25, 40)),
    aura=('flame_scorched', 'smoke', [[255, 80, 60], [150, 10, 20], [25, 5, 8]]), blade_aura=('flame', 'glow', [[255, 120, 100], [200, 0, 25], [40, 0, 5]]),
)
SETS['abyssal_king'] = dict(
    title='Abyssal King', weight=3,
    wings=dict(layers=[dict(kind='membrane', k=1.1, pal=dict(fingers=[(94, 15.5), (72, 20.0), (50, 23.0), (28, 24.5), (6, 23.0), (-16, 19.0)], depth=0.16,
                                                            mem=(16, 34, 76), edge=(70, 235, 220), vein=(10, 22, 52), bone=(190, 210, 230), claw=(90, 245, 230), glow_vein=(70, 235, 220))),
                       dict(kind='feather', k=0.7, th=-36, dy=-1.5, dz=0.9, pal=dict(root=(30, 60, 120), tip=(12, 24, 60), edge=(120, 245, 235), glow=(70, 240, 225), streak=(70, 200, 220)), counts=(8, 6, 8, 5))],
               gems=(70, 235, 220), soft=(40, 200, 220), fx='souls', fxcol=(150, 245, 255)),
    armor=dict(main=(16, 32, 72), panel=(30, 72, 124), main_style='scale', trim=(205, 220, 235), gem=(60, 232, 212), energy=(70, 242, 222), cloth=(10, 42, 84), pauldron='fin'),
    helm=dict(main=(16, 32, 72), panel=(30, 72, 124), trim=(205, 220, 235), gem=(60, 232, 212), energy=(70, 242, 222), crown='fin'),
    weapon=dict(shape='trident', blade=(212, 228, 242), edge=(70, 242, 222), guard=(205, 220, 235), grip=(16, 32, 72), gem=(60, 232, 212)),
    sigil=dict(col=(60, 222, 212)),
    aura=('vortex_shroud', 'orb', [[200, 255, 255], [60, 220, 230], [20, 60, 160]]), blade_aura=('orbiting_orbs', 'orb', [[200, 255, 255], [60, 220, 230], [20, 60, 160]]),
)
SETS['soul_reaper'] = dict(
    title='Soul Reaper', weight=3,
    wings=dict(layers=[dict(kind='membrane', k=1.1, pal=dict(mem=(38, 34, 44), edge=(14, 12, 18), vein=(26, 22, 32), bone=(232, 222, 202), claw=(232, 222, 202), glow_vein=(175, 95, 255), holes=12)),
                       dict(kind='plate', k=0.72, th=-34, dy=-1.5, dz=0.9, pal=dict(dark=(210, 200, 182), light=(240, 234, 220), rim=(150, 140, 160), glow=(175, 95, 255), bone=(232, 222, 202)), counts=(7, 5, 6, 0))],
               soft=(150, 70, 255), fx='souls', fxcol=(190, 120, 255)),
    armor=dict(main=(22, 20, 26), panel=(62, 56, 68), accent=((226, 216, 196), None, 'bone'), trim=(150, 140, 162), gem=(175, 95, 255), energy=(185, 105, 255), cloth=(30, 26, 36), pauldron='bone'),
    helm=dict(main=(22, 20, 26), panel=(62, 56, 68), accent=((226, 216, 196), None, 'bone'), trim=(150, 140, 162), gem=(175, 95, 255), energy=(185, 105, 255), crown='skull', visor='skull'),
    weapon=dict(shape='scythe', blade=(205, 200, 215), edge=(175, 95, 255), guard=(62, 56, 68), grip=(30, 26, 36), gem=(175, 95, 255)),
    sigil=dict(col=(170, 90, 255)),
    aura=('vortex_shroud', 'smoke', [[200, 150, 255], [110, 40, 200], [15, 5, 25]]), blade_aura=('vortex_shroud', 'smoke', [[200, 150, 255], [110, 40, 200], [15, 5, 25]]),
)
SETS['verdant_dragon'] = dict(
    title='Verdant Dragon Emperor', weight=3,
    wings=dict(layers=[dict(kind='leaf', k=1.05, pal=dict(root=(46, 158, 74), tip=(120, 215, 115), vein=(22, 92, 42))),
                       dict(kind='feather', k=0.8, th=-30, dy=-1.5, dz=0.8, pal=dict(root=(64, 184, 96), tip=(22, 92, 52), edge=(255, 212, 92), glow=(150, 255, 170), streak=(20, 70, 35)), counts=(9, 7, 9, 6))],
               arcs=(240, 200, 80), gems=(70, 235, 120), soft=(110, 255, 140), fx='souls', fxcol=(150, 255, 175)),
    armor=dict(main=(22, 46, 30), main_style='scale', panel=(44, 124, 64), trim=(240, 200, 80), gem=(60, 232, 112), energy=(125, 255, 152), cloth=(26, 72, 38), pauldron='leaf', leaf=(84, 192, 92)),
    helm=dict(main=(22, 46, 30), panel=(44, 124, 64), trim=(240, 200, 80), gem=(60, 232, 112), energy=(125, 255, 152), crown='antlers', leaf=(84, 192, 92)),
    weapon=dict(shape='leaf', blade=(96, 204, 116), edge=(150, 255, 172), guard=(240, 200, 80), grip=(62, 42, 26), gem=(60, 232, 112)),
    sigil=dict(col=(90, 230, 122)),
    aura=('rising_motes', 'glow', [[230, 255, 230], [120, 255, 160], [30, 170, 90]]), blade_aura=('falling_embers', 'tear', [[220, 255, 220], [120, 240, 150], [30, 140, 70]]),
)
SETS['thronebreaker'] = dict(
    title='Thronebreaker Ascendant', weight=1,
    wings=dict(layers=[dict(kind='feather', k=1.22, pal=dict(root=(175, 16, 32), tip=(62, 0, 12), edge=(255, 205, 80), shaft=(255, 205, 80), streak=(22, 0, 6), glow=(255, 60, 60)), arcs=True),
                       dict(kind='plate', k=0.98, th=-20, dy=-1.0, dz=0.6, pal=dict(dark=(18, 14, 18), light=(64, 52, 58), rim=(255, 205, 80), glow=(255, 40, 50), bone=(255, 200, 70)), counts=(10, 8, 10, 0), arcs=True),
                       dict(kind='feather', k=0.74, th=-46, dy=-2.0, dz=1.1, pal=dict(root=(42, 30, 36), tip=(14, 8, 12), edge=(255, 205, 80), glow=(255, 50, 50), streak=(150, 10, 20)), counts=(8, 6, 8, 5)),
                       dict(kind='crystal', k=0.52, th=-76, dy=-3.0, dz=1.5, pal=dict(root=(215, 35, 55), tip=(95, 0, 16), glow=(255, 80, 90)), counts=(6, 4, 0, 0))],
               arcs=(255, 202, 70), gems=(255, 35, 50), soft=(230, 20, 35), fx='embers', fxcol=(255, 200, 90), float_crystals=(230, 25, 45)),
    armor=dict(main=(16, 14, 18), panel=(72, 10, 18), trim=(255, 202, 70), gem=(255, 30, 45), energy=(255, 50, 50), cloth=(110, 10, 20), pauldron='royal'),
    helm=dict(main=(16, 14, 18), panel=(72, 10, 18), trim=(255, 202, 70), gem=(255, 30, 45), energy=(255, 50, 50), crown='imperial'),
    weapon=dict(shape='royal', blade=(38, 32, 38), edge=(255, 40, 50), guard=(255, 202, 70), grip=(92, 10, 20), gem=(255, 30, 45)),
    sigil=dict(col=(255, 196, 64)),
    aura=('seal_of_solomon', 'glow', [[255, 235, 150], [235, 50, 50], [100, 0, 10]]), blade_aura=('flame', 'glow', [[255, 230, 150], [235, 30, 40], [60, 0, 8]]),
)

# v6: painted-armour motif per set (armorart.motif_bg / chest designs)
MOTIF = {'celestial_sovereign': 'feather', 'void_overlord': 'demon', 'solar_emperor': 'sun', 'frost_monarch': 'ice', 'storm_dragon': 'scale',
         'blood_demon_king': 'demon', 'abyssal_king': 'scale', 'soul_reaper': 'bone', 'verdant_dragon': 'leaf', 'thronebreaker': 'royal'}
for _sid, _d in SETS.items():
    _d['armor']['motif'] = MOTIF[_sid]; _d['helm']['motif'] = MOTIF[_sid]

# v6: one pet per set: (builder, kwargs, floats, pet name). builders: pets4.phoenix / fox / wisp, pets6.dragon / jelly
PETS = {
    'celestial_sovereign': ('phoenix', dict(body=(236, 242, 255), head=(255, 255, 255), tail=(170, 205, 255), glow=(90, 230, 255)), True, 'Seraph Chick'),
    'void_overlord': ('dragon', dict(body=(42, 32, 44), belly=(120, 20, 32), wing=(95, 10, 28), horn=(200, 150, 60), glow=(255, 40, 50), iris=(255, 70, 70), fx_col=(255, 80, 60), frill=(140, 15, 30)), False, 'Void Dragonling'),
    'solar_emperor': ('fox', dict(fur=(255, 196, 70), light=(255, 250, 230), dark=(150, 85, 20), iris=(255, 140, 30), tails=3, glow=(255, 200, 70)), False, 'Sun Fox'),
    'frost_monarch': ('fox', dict(fur=(230, 245, 255), light=(255, 255, 255), dark=(90, 140, 200), iris=(120, 220, 255), tails=2, glow=(150, 235, 255), spirit=True, socks=(160, 200, 240), ear_tip=(150, 235, 255)), False, 'Frost Fox'),
    'storm_dragon': ('dragon', dict(body=(60, 130, 220), belly=(220, 235, 255), wing=(40, 90, 190), horn=(235, 240, 250), glow=(110, 230, 255), iris=(110, 230, 255), fx_col=(150, 240, 255), frill=(80, 200, 255)), False, 'Storm Dragonling'),
    'blood_demon_king': ('wisp', dict(core=(45, 6, 12), flame=(255, 40, 45), eye=(255, 225, 205)), True, 'Blood Wisp'),
    'abyssal_king': ('jelly', dict(bell=(40, 90, 190), glow=(70, 235, 220), tent=(60, 140, 220)), True, 'Abyssal Jelly'),
    'soul_reaper': ('wisp', dict(core=(28, 22, 38), flame=(190, 120, 255), eye=(240, 255, 250), lantern=True), True, 'Soul Lantern'),
    'verdant_dragon': ('dragon', dict(body=(62, 168, 84), belly=(232, 230, 172), wing=(52, 140, 62), horn=(240, 200, 80), glow=(150, 255, 170), iris=(255, 220, 90), fx_col=(170, 255, 180), frill=(90, 200, 100)), False, 'Forest Dragonling'),
    'thronebreaker': ('phoenix', dict(body=(200, 20, 32), head=(255, 190, 60), tail=(120, 0, 16), glow=(255, 200, 80)), True, 'Crimson Phoenix'),
}
