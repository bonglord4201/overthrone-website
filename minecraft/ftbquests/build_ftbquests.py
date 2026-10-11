"""Builds FTB Quests (data version 13, NeoForge 1.21.1) chapter files for the OVERTHRONE 100-quest board.

    python3 minecraft/ftbquests/build_ftbquests.py <existing quests folder> <output folder>

Keeps everything already in the server's config/ftbquests/quests folder (Getting Started chapter,
crate reward tables, settings) and adds 5 rank chapters. Money uses the server's existing
custom-reward tags ("ss_money_<amount>"), exactly like the dev's Getting Started quests.
"""
import hashlib, json, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC, OUT = sys.argv[1], sys.argv[2]
data = json.load(open(os.path.join(HERE, "quests.json")))
QUESTS, CHAPTERS = data["quests"], data["chapters"]

# Crate reward tables that already exist on the server (reward_tables/*.snbt)
CRATES = {"common": "5E0DDFCE0735C9C9", "rare": "1DAD43C5864B214D", "legendary": "4CF008D4AA149717"}
def table_id(hexid):
    return int(hexid, 16)

# "Mine X" quests become "collect the drop" tasks (FTB Quests tracks items, not broken blocks)
MINE_TO_ITEM = {
    "#minecraft:coal_ores": ("minecraft:coal", 1), "#minecraft:iron_ores": ("minecraft:raw_iron", 1),
    "#minecraft:copper_ores": ("minecraft:raw_copper", 2), "#minecraft:gold_ores": ("minecraft:raw_gold", 1),
    "#minecraft:lapis_ores": ("minecraft:lapis_lazuli", 4), "#minecraft:redstone_ores": ("minecraft:redstone", 4),
    "#minecraft:diamond_ores": ("minecraft:diamond", 1), "#minecraft:emerald_ores": ("minecraft:emerald", 1),
    "minecraft:amethyst_cluster": ("minecraft:amethyst_shard", 2),
}
TAG_TO_ITEM = {"#minecraft:logs": "minecraft:oak_log"}

# Level XP per quest = the quest's vanilla XP-level reward x this, by rank (E, D, C, B, S).
# Must match LEVEL_XP_MULT in kubejs/server_scripts/overthrone_quests.js. All 100 quests ~ level 255.
LEVEL_XP_MULT = [100, 200, 350, 550, 800]

used = set()
def qid(*parts):
    """Stable 16-hex-digit FTB id from a name (same input -> same id, so re-running never breaks saves)."""
    salt = 0
    while True:
        v = int(hashlib.sha1(("overthrone|" + "|".join(map(str, parts)) + "|" + str(salt)).encode()).hexdigest()[:16], 16)
        # FTB Quests reads ids with Long.parseLong(hex), so they must fit a signed long (first digit 0-7)
        h = "%016X" % (v & 0x7FFFFFFFFFFFFFFF)
        if h not in used and int(h, 16) > 1:
            used.add(h); return h
        salt += 1

