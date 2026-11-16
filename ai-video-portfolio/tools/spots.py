"""Cut the spec ads (data.SPOTS) from the encoded shots: hard cuts on the beat of each ad's own cue,
slow push-ins, short supers, a brand end card, and a sound mix of the cue, scene sounds and accents.

Needs the encoded shots in <site>/media/shots/ (run encode.py first). Text is set with Pillow in
Playfair Display and Montserrat (tools/fonts, SIL Open Font License).

Usage: python3 tools/spots.py <site folder> [slug ...]"""
import json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from data import SHOTS, SPOTS, slugify
import look, sound

W, H, FPS = 1280, 720, 24
FONTS = os.path.join(HERE, "fonts")
SLUG = {cid: slugify(t) for cid, t, *_ in SHOTS}
MARGIN = 0.32  # stay clear of the dissolves inside each encoded shot (look.XF) by this much


def font(kind, size, weight=None, italic=False):
    f = ImageFont.truetype(os.path.join(FONTS, {"serif": "PlayfairDisplay-Italic.ttf" if italic else "PlayfairDisplay.ttf",
                                                "sans": "Montserrat.ttf"}[kind]), size)
    if weight:
        f.set_variation_by_name(weight)
    return f


def _line(draw, xy, text, f, fill, track=0.0, anchor="m"):
    """Draw one line with letter spacing (track, in em). anchor: l(eft) or m(iddle) at x; y is the baseline."""
    sp = track * f.size
    widths = [f.getlength(c) for c in text]
    total = sum(widths) + sp * (len(text) - 1)
    x = xy[0] - (total / 2 if anchor == "m" else 0)
    for c, w in zip(text, widths):
        draw.text((x, xy[1]), c, font=f, fill=fill, anchor="ls")
        x += w + sp
    return total


