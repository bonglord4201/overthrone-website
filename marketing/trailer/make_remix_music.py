"""Five original scores for the OVERTHRONE remix trailer, all on the same grid as the edit (build_remix.py):
80 BPM, 1 beat = 0.75 s, 1 bar = 3 s.

    bar 0     (0 s)     OVERTHRONE hub opening
    bar 2     (6 s)     the old trailer's world tour begins
    bar 8.75  (26.25 s) build: armour, faces, the forest, the mine
    bar 11    (33 s)    action: the swing, then Epic Fight cuts every beat from 34.5 s
    bar 13    (39 s)    THE HIT: the bridge shot; the logo arrives at about 47 s
    bar 17    (51 s)    JOIN NOW card, ends at 54.75 s

    python3 make_remix_music.py <VCSL folder> <style> <out.wav>
    styles: orchestral, phonk, eastern, anime, trap

Everything is synthesised here or played from VCSL (CC0) samples, so the music is OVERTHRONE's to use anywhere,
including TikTok and YouTube, without copyright claims.
"""
import os, subprocess, sys, wave
import numpy as np

VCSL, STYLE, OUT = sys.argv[1:4]
SR = 44100
BEAT = 0.75; BAR = 3.0
LENGTH = 54.75
N = int(SR * (LENGTH + 4))
rng = np.random.default_rng({'orchestral': 1, 'phonk': 2, 'eastern': 3, 'anime': 4, 'trap': 5}[STYLE])
BUSES = ('keys', 'pluck', 'pad', 'lead', 'drums', 'perc', 'fx', 'bass', 'ost')
bus = {k: np.zeros((N, 2)) for k in BUSES}
def at(bar, beat=0.0): return bar * BAR + beat * BEAT
def mtof(m): return 440 * 2 ** ((m - 69) / 12)

# ---------------------------------------------------------------- placing, filters
def place(b, x, t, g=1.0, pan=0.0, length=None, fade=0.08):
    if x.ndim == 1: x = np.stack([x, x], 1)
    if length is not None:
        n = int(length * SR)
        if len(x) > n:
            x = x[:n].copy(); f = min(int(fade * SR), n); x[-f:] *= np.linspace(1, 0, f)[:, None]
    i = int(round(t * SR))
    if i >= N or i < 0: return
    x = x[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[b][i:i + len(x), 0] += x[:, 0] * g * l * 1.41
    bus[b][i:i + len(x), 1] += x[:, 1] * g * r * 1.41

def filt(x, lo=None, hi=None):
    X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(len(x), 1 / SR); m = np.ones_like(f)
    if lo: m *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
    if hi: m *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * (m[:, None] if X.ndim == 2 else m), len(x), axis=0)

def env(n, a, d=None, release=0.05, length=None):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4))
    if d: e = e * np.exp(-t / d)
    r = int(release * SR)
    if r: e[-r:] *= np.linspace(1, 0, r)
    return e

# ---------------------------------------------------------------- VCSL samples
_cache = {}
def load(rel):
    if rel not in _cache:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(VCSL, rel), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                             capture_output=True, check=True).stdout
        x = np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)
        _cache[rel] = x / (np.max(np.abs(x)) + 1e-9)
    return _cache[rel]
def repitch(x, semis):
    if abs(semis) < 1e-6: return x
    idx = np.arange(0, len(x) - 1, 2 ** (semis / 12))
    return np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in (0, 1)], 1)
NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
def midi_of(name):
    o = name.lstrip('ABCDEFG#')
    return 12 * (int(o) + 1) + NOTE[name[: len(name) - len(o)]]
def bank(folder, parse):
    out = {}
    for f in sorted(os.listdir(os.path.join(VCSL, folder))):
        try: m, v = parse(f)
        except Exception: continue
        out.setdefault(m, {}).setdefault(v, []).append(folder + '/' + f)
    return out
PIANO = bank('Chordophones/Zithers/Grand Piano, Kawai/Sustains', lambda f: (midi_of(f.split('_')[2]), int(f.split('_')[3][1:])))
HARP = bank('Chordophones/Composite Chordophones/Concert Harp',
            lambda f: (midi_of(f[:-4].split('_')[1]), 2 if f[:-4].split('_')[2].startswith('f') else 1))
def nearest(b, m, vel):
    k = min(b, key=lambda x: abs(x - m)); vs = b[k]; v = min(vs, key=lambda x: abs(x - vel))
    return vs[v][int(rng.integers(len(vs[v])))], m - k
def piano(m, t, v=1.0, length=4.0, vel=3, pan=0.0):
    f, s = nearest(PIANO, m, vel); place('keys', repitch(load(f), s), t, 0.55 * v, pan, length, 0.6)
