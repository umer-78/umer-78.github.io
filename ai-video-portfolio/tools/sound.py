"""Sound for every video: natural ambience synthesised for the scene, an original music bed (music.py)
and a few synced accents (whoosh and impact on logo reveals), mixed to an even loudness.

The recipe for each video is in SOUND (data.py). mix(key, dur, segs) returns a 48 kHz stereo array.
"""
import os, subprocess
import numpy as np
import pyloudnorm
from scipy.io import wavfile
from scipy.ndimage import minimum_filter1d
from scipy.signal import butter, sosfilt, fftconvolve, lfilter
import music

SR = 48000


# ---------- building blocks ----------
def _f(x, kind, f, order=2):
    return sosfilt(butter(order, f, btype=kind, fs=SR, output="sos"), x, axis=0)


def _white(n, r):
    return r.standard_normal(n)


def _pink(n, r):
    X = np.fft.rfft(r.standard_normal(n))
    k = np.arange(len(X)); k[0] = 1
    y = np.fft.irfft(X / np.sqrt(k), n)
    return y / (y.std() + 1e-9)


def _brown(n, r):
    y = _f(np.cumsum(r.standard_normal(n)), "highpass", 25)
    return y / (y.std() + 1e-9)


def _smooth(n, rate, r, lo=0.0, hi=1.0):
    k = max(3, int(n / SR * rate) + 3)
    return lo + (hi - lo) * np.interp(np.arange(n), np.linspace(0, n, k), r.random(k))


def _events(n, rate, r):
    """Random event start samples at an average rate per second."""
    t, out = 0.0, []
    while True:
        t += r.exponential(1 / rate)
        if t * SR >= n:
            return out
        out.append(int(t * SR))


def _place(n, starts, make, r):
    y = np.zeros(n)
    for s in starts:
        g = make(r)
        e = min(n, s + len(g))
        y[s:e] += g[: e - s]
    return y


def _decay(sec, tau):
    return np.exp(-np.arange(int(sec * SR)) / (tau * SR))


def _tone(freqs, sec, tau, r, amps=None):
    t = np.arange(int(sec * SR)) / SR
    amps = amps or [1] * len(freqs)
    return sum(a * np.sin(2 * np.pi * f * t + r.random() * 6.28) for f, a in zip(freqs, amps)) * np.exp(-t / tau)


def reverb(x, rt=1.2, wet=0.25, seed=0):
    r = np.random.default_rng(seed)
    n = int(rt * SR)
    env = np.exp(-6.9 * np.arange(n) / n)
    out = np.empty_like(x)
    for c in range(2):
        ir = _f(r.standard_normal(n) * env, "lowpass", 6000)
        ir /= np.sqrt((ir ** 2).sum())
        out[:, c] = fftconvolve(x[:, c], ir)[: len(x)]
    return (1 - wet) * x + wet * out


def _stereo(fn, n, seed, width=1.0):
    a = fn(n, np.random.default_rng(seed))
    b = fn(n, np.random.default_rng(seed + 101))
    m = (a + b) / 2
    return np.stack([m + width * (a - m), m + width * (b - m)], 1)


# ---------- ambience and foley (each returns mono; stereo is made by _stereo) ----------
def fire(n, r, roar=0.6, rate=22):
    body = _f(_brown(n, r), "lowpass", 500) * _smooth(n, 2.5, r, 0.6, 1.0) * roar
    amps = lambda r: min(r.pareto(2.2) + 0.2, 3.0)
    cr = _place(n, _events(n, rate, r), lambda r: amps(r) * r.standard_normal(int(SR * 0.004)) * _decay(0.004, 0.0012), r)
    return body + 1.6 * _f(cr, "bandpass", [1200, 7000])


def flame(n, r):
    return fire(n, r, roar=0.5, rate=3) * 0.8


def sizzle(n, r):
    bub = _smooth(n, 40, r) ** 3
    pops = _place(n, _events(n, 180, r), lambda r: r.random() * r.standard_normal(60) * _decay(60 / SR, 0.0004), r)
    return _f(_white(n, r), "highpass", 2500) * (0.35 + bub) + 0.8 * _f(pops, "highpass", 1500)


