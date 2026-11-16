"""Single source of truth for the AI video portfolio site."""
import os
import re

SITE_TITLE = "Umer Hashmi — AI Video Portfolio"
UPWORK = "https://www.upwork.com/freelancers/~01ddc1e59a4bd6f876"
GITHUB = "https://github.com/umer-78"
PORTFOLIO = "https://umer-78.github.io/"

# Where the original (un-encoded) videos live. Override with environment variables when rebuilding.
SRC_CLIPS = os.environ.get("SRC_CLIPS", "source/clips")
SRC_ADS = os.environ.get("SRC_ADS", "source/ads")
SITE_URL = "https://umer-78.github.io/ai-video-portfolio/"


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


# Finished ads: the strongest work, shown first everywhere.
ADS = [
    dict(title="Burger Commercial", src="Burger Commercial (30s).mp4", runtime="30s",
         orient="landscape", poster_t=24.0, sound=True,
         short="A 30-second commercial for a gourmet burger, from fresh ingredients to the final hero shot.",
         desc=("A 30-second spec commercial for a gourmet burger. Fresh ingredients, the patty and cheese "
               "on the grill, the build, and a hero shot that ends on the line “One bite. Endless craving.”"),
         steps=[("Concept & shot list", "Ingredients, grill, build, hero shot and end line, planned beat by beat."),
                ("AI generation", "Each shot generated with AI video from a detailed prompt, keeping one consistent look."),
                ("Edit & sound", "Shots cut to 30 seconds with the end line, scored with original music and grill sizzle.")],
         tags=["Food ad", "16:9", "With sound"]),
    dict(title="Buffalo Wings Ad", src="Buffalo Wings Ad (17s).mp4", runtime="17s",
         orient="landscape", poster_t=8.4, sound=True,
         short="A 17-second ad for buffalo wings, plated by a gloved chef in a clean restaurant kitchen.",
         desc=("A 17-second spec ad for buffalo wings. A chef in gloves plates glazed wings with celery and dip "
               "in a clean, steel restaurant kitchen. This version was remade to show proper kitchen hygiene, with gloved hands."),
         steps=[("Concept & shot list", "A plating sequence in a kitchen that looks clean and professional."),
                ("AI generation", "Shots generated with AI video, then regenerated so food hygiene is shown correctly."),
                ("Edit & sound", "Cut into a 17-second sequence that ends on the finished plate, with kitchen sound and an original music track.")],
         tags=["Food ad", "16:9", "With sound"]),
    dict(title="Clothing Brand Reel", src="Clothing Brand Reel (10s vertical).mp4", runtime="10s",
         orient="portrait", poster_t=8.1, sound=True,
         short="A 10-second vertical reel for a clothing brand, with an AI model in a clean studio.",
         desc=("A 10-second vertical (9:16) spec reel for a clothing brand. An AI model in a cream outfit with a "
               "charcoal shawl turns and poses in a clean studio, made for vertical feeds like Instagram and TikTok."),
         steps=[("Concept", "A short, clean studio reel that keeps the outfit as the hero."),
                ("AI generation", "The model and her movement generated with AI video in a vertical frame."),
                ("Edit & music", "Trimmed to a tight 10-second loop for social feeds, set to an original beat.")],
         tags=["Fashion reel", "9:16", "With music"]),
]

CATS = ["Food & Drink", "Product", "Craft & Industry", "Nature", "Places & Interiors",
        "People & Performance", "Cars & Sport", "Tech & Science", "Animation & Logos"]

