"""Cinematic trailer score for the OVERTHRONE TikTok intro v3: calm and warm for the world tour,
hybrid epic drums for the combat, a big logo hit at the end. 80 BPM (1 bar = 3 s), 16 bars = 48 s.

    python3 make_cinematic.py <VCSL folder> <out.wav>

Real instruments from VCSL (CC0): Kawai grand piano, concert harp, timpani, concert bass drum,
modern snare, anvil, tubular bells, gong, clash cymbals. Strings, choir-like pad, braams and the
sub bass are synthesised. Everything is free to use anywhere.

  bars 0-7.5   world: piano motif, harp arpeggios, string pad; timpani + bells join from bar 4
  bar 7.5-8    riser, half a bar of near silence
  bars 8-13    combat: braams, double-time hybrid drums, string ostinato, sub
  bars 13-16   logo hit, ring-out, piano motif
"""
import os, subprocess, sys, wave
import numpy as np

VCSL, OUT = sys.argv[1], sys.argv[2]
SR = 44100
BPM = 80; BEAT = 60 / BPM; BAR = 4 * BEAT
WORLD_END, COMBAT, LOGO, END = 7.5, 8, 13, 16
N = int(SR * (END * BAR + 2))
rng = np.random.default_rng(80)
bus = {k: np.zeros((N, 2)) for k in ('piano', 'harp', 'pad', 'drums', 'perc', 'fx', 'bass', 'ost')}

def at(bar, beat=0.0): return bar * BAR + beat * BEAT

# ---------------------------------------------------------------- samples
_cache = {}
def load(rel):
    if rel not in _cache:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(VCSL, rel), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                             capture_output=True, check=True).stdout
        x = np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)
        _cache[rel] = x / (np.max(np.abs(x)) + 1e-9)
    return _cache[rel]

def place(b, x, t, g=1.0, pan=0.0, length=None, fade=0.08):
    if length is not None:
        n = int(length * SR)
        if len(x) > n:
            x = x[:n].copy(); f = min(int(fade * SR), n); x[-f:] *= np.linspace(1, 0, f)[:, None]
    i = int(t * SR)
    if i >= N or i < 0: return
    x = x[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[b][i:i + len(x), 0] += x[:, 0] * g * l * 1.41
    bus[b][i:i + len(x), 1] += x[:, 1] * g * r * 1.41

def repitch(x, semis):
    if abs(semis) < 1e-6: return x
    r = 2 ** (semis / 12); idx = np.arange(0, len(x) - 1, r)
    return np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in (0, 1)], 1)

NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
def bank(folder, parse):
    out = {}
    for f in sorted(os.listdir(os.path.join(VCSL, folder))):
        r = parse(f)
        if r: out.setdefault(r[0], {}).setdefault(r[1], []).append(folder + '/' + f)
    return out

def piano_parse(f):
    # GPiano_sus_A#3_v2_rr1_Player.wav
    p = f.split('_')
    if len(p) < 4 or not p[2][:-1].replace('-', '') and False: return None
    name = p[2]; oct_ = name.lstrip('ABCDEFG#')
    try: m = 12 * (int(oct_) + 1) + NOTE[name[: len(name) - len(oct_)]]
    except Exception: return None
    return m, int(p[3][1:])
PIANO = bank('Chordophones/Zithers/Grand Piano, Kawai/Sustains', piano_parse)

def harp_parse(f):
    # KSHarp_A2_f1.wav
    p = f.replace('.wav', '').split('_')
    if len(p) < 3: return None
    name = p[1]; oct_ = name.lstrip('ABCDEFG#')
    try: m = 12 * (int(oct_) + 1) + NOTE[name[: len(name) - len(oct_)]]
    except Exception: return None
    return m, 2 if p[2].startswith('f') else 1
HARP = bank('Chordophones/Composite Chordophones/Concert Harp', harp_parse)

def nearest(b, m, vel):
    k = min(b, key=lambda x: abs(x - m))
    vs = b[k]; v = min(vs, key=lambda x: abs(x - vel))
    return vs[v][int(rng.integers(len(vs[v])))], m - k

def piano(m, t, v=1.0, length=4.0, vel=3, pan=0.0):
    f, s = nearest(PIANO, m, vel)
    place('piano', repitch(load(f), s), t, 0.55 * v, pan, length, 0.6)

