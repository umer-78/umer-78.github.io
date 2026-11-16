"""Encode every video for the web (one mp4 + one poster each) and cut the showreel.
Shots get the natural-look pass (look.py: trimmed cuts, dissolves, film grade); ads keep
their edit and only get the grade. Writes tools/manifest.json with the real size, length
and sound of each video.

Usage: SRC_CLIPS=... SRC_ADS=... python3 tools/encode.py <site folder>"""
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from data import ADS, SHOTS, SRC_ADS, SRC_CLIPS, EDITS, SHOWREEL_SHOTS, all_projects, slugify
import look

OUT = sys.argv[1] if len(sys.argv) > 1 else "."
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
CUTS = json.load(open(os.path.join(HERE, "cuts.json")))
for d in ("ads", "shots", "posters"):
    os.makedirs(f"{OUT}/media/{d}", exist_ok=True)


def run(args):
    r = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *args], capture_output=True, text=True)
    if r.returncode:
        print("FFMPEG FAIL", args[-1], r.stderr[-400:], flush=True)
    return r.returncode == 0


def probe(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height",
                        "-show_entries", "format=duration", "-of", "json", p], capture_output=True, text=True)
    j = json.loads(r.stdout)
    v = next(s for s in j["streams"] if s["codec_type"] == "video")
    return dict(w=v["width"], h=v["height"], dur=float(j["format"]["duration"]),
                audio=any(s["codec_type"] == "audio" for s in j["streams"]))


ADINFO = {slugify(a["title"]): a for a in ADS}
CID = {slugify(t): cid for cid, t, *_ in SHOTS}


def encode(p):
    s, full = p["slug"], f"{OUT}/{p['video']}"
    if p["kind"] == "ad":
        a = ADINFO[s]
        src = f"{SRC_ADS}/{a['src']}"
        look.process(src, full, [], probe(src)["dur"], soft=False, crf=22, scale="", abr="128k")
        t = a["poster_t"]
    else:
        cid = CID[s]
        c, e = CUTS[cid], EDITS.get(cid, {})
        _, length = look.process(f"{SRC_CLIPS}/{cid}.mp4", full, c["cuts"], c["dur"],
                                 drop=e.get("drop", ()), pre=e.get("pre", ""))
        t = round(length * 0.35, 2)
    o = probe(full)
    vf = "scale=-2:1280" if o["h"] > o["w"] else "scale='min(1280,iw)':-2"
    run(["-ss", str(t), "-i", full, "-frames:v", "1", "-q:v", "3", "-vf", vf, f"{OUT}/{p['poster']}"])
    m = dict(w=o["w"], h=o["h"], dur=round(o["dur"], 2), audio=o["audio"], mb=round(os.path.getsize(full) / 1e6, 2))
    print("done", s, m, flush=True)
    return s, m


with ThreadPoolExecutor(max_workers=2) as ex:
    manifest = dict(ex.map(encode, all_projects()))

# ---- Showreel: ~40 s, 1280x720, silent, short dissolves between shots ----
XS = 0.25
segs = [(f"{OUT}/media/ads/{s}.mp4", st, ln) for s, st, ln in
        [("burger-commercial", 3.0, 4.0), ("burger-commercial", 23.0, 4.5),
         ("buffalo-wings-ad", 7.0, 3.5), ("clothing-brand-reel", 5.5, 3.0)]]
for cid in SHOWREEL_SHOTS:
    sl = slugify(next(t for c, t, *_ in SHOTS if c == cid))
    segs.append((f"{OUT}/media/shots/{sl}.mp4", round(manifest[sl]["dur"] * 0.3, 2), 2.5))
inputs, fc = [], []
for i, (f, st, ln) in enumerate(segs):
    inputs += ["-ss", str(st), "-t", str(ln), "-i", f]
    fc.append(f"[{i}:v]split[x{i}][y{i}];[x{i}]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,"
              f"boxblur=28:4,eq=brightness=-0.08[bg{i}];[y{i}]scale=1280:720:force_original_aspect_ratio=decrease[fg{i}];"
              f"[bg{i}][fg{i}]overlay=(W-w)/2:(H-h)/2,fps=24,setsar=1,format=yuv420p,setpts=PTS-STARTPTS,settb=AVTB[v{i}]")
lab, total = "v0", segs[0][2]
for i in range(1, len(segs)):
    fc.append(f"[{lab}][v{i}]xfade=transition=fade:duration={XS}:offset={total - XS:.3f}[c{i}]")
    lab, total = f"c{i}", total + segs[i][2] - XS
fc.append(f"[{lab}]fade=t=in:st=0:d=0.6,fade=t=out:st={total - 0.8:.2f}:d=0.8,"
          f"drawtext=fontfile={FONT}:text='UMER HASHMI  ·  AI VIDEO':fontcolor=white:fontsize=34:"
          f"x=(w-text_w)/2:y=h-90:enable='gte(t,{total - 3.2:.2f})':alpha='min(1,(t-{total - 3.2:.2f})/0.6)'[out]")
reel = f"{OUT}/media/showreel.mp4"
if run([*inputs, "-filter_complex", ";".join(fc), "-map", "[out]", "-c:v", "libx264", "-preset", "veryfast",
        "-crf", "25", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", reel]):
    run(["-ss", "24", "-i", reel, "-frames:v", "1", "-q:v", "3", f"{OUT}/media/posters/showreel.jpg"])
    o = probe(reel)
    manifest["_showreel"] = dict(dur=round(o["dur"], 2), mb=round(os.path.getsize(reel) / 1e6, 2))
json.dump(manifest, open(os.path.join(HERE, "manifest.json"), "w"), indent=1)
print("ALL DONE", len(manifest), flush=True)
