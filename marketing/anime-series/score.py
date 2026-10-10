"""THRONEBREAKER soundtrack + sound effects, built from real recorded instruments (VCSL, CC0).

    python3 score.py <VCSL folder> <episode 1|2> <out.wav>

Instrument code is shared with marketing/trailer/make_music.py. Hits are locked to the cuts and
impact flashes in ep1.py / ep2.py.
"""
import os, subprocess, sys, wave
import numpy as np

VCSL, EP, OUT = sys.argv[1], int(sys.argv[2]), sys.argv[3]
SR = 44100
TOTAL = 60.0
N = int(SR * (TOTAL + 1.0))
rng = np.random.default_rng(7 + EP)
BEAT = 0.5; B = 4 * BEAT                       # 120 BPM, 2 s bars: every cut lands on the grid

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


# ---------------------------------------------------------------- extra sound design
def beep(t, freq=1000, length=0.12, v=1.0, bus='fx'):
    n = int(length * SR); tt = np.arange(n) / SR
    y = np.sin(2 * np.pi * freq * tt) * np.minimum(1, tt / 0.004) * np.minimum(1, (length - tt) / 0.02)
    place(bus, np.stack([y, y], 1), t, 0.12 * v)

def heartbeat(t, v=1.0):
    taiko(t, 0.35 * v, semis=-8); taiko(t + 0.22, 0.25 * v, semis=-9)

def footstep(t, v=1.0, pan=0.0): tom(t, 0.25 * v, semis=-12, pan=pan)

def siren(t, length, v=1.0):
    n = int(length * SR); tt = np.arange(n) / SR
    f = 700 + 250 * np.sin(2 * np.pi * 0.6 * tt)
    y = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5
    y = lowpass(y, 2500) * np.minimum(1, tt / 0.5) * np.minimum(1, (length - tt) / 0.5)
    place('fx', np.stack([y, y * 0.8], 1), t, 0.05 * v, 0.3)