def harp(m, t, v=1.0, pan=0.0):
    f, s = nearest(HARP, m, 1)
    place('harp', repitch(load(f), s), t, 0.45 * v, pan, 3.0, 0.8)

def pick(folder, filt=''):
    fs = [folder + '/' + f for f in sorted(os.listdir(os.path.join(VCSL, folder))) if f.endswith('.wav') and filt in f]
    return lambda: fs[int(rng.integers(len(fs)))]
TIMP = pick('Membranophones/Struck Membranophones/Timpani 1/Hit', 'v4')
BD = pick('Membranophones/Struck Membranophones/Bass Drum 1', 'v7')
SN = pick('Membranophones/Struck Membranophones/Snare Drum, Modern 1', 'HitNS_v6')
ANVIL = pick('Idiophones/Struck Idiophones/Anvil', 'v3')
BELL = 'Idiophones/Struck Idiophones/Tubular Bells 1/chimes_D4_ff_rr2.wav'
GONG = 'Idiophones/Struck Idiophones/Gong 1/' + sorted(os.listdir(os.path.join(VCSL, 'Idiophones/Struck Idiophones/Gong 1')))[-1]
CRASH = 'Idiophones/Struck Idiophones/Clash Cymbals 1/cymbal_crash1_ff2.wav'

def timp(t, v=1.0, semis=0): place('perc', repitch(load(TIMP()), semis), t, 0.8 * v, 0, 2.5, 1.0)
def bd(t, v=1.0): place('drums', load(BD()), t, 1.0 * v, 0, 1.5, 0.6)
def sn(t, v=1.0): place('drums', load(SN()), t, 0.55 * v, 0.1, 0.6, 0.3)
def anvil(t, v=1.0): place('drums', load(ANVIL()), t, 0.35 * v, -0.2, 0.8, 0.4)
def bell(t, v=1.0, semis=0): place('fx', repitch(load(BELL), semis), t, 0.35 * v, 0.2, 5, 2)
def gong(t, v=1.0): place('fx', load(GONG), t, 0.5 * v, 0, 8, 3)
def crash(t, v=1.0): place('fx', load(CRASH), t, 0.4 * v, 0, 5, 2.5)

# ---------------------------------------------------------------- synths
def lowpass(x, fc):
    X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / (1 + (f / fc) ** 4)[:, None] if X.ndim == 2 else X / (1 + (f / fc) ** 4), len(x), axis=0)

def mtof(m): return 440 * 2 ** ((m - 69) / 12)

def strings(notes, t, length, v=1.0, fc=2200, attack=0.8):
    """warm string ensemble: detuned saws, slow attack, low-passed, stereo spread."""
    n = int(length * SR); tt = np.arange(n) / SR
    out = np.zeros((n, 2))
    for m in notes:
        for k, det in enumerate((-0.11, -0.04, 0.03, 0.09)):
            f = mtof(m) * 2 ** (det / 12) * (1 + 0.002 * np.sin(2 * np.pi * (4.7 + k) * tt))
            ph = np.cumsum(f) / SR + rng.random()
            saw = 2 * (ph % 1) - 1
            out[:, k % 2] += saw
    e = np.minimum(1, tt / attack) * np.minimum(1, (length - tt) / 1.0)
    out = lowpass(out, fc) * e[:, None] / (len(notes) * 2)
    place('pad', out, t, 0.6 * v)

def braam(m, t, length=2.6, v=1.0):
    n = int(length * SR); tt = np.arange(n) / SR
    x = np.zeros(n)
    for det in (-0.15, 0, 0.12):
        for mult in (1, 2):
            ph = np.cumsum(np.full(n, mtof(m) * mult * 2 ** (det / 12))) / SR
            x += (2 * (ph % 1) - 1) / mult
    x = np.tanh(x * 1.5)
    # filter opens then closes
    e = np.minimum(1, tt / 0.05) * np.exp(-tt / 1.4)
    y = np.zeros(n); blk = 2205
    for i in range(0, n, blk):
        fc = 300 + 2500 * np.exp(-(i / SR) / 0.6)
        seg = x[max(0, i - blk): i + 2 * blk]
        f = lowpass(seg, fc)
        y[i:i + blk] = f[min(blk, i): min(blk, i) + len(y[i:i + blk])]
    y *= e
    place('fx', np.stack([y, y], 1), t, 0.55 * v)