def wind(n, r, strength=1.0):
    g = _smooth(n, 0.25, r, 0.35, 1.0) * strength
    lo = _f(_pink(n, r), "bandpass", [70, 420]) * g
    hi = _f(_pink(n, r), "bandpass", [300, 1600]) * g ** 2 * 0.5
    return lo + hi


def waves(n, r, period=7.5):
    t = np.arange(n) / SR
    ph = 2 * np.pi * t / period + 0.6 * np.sin(2 * np.pi * t / (period * 2.7)) + r.random() * 6
    swell = 0.2 + 0.8 * (0.5 - 0.5 * np.cos(ph)) ** 2
    wash = 0.2 + 0.8 * (0.5 - 0.5 * np.cos(ph - 0.9)) ** 3
    return _f(_brown(n, r), "lowpass", 900) * swell + 0.45 * _f(_white(n, r), "bandpass", [1500, 9000]) * wash


def lap(n, r):
    burst = lambda r: _f(r.standard_normal(int(SR * 0.7)), "bandpass", [180, 1100]) * np.sin(np.linspace(0, np.pi, int(SR * 0.7))) ** 2 * (0.5 + r.random())
    return _place(n, _events(n, 0.9, r), burst, r) + 0.15 * _f(_white(n, r), "bandpass", [2000, 6000]) * _smooth(n, 6, r)


def trickle(n, r):
    return _f(_white(n, r), "bandpass", [900, 5000]) * (_smooth(n, 35, r) ** 2) + 0.3 * drips(n, r, rate=4)


def room(n, r, hall=False):
    y = _f(_pink(n, r), "lowpass", 260 if not hall else 500)
    return y * (1.0 if not hall else 1.4)


def hum(n, r, f0=50):
    t = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * f0 * k * t) for k, a in [(1, 1), (2, 0.5), (3, 0.35), (4, 0.15)])
    return y * _smooth(n, 0.5, r, 0.85, 1.0) + 0.05 * _f(_white(n, r), "bandpass", [2000, 8000])


def crickets(n, r):
    y = np.zeros(n)
    for _ in range(4):
        f, gap, amp = r.uniform(4200, 5600), r.uniform(0.45, 0.9), r.uniform(0.3, 1)
        t = np.arange(int(SR * 0.09)) / SR
        chirp = np.sin(2 * np.pi * f * t) * (np.sin(2 * np.pi * 33 * t) > 0) * np.sin(np.pi * t / 0.09)
        for s in np.arange(r.uniform(0, gap), n / SR - 0.1, gap) * SR:
            s = int(s + r.normal(0, 0.01) * SR)
            if 0 <= s < n - len(chirp):
                y[s:s + len(chirp)] += amp * chirp
    return y


def birds(n, r, rate=0.5):
    def phrase(r):
        out = []
        for _ in range(r.integers(2, 6)):
            d = r.uniform(0.05, 0.16)
            t = np.arange(int(SR * d)) / SR
            f0, f1 = r.uniform(2500, 5500), r.uniform(2000, 6500)
            f = np.linspace(f0, f1, len(t)) + 300 * np.sin(2 * np.pi * r.uniform(20, 60) * t)
            out += [np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d), np.zeros(int(SR * r.uniform(0.03, 0.12)))]
        return np.concatenate(out) * r.uniform(0.2, 1)
    return _place(n, _events(n, rate, r), phrase, r)


def drips(n, r, rate=0.7):
    def drop(r):
        d = 0.12
        t = np.arange(int(SR * d)) / SR
        f = r.uniform(900, 2200) * (1 + 1.2 * t / d)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.025) * r.uniform(0.3, 1)
    return _place(n, _events(n, rate, r), drop, r)


def engine(n, r):
    t = np.arange(n) / SR
    f0 = 62 * (1 + 0.04 * (_smooth(n, 0.3, r) - 0.5))
    ph = 2 * np.pi * np.cumsum(f0) / SR
    motor = _f(sum(np.sin(k * ph) / k for k in range(1, 9)), "lowpass", 380)
    road = _f(_brown(n, r), "lowpass", 650) + 0.3 * _f(_pink(n, r), "bandpass", [400, 2200])
    return 0.6 * motor + road