def layer(items, path, dim=0.0, low=False):
    """A full-frame RGBA overlay: optional dimming (whole frame, or a gradient up from the bottom when low)
    plus text lines with a soft shadow. items: (x, y, text, font, color, track, anchor)."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if dim:
        a = np.full((H, W), dim, float)
        if low:
            a = dim * 2.2 * np.clip((np.arange(H)[:, None] / H - 0.35) / 0.65, 0, 1) ** 1.3 * np.ones((1, W))
        img.putalpha(Image.fromarray((np.clip(a, 0, 0.85) * 255).astype(np.uint8)))
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(shadow)
    for x, y, t, f, col, tr, an in items:
        _line(d, (x, y + 2), t, f, (0, 0, 0, 170), tr, an)
    img = Image.alpha_composite(img, shadow.filter(ImageFilter.GaussianBlur(5)))
    d = ImageDraw.Draw(img)
    for x, y, t, f, col, tr, an in items:
        _line(d, (x, y), t, f, col, tr, an)
    img.save(path)


def text_layers(spot, beat, tmp):
    """PNG overlays for the supers and the end card: [(path, start s, end s, rise px)]."""
    st, serif = spot["style"], spot["style"]["font"] == "serif"
    out = []
    for i, (a, b, text) in enumerate(spot["supers"]):
        p = f"{tmp}/super{i}.png"
        if serif:
            layer([(W / 2, H - 78, text, font("serif", 56, italic=True), st["color"], 0.01, "m")], p, dim=0.26, low=True)
        else:
            layer([(84, H - 76, text, font("sans", 46, b"ExtraBold"), st["color"], 0.1, "l")], p, dim=0.26, low=True)
        out.append((p, a * beat, b * beat, 10))
    c = spot["card"]
    p = f"{tmp}/card.png"
    if serif:
        y = H * (0.80 if c.get("low") else 0.50)
        items = [(W / 2, y, c["brand"], font("serif", 82), st["accent"], 0.32, "m"),
                 (W / 2, y + 52, c["line"], font("serif", 30, italic=True), st["color"], 0.02, "m")]
    else:
        y = H * 0.52
        items = [(W / 2, y, c["brand"], font("sans", 78, b"Black"), st["color"], 0.06, "m"),
                 (W / 2, y + 50, c["line"], font("sans", 20, b"SemiBold"), st["accent"], 0.28, "m")]
    if c.get("small"):
        items.append((W / 2, H - 38, c["small"], font("sans", 14, b"Medium"), st["color"], 0.3, "m"))
    layer(items, p, dim=c["dim"], low=c.get("low", False))
    out.append((p, c["beat"] * beat, 1e9, 6))
    return out


def needle(n, at):
    """A needle dropping on a record: a soft low thump and a short burst of surface noise."""
    y = np.zeros((n, 2))
    m = int(0.35 * sound.SR)
    t = np.arange(m) / sound.SR
    r = np.random.default_rng(3)
    x = 0.8 * np.sin(2 * np.pi * 70 * t) * np.exp(-t / 0.04)
    x += 0.25 * sound._f(r.standard_normal(m), "bandpass", [800, 5000]) * np.exp(-t / 0.08)
    s = int(at * sound.SR)
    y[s:s + m] += x[: n - s, None] * 0.5
    return y


def build(spot, out, keep=False):
    slug = slugify(spot["title"])
    beat = 60 / spot["bpm"]
    bounds = [0]
    for s in spot["shots"]:
        bounds.append(bounds[-1] + s[2])
    frames = [round(b * beat * FPS) for b in bounds]  # cut frames, on the beat to within half a frame
    total = frames[-1] / FPS
    tmp = tempfile.mkdtemp(prefix=slug)
    inputs, fc = [], []
    card_t = spot["card"]["beat"] * beat
    for i, (cid, at, beats, speed, push) in enumerate(spot["shots"]):
        src = f"{out}/media/shots/{SLUG[cid]}.mp4"
        nf = frames[i + 1] - frames[i]
        seg = max(((a, b) for a, b in look.timeline(*CUTS[cid]).values() if a <= at), key=lambda x: x[0])
        need = nf / FPS * speed
        assert seg[0] + MARGIN - 0.05 <= at and at + need <= seg[1] - MARGIN + 0.03, (slug, i, seg, at, need)
        inputs += ["-ss", f"{at:.3f}", "-t", f"{need + 0.4:.3f}", "-i", src]
        ch = f"[{i}:v]setpts=(PTS-STARTPTS)/{speed},"
        ch += f"framerate=fps={FPS}," if speed != 1 else f"fps={FPS},"
        dur = nf / FPS
        if push:
            ch += (f"scale=w='2*trunc({W}*(1+{push}*t/{dur:.3f})/2)':h=-2:eval=frame:flags=bicubic,")
        ch += f"crop={W}:{H},setsar=1,format=yuv420p,trim=end_frame={nf},setpts=PTS-STARTPTS"
        if i == len(spot["shots"]) - 1 and spot["card"]["blur"]:  # the end card softens the picture behind the logo
            t0 = card_t - frames[i] / FPS
            ch += (f",split[s{i}][b{i}];[b{i}]gblur=sigma={spot['card']['blur']},format=rgba,"
                   f"fade=t=in:st={t0:.2f}:d=0.7:alpha=1[bb{i}];[s{i}][bb{i}]overlay,format=yuv420p")
        fc.append(ch + f"[v{i}]")
    n = len(spot["shots"])
    fc.append("".join(f"[v{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=0[c0]")
    for k, (png, a, b, rise) in enumerate(text_layers(spot, beat, tmp)):
        j = n + k
        inputs += ["-loop", "1", "-framerate", str(FPS), "-t", f"{total:.3f}", "-i", png]
        fade = f"fade=t=in:st={a:.2f}:d=0.45:alpha=1"
        if b < total:
            fade += f",fade=t=out:st={b - 0.3:.2f}:d=0.3:alpha=1"
        fc.append(f"[{j}:v]format=rgba,{fade}[t{k}]")
        fc.append(f"[c{k}][t{k}]overlay=x=0:y='{rise}*max(0,1-(t-{a:.2f})/0.6)':eval=frame:"
                  f"enable='between(t,{a - 0.05:.2f},{min(b, total) + 0.05:.2f})'[c{k + 1}]")
        last = k + 1
    fc.append(f"[c{last}]fade=t=out:st={total - 0.45:.2f}:d=0.45,format=yuv420p[out]")
    silent = f"{tmp}/v.mp4"
    r = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(fc),
                        "-map", "[out]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p",
                        "-an", silent], capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError(r.stderr[-1500:])
    # sound: the cue from beat 0, scene sounds gated to their shots, accents
    segs = {i: (frames[i] / FPS, frames[i + 1] / FPS) for i in range(n)}
    rec = dict(spot["sound"])
    ns = int(round(total * sound.SR))
    base = needle(ns, rec.pop("needle")) if "needle" in rec else None
    mixdown = sound.mix(rec, total, segs, seed=sum(map(ord, slug)), base=base, lufs=-16.0, edge=0.03)
    video = f"{out}/media/ads/{slug}.mp4"
    os.makedirs(os.path.dirname(video), exist_ok=True)
    sound.mux(silent, mixdown, video)
    poster = f"{out}/media/posters/{slug}.jpg"
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{spot['poster_beat'] * beat:.2f}", "-i", video,
                    "-frames:v", "1", "-q:v", "3", poster], check=True)
    if not keep:
        subprocess.run(["rm", "-rf", tmp])
    return slug, dict(w=W, h=H, dur=round(total, 2), audio=True, mb=round(os.path.getsize(video) / 1e6, 2))


CUTS = {cid: (c["cuts"], c["dur"], ()) for cid, c in json.load(open(os.path.join(HERE, "cuts.json"))).items()}
for _cid, _e in __import__("data").EDITS.items():
    if _cid in CUTS and "drop" in _e:
        CUTS[_cid] = (CUTS[_cid][0], CUTS[_cid][1], tuple(_e["drop"]))

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    site = args[0] if args else "."
    want = set(args[1:])
    man_path = os.path.join(HERE, "manifest.json")
    manifest = json.load(open(man_path)) if os.path.exists(man_path) else {}
    for sp in SPOTS:
        if want and slugify(sp["title"]) not in want:
            continue
        s, m = build(sp, site, keep="--keep" in sys.argv)
        manifest[s] = m
        print("spot", s, m, flush=True)
    json.dump(manifest, open(man_path, "w"), indent=1)
