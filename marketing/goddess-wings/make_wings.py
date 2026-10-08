"""Builds goddess_wings.mcfunction: big spread angel wings made of item_display feathers,
locked to the Goddess Aeonia NPC's position and facing.   python3 make_wings.py"""
import math, os
NPC = '@e[type=easy_npc:humanoid,name="Goddess Aeonia",limit=1]'
# Each feather: (direction it points, deg from horizontal; scale; height on the back)
# Long primaries point up-and-out, shorter ones sweep outward and down like a real wing.
FEATHERS = [(58, 2.0, 0.22), (40, 2.6, 0.18), (24, 2.8, 0.12), (8, 2.7, 0.06),
            (-8, 2.4, 0.0), (-24, 2.0, -0.06), (-40, 1.6, -0.12)]

def f(x): return f"{x:.3f}".rstrip("0").rstrip(".") + "f"

def feather(side, ang, sc, out, up, z):
    a = math.radians(ang * side)
    q = [0, 0, math.sin(a / 2), math.cos(a / 2)]
    nbt = ("{Tags:[\"aeonia_wing\"],item:{id:\"minecraft:feather\",count:1},item_display:\"fixed\",brightness:{sky:15,block:15},"
           "transformation:{left_rotation:[%s,%s,%s,%s],right_rotation:[0f,0f,0f,1f],translation:[%s,%s,%s],scale:[%s,%s,%s]}}"
           % (*map(f, q), f(out * side), f(up), f(z), f(sc * side), f(sc), f(sc)))
    return f"execute at {NPC} run summon item_display ~ ~1.35 ~ {nbt}"

lines = ["# OVERTHRONE - Goddess Aeonia wings. Run: /function overthrone:holo/goddess_wings",
         "kill @e[type=item_display,tag=aeonia_wing]"]
for side in (1, -1):
    for i, (theta, sc, base_y) in enumerate(FEATHERS):
        reach = 0.17 * sc   # push each feather out so its quill sits at the shoulder blade
        out = 0.22 + reach * math.cos(math.radians(theta))
        up = base_y + reach * math.sin(math.radians(theta))
        lines.append(feather(side, theta - 45, sc, out, up, -0.30 - 0.012 * i))
# turn every feather to match the goddess's facing
lines.append(f"execute as @e[type=item_display,tag=aeonia_wing] at @s rotated as {NPC} run tp @s ~ ~ ~ ~ 0")
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "goddess_wings.mcfunction"), "w").write("\n".join(lines) + "\n")
print(len(lines), "lines")
