# v12 designs for every feathered-family wing (built by wingkit.build). Ids never change (players own them).
# Each entry: a distinct style (angel / dark / flame / crystal / leaf), silhouette (tall / wide / swept, size), frame,
# blades, crest gem and effects theme, so no two wings are recolours of each other.

def pal(base, mid, shade, line, shaft, tip=None, glow=None):
    return dict(base=base, mid=mid, shade=shade, line=line, shaft=shaft, tip=tip, glow=glow)

GOLD = (238, 188, 66); IVORY = (238, 236, 232)
WHITE = pal((255, 255, 255), (250, 250, 255), (232, 230, 248), (192, 188, 226), (255, 246, 224))

WINGS = {
    # ---- catalogue
    'seraph_wings': dict(style='angel', shape='tall', size=1.0, pal=dict(WHITE, tip=GOLD, glow=(255, 236, 150)),
                         frame=(IVORY, GOLD), gem=(255, 236, 140), sabers=None, fx='angel', fxcol=(255, 240, 170), fxcol2=(255, 255, 230), soft=(255, 230, 150)),
    'archangel_wings': dict(style='angel', shape='tall', size=1.1, pal=pal((255, 252, 236), (252, 244, 214), (236, 222, 180), (205, 170, 100), (255, 230, 150), tip=(250, 200, 70), glow=(255, 225, 110)),
                            frame=((255, 248, 225), GOLD), gem=(255, 250, 200), sabers=GOLD, fx='angel', fxcol=(255, 225, 120), fxcol2=(255, 250, 220), soft=(255, 205, 90)),
    'celestial_wings': dict(style='angel', shape='wide', size=1.0, pal=pal((255, 255, 255), (240, 246, 255), (205, 222, 250), (150, 175, 225), (235, 240, 255), tip=(150, 190, 255), glow=(170, 210, 255)),
                            frame=((240, 246, 255), (200, 210, 235)), gem=(110, 170, 255), sabers=None, fx='angel', fxcol=(170, 210, 255), fxcol2=(230, 240, 255), soft=(150, 190, 255)),
    'seraph_halo_wings': dict(style='angel', shape='swept', size=1.0, pal=dict(WHITE, tip=(245, 215, 120), glow=(255, 225, 120)),
                              frame=None, gem=None, sabers=GOLD, fx='angel', fxcol=(255, 225, 120), fxcol2=(255, 250, 220), soft=(255, 215, 120)),
    'dragon_wings': dict(style='angel', shape='wide', size=1.0, pal=pal((190, 255, 255), (130, 230, 245), (40, 160, 210), (20, 100, 160), (220, 255, 255), tip=(230, 255, 255), glow=(140, 255, 255)),
                         frame=((120, 230, 240), (230, 255, 255)), gem=(120, 255, 255), sabers=None, fx='storm', fxcol=(160, 255, 255), fxcol2=(220, 255, 255), soft=(60, 220, 255)),
    'galaxy_wings': dict(style='angel', shape='wide', size=1.05, pal=pal((120, 70, 210), (70, 35, 150), (32, 16, 80), (200, 160, 255), (190, 160, 255), tip=(230, 200, 255), glow=(255, 255, 255)),
                         frame=((60, 30, 120), (190, 150, 255)), gem=(220, 180, 255), sabers=None, fx='void', fxcol=(255, 255, 255), fxcol2=(180, 120, 255), soft=(140, 80, 255)),
    'phoenix_wings': dict(style='flame', shape='swept', size=1.05, pal=pal((255, 245, 170), (255, 150, 40), (200, 40, 10), (150, 30, 10), (255, 220, 120), tip=(255, 90, 20), glow=(255, 200, 80)),
                          frame=((255, 170, 50), (255, 230, 120)), gem=(255, 120, 30), sabers=None, fx='flame', fxcol=(255, 160, 40), fxcol2=(255, 230, 120), soft=(255, 120, 20)),
    'frost_wings': dict(style='crystal', shape='tall', size=1.0, pal=pal((245, 252, 255), (180, 225, 250), (100, 165, 230), (230, 248, 255), (255, 255, 255), tip=(255, 255, 255), glow=(200, 245, 255)),
                        frame=((210, 236, 252), (245, 252, 255)), gem=(160, 230, 255), sabers=None, fx='frost', fxcol=(200, 245, 255), fxcol2=(255, 255, 255), soft=(140, 210, 255)),
    'storm_crystal_wings': dict(style='crystal', shape='swept', size=1.05, pal=pal((220, 250, 255), (110, 200, 245), (30, 110, 210), (210, 245, 255), (255, 255, 255), tip=(230, 255, 255), glow=(150, 240, 255)),
                                frame=((60, 130, 210), (200, 245, 255)), gem=(150, 240, 255), sabers=(200, 245, 255), fx='storm', fxcol=(180, 245, 255), fxcol2=(255, 255, 255), soft=(80, 200, 255)),
    'frost_shard_wings': dict(style='crystal', shape='wide', size=1.0, pal=pal((250, 255, 255), (170, 205, 245), (70, 115, 200), (225, 240, 255), (255, 255, 255), tip=(255, 255, 255), glow=(220, 250, 255)),
                              frame=None, gem=None, sabers=None, fx='frost', fxcol=(220, 250, 255), fxcol2=(255, 255, 255), soft=(120, 180, 255)),
    'nature_wings': dict(style='leaf', shape='wide', size=0.95, pal=pal((140, 215, 90), (90, 175, 55), (45, 110, 35), (35, 85, 25), (60, 120, 40), tip=(255, 190, 220), glow=(255, 200, 230)),
                         frame=((120, 85, 50), (160, 120, 70)), gem=(255, 160, 210), sabers=None, fx='leaf', fxcol=(255, 190, 220), fxcol2=(150, 220, 90), soft=None),
    'verdant_spirit_wings': dict(style='leaf', shape='swept', size=1.0, pal=pal((190, 255, 160), (110, 225, 110), (50, 150, 70), (40, 110, 50), (90, 190, 100), tip=(220, 255, 200), glow=(160, 255, 170)),
                                 frame=None, gem=None, sabers=None, fx='leaf', fxcol=(160, 255, 170), fxcol2=(130, 230, 120), soft=(120, 255, 140)),
    # ---- the premium sets (back slot ids <set>_wings)
    'celestial_sovereign_wings': dict(style='angel', shape='tall', size=1.0, pal=dict(WHITE, tip=GOLD, glow=(84, 232, 255)),
                                      frame=(IVORY, GOLD), gem=(84, 232, 255), sabers=GOLD, fx='angel', fxcol=(110, 235, 255), fxcol2=(255, 225, 140), soft=(120, 220, 255)),
    'solar_emperor_wings': dict(style='flame', shape='wide', size=1.08, pal=pal((255, 252, 225), (255, 215, 90), (240, 140, 20), (200, 110, 20), (255, 240, 180), tip=(255, 170, 40), glow=(255, 230, 130)),
                                frame=((255, 248, 225), (255, 210, 80)), gem=(255, 160, 40), sabers=(255, 210, 80), fx='flame', fxcol=(255, 215, 90), fxcol2=(255, 250, 200), soft=(255, 190, 70)),
    'frost_monarch_wings': dict(style='crystal', shape='tall', size=1.08, pal=pal((248, 254, 255), (190, 228, 252), (110, 170, 235), (235, 250, 255), (255, 255, 255), tip=(255, 255, 255), glow=(160, 240, 255)),
                                frame=((225, 238, 252), (200, 225, 245)), gem=(150, 235, 255), sabers=(225, 240, 255), fx='frost', fxcol=(170, 240, 255), fxcol2=(255, 255, 255), soft=(150, 210, 255)),
    'verdant_dragon_wings': dict(style='leaf', shape='wide', size=1.05, pal=pal((170, 240, 120), (90, 190, 70), (40, 120, 45), (30, 90, 35), (70, 150, 60), tip=(240, 200, 80), glow=(150, 255, 160)),
                                 frame=((70, 150, 70), (240, 200, 80)), gem=(70, 235, 120), sabers=(240, 200, 80), fx='leaf', fxcol=(150, 255, 160), fxcol2=(120, 220, 90), soft=(110, 255, 140)),
    'thronebreaker_wings': dict(style='dark', shape='wide', size=1.15, pal=pal((70, 60, 72), (40, 32, 44), (20, 14, 22), (200, 30, 45), (120, 20, 30), tip=(255, 202, 70), glow=(255, 40, 55)),
                                cpal=pal((60, 50, 62), (36, 28, 40), (18, 12, 20), (170, 25, 40), (110, 20, 28), tip=(255, 202, 70)),
                                frame=((30, 24, 34), (255, 202, 70)), gem=(255, 35, 50), sabers=(255, 202, 70), fx='blood', fxcol=(255, 70, 60), fxcol2=(200, 0, 20), soft=(230, 20, 35)),
    # ---- mechanical (armoured blade plates with glowing energy seams)
    'mech_wings': dict(style='mech', shape='wide', size=1.05, pal=pal((150, 150, 165), (90, 90, 104), (40, 40, 48), (24, 24, 30), (60, 60, 70), tip=(255, 60, 50), glow=(255, 40, 40)),
                       frame=((70, 70, 82), (150, 150, 165)), gem=(255, 40, 40), sabers=None, fx='storm', fxcol=(255, 70, 60), fxcol2=(255, 200, 160), soft=(255, 30, 30), emissive=False),
    'golden_demon_wings': dict(style='mech', shape='tall', size=1.08, pal=pal((255, 225, 120), (220, 165, 60), (120, 80, 30), (60, 40, 20), (90, 60, 30), tip=(255, 240, 160), glow=(255, 220, 110)),
                               frame=((60, 44, 30), (255, 205, 80)), gem=(255, 220, 110), sabers=(255, 205, 80), fx='flame', fxcol=(255, 210, 90), fxcol2=(255, 250, 200), soft=(255, 190, 60), emissive=False),
    'infernal_mech_wings': dict(style='mech', shape='swept', size=1.05, pal=pal((130, 100, 90), (80, 56, 48), (36, 22, 18), (20, 12, 10), (50, 32, 26), tip=(255, 140, 30), glow=(255, 120, 20)),
                                frame=((50, 32, 26), (130, 100, 90)), gem=(255, 120, 20), sabers=None, fx='flame', fxcol=(255, 130, 30), fxcol2=(255, 220, 120), soft=(255, 90, 10), emissive=False),
    'throne_guard_wings': dict(style='mech', shape='tall', size=1.1, pal=pal((70, 64, 74), (40, 36, 44), (20, 16, 24), (238, 188, 66), (120, 90, 40), tip=(238, 188, 66), glow=(255, 40, 50)),
                               frame=((30, 24, 34), (238, 188, 66)), gem=(255, 40, 50), sabers=(238, 188, 66), fx='blood', fxcol=(255, 190, 70), fxcol2=(220, 20, 30), soft=(230, 20, 30), emissive=False),
    'void_overlord_wings': dict(style='dark', shape='swept', size=1.08, pal=pal((60, 48, 66), (34, 26, 40), (16, 10, 20), (255, 40, 55), (150, 20, 30), tip=(255, 60, 70), glow=(255, 40, 50)),
                                frame=((24, 20, 28), (200, 150, 60)), gem=(255, 40, 50), sabers=(200, 150, 60), fx='void', fxcol=(255, 60, 70), fxcol2=(120, 10, 30), soft=(230, 20, 35)),
}