def train(n, r):
    rate = 2.1
    chuff = lambda r: _f(r.standard_normal(int(SR * 0.3)), "bandpass", [250, 2200]) * _decay(0.3, 0.07) * r.uniform(0.6, 1)
    starts = [int(s * SR) for s in np.arange(r.random() * 0.4, n / SR, 1 / rate)]
    clack = lambda r: _f(r.standard_normal(int(SR * 0.04)), "bandpass", [300, 1600]) * _decay(0.04, 0.008)
    rails = []
    for s in np.arange(0.3, n / SR, 1.45):
        rails += [int(s * SR), int((s + 0.16) * SR)]
    y = _place(n, starts, chuff, r) + 0.5 * _place(n, [s for s in rails if s < n], clack, r)
    return _f(y, "lowpass", 3500) + 0.12 * _f(_white(n, r), "highpass", 3000) + 0.4 * _f(_brown(n, r), "lowpass", 200)


def harvester(n, r):
    t = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(32 * (1 + 0.02 * _smooth(n, 0.5, r))) / SR
    rumble = _f(sum(np.sin(k * ph) / k for k in range(1, 10)), "lowpass", 320)
    whirr = _f(_white(n, r), "bandpass", [700, 2600]) * (0.6 + 0.4 * np.sin(2 * np.pi * 11 * t))
    return rumble + 0.35 * whirr


def roar(n, r):
    return (_f(_brown(n, r), "lowpass", 320) + 0.4 * _f(_pink(n, r), "bandpass", [300, 1300])) * _smooth(n, 6, r, 0.8, 1.0)


def bubbles(n, r):
    blob = lambda r: _tone([r.uniform(70, 240)], 0.25, 0.06, r) * r.uniform(0.3, 1)
    return _place(n, _events(n, 3, r), blob, r) + 0.5 * _f(_brown(n, r), "lowpass", 150)


def tick(n, r, rate=1.0, f=2300):
    def k(r):
        click = np.zeros(int(SR * 0.03))
        click[:150] = _f(r.standard_normal(150), "bandpass", [1500, 6000]) * _decay(150 / SR, 0.0008)
        return click + 0.4 * _tone([f], 0.03, 0.006, r)
    starts = [int(s * SR) for s in np.arange(0.2, n / SR, 1 / rate)]
    return _place(n, starts, k, r)


def watch(n, r):
    return tick(n, r, rate=6, f=4200) * 0.6


def vinyl(n, r):
    clicks = _place(n, _events(n, 9, r), lambda r: (r.pareto(3) + 0.1) * r.standard_normal(40) * _decay(40 / SR, 0.0003), r)
    return _f(clicks, "highpass", 900) + 0.15 * _f(_white(n, r), "bandpass", [2500, 9000]) + 0.4 * _f(_brown(n, r), "lowpass", 45)


def grinder(n, r):
    t = np.arange(n) / SR
    f0 = 1750 * (1 + 0.03 * (_smooth(n, 3, r) - 0.5))
    whine = sum(np.sin(2 * np.pi * k * np.cumsum(f0) / SR) / k for k in (1, 2, 3))
    grit = _f(_white(n, r), "bandpass", [2000, 9000]) * (0.6 + 0.4 * _smooth(n, 15, r))
    return 0.35 * whine + grit + 0.5 * fire(n, r, roar=0.1, rate=40)


def clinks(n, r, rate=3.0):
    def c(r):
        f = r.uniform(1600, 3600)
        return _tone([f, f * 2.76, f * 5.4], 0.25, r.uniform(0.03, 0.09), r, [1, 0.5, 0.25]) * r.uniform(0.3, 1)
    return _place(n, _events(n, rate, r), c, r)


def pour(n, r):
    def bub(r):
        d = r.uniform(0.015, 0.04)
        t = np.arange(int(SR * d)) / SR
        f = r.uniform(250, 900) * (1 + 0.6 * t / d)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (d / 3)) * r.uniform(0.2, 1)
    stream = _f(_white(n, r), "bandpass", [300, 2200]) * _smooth(n, 20, r, 0.4, 1.0)
    return _place(n, _events(n, 70, r), bub, r) + 0.5 * stream


