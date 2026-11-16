"""Original music cues for the videos, written as MIDI and rendered with FluidSynth.

Needs `fluidsynth` and the FluidR3 GM soundfont (Debian/Ubuntu: apt install fluidsynth fluid-soundfont-gm).
render(name) returns the path of a 48 kHz stereo WAV, cached in tools/.cache/.
"""
import os, random, subprocess
import mido

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, ".cache")
SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
TPB = 480
NAMES = {"C": 0, "Db": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11}
QUAL = {"": (0, 4, 7), "m": (0, 3, 7), "maj7": (0, 4, 7, 11), "m7": (0, 3, 7, 10), "7": (0, 4, 7, 10),
        "add9": (0, 4, 7, 14), "m9": (0, 3, 7, 10, 14), "maj9": (0, 4, 7, 11, 14), "9": (0, 4, 7, 10, 14)}


def chord(name, octave=4):
    root = next(r for r in sorted(NAMES, key=len, reverse=True) if name.startswith(r))
    base = 12 * (octave + 1) + NAMES[root]
    return [base + i for i in QUAL[name[len(root):]]]


class Song:
    def __init__(self, bpm, seed=1):
        self.bpm, self.ev, self.prog = bpm, [], {}
        self.r = random.Random(seed)

    def program(self, ch, prog):
        self.prog[ch] = prog

    def note(self, ch, beat, dur, pitch, vel, human=True):
        if human and ch != 9:
            beat += self.r.uniform(-0.015, 0.015)
            vel += self.r.randint(-5, 5)
        self.ev.append((max(0, beat), dur, ch, int(pitch), max(1, min(127, int(vel)))))

    def notes(self, ch, beat, dur, pitches, vel, spread=0.0):
        for i, p in enumerate(pitches):
            self.note(ch, beat + i * spread, dur, p, vel)

    def save(self, path):
        mid = mido.MidiFile(ticks_per_beat=TPB)
        tr = mido.MidiTrack()
        mid.tracks.append(tr)
        tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(self.bpm)))
        msgs = []
        for ch, p in self.prog.items():
            msgs.append((0, 0, mido.Message("program_change", channel=ch, program=p)))
            msgs.append((0, 0, mido.Message("control_change", channel=ch, control=91, value=70)))  # reverb send
        for b, d, ch, p, v in self.ev:
            msgs.append((int(b * TPB), 1, mido.Message("note_on", channel=ch, note=p, velocity=v)))
            msgs.append((int((b + d) * TPB), 0, mido.Message("note_off", channel=ch, note=p, velocity=0)))
        msgs.sort(key=lambda m: (m[0], m[1]))
        now = 0
        for t, _, m in msgs:
            tr.append(m.copy(time=t - now))
            now = t
        mid.save(path)


def warm():  # unhurried strings and piano, D major
    s = Song(72)
    s.program(0, 48); s.program(1, 0); s.program(2, 42)
    prog = ["D", "Bm", "G", "A"] * 3 + ["G", "D"]
    for bar, c in enumerate(prog):
        b = bar * 4
        s.notes(0, b, 4.1, chord(c, 4), 42 + bar * 2)
        s.note(2, b, 4, chord(c, 2)[0], 52)
        if bar >= 2:
            tones = chord(c, 4) + [chord(c, 5)[0]]
            for i, k in enumerate([0, 1, 2, 3, 2, 1, 2, 3]):
                s.note(1, b + i * 0.5, 0.9, tones[k], 40 + (8 if i == 0 else 0))
    return s


def night():  # dark ambient pad and celesta, A minor
    s = Song(60, seed=2)
    s.program(0, 89); s.program(1, 8); s.program(2, 42)
    scale = [69, 72, 74, 76, 79, 81, 84]
    for bar, c in enumerate(["Am", "Fmaj7", "C", "G"] * 3):
        b = bar * 4
        s.notes(0, b, 4.1, chord(c, 4), 52)
        s.note(2, b, 4, chord(c, 2)[0], 38)
        for beat in range(4):
            if s.r.random() < 0.4:
                s.note(1, b + beat + s.r.choice([0, 0.5]), 1.5, s.r.choice(scale), 38)
    return s


