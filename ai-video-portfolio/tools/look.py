"""Natural-look pass for AI clips.

AI video tends to look plastic (too sharp, too clean, too saturated) and to warp for a few
frames around every internal cut. This pass:
  * shaves TRIM seconds off both sides of each detected cut (where the warping happens),
  * joins the remaining shots with short dissolves instead of hard jumps,
  * fades in and out at the ends so clips loop smoothly,
  * grades the result with a light film look: softer contrast, lifted blacks, a little less
    saturation, slight lens softness, halation on highlights, vignette and fine grain.
"""
import subprocess

XF = 0.3     # dissolve length at an internal cut (s)
TRIM = 0.12  # trimmed from each side of a cut (s)
EDGE = 0.25  # fade at the start and end of a shot (s)
SCALE = "scale=1280:-2:flags=lanczos"


def grade(scale=SCALE):
    pre = f"{scale}," if scale else ""
    return (f"{pre}gblur=sigma=0.55,eq=contrast=0.95:saturation=0.85,"
            "curves=master='0/0.035 0.25/0.24 0.75/0.745 1/0.965',rgbashift=rh=1:bh=-1,"
            "split[ga][gb];[gb]gblur=sigma=14[gg];[ga][gg]blend=all_mode=screen:all_opacity=0.07,"
            "vignette=angle=PI/6,noise=c0s=7:c0f=t+u:c1s=2:c1f=t+u:c2s=2:c2f=t+u,format=yuv420p")


def has_audio(f):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index",
                        "-of", "csv=p=0", f], capture_output=True, text=True)
    return bool(r.stdout.strip())


def segments(cuts, dur, drop=(), min_len=1.0):
    """Shots between cuts, minus the dropped indices (counted from 0) and the warped edges."""
    b = [0.0] + list(cuts) + [dur]
    segs = []
    for i in range(len(b) - 1):
        a, z = b[i], b[i + 1]
        if i in drop:
            continue
        if i > 0:
            a += TRIM
        if i < len(b) - 2:
            z -= TRIM
        if z - a >= min_len:
            segs.append((round(a, 3), round(z, 3)))
    return segs


def timeline(cuts, dur, drop=()):
    """Where each kept shot lands in the processed clip: {original index: (start, end)} in seconds."""
    b = [0.0] + list(cuts) + [dur]
    out, t = {}, 0.0
    for i, (a, z) in enumerate(zip(b, b[1:])):
        if i in drop:
            continue
        a, z = a + (TRIM if i else 0), z - (TRIM if i < len(b) - 2 else 0)
        if z - a < 1.0:
            continue
        out[i] = (round(t, 3), round(t + z - a, 3))
        t += z - a - XF
    return out


def process(src, out, cuts, dur, drop=(), soft=True, crf=25, keep_audio=True, pre="", scale=SCALE, abr="96k"):
    """Write the cleaned, graded clip to `out`. Returns (segments, length in seconds) or None."""
    segs = segments(cuts, dur, drop) if soft else [(0.0, dur)]
    aud = keep_audio and has_audio(src)
    pre = f"{pre}," if pre else ""
    fc = []
    for i, (a, z) in enumerate(segs):
        fc.append(f"[0:v]{pre}trim={a}:{z},setpts=PTS-STARTPTS,fps=24,settb=AVTB[v{i}]")
        if aud:
            fc.append(f"[0:a]atrim={a}:{z},asetpts=PTS-STARTPTS[a{i}]")
    vlab, alab, length = "v0", "a0", segs[0][1] - segs[0][0]
    for i in range(1, len(segs)):
        fc.append(f"[{vlab}][v{i}]xfade=transition=fade:duration={XF}:offset={length - XF:.3f}[vx{i}]")
        if aud:
            fc.append(f"[{alab}][a{i}]acrossfade=d={XF}[ax{i}]")
        vlab, alab = f"vx{i}", f"ax{i}"
        length += (segs[i][1] - segs[i][0]) - XF
    if soft:  # fade in and out so looping clips don't jump back to the start
        fc.append(f"[{vlab}]fade=t=in:st=0:d={EDGE},fade=t=out:st={length - EDGE:.3f}:d={EDGE}[vf]")
        vlab = "vf"
        if aud:
            fc.append(f"[{alab}]afade=t=in:st=0:d={EDGE},afade=t=out:st={length - EDGE:.3f}:d={EDGE}[af]")
            alab = "af"
    fc.append(f"[{vlab}]{grade(scale)}[vout]")
    args = ["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", src, "-filter_complex", ";".join(fc), "-map", "[vout]"]
    args += ["-map", f"[{alab}]", "-c:a", "aac", "-b:a", abr] if aud else ["-an"]
    args += ["-c:v", "libx264", "-preset", "veryfast", "-crf", str(crf), "-pix_fmt", "yuv420p",
             "-movflags", "+faststart", out]
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode:
        print("FAIL", out, r.stderr[-600:], flush=True)
        return None
    return segs, round(length, 2)
