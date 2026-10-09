"""Shared edit timeline for the OVERTHRONE trailer: the soundtrack (make_music.py) and the video
(build_trailer.py) both read this file, so every cut, slow-mo hit and text slam lands on the beat.

150 BPM: 1 beat = 0.4 s, 1 bar = 1.6 s (12 / 48 frames at 30 fps).
"""
BPM = 150
BEAT = 60 / BPM
BAR = 4 * BEAT
FPS = 30

def bars(b): return round(b * BAR, 4)

# ---- sections (in bars)
INTRO, TITLE, HUB, BUILD, COMBAT, HERO, RPG, END, FINISH = 0, 8, 10, 22, 24, 40, 42, 52, 58
TOTAL = bars(FINISH)                       # 92.8 s

# ---- shots, in order. Each shot: (clip, source start, [(output seconds, speed), ...], options)
# speed > 1 = sped up (flyovers), speed < 1 = slow motion (frame-interpolated).
# options: crop=True zooms past the Epic Fight HUD; fade=True dissolves into the shot (intro only).
H = BAR / 2
SHOTS = [
    # intro - slow, atmospheric (0 - 12.8 s)
    ('c1', 0.5,  [(2 * BAR, 1.25)], {'fade': True}),
    ('c6', 0.5,  [(2 * BAR, 1.25)], {'fade': True}),
    ('c3', 6.0,  [(2 * BAR, 1.25)], {'fade': True}),
    ('c4', 2.5,  [(2 * BAR, 1.25)], {'fade': True}),
    # title slam (12.8 - 16.0) is a generated card, see build_trailer.py
    ('TITLE', 0, [(2 * BAR, 1.0)], {}),
    # the hub - fast flyovers (16.0 - 35.2)
    ('c1', 6.0,  [(2 * BAR, 1.6)], {}),
    ('c2', 7.0,  [(BAR, 1.6)], {}),
    ('c2', 13.0, [(BAR, 1.6)], {}),
    ('c3', 0.0,  [(2 * BAR, 1.6)], {}),
    ('c5', 4.5,  [(BAR, 1.5)], {}),
    ('c5', 10.0, [(BAR, 1.6)], {}),
    ('c4', 13.0, [(2 * BAR, 1.6)], {}),
    ('c6', 6.5,  [(2 * BAR, 1.6)], {}),
    # build-up (35.2 - 38.4)
    ('c12', 1.5, [(BAR, 0.7)], {}),
    ('c9', 8.3,  [(H, 1.0), (H, 0.5)], {}),
    # combat drop (38.4 - 64.0)
    ('c10', 13.2, [(H, 1.0), (BAR, 0.5), (H, 1.0)], {'crop': True}),
    ('c11', 12.9, [(BEAT, 1.0), (3 * BEAT, 0.5)], {}),
    ('c9', 3.7,  [(H, 1.2)], {}),
    ('c9', 6.0,  [(H, 1.0)], {}),
    ('c10', 4.5, [(H, 1.0), (H, 0.5)], {'crop': True}),
    ('c12', 13.0, [(BAR, 0.8)], {}),
    ('c10', 16.0, [(H, 1.0), (H, 0.6)], {'crop': True}),
    ('c11', 19.0, [(H, 0.6)], {}),
    ('c12', 16.2, [(H, 0.8)], {}),
    ('c10', 17.3, [(BAR, 1.0)], {'crop': True}),
    ('c11', 14.5, [(BAR, 1.0)], {}),
    ('c12', 20.0, [(H, 0.6)], {}),
    ('c9', 12.6, [(BAR, 1.0)], {}),
    ('c12', 22.0, [(H, 1.0), (H, 0.5)], {}),
    ('c10', 21.4, [(H, 1.0), (H, 0.6)], {'crop': True}),
    ('c11', 20.7, [(BAR, 1.0)], {}),
    ('c9', 21.5, [(BAR, 1.0)], {}),
    ('c10', 24.0, [(H, 0.8)], {'crop': True}),
    # hero shot (64.0 - 67.2)
    ('c12', 23.0, [(2 * BAR, 0.6)], {}),
    # the RPG world (67.2 - 83.2)
    ('c6', 15.0, [(2 * BAR, 1.4)], {}),
    ('c7', 2.5,  [(BAR, 1.4)], {}),
    ('c7', 9.5,  [(2 * BAR, 1.3)], {}),
    ('c7', 15.0, [(BAR, 1.4)], {}),
    ('c7', 19.0, [(2 * BAR, 1.5)], {}),
    ('c8', 0.0,  [(BAR, 1.2)], {}),
    ('c9', 8.4,  [(H, 1.0), (H, 0.5)], {}),
    # end card (83.2 - 92.8)
    ('END', 0, [(6 * BAR, 1.0)], {}),
]

def shot_times():
    """Start time (s) of every shot, plus every slow-motion piece start (for sword SFX)."""
    t, starts, slows = 0.0, [], []
    for clip, _, pieces, _ in SHOTS:
        starts.append(round(t, 4))
        for dur, speed in pieces:
            if speed < 1: slows.append(round(t, 4))
            t += dur
    return starts, slows, round(t, 4)

# ---- text: (start bar, length in bars, style, text, subtitle)
# style: 'soft' fades, 'slam' punches in on the beat, 'word' is a short one-word hit.
CAPTIONS = [
    (0.5, 3.0,  'soft', 'A NEW REALM AWAITS', None),
    (10.2, 1.7, 'slam', 'THE HUB', None),
    (22, 2.0,   'slam', 'MASTER THE BLADE', None),
    (25, 1.5,   'slam', 'EPIC FIGHT COMBAT', None),
    (29, 0.5,   'word', 'DODGE', None),
    (29.5, 0.5, 'word', 'DASH', None),
    (30, 0.75,  'word', 'STRIKE', None),
    (32, 1.0,   'slam', 'LEGENDARY WEAPONS', None),
    (42.2, 1.7, 'slam', 'THE RPG WORLD', 'QUESTS  ·  BOSSES  ·  LOOT'),
    (45.2, 1.7, 'slam', 'ARCADE & TRADE HALL', None),
    (49.0, 1.0, 'slam', 'CLAIM YOUR THRONE', None),
]

# ---- big hits (seconds): white flash + camera shake + impact sound
IMPACTS = [bars(TITLE), bars(COMBAT), bars(HERO), bars(RPG), bars(END)]
