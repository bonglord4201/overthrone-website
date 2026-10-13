"""Original drift-phonk beat for the OVERTHRONE TikTok intro (128 BPM). Everything is synthesised here,
so the track is ours to use anywhere.

    python3 make_phonk.py <out.wav>

Layout (bars, 1 bar = 1.875 s):
  0-4   intro: filtered cowbell melody opening up, riser, one beat of silence
  4-12  drop: kick, clap, hats, 808 slides, cowbell melody
  12-22 combat: harder - distorted cowbell an octave up, double hats, crashes
  22-25 outro: final hit, melody tail, fade
"""
import sys, wave
import numpy as np

OUT = sys.argv[1]
SR = 44100
BPM = 128; BEAT = 60 / BPM; BAR = 4 * BEAT; STEP = BEAT / 4
TOTAL_BARS = 25
N = int(SR * (TOTAL_BARS * BAR + 2))
rng = np.random.default_rng(128)
bus = {k: np.zeros(N) for k in ('kick', 'drums', 'bell', 'bass', 'fx')}

def at(bar, step=0): return bar * BAR + step * STEP
def env(n, attack, decay):
    t = np.arange(n) / SR
    e = np.exp(-t / decay)
    a = int(attack * SR)
    if a > 0: e[:a] *= np.linspace(0, 1, a)
    return e
def add(b, x, t, g=1.0):
    i = int(t * SR)
    if i >= N: return
    x = x[: N - i]; bus[b][i:i + len(x)] += x * g

def fft_filter(x, lo=None, hi=None):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.ones_like(f)
    if lo: m *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
    if hi: m *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * m, len(x))

# ---------------------------------------------------------------- instruments
def kick(t, v=1.0):
    n = int(0.45 * SR); tt = np.arange(n) / SR
    f = 45 + 110 * np.exp(-tt * 28)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.22)
    x[:200] += rng.standard_normal(200) * np.linspace(0.6, 0, 200)
    add('kick', np.tanh(x * 2.2), t, v)

def clap(t, v=1.0):
    n = int(0.25 * SR); x = np.zeros(n)
    for k, d in enumerate((0, 0.011, 0.022)):
        i = int(d * SR); m = n - i
        x[i:] += rng.standard_normal(m) * env(m, 0.0005, 0.012 if k < 2 else 0.09)
    add('drums', fft_filter(x, 900, 5000) * 1.4, t, v)

def hat(t, v=1.0, open_=False):
    n = int((0.25 if open_ else 0.06) * SR)
    x = fft_filter(rng.standard_normal(n), 7000) * env(n, 0.0005, 0.08 if open_ else 0.018)
    add('drums', x, t, 0.35 * v)

def cowbell(semi, t, v=1.0, length=0.32, dist=0.0):
    n = int(length * SR); tt = np.arange(n) / SR
    r = 2 ** (semi / 12)
    x = np.sign(np.sin(2 * np.pi * 587 * r * tt)) * 0.6 + np.sign(np.sin(2 * np.pi * 845 * r * tt)) * 0.4
    x = fft_filter(x, 400, 4500) * env(n, 0.001, 0.09)
    if dist: x = np.tanh(x * (1 + dist * 6)) * 0.8
    add('bell', x, t, v)

def bass808(semi, t, length, glide=None, v=1.0):
    n = int(length * SR); tt = np.arange(n) / SR
    f0 = 55 * 2 ** (semi / 12)
    f = np.full(n, f0)
    if glide is not None:
        g = int(min(0.12, length * 0.5) * SR)
        f[:g] = np.linspace(55 * 2 ** (glide / 12), f0, g)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    e = np.minimum(1, tt / 0.004) * np.minimum(1, (length - tt) / 0.03)
    add('bass', np.tanh(x * 2.5) * e, t, v)

def riser(t_end, length, v=1.0):
    n = int(length * SR); tt = np.arange(n) / SR
    x = rng.standard_normal(n) * (tt / length) ** 2
    x = fft_filter(x, 1500) * 0.5
    f = 200 + 1800 * (tt / length) ** 2
    x += np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.15 * (tt / length)
    add('fx', x, t_end - length, v)

def impact(t, v=1.0):
    n = int(2.5 * SR); tt = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(30 + 60 * np.exp(-tt * 9)) / SR) * env(n, 0.002, 0.7)
    crash = fft_filter(rng.standard_normal(n), 3000) * env(n, 0.002, 0.9) * 0.4
    add('fx', np.tanh((boom + crash) * 1.8), t, v)

def crash(t, v=1.0):
    n = int(2.0 * SR)
    add('fx', fft_filter(rng.standard_normal(n), 4000) * env(n, 0.002, 0.7) * 0.35, t, v)

