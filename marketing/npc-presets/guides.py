"""The two in-game guide NPCs: [SLR] Solo Leveling Guide and [TENSURA] Tensura Guide.
Built by make_presets.py (python3 marketing/npc-presets/make_presets.py).

Every mechanic here was checked against the installed versions before it was written:
  SLR 1.3.3 (NeoForge 1.21.1)  source: github.com/Efkrdnz/SLR-Minecraft-Mod, commit bc57a1d ("1.3.3")
  Tensura 2.0.1.x              official Tensura wiki (tensura.wiki.gg), revisions from Aug-Sep 2026
  Jobs+ 9.0.2                  source: github.com/daqem/JobsPlus, tag 9.0.2
Easy NPC shows at most 6 buttons per page and wraps text at ~32 characters, 10 lines per page
(longer text gets its own page arrows), so the guides use a main menu with sub-menus.

Server settings the text depends on. Change them here if the server's gamerules differ, then rebuild:
  /gamerule soloLevelingJobChangeLevel   (SLR default 40)
  /gamerule soloLevelingJobChangePoints  (SLR default 50)
  /gamerule soloLevelingLevelCap         (SLR default 150)"""
from make_presets import page, btn, go, back, close

JOB_CHANGE_LEVEL = 40
JOB_CHANGE_KNIGHTS = 50
LEVEL_CAP = 150

H = lambda t: "§4§l" + t + "§r\n"   # crimson heading (dialog text is drawn black on a light panel)
WARN = "§4§l"
END = "§r"


def menu(name, text, items, default=False):
    """A menu page: up to 4 topic buttons plus Main Menu (on sub-menus) and Close."""
    buttons = [btn(label, go(target)) for label, target in items]
    if not default:
        buttons.append(btn("☰ Main Menu", back()))
    buttons.append(btn("✖ Close", close()))
    assert len(buttons) <= 6, name
    return page(name, text, buttons, default=default)


def topic(name, parent, texts):
    """One topic, split over as many pages as it needs: Next / Back / Main Menu / Close."""
    pages = []
    for i, text in enumerate(texts):
        pid = name if i == 0 else "%s_%d" % (name, i + 1)
        buttons = []
        if i < len(texts) - 1:
            buttons.append(btn("Next ▶", go("%s_%d" % (name, i + 2))))
        prev = parent if i == 0 else (name if i == 1 else "%s_%d" % (name, i))
        buttons.append(btn("◀ Back", back() if prev == "main" else go(prev)))
        if prev != "main":
            buttons.append(btn("☰ Main Menu", back()))
        buttons.append(btn("✖ Close", close()))
        pages.append(page(pid, text, buttons))
    return pages


COMBINED = (H("SLR vs TENSURA")
    + "Two separate power systems with two separate bars.\n"
    + "§lSLR:§r N menu. 16 slots (2 pages of 8). R = Combat Mode, then 1-8 cast.\n"
    + "§lTensura:§r B menu. 3 slots x 9 presets, cast with Z X C.\n"
    + "A skill from one never shows up in the other.")