def chisel(n, r):
    scrape = lambda r: _f(r.standard_normal(int(SR * 0.4)), "bandpass", [1800, 7000]) * np.sin(np.linspace(0, np.pi, int(SR * 0.4))) * r.uniform(0.4, 1)
    return _place(n, _events(n, 1.2, r), scrape, r)


def cloth(n, r):
    t = np.arange(n) / SR
    return _f(_pink(n, r), "bandpass", [500, 4500]) * (0.25 + 0.75 * np.abs(np.sin(2 * np.pi * 1.3 * t)))


def motor(n, r):
    t = np.arange(n) / SR
    return hum(n, r, 60) * 0.5 + _f(_white(n, r), "bandpass", [600, 3000]) * (0.6 + 0.4 * np.sin(2 * np.pi * 24 * t))


def beep(n, r):
    starts = [int(s * SR) for s in np.arange(0.3, n / SR, 0.92)]
    b = np.sin(2 * np.pi * 1050 * np.arange(int(SR * 0.11)) / SR) * np.hanning(int(SR * 0.11))
    return _place(n, starts, lambda r: b, r)


def tunnel(n, r):
    return _f(_pink(n, r), "bandpass", [60, 500]) * _smooth(n, 0.3, r, 0.6, 1.0)


GEN = {k: v for k, v in globals().items() if callable(v) and not k.startswith("_") and k not in
       ("reverb", "music", "butter", "sosfilt", "fftconvolve", "wavfile", "lfilter", "minimum_filter1d")}


# ---------- accents ----------
def whoosh(n, at, r, dur=0.9):
    y = np.zeros((n, 2))
    m = int(dur * SR)
    s = int(at * SR) - m
    x = _white(m, r)
    out = np.zeros(m)
    for i, c in enumerate(np.geomspace(300, 4000, 12)):
        a, b = i * m // 12, (i + 1) * m // 12
        out[a:b] = _f(x, "bandpass", [c * 0.6, c * 1.6])[a:b]
    out *= np.linspace(0, 1, m) ** 2
    pan = np.linspace(-0.6, 0.6, m)
    for c, sgn in enumerate((-1, 1)):
        seg = out * np.sqrt(0.5 + sgn * pan / 2)
        lo, hi = max(0, s), min(n, s + m)
        if hi > lo:
            y[lo:hi, c] += seg[lo - s:hi - s]
    return y


def impact(n, at, r):
    y = np.zeros((n, 2))
    m = int(1.6 * SR)
    t = np.arange(m) / SR
    boom = np.sin(2 * np.pi * np.cumsum(np.linspace(62, 38, m)) / SR) * np.exp(-t / 0.45)
    hit = _f(r.standard_normal(m), "lowpass", 2500) * np.exp(-t / 0.05)
    s = int(at * SR)
    e = min(n, s + m)
    if e > s:
        y[s:e] += ((boom + 0.5 * hit)[: e - s])[:, None]
    return reverb(y, 1.8, 0.35)


# ---------- mixing ----------
def _rms_norm(x, db=-20):
    return x * (10 ** (db / 20) / (np.sqrt(np.mean(x ** 2)) + 1e-9))


def _gate(n, spans, ramp=0.3):
    g = np.zeros(n)
    t = np.arange(n) / SR
    for a, b in spans:
        g = np.maximum(g, np.clip(np.minimum((t - a) / ramp + 1, (b - t) / ramp + 1), 0, 1))
    return g


def _music(cue, n, offset):
    sr, x = wavfile.read(music.render(cue))
    x = x.astype(float) / (32768.0 if x.dtype == np.int16 else 1.0)
    s = int(offset * SR)
    x = x[s:s + n]
    if len(x) < n:
        x = np.pad(x, ((0, n - len(x)), (0, 0)))
    return x


def load(path, n):
    r = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", path, "-vn", "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                       capture_output=True)
    x = np.frombuffer(r.stdout, np.float32).reshape(-1, 2).astype(float)[:n]
    return np.pad(x, ((0, n - len(x)), (0, 0)))


