# Guide NPCs: development report

Two in-game guide NPCs built on the same Easy NPC preset system as the other OVERTHRONE NPCs.

## 1. Files changed

| File | What |
| --- | --- |
| `marketing/npc-presets/guides.py` | New. All guide text and menus, plus a checker that fails the build on a broken link, a duplicate page or a label that's too long |
| `marketing/npc-presets/make_presets.py` | `build()` accepts a styled name and a description, and builds the guides too |
| `marketing/npc-presets/guide_slr.npc.nbt`, `guide_tensura.npc.nbt` | New presets (generated) |
| `marketing/npc-skins/make_guides.py`, `slr_guide.png`, `tensura_guide.png`, `preview-guides.png` | New skins |
| `marketing/overthrone-guide-npcs.zip` | Install package: the 2 presets, 2 skins and a README |
| `marketing/overthrone-npc-presets.zip` | Now holds all 14 presets |

Nothing in the modpack, the mod configs or the progression was changed.

## 2. NPCs created

**[SLR] Solo Leveling Guide.** 35 pages: a main menu, 4 sub-menus and 18 topics.

- Main menu: ★ START HERE · Hunter → Player · Levels & Skills · Job Change · Keys & Help
- Topics:
  - Becoming a Hunter, Becoming a Player, The System
  - Leveling Up, Skills, 16 Skill Slots, Runestones
  - Job Change Quest, Igris Trial, Vessels, Shadow Monarch
  - SLR Keys (and key clashes), SLR vs Tensura, Jobs & Professions, Quick Reference

**[TENSURA] Tensura Guide.** 30 pages: a main menu, 4 sub-menus and 16 topics.

- Main menu: ★ START HERE · Abilities · Slots & Presets · Learn & Master · Keys & Help
- Topics:
  - Basics, Skills, Magic, Battlewills
  - Ability Menu, Active Slots, Presets, Ability Modes
  - Learning, Mastery, How to Use, Predator
  - Tensura Keys (and key clashes), SLR vs Tensura, Quick Reference