def harp(m, t, v=1.0, pan=0.0):
    f, s = nearest(HARP, m, 1); place('pluck', repitch(load(f), s), t, 0.45 * v, pan, 3.0, 0.8)
def pick(folder, filt_=''):
    fs = [folder + '/' + f for f in sorted(os.listdir(os.path.join(VCSL, folder))) if f.endswith('.wav') and filt_ in f]
    return lambda: fs[int(rng.integers(len(fs)))]
TIMP = pick('Membranophones/Struck Membranophones/Timpani 1/Hit', 'v4')
BD = pick('Membranophones/Struck Membranophones/Bass Drum 1', 'v7')
SN = pick('Membranophones/Struck Membranophones/Snare Drum, Modern 1', 'HitNS_v6')
ANVIL = pick('Idiophones/Struck Idiophones/Anvil', 'v3')
BELL = 'Idiophones/Struck Idiophones/Tubular Bells 1/chimes_D4_ff_rr2.wav'
GONG = 'Idiophones/Struck Idiophones/Gong 1/' + sorted(os.listdir(os.path.join(VCSL, 'Idiophones/Struck Idiophones/Gong 1')))[-1]
CRASH = 'Idiophones/Struck Idiophones/Clash Cymbals 1/cymbal_crash1_ff2.wav'
def timp(t, v=1.0, semis=0): place('perc', repitch(load(TIMP()), semis), t, 0.8 * v, 0, 2.5, 1.0)
def taiko(t, v=1.0, semis=-3): place('perc', repitch(load(BD()), semis), t, 1.05 * v, rng.uniform(-0.2, 0.2), 1.6, 0.6)
def bd(t, v=1.0): place('drums', load(BD()), t, 1.0 * v, 0, 1.5, 0.6)
def sn(t, v=1.0, pan=0.1): place('drums', load(SN()), t, 0.55 * v, pan, 0.6, 0.3)
def anvil(t, v=1.0): place('drums', load(ANVIL()), t, 0.35 * v, -0.2, 0.8, 0.4)
def bell(t, v=1.0, semis=0): place('fx', repitch(load(BELL), semis), t, 0.35 * v, 0.2, 5, 2)
def gong(t, v=1.0): place('fx', load(GONG), t, 0.55 * v, 0, 9, 3)
def crash(t, v=1.0): place('fx', load(CRASH), t, 0.4 * v, 0, 5, 2.5)

# ---------------------------------------------------------------- synths
def saws(m, n, dets, tt, wobble=0.0):
    x = np.zeros(n)
    for k, d in enumerate(dets):
        f = mtof(m) * 2 ** (d / 12) * (1 + wobble * np.sin(2 * np.pi * (4.3 + k * 0.7) * tt))
        x += 2 * ((np.cumsum(f) / SR + rng.random()) % 1) - 1
    return x / len(dets)

def strings(notes, t, length, v=1.0, fc=2200, attack=0.8, b='pad'):
    n = int(length * SR); tt = np.arange(n) / SR; out = np.zeros((n, 2))
    for i, m in enumerate(notes):
        out[:, 0] += saws(m, n, (-0.11, 0.03), tt, 0.002); out[:, 1] += saws(m, n, (-0.04, 0.09), tt, 0.002)
    e = np.minimum(1, tt / attack) * np.minimum(1, (length - tt) / 1.0)
    place(b, filt(out, 80, fc) * e[:, None] / len(notes), t, 0.75 * v)

def choir(notes, t, length, v=1.0, attack=1.0):
    """'aah' pad: saws through two vowel formants."""
    n = int(length * SR); tt = np.arange(n) / SR; out = np.zeros((n, 2))
    for m in notes:
        for c in (0, 1): out[:, c] += saws(m, n, (-0.08 + 0.05 * c, 0.07 - 0.04 * c), tt, 0.004)
    a = filt(out, 600, 1100) * 1.6 + filt(out, 1000, 1500) * 0.9 + filt(out, 2400, 3000) * 0.4
    e = np.minimum(1, tt / attack) * np.minimum(1, (length - tt) / 1.2)
    place('pad', a * e[:, None] / len(notes), t, 0.9 * v)

def ost(m, t, v=1.0, pan=0.0, length=0.18):
    n = int(length * SR); tt = np.arange(n) / SR
    x = filt(saws(m, n, (-0.06, 0.06), tt), None, 3200) * np.exp(-tt / 0.06) * np.minimum(1, tt / 0.004)
    place('ost', x, t, 0.4 * v, pan)