def snbt_str(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'

def item_snbt(give):
    """'minecraft:x[enchantments={levels:{...}}]' -> FTB item compound with 1.21 components."""
    m = re.match(r"^([a-z0-9_.-]+:[a-z0-9_/.-]+)(?:\[(.*)\])?$", give)
    item_id, comps = m.group(1), m.group(2)
    if not comps:
        return "{ count: 1, id: %s }" % snbt_str(item_id)
    out = []
    for key in ("enchantments", "stored_enchantments"):
        mm = re.search(key + r"=\{levels:\{([^}]*)\}\}", comps)
        if mm: out.append('"minecraft:%s": { levels: { %s } }' % (key, mm.group(1)))
    mm = re.search(r'potion_contents=\{potion:"([^"]+)"\}', comps)
    if mm: out.append('"minecraft:potion_contents": { potion: "%s" }' % mm.group(1))
    mm = re.search(r"custom_name='(.*?)'(?:,|$)", comps)
    if mm: out.append('"minecraft:custom_name": %s' % snbt_str(mm.group(1)))
    return "{ components: { %s }, count: 1, id: %s }" % (", ".join(out), snbt_str(item_id))

def pretty(item_id):
    base = item_id.split("[")[0].replace("#", "").split(":")[-1].replace("_", " ")
    return re.sub(r"\b\w", lambda m: m.group(0).upper(), base)

CRATE_FOR = {}  # quest index -> crate
for i, q in enumerate(QUESTS):
    if q.get("milestone"):
        CRATE_FOR[i] = "common" if i < 20 else "rare" if i < 60 else "legendary"

lang = {}
chapter_files = {}
prev_quest = None
for ci, ch in enumerate(CHAPTERS):
    first = ch["from"] - 1
    last = CHAPTERS[ci + 1]["from"] - 2 if ci + 1 < len(CHAPTERS) else len(QUESTS) - 1
    ch_id = qid("chapter", ci)
    fname = "overthrone_%d_%s" % (ci + 1, ["e_rank", "d_rank", "c_rank", "b_rank", "s_rank"][ci])
    lang["chapter.%s.title" % ch_id] = ch["color"].replace("§", "&") + ch["name"]
    lang["chapter.%s.chapter_subtitle" % ch_id] = ["Quests %d-%d of the Hunter Association" % (first + 1, last + 1)]
    quest_blocks = []
    for n, i in enumerate(range(first, last + 1)):
        q = QUESTS[i]
        q_id = qid("quest", i)
        row, col = divmod(n, 5)
        x = (col if row % 2 == 0 else 4 - col) * 2.0     # snake path, 5 per row
        y = row * 2.0
        # ---- task
        t_id = qid("task", i)
        target, count, kind = q["target"], q["count"], q["type"]
        if kind == "kill":
            task = "{ entity: %s, id: %s, type: \"kill\", value: %dL }" % (snbt_str(target), snbt_str(t_id), count)
            objective = "Slay %d %s" % (count, pretty(target))
        else:
            if kind == "mine":
                item, mult = MINE_TO_ITEM[target]
                count = count * mult
                extra = ""
                objective = "Mine and collect %d %s" % (count, pretty(item))
            else:
                item = TAG_TO_ITEM.get(target, target)
                extra = ", only_from_crafting: true" if kind == "craft" else ", consume_items: true" if kind == "deliver" else ""
                objective = ("Craft %d %s" if kind == "craft" else "Hand in %d %s") % (count, pretty(item))
            task = "{ count: %dL%s, id: %s, item: { count: 1, id: %s }, type: \"item\" }" % (count, extra, snbt_str(t_id), snbt_str(item))
        # ---- rewards
        rewards = []
        r = q["rewards"]
        for j, it in enumerate(r.get("items", [])):
            rewards.append("{ %sid: %s, item: %s, type: \"item\" }" % (
                ("count: %d, " % it[1]) if it[1] > 1 else "", snbt_str(qid("reward", i, "item", j)), item_snbt(it[0])))
        if r.get("xp"):
            rewards.append("{ id: %s, type: \"xp_levels\", xp_levels: %d }" % (snbt_str(qid("reward", i, "xp")), r["xp"]))
            # OVERTHRONE level XP (leveling.js): quests are the main way to level up
            lx = r["xp"] * LEVEL_XP_MULT[min(4, i // 20)]
            l_id = qid("reward", i, "levelxp")
            # title is inline so the server's lang file never has to be replaced (FTB Quests imports it on load)
            rewards.append("{ command: \"/level xp give {p} %d\", elevate_perms: true, id: %s, silent: true, title: \"%s Level XP\", type: \"command\" }" % (lx, snbt_str(l_id), "{:,}".format(lx)))
        if i in CRATE_FOR:
            crate = CRATE_FOR[i]
            rewards.append("{ id: %s, table_id: %dL, type: \"random\" }" % (snbt_str(qid("reward", i, "crate")), table_id(CRATES[crate])))
        if r.get("money"):
            m_id = qid("reward", i, "money")
            rewards.append("{ id: %s, tags: [\"ss_money_%d\"], type: \"custom\" }" % (snbt_str(m_id), r["money"]))
            lang["reward.%s.title" % m_id] = "{:,} coins".format(r["money"])
        # ---- quest
        fields = []
        if prev_quest: fields.append("dependencies: [%s]" % snbt_str(prev_quest))
        fields.append("id: %s" % snbt_str(q_id))
        fields.append("rewards: [\n\t\t\t\t%s\n\t\t\t]" % "\n\t\t\t\t".join(rewards))
        if q.get("milestone"):
            fields.append("shape: \"hexagon\"")
            fields.append("size: 1.5d")
        fields.append("tasks: [%s]" % task)
        fields.append("x: %.1fd" % x)
        fields.append("y: %.1fd" % y)
        quest_blocks.append("\t\t{\n\t\t\t" + "\n\t\t\t".join(fields) + "\n\t\t}")
        title = ("&6&l" if q.get("milestone") else "") + q["title"]
        lang["quest.%s.title" % q_id] = title
        lang["quest.%s.quest_subtitle" % q_id] = "Quest %d of 100" % (i + 1)
        desc = [q["lore"], "", "&bObjective:&r " + objective]
        if kind == "deliver": desc.append("&7The items are taken when you complete the quest.")
        if kind == "craft": desc.append("&7Only items you craft yourself count.")
        if q.get("milestone"): desc += ["", "&6Rank Trial! &7Bonus " + CRATE_FOR[i].capitalize() + " Crate reward."]
        if q.get("final"): desc += ["", "&6&lComplete this to earn the title of OVERTHRONE."]
        lang["quest.%s.quest_desc" % q_id] = desc
        prev_quest = q_id
    icon = ["minecraft:wooden_sword", "minecraft:iron_sword", "minecraft:diamond_sword", "minecraft:netherite_sword", "minecraft:nether_star"][ci]
    chapter_files[fname] = """{
\tdefault_hide_dependency_lines: false
\tdefault_quest_shape: ""
\tfilename: "%s"
\tgroup: ""
\ticon: {
\t\tid: "%s"
\t}
\tid: "%s"
\timages: [ ]
\torder_index: %d
\tquest_links: [ ]
\tquests: [
%s
\t]
}
""" % (fname, icon, ch_id, ci + 1, "\n".join(quest_blocks))

# ---- write output: copy the server's folder, add chapters, merge lang
if os.path.exists(OUT): shutil.rmtree(OUT)
shutil.copytree(SRC, OUT, ignore=shutil.ignore_patterns("*.tar.gz", "*.zip"))
for fname, text in chapter_files.items():
    open(os.path.join(OUT, "chapters", fname + ".snbt"), "w").write(text)
lang_path = os.path.join(OUT, "lang", "en_us.snbt")
existing = open(lang_path).read().rstrip()
assert existing.endswith("}")
lines = []
for k, v in lang.items():
    if isinstance(v, list):
        lines.append("\t%s: [%s]" % (snbt_str(k), ", ".join(snbt_str(x) for x in v)))
    else:
        lines.append("\t%s: %s" % (snbt_str(k), snbt_str(v)))
open(lang_path, "w").write(existing[:-1].rstrip() + "\n" + "\n".join(lines) + "\n}\n")
print("chapters:", len(chapter_files), "quests:", sum(t.count("type: \"kill\"") + t.count("type: \"item\" }") for t in chapter_files.values()), "lang entries:", len(lang))