# ---- membrane family (wingkit.build_membrane)
MEMBRANE = {
    'demon_lord_wings': dict(mem=(170, 18, 34), dark=(60, 6, 14), rim=(40, 4, 10), vein=(110, 10, 22), glow=(255, 70, 40), bone=(48, 26, 30), bone_rim=(28, 14, 18), claw=(235, 225, 205), spikes=(48, 26, 30), size=1.05, gem=(255, 60, 40), fx='flame', fxcol=(255, 120, 40), fxcol2=(255, 200, 90), soft=(255, 30, 20)),
    'shadow_monarch_wings': dict(mem=(40, 14, 22), dark=(14, 6, 10), rim=(200, 20, 35), vein=(90, 10, 20), glow=(255, 30, 45), bone=(26, 16, 22), bone_rim=(14, 8, 12), claw=(220, 20, 35), tears=10, size=1.05, fx='void', fxcol=(255, 40, 60), fxcol2=(60, 0, 20), soft=(200, 0, 30)),
    'bone_wings': dict(mem=(160, 24, 32), dark=(70, 8, 14), rim=(60, 6, 12), vein=(100, 10, 18), glow=None, bone=(240, 230, 210), bone_rim=(170, 160, 140), claw=(240, 230, 210), tears=6, size=1.0, fx='flame', fxcol=(255, 90, 40), fxcol2=(255, 180, 90), soft=None),
    'void_wings': dict(mem=(70, 26, 120), dark=(24, 8, 44), rim=(220, 90, 255), vein=(130, 60, 200), glow=(220, 110, 255), bone=(40, 20, 60), bone_rim=(20, 8, 34), claw=(220, 90, 255), size=1.05, gem=(220, 110, 255), fx='void', fxcol=(230, 140, 255), fxcol2=(90, 30, 160), soft=(160, 60, 255)),
    'overlord_wings': dict(mem=(70, 10, 22), dark=(24, 4, 10), rim=(238, 188, 66), vein=(120, 10, 26), glow=(255, 40, 50), bone=(30, 24, 30), bone_rim=(238, 188, 66), claw=(238, 188, 66), spikes=(238, 188, 66), size=1.1, gem=(255, 35, 50), fx='blood', fxcol=(255, 190, 70), fxcol2=(200, 0, 20), soft=(230, 20, 30)),
    'blood_demon_wings': dict(mem=(190, 10, 26), dark=(70, 0, 10), rim=(40, 0, 6), vein=(120, 0, 14), glow=(255, 30, 40), bone=(30, 10, 12), bone_rim=(16, 4, 6), claw=(50, 14, 16), spikes=(40, 10, 12), tears=4, size=1.05, fx='blood', fxcol=(255, 50, 50), fxcol2=(160, 0, 10), soft=(220, 0, 20)),
    'void_star_wings': dict(mem=(28, 20, 70), dark=(10, 6, 30), rim=(150, 120, 255), vein=(70, 50, 150), glow=(170, 150, 255), bone=(20, 14, 40), bone_rim=(150, 120, 255), claw=(200, 180, 255), size=1.08, gem=(200, 180, 255), fx='void', fxcol=(255, 255, 255), fxcol2=(150, 120, 255), soft=(90, 60, 255)),
    'bone_reaper_wings': dict(mem=(40, 28, 52), dark=(14, 8, 20), rim=(10, 5, 15), vein=(70, 50, 90), glow=(80, 255, 200), bone=(235, 225, 205), bone_rim=(150, 140, 120), claw=(235, 225, 205), tears=14, size=1.05, fx='void', fxcol=(120, 255, 210), fxcol2=(40, 120, 100), soft=(60, 255, 190)),
    'storm_dragon_wings': dict(mem=(40, 90, 170), dark=(14, 30, 70), rim=(10, 20, 50), vein=(80, 200, 255), glow=(120, 230, 255), bone=(50, 80, 140), bone_rim=(200, 230, 250), claw=(235, 240, 250), spikes=(200, 230, 250), scales=True, size=1.1, gem=(110, 230, 255), fx='storm', fxcol=(150, 240, 255), fxcol2=(255, 255, 255), soft=(60, 200, 255)),
    'blood_demon_king_wings': dict(mem=(160, 8, 24), dark=(50, 0, 8), rim=(255, 60, 60), vein=(100, 0, 12), glow=(255, 40, 40), bone=(26, 14, 16), bone_rim=(120, 20, 26), claw=(30, 10, 12), spikes=(30, 10, 12), tears=5, size=1.12, gem=(255, 35, 45), fx='blood', fxcol=(255, 60, 50), fxcol2=(150, 0, 10), soft=(220, 0, 20)),
    'abyssal_king_wings': dict(mem=(30, 90, 140), dark=(10, 30, 60), rim=(70, 235, 220), vein=(60, 200, 210), glow=(70, 235, 220), bone=(20, 50, 80), bone_rim=(70, 235, 220), claw=(200, 255, 255), scales=True, size=1.08, fingers=[(70, 17.0), (46, 24.0), (24, 27.0), (2, 26.0), (-20, 21.0)], gem=(70, 235, 220), fx='storm', fxcol=(120, 255, 240), fxcol2=(200, 255, 255), soft=(40, 200, 220)),
    'soul_reaper_wings': dict(mem=(36, 26, 52), dark=(12, 8, 18), rim=(160, 90, 255), vein=(110, 60, 200), glow=(190, 120, 255), bone=(232, 224, 208), bone_rim=(140, 130, 115), claw=(232, 224, 208), tears=12, size=1.1, gem=(190, 120, 255), fx='void', fxcol=(200, 150, 255), fxcol2=(80, 40, 140), soft=(150, 70, 255)),
}