def braam(m, t, length=2.8, v=1.0):
    n = int(length * SR); tt = np.arange(n) / SR
    x = np.tanh((saws(m, n, (-0.15, 0, 0.12), tt) + 0.5 * saws(m + 12, n, (-0.1, 0.1), tt)) * 2.5)
    y = np.zeros(n); blk = 2205
    for i in range(0, n, blk):
        seg = x[max(0, i - blk): i + 2 * blk]; ff = filt(seg, None, 280 + 2600 * np.exp(-(i / SR) / 0.55))
        y[i:i + blk] = ff[min(blk, i): min(blk, i) + len(y[i:i + blk])]
    place('fx', y * np.minimum(1, tt / 0.04) * np.exp(-tt / 1.5), t, 0.6 * v)

def sub(m, t, length, v=1.0, glide=None):
    n = int(length * SR); tt = np.arange(n) / SR; f = np.full(n, mtof(m))
    if glide is not None:
        g = int(min(0.12, length / 2) * SR); f[:g] = np.linspace(mtof(glide), mtof(m), g)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, tt / 0.005) * np.minimum(1, (length - tt) / 0.04)
    place('bass', x, t, 0.6 * v)

def bass808(m, t, length, v=1.0, glide=None):
    n = int(length * SR); tt = np.arange(n) / SR; f = np.full(n, mtof(m))
    if glide is not None:
        g = int(min(0.12, length * 0.5) * SR); f[:g] = np.linspace(mtof(glide), mtof(m), g)
    x = np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * 2.4) * np.minimum(1, tt / 0.004) * np.minimum(1, (length - tt) / 0.03)
    place('bass', x, t, 0.62 * v)

def kick(t, v=1.0, punch=1.0):
    n = int(0.45 * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * np.cumsum(45 + 110 * punch * np.exp(-tt * 28)) / SR) * np.exp(-tt / 0.22)
    x[:200] += rng.standard_normal(200) * np.linspace(0.5, 0, 200)
    place('drums', np.tanh(x * 2.2), t, 0.95 * v)

def clap(t, v=1.0):
    n = int(0.25 * SR); x = np.zeros(n)
    for k, d in enumerate((0, 0.011, 0.022)):
        i = int(d * SR); m = n - i; tt = np.arange(m) / SR
        x[i:] += rng.standard_normal(m) * np.exp(-tt / (0.012 if k < 2 else 0.09))
    place('drums', filt(x, 900, 5000) * 1.3, t, 0.75 * v, 0.05)

def hat(t, v=1.0, open_=False, pan=0.15):
    n = int((0.25 if open_ else 0.05) * SR); tt = np.arange(n) / SR
    place('drums', filt(rng.standard_normal(n), 7000) * np.exp(-tt / (0.08 if open_ else 0.015)), t, 0.3 * v, pan)

def cowbell(m, t, v=1.0, length=0.3, dist=0.0):
    n = int(length * SR); tt = np.arange(n) / SR; f = mtof(m)
    x = np.sign(np.sin(2 * np.pi * f * tt)) * 0.6 + np.sign(np.sin(2 * np.pi * f * 1.44 * tt)) * 0.4
    x = filt(x, 400, 4500) * np.exp(-tt / 0.09) * np.minimum(1, tt / 0.001)
    if dist: x = np.tanh(x * (1 + dist * 6)) * 0.8
    place('lead', x, t, 0.5 * v)

def koto(m, t, v=1.0, pan=0.0, decay=0.996, length=2.5):
    """plucked string (Karplus-Strong), bright attack like a koto / guzheng."""
    n = int(length * SR); D = max(2, int(SR / mtof(m))); y = np.zeros(n + D + 2)
    y[1:D + 1] = rng.uniform(-1, 1, D)
    for k in range(D + 1, n + 1, D):                       # each period is the averaged, decayed previous one
        e = min(k + D, n + 1); y[k:e] = decay * 0.5 * (y[k - D:e - D] + y[k - D - 1:e - D - 1])
    y = y[1:]
    x = filt(y[:n], 120, 6000)
    place('pluck', x * np.minimum(1, (length - np.arange(n) / SR) / 0.3), t, 0.55 * v, pan)

def flute(m, t, length, v=1.0, pan=0.0, vib=True):
    n = int(length * SR); tt = np.arange(n) / SR
    vibr = 1 + (0.006 * np.sin(2 * np.pi * 5.2 * tt) * np.clip((tt - 0.25) / 0.4, 0, 1) if vib else 0)
    ph = 2 * np.pi * np.cumsum(mtof(m) * vibr) / SR
    x = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    breath = filt(rng.standard_normal(n), mtof(m) * 0.8, mtof(m) * 3) * 0.12
    e = np.minimum(1, tt / 0.09) * np.minimum(1, (length - tt) / 0.15)
    place('lead', (x + breath) * e, t, 0.3 * v, pan)