# ---------------------------------------------------------------- patterns
# 2-bar cowbell melody (16th steps, None = rest), in semitones from the root
MEL = [0, None, 0, None, 3, None, 0, None, 5, None, 3, None, 0, None, 7, 5,
       0, None, 0, None, 3, None, 0, None, 8, None, 7, None, 5, None, 3, None]
ROOTS = [0, -4, -2, -5]          # one root per 2 bars (minor phonk progression)

def melody(bar, v=1.0, octave=0, dist=0.0):
    root = ROOTS[(bar // 2) % 4]
    for i, s in enumerate(MEL):
        if s is None: continue
        cowbell(root + s + octave, at(bar + i // 16, i % 16), v * (1.0 if i % 4 == 0 else 0.8), dist=dist)

def drums(bar, hard=False):
    for s in (0, 6, 10):  kick(at(bar, s), 1.0 if s == 0 else 0.85)
    if hard: kick(at(bar, 14), 0.7)
    clap(at(bar, 4)); clap(at(bar, 12))
    for s in range(0, 16, 2): hat(at(bar, s), 1.0 if s % 4 == 0 else 0.7)
    if hard:
        for s in range(1, 16, 2): hat(at(bar, s), 0.45)
    if bar % 2 == 1:                       # hat roll into the next bar
        for k in range(6): hat(at(bar, 12) + k * STEP * 4 / 6, 0.5 + 0.08 * k)
    if bar % 4 == 3: hat(at(bar, 14), 0.9, True)

def bass(bar):
    root = ROOTS[(bar // 2) % 4]
    prev = ROOTS[((bar - 1) // 2) % 4]
    bass808(root, at(bar, 0), 6 * STEP, glide=prev + 12 if bar % 2 == 0 else None)
    bass808(root, at(bar, 10), 4 * STEP)
    bass808(root + 12 if bar % 2 else root, at(bar, 14), 2 * STEP, glide=root)

# ---------------------------------------------------------------- arrangement
for b in range(0, 4, 2): melody(b, 0.9)
riser(at(4) - BEAT, 2 * BAR - BEAT, 1.0)
for b in range(4, 12):
    drums(b); bass(b)
    if b % 2 == 0: melody(b, 1.0)
impact(at(4), 1.0)
impact(at(12), 1.1)
for b in range(12, 22):
    drums(b, hard=True); bass(b)
    if b % 2 == 0: melody(b, 1.0, 12, dist=0.6); melody(b, 0.5, 0)
    if b % 4 == 0 and b > 12: crash(at(b), 0.9)
riser(at(22), BAR, 0.8)
impact(at(22), 1.2)
melody(22, 0.8)
bass808(ROOTS[3] - 12, at(22), 2 * BAR, glide=ROOTS[3])

# ---------------------------------------------------------------- mix
def lowpass_sweep(x, t0, t1, f0, f1):
    """opens a low-pass filter from f0 to f1 Hz between t0 and t1 (block-wise)."""
    out = x.copy(); blk = int(0.05 * SR)
    for i in range(int(t0 * SR), int(t1 * SR), blk):
        p = (i / SR - t0) / (t1 - t0); fc = f0 * (f1 / f0) ** p
        seg = x[max(0, i - blk): i + 2 * blk]
        y = fft_filter(seg, hi=fc)
        out[i:i + blk] = y[min(blk, i): min(blk, i) + len(out[i:i + blk])]
    return out

bus['bell'] = lowpass_sweep(bus['bell'], 0, at(4), 500, 6000)
gap = slice(int((at(4) - BEAT) * SR), int(at(4) * SR))      # one beat of silence before the drop
for k in ('bell', 'bass', 'drums'): bus[k][gap] *= 0.0

def echo(x, d, fb, mix):
    y = x.copy(); i = int(d * SR)
    for k in range(1, 5): y[i * k:] += x[: len(x) - i * k] * (fb ** k) * mix
    return y

kenv = np.convolve(np.abs(bus['kick']), np.ones(441) / 441, 'same'); kenv /= kenv.max() + 1e-9
duck = 1 - 0.5 * np.clip(kenv * 3, 0, 1)
mix = (bus['kick'] * 0.9 + bus['drums'] * 0.8 + echo(bus['bell'], 3 * STEP, 0.4, 0.5) * 0.55 * duck
       + bus['bass'] * 0.75 * duck + bus['fx'] * 0.8)
mix = mix[: int(TOTAL_BARS * BAR * SR)]
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 2.0) / np.tanh(2.0)
fade = int(2.0 * SR); mix[-fade:] *= np.linspace(1, 0, fade) ** 2
st = np.stack([mix, mix], 1)
st[:, 0] += echo(bus['bell'], 0.011, 0, 0)[: len(mix)] * 0.0
st *= 0.93 / (np.max(np.abs(st)) + 1e-9)
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
print('wrote', OUT, round(len(st) / SR, 2), 's')