def sub(m, t, length, v=1.0):
    n = int(length * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * mtof(m) * tt) * np.minimum(1, tt / 0.01) * np.minimum(1, (length - tt) / 0.08)
    place('bass', np.stack([x, x], 1), t, 0.6 * v)

def ost(m, t, v=1.0, pan=0.0):
    """short string spiccato."""
    n = int(0.18 * SR); tt = np.arange(n) / SR
    x = np.zeros(n)
    for det in (-0.06, 0.06):
        ph = np.cumsum(np.full(n, mtof(m) * 2 ** (det / 12))) / SR; x += 2 * (ph % 1) - 1
    x = lowpass(x, 3200) * np.exp(-tt / 0.06) * np.minimum(1, tt / 0.004)
    place('ost', np.stack([x, x], 1), t, 0.35 * v, pan)

def riser(t_end, length, v=1.0):
    n = int(length * SR); tt = np.arange(n) / SR
    x = rng.standard_normal(n) * (tt / length) ** 2.5
    x = x - lowpass(x, 1200)
    f = 120 + 900 * (tt / length) ** 2
    x += np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25 * (tt / length) ** 2
    place('fx', np.stack([x, x], 1), t_end - length, 0.5 * v)

def whoosh(t, v=1.0):
    n = int(0.6 * SR); tt = np.arange(n) / SR
    x = rng.standard_normal(n) * np.sin(np.pi * tt / 0.6) ** 2
    x = x - lowpass(x, 800)
    place('fx', np.stack([x, x * 0.8], 1), t - 0.3, 0.25 * v)

def boom(t, v=1.0):
    n = int(3.0 * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * np.cumsum(28 + 55 * np.exp(-tt * 7)) / SR) * np.exp(-tt / 0.9)
    place('bass', np.stack([x, x], 1), t, 1.0 * v)

# ---------------------------------------------------------------- harmony (D minor): Dm - Bb - F - C, then Dm - Bb - Gm - A
CH = [(50, [62, 65, 69]), (46, [62, 65, 70]), (53, [60, 65, 69]), (48, [60, 64, 67]),
      (50, [62, 65, 69]), (46, [62, 65, 70]), (43, [62, 67, 70]), (45, [61, 64, 69])]
MOTIF = [(0, 74, 1.5), (1.5, 72, 0.5), (2, 69, 2), (4, 70, 1), (5, 69, 1), (6, 65, 2),
         (8, 69, 1.5), (9.5, 67, 0.5), (10, 65, 2), (12, 64, 1), (13, 65, 1), (14, 62, 2)]   # (beat, midi, beats)

# world: bars 0-7.5
for b in range(8):
    root, ch = CH[b % 8]
    if b < 7: strings([root, root + 12] + ch, at(b), BAR + 0.6, 0.55 if b < 4 else 0.8, 1600 if b < 4 else 2600, 1.2)
    piano(root - 12 + 24, at(b), 0.7, BAR, 2)
    for k in range(8):                           # harp arpeggio in eighths
        if b == 7 and k >= 4: break
        notes = [root + 12] + ch + [ch[0] + 12]
        harp(notes[k % len(notes)] + (12 if k >= 4 else 0), at(b, k * 0.5), 0.55 + 0.1 * (b >= 4), pan=-0.3 + 0.08 * k)
for start in (0, 4):
    for beat, m, beats in MOTIF:
        if start == 4 and beat >= 14: continue
        piano(m + (12 if start == 4 else 0), at(start, beat), 0.95, beats * BEAT + 1.2, 3, 0.1)
