"""Builds Easy NPC (1.21.1, EasyNPCVersion 3) preset files for the OVERTHRONE RPG NPCs.
   python3 marketing/npc-presets/make_presets.py   -> writes *.npc.nbt next to this file
Format copied from a real export (Guildmaster Ryo) and the Easy NPC source:
  DialogData.DialogDataSet[] = {Name, Label?, Texts[{Text}], Buttons[{Name, Actions[{Type, Cmd?, ExecAsUser?}]}]}"""
import gzip, os, struct, time, uuid

OUT = os.path.dirname(os.path.abspath(__file__))

# ---- minimal NBT writer: values are (tag_id, payload) ----
def B(v): return (1, v)
def I(v): return (3, v)
def L(v): return (4, v)
def F(v): return (5, v)
def S(v): return (8, v)
def LIST(tag, items): return (9, (tag, items))
def C(d): return (10, d)
def IA(v): return (11, v)

def enc_str(s):
    b = s.encode("utf-8"); return struct.pack(">H", len(b)) + b

def enc(tag, v):
    if tag == 1: return struct.pack(">b", v)
    if tag == 3: return struct.pack(">i", v)
    if tag == 4: return struct.pack(">q", v)
    if tag == 5: return struct.pack(">f", v)
    if tag == 8: return enc_str(v)
    if tag == 9:
        et, items = v
        return struct.pack(">bi", et if items else 0, len(items)) + b"".join(enc(et, x[1]) for x in items)
    if tag == 10:
        out = b""
        for k, (t, x) in v.items():
            out += struct.pack(">b", t) + enc_str(k) + enc(t, x)
        return out + b"\x00"
    if tag == 11: return struct.pack(">i", len(v)) + b"".join(struct.pack(">i", x) for x in v)
    raise ValueError(tag)

def uuid_ints(u):
    n = u.int
    parts = [(n >> s) & 0xFFFFFFFF for s in (96, 64, 32, 0)]
    return [p - (1 << 32) if p >= 1 << 31 else p for p in parts]

# ---- dialog helpers ----
def page(name, text, buttons, default=False):
    d = {"Name": S(name), "Texts": LIST(10, [C({"Text": S(text)})])}
    if default: d["Label"] = S("default")
    if buttons: d["Buttons"] = LIST(10, [C(b) for b in buttons])
    return C(d)

def btn(label, *actions):
    return {"Name": S(label), "Actions": LIST(10, [C(a) for a in actions])}

def go(page_name): return {"Type": S("OPEN_NAMED_DIALOG"), "Cmd": S(page_name)}
def back(): return {"Type": S("OPEN_DEFAULT_DIALOG")}
def close(): return {"Type": S("CLOSE_DIALOG")}
def cmd(command): return {"Type": S("COMMAND"), "Cmd": S(command), "ExecAsUser": B(1)}

def run(label, command): return btn(label, cmd(command), close())
def to(label, page_name): return btn(label, go(page_name))
BACK = lambda: btn("<< Back", back())
BYE = lambda label="Farewell": btn(label, close())