# (clip id, title, category, one-line description)
SHOTS = [
    ("c01", "Wood-Fired Pizza", "Food & Drink", "An overhead pizza reveal, a stretchy cheese pull, the blistered crust and a hand lifting a slice in warm oven light."),
    ("c02", "Brewery Brand Spot", "Food & Drink", "Copper brew kettles, a beer pour from the tap and a carved wooden logo for a made-up brewery."),
    ("c04", "Handmade Paper", "Craft & Industry", "An artisan paper workshop: pulp vats, a fresh sheet lifted from the mould, paper drying on lines and a kite rising at sunset."),
    ("c05", "Sparks & Steel", "Craft & Industry", "Grinder sparks flying off a steel rail, the glowing edge, then a long railway tunnel."),
    ("c06", "Desert Silk Caravan", "Places & Interiors", "Wind-rippled dunes, merchants opening a crate of raw silk, silk threads catching the light and a camel caravan at sunset."),
    ("c07", "Glass Pavilion", "Places & Interiors", "A modern glass house beside a reflecting pool, from the timber roof down to the lounge inside."),
    ("c08", "Electronics Repair", "Tech & Science", "Soldering a vintage radio board from above, glowing vacuum tubes and a blue oscilloscope trace."),
    ("c09", "Denim Brand Spot", "People & Performance", "A model in a denim jacket against a timber slat wall breaks into movement, ending on a logo card for a made-up brand."),
    ("c10", "Luxury Watch", "Product", "A chronograph watch on dark marble: light sweeping across it, a side view of the case and a hand picking it up."),
    ("c11", "Paper Boat at Night", "Places & Interiors", "A paper boat drifting across a pond that mirrors lit windows, ending on the lamplit street beside it."),
    ("c12", "Night Drive", "Cars & Sport", "Headlights on a dark mountain road, the view from the driver's seat and red tail lights fading out."),
    ("c13", "Night Greenhouse", "Nature", "Lilies under a hanging lamp inside a glasshouse at night, seen from inside and out."),
    ("c14", "Paper-Cut Moon", "Animation & Logos", "A layered paper-cut animation of the moon changing phase between clouds and hills."),
    ("c15", "Forged Blade", "Craft & Industry", "Hammer sparks, a blade glowing on the anvil, a quench in oil and the finished steel."),
    ("c16", "Wheat Harvest", "Nature", "Low over a wheat field, a combine harvester at work, ripe ears up close and the machine at sunset."),
    ("c17", "Tide Pool", "Nature", "Macro life in a rock pool: an anemone, a hermit crab and barnacled stones."),
    ("c18", "Campfire", "People & Performance", "A campfire at night, firelight on a woman's face and sparks rising into the dark."),
    ("c19", "Ice & Glass", "Food & Drink", "Ice cubes tumbling across dark stone and filling a chilled glass."),
    ("c20", "Candle Light", "Product", "A match strikes, a candle catches and its flame lights up a dark room."),
    ("c21", "Fern Macro", "Nature", "Backlit fern leaves in close detail."),
    ("c22", "Lighthouse at Dusk", "Places & Interiors", "A lighthouse beam sweeping the sea at dusk as a ship passes."),
    ("c23", "Opera House", "Places & Interiors", "Light beams through a grand theatre, an empty chair among red seats, the gilded ceiling and a spotlit stage."),
    ("c24", "Whiskey Pour", "Food & Drink", "An empty crystal glass on oak, whiskey poured over ice and the finished drink."),
    ("c25", "Mountain Steam Train", "Places & Interiors", "A steam train climbing a mountain pass, seen from the hillside and from inside the carriage."),
    ("c26", "Medical Tech", "Tech & Science", "A patient monitor, a gentle hand on skin and a hospital scanner."),
    ("c27", "Chocolate Break", "Food & Drink", "A chocolate bar snapping apart in slow motion."),
    ("c29", "Ice Sculpture", "Craft & Industry", "Clear ice chiselled into a sculpture that ends up on a table in window light."),
    ("c30", "Vinyl Evening", "Places & Interiors", "A lamp, a record spinning on a turntable and a warm bedroom in the evening."),
    ("c31", "Blacksmith Forge", "Craft & Industry", "A blacksmith in a dark forge, hot steel on the anvil and the fire up close."),
    ("c32", "Cotton Candy", "Food & Drink", "Pink sugar spun into cotton candy inside a neon-lit machine."),
    ("c33", "Stained Glass", "Craft & Industry", "Coloured glass sorted and set by hand, ending on the finished window glowing in daylight."),
    ("c34", "Driftwood", "Nature", "Driftwood on the shoreline as waves wash over its barnacles."),
    ("c35", "Lava Lamp", "Product", "A lava lamp glowing in a dark wood-panelled room, its wax rising and falling up close."),
    ("c36", "Silver Ring", "Product", "A silver ring on black velvet, polished with a cloth and picked up by hand."),
    ("c38", "Soil Core", "Nature", "A layered column of soil in macro detail, then held in two hands."),
    ("c39", "Basketball Court", "Cars & Sport", "A player dribbling on a court seen from above, then a ball dropping through the net."),
    ("c40", "Clock Room", "Places & Interiors", "Sunbeams through dust in an old room with a wall clock."),
    ("c41", "Coastline Aerial", "Nature", "Top-down surf foam spreading over a green coastline."),
    ("c42", "Striped Stone", "Product", "A black-and-white striped stone slab in a dark studio, explored up close."),
    ("c43", "Incense Smoke", "Places & Interiors", "Incense smoke curling through a calm, sunlit room."),
    ("c44", "Prism Light", "Tech & Science", "White light split into a rainbow by a glass prism turned by hand."),
    ("c45", "Molten Metal", "Craft & Industry", "Molten metal glowing in a furnace and poured into a mould."),
    ("c46", "Greenhouse Mist", "Nature", "Mist drifting over rows of plants in a large greenhouse, dewy leaves and a white flower."),
    ("c48", "Mountain Aerial", "Nature", "Golden-hour light raking across forested ridges, seen from the air."),
    ("c49", "Logo Reveal", "Animation & Logos", "A metallic monogram emblem revealed on a brushed-gold background."),
    ("c50", "Stage Dancer", "People & Performance", "A dancer moving under pink and teal stage lights."),
]

