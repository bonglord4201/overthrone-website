"""Japanese battle soundtrack for the OVERTHRONE trailer, built from real recorded instruments.

    python3 make_music.py <VCSL folder> <out.wav>

<VCSL folder> is a checkout of https://github.com/sgossner/VCSL (Versilian Community Sample
Library, CC0 / public domain), so the finished track is free to use anywhere, including YouTube.
Instruments: dan tranh zither (koto role), concert bass drum (taiko role), frame drum (shime-daiko
role), mallet toms, woodblock (hyoshigi), gong, cymbals, claps, hi-hats, tenor recorder (shakuhachi
role, with a breathy bend on each note), plus a synthesised 808 sub bass.
Arrangement follows timeline.py (150 BPM, D "In" scale: D Eb G A Bb).
"""
import os, subprocess, sys, wave
import numpy as np
import timeline as T

VCSL, OUT = sys.argv[1], sys.argv[2]
SR = 44100
N = int(SR * (T.TOTAL + 1.0))
rng = np.random.default_rng(150)
B, BEAT = T.BAR, T.BEAT

buses = {k: np.zeros((N, 2)) for k in ('drums', 'kick', 'music', 'lead', 'bass', 'fx')}

# ---------------------------------------------------------------- samples
_cache = {}
def load(rel):
    if rel not in _cache:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(VCSL, rel), '-f', 'f32le',
                              '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
        x = np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)
        _cache[rel] = x / (np.max(np.abs(x)) + 1e-9)
    return _cache[rel]

def repitch(x, semis):
    if abs(semis) < 1e-6: return x
    r = 2 ** (semis / 12)
    idx = np.arange(0, len(x) - 1, r)
    return np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in (0, 1)], 1)

def place(bus, x, t, gain=1.0, pan=0.0, length=None, fade=0.05):
    if length is not None:
        n = min(len(x), int(length * SR))
        x = x[:n].copy()
        f = min(n, int(fade * SR))
        if f: x[-f:] *= np.linspace(1, 0, f)[:, None]
    i = int(round(t * SR))
    if i >= N or i + len(x) <= 0: return
    if i < 0: x, i = x[-i:], 0
    x = x[: N - i]
    lg, rg = gain * min(1, 1 - pan), gain * min(1, 1 + pan)
    buses[bus][i:i + len(x), 0] += x[:, 0] * lg
    buses[bus][i:i + len(x), 1] += x[:, 1] * rg

NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
def midi_of(name):            # VCSL names these instruments one octave low (B1 sounds as B2, etc.)
    for k in sorted(NOTE, key=len, reverse=True):
        if name.startswith(k): return 12 * (int(name[len(k):]) + 1) + NOTE[k] + 12

def bank(folder, suffix):
    out = {}
    for f in sorted(os.listdir(os.path.join(VCSL, folder))):
        if f.endswith(suffix):
            name = f.split('_')[0] if not f.startswith('TenRecorder') else f.split('_')[2]
            out[midi_of(name)] = os.path.join(folder, f)
    return out

ZITHER = 'Chordophones/Zithers/Dan Tranh/'
KOTO_F, KOTO_FF = bank(ZITHER + 'Normal', '_f_1.wav'), bank(ZITHER + 'Normal', '_ff_1.wav')
KOTO_TREM = bank(ZITHER + 'Tremolo', '_Trem_1.wav')
FLUTE = bank('Aerophones/Edge-blown Aerophones/Baroque Tenor Recorder/SusVib', '_Main.wav')

def nearest(bank_, m):
    k = min(bank_, key=lambda k: (abs(k - m), k > m))
    return bank_[k], m - k

def rr(folder, names):        # round-robin picker
    files = [os.path.join(folder, n) for n in names]
    state = {'i': 0}
    def pick():
        state['i'] += 1
        return files[state['i'] % len(files)]
    return pick

