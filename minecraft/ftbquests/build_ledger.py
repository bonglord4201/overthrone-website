"""Builds the Hunter's Ledger chapters (FTB Quests, NeoForge 1.21.1) from ledger_content.py.

    python3 minecraft/ftbquests/build_ledger.py <registries.json> <recipes.json> <existing quests folder> <out folder>

registries.json = misode/mcmeta 1.21.1-summary registries/data.min.json (official vanilla registries)
recipes.json    = PrismarineJS minecraft-data pc/1.21.1/recipes.json (crafting-table results)

Output is ONLY new chapter files. Titles and descriptions are written inline in each chapter; FTB Quests
imports them into lang/en_us.snbt by itself on load, so no existing file has to be replaced.
Rewards are Lightman's Currency coins (10 copper = 1 iron = 0.1 gold ...), scaled smoothly from a few
copper at the start to a few gold at the very end.
"""
import hashlib, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ledger_content import CHAPTERS

REG, RECIPES, EXISTING, OUT = sys.argv[1:5]
reg = json.load(open(REG))
ns = lambda xs: {"minecraft:" + x for x in xs}
ITEMS, ENTITIES, BIOMES = ns(reg["item"]), ns(reg["entity_type"]), ns(reg["worldgen/biome"])
# worldgen/structure is datapack-defined, so it is not in the registry summary; these were each checked
# against misode/mcmeta 1.21.1-data/data/minecraft/worldgen/structure/<name>.json
STRUCTS = ns("village_plains village_desert village_savanna village_taiga village_snowy mineshaft mineshaft_mesa desert_pyramid "
             "jungle_pyramid swamp_hut igloo pillager_outpost ruined_portal trail_ruins mansion shipwreck ocean_ruin_warm "
             "ocean_ruin_cold monument fortress bastion_remnant nether_fossil trial_chambers ancient_city stronghold end_city".split())
STATS, ADVS = ns(reg["custom_stat"]), ns(reg["advancement"])
POTIONS, ENCHANTS, DIMS = ns(reg["potion"]), ns(reg["enchantment"]), ns(reg["dimension"])
rec = json.load(open(RECIPES))
id2name = {i["id"]: i["name"] for i in json.load(open(os.path.join(os.path.dirname(RECIPES), "items.json")))}
CRAFTABLE = {"minecraft:" + id2name[int(k)] for k in rec}
# special (non-JSON) crafting-table recipes: stew from any flower, tipped arrows, dyed shulker boxes
CRAFTABLE |= {"minecraft:suspicious_stew", "minecraft:tipped_arrow"} | {"minecraft:%s_shulker_box" % c for c in
    "white orange magenta light_blue yellow lime pink gray light_gray cyan purple blue brown green red black".split()}

COINS = [("netherite", 100000), ("diamond", 10000), ("emerald", 1000), ("gold", 100), ("iron", 10), ("copper", 1)]

# ---------- ids that must not collide with anything already on the server
existing = set()
for root, _, files in os.walk(EXISTING):
    for f in files:
        if f.endswith(".snbt"):
            existing |= set(re.findall(r'"([0-9A-F]{16})"', open(os.path.join(root, f)).read()))
used = set()
def qid(*parts):
    salt = 0
    while True:
        v = int(hashlib.sha1(("ledger|" + "|".join(map(str, parts)) + "|" + str(salt)).encode()).hexdigest()[:16], 16) & 0x7FFFFFFFFFFFFFFF
        h = "%016X" % v
        if v > 1 and h not in used and h not in existing:
            used.add(h); return h
        salt += 1

def s(x): return '"' + x.replace("\\", "\\\\").replace('"', '\\"') + '"'
def pretty(rid):
    base = rid.split(":")[-1].replace("_", " ")
    return re.sub(r"\b\w", lambda m: m.group(0).upper(), base)

# ---------- validation
errors = []
def check(cond, msg):
    if not cond: errors.append(msg)