# ---- the NPCs ----
NPCS = {
 "questmaster_orin": ("Questmaster Orin", "#55FF55", [
   page("main", "Welcome to the quest board, @initiator! The Hunter Association has 100 contracts waiting, from E-Rank errands to S-Rank legends. Finish one, claim your reward, and the next is yours. What'll it be?",
        [run("✦ Show my quest", "quest"), run("✔ Turn in my quest", "quest claim"), to("? How do quests work", "how"), run("☰ Quest board progress", "quest list")], default=True),
   page("how", "Simple, Hunter. Type /quest any time to see your contract. Slay, mine and craft out here in the RPG world - progress doesn't count anywhere else. For delivery quests, carry the items when you turn in. Every 10th quest is a Rank Trial with a special reward. Finish all 100... and the throne will know your name.",
        [run("✦ Show my quest", "quest"), BACK()]),
 ]),
 "wayfinder_kael": ("Kael the Wayfinder", "#55FF55", [
   page("main", "Ah, @initiator! Another soul washed up on these shores. Beyond this sanctuary lies the wild world: untamed, unclaimed and unforgiving. What do you seek, traveller?",
        [run("⚔ Send me into the wild", "wild"), to("? How does this world work", "guide"), run("➤ Take me back to the hub", "hub")], default=True),
   page("guide", "This world is separate from the realm you came from. Your gear here stays here. Die out there and you drop everything, so travel light and fight smart. When you're ready, I'll send you somewhere random.",
        [run("⚔ I'm ready", "wild"), BACK()]),
 ]),
 "guildmaster_ryo": ("Guildmaster Ryo", "#FF0000", [
   page("main", "So, you're @initiator. I've heard whispers about you. The Hunter Association does not care where you came from, only how strong you are. Every Hunter starts at Rank E. Few ever see S... and none have seen what lies beyond.",
        [to("✦ Tell me about the ranks", "ranks"), to("⚔ How do I get stronger?", "stronger"), BYE()], default=True),
   page("ranks", "E, D, C, B, A, S. Each rank opens new Gates, new bounties and new rewards. Above S... there is only \"???\". The ones who reached it don't talk about it. Maybe one day, you will.", [BACK()]),
   page("stronger", "Hunt monsters. Clear Gates. Master your skills. Vote for the realm each day and the crown sends you keys and coin. Power isn't given here, @initiator. It's taken.",
        [run("✦ How do I vote?", "vote"), BACK()]),
 ]),
 "blacksmith_brann": ("Brann Ironfist", "#FFAA00", [
   page("main", "HAH! @initiator, is it? Look at that sorry excuse for a blade! My forge has birthed a thousand weapons and broken half of them on fools who thought they were ready. You ready, or just loud?",
        [to("⚔ What can you make?", "craft"), to("✦ Any advice?", "advice"), BYE("Later, old man")], default=True),
   page("craft", "Bring me the ore, bring me the coin, and I'll forge you steel worth swinging. Better metal comes from deeper places, and the deadliest Gates hide the rarest of all.", [BACK()]),
   page("advice", "Never fight in armour you can't afford to lose. And never, EVER trust a merchant who smiles too much. *glares at Silas*", [BACK()]),
 ]),
 "merchant_silas": ("Silas the Merchant", "#AA00AA", [
   page("main", "Ahh, @initiator! Welcome, my favourite customer! Silks, steel, treasures from every corner of the realm. And for those with Throne Shards... ohoho, I have things you won't find anywhere else.",
        [run("➤ Take me to the market", "warp market"), to("✦ What are Throne Shards?", "shards"), BYE("Just browsing")], default=True),
   page("shards", "Throne Shards: the rarest currency in all the realm. They buy what gold cannot. Find them at overthronesmp.tebex.store. Every shard spent keeps this realm alive, friend.", [BACK()]),
 ]),
 "healer_elara": ("Sister Elara", "#55FFFF", [
   page("main", "Peace be with you, @initiator. You look weary. Many have walked out of this sanctuary... fewer have walked back in. Sit a moment before you go.",
        [to("✦ Any words of wisdom?", "wisdom"), to("☠ What happens if I die?", "death"), BYE("Thank you, Sister")], default=True),
   page("wisdom", "Eat before you fight. Light your path at night. And never chase a monster into the dark alone. The wild does not forgive the careless.", [BACK()]),
   page("death", "If you fall out there, everything you carry stays where you fell. Return quickly and you may reclaim it, if nothing else finds it first. May the light guide you home, child.", [BACK()]),
 ]),
 "royal_king": ("King Aldric", "#FFAA00", [
   page("main", "Kneel, @initiator. You stand before the throne of OVERTHRONE. Many have come to this hall seeking power. Most left with nothing. A rare few... left as legends.",
        [to("♛ How do I earn your favour?", "favour"), to("⚔ What if I want your throne?", "throne"), BYE("I take my leave")], default=True),
   page("favour", "Prove yourself, Hunter. Rise through the ranks, conquer the Gates and serve the realm. Those who honour the crown are rewarded beyond measure.", [BACK()]),
   page("throne", "*laughs* Bold. Very bold. This throne has been claimed a hundred times and defended a hundred more. Don't reach for the throne, @initiator. Overthrow it... if you can.", [BACK()]),
 ]),
 "royal_queen": ("Queen Seraphine", "#5555FF", [
   page("main", "Welcome to court, @initiator. The King speaks of power. I speak of wisdom. A realm is not ruled by the strongest blade, but by the sharpest mind.",
        [to("✦ What do you advise?", "advice"), BYE("Farewell, Your Majesty")], default=True),
   page("advice", "Choose your allies carefully, and your enemies more carefully still. Gold fades, steel breaks, but a name, @initiator? A name lasts forever. Make yours worth remembering.", [BACK()]),
 ]),
 "royal_overlord": ("The Overlord", "#AA0000", [
   page("main", "...So. @initiator crawls before me. Do you feel it? The weight of this throne. Every Hunter in this realm dreams of taking it. Every one of them... failed.",
        [to("⚔ I will take your throne", "challenge"), to("...Never mind", "flee")], default=True),
   page("challenge", "Hah. Then climb, little Hunter. Climb from E to S, and beyond. Gather your power, your allies, your legend. And when you are ready... I will be waiting.", [BYE("⚔ I'll be back")]),
   page("flee", "Wise. Run along. The weak always do.", [BYE("Leave")]),
 ]),
 "royal_knight": ("Royal Guard", "#AAAAAA", [
   page("main", "Halt, @initiator! You stand within the royal grounds. State your business, or move along.",
        [to("➤ Where can I go?", "places"), BYE("Just passing through")], default=True),
   page("places", "The Crates lie past the gates. The Throne Market sits across the courtyard. The Hunter Association awaits the brave. Choose, Hunter, and I'll see you there.",
        [run("✦ Crates", "warp crates"), run("✦ Market", "warp market"), run("⚔ Hunters", "warp hunters")]),
 ]),
 "royal_archmage": ("Archmage Veyra", "#AA00AA", [
   page("main", "Ah... @initiator. The stars told me you would come. Beyond the veil lie two realms. One of light, one of shadow. Both will test you in ways steel cannot.",
        [to("☀ Tell me about AEONIA", "aeonia"), to("☠ Tell me about NETHERFALL", "netherfall"), run("➤ Show me the realms", "warp realms")], default=True),
   page("aeonia", "AEONIA, the Realm of the Divine. Ancient temples, marble halls and celestial skies, where the gods once walked. Only the worthy may ascend, and the gods do not forgive arrogance.", [BACK()]),
   page("netherfall", "NETHERFALL, the Realm of the Dead. Volcanic wastes, ancient ruins and the endless abyss. Lost souls wander there, hungry. Many enter. Few return. Do not go unprepared, @initiator.", [BACK()]),
 ]),
}