MEM, IDI = 'Membranophones/Struck Membranophones/', 'Idiophones/Struck Idiophones/'
BD = MEM + 'Bass Drum 2/'
shime_pick = rr(MEM + 'Frame Drum', ['HDrumS_HitMuted_v3_rr1_Sum.wav', 'HDrumS_HitMuted_v3_rr2_Sum.wav'])
tom_pick = rr(MEM + 'Tom 1/Mallet', ['TomH_HitM_v4_rr1_Mid.wav', 'TomH_HitM_v4_rr2_Mid.wav', 'TomH_HitM_v3_rr1_Mid.wav'])
clap_pick = rr(IDI + 'Claps', ['Clap_rr%d.wav' % i for i in range(1, 7)])
snare_pick = rr(MEM + 'Snare Drum, Modern 1', ['Snare2_HitSN_v7_rr1_Mid.wav', 'Snare2_HitSN_v7_rr2_Mid.wav'])
hat_pick = rr(IDI + 'Hi-Hat Cymbal', ['HiHat_Close_rr1_Mid.wav', 'HiHat_Close_rr2_Mid.wav',
                                      'HiHat_HitC_v2_rr1_Mid.wav', 'HiHat_HitC_v2_rr2_Mid.wav'])
wood_pick = rr(IDI + 'Woodblock', ['wood_click_f_rr1.wav', 'wood_click_f_rr2.wav'])

# ---------------------------------------------------------------- instruments
def taiko(t, v=1.0, semis=-3):
    hit = BD + ('bassdrum_hit_ff.wav' if v > 0.8 else 'bassdrum_hit_f.wav' if v > 0.5 else 'bassdrum_hit_mf1.wav')
    place('kick', repitch(load(hit), semis), t, 1.1 * v, length=1.4, fade=0.5)
    n = int(0.35 * SR); tt = np.arange(n) / SR       # synthetic sub thump under it
    sub = np.sin(2 * np.pi * np.cumsum(48 + 60 * np.exp(-tt * 30)) / SR) * np.exp(-tt * 9)
    place('kick', np.stack([sub, sub], 1), t, 0.55 * v)

def shime(t, v=1.0, pan=0.25): place('drums', repitch(load(shime_pick()), 2), t, 0.55 * v, pan, length=0.5)
def tom(t, v=1.0, semis=-5, pan=0.0): place('drums', repitch(load(tom_pick()), semis), t, 0.7 * v, pan, length=1.2, fade=0.4)
def clap(t, v=1.0):
    place('drums', load(clap_pick()), t, 0.55 * v, -0.05, length=0.6)
    place('drums', load(snare_pick()), t, 0.45 * v, 0.05, length=0.7, fade=0.3)
def hat(t, v=1.0, pan=-0.3): place('drums', load(hat_pick()), t, 0.22 * v, pan, length=0.25)
def wood(t, v=1.0): place('drums', load(wood_pick()), t, 0.5 * v, 0.35, length=0.4)
def crash(t, v=1.0): place('fx', load(IDI + 'Clash Cymbals 1/cymbal_crash1_ff2.wav'), t, 0.45 * v, 0.0, length=5, fade=2.5)
def gong(t, v=1.0, length=9):
    place('fx', load(IDI + 'Gong 1/' + ('gong_fff.wav' if v > 0.7 else 'gong_mf.wav')), t, 0.75 * v, 0.0, length=length, fade=3)

def koto(m, t, v=1.0, pan=0.0, length=2.2):
    f, s = nearest(KOTO_FF if v > 0.8 else KOTO_F, m)
    place('music', repitch(load(f), s), t, 0.42 * v, pan, length=length, fade=0.6)

def koto_trem(m, t, length, v=1.0, pan=0.0):
    f, s = nearest(KOTO_TREM, m)
    place('music', repitch(load(f), s), t, 0.30 * v, pan, length=length, fade=min(1.0, length / 3))

def koto_gliss(t, up=False, v=1.0):
    f = ZITHER + 'Gliss/' + ('Gliss_Up_Med_ff_1.wav' if up else 'Gliss_Dwn_Med_ff_1.wav')
    place('music', load(f), t, 0.4 * v, 0.0, length=4, fade=1.5)

