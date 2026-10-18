# OVERTHRONE v4 catalogue: every back cosmetic (id -> (display name, builder, palette)). Ids never change (players own them).
import wings4 as W

GOLD = (255, 205, 80); CRIMSON = (220, 20, 40); BLACK = (24, 18, 24)

BACK = {
    # ---- original set
    'demon_lord_wings': ('Demon Lord Wings', W.membrane_wing, dict(mem=(150, 12, 28), edge=(70, 0, 12), vein=(80, 0, 14), bone=(30, 14, 16), claw=(235, 225, 205), glow_vein=(255, 60, 40), soft=(255, 30, 20), fx='embers', fxcol=(255, 120, 40), spikes=(40, 20, 22))),
    'seraph_wings': ('Seraph Wings', W.feathered, dict(root=(255, 255, 255), tip=(255, 238, 200), edge=(255, 255, 255), shaft=(255, 225, 150), cov=(255, 255, 255), cov_tip=(255, 245, 220), arm=GOLD, gold=GOLD, gem=(255, 240, 140), glow=(255, 225, 120), soft=(255, 230, 150), fx='feathers')),
    'dragon_wings': ('Aqua Spirit Wings', W.feathered, dict(root=(170, 255, 255), tip=(20, 150, 210), edge=(225, 255, 255), shaft=(200, 255, 255), cov=(190, 255, 250), cov_tip=(90, 210, 230), arm=(80, 220, 240), glow=(120, 255, 255), soft=(60, 220, 255), fx='sparkles', fxcol=(170, 255, 255))),
    'shadow_monarch_wings': ('Shattered Monarch Wings', W.membrane_wing, dict(mem=(28, 10, 16), edge=(200, 20, 35), vein=(60, 0, 10), bone=(18, 10, 14), claw=(220, 20, 35), glow_vein=(255, 30, 45), holes=12, soft=(200, 0, 30), fx='souls', fxcol=(255, 40, 60), spikes=(30, 15, 20))),
    'archangel_wings': ('Archangel Wings', W.feathered, dict(root=(255, 250, 225), tip=(245, 190, 60), edge=(255, 255, 230), shaft=(255, 215, 90), cov=(255, 248, 225), cov_tip=(255, 220, 120), arm=GOLD, gold=GOLD, gem=(255, 255, 200), glow=(255, 215, 90), soft=(255, 200, 80), fx='sparkles', fxcol=(255, 230, 140), trim='full')),
    'galaxy_wings': ('Galaxy Wings', W.feathered, dict(root=(70, 30, 140), tip=(20, 10, 60), edge=(170, 120, 255), shaft=(140, 90, 230), cov=(90, 40, 170), cov_tip=(40, 20, 100), arm=(60, 30, 120), glow=(200, 140, 255), stars=(255, 255, 255), soft=(140, 80, 255), fx='stars', fxcol=(230, 210, 255))),
    'frost_wings': ('Frost Crystal Wings', W.feathered, dict(mat='crystal', root=(240, 252, 255), tip=(90, 170, 240), arm=(170, 220, 250), glow=(200, 245, 255), soft=(140, 210, 255), fx='snow', fxcol=(240, 250, 255))),
    'nature_wings': ('Nature Wings', W.feathered, dict(mat='leaf', root=(70, 175, 55), tip=(130, 210, 80), vein=(40, 110, 30), arm=(100, 70, 40), fx='petals', fxcol=(255, 190, 220))),
    'mech_wings': ('Mech Wings', W.mech_wing, dict(dark=(34, 34, 40), light=(120, 120, 135), glow=(255, 40, 40), soft=(255, 30, 30))),
    'bone_wings': ('Bone Demon Wings', W.membrane_wing, dict(mem=(150, 20, 28), edge=(70, 0, 10), vein=(90, 0, 12), bone=(240, 230, 210), claw=(240, 230, 210), glow_vein=None, holes=6, bones_style='bone', fx='embers', fxcol=(255, 90, 40))),
    'golden_demon_wings': ('Golden Demon Wings', W.mech_wing, dict(dark=(40, 30, 22), light=(255, 205, 80), glow=(255, 220, 110), gold=(255, 205, 80), soft=(255, 190, 60))),
    'phoenix_wings': ('Phoenix Wings', W.feathered, dict(root=(255, 230, 90), tip=(230, 40, 10), edge=(255, 250, 200), shaft=(255, 200, 60), cov=(255, 210, 70), cov_tip=(255, 120, 20), arm=(255, 160, 40), glow=(255, 170, 40), flame=True, soft=(255, 120, 20), fx='embers', fxcol=(255, 150, 40))),
    'void_wings': ('Void Wings', W.membrane_wing, dict(mem=(55, 18, 90), edge=(220, 90, 255), vein=(30, 5, 50), bone=(25, 10, 40), claw=(220, 90, 255), glow_vein=(220, 100, 255), stars=True, soft=(160, 60, 255), fx='souls', fxcol=(220, 120, 255))),
    'kitsune_tails': ('Nine Kitsune Tails', W.tails, dict(n=9, base=(255, 140, 50), tip=(255, 250, 240), glow=(255, 240, 200), fx=True, fxcol=(255, 200, 120))),
    # ---- the OVERTHRONE 20 set (black / crimson / gold)
    'overlord_wings': ('Overlord Wings', W.membrane_wing, dict(mem=(45, 6, 14), edge=GOLD, vein=(90, 0, 18), bone=BLACK, claw=GOLD, glow_vein=(255, 40, 50), gold=GOLD, gem=CRIMSON, dark=BLACK, soft=(230, 20, 30), fx='embers', fxcol=(255, 190, 70), spikes=GOLD)),
    'celestial_wings': ('Celestial Wings', W.feathered, dict(root=(255, 255, 255), tip=(170, 205, 255), edge=(255, 255, 255), shaft=(255, 240, 200), cov=(255, 255, 255), cov_tip=(225, 235, 255), arm=(255, 220, 120), gold=GOLD, gem=(90, 160, 255), glow=(170, 210, 255), soft=(150, 190, 255), fx='feathers')),
    'storm_crystal_wings': ('Storm Crystal Wings', W.feathered, dict(mat='crystal', root=(215, 250, 255), tip=(40, 150, 230), arm=(120, 200, 240), glow=(150, 240, 255), soft=(80, 200, 255), fx='sparkles', fxcol=(180, 240, 255))),
    'blood_demon_wings': ('Blood Demon Wings', W.membrane_wing, dict(mem=(175, 5, 20), edge=(60, 0, 8), vein=(110, 0, 12), bone=(20, 6, 8), claw=(40, 10, 12), glow_vein=(255, 20, 30), holes=4, soft=(220, 0, 20), fx='snow', fxcol=(200, 0, 20), spikes=(40, 8, 10))),
    'seraph_halo_wings': ('Seraph Halo Wings', W.feathered, dict(root=(255, 252, 240), tip=(245, 225, 170), edge=(255, 255, 255), shaft=(255, 215, 90), cov=(255, 255, 250), cov_tip=(250, 235, 190), arm=GOLD, gold=GOLD, gem=(255, 250, 200), glow=(255, 220, 110), soft=(255, 215, 120), fx='sparkles', fxcol=(255, 235, 150), halo=(255, 215, 90))),
    'void_star_wings': ('Void Star Wings', W.membrane_wing, dict(mem=(20, 14, 55), edge=(150, 120, 255), vein=(10, 5, 30), bone=(15, 10, 30), claw=(200, 180, 255), glow_vein=(160, 140, 255), stars=True, soft=(90, 60, 255), fx='stars', fxcol=(255, 255, 255))),
    'frost_shard_wings': ('Frost Shard Wings', W.feathered, dict(mat='crystal', root=(250, 255, 255), tip=(60, 110, 200), arm=(150, 200, 240), glow=(220, 250, 255), tatter=True, soft=(120, 180, 255), fx='snow', fxcol=(255, 255, 255))),
    'verdant_spirit_wings': ('Verdant Spirit Wings', W.feathered, dict(mat='leaf', root=(110, 225, 110), tip=(190, 255, 160), vein=(50, 140, 70), arm=(80, 60, 30), soft=(120, 255, 140), fx='petals', fxcol=(255, 180, 220))),
    'infernal_mech_wings': ('Infernal Mech Wings', W.mech_wing, dict(dark=(32, 18, 14), light=(110, 80, 70), glow=(255, 120, 20), gold=(70, 40, 30), soft=(255, 90, 10))),
    'bone_reaper_wings': ('Bone Reaper Wings', W.membrane_wing, dict(mem=(30, 20, 40), edge=(10, 5, 15), vein=(20, 10, 30), bone=(235, 225, 205), claw=(235, 225, 205), glow_vein=(80, 255, 200), holes=14, bones_style='bone', soft=(60, 255, 190), fx='souls', fxcol=(120, 255, 210))),
    'spirit_fox_tails': ('Spirit Fox Tails', W.tails, dict(n=5, base=(235, 245, 255), tip=(160, 210, 255), glow=(90, 190, 255), fx=True, fxcol=(120, 210, 255), soft=(80, 170, 255))),
    'throne_guard_wings': ('Throne Guard Wings', W.mech_wing, dict(dark=BLACK, light=GOLD, glow=(255, 40, 50), gold=GOLD, soft=(230, 20, 30))),
    # ---- flagship (layered seraph wings, gold blades and a rotating sigil, like the Aurion set the owner showed)
    'divine_sovereign_wings': ('Divine Sovereign Wings', W.divine, dict(root=(255, 255, 255), tip=(185, 175, 250), streak=(40, 30, 70), gold=(255, 200, 60), glow=(215, 205, 255))),
}