# --------------------------------------------------------------------------- SLR
SLR = [
    menu("main",
         H("SOLO LEVELING GUIDE") + "Welcome, @initiator. I know the path from Hunter to Monarch. "
         "Pick a topic. You can come back to me any time.",
         [("★ START HERE", "start"), ("Hunter → Player", "m_awaken"), ("Levels & Skills", "m_skills"),
          ("Job Change", "m_job"), ("Keys & Help", "m_keys")], default=True),

    menu("m_awaken", H("HUNTER → PLAYER") + "First you become a Hunter. Then the System chooses you as a Player.",
         [("Becoming a Hunter", "hunter"), ("Becoming a Player", "player"), ("The System", "system")]),
    menu("m_skills", H("LEVELS & SKILLS") + "How you grow, and how to get skills onto your bar.",
         [("Leveling Up", "level"), ("Skills", "skills"), ("16 Skill Slots", "slots"), ("Runestones", "runes")]),
    menu("m_job", H("JOB CHANGE") + "At Level %d the System offers your Job Change." % JOB_CHANGE_LEVEL,
         [("Job Change Quest", "job"), ("Igris Trial", "igris"), ("Vessels", "vessels"), ("Shadow Monarch", "shadow")]),
    menu("m_keys", H("KEYS & HELP") + "Keys, key clashes, and how SLR fits with the other mods.",
         [("SLR Keys", "keys"), ("SLR vs Tensura", "combined"), ("Jobs & Professions", "jobsplus"), ("Quick Reference", "quickref")]),

    *topic("start", "main", [
        H("NEW PLAYER - START HERE")
        + "1. Find an Evaluator in a village. Get your Hunter rank and class.\n"
        + "2. Clear gates of rank D or higher and kill the boss.\n"
        + "3. After 1-3 clears a HIDDEN DUNGEON gate opens: the Cartenon Temple.\n"
        + "4. Inside, ACCEPT the System. You are now a Player.\n"
        + "5. Press N for the System.",
        H("YOUR FIRST STEPS AS A PLAYER")
        + "• Only Players earn System XP and levels.\n"
        + "• Spend Skill Points on your stats in the System.\n"
        + "• Equip skills: N → Skills → Change.\n"
        + "• Press R for Combat Mode, then 1-8 cast your skills.\n"
        + "• Level %d: N → Quests → Job Change Quest." % JOB_CHANGE_LEVEL,
        H("WARNING")
        + "In the Cartenon Temple the System asks if you accept. " + WARN + "Never decline." + END
        + " Declining kills you, and the choice is final: the hidden gate will not come back for you.\n\n"
        + "Stuck in a dungeon? Type §l/slr stuck§r or §l/slr escape§r.",
    ]),

    *topic("hunter", "m_awaken", [
        H("BECOMING A HUNTER")
        + "Villages have an Evaluation building in their centre. Use the Evaluator and PRESS AND HOLD THE GEM.\n"
        + "It measures your mana and gives you a Hunter Rank (E to S) and a class: Assassin, Fighter, Tanker, Ranger, Combat Mage or Support Mage.",
        H("REROLLS")
        + "On your FIRST evaluation you can press REROLL CLASS (and REROLL STYLE if your class has styles) as often as you like, until you press ACCEPT RESULT.\n"
        + "Your rank can never be rerolled. Coming back later only re-checks your rank as you get stronger.",
    ]),
    *topic("player", "m_awaken", [
        H("BECOMING A PLAYER")
        + "1. Clear D, C, B, A or S gates (kill the boss).\n"
        + "2. After 1-3 clears (random per player) a HIDDEN DUNGEON gate appears.\n"
        + "3. Walk in to reach the Cartenon Temple.\n"
        + "Party: it only appears if nobody in the party has the System.",
        H("THE CARTENON TEMPLE")
        + "In the temple you can't die. When a hit would kill you, the System makes you an offer.\n"
        + "Choose ACCEPT. You are healed, sent back to the Overworld spawn and become a Player.\n"
        + WARN + "Declining kills you and is permanent." + END + " Only an admin can undo it.",
    ]),
    *topic("system", "m_awaken", [
        H("THE SYSTEM (press N)")
        + "Your level, XP bar and title are at the top. Click the title to change it.\n"
        + "ATTRIBUTES: spend Skill Points with the + buttons. The x1 button switches to x5 or x10 per click.\n"
        + "Bottom: Shop, Quests, Rewards, Party, Craft, Skills. S = Settings, X = close.",
        H("YOUR STATS")
        + "Strength: physical damage\n"
        + "Agility: movement speed\n"
        + "Perception: chance to auto-dodge\n"
        + "Vitality: max HP and armour\n"
        + "Intelligence: max MP (mana)\n\n"
        + "Before you are a Player, N only opens your skill slots, party and settings.",
    ]),

    *topic("level", "m_skills", [
        H("LEVELING UP")
        + "Only Players (people with the System) earn System XP.\n"
        + "• Kill monsters. SLR gate mobs and bosses give the most.\n"
        + "• Claim quest rewards in N → Rewards.\n"
        + "• Every level gives 3 Skill Points.\n"
        + "• Hover the level bar in the System to see the XP you still need.",
        H("MILESTONES")
        + "System advancements at Level 10, 30, 50 and 100.\n"
        + "Level %d: Job Change Quest unlocks.\n" % JOB_CHANGE_LEVEL
        + "Level 55 to 120: vessel skills unlock.\n"
        + "Level %d is the cap. Reaching it calls you back to the Cartenon Temple for the ending." % LEVEL_CAP,
    ]),
    *topic("skills", "m_skills", [
        H("SKILLS: OBTAIN, EQUIP, USE")
        + "§lObtain:§r your class gives skills, Runestones teach more, and your vessel adds its own.\n"
        + "§lEquip:§r a skill you own does nothing until it is in a slot.\n"
        + "§lUse:§r press R to turn on Combat Mode, then press the slot's number key.",
        H("HOW TO EQUIP")
        + "1. Press N, then Skills.\n"
        + "2. SKILL SLOTS opens. An empty slot says \"01  Not set!\"\n"
        + "3. Press Change on that slot.\n"
        + "4. The SKILL LIST opens. Click a skill, then Equip.\n"
        + "X next to a slot empties it.",
    ]),
    *topic("slots", "m_skills", [
        H("16 SKILL SLOTS")
        + "Slots 01-08 are page 1, slots 09-16 are page 2 (Page 2 button in SKILL SLOTS).\n"
        + "In Combat Mode (R) your hotbar keys 1-8 cast the slots on your current page. Z switches page 1 / page 2.\n"
        + "Key 9 stays a normal hotbar slot.",
        H("COMBAT MODE")
        + "Combat Mode ON: keys 1-8 cast skills and stop changing your held item. X C V B fire SLR quick skills.\n"
        + "Combat Mode OFF: keys 1-8 are your normal hotbar again.\n"
        + "These 16 slots are SLR only. Tensura has its own 3 slots. Ask the Tensura Guide.",
    ]),
    *topic("runes", "m_skills", [
        H("RUNESTONES")
        + "A Runestone teaches one SLR skill. Right-click it to learn the skill named on it.\n"
        + "If you already know it you'll see \"You already have this skill!\" and the stone is not used up.\n"
        + "They come from bosses and System quest rewards. Igris drops the one for Ruler's Authority.",
        H("SPECIAL RUNESTONES")
        + "Some stones belong to one path only. Shadow Exchange comes from Baran and only the Shadow Monarch can use it.\n"
        + "Retired runestones from older versions no longer teach anything.\n"
        + "After learning, equip the skill: N → Skills → Change.",
    ]),

    *topic("job", "m_job", [
        H("JOB CHANGE QUEST")
        + "At System Level %d you see QUEST UNLOCKED: Job Change Quest.\n" % JOB_CHANGE_LEVEL
        + "1. Stand in the Overworld. It can't be started from other dimensions.\n"
        + "2. Press N → Quests → Job Change Quest.\n"
        + "3. You are taken to the Igris arena.",
        H("BEFORE YOU GO")
        + "You must be a Player and not have a job yet.\n"
        + "Bring your best gear and fill your slots. Igris is the Blood-Red Commander and hits hard.\n"
        + "If you fail, wait 10 seconds and start it again from N → Quests.",
    ]),
    *topic("igris", "m_job", [
        H("IGRIS TRIAL")
        + "1. Defeat Blood-Red Commander Igris.\n"
        + "2. BOSS SLAIN appears. Now kill the summoned knights.\n"
        + "3. Each knight = 1 Advancement Point, shared with your party members nearby.\n"
        + "4. Reach %d points.\n" % JOB_CHANGE_KNIGHTS
        + "5. The vessel selection screen opens.",
        H("IF SOMETHING GOES WRONG")
        + "Closed the selection screen? N → Quests → Job Change Quest opens it again.\n"
        + "Died? Wait 10 seconds, then start the quest again.\n"
        + "Igris can drop the Runestone for Ruler's Authority (quick skill on C in Combat Mode).",
    ]),
    *topic("vessels", "m_job", [
        H("VESSELS")
        + "After the Igris trial you choose whose power you inherit.\n"
        + "§lRulers:§r Ashborn (Shadow Monarch), Thomas Andre (Goliath), Liu Zhigang (Sword Sovereign).\n"
        + "§lMonarchs:§r Sillad (Frost), Baran (White Flames), Rakan (Fangs).",
        H("BEFORE YOU PICK")
        + "Christopher Reed, Sung Il-Hwan and Go Gunhee are marked WIP and can't be chosen yet.\n"
        + "More vessel skills unlock from Lv55 to 120.\n"
        + "The server can cap how many players share a vessel.\n"
        + "Your choice is permanent unless an admin resets it.",
    ]),
    *topic("shadow", "m_job", [
        H("SHADOW MONARCH (Ashborn)")
        + "§lArise:§r extracts every eligible shadow within 18 blocks. 500 MP each, 2.6s cooldown. Sneak-cast to scan. Works on Igris, Beru and Kaisel.\n"
        + "§lShadow Summon / Dismiss Shadows:§r call out or send back stored shadows.\n"
        + "§lShadow Command:§r give your shadows orders.",
        H("GROWING YOUR ARMY")
        + "Storage: 20 shadows, then 40 at Lv70, 100 at Lv90, 150 at Lv100 and 200 at Lv120.\n"
        + "Shadow Exchange (Baran's runestone): place shadows and swap places with them.\n"
        + "Lv120 + 60 shadows + Shadow Exchange + Demon King's Castle floor 10 = Spiritual Body Manifestation.",
    ]),

    *topic("keys", "m_keys", [
        H("SLR KEYS (defaults)")
        + "N   System\n"
        + "R   Combat Mode on/off\n"
        + "1-8   cast skill slots (Combat Mode)\n"
        + "Z   skill page 1 / 2\n"
        + "X C V B   quick skills: Melee, Ruler's Authority, Dash, Aura (Combat Mode)\n"
        + "Tab   quest info\n"
        + "Change them: Options → Controls → Solo Leveling Keybinds.",
        H("KEY CLASHES")
        + "With default keys:\n"
        + "R is also Epic Fight's battle mode.\n"
        + "N is also voice chat on/off.\n"
        + "Z X C are also Tensura's ability slots. B is also your backpack.\n"
        + "Fix: give SLR's \"Toggle Combat Mode\" and \"Skill Page 1 / 2\" spare keys. Clashing keys show red in Controls.",
    ]),
    *topic("combined", "m_keys", [COMBINED]),
    *topic("jobsplus", "m_keys", [
        H("JOBS & PROFESSIONS")
        + "Alchemist, Builder, Digger, Enchanter and the other professions are NOT part of SLR. They come from Jobs+, a separate mod. Press J to open the Jobs+ menu.\n"
        + "In SLR your \"job\" is your Evaluator class plus the vessel you pick at the Job Change.",
    ]),
    *topic("quickref", "m_keys", [
        H("QUICK REFERENCE")
        + "Evaluator → rank + class\n"
        + "Gates D+ → hidden gate → Cartenon → ACCEPT\n"
        + "N System · R Combat Mode · 1-8 skills · Z page\n"
        + "Lv %d → Job Change → Igris → %d knights → vessel\n" % (JOB_CHANGE_LEVEL, JOB_CHANGE_KNIGHTS)
        + "Stuck? /slr stuck · /slr escape · /slr help",
    ]),
]