def supersaw(m, t, length, v=1.0, pan=0.0, fc=5200):
    n = int(length * SR); tt = np.arange(n) / SR
    x = np.stack([saws(m, n, (-0.2, -0.1, 0, 0.12), tt), saws(m, n, (-0.15, 0.04, 0.1, 0.2), tt)], 1)
    e = np.minimum(1, tt / 0.01) * np.minimum(1, (length - tt) / 0.06) * (0.75 + 0.25 * np.exp(-tt / 0.2))
    place('lead', filt(x, 150, fc) * e[:, None], t, 0.32 * v, pan)

def powerchord(root, t, length, v=1.0):
    """distorted 'guitar' power chord: root, fifth, octave."""
    n = int(length * SR); tt = np.arange(n) / SR
    x = sum(saws(m, n, (-0.07, 0.07), tt) for m in (root, root + 7, root + 12))
    x = filt(np.tanh(x * 4.0), 90, 3800) * np.minimum(1, tt / 0.005) * np.minimum(1, (length - tt) / 0.03)
    place('ost', np.stack([x, np.roll(x, 300)], 1), t, 0.22 * v)

def riser(t_end, length, v=1.0):
    n = int(length * SR); tt = np.arange(n) / SR
    x = filt(rng.standard_normal(n) * (tt / length) ** 2.5, 1200)
    x += np.sin(2 * np.pi * np.cumsum(120 + 900 * (tt / length) ** 2) / SR) * 0.25 * (tt / length) ** 2
    place('fx', x, t_end - length, 0.5 * v)

def reverse_swell(t_end, length=1.5, v=1.0):
    n = int(length * SR); tt = np.arange(n) / SR
    x = filt(rng.standard_normal(n), 300, 6000) * (tt / length) ** 3
    place('fx', np.stack([x, np.roll(x, 500)], 1), t_end - length, 0.35 * v)

def whoosh(t, v=1.0):
    n = int(0.6 * SR); tt = np.arange(n) / SR
    place('fx', filt(rng.standard_normal(n) * np.sin(np.pi * tt / 0.6) ** 2, 800), t - 0.3, 0.25 * v)

def boom(t, v=1.0):
    n = int(3.0 * SR); tt = np.arange(n) / SR
    place('bass', np.sin(2 * np.pi * np.cumsum(28 + 55 * np.exp(-tt * 7)) / SR) * np.exp(-tt / 0.9), t, 1.0 * v)

def hit(t, v=1.0, root=38):
    """the big trailer hit: boom, gong/crash, taiko, braam."""
    boom(t, 1.1 * v); crash(t, 0.9 * v); taiko(t, 1.0 * v); timp(t, 1.0 * v); braam(root, t, 3.2, 0.9 * v)

# ---------------------------------------------------------------- shared harmony (D minor)
# one chord per bar: Dm  Bb  F  C | Dm  Bb  Gm  A
ROOTS = [38, 34, 41, 36, 38, 34, 31, 33]
CHORDS = [[62, 65, 69], [62, 65, 70], [60, 65, 69], [60, 64, 67], [62, 65, 69], [62, 65, 70], [62, 67, 70], [61, 64, 69]]
THEME = [(0, 74, 1.5), (1.5, 72, 0.5), (2, 69, 2), (4, 70, 1), (5, 69, 1), (6, 65, 2),
         (8, 69, 1.5), (9.5, 67, 0.5), (10, 65, 2), (12, 64, 1), (13, 65, 1), (14, 62, 2)]     # (beat, midi, beats) over 4 bars
PENTA = [62, 65, 67, 69, 72, 74, 77, 79, 81]                                                   # D minor pentatonic
def chord(bar): return ROOTS[int(bar) % 8], CHORDS[int(bar) % 8]
def theme(bar0, fn, octave=0, bars=4):
    for b, m, d in THEME:
        if b < bars * 4: fn(m + octave, at(bar0, b), d * BEAT)