seen = {}
for ci, ch in enumerate(CHAPTERS):
    for qi, (kind, target, count, title) in enumerate(ch["rows"]):
        where = "%s #%d %s" % (ch["name"], qi + 1, title)
        if kind in ("have", "give", "craft"):
            check(target in ITEMS, where + ": unknown item " + target)
            if kind == "craft": check(target in CRAFTABLE, where + ": not a crafting-table recipe " + target)
        elif kind == "kill": check(target in ENTITIES, where + ": unknown entity " + target)
        elif kind == "biome": check(target in BIOMES, where + ": unknown biome " + target)
        elif kind == "struct": check(target in STRUCTS, where + ": unknown structure " + target)
        elif kind == "stat": check(target in STATS, where + ": unknown stat " + target)
        elif kind == "adv": check(target in ADVS, where + ": unknown advancement " + target)
        elif kind == "dim": check(target in DIMS, where + ": unknown dimension " + target)
        elif kind == "pot": check(target[0] in ITEMS and target[1] in POTIONS, where + ": bad potion " + str(target))
        elif kind == "book": check(target[0] in ENCHANTS, where + ": unknown enchantment " + target[0])
        elif kind == "xp": pass
        else: errors.append(where + ": unknown kind " + kind)
        key = (kind, str(target), count)
        check(key not in seen, where + ": duplicate of " + seen.get(key, ""))
        seen[key] = where
if errors:
    print("\n".join(errors)); sys.exit(1)

# ---------- rewards
TOTAL = sum(len(c["rows"]) for c in CHAPTERS)
def reward_value(gi, last_in_chapter, milestone):
    v = 5 * (100 ** (gi / (TOTAL - 1)))          # 5 copper -> 500 copper (5 gold)
    if last_in_chapter: v *= 4
    elif milestone: v *= 2.5
    mag = 10 ** max(0, len(str(int(v))) - 2)       # keep 2 significant figures
    return max(1, int(round(v / mag) * mag))
def coins(v):
    out = []
    for name, val in COINS:
        n, v = divmod(v, val)
        if n: out.append((name, n))
    return out
def coin_text(cs): return ", ".join("%d %s" % (n, name.capitalize()) for name, n in cs)

# ---------- text
LORE = {
    "have": ["The Ledger wants proof: carry {n} {item} and show it.", "A collector is asking around for {item}. Bring {n} and prove you have them.",
             "Keep {n} {item} in your pack. The clerk only needs to see them."],
    "give": ["The guild stores are low on {item}. Hand in {n}.", "A merchant has ordered {n} {item}. Deliver them to the Ledger.",
             "Supply run: {n} {item}, taken on hand-in.", "The realm needs {item}. Bring {n} and they're yours no more."],
    "craft": ["Prove your hands are skilled: craft {n} {item} yourself.", "Workshop order: {n} {item}, made by you.",
              "The guild wants {n} freshly crafted {item}."],
    "kill": ["A bounty is posted: {n} {item}.", "Reports of {item} sightings. Thin them out: {n} kills.", "Hunt down {n} {item} and claim the bounty."],
    "biome": ["Cartographers need a first-hand report from the {item}.", "Set foot in the {item} and live to tell of it.", "Explore the {item}."],
    "struct": ["Scouts mention a {item}. Find it and step inside its walls.", "Locate a {item}.", "Track down a {item}. The map is yours to fill."],
    "stat": ["Reach {n} for {item}.", "The Ledger tracks everything. Push {item} to {n}."],
    "xp": ["Gather {n} levels and spend them here.", "Experience is the true currency. Offer {n} levels."],
    "adv": ["Earn the advancement \"{title}\".", "Accomplish \"{title}\". The realm remembers."],
    "dim": ["Step into {item}.", "Cross into {item}."],
    "pot": ["Brew and carry a {item}.", "The alchemists want to see a {item} of your own making."],
    "book": ["Obtain an enchanted book of {item}.", "Bring a book of {item}, enchanted, traded or found."],
}
STAT_NAMES = {"walk_one_cm": ("distance walked", 100000, "km"), "sprint_one_cm": ("distance sprinted", 100000, "km"),
              "swim_one_cm": ("distance swum", 100000, "km"), "boat_one_cm": ("distance by boat", 100000, "km"),
              "horse_one_cm": ("distance on horseback", 100000, "km"), "aviate_one_cm": ("distance flown with elytra", 100000, "km"),
              "fly_one_cm": ("distance flown", 100000, "km"), "fall_one_cm": ("distance fallen", 100, "blocks"),
              "climb_one_cm": ("distance climbed", 100, "blocks"), "crouch_one_cm": ("distance crouched", 100, "blocks"),
              "minecart_one_cm": ("distance by minecart", 100, "blocks"), "pig_one_cm": ("distance by pig", 100, "blocks"),
              "strider_one_cm": ("distance by strider", 100, "blocks"), "walk_on_water_one_cm": ("distance walked on water", 100, "blocks"),
              "walk_under_water_one_cm": ("distance walked underwater", 100, "blocks"),
              "damage_dealt": ("damage dealt", 20, "hearts"), "damage_taken": ("damage taken", 20, "hearts"),
              "damage_blocked_by_shield": ("damage blocked by shield", 20, "hearts"), "play_time": ("time played", 72000, "hours")}