def lux(drums=True):  # Rhodes, pad and bass for products; light pulse optional
    s = Song(84, seed=3)
    s.program(0, 4); s.program(1, 89); s.program(2, 33)
    for bar, c in enumerate(["Fmaj7", "Em7", "Dm7", "Cmaj7"] * 4):
        b = bar * 4
        v = chord(c, 4)
        s.notes(0, b, 1.6, v, 58, spread=0.02)
        s.notes(0, b + 2.5, 1.2, v, 50, spread=0.02)
        s.notes(1, b, 4.1, chord(c, 3), 34)
        root = chord(c, 2)[0]
        s.note(2, b, 1.5, root, 62); s.note(2, b + 2.5, 0.5, root + 12, 50); s.note(2, b + 3.5, 0.4, root + 7, 44)
        if drums and bar >= 2:
            for k in (0, 2.5):
                s.note(9, b + k, 0.2, 36, 62)
            for k in (1, 3):
                s.note(9, b + k, 0.2, 37, 40)
            for i in range(8):
                s.note(9, b + i * 0.5, 0.1, 42, 26 + (8 if i % 2 == 0 else 0))
    return s


def food():  # bright acoustic guitar, pizzicato and percussion, G major
    s = Song(112, seed=4)
    s.program(0, 24); s.program(1, 45); s.program(2, 32); s.program(3, 9)
    motif = [(0, 79), (0.5, 81), (1, 83), (2, 81), (3, 79), (3.5, 76)]
    for bar, c in enumerate(["G", "D", "Em", "C"] * 5):
        b = bar * 4
        v = chord(c, 3) + [chord(c, 4)[0]]
        for k, vel in [(0, 62), (1, 52), (1.5, 44), (2.5, 44), (3, 56), (3.5, 42)]:
            s.notes(0, b + k, 0.6, v if vel > 50 else v[::-1], vel, spread=0.015)
        s.note(2, b, 1, chord(c, 2)[0], 64); s.note(2, b + 2, 1, chord(c, 2)[2], 56)
        for k in range(4):
            s.note(1, b + k, 0.3, chord(c, 3)[k % 3], 46)
        if bar % 8 in (4, 5):
            for k, p in motif:
                s.note(3, b + k, 0.5, p if bar % 8 == 4 else {79: 78, 76: 74}.get(p, p), 50)  # fit the D chord
        if bar >= 1:
            for k in (0, 2):
                s.note(9, b + k, 0.2, 36, 66)
            for k in (1, 3):
                s.note(9, b + k, 0.2, 37, 52)
            for i in range(8):
                s.note(9, b + i * 0.5, 0.1, 70, 30 + (10 if i % 2 else 0))
            for i in range(4):
                s.note(9, b + i + 0.5, 0.1, 54, 26)
    return s


def pulse():  # minimal house for fashion and dance, A minor
    s = Song(122, seed=5)
    s.program(0, 89); s.program(1, 38); s.program(2, 5)
    for bar, c in enumerate(["Am", "F", "C", "G"] * 5):
        b = bar * 4
        s.notes(0, b, 4.1, chord(c, 4), 44)
        for k in range(4):
            s.note(9, b + k, 0.2, 36, 100)
            s.note(9, b + k + 0.5, 0.1, 42, 58)
        if bar >= 2:
            for k in (1, 3):
                s.note(9, b + k, 0.2, 39, 72)
            for k in range(4):
                s.note(1, b + k + 0.5, 0.35, chord(c, 2)[0], 82)
            if bar % 2:
                s.note(9, b + 3.5, 0.3, 46, 50)
        if bar >= 6:
            for k in (1.5, 3):
                s.notes(2, b + k, 0.25, chord(c, 4), 52)
    return s


def reel():  # cinematic build for the showreel: 96 BPM, 60 beats, final chord on beat 52
    s = Song(96, seed=6)
    for ch, p in {0: 48, 1: 0, 2: 48, 3: 43, 4: 60, 5: 47}.items():
        s.program(ch, p)
    prog = ["Dm", "Bb", "F", "C", "Dm", "Bb", "F", "C", "Gm", "Bb", "F", "A", "Bb", "C"]
    for bar, c in enumerate(prog):
        b = bar * 4
        s.notes(0, b, 4.05, chord(c, 4), min(90, 46 + bar * 3))
        if bar < 4:
            for i, k in enumerate([2, 1, 0, 1]):
                s.note(1, b + i, 0.9, chord(c, 5)[k % 3], 52)
        if bar >= 4:
            r = chord(c, 3)
            for i in range(8):
                s.note(2, b + i * 0.5, 0.35, [r[0], r[2], r[0] + 12, r[2]][i % 4], 58 + bar * 2, human=False)
            s.note(3, b, 4, chord(c, 2)[0], 64)
        if bar >= 8:
            s.notes(4, b, 4, chord(c, 3), 50 + (bar - 8) * 4)
            s.note(5, b, 1, chord(c, 2)[0], 90)
            for k in (1.5, 2.5, 3):
                s.note(9, b + k, 0.2, [45, 47, 43][int(k) % 3], 60)
        if bar == 8:
            s.note(9, b, 1, 49, 95)
        if bar >= 6:
            s.note(9, b, 0.2, 35, 70)
    for i in range(16):  # snare roll into the final hit
        s.note(9, 48 + i * 0.25, 0.1, 38, 40 + i * 4)
    s.notes(0, 52, 8, chord("Dm", 4) + chord("Dm", 3), 92)
    s.notes(4, 52, 8, chord("Dm", 3), 80)
    s.note(3, 52, 8, 38, 80); s.note(5, 52, 2, 38, 110); s.note(9, 52, 2, 49, 110); s.note(9, 52, 1, 35, 110)
    s.notes(1, 52, 6, [62, 69, 74, 77], 70)
    return s


