"""Encode every video for the web (one mp4 + one poster each) and cut the showreel.
Shots get the natural-look pass (look.py: trimmed cuts, dissolves, film grade); ads keep
their edit and only get the grade; the spec spots (spots.py) are then cut from the encoded shots. Every video then gets its own sound (sound.py, music.py):
ambience for the scene, an original music bed and synced accents. The showreel is cut on the
beat of its own score. Writes tools/manifest.json with the real size, length and sound of each video.

Usage: SRC_CLIPS=... SRC_ADS=... python3 tools/encode.py <site folder> [--sound-only | --reel-only]"""
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from data import ADS, SHOTS, SPOTS, SRC_ADS, SRC_CLIPS, EDITS, SHOWREEL, SOUND, all_projects, slugify
import look, sound, spots

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
OUT = ARGS[0] if ARGS else "."
REEL_ONLY = "--reel-only" in sys.argv  # rebuild just the showreel from the encoded videos
SOUND_ONLY = "--sound-only" in sys.argv  # redo the sound of every encoded video, then the showreel
ONLY = next((a[7:].split(",") for a in sys.argv if a.startswith("--only=")), None)  # re-encode just these slugs
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


def clip_segs(key):
    """Where each shot of a video sits, {index: (start, end)}. Ads keep their hard edit cuts."""
    c, e = CUTS[key], EDITS.get(key, {})
    if key in ADINFO and ADINFO[key].get("keep"):
        b = [0.0]
        for a, z in ADINFO[key]["keep"]:
            b.append(b[-1] + z - a)
        return {i: (b[i], b[i + 1]) for i in range(len(b) - 1)}
    if key in ADINFO:
        b = [0.0] + c["cuts"] + [c["dur"]]
        return {i: (b[i], b[i + 1]) for i in range(len(b) - 1)}
    return look.timeline(c["cuts"], c["dur"], e.get("drop", ()))


def soundtrack(key, dur, music_on=True, lufs=None):
    """The mixed sound for one video (a shot id or an ad slug)."""
    rec, ad = SOUND[key], key in ADINFO
    segs = clip_segs(key)
    seed = sum(map(ord, key))
    return sound.mix(rec, dur, segs, seed=seed, music_on=music_on,
                     lufs=lufs or (-16.0 if ad else -18.0))


def add_sound(p):
    full = f"{OUT}/{p['video']}"
    key = p["slug"] if p["kind"] == "ad" else CID[p["slug"]]
    tmp = full + ".tmp.mp4"
    sound.mux(full, soundtrack(key, probe(full)["dur"]), tmp)
    os.replace(tmp, full)


def encode(p):
    s, full = p["slug"], f"{OUT}/{p['video']}"
    if p["kind"] == "ad":
        a = ADINFO[s]
        src = f"{SRC_ADS}/{a['src']}"
        look.process(src, full, [], probe(src)["dur"], soft=False, crf=22, scale="", keep_audio=False,
                     spans=a.get("keep"))
        t = a["poster_t"]
    else:
        cid = CID[s]
        c, e = CUTS[cid], EDITS.get(cid, {})
        _, length = look.process(f"{SRC_CLIPS}/{cid}.mp4", full, c["cuts"], c["dur"],
                                 drop=e.get("drop", ()), pre=e.get("pre", ""), keep_audio=False)
        t = round(length * 0.35, 2)
    add_sound(p)
    o = probe(full)
    vf = "scale=-2:1280" if o["h"] > o["w"] else "scale='min(1280,iw)':-2"
    run(["-ss", str(t), "-i", full, "-frames:v", "1", "-q:v", "3", "-vf", vf, f"{OUT}/{p['poster']}"])
    m = dict(w=o["w"], h=o["h"], dur=round(o["dur"], 2), audio=o["audio"], mb=round(os.path.getsize(full) / 1e6, 2))
    print("done", s, m, flush=True)
    return s, m


MANIFEST = os.path.join(HERE, "manifest.json")
CLIPS = [p for p in all_projects() if not p.get("spot")]  # the spec spots are cut from the encoded shots afterwards


def build_spots(only=None):
    for sp in SPOTS:
        if only is None or slugify(sp["title"]) in only:
            s, m = spots.build(sp, OUT)
            manifest[s] = m
            print("spot", s, m, flush=True)


if REEL_ONLY:
    manifest = json.load(open(MANIFEST))
elif SOUND_ONLY:
    manifest = json.load(open(MANIFEST))
    def resound(p):
        add_sound(p)
        f = f"{OUT}/{p['video']}"
        manifest[p["slug"]].update(audio=True, mb=round(os.path.getsize(f) / 1e6, 2))
        print("sound", p["slug"], flush=True)
    with ThreadPoolExecutor(max_workers=2) as ex:
        list(ex.map(resound, CLIPS))
    build_spots()
