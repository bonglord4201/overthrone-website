# THRONEBREAKER: an AI anime shorts series

*An E-Rank nobody. A throne nobody returns from. A crown that chose him.*

**Format:** vertical 9:16, 60 seconds per episode, 9–10 shots of about 6 seconds. One voice-over narrator (the main character's inner voice) and burned-in captions.
**Tools:** generate the stills in Midjourney, Leonardo or Kling, animate them with Kling, Veo, Sora or Runway (image-to-video), then send all the clips back for the edit.

---

## 1. Keeping the characters looking the same

This is the most important part. Every series that looks "AI" fails here.

1. **Make a character sheet first.** For each character, generate ONE image with the sheet prompt below, pick the best one, and save it as the reference.
2. **Use that reference in every shot:**
   - Midjourney: `--cref <sheet image URL> --cw 100`
   - Kling: "Elements" / character reference
   - Veo or Sora: reference image upload
   - Leonardo: Character Reference
3. **Paste the character's LOCK TEXT word for word into every prompt that character is in.** Never reword it.
4. **Use the same style line every time** (see below), and the same seed where the tool allows it.
5. **Keep shots simple.** One main action per clip. Fewer moving parts means fewer weird hands and faces.
6. If a shot comes out with the wrong face or outfit, **regenerate it**. Don't keep it.

**STYLE LINE** (end every prompt with this):
> modern 2D anime, Solo-Leveling-style webtoon look, sharp cel shading, dramatic rim lighting, dark palette with crimson and gold highlights, cinematic composition, high detail, 9:16 vertical

---

## 2. Characters

### REN KUROGANE (main character)
**LOCK TEXT:**
> Ren Kurogane, 19-year-old Japanese man, lean build, messy jet-black hair with one crimson streak in the left fringe, sharp storm-grey eyes, thin scar under his right eye, black hooded jacket with crimson inner lining and gold zipper, black cargo pants, silver ring with a small red gem on his left index finger

- **Character sheet prompt:** `character reference sheet, front view, side view, back view, [REN LOCK TEXT], neutral pose, plain grey background, [STYLE LINE]`
- **Personality:** quiet, stubborn, sarcastic in his head, terrified but never runs.
- **Hook:** the weakest hunter in the city (E-Rank, "the Zero"). He takes the worst raids to pay for his little sister's hospital bills.

### THE THRONE SYSTEM (his power)
**LOCK TEXT:**
> floating translucent crimson-and-gold holographic window with sharp angular borders and gothic serif text, glowing softly

- It talks to Ren in short, cold sentences. Every screen line starts with `[THRONE]`.

### AIKO KUROGANE (his sister)
**LOCK TEXT:**
> Aiko Kurogane, 14-year-old Japanese girl, long black hair in a low side ponytail tied with a red ribbon, big grey eyes, pale skin, pastel blue hospital gown, small paper crane necklace

### HANA SEO (rival / ally, from Ep 2)
**LOCK TEXT:**
> Hana Seo, 20-year-old Korean woman, sleek silver bob haircut, ice-blue eyes, white and silver hunter armour with a high collar, a long thin katana with a blue-glowing edge, cold expression

### THE HOLLOW KING (villain)
**LOCK TEXT:**
> the Hollow King, towering skeletal knight in cracked obsidian armour, a broken black crown floating above his head, empty eye sockets burning with crimson fire, tattered black cape

---

## 3. EPISODE 1: "The Zero" (60s)

| # | Time | Image prompt (still) | Motion prompt (animate) | VO / captions | SFX |
|---|---|---|---|---|---|
| 1 | 0–4s **HOOK** | Close-up of [REN] on his knees in a dark stone dungeon, blood on his cheek, a giant shadow over him, red light | Slow push-in on his face, his eyes widen, dust falls | "They told me E-Rank hunters don't die in dungeons… they just disappear." | low boom, heartbeat |
| 2 | 4–10s | Night city skyline with a huge glowing purple gate (a portal ring) in the sky above skyscrapers | Camera tilts up to the gate, lightning crackles | "Ten years ago the gates opened. Monsters came. Hunters rose." | wind, distant thunder |
| 3 | 10–16s | Hunter association hall: [REN] holding a grey ID card stamped "E", other hunters laughing behind him | He grips the card, the laughing hunters blur | "Me? E-Rank. The weakest. They call me the Zero." | crowd laughter muffled |
| 4 | 16–22s | Hospital room at night, [AIKO] asleep in bed, [REN] sitting beside her holding her hand, a bill on the table | Gentle sway, monitor light pulses | "But Aiko's treatment doesn't pay for itself." | heart monitor beep |
| 5 | 22–28s | Raid party of 6 hunters walking into a dark cave gate, [REN] last in line carrying their bags | Tracking shot following them in | "So I take the raids nobody wants." | footsteps, echo |
| 6 | 28–35s | Inside a giant underground temple, the doors slam shut, statues with red eyes along the walls | Statue eyes ignite one by one, the party turns in panic | "Then the doors closed. And the statues… opened their eyes." | stone slam, rising drone |
| 7 | 35–42s | [REN] alone, injured, crawling toward a cracked black throne at the end of the temple, bodies of statues behind | Slow dolly toward the throne, red fog | "Everyone ran. I didn't make it out." | breathing, heartbeat |
| 8 | 42–50s | [REN]'s hand touching the throne, [THE THRONE SYSTEM] window bursting open in front of him | Window flashes open, crimson light floods his face | `[THRONE] Candidate found. Will you claim the throne? YES / NO` | glass shimmer, deep bass hit |
| 9 | 50–56s | Extreme close-up of [REN]'s grey eye reflecting the crimson window | Eye narrows, the crimson streak in his hair starts glowing | "…Yes." | silence, then a single drum |
| 10 | 56–60s **CLIFFHANGER** | Black screen with crimson text | Text flickers in | `[THRONE] Welcome, Player. Your first trial begins… now.` · "EP 2 →" | glitch, impact |

**Caption:** E-Rank to King? 👑 Ep 1 #anime #sololeveling #animeedit #aianime #webtoon #fyp

---

## 4. EPISODE 2: "Daily Quest" (60s)

| # | Time | Image prompt (still) | Motion prompt (animate) | VO / captions | SFX |
|---|---|---|---|---|---|
| 1 | 0–4s **HOOK** | [REN] waking up in his small apartment, [THE THRONE SYSTEM] window floating above his bed | He jolts upright, the window pulses | `[THRONE] Daily Quest: 100 push-ups. 10km run. Failure = penalty.` | alarm, glitch |
| 2 | 4–10s | [REN] doing push-ups on the floor, sweating, the window counting "73/100" | Fast cuts of reps, counter ticking up | "I thought the hospital drugs got to me. Then the counter kept going." | grunts, ticking |
| 3 | 10–16s | [REN] running across a rooftop at sunrise, the city behind him | Side tracking shot, he leaps a gap | "Every day it gets easier. Every day… I get faster." | wind rush, footsteps |
| 4 | 16–22s | Status window close-up: STR 12 → 18, AGI 10 → 17, title "Throne Candidate" | Numbers roll upward, gold sparks | "Hunters can't level up. But I can." | coin chime, level-up ding |
| 5 | 22–29s | Hunter hall, [HANA] (S-Rank) walking past [REN], everyone stepping aside | Slow motion, her silver hair moves, she glances at him | "Hana Seo. S-Rank. The strongest hunter in the city." | crowd hush |
| 6 | 29–35s | [HANA] stopping, her blue-glowing katana tip under [REN]'s chin | Quick draw, the blade stops an inch away | Hana: "Your mana changed overnight, Zero. What did you find in that temple?" | blade ring |
| 7 | 35–42s | [REN] smirking for the first time, his ring's red gem glowing | Push-in, the gem flares | "Nothing you'd survive." | bass hit |
| 8 | 42–50s | Night: the purple gate in the sky turning red, the city alarm lights flashing | Gate cracks, red lightning | `[THRONE] Emergency Quest: A Red Gate has opened. Enter alone.` | sirens, thunder |
| 9 | 50–56s | Silhouette of [REN] standing before the red gate, his hood up, crimson streak glowing | Slow walk forward into the light | "Alone. Of course." | footsteps, rising choir |
| 10 | 56–60s **CLIFFHANGER** | Inside the gate: [THE HOLLOW KING] on a throne of bones, looking straight at camera | His eyes ignite, the broken crown spins | Hollow King: "Another candidate… how delicious." · "EP 3 →" | deep laugh, impact |

**Caption:** He can level up. Nobody else can. 👑 Ep 2 #anime #sololeveling #aianime #animeedit #manhwa #fyp

---

## 5. Making it look good, not like AI

- **First 2 seconds decide everything.** Always open on action or a face in danger, never on scenery.
- **Shots of 5–7 seconds max.** AI motion breaks down past about 8 seconds.
- **Hide faces when the motion is big.** Use silhouettes, backs and hands for fast action, and faces only in slow close-ups.
- **Same narrator voice every episode.** ElevenLabs works: pick a deep young male voice and keep it.
- **Music:** a dark epic anime track, getting louder into the cliffhanger. I can make one like your trailer's.
- **End every episode on a System window or a villain line.** That's what makes people swipe to the next one.

---

## 6. What to send back for the edit

For each episode: shots 1–10 as separate clips (name them `ep1_01.mp4` … `ep1_10.mp4`), plus the narrator audio if you make it. I'll cut, colour-match, caption, add sound effects and music, and give you the finished 1080×1920 video.