SHOT_STEPS = [("Shot design", "Subject, camera move, lens feel and lighting, described in a detailed prompt."),
              ("AI generation", "Generated with an AI video model from that prompt."),
              ("Finish", "Graded with a film look and grain; cuts inside the clip trimmed of glitchy frames and softened."),
              ("Sound", "Natural sound for the scene and an original music bed, mixed to an even level.")]

# Per-shot fixes for the natural-look pass (tools/look.py). "drop" counts shots between cuts from 0.
EDITS = {
    "c10": {"drop": [1]},                   # cut the dial close-up with garbled lettering
    "c12": {"pre": "crop=1652:930:134:0"},  # crop out garbled text burned into the bottom-left corner
    "c27": {"drop": [3]},                   # cut the made-up wrapper end shot
    "c39": {"drop": [1, 2]},                # cut the ball close-ups with garbled lettering
    "c43": {"pre": "crop=1190:680:77:0"},   # crop out a logo burned into the bottom-left corner
}

# Showreel, in order: (shot id, which shot inside it counted from 0) or (ad slug, start second), then its
# length in beats of the 96 BPM score. Cuts land on the beat; only the most true-to-life footage is used.
SHOWREEL = [("c24", 2, 4), ("c01", 1, 2), ("burger-commercial", 23.0, 4), ("c15", 0, 4), ("c18", 1, 2),
            ("buffalo-wings-ad", 7.0, 4), ("c16", 1, 4), ("c25", 0, 4), ("clothing-brand-reel", 5.5, 4),
            ("c45", 0, 4), ("c20", 0, 4), ("c12", 2, 4), ("c50", 0, 4), ("c22", 0, 4), ("c48", 0, 8)]


def all_projects():
    out = []
    for a in SPOTS:
        s = slugify(a["title"])
        out.append(dict(kind="ad", spot=True, slug=s, title=a["title"], cat="Ads", short=a["short"], desc=a["desc"],
                        steps=a["steps"], tags=a["tags"], runtime=a["runtime"], orient="landscape", sound=True,
                        video=f"media/ads/{s}.mp4", poster=f"media/posters/{s}.jpg"))
    for a in ADS:
        s = slugify(a["title"])
        out.append(dict(kind="ad", slug=s, title=a["title"], cat="Ads", short=a["short"], desc=a["desc"],
                        steps=a["steps"], tags=a["tags"], runtime=a["runtime"], orient=a["orient"],
                        sound=a["sound"], video=f"media/ads/{s}.mp4", poster=f"media/posters/{s}.jpg"))
    for cid, title, cat, d in SHOTS:
        s = slugify(title)
        out.append(dict(kind="shot", cid=cid, slug=s, title=title, cat=cat, short=d, desc=d,
                        steps=SHOT_STEPS, tags=[cat, "AI video"], orient="landscape", sound=True,
                        video=f"media/shots/{s}.mp4", poster=f"media/posters/{s}.jpg"))
    return out