def stat_line(stat, n):
    key = stat.split(":")[1]
    if key in STAT_NAMES:
        name, div, unit = STAT_NAMES[key]
        val = n / div
        return name, ("%g %s" % (val, unit))
    return key.replace("_", " "), str(n)

STRUCT_NAMES = {"village_plains": "Plains Village", "village_desert": "Desert Village", "village_savanna": "Savanna Village",
    "village_taiga": "Taiga Village", "village_snowy": "Snowy Village", "mineshaft_mesa": "Badlands Mineshaft", "mineshaft": "Mineshaft",
    "desert_pyramid": "Desert Temple", "jungle_pyramid": "Jungle Temple", "swamp_hut": "Witch Hut", "igloo": "Igloo",
    "pillager_outpost": "Pillager Outpost", "ruined_portal": "Ruined Portal", "trail_ruins": "Trail Ruins", "mansion": "Woodland Mansion",
    "shipwreck": "Shipwreck", "ocean_ruin_warm": "Warm Ocean Ruin", "ocean_ruin_cold": "Cold Ocean Ruin", "monument": "Ocean Monument",
    "fortress": "Nether Fortress", "bastion_remnant": "Bastion Remnant", "nether_fossil": "Nether Fossil", "trial_chambers": "Trial Chamber",
    "ancient_city": "Ancient City", "stronghold": "Stronghold", "end_city": "End City"}

def describe(kind, target, n, title, seed):
    pick = lambda arr: arr[seed % len(arr)]
    if kind in ("have", "give", "craft", "kill"): item, nn = pretty(target), n
    elif kind == "biome": item, nn = pretty(target), n
    elif kind == "struct": item, nn = STRUCT_NAMES[target.split(":")[1]], n
    elif kind == "dim": item, nn = pretty(target).replace("The ", "the "), n
    elif kind == "stat": item, nn = stat_line(target, n)
    elif kind == "pot": item, nn = pretty(target[0]) + " of " + pretty(target[1]).replace("Long ", "Long ").replace("Strong ", "Strong "), 1
    elif kind == "book": item, nn = pretty(target[0]) + " " + ["", "I", "II", "III", "IV", "V"][target[1]], 1
    else: item, nn = "", n
    lore = pick(LORE[kind]).format(n=nn, item=item, title=title)
    if kind == "kill": obj = "Slay %d %s" % (n, item)
    elif kind == "give": obj = "Hand in %d %s" % (n, item)
    elif kind == "craft": obj = "Craft %d %s" % (n, item)
    elif kind == "have": obj = "Have %d %s in your inventory" % (n, item)
    elif kind == "biome": obj = "Visit the %s biome" % item
    elif kind == "struct": obj = "Find a %s" % item
    elif kind == "stat": obj = "Reach %s: %s" % (item, nn)
    elif kind == "xp": obj = "Spend %d XP levels" % n
    elif kind == "adv": obj = "Earn the advancement \"%s\"" % title
    elif kind == "dim": obj = "Enter %s" % item
    elif kind == "pot": obj = "Have a %s" % item
    elif kind == "book": obj = "Have an Enchanted Book of %s (only that enchantment)" % item
    notes = {"give": "&7The items are taken when you complete the quest.", "craft": "&7Only items you craft yourself count.",
             "xp": "&7The levels are taken when you complete the quest.", "stat": "&7Counts your total since you first joined."}
    return lore, obj, notes.get(kind)

def task_snbt(kind, target, n, t_id):
    if kind in ("have", "give", "craft"):
        extra = ", consume_items: true" if kind == "give" else ", only_from_crafting: true" if kind == "craft" else ""
        return '{ count: %dL%s, id: %s, item: { count: 1, id: %s }, type: "item" }' % (n, extra, s(t_id), s(target))
    if kind == "pot":
        return ('{ count: 1L, id: %s, item: { components: { "minecraft:potion_contents": { potion: %s } }, count: 1, id: %s }, '
                'match_components: "fuzzy", type: "item" }') % (s(t_id), s(target[1]), s(target[0]))
    if kind == "book":
        return ('{ count: 1L, id: %s, item: { components: { "minecraft:stored_enchantments": { levels: { %s: %d } } }, count: 1, '
                'id: "minecraft:enchanted_book" }, match_components: "fuzzy", type: "item" }') % (s(t_id), s(target[0]), target[1])
    if kind == "kill": return '{ entity: %s, id: %s, type: "kill", value: %dL }' % (s(target), s(t_id), n)
    if kind == "biome": return '{ biome: %s, id: %s, type: "biome" }' % (s(target), s(t_id))
    if kind == "struct": return '{ id: %s, structure: %s, type: "structure" }' % (s(t_id), s(target))
    if kind == "dim": return '{ dimension: %s, id: %s, type: "dimension" }' % (s(target), s(t_id))
    if kind == "stat": return '{ id: %s, stat: %s, type: "stat", value: %d }' % (s(t_id), s(target), n)
    if kind == "xp": return '{ id: %s, points: false, type: "xp", value: %dL }' % (s(t_id), n)
    if kind == "adv": return '{ advancement: %s, criterion: "", id: %s, type: "advancement" }' % (s(target), s(t_id))