MUSIC_IN = {"warm": 6.7, "night": 0.0, "lux": 5.7, "lux_soft": 5.7, "food": 2.2, "pulse": 3.9}


def mix(recipe, dur, segs=None, seed=0, music_on=True, base=None, lufs=-18.0, edge=0.25):
    """recipe: {"amb": [(gen, dB, {opts})], "music": (cue, dB), "hits": [(time, kind, dB)]}.
    opts: segs=[indices] plays the layer only in those shots; span=(a, b) seconds; reverb=(rt, wet)."""
    n = int(round(dur * SR))
    out = np.zeros((n, 2)) if base is None else base.copy()
    for i, (name, db, *opt) in enumerate(recipe.get("amb", [])):
        o = opt[0] if opt else {}
        fn = GEN[name]
        kw = {k: v for k, v in o.items() if k not in ("segs", "span", "reverb", "width")}
        layer = _stereo(lambda m, r: fn(m, r, **kw), n, seed * 1000 + i * 17, o.get("width", 0.8))
        if "reverb" in o:
            layer = reverb(layer, *o["reverb"], seed=i)
        layer = _rms_norm(layer) * 10 ** (db / 20)
        if "segs" in o and segs:
            layer *= _gate(n, [segs[k] for k in o["segs"] if k in segs])[:, None]
        if "span" in o:
            layer *= _gate(n, [o["span"]])[:, None]
        out += layer
    if music_on and recipe.get("music"):
        cue, db = recipe["music"][:2]
        off = recipe["music"][2] if len(recipe["music"]) > 2 else MUSIC_IN.get(cue, 0.0)
        mus = _music(cue, n, off)
        if recipe.get("record"):  # heard from a record player: band-limited and warm
            mus = _f(_f(mus, "highpass", 120), "lowpass", 5500)
        out += _rms_norm(mus) * 10 ** (db / 20)
    r = np.random.default_rng(seed + 7)
    for at, kind, db in recipe.get("hits", []):
        if isinstance(at, tuple):  # ("seg", k, offset): timed from the start of shot k in the clip
            at = segs[at[1]][0] + at[2]
        h = whoosh(n, at, r) if kind == "whoosh" else impact(n, at, r)
        out += _rms_norm(h, -20) * 10 ** (db / 20) * 4
    # fade the ends so loops are smooth, then level and limit
    f = np.ones(n)
    k = int(edge * SR)
    f[:k] = np.linspace(0, 1, k)
    f[-int(0.6 * SR):] = np.minimum(f[-int(0.6 * SR):], np.linspace(1, 0, int(0.6 * SR)))
    out *= f[:, None]
    meter = pyloudnorm.Meter(SR)
    for _ in range(3):  # level to the target, then limit peaks; repeat as limiting lowers loudness
        loud = meter.integrated_loudness(out)
        if not np.isfinite(loud):
            break
        out *= 10 ** ((lufs - loud) / 20)
        out = limit(out)
    return np.clip(out, -0.708, 0.708).astype(np.float32)


def limit(x, ceil_db=-3.0, release=0.08):
    """Peak limiter: gain drops just before a peak (5 ms look-ahead) and recovers smoothly."""
    c = 10 ** (ceil_db / 20)
    g = np.minimum(1.0, c / np.maximum(np.abs(x).max(1), 1e-9))
    g = minimum_filter1d(g, int(0.01 * SR))
    a = np.exp(-1 / (release * SR))
    g = np.minimum(g, lfilter([1 - a], [1, -a], g, zi=[g[0] * a])[0])
    return x * g[:, None]


def mux(video, audio, out, kbps="128k"):
    wav = out + ".wav"
    wavfile.write(wav, SR, (np.clip(audio, -1, 1) * 32767).astype(np.int16))
    r = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", video, "-i", wav, "-map", "0:v", "-map", "1:a",
                        "-c:v", "copy", "-c:a", "aac", "-b:a", kbps, "-shortest", "-movflags", "+faststart", out],
                       capture_output=True, text=True)
    os.remove(wav)
    if r.returncode:
        raise RuntimeError(r.stderr[-400:])
