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
        "add9": (0, 4, 7, 14), "m9": (0, 3, 7, 10, 14)}


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


CUES = {"warm": warm, "night": night, "lux": lux, "lux_soft": lambda: lux(False), "food": food,
        "pulse": pulse, "reel": reel}


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