# Ryo's custom skin that was already uploaded in-game (from the export); the others start with the default skin.
RYO_SKIN = [456948940, -74762666, -1775736367, -930515890]

def build(key, name, color, pages):
    now = int(time.time() * 1000)
    skin = {"Type": S("CUSTOM"), "UUID": IA(RYO_SKIN)} if key == "guildmaster_ryo" else {"Type": S("DEFAULT")}
    data = {
        "EasyNPCVersion": I(3),
        "id": S("easy_npc:humanoid"),
        "CustomName": S('{"text":"%s","color":"%s"}' % (name, color)),
        "SkinData": C(skin),
        "ObjectiveData": C({"ObjectiveDataSet": LIST(10, [C({"Type": S(t)}) for t in ("LOOK_AT_RESET", "LOOK_AT_PLAYER", "LOOK_AT_MOB")])}),
        "DialogData": C({"Type": S("STANDARD"), "DialogDataSet": LIST(10, pages)}),
        "PresetUUID": IA(uuid_ints(uuid.uuid5(uuid.NAMESPACE_DNS, "overthronesmp.net/npc/" + key))),
    }
    root = {
        "PresetMetadata": C({
            "version": S("1.0.0"), "modified": L(now), "created": L(now), "category": S("General"),
            "name": S(name), "entityTypeId": S("easy_npc:humanoid"), "description": S("OVERTHRONE RPG NPC"),
            "author": S("__SK1TZ__"), "variantType": S("STEVE"),
        }),
        "data": C(data),
    }
    raw = struct.pack(">b", 10) + enc_str("") + enc(10, root)
    with open(os.path.join(OUT, key + ".npc.nbt"), "wb") as f:
        f.write(gzip.compress(raw))

if __name__ == "__main__":
    for key, (name, color, pages) in NPCS.items():
        build(key, name, color, pages)
    print("built", len(NPCS))