def flute(m, t, length, v=1.0):
    """Recorder sample made to phrase like a shakuhachi: scoop up into the note, breath noise, darker tone."""
    f, s = nearest(FLUTE, m)
    x = load(f)[int(0.03 * SR):]
    n = int((length + 0.25) * SR)
    tt = np.arange(n) / SR
    bend = s - 1.0 * np.exp(-tt / 0.07)                    # starts a semitone flat, slides up
    pos = np.cumsum(2 ** (bend / 12))
    pos = pos[pos < len(x) - 1]
    y = np.stack([np.interp(pos, np.arange(len(x)), x[:, c]) for c in (0, 1)], 1)
    e = np.minimum(1, np.arange(len(y)) / (0.06 * SR))
    rel = int(0.25 * SR)
    if len(y) > rel: e[-rel:] *= np.linspace(1, 0, rel)
    y = lowpass(y * e[:, None], 3200)
    breath = bandpass(rng.standard_normal(len(y)), 1200, 6000) * np.exp(-np.arange(len(y)) / SR / 0.12) * 0.25
    y += breath[:, None] * 0.6
    place('lead', y, t, 0.45 * v, -0.1)

def bass808(m, t, length, glide_from=None, v=1.0):
    n = int((length + 0.05) * SR); tt = np.arange(n) / SR
    f_target = 440 * 2 ** ((m - 69) / 12)
    f = np.full(n, f_target)
    if glide_from is not None:
        f0 = 440 * 2 ** ((glide_from - 69) / 12)
        f = f_target + (f0 - f_target) * np.exp(-tt / 0.06)
    f = f * (1 + 0.6 * np.exp(-tt / 0.012))                # punchy pitch drop at the attack
    y = np.tanh(1.8 * np.sin(2 * np.pi * np.cumsum(f) / SR))
    e = np.minimum(1, tt / 0.004) * np.exp(-tt / max(0.6, length))
    rel = int(0.04 * SR); e[-rel:] *= np.linspace(1, 0, rel)
    y = lowpass(y * e, 900)
    place('bass', np.stack([y, y], 1), t, 0.5 * v)

def pad(notes, t, length, v=1.0, cutoff=1400):
    n = int(length * SR); tt = np.arange(n) / SR
    y = np.zeros(n)
    for m in notes:
        fr = 440 * 2 ** ((m - 69) / 12)
        for d in (-0.005, 0.0, 0.006):
            y += 2 * ((tt * fr * (1 + d) + rng.random()) % 1) - 1
    e = np.minimum(1, tt / 1.2) * np.minimum(1, (length - tt) / 1.2).clip(0, 1)
    y = lowpass(y * e, cutoff) / (3 * len(notes))
    d = int(0.011 * SR)
    place('music', np.stack([y, np.concatenate([np.zeros(d), y[:-d]])], 1), t, 0.35 * v)

def lowpass(x, fc):
    X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(len(x), 1 / SR)
    g = 1 / np.sqrt(1 + (f / fc) ** 4)
    return np.fft.irfft(X * (g[:, None] if x.ndim == 2 else g), len(x), axis=0)

def bandpass(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4) / np.sqrt(1 + (f / hi) ** 4), len(x))

# ---------------------------------------------------------------- sound effects
def peak_time(x):
    env = np.convolve(np.abs(x[:, 0]), np.ones(2048) / 2048, 'same')
    return np.argmax(env) / SR