# ---------------------------------------------------------------- styles
def style_orchestral():
    for b in range(2):                                      # hub: piano + soft strings
        r, c = chord(b); strings([r + 12] + c, at(b), BAR + 0.8, 0.45, 1400, 1.5); piano(r + 12, at(b), 0.6, BAR, 2)
        for k, m in enumerate([c[0], c[1], c[2], c[1] + 12]): piano(m + 12, at(b, k), 0.35, 2.0, 2, 0.2)
    bell(at(2), 0.8); timp(at(2), 0.5)
    for b in range(2, 9):                                   # world: harp arpeggios, theme on piano
        r, c = chord(b); strings([r, r + 12] + c, at(b), BAR + 0.6, 0.55 + 0.05 * (b - 2), 1800 + 200 * (b - 2), 1.0)
        sub(r - 12, at(b), BAR, 0.4)
        for k in range(8): harp([c[0], c[1], c[2], c[1] + 12][k % 4] + (12 if k >= 4 else 0) - 12, at(b, k / 2), 0.7, -0.3 + 0.08 * k)
        if b >= 5: timp(at(b), 0.5); timp(at(b, 2), 0.3)
    theme(2, lambda m, t, d: piano(m, t, 0.8, d + 1.2, 3, 0.1)); theme(6, lambda m, t, d: piano(m, t, 0.85, d + 1.2, 3, 0.1), 0, 3)
    for b in np.arange(8.75, 11, 0.25):                     # build: string ostinato, rising drums
        r, _ = chord(b)
        for k in range(4): ost(r + 12 + (12 if k % 2 else 0), at(b) + k * BEAT / 4, 0.6 + 0.1 * (b - 8.75))
    for b in range(9, 11):
        r, c = chord(b); strings([r + 12] + c, at(b), BAR + 0.3, 0.8, 3000, 0.6)
        for k in range(4): taiko(at(b, k), 0.45 + 0.15 * (b - 9) + 0.05 * k)
    riser(at(11), 3.0)
    for b in range(11, 13):                                 # action: braams, hybrid drums, ostinato
        r, c = chord(b); braam(r, at(b), 2.9); strings([r + 12] + c, at(b), BAR + 0.2, 0.9, 3800, 0.2)
        for k in range(4):
            taiko(at(b, k), 0.9); sn(at(b, k + 0.5), 0.6)
            for s in range(4): ost(r + 12 + (12 if s == 2 else 0), at(b, k + s / 4), 0.85)
        sub(r - 12, at(b), BAR, 0.8); anvil(at(b, 1.5)); anvil(at(b, 3.5))
        if b == 12:
            for s in range(8): sn(at(b, 2 + s / 4), 0.3 + 0.08 * s)
    reverse_swell(at(13), 1.5)
    hit(at(13), 1.1)                                        # the bridge
    for b in range(13, 17):
        r, c = chord(b - 13); choir([r + 24] + c, at(b), BAR + 0.8, 0.8, 0.6); strings([r, r + 12] + c, at(b), BAR + 0.5, 0.9, 3200, 0.4)
        sub(r - 12, at(b), BAR, 0.6); timp(at(b), 0.6); timp(at(b, 2), 0.4)
    theme(13, lambda m, t, d: strings([m, m + 12], t, d + 0.3, 0.55, 4200, 0.12, 'lead'))
    bell(at(15, 2.6), 0.7)
    hit(at(17), 0.9); piano(62, at(17), 0.8, 4, 4); piano(50, at(17), 0.8, 4, 4)

def style_phonk():
    STEP = BEAT / 4 / 2                                     # 160 BPM sixteenths = 2 per 80 BPM sixteenth
    MEL = [0, None, 0, None, 3, None, 0, None, 5, None, 3, None, 0, None, 7, 5,
           0, None, 0, None, 3, None, 0, None, 8, None, 7, None, 5, None, 3, None]
    PR = [0, -4, -2, -5]
    def mel(bar, v=1.0, octave=0, dist=0.0):                # one 80 BPM bar = two 160 BPM bars = 32 steps
        root = 74 + PR[int(bar) % 4]
        for i, s in enumerate(MEL):
            if s is not None: cowbell(root + s + octave, at(bar) + i * STEP, v * (1.0 if i % 4 == 0 else 0.8), dist=dist)
    def drums(bar, hard=False):
        for half in (0, 1):
            t0 = at(bar) + half * BAR / 2
            for s in (0, 6, 10): kick(t0 + s * STEP, 1.0 if s == 0 else 0.85)
            if hard: kick(t0 + 14 * STEP, 0.7)
            clap(t0 + 4 * STEP); clap(t0 + 12 * STEP)
            for s in range(0, 16, 2): hat(t0 + s * STEP, 1.0 if s % 4 == 0 else 0.7)
            if hard:
                for s in range(1, 16, 2): hat(t0 + s * STEP, 0.45)
            if half: [hat(t0 + 12 * STEP + k * STEP * 4 / 6, 0.5 + 0.08 * k) for k in range(6)]
    def bass(bar):
        root = 38 + PR[int(bar) % 4]
        for half in (0, 1):
            t0 = at(bar) + half * BAR / 2
            bass808(root, t0, 6 * STEP, glide=root + 12 if half == 0 else None); bass808(root, t0 + 10 * STEP, 4 * STEP)
            bass808(root + 12 if half else root, t0 + 14 * STEP, 2 * STEP, glide=root)
    for b in range(2): mel(b, 0.55)                         # hub: filtered cowbell melody (filtered in the mix)
    riser(at(2), 3.0, 0.8)
    for b in range(2, 9):
        drums(b, False); bass(b); mel(b, 0.8 if b < 5 else 0.95)
    for b in range(9, 11):
        bass(b); mel(b, 0.9, 12, 0.3)
        for k in range(8): kick(at(b, k / 2), 0.5 + 0.06 * k)
    riser(at(11), 3.0)
    for b in range(11, 13): drums(b, True); bass(b); mel(b, 1.0, 12, 0.6); mel(b, 0.45)
    hit(at(13), 1.1)
    for b in range(13, 17): drums(b, True); bass(b); mel(b, 1.0, 12, 0.6); mel(b, 0.5)
    for b in (13, 15): crash(at(b), 0.8)
    hit(at(17), 0.9); bass808(26, at(17), 3.5, glide=38)
    return lambda name, x: lowsweep(x, 0, at(2), 500, 7000) if name == 'lead' else x

