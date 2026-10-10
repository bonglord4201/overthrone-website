"""THRONEBREAKER Episode 2: "Daily Quest".  python3 ep2.py out_video.mp4 [preview_seconds...]"""
import sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from art import *
from scenes import *
import render

BW, BH = int(W * 1.18), int(H * 1.18)
emb_gold = Embers(70, GOLD, 21, rise=160)
emb_red = Embers(90, (255, 60, 60), 23, rise=140)
HANA_DRAWN = dict(HANA, accents=[eyes(ICE)])          # Hana with the katana drawn separately (held out level)

# ---------------------------------------------------------------- S1 hook: he wakes up to a System window
def plate_room():
    a = vgrad(BW, BH, [(0, hx('080a14')), (1, hx('10121c'))])
    img = to_img(a); d = ImageDraw.Draw(img)
    wx0, wy0, wx1, wy1 = int(BW * 0.58), int(BH * 0.16), int(BW * 0.92), int(BH * 0.40)
    win = to_img(vgrad(wx1 - wx0, wy1 - wy0, [(0, hx('1a1840')), (1, hx('6a3a5a'))]))   # pre-dawn sky
    sk = skyline(wx1 - wx0, wy1 - wy0, wy1 - wy0, 31, (12, 10, 22), (255, 210, 140), 0.8, 0.3)
    win.paste(sk, (0, 0), sk); img.paste(win, (wx0, wy0))
    d.rectangle([wx0, wy0, wx1, wy1], outline=(28, 30, 44), width=18)
    d.line([((wx0 + wx1) // 2, wy0), ((wx0 + wx1) // 2, wy1)], fill=(28, 30, 44), width=12)
    for k in range(5):   # posters, a shelf
        d.rectangle([int(BW * 0.08) + k * 70, int(BH * 0.30), int(BW * 0.08) + k * 70 + 50, int(BH * 0.36)], fill=(22, 22, 34))
    d.rectangle([int(BW * 0.06), int(BH * 0.37), int(BW * 0.45), int(BH * 0.38)], fill=(30, 30, 42))
    by = int(BH * 0.74)
    d.rectangle([int(BW * 0.04), by - 30, int(BW * 0.80), by + 40], fill=(24, 24, 36))      # bed
    d.rectangle([int(BW * 0.04), by - 150, int(BW * 0.08), by + 230], fill=(24, 24, 36))
    d.rectangle([0, int(BH * 0.86), BW, BH], fill=(14, 14, 22))                              # floor
    return img
P_ROOM = plate_room()

def s1(sec, u, fi):
    up = sec > 1.5
    a = camera(P_ROOM, u, 1.0, 1.08, (0.42, 0.55), (0.42, 0.50), shake=12 if 1.5 < sec < 1.8 else 0, fi=fi)
    pulse = 0.5 + 0.5 * math.sin(sec * 5)
    a = add(a, radial(W, H, W * 0.5, H * 0.30, 900, (150, 20, 40), 1.6) * (0.6 + 0.4 * pulse))
    by = int(H * 0.74)
    if not up:
        g, x0, y0 = draw_char(REN, lying(), int(W * 0.38), by - 20, scale=1.15, rim_dir=(0, -1), rim_color=(255, 90, 100), t=sec)
    else:
        g, x0, y0 = draw_char(REN, sit(), int(W * 0.30), by + 230, scale=1.15, rim_dir=(0, -1), rim_color=(255, 90, 100), t=sec)
    a = over(a, g, x0, y0)
    p = clamp((sec - 0.3) / 0.3)
    win = system_window('[ DAILY QUEST ]', [('100 Push-ups', None), ('10 km Run', None), ('Failure = PENALTY', CRIMSON)],
                        w=800, progress=clamp((sec - 0.5) / 1.6))
    sc = 0.7 + 0.3 * ease_out(p)
    win = win.resize((int(win.width * sc), int(win.height * sc)))
    wx, wy = (W - win.width) // 2, int(H * 0.27 - win.height / 2)
    a = over(a, win, wx, wy, alpha=p); a = glow_at(a, win, wx, wy, 40, 0.5 * p * (0.7 + 0.3 * pulse))
    return a

# ---------------------------------------------------------------- S2 push-ups, the counter keeps going
def s2(sec, u, fi):
    a = camera(P_ROOM, 0.5, 1.5, 1.6, (0.5, 0.80), fi=fi)
    a = a * 0.75
    rep = sec * 4.5
    y = 0.5 - 0.5 * math.cos(rep * 2 * math.pi)
    g, x0, y0 = draw_char(REN, pushup(y), int(W * 0.48), int(H * 0.80), scale=1.15, rim_dir=(0, -1), rim_color=(255, 90, 100), t=sec)
    a = over(a, g, x0, y0)
    n = min(100, 73 + int(27 * clamp(sec / 5.0)))
    done = n >= 100
    win = system_window('[ DAILY QUEST ]', [(f'Push-ups   {n} / 100', GOLD if done else None), ('Run   0 / 10 km', None)], w=760)
    a = over(a, win, (W - win.width) // 2, 200)
    if done:
        t = Image.new('RGBA', (W, 200), (0, 0, 0, 0))
        ImageDraw.Draw(t).text((W / 2, 100), 'COMPLETE', font=font(CINZEL, 96), fill=GOLD + (255,), anchor='mm')
        a = over(a, t, 0, 640); a = glow_at(a, t, 0, 640, 30, 0.8)
    return a

# ---------------------------------------------------------------- S3 rooftop run at sunrise
SKY = to_img(stars(vgrad(W, H, [(0, hx('1b1640')), (0.35, hx('6a2a5a')), (0.55, hx('e0704a')), (0.62, hx('ffc46a')), (1, hx('2a1420'))]), 80, 2, 0.25))
SKY = to_img(add(arr(SKY), radial(W, H, W * 0.62, H * 0.60, 520, (255, 220, 140), 1.3)))
CITY_FAR = skyline(W * 3, H, int(H * 0.72), 41, (60, 30, 60), (255, 200, 140), 0.4, 0.8)
CITY_MID = skyline(W * 3, H, int(H * 0.84), 43, (26, 14, 30), (255, 190, 120), 0.7, 0.7)
SPEED, REN_X = 760, int(W * 0.40)
GAP = (2.75 * SPEED + REN_X - 80, 2.75 * SPEED + REN_X + 330)   # world x of the gap between buildings
JUMP = (2.45, 3.45)

def s3(sec, u, fi):
    a = arr(SKY)
    for layer, k in ((CITY_FAR, 0.12), (CITY_MID, 0.3)):
        off = int(sec * SPEED * k) % (W * 2)
        a = over(a, layer.crop((off, 0, off + W, H)))
    roof = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(roof)
    ry = int(H * 0.80)
    wx = sec * SPEED
    gx0, gx1 = GAP[0] - wx, GAP[1] - wx
    for x0, x1 in ((-10, gx0), (gx1, W + 10)):
        if x1 > x0:
            d.rectangle([x0, ry, x1, H], fill=(12, 8, 14, 255))
            d.line([(x0, ry), (x1, ry)], fill=(255, 170, 110, 255), width=5)
            for k in range(int((x1 - x0) // 120) + 1):     # rooftop vents scrolling by
                vx = x0 + ((k * 120 - wx * 0.0) % max(1, (x1 - x0)))
                d.rectangle([vx, ry - 40, vx + 50, ry], fill=(12, 8, 14, 255))
    a = over(a, roof)
    jf = clamp((sec - JUMP[0]) / (JUMP[1] - JUMP[0]))
    lift = 300 * math.sin(math.pi * jf) if 0 < jf < 1 else 0
    pz = side_walk(sec * 11, run=True) if not 0 < jf < 1 else side_walk(1.2, run=True)
    g, x0, y0 = draw_char(REN, pz, REN_X, int(ry - lift), scale=0.62, rim_dir=(1, -0.3), rim_color=(255, 190, 120), t=sec * 3)
    a = over(a, g, x0, y0)
    lines = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(lines)   # speed lines
    r = np.random.default_rng(fi)
    for _ in range(14):
        yy = r.uniform(H * 0.2, H * 0.9); xx = r.uniform(0, W); L = r.uniform(120, 380)
        ld.line([(xx, yy), (xx + L, yy)], fill=(255, 230, 200, 90), width=3)
    return over(a, lines)

# ---------------------------------------------------------------- S4 STATUS: he levels up
def s4(sec, u, fi):
    a = vgrad(W, H, [(0, hx('0a0710')), (1, hx('1a1008'))])
    a = add(a, radial(W, H, W / 2, H * 0.45, 900, (170, 110, 30), 1.6))
    g, x0, y0 = draw_char(REN, BASE, W // 2, int(H * 1.02), scale=1.6, rim_dir=(0, -1), rim_color=GOLD, t=sec)
    a = over(a, g, x0, y0, alpha=0.55)
    k = ease(clamp((sec - 0.8) / 2.6))
    lv = 1 + int(round(6 * k)); st = 12 + int(round(6 * k)); ag = 10 + int(round(7 * k)); vi = 11 + int(round(4 * k))
    win = system_window('[ STATUS ]', [('Ren Kurogane', None), (f'LEVEL   {lv}', GOLD), (f'STR {st}    AGI {ag}    VIT {vi}', None),
                                       ('Title: Throne Candidate', CRIMSON)], w=900, progress=clamp(sec / 0.8))
    a = over(a, win, (W - win.width) // 2, 330); a = glow_at(a, win, (W - win.width) // 2, 330, 40, 0.4)
    if sec > 3.4:
        p = clamp((sec - 3.4) / 0.25)
        t = Image.new('RGBA', (W, 260), (0, 0, 0, 0))
        ImageDraw.Draw(t).text((W / 2, 130), 'LEVEL UP', font=font(CINZEL, 140), fill=GOLD + (255,), anchor='mm')
        sc = 1 + 0.6 * (1 - ease_out(p))
        t2 = t.resize((int(W * sc), int(260 * sc)))
        a = over(a, t2, (W - t2.width) // 2, int(1050 - t2.height / 2), alpha=p); a = glow_at(a, t2, (W - t2.width) // 2, int(1050 - t2.height / 2), 40, p)
    return emb_gold.draw(a, sec, 0.9)

# ---------------------------------------------------------------- S5 Hana Seo walks the hall
def plate_hall():
    a = vgrad(BW, BH, [(0, hx('0e0b14')), (1, hx('231a2a'))])
    a = add(a, radial(BW, BH, BW / 2, BH * 0.25, BW * 0.7, (90, 110, 150), 1.5))
    img = to_img(a); d = ImageDraw.Draw(img)
    for x in (120, BW - 220):
        d.rectangle([x, 0, x + 100, BH], fill=(30, 22, 30))
    for i, x in enumerate(range(60, BW, 230)):
        g, x0, y0 = draw_char(NPC, BASE, x, int(BH * 0.80), scale=0.6 + 0.08 * (i % 2), facing=1 if i % 2 else -1, rim_dir=(0, -1))
        img.paste(g, (x0, y0), g)
    return img.filter(ImageFilter.GaussianBlur(9))
P_HALL = plate_hall()

def s5(sec, u, fi):
    a = camera(P_HALL, u, 1.05, 1.12, (0.5, 0.55), fi=fi)
    floor = int(H * 0.93)
    for k, x in enumerate((90, W - 90)):   # crowd stepping aside in the foreground
        g, x0, y0 = draw_char(NPC, BASE, int(x + (-1 if k == 0 else 1) * 60 * ease(u)), floor + 80, scale=0.95, facing=1 if k == 0 else -1, rim_dir=(0, -1))
        a = over(a, g, x0, y0)
    g, x0, y0 = draw_char(REN, BASE, int(W * 0.24), floor, scale=0.78, facing=1, rim_dir=(1, -1), rim_color=(255, 90, 100), t=sec)
    a = over(a, g, x0, y0)
    hxp = lerp(W * 0.92, W * 0.62, ease_out(clamp(sec / 4.4)))
    walking = sec < 4.4
    pz = side_walk(sec * 3.2) if walking else BASE
    g, x0, y0 = draw_char(HANA, pz, int(hxp), floor, scale=0.85, facing=-1, rim_dir=(-1, -1), rim_color=ICE, t=sec)
    a = over(a, g, x0, y0)
    a = add(a, radial(W, H, hxp, floor - 700, 520, (80, 150, 255), 2.0) * 0.35)
    if sec > 0.6:
        tag = speaker_tag('HANA SEO  ·  S-RANK', ICE)
        a = over(a, tag, 70, 300, alpha=clamp((sec - 0.6) / 0.3))
    return a

# ---------------------------------------------------------------- S6 the blade at his chin
def s6(sec, u, fi):
    a = camera(P_HALL, 0.5, 1.5, 1.55, (0.5, 0.45), fi=fi, shake=14 if 0.35 < sec < 0.6 else 0)
    a = a * 0.6
    draw = ease_out(clamp((sec - 0.15) / 0.25))
    hp_h = 920 * 2.0
    hana_pose = pose(el_r=(0.22, -0.74), ha_r=(0.30 + 0.06 * draw, -0.80))
    g, x0, y0 = draw_char(HANA_DRAWN, hana_pose, int(W * -0.08), int(H * 0.30 + hp_h * 0.925), scale=2.0, facing=1, rim_dir=(1, -1), rim_color=ICE, t=sec)
    a = over(a, g, x0, y0)
    hp_r = 900 * 2.0
    rx = int(W * 1.05)
    g, rx0, ry0 = draw_char(REN, pose(head=(0.0, -0.93)), rx, int(H * 0.33 + hp_r * 0.925), scale=2.0, facing=-1, rim_dir=(-1, -1),
                            rim_color=(255, 90, 100), t=sec)
    a = over(a, g, rx0, ry0)
    # katana: from Hana's hand to just under Ren's jaw
    hand = (W * -0.08 + (0.30 + 0.06 * draw) * hp_h, H * 0.30 + hp_h * 0.925 - 0.80 * hp_h)
    tip = (lerp(hand[0] + 80, rx - 0.10 * hp_r, draw), H * 0.33 + 0.925 * hp_r - 0.86 * hp_r)
    blade = Image.new('RGBA', (W, H), (0, 0, 0, 0)); bd = ImageDraw.Draw(blade)
    bd.line([hand, tip], fill=ICE + (255,), width=16); bd.line([hand, tip], fill=(240, 250, 255, 255), width=5)
    bd.rectangle([hand[0] - 14, hand[1] - 34, hand[0] + 14, hand[1] + 34], fill=(200, 200, 210, 255))   # guard
    a = over(a, blade); a = add(a, glow(blade, 30, 1.6))
    if 0.3 < sec < 0.7:   # sword-ring flash line
        a = add(a, radial(W, H, tip[0], tip[1], 260, (200, 230, 255), 1.5))
    tag = speaker_tag('HANA', ICE)
    a = over(a, tag, 70, 1300)
    return a

# ---------------------------------------------------------------- S7 his first smirk, the ring flares
def s7(sec, u, fi):
    a = vgrad(W, H, [(0, hx('0b070c')), (1, hx('1e080e'))])
    flare = clamp((sec - 2.6) / 0.3) * (1 - 0.5 * clamp((sec - 3.4) / 2))
    a = add(a, radial(W, H, W * 0.5, H * 0.5, 900, (160, 20, 40), 1.6) * (0.5 + flare))
    z = 2.3 + 0.25 * ease(u)
    hp = 900 * z
    p = pose(el_l=(-0.06, -0.68), ha_l=(0.06, -0.76))   # hand raised in front of his chest, ring towards camera
    g, x0, y0 = draw_char(REN, p, W // 2, int(H * 0.36 + hp * 0.925), scale=z, rim_dir=(0, -1), rim_color=(255, 70, 90), t=sec)
    a = over(a, g, x0, y0)
    rxy = (W / 2 + 0.06 * hp, H * 0.36 + hp * 0.925 - 0.76 * hp)
    hd = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(hd)
    hx2, hy2 = W / 2, H * 0.36
    if sec > 1.2:   # the smirk: one corner of the mouth lifts
        r = 0.066 * hp
        d.line([(hx2 - 0.25 * r, hy2 + 0.62 * r), (hx2 + 0.15 * r, hy2 + 0.62 * r), (hx2 + 0.38 * r, hy2 + 0.48 * r)], fill=(255, 120, 130, 255), width=7)
    rs = 26 + 30 * flare
    d.ellipse([rxy[0] - rs, rxy[1] - rs, rxy[0] + rs, rxy[1] + rs], fill=CRIMSON + (255,))
    a = over(a, hd); a = add(a, glow(hd, 60, 1.0 + 3 * flare))
    if flare > 0:
        a = add(a, radial(W, H, rxy[0], rxy[1], 700, (255, 40, 60), 2.0) * flare)
    if sec > 3.0:
        tag = speaker_tag('REN', CRIMSON)
        a = over(a, tag, 70, 1300)
    return emb_red.draw(a, sec, 0.5 * flare + 0.2)

# ---------------------------------------------------------------- S8 the gate turns red
def plate_city(gate_inner, gate_outer, glow_col, seed=4):
    a = vgrad(BW, BH, [(0, hx('05030c')), (0.45, hx('1d0c2a')), (0.75, hx('3b1230')), (1, hx('0a0812'))])
    a = stars(a, 300, seed, 0.5)
    a = add(a, radial(BW, BH, BW / 2, BH * 0.30, BW * 0.75, glow_col, 1.8))
    img = to_img(a)
    g = gate_ring(int(BW * 0.82), gate_inner, gate_outer)
    img.paste(g, (int(BW * 0.09), int(BH * 0.16)), g)
    back = skyline(BW, BH, int(BH * 0.86), 2, (28, 16, 44), (190, 140, 255), 0.7, 1.0)
    front = skyline(BW, BH, int(BH * 0.98), 7, (9, 6, 14), (255, 190, 110), 1.0, 0.8)
    img.paste(back, (0, 0), back); img.paste(front, (0, 0), front)
    return img
P_PURPLE = plate_city((235, 200, 255), PURPLE, (130, 50, 200))
P_RED = plate_city((255, 200, 190), CRIMSON, (220, 30, 40))

def s8(sec, u, fi):
    k = ease(clamp((sec - 0.6) / 1.6))
    a = camera(P_PURPLE, u, 1.1, 1.0, (0.5, 0.45), (0.5, 0.40), shake=10 * k if sec < 2.4 else 3, fi=fi)
    b = camera(P_RED, u, 1.1, 1.0, (0.5, 0.45), (0.5, 0.40), shake=10 * k if sec < 2.4 else 3, fi=fi)
    a = a * (1 - k) + b * k
    siren = 0.5 + 0.5 * math.sin(sec * 9)
    a = add(a, vgrad(W, H, [(0, (0, 0, 0)), (0.75, (0, 0, 0)), (1, (200, 20, 30))]) * siren * k)
    for t0 in (1.0, 1.9, 3.3, 5.6):
        if t0 < sec < t0 + 0.2:
            a = lightning(a, 200 + int(t0 * 170) % 700, 300, 800, CRIMSON, int(t0 * 10)) * 1.12
    if sec > 2.6:
        p = clamp((sec - 2.6) / 0.25)
        win = system_window('[ EMERGENCY QUEST ]', [('A Red Gate has opened.', None), ('Enter. Alone.', CRIMSON)], w=860, progress=clamp((sec - 2.7) / 1.4))
        sc = 0.7 + 0.3 * ease_out(p)
        win = win.resize((int(win.width * sc), int(win.height * sc)))
        wx, wy = (W - win.width) // 2, int(H * 0.62 - win.height / 2)
        a = over(a, win, wx, wy, alpha=p); a = glow_at(a, win, wx, wy, 40, 0.6 * p)
    return a

# ---------------------------------------------------------------- S9 walking into the gate
def s9(sec, u, fi):
    a = np.zeros((H, W, 3), np.float32) + 8
    gate = gate_ring(1500, (255, 220, 210), CRIMSON, swirl_t=sec)
    gate = gate.rotate(90, expand=True)              # stood on its edge like a door
    gs = 1.0 + 0.15 * u
    gate = gate.resize((int(gate.width * gs * 0.75), int(gate.height * gs * 0.95)))
    gx, gy = (W - gate.width) // 2, int(H * 0.47 - gate.height / 2)
    a = add(a, radial(W, H, W / 2, H * 0.47, 1100, (220, 30, 40), 1.4))
    a = over(a, gate, gx, gy); a = glow_at(a, gate, gx, gy, 60, 0.8)
    floor = int(H * 0.90)
    d0 = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(d0).rectangle([0, floor, W, H], fill=(6, 4, 6, 255))
    a = over(a, d0)
    sc = 1.15 - 0.55 * ease(u)                       # walking away from camera, toward the gate
    g, x0, y0 = draw_char(REN, side_walk(sec * 4.5), W // 2, int(floor - 260 * ease(u)), scale=sc, facing=1, rim_dir=(0, -1), rim_color=(255, 120, 120), t=sec)
    a = over(a, g, x0, y0)
    return emb_red.draw(a, sec, 0.7)

# ---------------------------------------------------------------- S10 the Hollow King
def plate_bones():
    a = vgrad(BW, BH, [(0, hx('040205')), (0.5, hx('1a040a')), (1, hx('060305'))])
    a = add(a, radial(BW, BH, BW / 2, BH * 0.45, BW * 0.7, (200, 20, 40), 1.6))
    img = to_img(a)
    t = throne_shape(int(BW * 0.95), int(BH * 0.62), edge=(200, 40, 60))
    img.paste(t, (int(BW * 0.025), int(BH * 0.10)), t)
    d = ImageDraw.Draw(img)
    rr = np.random.default_rng(8)
    for _ in range(70):   # pile of bones and skulls at the foot of the throne
        x, y = rr.uniform(0, BW), rr.uniform(BH * 0.74, BH); s = rr.uniform(20, 60)
        if rr.random() < 0.4: d.ellipse([x - s, y - s * 0.8, x + s, y + s * 0.8], fill=(70, 60, 58), outline=(30, 20, 20), width=3)
        else: d.line([(x - s * 1.5, y), (x + s * 1.5, y + rr.uniform(-20, 20))], fill=(80, 70, 66), width=int(s * 0.35))
    g, x0, y0 = draw_char(KING, sit(), BW // 2 - 60, int(BH * 0.86), scale=1.15, rim_dir=(0, -1), rim_color=(255, 40, 50))
    img.paste(g, (x0, y0), g)
    return img
P_BONES = plate_bones()

def s10(sec, u, fi):
    a = camera(P_BONES, clamp(sec / 2.8), 1.0, 1.45, (0.5, 0.62), (0.5, 0.36), fi=fi, shake=6 if 1.6 < sec < 2.0 else 0)
    ig = clamp((sec - 1.6) / 0.3)
    if ig > 0:   # eye sockets ignite
        z = lerp(1.0, 1.45, ease(clamp(sec / 2.8)))
        a = add(a, radial(W, H, W / 2 - 25 * z, H * 0.43, 260 * z, (255, 30, 40), 2.2) * ig)
    if 0.4 < sec < 2.8:
        tag = speaker_tag('THE HOLLOW KING', CRIMSON)
        a = over(a, tag, 70, 300, alpha=clamp((sec - 0.4) / 0.3))
    if sec > 3.0:
        p = clamp((sec - 3.0) / 0.4)
        a = a * (1 - 0.75 * p)
        t = Image.new('RGBA', (W, 400), (0, 0, 0, 0)); d = ImageDraw.Draw(t)
        d.text((W / 2, 120), 'THRONEBREAKER', font=font(CINZEL, 104), fill=GOLD + (255,), anchor='mm')
        d.text((W / 2, 230), 'EPISODE 2  ·  DAILY QUEST', font=font(BEBAS, 64), fill=WHITE + (255,), anchor='mm')
        d.text((W / 2, 320), 'NEXT: EPISODE 3', font=font(BEBAS, 70), fill=CRIMSON + (255,), anchor='mm')
        a = over(a, t, 0, int(H * 0.38), alpha=p); a = glow_at(a, t, 0, int(H * 0.38), 30, 0.7 * p)
    return a

HL = lambda *i: set(i)
SHOTS = [
    dict(start=0, end=5, fn=s1, captions=[(2.0, 5.0, 'Wait... what is this?', HL(3))], grade=(0.98, 0.96, 1.08)),
    dict(start=5, end=11, fn=s2, captions=[(5.3, 8.0, 'I thought the hospital drugs got to me.', HL(3, 4)),
                                          (8.0, 11, 'Then the counter kept going.', HL(2))]),
    dict(start=11, end=17, fn=s3, captions=[(11.3, 14.0, 'Every day it gets easier.', HL(4)),
                                           (14.0, 17, 'Every day... I get faster.', HL(4))], grade=(1.06, 0.98, 0.94)),
    dict(start=17, end=23, fn=s4, captions=[(17.4, 20.0, "Hunters can't level up.", HL(2, 3)),
                                           (20.6, 23, 'But I can.', HL(2))], bloom=0.45),
    dict(start=23, end=29, fn=s5, captions=[(23.4, 26.0, 'Hana Seo. S-Rank.', HL(2)),
                                           (26.0, 29, 'The strongest hunter in the city.', HL(1))], grade=(0.94, 0.98, 1.10)),
    dict(start=29, end=35, fn=s6, captions=[(29.8, 32.2, 'Your mana changed overnight, Zero.', HL(1, 5)),
                                           (32.2, 35, 'What did you find in that temple?', HL(6))], grade=(0.94, 0.98, 1.10)),
    dict(start=35, end=42, fn=s7, captions=[(38.0, 42, "Nothing you'd survive.", HL(2), 110)], bloom=0.5),
    dict(start=42, end=50, fn=s8, captions=[(42.3, 44.6, 'That night, the sky bled.', HL(4))]),
    dict(start=50, end=55, fn=s9, captions=[(50.6, 55, 'Alone. Of course.', HL(0))], bloom=0.5),
    dict(start=55, end=60, fn=s10, captions=[(55.4, 58.0, 'Another candidate... how delicious.', HL(3), 92, 1500)], bloom=0.45),
]
FLASHES = [(0.0, 0.2, (255, 60, 70)), (1.5, 0.12, (255, 255, 255)), (16.9, 0.15, (255, 220, 140)), (20.4, 0.2, (255, 220, 140)),
           (29.4, 0.15, (220, 240, 255)), (37.6, 0.3, (255, 40, 60)), (43.0, 0.15, (255, 80, 80)), (56.6, 0.25, (255, 40, 50)),
           (58.0, 0.3, (255, 200, 120))]

if __name__ == '__main__':
    out = sys.argv[1]
    if len(sys.argv) > 2:
        for s in sys.argv[2:]:
            sec = float(s); shot = next(x for x in SHOTS if x['start'] <= sec < x['end'])
            ls = sec - shot['start']; u = ls / (shot['end'] - shot['start'])
            a = render.cap_layer(shot['fn'](ls, u, int(sec * 30)), sec, shot.get('captions', []))
            to_img(finish(a, 0, bloom=shot.get('bloom', 0.35), grade=shot.get('grade', (1.0, 0.96, 1.04)))).save(out.replace('.mp4', f'_{s}.png'))
    else:
        render.run(SHOTS, 60, out, flashes=FLASHES)