def riser(t_end, kind='4s', v=1.0):
    x = load(IDI + 'Suspended Cymbal 1/susCymb1_cresc_%s.wav' % kind)
    p = peak_time(x)
    place('fx', x[: int((p + 0.05) * SR)], t_end - p, 0.6 * v, fade=0.05)
    r = load(BD + 'bassdrum_cresc_med.wav')
    pr = peak_time(r)
    place('fx', r[: int((pr + 0.05) * SR)], t_end - pr, 0.5 * v, fade=0.05)
    n = int(2.4 * SR); tt = np.arange(n) / SR      # rising noise sweep on top
    sw = np.zeros(n); seg = int(0.05 * SR); noise = rng.standard_normal(n)
    for i in range(0, n, seg):
        fr = i / n
        piece = noise[i:i + seg]
        sw[i:i + len(piece)] = bandpass(np.pad(piece, (0, seg - len(piece))), 400 + 6000 * fr ** 2, 1200 + 10000 * fr ** 2)[: len(piece)]
    sw *= (tt / tt[-1]) ** 2.5
    place('fx', np.stack([sw, sw[::-1] * 0 + sw], 1), t_end - 2.4, 0.18 * v)

def whoosh(t_cut, v=1.0):
    n = int(0.45 * SR); tt = np.arange(n) / SR
    noise = rng.standard_normal(n)
    y = np.zeros(n); seg = int(0.03 * SR)
    for i in range(0, n, seg):
        fr = i / n
        piece = noise[i:i + seg]
        c = 500 + 4500 * np.sin(np.pi * fr)
        y[i:i + len(piece)] = bandpass(np.pad(piece, (0, seg - len(piece))), c * 0.6, c * 1.6)[: len(piece)]
    y *= np.sin(np.pi * tt / tt[-1]) ** 2
    pan = rng.uniform(-0.6, 0.6)
    place('fx', np.stack([y, y], 1), t_cut - 0.3, 0.16 * v, pan)

def shing(t, v=1.0):
    n = int(1.2 * SR); tt = np.arange(n) / SR
    y = np.zeros(n)
    for fr, d, a in ((2210, 0.9, 1.0), (3170, 0.7, 0.7), (4630, 0.5, 0.5), (6050, 0.35, 0.35), (7900, 0.25, 0.25)):
        fr2 = fr * (1 + 0.004 * np.sin(2 * np.pi * 6 * tt))
        y += a * np.sin(2 * np.pi * np.cumsum(fr2) / SR) * np.exp(-tt / d)
    scrape = bandpass(rng.standard_normal(n), 3000, 12000) * np.exp(-tt / 0.08) * 1.5
    y = (y * 0.25 + scrape) * np.minimum(1, tt / 0.003)
    place('fx', np.stack([y, y], 1), t - 0.05, 0.13 * v, rng.uniform(-0.3, 0.3))

def impact(t, v=1.0):
    taiko(t, 1.2 * v, semis=-5)
    gong(t, v)
    crash(t, v)
    n = int(2.5 * SR); tt = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(30 + 70 * np.exp(-tt * 5)) / SR) * np.exp(-tt * 1.6)
    place('kick', np.stack([boom, boom], 1), t, 0.9 * v)

# ---------------------------------------------------------------- arrangement
def at(bar, beat=0.0): return bar * B + beat * BEAT
D2, Eb2, G2, A2, Bb2, C3 = 38, 39, 43, 45, 46, 48
ROOT_HUB = [D2, D2, Bb2 - 12, C3 - 12]
ROOT_COMBAT = [D2, D2, Bb2 - 12, C3 - 12, D2, D2, Eb2, A2 - 12]
ROOT_RPG = [D2, Eb2, Bb2 - 12, A2 - 12]

RIFF_A = [62, 69, 70, 69, 74, 69, 70, 67]          # koto ostinato, eighth notes
RIFF_B = [62, 69, 70, 74, 75, 74, 70, 69]
MELODY = [  # (bar offset, beat, midi, beats)
    (0, 0, 69, 2), (0, 2, 70, 1), (0, 3, 69, 1),
    (1, 0, 67, 1.5), (1, 1.5, 69, 0.5), (1, 2, 62, 2),
    (2, 0, 74, 2), (2, 2, 75, 1), (2, 3, 74, 1),
    (3, 0, 70, 3), (3, 3, 69, 1),
    (4, 0, 69, 2), (4, 2, 70, 1), (4, 3, 74, 1),
    (5, 0, 75, 2), (5, 2, 74, 2),
    (6, 0, 70, 1), (6, 1, 69, 1), (6, 2, 67, 1), (6, 3, 69, 1),
    (7, 0, 62, 4),
]