def style_eastern():
    MEL = [(0, 74, 1), (1, 77, 0.5), (1.5, 79, 0.5), (2, 81, 1.5), (3.5, 79, 0.5), (4, 77, 1), (5, 74, 1), (6, 72, 1), (7, 74, 1),
           (8, 81, 1), (9, 84, 0.5), (9.5, 81, 0.5), (10, 79, 1.5), (11.5, 77, 0.5), (12, 79, 1), (13, 77, 0.5), (13.5, 74, 0.5), (14, 74, 2)]
    def melody(bar0, fn, octave=0):
        for b, m, d in MEL: fn(m + octave, at(bar0, b), d * BEAT)
    for b in range(2):                                      # hub: koto arpeggios and a lone flute
        r, c = chord(b); strings([r + 12, r + 19], at(b), BAR + 1, 0.35, 1200, 1.5)
        for k in range(8): koto(PENTA[[0, 2, 3, 5, 4, 3, 2, 1][k]] - 12, at(b, k / 2), 0.55, -0.4 + 0.1 * k)
    flute(81, at(0, 2), 2.2, 0.8); flute(79, at(1, 0), 1.0, 0.8); flute(77, at(1, 1.5), 1.5, 0.8)
    gong(at(2), 0.6)
    for b in range(2, 9):
        r, c = chord(b); strings([r, r + 12] + c, at(b), BAR + 0.6, 0.5, 2000, 1.0); sub(r - 12, at(b), BAR, 0.45)
        for k in range(8): koto(PENTA[[0, 3, 5, 3, 4, 2, 3, 1][k]] - 12 + (0 if b % 2 == 0 else -2 if k % 3 == 0 else 0), at(b, k / 2), 0.5, -0.3 + 0.08 * k)
        if b >= 4: taiko(at(b), 0.6); taiko(at(b, 2.5), 0.4); taiko(at(b, 3), 0.5)
    melody(3, lambda m, t, d: flute(m, t, d + 0.1, 1.0, 0.1)); melody(7, lambda m, t, d: flute(m, t, d + 0.1, 1.0, 0.1))
    for b in range(9, 11):
        r, c = chord(b); strings([r + 12] + c, at(b), BAR + 0.3, 0.8, 3200, 0.6)
        for k in range(8): taiko(at(b, k / 2), 0.4 + 0.07 * k + 0.2 * (b - 9))
        for k in range(16): koto(PENTA[[0, 3, 5, 3][k % 4]], at(b, k / 4), 0.4)
    riser(at(11), 3.0)
    for b in range(11, 13):                                 # action: taiko ensemble, koto ostinato, braams
        r, c = chord(b); braam(r, at(b), 2.9, 0.8)
        for k in range(4):
            taiko(at(b, k), 1.0); taiko(at(b, k + 0.5), 0.5); taiko(at(b, k + 0.75), 0.6)
        for k in range(16): koto(PENTA[[0, 3, 5, 6][k % 4]], at(b, k / 4), 0.6, 0.2 * ((k % 2) * 2 - 1))
        sub(r - 12, at(b), BAR, 0.8); strings([r + 12] + c, at(b), BAR, 0.9, 4000, 0.2)
    hit(at(13), 1.1); gong(at(13), 1.0)
    for b in range(13, 17):
        r, c = chord(b - 13); choir([r + 24] + c, at(b), BAR + 0.8, 0.7, 0.6); strings([r, r + 12] + c, at(b), BAR + 0.5, 0.85, 3000, 0.4)
        taiko(at(b), 0.7); taiko(at(b, 2), 0.5); sub(r - 12, at(b), BAR, 0.6)
        for k in range(8): koto(PENTA[[0, 3, 5, 3, 4, 2, 3, 1][k]], at(b, k / 2), 0.4, -0.3 + 0.08 * k)
    melody(13, lambda m, t, d: flute(m, t, d + 0.1, 1.1, 0.1)); melody(15, lambda m, t, d: flute(m - 12, t, d + 0.1, 0.9, -0.1))
    hit(at(17), 0.9); gong(at(17), 0.8); koto(74, at(17), 0.8, 0, 0.998, 4)