import heads4 as H
CRIM = (230, 25, 45)
HEADS = {
    # id: (name, slot, builder, kwargs)
    'hero_halo': ('Hero Halo', 'above_head', H.halo_basic, dict(col=(255, 200, 60), light=(255, 248, 200), dark=(170, 110, 20), bloom=(255, 220, 120), fx='sparkles')),
    'fallen_halo': ('Fallen Halo', 'above_head', H.halo_basic, dict(col=(200, 20, 35), light=(255, 120, 110), dark=(40, 10, 14), bloom=(220, 20, 30), broken=True, fx='drips', tilt=12)),
    'void_halo': ('Void Halo', 'above_head', H.halo_basic, dict(col=(170, 70, 255), light=(235, 200, 255), dark=(40, 10, 70), bloom=(160, 80, 255), sigil=(190, 110, 255), orbs=(200, 120, 255), fx='stars')),
    'crimson_crystal_halo': ('Crimson Crystal Halo', 'above_head', H.halo_basic, dict(col=(200, 150, 50), light=(255, 230, 150), dark=(90, 50, 10), bloom=(230, 30, 50), crystals=CRIM, fx='embers')),
    'radiant_double_halo': ('Radiant Double Halo', 'above_head', H.halo_basic, dict(col=(255, 200, 60), light=(255, 250, 220), dark=(170, 110, 20), bloom=(255, 230, 140), double=True, rays=True, sigil=(255, 210, 90), fx='sparkles')),
    'blood_crystal_ring': ('Blood Crystal Ring', 'above_head', H.crystal_orbit, dict(col=(210, 15, 35), n=8, y=4.5, r=8.5, tilt=(8, 0, 5))),
    'demon_sigil': ('Demon Sigil', 'above_head', H.sigil_halo, dict(col=(255, 50, 45))),
    'throne_halo': ('Throne Halo', 'above_head', H.sunburst, dict()),
    'crystal_orbit': ('Crimson Crystal Orbit', 'above_head', H.crystal_orbit, dict(col=(235, 30, 55), n=6)),
    'soul_crystals': ('Soul Crystals', 'orbit', H.crystal_orbit, dict(col=(190, 120, 255), n=3, y=-5, r=11, tilt=(0, 0, 0), slot_down=True)),
    'royal_crown': ('Royal Crown', 'helmet', H.crown, dict(style='royal', metal=(225, 165, 40), light=(255, 235, 140), dark=(130, 80, 15), gem_cols=[(230, 20, 40), (40, 140, 255), (40, 210, 100)], fx='sparkles')),
    'demon_king_crown': ('Demon King Crown', 'helmet', H.crown, dict(style='demon', metal=(45, 40, 52), light=(110, 100, 125), dark=(15, 12, 20), gem_cols=[(255, 40, 50)], tall=1.2, fx='embers')),
    'ice_crown': ('Ice Crown', 'helmet', H.crown, dict(style='ice', metal=(110, 170, 225), light=(230, 250, 255), dark=(40, 80, 140), gem_cols=[(200, 240, 255)], tall=1.3, fx='snow', points=3)),
    'shard_crown': ('Shattered Crown', 'helmet', H.crown, dict(style='shard', metal=(35, 20, 28), light=(90, 60, 75), dark=(12, 6, 10), gem_cols=[(225, 25, 45)], tall=1.0, fx='embers')),
    'void_crown': ('Void Crown', 'helmet', H.crown, dict(style='void', metal=(30, 18, 45), light=(90, 60, 130), dark=(10, 5, 18), gem_cols=[(170, 70, 255)], tall=1.2, fx='void', accent=(200, 120, 255))),
    'demon_horns': ('Demon Lord Horns', 'helmet', H.horns, dict(kind='demon', base=(30, 14, 16), tip=(12, 4, 6), glow=(255, 70, 30), fx='embers')),
    'oni_horns': ('Oni Horns', 'helmet', H.horns, dict(kind='oni', base=(245, 235, 215), tip=(200, 30, 30), glow=None)),
    'ram_horns': ('Ram Horns', 'helmet', H.horns, dict(kind='ram', base=(170, 135, 100), tip=(90, 65, 45), glow=None)),
    'blood_rune_circlet': ('Blood Rune Circlet', 'helmet', H.circlet, dict()),
}

