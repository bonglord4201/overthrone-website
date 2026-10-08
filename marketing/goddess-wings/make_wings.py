"""Builds goddess_wings.mcfunction: big spread angel wings made of item_display feathers,
locked to the Goddess Aeonia NPC's position and facing.   python3 make_wings.py"""
import math, os
NPC = '@e[type=easy_npc:humanoid,name="Goddess Aeonia",limit=1]'
# (fan angle deg, scale, outward offset, up offset)
FEATHERS = [(-55, 1.6, 0.45, -0.35), (-30, 2.0, 0.55, -0.15), (-5, 2.4, 0.62, 0.05),
            (20, 2.6, 0.62, 0.25), (45, 2.3, 0.52, 0.45), (70, 1.8, 0.38, 0.6)]
GOLD = [(10, 1.2, 0.42, 0.05)]  # one golden accent feather per wing (glow item)
lines = ["# OVERTHRONE - Goddess Aeonia wings. Run: /function overthrone:holo/goddess_wings",
         "kill @e[type=item_display,tag=aeonia_wing]"]
def f(x): return f"{x:.3f}".rstrip("0").rstrip(".") + "f"
def feather(side, ang, sc, out, up, z, item):
    a = math.radians(ang * side)
    q = [0, 0, math.sin(a / 2), math.cos(a / 2)]
    sx = sc * side
    nbt = ("{Tags:[\"aeonia_wing\"],item:{id:\"%s\",count:1},item_display:\"fixed\",brightness:{sky:15,block:15},"
           "transformation:{left_rotation:[%s,%s,%s,%s],right_rotation:[0f,0f,0f,1f],translation:[%s,%s,%s],scale:[%s,%s,%s]}}"
           % (item, *map(f, q), f(out * side), f(up), f(z), f(sx), f(sc), f(sc)))
    return f"execute at {NPC} run summon item_display ~ ~1.35 ~ {nbt}"
for side in (1, -1):
    for i, (ang, sc, out, up) in enumerate(FEATHERS):
        lines.append(feather(side, ang, sc, out, up, -0.32 - 0.01 * i, "minecraft:feather"))
    for ang, sc, out, up in GOLD:
        lines.append(feather(side, ang, sc, out, up, -0.26, "minecraft:glow_ink_sac" if False else "minecraft:gold_nugget"))
# turn every feather to match the goddess's facing
lines.append(f"execute as @e[type=item_display,tag=aeonia_wing] at @s rotated as {NPC} run tp @s ~ ~ ~ ~ 0")
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "goddess_wings.mcfunction"), "w").write("\n".join(lines) + "\n")
print(len(lines), "lines")