# ---------- cues written to picture for the spec ads (tools/spots.py) ----------
# Each shot gets its own chord, so every cut lands on a change; the end card gets the resolving hit.

def spot_food():  # Ember & Crust, 112 BPM: shots of 3 beats, hit on the end card at beat 9, button at 16
    s = Song(112, seed=11)
    for ch, p in {0: 24, 1: 45, 2: 32, 3: 9, 4: 48}.items():
        s.program(ch, p)
    for b0, c in [(0, "G"), (3, "Em"), (6, "C")]:
        v = chord(c, 3) + [chord(c, 4)[0]]
        for k in range(6):
            s.notes(0, b0 + k * 0.5, 0.45, v if k % 2 == 0 else v[::-1], 68 if k % 2 == 0 else 50, spread=0.012)
        r = chord(c, 2)[0]
        s.note(2, b0, 1.3, r, 72); s.note(2, b0 + 1.5, 0.5, r + 7, 60); s.note(2, b0 + 2, 0.9, r + 12, 62)
        for k in range(3):
            s.note(1, b0 + k + 0.5, 0.3, chord(c, 4)[k % 3], 50)
        for k in range(3):
            s.note(9, b0 + k, 0.2, 36, 74 if k == 0 else 62)
            s.note(9, b0 + k + 0.5, 0.1, 42, 40)
        s.note(9, b0 + 1, 0.2, 39, 58)
    for k, p in [(3, 79), (3.5, 81), (4, 83), (5, 79), (6, 76), (6.5, 79), (7, 84), (8, 79)]:
        s.note(3, k, 0.5, p, 54)
    for i in range(4):  # little fill into the end card
        s.note(9, 8 + i * 0.25, 0.1, 38, 50 + i * 8)
    s.notes(4, 9, 3, chord("G", 3) + chord("G", 4), 84)  # the hit
    s.notes(0, 9, 1.5, chord("G", 3) + [67, 71], 92, spread=0.01)
    s.note(2, 9, 2, 31, 90); s.note(9, 9, 2, 49, 96); s.note(9, 9, 0.3, 36, 100)
    for b0, c in [(10, "C"), (12, "G"), (14, "C")]:  # lighter groove under the logo
        v = chord(c, 3) + [chord(c, 4)[0]]
        for k in range(4):
            s.notes(0, b0 + k * 0.5, 0.45, v if k % 2 == 0 else v[::-1], 52 if k % 2 == 0 else 40, spread=0.012)
        s.note(2, b0, 1.5, chord(c, 2)[0], 60)
        for k in range(2):
            s.note(9, b0 + k, 0.2, 36, 54)
            s.note(9, b0 + k + 0.5, 0.1, 70, 36)
    for k, p in [(13, 79), (13.5, 83), (14, 86), (15, 83), (15.5, 86)]:
        s.note(3, k, 0.5, p, 50)
    s.notes(0, 16, 0.4, chord("G", 3) + [67, 71], 88, spread=0.008)  # button
    s.notes(1, 16, 0.3, chord("G", 4), 70)
    s.note(2, 16, 0.4, 31, 88); s.note(9, 16, 0.2, 36, 96); s.note(9, 16, 1.5, 57, 70)
    s.notes(4, 16, 2.2, chord("G", 4), 58)
    return s