import pets4 as PT
import pets7 as P7
import pets6 as P6
PETS = {
    # id: (name, builder, kwargs, floats). v7: ground animals walk after you (floats False -> idle/walk/run/fly/swim clips);
    # only birds and spirits float (they always play "fly"). Builders: scripts/manas/pets7.py.
    'pet_rimuru': ('Rimuru Slime', P7.slime7, dict(col=(90, 185, 255), eye=(20, 25, 60), fx='bubbles', core=(150, 230, 255)), False),
    'pet_crimson_slime': ('Crimson Slime', P7.slime7, dict(col=(215, 30, 45), eye=(255, 220, 90), crown=(255, 200, 60), glow_eyes=True, fx='embers'), False),
    'pet_kitsune': ('Kitsune', P7.fox7, dict(fur=(255, 140, 50), light=(255, 245, 230), dark=(50, 30, 30), iris=(255, 190, 40), tails=3, glow=(255, 220, 140)), False),
    'pet_spirit_fox': ('Spirit Fox', P7.fox7, dict(fur=(225, 240, 255), light=(255, 255, 255), dark=(80, 120, 170), iris=(90, 200, 255), tails=5, glow=(90, 190, 255), spirit=True, socks=(150, 190, 235), ear_tip=(90, 190, 255)), False),
    'pet_phoenix': ('Phoenix Chick', P7.phoenix7, dict(), True),
    'pet_storm_dragon': ('Baby Storm Dragon', P7.dragon7, dict(body=(70, 150, 230), belly=(225, 240, 255), wing=(50, 110, 200), horn=(235, 240, 250), glow=(120, 230, 255), iris=(120, 230, 255), fx_col=(160, 240, 255), frill=(90, 200, 255)), False),
    'pet_ember_dragon': ('Baby Ember Dragon', P7.dragon7, dict(body=(200, 50, 30), belly=(255, 200, 100), wing=(140, 30, 20), horn=(45, 32, 30), glow=(255, 150, 40), iris=(255, 210, 70), fx_col=(255, 150, 50), frill=(255, 120, 30)), False),
    'pet_shadow_wisp': ('Shadow Wisp', P7.wisp7, dict(), True),
}