def drums_bar(b, level):
    """level 1 = groove, 2 = full battle."""
    s = lambda k: at(b, k / 4)                      # 16th-note step
    taiko(s(0), 1.0)
    taiko(s(10), 0.75)
    if level == 2: taiko(s(7), 0.6); taiko(s(14), 0.5, semis=-1)
    clap(s(8), 0.9 if level == 2 else 0.75)
    shime(s(4), 0.7); shime(s(12), 0.8, -0.25)
    if level == 2: shime(s(6), 0.5); shime(s(13), 0.5, -0.25)
    for k in range(0, 16, 2): hat(s(k), 0.9 if k % 4 == 0 else 0.6)
    if b % 2 == 1:                                   # trap-style hat roll into the next bar
        for k in range(12, 16): hat(s(k) + 0.05, 0.5)
        if level == 2:
            for j in range(6): hat(s(14) + j * BEAT / 6, 0.35 + 0.05 * j, 0.3)
    if b % 4 == 3:                                   # taiko tom fill
        for j, k in enumerate((12, 13, 14, 15)): tom(s(k), 0.8 + 0.1 * j, semis=-2 - 3 * j, pan=0.3 - 0.2 * j)
    if b % 8 == 7: wood(s(15)); wood(s(15) + BEAT / 4)

def bass_bar(b, root, glide=None):
    bass808(root, at(b, 0), 1.7 * BEAT, glide_from=glide)
    bass808(root, at(b, 2.5), 1.4 * BEAT)
    bass808(root + 12 if b % 2 else root, at(b, 3.5), 0.45 * BEAT)

def riff_bar(b, root, octave=0, v=0.8, pattern=None):
    pat = pattern or (RIFF_A if b % 2 == 0 else RIFF_B)
    first = 60 + (root % 12)                         # the downbeat note follows the bass
    for i, m in enumerate(pat):
        mm = (first if i == 0 else m) + octave
        koto(mm, at(b, i * 0.5), v * (1.0 if i % 4 == 0 else 0.75), pan=0.35 if i % 2 else -0.35, length=0.9)

def melody(start_bar, instrument='flute', octave=0, v=1.0):
    for bo, beat, m, beats in MELODY:
        t = at(start_bar + bo, beat)
        if instrument == 'flute': flute(m + octave, t, beats * BEAT, v)
        elif beats >= 2: koto_trem(m + octave, t, beats * BEAT, v, 0.1)
        else: koto(m + octave, t, v, 0.1, length=beats * BEAT + 0.4)

# intro (bars 0-7): drone, koto tremolo, flute
pad([D2, A2], at(0), 8 * B + 0.5, 0.8, 900)
koto(50, at(0), 1.0, -0.2, 4); koto(57, at(0, 0.5), 0.8, 0.2, 4)
gong(at(0), 0.4)
koto_trem(62, at(0, 2), 2 * B, 0.7)
for bo, beat, m, beats in [(2, 0, 74, 3), (2, 3, 75, 1), (3, 0, 74, 2), (3, 2, 70, 2), (4, 0, 69, 4),
                           (6, 0, 67, 2), (6, 2, 69, 1), (6, 3, 70, 1), (7, 0, 69, 3)]:
    flute(m, at(bo, beat), beats * BEAT, 0.9)
for b in (2, 4, 6):
    taiko(at(b), 0.45); shime(at(b, 2), 0.35)
koto_gliss(at(4), up=False, v=0.6)
for k in range(4): koto(62 + [0, 7, 8, 12][k], at(5, k), 0.6, 0.3 * (k % 2 * 2 - 1), 2)
riser(at(8), '4s')