def spot_lux():  # Halden silver, 84 BPM: Am9, Fmaj7, Dm9, G7 under the shots, Cmaj9 on the ring hero at beat 13
    s = Song(84, seed=12)
    for ch, p in {0: 4, 1: 89, 2: 33, 3: 8}.items():
        s.program(ch, p)
    plan = [(0, 3, "Am9"), (3, 4, "Fmaj7"), (7, 3, "Dm9"), (10, 3, "G7")]
    for b0, ln, c in plan:
        v = chord(c, 4)
        s.notes(0, b0, ln * 0.55, v, 60, spread=0.02)
        s.notes(0, b0 + 1.5, 1.2, v, 46, spread=0.02)
        s.notes(1, b0, ln + 0.1, chord(c, 3)[:3], 36)
        r = chord(c, 2)[0]
        s.note(2, b0, 1.4, r, 66); s.note(2, b0 + 2, 0.8, r + 7, 52)
        if b0 >= 3:
            for k in range(ln):
                s.note(9, b0 + k, 0.2, 36 if k % 2 == 0 else 37, 52 if k % 2 == 0 else 36)
                s.note(9, b0 + k + 0.5, 0.1, 82, 30)
    for b0, c in [(0, "Am9"), (10, "G7")]:  # celesta sparkle over the prism shots
        for i, p in enumerate(chord(c, 5)[1:] * 2):
            s.note(3, b0 + i * 0.5, 0.45, p + (12 if i >= 4 else 0), 44 + i * 2)
    v = chord("Cmaj9", 4)
    s.notes(0, 13, 5, v, 72, spread=0.03); s.notes(1, 13, 5, chord("Cmaj7", 3), 46)
    s.note(2, 13, 5, 36, 74); s.note(9, 13, 0.3, 36, 70); s.note(9, 13, 3, 57, 52)
    for i, p in enumerate([72, 76, 79, 83, 86, 88]):
        s.note(3, 13.5 + i * 0.25, 1.5, p, 50 - i * 2)
    return s


def spot_jazz():  # Larchmoor whisky, 76 BPM: a piano trio comes in when the needle drops (beat 3), Dm9 at beat 13
    s = Song(76, seed=13)
    for ch, p in {0: 0, 1: 32}.items():
        s.program(ch, p)
    s.program(9, 40)  # brush kit
    plan = [(3, 3, "Dm9"), (6, 2, "G9"), (8, 3, "Cmaj9"), (11, 2, "A7")]
    walk = {"Dm9": [38, 41, 45, 43], "G9": [43, 47], "Cmaj9": [36, 40, 43], "A7": [45, 44]}
    for b0, ln, c in plan:
        v = chord(c, 3)[1:]  # rootless voicing
        s.notes(0, b0 + 0.67, 0.9, v, 50, spread=0.01)
        if ln == 3:
            s.notes(0, b0 + 2, 0.6, v, 40, spread=0.01)
        for k in range(ln):
            s.note(1, b0 + k, 0.9, walk[c][k % len(walk[c])], 72 - k * 4)
            s.note(9, b0 + k, 0.4, 51, 48 + (6 if k % 2 else 0))
            if k % 2:
                s.note(9, b0 + k + 0.67, 0.2, 51, 34)
            s.note(9, b0 + k, 0.5, 40 if k % 2 == 0 else 38, 34 if k % 2 == 0 else 44)
    for k, p in [(4.67, 81), (5, 77), (5.67, 76), (8.67, 79), (9, 76), (9.67, 74), (10, 72), (11.67, 73), (12, 76)]:
        s.note(0, k, 0.5, p, 54)
    s.notes(0, 12.67, 0.3, [74, 77, 81], 46, spread=0.06)  # pickup run into the final chord
    s.notes(0, 13, 5, [50, 53, 57, 60, 64, 69, 76], 66, spread=0.035)
    s.note(1, 13, 5, 26, 78); s.note(9, 13, 3, 51, 60); s.note(9, 13, 2, 40, 40)
    return s


CUES = {"warm": warm, "night": night, "lux": lux, "lux_soft": lambda: lux(False), "food": food,
        "pulse": pulse, "reel": reel,
        "spot_food": spot_food, "spot_lux": spot_lux, "spot_jazz": spot_jazz}


def render(name):
    os.makedirs(CACHE, exist_ok=True)
    wav = os.path.join(CACHE, f"{name}.wav")
    if not os.path.exists(wav):
        mid = os.path.join(CACHE, f"{name}.mid")
        CUES[name]().save(mid)
        subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.6", "-r", "48000", "-F", wav, SF2, mid],
                       check=True, capture_output=True)
    return wav


if __name__ == "__main__":
    for n in CUES:
        print(n, render(n))
