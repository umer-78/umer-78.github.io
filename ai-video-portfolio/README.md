# AI Video Portfolio — Umer Hashmi

**Live site:** https://umer-78.github.io/ai-video-portfolio/

Product ads, fashion reels and cinematic shots made with AI video generation and edited into finished spots. Every video on this site is AI-generated.

## What's on the site

- **3 finished spec ads:** Burger Commercial (30s), Buffalo Wings Ad (17s), Clothing Brand Reel (10s, vertical)
- **46 single AI shots** in 9 styles: food & drink, product, craft & industry, nature, places & interiors, people, cars & sport, tech & science, animation & logos
- **A 41-second showreel** cut from the ads and the strongest shots

Each video is listed once, on the Work page, and has its own page.

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | Home page with the showreel |
| `work/` | Every video: the 3 ads, then the 46 shots with style filters and an in-page player |
| `work/<name>/` | One page per video, with its process, credits and specs |
| `about/`, `services/`, `contact/` | About me, what I make, and how to hire me through Upwork |
| `media/` | One web-ready MP4 and one poster image per video, plus the showreel |
| `tools/` | The scripts that encode the videos and generate the pages |

Plain HTML, CSS and JavaScript, with Three.js for the 3D background and GSAP for motion. Nothing to install to view it: serve the folder with any static web server.

## Adding a video

1. Add its title, style and one-line description to `tools/data.py`.
2. Find the cuts inside the new shot: `SRC_CLIPS=path/to/clips SRC_ADS=path/to/ads python3 tools/cuts.py` (writes `tools/cuts.json`).
   Per-shot fixes, such as dropping a weak shot or cropping out stray text, go in `EDITS` in `tools/data.py`.
3. Give it a sound recipe in `SOUND` in `tools/data.py`: the ambience layers for the scene (fire, waves,
   wind, night crickets, a steam train, a pour and so on), a music cue and its level, and any accents.
4. Encode the videos: `SRC_CLIPS=path/to/clips SRC_ADS=path/to/ads python3 tools/encode.py .`
   Every shot gets a natural-look pass (`tools/look.py`): glitchy frames at its cuts are trimmed, the cuts
   become short dissolves, and a light film grade with grain is added. Every video then gets its own sound
   (`tools/sound.py`): ambience synthesised for the scene and an original music bed (`tools/music.py`), mixed
   to an even loudness. The showreel is cut on the beat of its own score. This writes one MP4 and one poster
   per video, the showreel, and `tools/manifest.json`. Add `--sound-only` to redo just the sound.
5. Regenerate the pages: `python3 tools/build.py .`

Needs `ffmpeg`, `fluidsynth` with the FluidR3 GM soundfont (`apt install fluidsynth fluid-soundfont-gm`),
and Python with `numpy`, `scipy`, `mido` and `pyloudnorm`.

## Hire me

I take video projects through Upwork: https://www.upwork.com/freelancers/~01ddc1e59a4bd6f876