# Sound for each video (tools/sound.py): ambience layers (generator, dB, options), an original music cue
# (music.py) with its level in dB, and synced accents. "segs" plays a layer only in those shots of the clip.
H = {"hall": True, "reverb": (2.2, 0.4)}
SOUND = {
    "c01": {"amb": [("fire", 0), ("room", -14)], "music": ("food", -9)},
    "c02": {"amb": [("room", -6, H), ("hum", -16), ("pour", -2, {"segs": [1]})], "music": ("lux", -3),
            "hits": [(("seg", 2, 0.15), "whoosh", -6), (("seg", 2, 0.3), "impact", -4)]},
    "c04": {"amb": [("trickle", -6, {"segs": [0, 1]}), ("room", -10, {"segs": [0, 1, 2]}), ("wind", -4, {"segs": [3]}),
                    ("birds", -14, {"segs": [3]})], "music": ("warm", -7)},
    "c05": {"amb": [("grinder", 0, {"segs": [0, 1]}), ("tunnel", -2, {"segs": [2], "reverb": (2.5, 0.4)}),
                    ("wind", -10, {"segs": [2]})], "music": ("night", -12)},
    "c06": {"amb": [("wind", 0), ("cloth", -12, {"segs": [1, 2]})], "music": ("warm", -6)},
    "c07": {"amb": [("trickle", -10), ("birds", -14), ("room", -14)], "music": ("warm", -5)},
    "c08": {"amb": [("hum", -8), ("room", -10), ("sizzle", -16, {"segs": [0]})], "music": ("night", -8)},
    "c09": {"amb": [("room", -16)], "music": ("pulse", -1), "hits": [(6.0, "whoosh", -4), (6.25, "impact", -4)]},
    "c10": {"amb": [("watch", -14), ("room", -18)], "music": ("lux_soft", -2)},
    "c11": {"amb": [("lap", -2), ("crickets", -10)], "music": ("night", -6)},
    "c12": {"amb": [("engine", -2), ("crickets", -16, {"segs": [2]}), ("wind", -10, {"segs": [0, 2]})], "music": ("night", -10)},
    "c13": {"amb": [("crickets", -6), ("drips", -10), ("room", -16)], "music": ("night", -7)},
    "c14": {"amb": [("wind", -14), ("crickets", -18)], "music": ("night", 0)},
    "c15": {"amb": [("roar", -4), ("fire", -6), ("sizzle", -2, {"segs": [2]})], "music": ("warm", -12)},
    "c16": {"amb": [("wind", -6), ("harvester", -3, {"segs": [1, 3]}), ("birds", -14, {"segs": [0, 2]})], "music": ("warm", -9)},
    "c17": {"amb": [("lap", -3), ("drips", -12), ("waves", -10)], "music": ("warm", -14)},
    "c18": {"amb": [("fire", 0), ("crickets", -12)], "music": ("warm", -13)},
    "c19": {"amb": [("clinks", -2, {"rate": 4.0}), ("room", -16)], "music": ("lux_soft", -8)},
    "c20": {"amb": [("flame", -6), ("room", -10)], "music": ("night", -7)},
    "c21": {"amb": [("birds", -8), ("wind", -10)], "music": ("warm", -8)},
    "c22": {"amb": [("waves", -2), ("wind", -8)], "music": ("night", -10)},
    "c23": {"amb": [("room", -6, {"hall": True, "reverb": (2.8, 0.5)})], "music": ("warm", -3)},
    "c24": {"amb": [("room", -12), ("pour", -1, {"segs": [1, 2]}), ("clinks", -8, {"segs": [1, 2], "rate": 2.0})],
            "music": ("lux_soft", -8)},
    "c25": {"amb": [("train", 0), ("wind", -10)], "music": ("warm", -12)},
    "c26": {"amb": [("hum", -12), ("room", -10), ("beep", -10, {"segs": [0, 3]})], "music": ("night", -10)},
    "c27": {"amb": [("room", -16)], "music": ("lux_soft", -2)},
    "c29": {"amb": [("chisel", -6, {"segs": [0, 1, 2]}), ("room", -12)], "music": ("warm", -8)},
    "c30": {"amb": [("vinyl", -8), ("room", -16)], "music": ("lux_soft", -2), "record": True},
    "c31": {"amb": [("roar", -2), ("fire", -5)], "music": ("warm", -12)},
    "c32": {"amb": [("motor", -6), ("room", -12)], "music": ("food", -5)},
    "c33": {"amb": [("room", -10), ("clinks", -12, {"segs": [0], "rate": 1.5}), ("birds", -18, {"segs": [2]})], "music": ("warm", -6)},
    "c34": {"amb": [("waves", 0), ("wind", -10)], "music": ("warm", -16)},
    "c35": {"amb": [("bubbles", -10), ("hum", -16), ("room", -14)], "music": ("lux_soft", -3)},
    "c36": {"amb": [("room", -16), ("cloth", -10, {"segs": [1]})], "music": ("lux_soft", -2)},
    "c38": {"amb": [("room", -12), ("wind", -14), ("birds", -16)], "music": ("warm", -6)},
    "c39": {"amb": [("room", -6, H)], "music": ("pulse", -4)},
    "c40": {"amb": [("tick", -6), ("room", -10)], "music": ("warm", -9)},
    "c41": {"amb": [("waves", -2), ("wind", -6)], "music": ("warm", -8)},
    "c42": {"amb": [("room", -14)], "music": ("lux_soft", -2)},
    "c43": {"amb": [("room", -12), ("birds", -20)], "music": ("warm", -6)},
    "c44": {"amb": [("room", -14)], "music": ("lux_soft", -2)},
    "c45": {"amb": [("roar", -2), ("bubbles", -6), ("fire", -10)], "music": ("night", -12)},
    "c46": {"amb": [("drips", -8), ("room", -12, {"hall": True}), ("birds", -16)], "music": ("warm", -6)},
    "c48": {"amb": [("wind", -4), ("birds", -18)], "music": ("warm", -4)},
    "c49": {"amb": [], "music": ("lux", -2), "hits": [(2.0, "whoosh", -4), (2.05, "impact", -3)]},
    "c50": {"amb": [("room", -14, {"hall": True, "reverb": (2.0, 0.4)})], "music": ("pulse", 0)},
    # ads (the burger's original bed was only a hum and hiss, so it is fully rescored)
    "burger-commercial": {"amb": [("sizzle", -4, {"segs": [1, 2]}), ("room", -18)], "music": ("food", -2),
                          "hits": [(("seg", 3, 0.0), "whoosh", -10), (("seg", 4, 0.0), "impact", -6)]},
    "buffalo-wings-ad": {"amb": [("room", -10), ("hum", -16), ("sizzle", -12)], "music": ("food", -3)},
    "clothing-brand-reel": {"amb": [("room", -18)], "music": ("pulse", -1)},
}