# ---------- build
os.makedirs(OUT, exist_ok=True)
gi = 0
total_copper = 0
prev_unlock = None
summary = []
for ci, ch in enumerate(CHAPTERS):
    ch_id = qid("chapter", ci)
    rows = ch["rows"]; N = len(rows)
    blocks, first_q, unlock_q, ch_copper = [], None, None, 0
    prev = None
    for qi, (kind, target, n, title) in enumerate(rows):
        q_id = qid("quest", ci, qi)
        milestone, last = (qi + 1) % 10 == 0, qi == N - 1
        val = reward_value(gi, last, milestone); cs = coins(val)
        total_copper += val; ch_copper += val
        rewards = ["{ count: %d, id: %s, item: { count: 1, id: \"lightmanscurrency:coin_%s\" }, type: \"item\" }" % (cnt, s(qid("reward", ci, qi, name)), name)
                   for name, cnt in cs]
        lore, obj, note = describe(kind, target, n, title, qi + ci)
        desc = [lore, "", "&bObjective:&r " + obj]
        if note: desc.append(note)
        if milestone or last: desc += ["", "&6Ledger Trial! &7Bonus coin reward."]
        if last: desc += ["&6&lFinal entry of this Ledger."]
        deps = [prev] if prev else ([prev_unlock] if prev_unlock else [])
        row, col = divmod(qi, 7)
        x = (col if row % 2 == 0 else 6 - col) * 1.5
        y = row * 1.5
        fields = []
        if deps: fields.append("dependencies: [%s]" % ", ".join(s(d) for d in deps))
        fields.append("description: [%s]" % ", ".join(s(d) for d in desc))
        fields.append("id: %s" % s(q_id))
        fields.append("rewards: [\n\t\t\t\t%s\n\t\t\t]" % "\n\t\t\t\t".join(rewards))
        if milestone or last:
            fields.append('shape: "hexagon"'); fields.append("size: %sd" % ("2.0" if last else "1.4"))
        fields.append("subtitle: %s" % s("Entry %d of %d • %s" % (qi + 1, N, coin_text(cs))))
        fields.append("tasks: [%s]" % task_snbt(kind, target, n, qid("task", ci, qi)))
        fields.append("title: %s" % s(("&6&l" if (milestone or last) else "") + title))
        fields.append("x: %.1fd" % x); fields.append("y: %.1fd" % y)
        blocks.append("\t\t{\n\t\t\t" + "\n\t\t\t".join(fields) + "\n\t\t}")
        if qi == 49: unlock_q = q_id
        prev = q_id; gi += 1
    prev_unlock = unlock_q
    fname = "ledger_%02d_%s" % (ci + 1, re.sub(r"[^a-z]+", "_", ch["name"].split(":")[1].strip().lower()).strip("_"))
    text = "{\n\tdefault_hide_dependency_lines: false\n\tdefault_quest_shape: \"\"\n\tfilename: %s\n\tgroup: \"\"\n\ticon: { id: %s }\n\tid: %s\n\timages: [ ]\n\torder_index: %d\n\tquest_links: [ ]\n\tquests: [\n%s\n\t]\n\tsubtitle: [%s]\n\ttitle: %s\n}\n" % (
        s(fname), s(ch["icon"]), s(ch_id), 20 + ci, "\n".join(blocks),
        s(ch["intro"] + (" &7(Unlocks after entry 50 of the previous Ledger.)" if ci else "")), s(ch["color"] + ch["name"]))
    open(os.path.join(OUT, fname + ".snbt"), "w").write(text)
    summary.append((ch["name"], N, ch_copper))

for name, n, cop in summary: print("%-34s %3d quests  %s" % (name, n, coin_text(coins(cop))))
print("TOTAL %d quests, all rewards together = %s (%d copper)" % (TOTAL, coin_text(coins(total_copper)), total_copper))