# title slam (bars 8-9)
impact(at(8), 1.0)
koto_gliss(at(8), up=False, v=0.9)
bass808(D2 - 12, at(8), 2 * B, v=1.1)
taiko(at(9, 0), 0.9); taiko(at(9, 2), 0.9); wood(at(9, 3.5)); taiko(at(9, 3.5), 0.6)
pad([D2, A2, 62], at(8), 2 * B + 0.4, 0.6)

# hub (bars 10-21): groove + koto riff, flute melody from bar 14
for b in range(10, 22):
    r = ROOT_HUB[(b - 10) % 4]
    drums_bar(b, 1)
    bass_bar(b, r)
    riff_bar(b, r, 0, 0.75)
    if (b - 10) % 4 == 0: pad([r + 24, r + 31], at(b), 4 * B, 0.5)
melody(14, 'flute', 0, 0.95)

# build (bars 22-23): accelerating taiko, koto tremolo rising, silence before the drop
for k in range(4): taiko(at(22, k), 0.6 + 0.05 * k)
for k in range(8): taiko(at(23, k * 0.5), 0.6 + 0.04 * k, semis=-3 + k // 3)
for k in range(8): clap(at(23, 2 + k * 0.25), 0.3 + 0.06 * k) if k < 7 else None
koto_trem(62, at(22), B, 0.8); koto_trem(69, at(23), B * 0.85, 0.9)
bass808(D2, at(22), 2 * B - BEAT, glide_from=D2 - 12, v=0.7)
riser(at(24), '4s', 1.1)

# combat (bars 24-39): full battle beat
for b in range(24, 40):
    r = ROOT_COMBAT[(b - 24) % 8]
    drums_bar(b, 2)
    bass_bar(b, r, glide=r - 5 if (b - 24) % 8 == 0 else None)
    riff_bar(b, r, 12 if b >= 28 else 0, 0.8)
    if (b - 24) % 4 == 0: pad([r + 24, r + 31, r + 36], at(b), 4 * B, 0.55, 1800)
impact(at(24), 1.0); crash(at(32), 0.9)
melody(32, 'koto', 0, 1.0)
for b in (28, 30): flute(74, at(b), 2 * B - BEAT, 0.7)

# hero shot (2 bars): everything drops out, gong, flute
HR, BS, RP, EN = T.HERO, T.BOSS, T.RPG, T.END
impact(at(HR), 0.9)
koto_gliss(at(HR), up=False, v=1.0)
koto_trem(62, at(HR), 2 * B, 0.8)
flute(69, at(HR, 0.5), 1.5 * B, 1.0)
bass808(D2 - 12, at(HR), 2 * B, v=0.9)
riser(at(BS), '2s', 0.9)

# bosses + hordes (10 bars): darkest, heaviest section
impact(at(BS), 1.0)
for b in range(BS, RP):
    r = ROOT_RPG[(b - BS) % 4]
    drums_bar(b, 2)
    bass_bar(b, r, glide=r - 5 if (b - BS) % 4 == 0 else None)
    riff_bar(b, r, 12 if b >= BS + 4 else 0, 0.8, RIFF_B if (b - BS) % 2 else [62, 63, 67, 63, 69, 67, 63, 62])
    if (b - BS) % 4 == 0: pad([r + 24, r + 31, r + 36], at(b), 4 * B, 0.6, 1500)
for b in (BS, BS + 4): koto_trem(74, at(b), 2 * B, 0.6)
gong(at(BS + 6), 0.6); crash(at(BS + 6), 0.8)
for k in range(8): taiko(at(RP - 1, k * 0.5), 0.55 + 0.05 * k)
riser(at(RP), '2s', 0.9)

# RPG world (10 bars): darker progression, groove + flute
impact(at(RP), 0.8)
for b in range(RP, EN):
    r = ROOT_RPG[(b - RP) % 4]
    drums_bar(b, 1 if b < RP + 4 else 2)
    bass_bar(b, r)
    riff_bar(b, r, 0, 0.7, RIFF_A if (b - RP) % 2 == 0 else [62, 63, 67, 63, 69, 67, 63, 62])
    if (b - RP) % 4 == 0: pad([r + 24, r + 31], at(b), 4 * B, 0.5, 1200)
melody(RP + 2, 'flute', 0, 1.0)
for k in range(8): taiko(at(EN - 1, k * 0.5), 0.5 + 0.05 * k)
riser(at(EN), '2s', 0.9)

# end card (6 bars): final hit, ring-out, "don, don, DON"
impact(at(EN), 1.1)
koto_gliss(at(EN), up=True, v=0.8)
pad([D2, A2, 62, 69], at(EN), 6 * B, 0.7, 1300)
bass808(D2 - 12, at(EN), 3 * B, v=1.0)
for bo, beat, m, beats in [(1, 0, 74, 2), (1, 2, 75, 1), (1, 3, 74, 1), (2, 0, 69, 4)]:
    koto(m, at(EN + bo, beat), 0.9, 0.0, 3)
flute(62, at(EN + 2), 3 * B, 0.9)
taiko(at(EN + 4, 0), 0.9); taiko(at(EN + 4, 0.75), 0.9); taiko(at(EN + 4, 1.5), 1.2, semis=-5); gong(at(EN + 4, 1.5), 0.6)

# sound effects locked to the picture
starts, slows, _ = T.shot_times()
for s in starts[6:13]: whoosh(s)                      # hub flyover cuts
for s in slows: shing(s)                              # slow-motion sword moments
for s in starts[15:33]: whoosh(s, 0.6)
for s in starts[34:44]: whoosh(s, 0.6)                # boss / horde cuts

# ---------------------------------------------------------------- mix
def reverb(x, seconds, mix, seed):
    r = np.random.default_rng(seed)
    n = int(seconds * SR); tt = np.arange(n) / SR
    out = np.zeros_like(x)
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    for c in (0, 1):
        ir = r.standard_normal(n) * np.exp(-tt * 6.9 / seconds); ir[: int(0.012 * SR)] = 0
        ir = lowpass(ir, 6000); ir /= np.sqrt(np.sum(ir ** 2))
        out[:, c] = np.fft.irfft(np.fft.rfft(x[:, c], size) * np.fft.rfft(ir, size), size)[: len(x)]
    return x + out * mix

# sidechain: duck the music and bass under every taiko hit
kick_env = np.convolve(np.abs(buses['kick'][:, 0]), np.ones(441) / 441, 'same')
kick_env /= kick_env.max() + 1e-9
duck = 1 - 0.45 * np.clip(kick_env * 3, 0, 1)
duck = np.convolve(duck, np.ones(2205) / 2205, 'same')[:, None]

if os.environ.get('STEMS'):
    for k, v in buses.items():
        for name, (a, b2) in {'intro': (0, 8), 'hub': (10, 22), 'combat': (24, 40), 'rpg': (42, 52)}.items():
            seg = v[int(a * B * SR):int(b2 * B * SR)]
            print(k, name, round(20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-9), 1), end='  ')
        print()
mix = (reverb(buses['kick'], 1.2, 0.18, 1) * 0.4
       + reverb(buses['drums'], 1.4, 0.25, 2) * 1.5
       + reverb(buses['music'], 2.6, 0.45, 3) * 1.5 * duck
       + reverb(buses['lead'], 3.2, 0.55, 4) * 0.9 * duck
       + buses['bass'] * 0.3 * duck
       + reverb(buses['fx'], 2.8, 0.35, 5) * 0.9)
mix = mix[: int(T.TOTAL * SR)]
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 2.2) / np.tanh(2.2)               # loudness / glue
fade = int(1.5 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
mix *= 0.93 / (np.max(np.abs(mix)) + 1e-9)
pcm = (mix * 32767).astype(np.int16)
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', OUT, round(len(pcm) / SR, 2), 's')