for b in range(4, 8): timp(at(b), 0.45 + 0.08 * (b - 4)); timp(at(b, 2.5), 0.35)
bell(at(4), 0.8); bell(at(6), 0.6, -3)
for b in range(4, 7): sub(CH[b][0] - 12, at(b), BAR, 0.5)
for k in range(8): timp(at(7, k * 0.25), 0.35 + 0.06 * k, semis=k // 3)  # timpani roll into the drop
riser(at(COMBAT), 1.4 * BAR, 1.0)

# combat: bars 8-13, double-time feel (eighth = 0.375 s)
for b in range(COMBAT, LOGO):
    root, ch = CH[4 + (b - COMBAT) % 4]
    braam(root - 12, at(b), 2.6, 1.0 if (b - COMBAT) % 2 == 0 else 0.8)
    strings([root, root + 7, root + 12] + ch, at(b), BAR + 0.3, 0.7, 3200, 0.3)
    sub(root - 12, at(b), BAR, 0.9)
    for k in range(16):                          # 16th string ostinato
        m = [root + 24, root + 31, root + 27 if root != 45 else root + 28, root + 31][k % 4]
        ost(m, at(b, k * 0.25), 0.7 if k % 4 else 1.0, 0.3 if k % 2 else -0.3)
    s = lambda i: at(b, i * 0.25)                 # 16th grid
    for i in (0, 3, 6, 10, 11): bd(s(i), 1.0 if i in (0, 6) else 0.75)
    for i in (4, 12): sn(s(i), 1.0); anvil(s(i), 0.8)
    for i in (2, 8, 14): timp(s(i), 0.55)
    if (b - COMBAT) % 2 == 1:
        for i in range(12, 16): sn(s(i), 0.45 + 0.12 * (i - 12))
    crash(at(b), 0.8 if b == COMBAT else 0.45)
boom(at(COMBAT), 1.0); gong(at(COMBAT), 0.6)
for b in range(COMBAT, LOGO): whoosh(at(b, 2))
riser(at(LOGO), BAR, 0.9)
for k in range(8): timp(at(LOGO - 1, 2 + k * 0.25), 0.5 + 0.06 * k, semis=k // 2)

# logo hit + ring-out
boom(at(LOGO), 1.2); gong(at(LOGO), 0.9); crash(at(LOGO), 1.0); braam(38, at(LOGO), 4.0, 1.1)
timp(at(LOGO), 1.0, -2)
strings([50, 57, 62, 65, 69], at(LOGO), 3 * BAR, 0.8, 2000, 0.4)
for beat, m, beats in MOTIF[:6]:
    piano(m, at(LOGO + 0.5, beat * 0.75), 0.8, beats * BEAT + 1.5, 2, 0.1)
bell(at(LOGO + 2), 0.6)

# ---------------------------------------------------------------- mix
def reverb(x, seconds, mix, seed):
    r = np.random.default_rng(seed); n = int(seconds * SR); tt = np.arange(n) / SR
    out = np.zeros_like(x); size = 1 << int(np.ceil(np.log2(len(x) + n)))
    for c in (0, 1):
        ir = r.standard_normal(n) * np.exp(-tt * 6.9 / seconds); ir[: int(0.015 * SR)] = 0
        ir = lowpass(ir, 5000); ir /= np.sqrt(np.sum(ir ** 2))
        out[:, c] = np.fft.irfft(np.fft.rfft(x[:, c], size) * np.fft.rfft(ir, size), size)[: len(x)]
    return x + out * mix

hit_env = np.convolve(np.abs(bus['drums'][:, 0]) + np.abs(bus['bass'][:, 0]), np.ones(441) / 441, 'same')
hit_env /= hit_env.max() + 1e-9
duck = (1 - 0.35 * np.clip(hit_env * 3, 0, 1))[:, None]
mix = (reverb(bus['piano'], 3.0, 0.5, 1) * 1.0 + reverb(bus['harp'], 3.0, 0.55, 2) * 0.8
       + reverb(bus['pad'], 3.5, 0.45, 3) * 1.1 * duck + reverb(bus['drums'], 1.6, 0.25, 4) * 1.2
       + reverb(bus['perc'], 2.5, 0.4, 5) * 1.0 + reverb(bus['fx'], 3.0, 0.4, 6) * 0.9
       + bus['bass'] * 0.9 + reverb(bus['ost'], 1.5, 0.3, 7) * 0.8 * duck)
mix = mix[: int(END * BAR * SR)]
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.8) / np.tanh(1.8)
fade = int(2.5 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
mix *= 0.93 / (np.max(np.abs(mix)) + 1e-9)
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('wrote', OUT, round(len(mix) / SR, 2), 's')