def style_anime():
    E = BEAT / 2                                            # eighth notes; drums play double-time (160 BPM feel)
    def rock_drums(bar, v=1.0, fill=False):
        for k in range(8):
            t = at(bar) + k * E
            if k % 4 == 0 or k == 3 or k == 6: kick(t, 0.95 * v)
            if k % 4 == 2: sn(t, 0.85 * v)
            hat(t, 0.8 * v, k == 7)
        if fill:
            for s in range(8): sn(at(bar, 2) + s * BEAT / 4, 0.4 + 0.08 * s, -0.3 + 0.08 * s)
    for b in range(2):                                      # hub: solo piano, the theme
        r, c = chord(b); piano(r + 12, at(b), 0.6, BAR, 2)
    theme(0, lambda m, t, d: piano(m, t, 0.85, d + 1.0, 3, 0.1), 0, 2)
    crash(at(2), 0.7); riser(at(2), 1.5, 0.6)
    for b in range(2, 9):                                   # verse: driving eighths, power chords, piano
        r, c = chord(b); rock_drums(b, 0.7 if b < 5 else 0.85, b == 8)
        for k in range(8): powerchord(r, at(b) + k * E, E * 0.9, 0.6 if b < 5 else 0.8); sub(r - 12 + 12, at(b) + k * E, E * 0.9, 0.5)
        for k in range(4): piano(c[k % 3] + 12, at(b, k), 0.45, 1.0, 2)
    theme(4, lambda m, t, d: supersaw(m, t, d, 0.8, 0.1, 4200))
    for b in range(9, 11):                                  # pre-chorus: half-time, rising
        r, c = chord(b); strings([r + 12] + c, at(b), BAR + 0.3, 0.8, 3600, 0.4)
        for k in range(4): kick(at(b, k), 0.8); sn(at(b, k + 0.5), 0.3 + 0.1 * k)
        for k in range(16): ost(r + 24 + (7 if k % 4 == 2 else 0), at(b, k / 4), 0.7)
    riser(at(11), 3.0)
    for b in range(11, 13):                                 # action: full band
        r, c = chord(b); rock_drums(b, 1.0, b == 12)
        for k in range(8): powerchord(r, at(b) + k * E, E * 0.9, 1.0); sub(r, at(b) + k * E, E * 0.9, 0.6)
        crash(at(b), 0.6)
    theme(11, lambda m, t, d: supersaw(m + 12, t, d, 1.0, 0.1, 6000), 0, 2)
    hit(at(13), 1.0)
    for b in range(13, 17):                                 # chorus on the bridge: big theme
        r, c = chord(b - 13); rock_drums(b, 1.0, b == 16)
        for k in range(8): powerchord(r, at(b) + k * E, E * 0.9, 0.9); sub(r, at(b) + k * E, E * 0.9, 0.55)
        strings([r + 12] + c, at(b), BAR + 0.3, 0.8, 4200, 0.3)
        if b % 2 == 1: crash(at(b), 0.6)
    theme(13, lambda m, t, d: supersaw(m + 12, t, d, 1.0, 0.1, 6500))
    hit(at(17), 0.9); powerchord(38, at(17), 2.5, 1.0); piano(74, at(17), 0.8, 4, 4)