# --------------------------------------------------------------------------- TENSURA
TENSURA = [
    menu("main",
         H("TENSURA GUIDE") + "Greetings, @initiator. I teach the ways of skills, magic and battlewills. "
         "Pick a topic. You can come back to me any time.",
         [("★ START HERE", "start"), ("Abilities", "m_abil"), ("Slots & Presets", "m_slots"),
          ("Learn & Master", "m_learn"), ("Keys & Help", "m_keys")], default=True),

    menu("m_abil", H("ABILITIES") + "Skills, magic and battlewills all share the same ability slots.",
         [("Basics", "basics"), ("Skills", "skills"), ("Magic", "magic"), ("Battlewills", "battlewill")]),
    menu("m_slots", H("SLOTS & PRESETS") + "How to put abilities on your bar and switch between sets.",
         [("Ability Menu", "amenu"), ("Active Slots", "aslots"), ("Presets", "presets"), ("Ability Modes", "modes")]),
    menu("m_learn", H("LEARN & MASTER") + "New abilities must be learned, then mastered.",
         [("Learning", "learning"), ("Mastery", "mastery"), ("How to Use", "howto"), ("Predator", "predator")]),
    menu("m_keys", H("KEYS & HELP") + "Keys, key clashes, and how Tensura fits with SLR.",
         [("Tensura Keys", "keys"), ("SLR vs Tensura", "combined"), ("Quick Reference", "quickref")]),

    *topic("start", "main", [
        H("NEW TO TENSURA? START HERE")
        + "1. On your first join you pick a race. It changes how hard your progression is.\n"
        + "2. You start with a Unique Skill.\n"
        + "3. Kill monsters to gain EP and grow your Magicules (MP) and Aura (AP).\n"
        + "4. Open the Tensura menu (B), put abilities in your 3 slots and use them with Z X C.",
        H("SEPARATE FROM SLR")
        + "Tensura is its own power system. Its menu, slots and keys are not the SLR System (N) or the SLR 1-8 bar.\n"
        + "You can use both: Tensura on Z X C, SLR on 1-8 after pressing R for SLR Combat Mode.",
    ]),
    *topic("basics", "m_abil", [
        H("TENSURA BASICS")
        + "EP (Existence Points) is your power. Killing a mob gives you 3% of its EP by default.\n"
        + "Non-Majin races turn 2/3 of it into Aura (AP) and 1/3 into Magicules (MP). Majin races get the reverse.\n"
        + "Three kinds of ability: Skills, Magic and Battlewills.",
    ]),
    *topic("skills", "m_abil", [
        H("SKILLS")
        + "Ranks: Intrinsic (from your race), Common, Extra, Unique and Ultimate.\n"
        + "Your Unique Skill is rolled when you start.\n"
        + "Common and Extra skills are earned by doing things. Eat 100 Rotten Flesh for Corrosion, or 100 Spider Eyes for Poison.",
        H("SKILL COSTS")
        + "Learning a skill lowers your Max MP: Common skills cost 100 MP, Extra skills 1,000 MP.\n"
        + "Some bosses teach skills when defeated. The Orc Lord teaches Corrosion.\n"
        + "Magic Sense gives night vision and lets you see mobs through walls.",
    ]),
    *topic("magic", "m_abil", [
        H("MAGIC")
        + "Spells come from Magic Tomes, found in Wizard Tower chests. A blank tome teaches a random Aspectual spell.\n"
        + "Hold use for half a second to read it. After a try there is a 10-second cooldown.\n"
        + "Schools: Aspectual, Spiritual and Summoning.",
        H("SHARING SPELLS")
        + "Put an Unbound Tome in a Spellbinding Table to copy a spell you have mastered. Give the tome to a friend to read.\n"
        + "Spiritual magic and the elemental summons can't be copied.",
    ]),
    *topic("battlewill", "m_abil", [
        H("BATTLEWILLS")
        + "Aura combat techniques. Read a Battlewill Manual to learn a random one of 16.\n"
        + "Manuals have a 50% chance in mineshafts, strongholds, desert pyramids, igloos, ruined portals, mansions, trial vaults and more.\n"
        + "The manual can land on one you already know.",
        H("BATTLEWILL PATHS")
        + "Mastering some techniques starts learning the next:\n"
        + "Aura Slash → Heavy Slash\n"
        + "Magic Bullet → Maximum Magic Bullet → Death March Dance\n"
        + "Formhide → Haze\n"
        + "Ogre-sword Guillotine → Ogre-sword Cannon",
    ]),
    *topic("amenu", "m_slots", [
        H("THE ABILITY MENU")
        + "Press B (default) to open Tensura's menu.\n"
        + "Pick a learned ability, then left-click one of the 3 slots at the bottom to equip it.\n"
        + "Right-click a slot: show its info.\n"
        + "Middle-click a slot: remove it.",
        H("SEARCH FILTERS")
        + "Type these in the search bar:\n"
        + "f:learned   f:learning\n"
        + "f:mastered   f:unmastered\n"
        + "f:active   f:passive   f:toggleable\n"
        + "f:oncooldown   f:offcooldown\n"
        + "B is also your backpack key. If B opens your backpack, set a key in Controls.",
    ]),
    *topic("aslots", "m_slots", [
        H("ACTIVE ABILITY SLOTS")
        + "Each preset has 3 active slots. The slot keys are Z, X and C by default (Options → Controls → Tensura).\n"
        + "Press a slot key to use what's in it. Some abilities must be held.\n"
        + "These are NOT the SLR 1-8 slots.",
    ]),
    *topic("presets", "m_slots", [
        H("PRESETS")
        + "You have 9 presets × 3 slots = 27 abilities ready to go.\n"
        + "Switch preset: Alt + Scroll Wheel, or Alt + the preset's number key.\n"
        + "In the menu, double-click a preset number to switch to it.\n"
        + "Note: Left Alt is also Epic Fight's dodge.",
    ]),
    *topic("modes", "m_slots", [
        H("ABILITY MODES")
        + "Many abilities have more than one mode. Press Alt + that ability's slot key to switch.\n"
        + "Example: Predator in slot 3 → Alt + C.\n"
        + "Some modes only unlock once the ability is mastered.",
    ]),
    *topic("learning", "m_learn", [
        H("LEARNING (Learn Points)")
        + "Abilities you haven't learned show in grey. Equip one and use it. Each use gives Learn Points. At 100 you learn it.\n"
        + "Hover its progress bar in the menu to see your points.",
        H("FAILED TRIES")
        + "10% of tries fail. You lose 1-3 points and get Blindness, Paralysis or Insanity, and no message appears.\n"
        + "Sage, Great Sage, Mathematician and Cook speed learning up, and they stack.",
    ]),
    *topic("mastery", "m_learn", [
        H("MASTERY")
        + "Keep using an ability to master it. There's no fail chance, but it needs more points.\n"
        + "Hitting a target gives 3x points, a kill 5x.\n"
        + "Full mastery unlocks extra modes and bonuses.",
        H("MASTERY TIPS")
        + "Sage, Great Sage, Mathematician, Fighter and Cook speed mastery up.\n"
        + "Mastering 20 magics or battlewills grants Sage.\n"
        + "Search f:unmastered in the menu to see what's left.",
    ]),
    *topic("howto", "m_learn", [
        H("HOW TO USE ABILITIES")
        + "Active (press): tap the slot key.\n"
        + "Active (hold): hold the slot key.\n"
        + "Passive in slot: works while equipped.\n"
        + "Toggle: tick the box next to it in the menu.\n"
        + "True passive: always on.\n"
        + "Alt + slot key: change mode.",
    ]),
    *topic("predator", "m_learn", [
        H("PREDATOR")
        + "A Unique Skill. Switch modes with Alt + its slot key.\n"
        + "§lPredation:§r a biting mist. 10% chance to steal a skill from what it touches, and all of them if it kills. Shift-use toggles block eating.\n"
        + "§lStomach:§r 7-row storage that stacks to 128.",
        H("PREDATOR (2)")
        + "§lIsolation:§r eat your held item for MP, or cleanse bad effects.\n"
        + "§lAnalysis:§r opens the analysis screen.\n"
        + "Mimicry isn't implemented yet.\n"
        + "With mastery, the mist can eat projectiles and copy magic.",
    ]),
    *topic("keys", "m_keys", [
        H("TENSURA KEYS (defaults)")
        + "B   ability menu\n"
        + "Z X C   ability slots 1-3\n"
        + "Alt + slot key   change mode\n"
        + "Alt + scroll / Alt + number   change preset\n"
        + "Check them: Options → Controls → Tensura.",
        H("KEY CLASHES")
        + "With default keys:\n"
        + "Z also flips SLR skill pages.\n"
        + "X and C also fire SLR quick skills while SLR Combat Mode is on.\n"
        + "B is also your backpack. Left Alt is also Epic Fight's dodge.\n"
        + "Fix: move the clashing keys in Controls. Clashes show red.",
    ]),
    *topic("combined", "m_keys", [COMBINED]),
    *topic("quickref", "m_keys", [
        H("QUICK REFERENCE")
        + "Menu: B · Slots: Z X C\n"
        + "Modes: Alt + slot key\n"
        + "Presets: Alt + scroll (9 × 3)\n"
        + "Learn: use it until 100 points\n"
        + "Master: keep using it. Hits 3x, kills 5x\n"
        + "Grey = not learned yet",
    ]),
]

