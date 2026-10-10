"""THRONEBREAKER Episode 1: "The Zero".  python3 ep1.py out_video.mp4 [preview_seconds...]"""
import sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from art import *
from scenes import *
import render

BW, BH = int(W * 1.18), int(H * 1.18)   # oversized plates for camera moves
emb_red = Embers(90, (255, 70, 60), 5)
emb_dust = Embers(60, (200, 170, 140), 9, rise=40)

# ---------------------------------------------------------------- S1 hook: on his knees before a giant shadow
def plate_dungeon():
    a = vgrad(BW, BH, [(0, hx('07050a')), (0.55, hx('1c0710')), (1, hx('09060a'))])
    a = add(a, radial(BW, BH, BW / 2, BH * 0.5, BW * 0.9, (150, 20, 35), 1.6))
    img = to_img(a); d = ImageDraw.Draw(img)
    hz = BH * 0.68
    for i in range(-12, 13):    # floor tiles in perspective
        d.line([(BW / 2 + i * 40, hz), (BW / 2 + i * 260, BH)], fill=(60, 18, 26), width=3)
    for k in range(8):
        y = hz + (BH - hz) * (k / 8) ** 1.7; d.line([(0, y), (BW, y)], fill=(60, 18, 26), width=3)
    g, x0, y0 = draw_char(KING, BASE, BW // 2, int(hz + 60), scale=0.95, rim_dir=(0, -1), rim_color=(255, 40, 50))
    img.paste(g, (x0, y0), g)
    return img
P_DUN = plate_dungeon()

def s1(sec, u, fi):
    a = camera(P_DUN, u, 1.0, 1.12, (0.5, 0.5), (0.5, 0.56), shake=8 if sec < 0.6 else 2, fi=fi)
    r, x0, y0 = draw_char(REN, kneel(), W // 2 + 60, 1880, scale=1.25, rim_dir=(0, -1), rim_color=(255, 70, 80), t=sec)
    a = over(a, r, x0, y0)
    a = emb_red.draw(a, sec, 0.8)
    return a

# ---------------------------------------------------------------- S2 the gates opened (city skyline)
def plate_city():
    a = vgrad(BW, BH, [(0, hx('05030c')), (0.45, hx('1d0c3a')), (0.75, hx('3b1240')), (1, hx('0a0812'))])
    a = stars(a, 300, 4, 0.5)
    a = add(a, radial(BW, BH, BW / 2, BH * 0.30, BW * 0.75, (130, 50, 200), 1.8))
    img = to_img(a)
    g = gate_ring(int(BW * 0.82), (235, 200, 255), PURPLE)
    img.paste(g, (int(BW * 0.09), int(BH * 0.16)), g)
    back = skyline(BW, BH, int(BH * 0.86), 2, (28, 16, 44), (190, 140, 255), 0.7, 1.0)
    front = skyline(BW, BH, int(BH * 0.98), 7, (9, 6, 14), (255, 190, 110), 1.0, 0.8)
    img.paste(back, (0, 0), back); img.paste(front, (0, 0), front)
    return img
P_CITY = plate_city()

def s2(sec, u, fi):
    a = camera(P_CITY, u, 1.18, 1.0, (0.5, 0.70), (0.5, 0.42), fi=fi)
    if 1.1 < sec < 1.35 or 3.6 < sec < 3.8:
        a = lightning(a, 300 + (sec > 2) * 420, 260, 700, PURPLE, int(sec * 10))
        a = a * 1.15
    return a

# ---------------------------------------------------------------- S3 hunter license, E rank stamp
def plate_hall():
    a = vgrad(BW, BH, [(0, hx('0e0b14')), (1, hx('231a2a'))])
    a = add(a, radial(BW, BH, BW / 2, BH * 0.25, BW * 0.7, (120, 90, 60), 1.5))
    img = to_img(a); d = ImageDraw.Draw(img)
    for x in (120, BW - 220):
        d.rectangle([x, 0, x + 100, BH], fill=(30, 22, 30))
    for i, x in enumerate(range(60, BW, 230)):    # laughing crowd silhouettes
        g, x0, y0 = draw_char(NPC, BASE, x, int(BH * 0.95), scale=0.8 + 0.1 * (i % 2), facing=1 if i % 2 else -1, rim_dir=(0, -1))
        img.paste(g, (x0, y0), g)
    return img.filter(ImageFilter.GaussianBlur(10))
P_HALL = plate_hall()

def license_card(stamp):
    w, h = 900, 560
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, w - 1, h - 1], 28, fill=(20, 16, 24, 250), outline=GOLD + (255,), width=5)
    d.rectangle([0, 0, w, 96], fill=(70, 12, 22, 255)); d.rounded_rectangle([0, 0, w - 1, h - 1], 28, outline=GOLD + (255,), width=5)
    d.text((w / 2, 50), 'HUNTER ASSOCIATION', font=font(CINZEL, 46), fill=GOLD + (255,), anchor='mm')
    face, fx, fy = draw_char(REN, BASE, 0, 0, scale=0.55, rim_dir=(0, -1))
    crop = face.crop((face.width // 2 - 130, int(face.height * 0.18), face.width // 2 + 130, int(face.height * 0.18) + 300))
    d.rectangle([50, 140, 330, 470], fill=(60, 50, 70, 255)); img.paste(crop, (60, 160), crop)
    d.text((380, 160), 'NAME', font=font(BEBAS, 40), fill=(170, 160, 180, 255))
    d.text((380, 200), 'REN KUROGANE', font=font(BEBAS, 76), fill=WHITE + (255,))
    d.text((380, 300), 'CLASS', font=font(BEBAS, 40), fill=(170, 160, 180, 255))
    d.text((380, 340), 'UNASSIGNED', font=font(BEBAS, 60), fill=WHITE + (255,))
    d.text((380, 430), 'ID 0000-ZERO', font=font(BEBAS, 36), fill=(130, 120, 140, 255))
    card = img
    if stamp > 0:
        st = Image.new('RGBA', (300, 300), (0, 0, 0, 0)); sd = ImageDraw.Draw(st)
        sd.ellipse([10, 10, 290, 290], outline=CRIMSON + (255,), width=16)
        sd.text((150, 150), 'E', font=font(BEBAS, 240), fill=CRIMSON + (255,), anchor='mm')
        sc = 1 + 2.2 * (1 - ease_out(stamp))
        st = st.resize((int(300 * sc), int(300 * sc))).rotate(-14, expand=True)
        card.alpha_composite(st, (int(w - 260 - st.width / 2), int(h / 2 - st.height / 2 + 30))) if st.width < w else None
    return card

def s3(sec, u, fi):
    a = camera(P_HALL, u, 1.05, 1.12, (0.5, 0.6), fi=fi)
    st = clamp((sec - 1.4) / 0.25)
    card = license_card(st)
    sh = 18 if 1.65 < sec < 1.95 else 0
    r = np.random.default_rng(fi)
    a = over(a, card, (W - card.width) // 2 + int(r.uniform(-sh, sh)), 560 + int(r.uniform(-sh, sh)))
    return a

# ---------------------------------------------------------------- S4 hospital at night
def plate_hospital():
    a = vgrad(BW, BH, [(0, hx('070b18')), (1, hx('0d1222'))])
    img = to_img(a); d = ImageDraw.Draw(img)
    wx0, wy0, wx1, wy1 = int(BW * 0.12), int(BH * 0.12), int(BW * 0.88), int(BH * 0.46)
    win = to_img(vgrad(wx1 - wx0, wy1 - wy0, [(0, hx('0b1030')), (1, hx('2a1a4a'))]))
    sk = skyline(wx1 - wx0, wy1 - wy0, wy1 - wy0, 21, (10, 10, 22), (255, 210, 140), 1.0, 0.35)
    win.paste(sk, (0, 0), sk); ImageDraw.Draw(win).ellipse([520, 60, 640, 180], fill=(235, 235, 255))
    img.paste(win, (wx0, wy0))
    d.rectangle([wx0, wy0, wx1, wy1], outline=(30, 34, 50), width=22)
    d.line([((wx0 + wx1) // 2, wy0), ((wx0 + wx1) // 2, wy1)], fill=(30, 34, 50), width=16)
    a = arr(img)
    a = add(a, radial(BW, BH, BW / 2, BH * 0.3, BW * 0.8, (40, 50, 110), 1.6))
    img = to_img(a); d = ImageDraw.Draw(img)
    by = int(BH * 0.78)
    d.rectangle([int(BW * 0.18), by - 40, int(BW * 0.78), by + 20], fill=(18, 20, 30))   # bed
    d.rectangle([int(BW * 0.18), by - 120, int(BW * 0.22), by + 200], fill=(18, 20, 30))
    g, x0, y0 = draw_char(AIKO, lying(), int(BW * 0.50), by - 38, scale=1.25, rim_dir=(0, -1), rim_color=(170, 180, 255))
    img.paste(g, (x0, y0), g)
    g, x0, y0 = draw_char(REN, sit(), int(BW * 0.86), by + 210, scale=0.95, facing=-1, rim_dir=(0, -1), rim_color=(150, 170, 255))
    img.paste(g, (x0, y0), g)
    d.rectangle([int(BW * 0.30), by + 60, int(BW * 0.44), by + 80], fill=(18, 20, 30))
    d.rectangle([int(BW * 0.32), by + 30, int(BW * 0.42), by + 60], fill=(220, 220, 230))   # the bill
    return img
P_HOSP = plate_hospital()

def s4(sec, u, fi):
    a = camera(P_HOSP, u, 1.0, 1.1, (0.5, 0.6), (0.45, 0.62), fi=fi)
    # heart monitor line, in screen space of the first frame region (approximate)
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    mx0, my = 70, int(H * 0.56)
    mon = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(mon).rectangle([45, my - 110, 215, my + 70], fill=(10, 14, 18, 255), outline=(60, 70, 80, 255), width=4)
    a = over(a, mon)
    pts = []
    for i in range(0, 120, 3):
        ph = (i / 120 + sec * 0.9) % 1
        y = my - (60 if 0.45 < ph < 0.48 else -25 if 0.48 < ph < 0.51 else 0)
        pts.append((mx0 + i, y))
    d.line(pts, fill=(80, 255, 140, 255), width=4)
    a = over(a, img); a = add(a, glow(img, 10, 1.0))
    return a

# ---------------------------------------------------------------- S5 the raid nobody wants
def plate_cave():
    a = vgrad(BW, BH, [(0, hx('06070b')), (1, hx('12101a'))])
    img = to_img(a)
    g = gate_ring(int(BW * 0.65), (220, 190, 255), PURPLE)
    img.paste(g, (int(BW * 0.52), int(BH * 0.42)), g)
    d = ImageDraw.Draw(img)
    rr = np.random.default_rng(3)
    for side in (0, 1):   # jagged rock frame
        pts = [(0 if side == 0 else BW, 0)]
        for k in range(14):
            y = BH * k / 13; x = (rr.uniform(60, 260) if side == 0 else BW - rr.uniform(60, 260))
            pts.append((x, y))
        pts.append((0 if side == 0 else BW, BH)); d.polygon(pts, fill=(5, 5, 8))
    d.polygon([(0, BH * 0.88), (BW, BH * 0.84), (BW, BH), (0, BH)], fill=(8, 7, 12))
    return img
P_CAVE = plate_cave()

def bag(d, P, hp, r):
    x, y = P('sh_l'); d.rectangle([x - 0.13 * hp, y + 0.02 * hp, x - 0.02 * hp, y + 0.24 * hp], fill=255)

def s5(sec, u, fi):
    a = camera(P_CAVE, u, 1.05, 1.0, (0.55, 0.6), fi=fi)
    a = add(a, radial(W, H, W * 0.85, H * 0.62, 700, (90, 40, 160), 1.8))
    floor = int(H * 0.86)
    for k in range(6):
        x = -260 + k * 190 + sec * 150
        spec = REN if k == 0 else NPC
        g, x0, y0 = draw_char(spec, side_walk(sec * 6 + k), int(x), floor, scale=0.42, rim_dir=(1, 0), rim_color=(190, 140, 255),
                              extra=bag if k == 0 else None, t=sec)
        a = over(a, g, x0, y0)
    return emb_dust.draw(a, sec, 0.5)

# ---------------------------------------------------------------- S6 the doors close and the statues wake
def plate_temple():
    a = vgrad(BW, BH, [(0, hx('050407')), (0.6, hx('140a0c')), (1, hx('0a0708'))])
    a = add(a, radial(BW, BH, BW / 2, BH * 0.45, BW * 0.6, (90, 40, 30), 1.4))
    img = to_img(a); d = ImageDraw.Draw(img)
    vx, vy = BW / 2, BH * 0.42
    for i in range(7):   # receding pillars
        f = 1 - i / 7; off = BW * 0.46 * f + 40
        for s in (-1, 1):
            x = vx + s * off; wdt = 30 + 120 * f
            d.rectangle([x - wdt / 2, vy - 900 * f - 60, x + wdt / 2, vy + 900 * f + 60], fill=(12, 9, 10), outline=(70, 45, 35), width=3)
    return img
P_TEMPLE = plate_temple()
STATUE_POS = [(s, i) for i in range(6) for s in (-1, 1)]

def s6(sec, u, fi):
    a = camera(P_TEMPLE, u, 1.0, 1.15, (0.5, 0.5), fi=fi, shake=10 if 0.4 < sec < 0.9 else 0)
    vx, vy = W / 2, H * 0.44
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    eyes_on = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ed = ImageDraw.Draw(eyes_on)
    for n, (s, i) in enumerate(sorted(STATUE_POS, key=lambda p: -p[1])):
        f = 1 - i / 6.5; x = vx + s * (W * 0.40 * f + 30); foot = vy + 700 * f
        g, x0, y0 = draw_char(STATUE, BASE, int(x), int(foot), scale=0.5 * f + 0.08, facing=-s, rim_dir=(0, -1))
        img.alpha_composite(g, (max(0, x0), max(0, y0))) if x0 >= 0 and y0 >= 0 and x0 + g.width <= W and y0 + g.height <= H else None
        lit = clamp((sec - 1.2 - (5 - i) * 0.45) / 0.15)
        if lit > 0:
            hh = 1000 * (0.5 * f + 0.08); ey = foot - hh * 0.93; er = max(3, hh * 0.012)
            for e in (-1, 1):
                ex = x + e * hh * 0.025
                ed.ellipse([ex - er * 2, ey - er, ex + er * 2, ey + er], fill=(255, 40, 40, int(255 * lit)))
    a = over(a, img)
    a = over(a, eyes_on); a = add(a, glow(eyes_on, 22, 2.2))
    for k in range(5):   # party silhouettes in the middle, turning in panic
        g, x0, y0 = draw_char(NPC if k else REN, BASE, int(W / 2 - 160 + k * 80), int(H * 0.80), scale=0.22, facing=1 if (k + int(sec * 2)) % 2 else -1,
                              rim_dir=(0, -1), rim_color=(255, 90, 80))
        a = over(a, g, x0, y0)
    a = door_panels(a, 1 - clamp(sec / 0.5)) if sec < 0.5 else a
    return a

# ---------------------------------------------------------------- S7 crawling to the throne
def plate_throne():
    a = vgrad(BW, BH, [(0, hx('080406')), (0.5, hx('2a060c')), (1, hx('0a0507'))])
    a = add(a, radial(BW, BH, BW / 2, BH * 0.36, BW * 0.6, (220, 30, 50), 1.5))
    img = to_img(a)
    t = throne_shape(int(BW * 0.7), int(BH * 0.45))
    img.paste(t, (int(BW * 0.15), int(BH * 0.18)), t)
    return img
P_THRONE = plate_throne()

def s7(sec, u, fi):
    a = camera(P_THRONE, u, 1.0, 1.25, (0.5, 0.55), (0.5, 0.45), fi=fi)
    fog = Image.new('RGBA', (W, H), (0, 0, 0, 0)); fd = ImageDraw.Draw(fog)
    for k in range(10):
        x = (k * 260 + sec * 60 * (1 + k % 3)) % (W + 600) - 300
        fd.ellipse([x, H * 0.70 + (k % 4) * 60, x + 700, H * 0.86 + (k % 4) * 60], fill=(180, 20, 40, 40))
    fog = fog.filter(ImageFilter.GaussianBlur(40))
    g, x0, y0 = draw_char(REN, crawl(sec * 3), int(170 + u * 330), int(H * 0.86 - u * 140), scale=1.35 - u * 0.3, rim_dir=(0, -1),
                          rim_color=(255, 80, 90), t=sec)
    a = over(a, g, x0, y0)
    a = over(a, fog)
    return a

# ---------------------------------------------------------------- S8 the System awakens
def s8(sec, u, fi):
    a = camera(P_THRONE, 0.5, 1.6, 1.7, (0.5, 0.52), fi=fi)
    hand = Image.new('RGBA', (W, H), (0, 0, 0, 0)); hd = ImageDraw.Draw(hand)
    reach = ease_out(clamp(sec / 1.2))
    hx_, hy_ = W * 0.62 - reach * 120, H * 0.80 - reach * 260
    arm = [(W + 80, H + 80), (W + 80, H * 0.86), (hx_ + 110, hy_ + 40), (hx_ + 20, hy_ - 50), (hx_ - 70, hy_ - 10), (hx_ - 60, hy_ + 90), (W * 0.78, H + 80)]
    hd.polygon(arm, fill=(10, 8, 12, 255), outline=(255, 70, 80, 255), width=5)
    for k in range(4):
        fx = hx_ - 50 + k * 34; tip = (fx - 40 - k * 6, hy_ - 150 + k * 18)
        hd.line([(fx, hy_), tip], fill=(255, 70, 80, 255), width=40); hd.line([(fx, hy_), tip], fill=(10, 8, 12, 255), width=30)
        hd.ellipse([tip[0] - 15, tip[1] - 15, tip[0] + 15, tip[1] + 15], fill=(10, 8, 12, 255))
    hd.ellipse([hx_ + 10, hy_ - 20, hx_ + 50, hy_ + 20], fill=CRIMSON + (255,))   # the ring
    a = over(a, hand)
    if sec > 1.4:
        p = clamp((sec - 1.4) / 0.25)
        a = add(a, np.full_like(a, 1) * np.array([120, 10, 30], np.float32) * (1 - clamp((sec - 1.4) / 1.0)))
        win = system_window('[ THRONE ]', [('Candidate found.', None), ('Will you claim the throne?', GOLD)], buttons=[('YES', True), ('NO', False)],
                            progress=clamp((sec - 1.6) / 2.2))
        sc = 0.6 + 0.4 * ease_out(p)
        win = win.resize((int(win.width * sc), int(win.height * sc)))
        wx, wy = (W - win.width) // 2, int(H * 0.28 - win.height / 2)
        a = over(a, win, wx, wy, alpha=p)
        a = glow_at(a, win, wx, wy, 40, 0.6 * p)
    return a

# ---------------------------------------------------------------- S9 "...Yes."
EYE = None
def s9(sec, u, fi):
    global EYE
    a = vgrad(W, H, [(0, hx('12060a')), (1, hx('2a0810'))])
    a = add(a, radial(W, H, W / 2, H * 0.42, 800, (200, 20, 40), 1.4))
    op = 1.0 - 0.28 * ease(clamp((sec - 2.2) / 0.6))
    e = draw_eye(1000, iris=(150, 160, 185), reflect=CRIMSON, open_=op)
    z = 1 + 0.06 * u
    e = e.resize((int(e.width * z), int(e.height * z)))
    a = over(a, e, (W - e.width) // 2, int(H * 0.42 - e.height / 2))
    pulse = 0.5 + 0.5 * math.sin(sec * 7)
    a = add(a, radial(W, H, W / 2, H * 0.42, 420, (255, 40, 60), 2.0) * 0.4 * pulse * clamp((sec - 2.3) / 0.5))
    return a

# ---------------------------------------------------------------- S10 cliffhanger card
def s10(sec, u, fi):
    a = np.zeros((H, W, 3), np.float32) + 6
    a = add(a, radial(W, H, W / 2, H * 0.4, 700, (90, 10, 25), 1.6))
    win = system_window('[ THRONE ]', [('Welcome, Player.', GOLD), ('Your first trial begins...', None), ('NOW.', CRIMSON)], progress=clamp(sec / 2.0))
    a = over(a, win, (W - win.width) // 2, int(H * 0.22))
    if sec > 2.6:
        p = clamp((sec - 2.6) / 0.4)
        t = Image.new('RGBA', (W, 400), (0, 0, 0, 0)); d = ImageDraw.Draw(t)
        d.text((W / 2, 120), 'THRONEBREAKER', font=font(CINZEL, 104), fill=GOLD + (255,), anchor='mm')
        d.text((W / 2, 230), 'EPISODE 1  ·  THE ZERO', font=font(BEBAS, 64), fill=WHITE + (255,), anchor='mm')
        d.text((W / 2, 320), 'NEXT: EPISODE 2', font=font(BEBAS, 70), fill=CRIMSON + (255,), anchor='mm')
        a = over(a, t, 0, int(H * 0.60), alpha=p); a = glow_at(a, t, 0, int(H * 0.60), 30, 0.7 * p)
    return a

HL = lambda *i: set(i)
SHOTS = [
    dict(start=0, end=5, fn=s1, captions=[(0.2, 2.6, 'They told me E-Rank hunters never die in dungeons...', HL(4, 5)),
                                         (2.6, 5.0, '...they just disappear.', HL(3))]),
    dict(start=5, end=11, fn=s2, captions=[(5.3, 8.1, 'Ten years ago, the Gates opened.', HL(4)),
                                          (8.1, 11, 'Monsters came. Hunters rose.', HL(3))]),
    dict(start=11, end=17, fn=s3, captions=[(12.6, 14.6, 'Me? E-Rank. The weakest.', HL(1)),
                                           (14.6, 17, 'They call me... the Zero.', HL(4))]),
    dict(start=17, end=23, fn=s4, captions=[(17.3, 20.0, 'My sister Aiko is all I have left.', HL(3)),
                                           (20.0, 23, "And her treatment doesn't pay for itself.", HL(2))], grade=(0.92, 0.96, 1.12)),
    dict(start=23, end=29, fn=s5, captions=[(23.3, 26.2, 'So I take the raids nobody wants.', HL(6)),
                                           (26.2, 29, 'Carry the bags. Stay at the back.', HL(5))]),
    dict(start=29, end=36, fn=s6, captions=[(29.4, 32.0, 'Then the doors closed.', HL(3)),
                                           (32.0, 36, 'And the statues... opened their eyes.', HL(5))]),
    dict(start=36, end=43, fn=s7, captions=[(36.3, 39.5, 'Everyone ran.', HL(1)),
                                           (39.5, 43, "I didn't make it out.", HL(4))]),
    dict(start=43, end=50, fn=s8, captions=[], bloom=0.5),
    dict(start=50, end=55, fn=s9, captions=[(52.4, 55, '...Yes.', HL(0), 150, 1500)], bloom=0.5),
    dict(start=55, end=60, fn=s10, captions=[], bloom=0.5),
]
FLASHES = [(0.0, 0.25, (255, 60, 70)), (12.4, 0.12, (255, 255, 255)), (29.4, 0.15, (255, 255, 255)), (44.4, 0.35, (255, 40, 60)),
           (52.4, 0.2, (255, 255, 255)), (57.6, 0.3, (255, 200, 120))]

if __name__ == '__main__':
    out = sys.argv[1]
    if len(sys.argv) > 2 and sys.argv[2] == '--part':
        render.run(SHOTS, 60, out, flashes=FLASHES, frames=(int(sys.argv[3]), int(sys.argv[4])))
    elif len(sys.argv) > 2:   # preview stills at given seconds
        for s in sys.argv[2:]:
            sec = float(s); shot = next(x for x in SHOTS if x['start'] <= sec < x['end'])
            ls = sec - shot['start']; u = ls / (shot['end'] - shot['start'])
            a = render.cap_layer(shot['fn'](ls, u, int(sec * 30)), sec, shot.get('captions', []))
            to_img(finish(a, 0, bloom=shot.get('bloom', 0.35), grade=shot.get('grade', (1.0, 0.96, 1.04)))).save(out.replace('.mp4', f'_{s}.png'))
    else:
        render.run_parallel(__file__, 60, out)
