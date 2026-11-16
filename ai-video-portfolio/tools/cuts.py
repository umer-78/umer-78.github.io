"""Detect the internal cuts in each AI shot and ad and write tools/cuts.json (used by encode.py)."""
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from data import ADS, SHOTS, SRC_ADS, SRC_CLIPS, slugify


def cuts(f, thr=0.22):
    r = subprocess.run(["ffmpeg", "-nostdin", "-i", f, "-vf", f"select='gt(scene,{thr})',showinfo", "-an", "-f", "null", "-"],
                       capture_output=True, text=True)
    ts = [round(float(m), 2) for m in re.findall(r"pts_time:([0-9.]+)", r.stderr)]
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f],
                             capture_output=True, text=True).stdout)
    return dict(cuts=ts, dur=round(d, 2))


out = {cid: cuts(f"{SRC_CLIPS}/{cid}.mp4") for cid, *_ in SHOTS}
out.update({slugify(a["title"]): cuts(f"{SRC_ADS}/{a['src']}") for a in ADS})
with open(os.path.join(HERE, "cuts.json"), "w") as fh:
    fh.write("{\n" + ",\n".join(f' "{k}": {json.dumps(v)}' for k, v in out.items()) + "\n}\n")
print(len(out), "clips")
