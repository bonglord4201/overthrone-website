"""Original cinematic soundtrack for the OVERTHRONE trailer (synthesised, so it is 100% copyright-free).

    python3 make_music.py <out.wav> <total_seconds>

96 BPM, D minor. Bars are 2.5 s, so every 2-bar shot in the edit starts on a downbeat.
Structure (in bars): 0-1 intro swell -> 2-21 "sky city" (soft for 4 bars, then full drums)
-> 22-31 "RPG world" (darker, heavier) -> 32-34 finale hit and ring-out.
"""
import sys, wave
import numpy as np

SR = 44100
BPM = 96
BEAT = 60 / BPM
BAR = 4 * BEAT
OUT, TOTAL = sys.argv[1], float(sys.argv[2])
N = int(SR * (TOTAL + 0.5))
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)

def note_hz(n): return 440.0 * 2 ** ((n - 69) / 12)
def t_of(bar, beat=0.0): return bar * BAR + beat * BEAT

def lowpass(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x))

def bandpass(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)) * (1 / np.sqrt(1 + (f / hi) ** 4))
    return np.fft.irfft(X, len(x))

def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N: return
    sig = sig[: N - i]
    L[i:i + len(sig)] += sig * gain * (1 - max(0, pan))
    R[i:i + len(sig)] += sig * gain * (1 + min(0, pan))

def saw(freq, dur, detune=(0.0,)):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for d in detune:
        ph = (t * freq * (1 + d) + rng.random()) % 1.0
        out += 2 * ph - 1
    return out / len(detune)

def env(n, a, d, s_level, r, total):
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), s_level + (1 - s_level) * np.exp(-(t - a) / max(d, 1e-4)))
    rel_start = total - r
    e = np.where(t > rel_start, e * np.clip(1 - (t - rel_start) / max(r, 1e-4), 0, 1), e)
    return e

# ---------- instruments
def pad(notes, start, dur, gain, cutoff=1800):
    n = int(dur * SR)
    sig = np.zeros(n)
    for m in notes:
        sig += saw(note_hz(m), dur, (-0.006, 0.0, 0.007))
    sig = lowpass(sig, cutoff) * env(n, 0.6, 1.0, 0.85, 0.9, dur)
    add(sig, start, gain * 0.9, -0.3); add(sig, start + 0.013, gain * 0.9, 0.3)

def pluck(m, start, gain, pan=0.0, cutoff=2600):
    dur = BEAT * 0.9
    n = int(dur * SR)
    sig = saw(note_hz(m), dur, (-0.004, 0.004))
    sig = lowpass(sig, cutoff) * np.exp(-np.arange(n) / SR * 7)
    add(sig, start, gain, pan)

def bass(m, start, dur, gain):
    n = int(dur * SR); t = np.arange(n) / SR
    f = note_hz(m)
    sig = np.sin(2 * np.pi * f * t) + 0.35 * lowpass(saw(f, dur), 400)
    add(sig * env(n, 0.01, 0.4, 0.7, 0.2, dur), start, gain)

def taiko(start, gain, pitch=58):
    dur = 1.2; n = int(dur * SR); t = np.arange(n) / SR
    f = pitch * (1 + 1.8 * np.exp(-t * 28))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5)
    skin = bandpass(rng.standard_normal(n), 150, 2500) * np.exp(-t * 35) * 0.5
    add(body + skin, start, gain)

def snare(start, gain):
    dur = 0.5; n = int(dur * SR); t = np.arange(n) / SR
    s = bandpass(rng.standard_normal(n), 900, 7000) * np.exp(-t * 14) + 0.4 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25)
    add(s, start, gain, 0.1)

def hat(start, gain):
    dur = 0.12; n = int(dur * SR); t = np.arange(n) / SR
    add(bandpass(rng.standard_normal(n), 7000, 16000) * np.exp(-t * 45), start, gain, -0.2)

def impact(start, gain):
    dur = 6.0; n = int(dur * SR); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 * (1 + 2.5 * np.exp(-t * 6))) / SR) * np.exp(-t * 0.9)
    crack = bandpass(rng.standard_normal(n), 80, 5000) * np.exp(-t * 3.5) * 0.6
    add(boom + crack, start, gain)

def riser(end, length, gain):
    n = int(length * SR); t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    out = np.zeros(n); seg = int(0.1 * SR)
    for i in range(0, n, seg):           # sweep a band upward in small steps
        frac = i / n
        piece = noise[i:i + seg]
        out[i:i + seg] = bandpass(np.pad(piece, (0, seg - len(piece))), 300 + 5000 * frac ** 2, 900 + 9000 * frac ** 2)[: len(piece)]
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / length) ** 2) / SR) * 0.25
    add((out + sweep) * (t / length) ** 2.2, end - length, gain)