def _check(pages):
    """Every OPEN_NAMED_DIALOG target must exist, names must be unique and short."""
    names = [p[1]["Name"][1] for p in pages]
    assert len(names) == len(set(names)), "duplicate page names"
    for p in pages:
        assert len(p[1]["Name"][1]) <= 32
        for b in p[1].get("Buttons", (9, (10, [])))[1][1]:
            assert len(b[1]["Name"][1]) <= 20, b[1]["Name"][1]
            for a in b[1]["Actions"][1][1]:
                if a[1]["Type"][1] == "OPEN_NAMED_DIALOG":
                    assert a[1]["Cmd"][1] in names, a[1]["Cmd"][1]
    return pages

GUIDES = {
    "guide_slr": ("[SLR] Solo Leveling Guide",
                  '{"text":"","extra":[{"text":"[SLR] ","color":"#C1121F","bold":true},{"text":"Solo Leveling Guide","color":"#E0B13E"}]}',
                  "OVERTHRONE guide: Solo Leveling Reawakening (SLR 1.3.3)", _check(SLR)),
    "guide_tensura": ("[TENSURA] Tensura Guide",
                      '{"text":"","extra":[{"text":"[TENSURA] ","color":"#C1121F","bold":true},{"text":"Tensura Guide","color":"#E0B13E"}]}',
                      "OVERTHRONE guide: Tensura: Reincarnated abilities", _check(TENSURA)),
}