def glitch(t, v=1.0):
    n = int(0.35 * SR)
    y = rng.standard_normal(n) * (rng.random(n // 400 + 1).repeat(400)[:n] > 0.5)
    y = bandpass(y, 800, 7000) * np.linspace(1, 0.2, n)
    place('fx', np.stack([y, -y], 1), t, 0.10 * v)

def chime(t, m, v=1.0):
    koto(m, t, 0.8 * v, 0.2, 1.5); koto(m + 12, t + 0.06, 0.5 * v, -0.2, 1.5)

D2, Eb2, G2, A2, Bb2, C3 = 38, 39, 43, 45, 46, 48
RIFF = [62, 69, 70, 69, 74, 69, 70, 67]
def riff_bar(b0, root, v=0.7, octave=0):
    for i, m in enumerate(RIFF):
        koto((60 + root % 12 if i == 0 else m) + octave, b0 + i * 0.5 * BEAT * 2 / 2, v * (1 if i % 4 == 0 else 0.7), 0.35 if i % 2 else -0.35, 0.8)

def groove(b0, level=1):
    s = lambda k: b0 + k * BEAT / 4
    taiko(s(0), 0.9); taiko(s(10), 0.7)
    if level == 2: taiko(s(7), 0.55); taiko(s(14), 0.5, semis=-1)
    clap(s(8), 0.7); shime(s(4), 0.6); shime(s(12), 0.7, -0.25)
    for k in range(0, 16, 2): hat(s(k), 0.8 if k % 4 == 0 else 0.5)

def bass_bar(b0, root):
    bass808(root, b0, 1.6 * BEAT); bass808(root, b0 + 2.5 * BEAT, 1.3 * BEAT)

# ---------------------------------------------------------------- episode cues
if EP == 1:
    impact(0.0, 0.9); glitch(0.0)
    pad([D2, A2], 0.0, 17.5, 0.8, 800)
    for t in np.arange(0.6, 11, 1.1): heartbeat(t, 0.9)
    koto(50, 5.0, 0.9, -0.2, 4); koto(57, 5.5, 0.7, 0.2, 4); gong(5.0, 0.35)
    for bo, m, L in [(7, 74, 1.5), (8.5, 75, 0.5), (9, 74, 1.0), (10, 70, 1.0)]: flute(m, bo, L, 0.8)
    impact(12.4, 0.6); whoosh(11.0)
    for t in np.arange(13, 17, 0.25): wood(t, 0.15)
    # hospital: soft koto lullaby, heart monitor
    pad([D2 + 12, A2 + 12, 62 + 5], 17.0, 6.5, 0.6, 1200)
    for i, m in enumerate([74, 72, 70, 69, 67, 69, 70, 62]): koto(m, 17.2 + i * 0.7, 0.55, 0.1 * (-1) ** i, 2)
    for t in np.arange(17.4, 23, 1.11): beep(t, 1000, 0.1, 1.0)
    # the raid: footsteps and a low pulse
    whoosh(23.0)
    pad([D2, Eb2 + 12], 23.0, 6.6, 0.7, 700)
    for t in np.arange(23.2, 29.2, 0.5): footstep(t, 1.0, 0.3 * (-1) ** int(t * 2))
    for t in np.arange(23.0, 29.0, 2): bass808(D2, t, 1.6)
    riser(29.4, '2s', 0.7)
    # the doors slam, the statues wake: battle groove
    impact(29.4, 1.1)
    for k, b0 in enumerate(np.arange(30.0, 43.0, B)):
        r = [D2, D2, Bb2 - 12, C3 - 12][k % 4]
        groove(b0, 1 if b0 < 36 else 2); bass_bar(b0, r); riff_bar(b0, r, 0.7, 12 if b0 >= 36 else 0)
        if k % 2 == 0: pad([r + 24, r + 31], b0, 2 * B, 0.5, 1500)
    for t in (31.2, 31.65, 32.1, 32.55, 33.0, 33.45): beep(t, 180, 0.25, 0.8)   # stone eyes grinding on
    whoosh(36.0)
    for t in np.arange(36.2, 43, 0.9): heartbeat(t, 0.8)
    riser(44.4, '4s', 1.0)
    # the System awakens
    impact(44.4, 1.2); glitch(44.4); koto_gliss(44.4, up=True, v=0.8)
    pad([D2, A2, 62, 69], 44.4, 5.8, 0.8, 1600); bass808(D2 - 12, 44.4, 5.0, v=1.0)
    koto_trem(74, 45.0, 4.5, 0.6)
    # silence, then "...Yes."
    taiko(52.4, 1.2, semis=-6); gong(52.4, 0.5, 6)
    flute(62, 53.0, 2.0, 0.8)
    for t in np.arange(55.0, 57.5, 0.25): glitch(t, 0.25)
    riser(57.6, '2s', 0.9)
    impact(57.6, 1.2); koto_gliss(57.6, up=False, v=0.9); bass808(D2 - 12, 57.6, 2.4, v=1.1)
    pad([D2, A2, 62], 57.6, 2.4, 0.7, 1300)
else:
    impact(0.0, 0.8); glitch(0.0); glitch(1.5, 0.7)
    for t in np.arange(0.2, 1.5, 0.3): beep(t, 1400, 0.12, 0.9)   # alarm clock
    pad([D2, A2], 0.0, 5.2, 0.7, 900); taiko(1.5, 0.9, semis=-4)
    koto_trem(62, 2.0, 3.0, 0.5)
    # training montage
    for k, b0 in enumerate(np.arange(5.0, 17.0, B)):
        r = [D2, D2, Bb2 - 12, C3 - 12][k % 4]
        groove(b0, 1 if b0 < 11 else 2); bass_bar(b0, r); riff_bar(b0, r, 0.7, 12 if b0 >= 11 else 0)
    for t in np.arange(5.1, 10.9, 1 / 4.5): wood(t, 0.12)        # rep counter ticks
    chime(10.0, 86, 0.9)                                            # 100/100 COMPLETE
    whoosh(11.0); whoosh(13.4, 1.2); whoosh(14.3, 1.0)              # the rooftop leap
    for bo, m, L in [(11, 74, 1.0), (12, 75, 0.5), (12.5, 74, 0.5), (13, 69, 2.0), (15, 70, 1.0), (16, 74, 1.0)]: flute(m, bo, L, 0.9)
    crash(16.9, 0.8)
    # level up
    pad([D2 + 12, A2 + 12, 62 + 12], 17.0, 6.2, 0.6, 2200)
    for i, m in enumerate([62, 69, 74, 77, 81, 86]): chime(17.8 + i * 0.45, m, 0.5)
    impact(20.4, 0.9); koto_gliss(20.4, up=True, v=1.0)
    for i, m in enumerate([86, 89, 93]): chime(20.6 + i * 0.12, m, 0.6)
    # the hall goes quiet for Hana
    whoosh(23.0)
    pad([G2, D2 + 12, Bb2], 23.0, 6.6, 0.6, 1000)
    for t in np.arange(23.4, 27.5, 0.9): footstep(t, 0.8, -0.3)
    koto_trem(70, 24.0, 3.5, 0.4)
    # the blade
    shing(29.4, 1.4); taiko(29.4, 0.8, semis=-2)
    pad([D2, Eb2 + 12], 29.4, 5.8, 0.6, 800)
    for t in np.arange(30.0, 35.0, 1.0): heartbeat(t, 0.7)
    # "Nothing you'd survive."
    whoosh(35.0)
    bass808(D2 - 12, 35.0, 2.4, v=0.5)
    riser(37.6, '2s', 0.8)
    impact(37.6, 1.1); bass808(D2 - 12, 37.6, 4.0, glide_from=D2, v=1.1)
    koto_gliss(37.6, up=False, v=0.8); pad([D2, A2, 62], 37.6, 4.6, 0.7, 1400)
    # the sky bleeds
    whoosh(42.0); siren(42.2, 7.6, 1.0)
    impact(43.0, 0.9)
    for t in (43.0, 43.9, 45.3, 47.6): taiko(t, 0.8, semis=-7); crash(t, 0.35)
    for k, b0 in enumerate(np.arange(44.0, 50.0, B)):
        r = [D2, Eb2, Bb2 - 12][k % 3]
        groove(b0, 2); bass_bar(b0, r); riff_bar(b0, r, 0.75, 12)
    glitch(44.6, 0.7)
    # walking into the red gate
    pad([D2, A2, 62, 65, 69], 50.0, 5.4, 0.9, 1800)
    for t in np.arange(50.3, 55.0, 0.66): footstep(t, 0.9)
    flute(69, 50.5, 2.0, 0.8); flute(70, 52.5, 1.0, 0.8); flute(74, 53.5, 1.4, 0.9)
    riser(55.0, '4s', 0.8)
    # the Hollow King
    taiko(55.0, 1.0, semis=-7); pad([D2 - 12, Eb2], 55.0, 5.0, 0.9, 500)
    impact(56.6, 1.1); bass808(D2 - 12, 56.6, 1.4, v=1.0)
    impact(58.0, 1.2); koto_gliss(58.0, up=False, v=0.9); bass808(D2 - 12, 58.0, 2.0, v=1.1)

# ---------------------------------------------------------------- mix
kick_env = np.convolve(np.abs(buses['kick'][:, 0]), np.ones(441) / 441, 'same')
kick_env /= kick_env.max() + 1e-9
duck = 1 - 0.4 * np.clip(kick_env * 3, 0, 1)
duck = np.convolve(duck, np.ones(2205) / 2205, 'same')[:, None]
mix = (reverb(buses['kick'], 1.2, 0.2, 1) * 0.45
       + reverb(buses['drums'], 1.4, 0.25, 2) * 1.4
       + reverb(buses['music'], 2.6, 0.5, 3) * 1.5 * duck
       + reverb(buses['lead'], 3.2, 0.55, 4) * 0.9 * duck
       + buses['bass'] * 0.3 * duck
       + reverb(buses['fx'], 2.4, 0.3, 5) * 1.0)
mix = mix[: int(TOTAL * SR)]
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 2.0) / np.tanh(2.0)
fade = int(1.2 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
mix *= 0.93 / (np.max(np.abs(mix)) + 1e-9)
pcm = (mix * 32767).astype(np.int16)
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', OUT)