def choir(notes, start, dur, gain):
    n = int(dur * SR); t = np.arange(n) / SR
    sig = np.zeros(n)
    for m in notes:
        f = note_hz(m)
        vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t)
        for k, a in ((1, 1.0), (2, 0.5), (3, 0.3), (4, 0.15)):
            sig += a * np.sin(2 * np.pi * np.cumsum(f * k * vib) / SR)
    sig = bandpass(sig, 200, 3000) * env(n, 1.2, 1.0, 0.9, 1.5, dur)
    add(sig, start, gain * 0.35, -0.2); add(sig, start + 0.02, gain * 0.35, 0.2)

# ---------- harmony (MIDI). D minor: Dm  Bb  F  C  |  RPG: Dm  Gm  Bb  A
SKY = [(50, [62, 65, 69]), (46, [62, 65, 70]), (41, [60, 65, 69]), (48, [60, 64, 67])]
RPG = [(38, [62, 65, 69]), (43, [62, 67, 70]), (46, [62, 65, 70]), (45, [61, 64, 69])]
ARP = [0, 1, 2, 1, 2, 0, 1, 2]

total_bars = int(TOTAL / BAR) + 1
SKY_START, RPG_START, END_START = 2, 22, 32

# intro: drone + riser into the first hit
pad([50, 57], 0, BAR * 2, 0.10, 900)
choir([62, 69], 0.3, BAR * 2, 0.6)
riser(t_of(SKY_START), BAR * 2, 0.35)

for b in range(SKY_START, min(END_START, total_bars)):
    rpg = b >= RPG_START
    root, chord = (RPG if rpg else SKY)[(b - (RPG_START if rpg else SKY_START)) % 4]
    full = b >= SKY_START + 4
    pad(chord, t_of(b), BAR + 0.4, 0.07 if not rpg else 0.08, 1500 if rpg else 2200)
    bass(root, t_of(b), BAR, 0.22 if full else 0.12)
    for i in range(8):                                   # 8th-note ostinato
        m = chord[ARP[i]] + (12 if (not rpg and i % 4 == 3) else 0)
        pluck(m, t_of(b, i * 0.5), 0.06 if full else 0.045, (-0.4 if i % 2 else 0.4), 2000 if rpg else 2800)
    if full or rpg:
        taiko(t_of(b, 0), 0.55); taiko(t_of(b, 2.5), 0.35, 64)
        if rpg: taiko(t_of(b, 1.5), 0.30, 52); taiko(t_of(b, 3.5), 0.25, 70)
        snare(t_of(b, 1), 0.16); snare(t_of(b, 3), 0.18)
        for h in range(8): hat(t_of(b, h * 0.5), 0.05 if h % 2 else 0.03)
    else:
        taiko(t_of(b, 0), 0.3)
    if b % 4 == 0: choir(chord, t_of(b), BAR * 4, 0.5 if rpg else 0.4)

impact(t_of(SKY_START), 0.8)
riser(t_of(RPG_START), BAR * 2, 0.4)
impact(t_of(RPG_START), 0.9)
riser(t_of(END_START), BAR * 2, 0.35)
impact(t_of(END_START), 1.0)
pad([50, 57, 62, 65, 69], t_of(END_START), TOTAL - t_of(END_START) + 0.4, 0.09, 1600)
choir([62, 65, 69, 74], t_of(END_START), TOTAL - t_of(END_START), 0.6)
bass(38, t_of(END_START), TOTAL - t_of(END_START), 0.25)

# ---------- reverb (FFT convolution with a decaying-noise impulse), master
def reverb(x, seconds=2.2, mix=0.28):
    n = int(seconds * SR); t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-t * 3.2); ir[0] = 0
    ir = lowpass(ir, 5000); ir /= np.sqrt(np.sum(ir ** 2))
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    wet = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return x * (1 - mix) + wet * mix
L, R = reverb(L), reverb(R)
mix = np.stack([L, R], 1)
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.6) / np.tanh(1.6)                   # gentle saturation / glue
fade_n = int(2.5 * SR)
mix[-fade_n:] *= np.linspace(1, 0, fade_n)[:, None] ** 1.5
pcm = (mix * 0.89 * 32767).astype(np.int16)
with wave.open(OUT, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("wrote", OUT, round(len(pcm) / SR, 1), "s")