def style_trap():
    S = BEAT / 4
    def trap(bar, v=1.0, rolls=True):
        kick(at(bar), 1.0 * v, 0.8); kick(at(bar, 1.75), 0.8 * v, 0.8); kick(at(bar, 2.5), 0.9 * v, 0.8)
        clap(at(bar, 1)); clap(at(bar, 3)); sn(at(bar, 1), 0.4); sn(at(bar, 3), 0.4)
        for k in range(16):
            if rolls and k in (6, 14):
                for r in range(3): hat(at(bar) + k * S + r * S / 3, 0.55 * v)
            elif rolls and k == 11:
                for r in range(4): hat(at(bar) + k * S + r * S / 4, (0.35 + 0.1 * r) * v)
            else: hat(at(bar) + k * S, (0.9 if k % 4 == 0 else 0.6) * v, pan=0.25)
    for b in range(2):                                      # hub: dark choir and a bell
        r, c = chord(b); choir([r + 12] + c, at(b), BAR + 1, 0.55, 1.5)
    bell(at(0), 0.6, -12); bell(at(1, 2), 0.4, -12)
    reverse_swell(at(2), 1.5)
    for b in range(2, 9):
        r, c = chord(b); trap(b, 0.75 if b < 5 else 0.9, b >= 4); bass808(r - 12 + 12, at(b), BEAT * 1.75, glide=r + 12 if b % 2 else None)
        bass808(r - 12 + 12, at(b, 2.5), BEAT * 1.5)
        strings([r + 12] + c, at(b), BAR + 0.5, 0.55, 1800, 0.8)
        if b >= 5:
            for k in range(8): ost(c[k % 3] + 12, at(b, k / 2), 0.45)
    theme(5, lambda m, t, d: piano(m, t, 0.8, d + 1.0, 3, 0.1), 0, 3)
    for b in range(9, 11):
        r, c = chord(b); choir([r + 12] + c, at(b), BAR + 0.3, 0.8, 0.5); braam(r, at(b), 2.5, 0.5 + 0.3 * (b - 9))
        for k in range(8): hat(at(b, k / 2), 0.4 + 0.05 * k)
    riser(at(11), 3.0)
    for b in range(11, 13):
        r, c = chord(b); trap(b, 1.0); bass808(r, at(b), BEAT * 1.75, glide=r + 12); bass808(r, at(b, 2.5), BEAT * 1.5)
        braam(r, at(b), 2.9, 0.9); strings([r + 12] + c, at(b), BAR, 0.9, 4000, 0.2)
        for k in range(16): ost(r + 24 + (12 if k % 4 == 3 else 0), at(b, k / 4), 0.75)
    hit(at(13), 1.15)
    for b in range(13, 17):
        r, c = chord(b - 13); trap(b, 1.0); bass808(r, at(b), BEAT * 1.75, glide=r + 12 if b % 2 else None); bass808(r, at(b, 2.5), BEAT * 1.5)
        choir([r + 24] + c, at(b), BAR + 0.6, 0.85, 0.5); strings([r + 12] + c, at(b), BAR + 0.3, 0.7, 3500, 0.4)
    theme(13, lambda m, t, d: piano(m + 12, t, 0.9, d + 0.8, 4, 0.15))
    hit(at(17), 0.9); bass808(26, at(17), 3.5, glide=38)

def lowsweep(x, t0, t1, f0, f1):
    out = x.copy(); blk = int(0.05 * SR)
    for i in range(int(t0 * SR), int(t1 * SR), blk):
        p = (i / SR - t0) / (t1 - t0); seg = x[max(0, i - blk): i + 2 * blk]
        y = filt(seg, None, f0 * (f1 / f0) ** p); out[i:i + blk] = y[min(blk, i): min(blk, i) + len(out[i:i + blk])]
    return out

post = {'orchestral': style_orchestral, 'phonk': style_phonk, 'eastern': style_eastern, 'anime': style_anime, 'trap': style_trap}[STYLE]()

# ---------------------------------------------------------------- mix
for name in BUSES:
    if post: bus[name] = post(name, bus[name])
GAP = slice(int((at(13) - 0.3) * SR), int(at(13) * SR))             # a breath of silence right before the hit
for name in ('keys', 'pluck', 'lead', 'drums', 'perc', 'bass', 'ost', 'pad'): bus[name][GAP] *= np.linspace(1, 0.05, GAP.stop - GAP.start)[:, None]

def reverb(x, seconds=2.4, mix=0.25):
    n = int(seconds * SR); tt = np.arange(n) / SR
    ir = np.stack([rng.standard_normal(n), rng.standard_normal(n)], 1) * np.exp(-tt / (seconds / 6.9))[:, None]
    ir = filt(ir, 200, 7000); ir /= np.sqrt(np.sum(ir ** 2, 0))
    L = len(x) + n; F = 1 << (L - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, F, axis=0) * np.fft.rfft(ir, F, axis=0), F, axis=0)[: len(x)]
    return x + y * mix

kick_env = np.convolve(np.abs(bus['drums'][:, 0]) + np.abs(bus['bass'][:, 0]) * 0.3, np.ones(441) / 441, 'same')
duck = 1 - 0.35 * np.clip(kick_env / (kick_env.max() + 1e-9) * 3, 0, 1)
wet = reverb(bus['keys'] * 0.9 + bus['pluck'] * 0.9 + bus['pad'] * 0.8 + bus['lead'] * 0.85 + bus['ost'] * 0.7 + bus['fx'] * 0.8, 2.6, 0.3)
mix = wet * duck[:, None] + bus['drums'] * 0.85 + bus['perc'] * 0.9 + bus['bass'] * 0.8 * duck[:, None]
mix = filt(mix, 28)
mix = mix[: int((LENGTH + 0.25) * SR)]
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.8) / np.tanh(1.8)
f = int(2.2 * SR); mix[-f:] *= (np.linspace(1, 0, f) ** 2)[:, None]
mix *= 0.93 / (np.max(np.abs(mix)) + 1e-9)
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('wrote', OUT, STYLE, round(len(mix) / SR, 2), 's')