**How navigation works**
- Every topic page has Next ▶ (when there's more), ◀ Back, ☰ Main Menu and ✖ Close.
- Nothing is printed to chat and no commands run. The guides are purely client-side dialog screens, so any number of players can read them at once.
- Easy NPC fits at most 6 buttons on a page, so the guides use sub-menus.
- Every page fits on one screen (10 lines or fewer).

**Style**
- Names: crimson bold `[SLR]` / `[TENSURA]` followed by a gold title.
- Headings are dark crimson, because dialog text is drawn on a light panel.
- SLR skin: shadow hunter in a black coat with crimson lining, gold trim and System-blue eyes.
- Tensura skin: sage in a black and gold robe with a crimson sash, slime-blue hair and a core gem.

## 3. Where they're registered

They are Easy NPC custom presets in `config/easy_npc/preset/humanoid/`. Nothing is placed in a world automatically.

## 4. How to place them

1. Copy `presets/*.npc.nbt` from `overthrone-guide-npcs.zip` to `config/easy_npc/preset/humanoid/`.
2. Restart the server.
3. Stand where each guide should go and run:
   ```
   /easy_npc preset import_new custom <TAB → guide_slr> ~ ~ ~
   /easy_npc preset import_new custom <TAB → guide_tensura> ~ ~ ~
   ```
4. Set the skins in each NPC's Easy NPC config: Skin → Custom → add the PNG.

## 5. SLR mechanics verified

Source: the SLR source code at the 1.3.3 release commit `bc57a1d` (github.com/Efkrdnz/SLR-Minecraft-Mod, NeoForge 1.21.1).

**Keys**
- Defaults: N System, R Toggle Combat Mode, Z Skill Page 1/2, X/C/V/B quick skills (Melee, Ruler's Authority, Dash, Aura), Tab quest info.
- In Combat Mode, hotbar keys 1–8 cast the skill slots. Key 9 stays a normal hotbar slot.
- X/C/V/B only fire in Combat Mode. Z always fires.

**Slots**
- There are 16 slots: 2 pages of 8. Page 2 is slots 09–16.
- The equip flow is: N → Skills → SKILL SLOTS ("01 Not set!") → Change → SKILL LIST → Equip. X empties a slot.

**Becoming a Hunter**
- The Evaluator is in the centre of every village.
- Press and hold the gem.
- On the first evaluation you can reroll class and style as often as you like. Rank can never be rerolled.
- Classes: Assassin, Combat Mage, Fighter, Tanker, Support Mage, Ranger.

**Becoming a Player**
- The hidden Cartenon gate appears after 1–3 boss clears in D/C/B/A/S (or snow) gates. The number is random per player.
- It doesn't appear if anyone in the party already has the System.
- In the temple, a lethal hit triggers the offer.
  - Accept: you become a Player and are sent to the Overworld spawn.
  - Decline: you are killed, and the choice is permanent.

**Leveling**
- Only Players earn System XP. SLR mobs and bosses give fixed amounts; any other mob gives 1 base XP.
- Every level gives 3 Skill Points. These are spent on 5 stats, with x1, x5 or x10 per click.
- XP needed for the next level = level × 16 + 8.
- Level cap gamerule: default 150.

**Job change**
- Gamerule `soloLevelingJobChangeLevel`, default 40.
- Started from N → Quests → Job Change Quest, and only from the Overworld.
- The run: Igris, then knight kills. Gamerule `soloLevelingJobChangePoints`, default 50; points are shared with nearby party members.
- Then vessel selection.
- A failed attempt can be retried after 10 seconds.

**Vessels**
- Selectable: Ashborn, Thomas Andre, Liu Zhigang, Sillad, Baran, Rakan.
- Marked WIP (not selectable): Christopher Reed, Sung Il-Hwan, Go Gunhee.

**Shadow Monarch**
- Skills: Arise (18 blocks, 500 MP, 2.6 s), Shadow Summon, Dismiss Shadows, Shadow Command, Shadow Exchange, Shadow Manifestation.
- Storage: 20, 40 at Lv70, 100 at Lv90, 150 at Lv100, 200 at Lv120.

**Runestones**
- Right-click to learn. The stone is only used up if you actually learn something.
- They come from bosses and quest rewards. Igris drops Ruler's Authority.

**Player recovery commands:** `/slr help`, `/slr stuck`, `/slr escape`.

## 6. Tensura mechanics verified

Tensura: Reincarnated is closed source, and its jar couldn't be downloaded here. These facts come from the official Tensura wiki (Aug–Sep 2026 revisions, which cover 2.0.1.x), cross-checked against a public 1.21.1 pack that pins Tensura 2.0.1.2.

**Slots, presets and modes**
- 3 active slots per preset and 9 presets, so 27 abilities.
- Default slot keys: Z / X / C.
- Ability mode: Alt + the slot key.
- Change preset: Alt + Scroll, Alt + the preset number key, or double-click the preset number in the menu.
- In the menu: left-click a slot to equip, right-click for info, middle-click to remove.
- Search filters like `f:learned` and `f:mastered`.

**Menu key:** B (default).

**Learning and mastery**
- Learning takes 100 Learn Points.
- Each try has a 10% chance to fail: you lose 1–3 points and get Blindness, Paralysis or Insanity.
- Learning lowers Max MP: 100 for Common skills, 1,000 for Extra skills.
- Mastery points: ×3 when the ability hits, ×5 when it kills.

**Predator modes:** Predation, Stomach, Isolation and Analysis. Mimicry isn't implemented yet.

**Magic and battlewills**
- Battlewill Manuals teach one of 16 random techniques. Mastery paths are verified.
- Blank Magic Tomes teach a random Aspectual spell.

**EP:** you gain 3% of a kill's EP. Non-Majin get 2/3 as AP and 1/3 as MP; Majin get the reverse.

**Jobs+ 9.0.2** (from its source): J opens the Jobs+ menu.

## 7. Differences from the brief

**Things that work differently in the installed version**
- **SLR has 16 slots, not 8.** Keys 1–8 only cast while Combat Mode (R) is on, and Z switches between the two pages.
- **No "Accept the System at the Cartenon Gate" step.** The Cartenon gate appears by itself after gate clears. The System's offer comes when you take a lethal hit inside the temple.
- **Skill Points are stat points**, not points for buying skills.
- **Alchemist, Builder, Digger and Enchanter are from Jobs+**, not SLR.

**Things that depend on server settings**
- **Level 40 and 50 knights are gamerule defaults.** The server may differ. Both are constants at the top of `guides.py`; change them and rebuild.
- **The Job Change only starts from `minecraft:overworld`.** If the hub or survival world is a different dimension, players must go to the Overworld first.

**Things left out because they couldn't be verified**
- **Antares** (Monarch of Destruction) exists in the code, but I couldn't confirm it appears in the selection screen.
- **The Tensura Leveling addon** (1.0.12): I couldn't confirm what it changes, so the guides don't mention it.

**Key clashes found with default keys**
- R: SLR Combat Mode and Epic Fight battle mode
- N: SLR System and voice chat on/off
- Z: SLR skill page and Tensura slot 1
- X/C: SLR quick skills and Tensura slots 2/3
- B: Tensura menu, backpack and SLR Aura
- Alt: Tensura modifier and Epic Fight dodge

## 8. Test commands and checks

- `python3 marketing/npc-presets/make_presets.py` rebuilds everything and runs the link and label checks.
- Check the gamerules the text depends on:
  ```
  /gamerule soloLevelingJobChangeLevel
  /gamerule soloLevelingJobChangePoints
  /gamerule soloLevelingLevelCap
  ```
- In game: place both NPCs, open every menu, and use Next / Back / Main Menu / Close on each page. Try two players reading at the same time, and confirm nothing appears in chat.
- In Options → Controls: confirm Tensura's slot keys are Z/X/C and the menu key is B in the pack's actual `options.txt`.

## 9. Remaining work

- Confirm the server's gamerule values and the Tensura key defaults listed above, then adjust `guides.py` if needed.
- Ship an `options.txt` with the key clashes fixed. Right now the guides tell players to rebind themselves.
- The website's key-conflict table suggests moving Iron's Spell Wheel to **Z**, which also clashes with SLR and Tensura. It needs a new suggestion.
- Optional: add SLR and Tensura key tables to the website Player Guide so it matches the NPCs.