elif ONLY:
    manifest = json.load(open(MANIFEST))
    with ThreadPoolExecutor(max_workers=2) as ex:
        manifest.update(dict(ex.map(encode, [p for p in CLIPS if p["slug"] in ONLY])))
    build_spots(ONLY)
else:
    with ThreadPoolExecutor(max_workers=2) as ex:
        manifest = dict(ex.map(encode, CLIPS))
    build_spots()

# ---- Showreel: cut on the beat of its own 96 BPM score (one beat = 15 frames), ambience under the music ----
BEAT, FPS = 60 / 96, 24
POSTER = 2  # the showreel poster comes from this entry (the burger hero)
segs = []  # (file, start, beats, key)
for key, at, beats in SHOWREEL:
    ln = beats * BEAT
    if key in ADINFO:
        segs.append((f"{OUT}/media/ads/{key}.mp4", at, beats, key))
        continue
    sl = slugify(next(t for c, t, *_ in SHOTS if c == key))
    a, z = clip_segs(key)[at]
    a, z = a + look.XF + 0.05, min(z - look.XF - 0.05, manifest[sl]["dur"] - look.EDGE - 0.05)
    segs.append((f"{OUT}/media/shots/{sl}.mp4", round(max(a, (a + z - ln) / 2), 2), beats, key))
inputs, fc, starts, total = [], [], [], 0.0
for i, (f, st, beats, _) in enumerate(segs):
    inputs += ["-ss", str(st), "-t", str(beats * BEAT + 0.2), "-i", f]
    fc.append(f"[{i}:v]split[x{i}][y{i}];[x{i}]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,"
              f"boxblur=28:4,eq=brightness=-0.08[bg{i}];[y{i}]scale=1280:720:force_original_aspect_ratio=decrease[fg{i}];"
              f"[bg{i}][fg{i}]overlay=(W-w)/2:(H-h)/2,fps={FPS},setsar=1,format=yuv420p,"
              f"trim=end_frame={round(beats * BEAT * FPS)},setpts=PTS-STARTPTS[v{i}]")
    starts.append(total)
    total += beats * BEAT
T0 = total - 3.2
fc.append("".join(f"[v{i}]" for i in range(len(segs))) + f"concat=n={len(segs)}:v=1:a=0,"
          f"fade=t=in:st=0:d=0.4,fade=t=out:st={total - 0.8:.2f}:d=0.8,"
          f"drawtext=fontfile={FONT}:text='UMER HASHMI  ·  AI VIDEO':fontcolor=white:fontsize=34:"
          f"x=(w-text_w)/2:y=h-90:enable='gte(t,{T0:.2f})':alpha='min(1,(t-{T0:.2f})/0.6)'[out]")
reel = f"{OUT}/media/showreel.mp4"
silent = reel + ".v.mp4"
if run([*inputs, "-filter_complex", ";".join(fc), "-map", "[out]", "-c:v", "libx264", "-preset", "veryfast",
        "-crf", "25", "-pix_fmt", "yuv420p", "-an", silent]):
    n = int(round(total * sound.SR))
    amb = sound.np.zeros((n, 2))
    for (f, st, beats, key), t0 in zip(segs, starts):  # each shot's own ambience, quietly under the score
        full_len = manifest[slugify(key) if key in ADINFO else slugify(next(t for c, t, *_ in SHOTS if c == key))]["dur"]
        stem = soundtrack(key, full_len, music_on=False, lufs=-34.0)
        a, m = int(st * sound.SR), int(beats * BEAT * sound.SR)
        piece = stem[a:a + m]
        ramp = sound.np.minimum(1, sound.np.minimum(sound.np.arange(len(piece)), len(piece) - sound.np.arange(len(piece))) / 960)
        b0 = int(t0 * sound.SR)
        amb[b0:b0 + len(piece)] += piece * ramp[:, None]
    score = {"music": ("reel", 0, 0.0)}
    sound.mux(silent, sound.mix(score, total, base=amb, lufs=-16.0, edge=0.4), reel)
    os.remove(silent)
    run(["-ss", f"{starts[POSTER] + 1.2:.2f}", "-i", reel, "-frames:v", "1", "-q:v", "3", f"{OUT}/media/posters/showreel.jpg"])
    o = probe(reel)
    manifest["_showreel"] = dict(dur=round(o["dur"], 2), mb=round(os.path.getsize(reel) / 1e6, 2), audio=True)
json.dump(manifest, open(MANIFEST, "w"), indent=1)
print("ALL DONE", len(manifest), flush=True)