# Spec ads cut from the clean shots above (tools/spots.py). Each shot: (shot id, start second in the encoded
# shot, length in beats, playback speed, slow push-in amount). Cuts land on the beat of the ad's own cue,
# supers and the end card are timed in beats. The brands are made up for these spec ads.
SPOTS = [
    dict(title="Larchmoor Whisky Spot", cue="spot_jazz", bpm=76, runtime="14s", poster_beat=13.9,
         shots=[("c30", 4.47, 3, 1.0, 0.03), ("c20", 4.2, 3, 1.0, 0.0), ("c24", 2.0, 2, 1.0, 0.04),
                ("c24", 4.92, 3, 0.83, 0.0), ("c19", 4.76, 2, 1.0, 0.03), ("c24", 7.32, 5, 0.89, 0.05)],
         style=dict(font="serif", color="#f3e9d8", accent="#e0c28c"),
         supers=[(3.3, 5.8, "Some evenings"), (6.3, 10.8, "deserve a slower pour.")],
         card=dict(beat=14.2, brand="LARCHMOOR", line="Small-batch single malt", small="PLEASE ENJOY RESPONSIBLY",
                   blur=16, dim=0.45),
         sound={"amb": [("room", -22), ("vinyl", -13, {"span": (2.2, 30)}), ("flame", -12, {"segs": [1]}),
                        ("pour", -5, {"segs": [3]}), ("clinks", -15, {"segs": [4], "rate": 2.0})],
                "music": ("spot_jazz", -2, 0.0), "record": True, "needle": 2.25},
         short="A 14-second spec spot for a small-batch whisky: a record, a candle and a slow pour.",
         desc="A 14-second spec commercial for Larchmoor, a made-up small-batch whisky. A needle drops, a candle is "
              "lit and a slow pour over ice ends on the brand. The jazz trio starts with the record, and every cut "
              "lands on a chord change.",
         steps=[("Concept & copy", "One evening ritual in six shots, with the line “Some evenings deserve a slower pour.”"),
                ("AI shots", "Record player, candle, glass, pour and ice generated with AI video, then graded to one warm night look."),
                ("Edit, music & sound", "Cut to the beat of an original jazz cue, with the pour slowed down, vinyl crackle, "
                 "pour and ice sounds, and a brand end card.")],
         tags=["Drinks ad", "16:9", "Original music"]),
    dict(title="Halden Silver Ring Spot", cue="spot_lux", bpm=84, runtime="13s", poster_beat=13.5,
         shots=[("c44", 4.12, 3, 1.0, 0.03), ("c36", 0.3, 4, 1.0, 0.06), ("c36", 4.5, 3, 1.0, 0.0),
                ("c44", 7.0, 3, 1.0, 0.03), ("c36", 7.8, 5, 0.84, 0.05)],
         style=dict(font="serif", color="#f4f1ec", accent="#f4f1ec"),
         supers=[(3.3, 6.8, "Hand-finished silver."), (10.3, 12.9, "Made to catch the light.")],
         card=dict(beat=14.0, brand="HALDEN", line="Fine silver jewelry", small=None, blur=0, dim=0.3, low=True),
         sound={"amb": [("room", -18, H), ("cloth", -8, {"segs": [2]})], "music": ("spot_lux", -2, 0.0),
                "hits": [(("seg", 4, -0.05), "whoosh", -16)]},
         short="A 13-second spec spot for a silver jewelry brand: light through a prism and a hand-finished ring.",
         desc="A 13-second spec commercial for Halden, a made-up silver jewelry brand. Light splits through a prism, "
              "a ring is polished and set down on black velvet, and the spot ends on the brand. Scored with an "
              "original cue that changes chord on every cut.",
         steps=[("Concept & copy", "Light and silver, with two short lines: “Hand-finished silver.” and “Made to catch the light.”"),
                ("AI shots", "Prism, velvet and ring shots generated with AI video, with slow push-ins added in the edit."),
                ("Edit, music & sound", "Cut on the beat of an original Rhodes cue, with cloth sounds on the polish and a brand end card.")],
         tags=["Jewelry ad", "16:9", "Original music"]),
    dict(title="Ember & Crust Pizza Spot", cue="spot_food", bpm=112, runtime="10s", poster_beat=1.6,
         shots=[("c01", 4.82, 3, 1.0, 0.0), ("c01", 6.86, 3, 0.95, 0.0), ("c01", 8.70, 3, 1.0, 0.04),
                ("c01", 0.3, 9, 0.85, 0.07)],
         style=dict(font="sans", color="#ffffff", accent="#ffb15c"),
         supers=[(3.2, 5.9, "HAND-STRETCHED DOUGH"), (6.2, 8.9, "FIRED OVER OAK")],
         card=dict(beat=12.0, brand="EMBER & CRUST", line="WOOD-FIRED PIZZA  ·  ORDER TONIGHT", small=None,
                   blur=5, dim=0.5),
         sound={"amb": [("fire", -11), ("room", -20)], "music": ("spot_food", -2, 0.0),
                "hits": [(("seg", 3, -0.05), "whoosh", -15)]},
         short="A 10-second spec spot for a wood-fired pizzeria: cheese pull, crust, fire and the brand.",
         desc="A 10-second spec commercial for Ember & Crust, a made-up wood-fired pizzeria. It opens on the cheese "
              "pull, cuts on the beat through the crust and the oven, and ends on the brand with a call to order.",
         steps=[("Concept & copy", "Hook in the first second with the cheese pull, then two short supers and a call to action."),
                ("AI shots", "Pizza shots generated with AI video and graded with a warm film look."),
                ("Edit, music & sound", "Hard cuts on the beat of an original upbeat cue, with fire crackle and a brand end card.")],
         tags=["Food ad", "16:9", "Original music"]),
]
