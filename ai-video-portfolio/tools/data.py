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
                ("Edit & sound", "Shots cut to 30 seconds, with the end line and a sound bed.")],
         tags=["Food ad", "16:9", "With sound"]),
    dict(title="Buffalo Wings Ad", src="Buffalo Wings Ad (17s).mp4", runtime="17s",
         orient="landscape", poster_t=8.4, sound=False,
         short="A 17-second ad for buffalo wings, plated by a gloved chef in a clean restaurant kitchen.",
         desc=("A 17-second spec ad for buffalo wings. A chef in gloves plates glazed wings with celery and dip "
               "in a clean, steel restaurant kitchen. This version was remade to show proper kitchen hygiene, with gloved hands."),
         steps=[("Concept & shot list", "A plating sequence in a kitchen that looks clean and professional."),
                ("AI generation", "Shots generated with AI video, then regenerated so food hygiene is shown correctly."),
                ("Edit", "Cut into a 17-second sequence that ends on the finished plate.")],
         tags=["Food ad", "16:9", "Silent"]),
    dict(title="Clothing Brand Reel", src="Clothing Brand Reel (10s vertical).mp4", runtime="10s",
         orient="portrait", poster_t=8.1, sound=False,
         short="A 10-second vertical reel for a clothing brand, with an AI model in a clean studio.",
         desc=("A 10-second vertical (9:16) spec reel for a clothing brand. An AI model in a cream outfit with a "
               "charcoal shawl turns and poses in a clean studio, made for vertical feeds like Instagram and TikTok."),
         steps=[("Concept", "A short, clean studio reel that keeps the outfit as the hero."),
                ("AI generation", "The model and her movement generated with AI video in a vertical frame."),
                ("Edit", "Trimmed to a tight 10-second loop for social feeds.")],
         tags=["Fashion reel", "9:16", "Vertical"]),
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
              ("Finish", "Graded with a film look and grain; cuts inside the clip trimmed of glitchy frames and softened.")]

# Per-shot fixes for the natural-look pass (tools/look.py). "drop" counts shots between cuts from 0.
EDITS = {
    "c10": {"drop": [1]},                   # cut the dial close-up with garbled lettering
    "c12": {"pre": "crop=1652:930:134:0"},  # crop out garbled text burned into the bottom-left corner
    "c27": {"drop": [3]},                   # cut the made-up wrapper end shot
    "c39": {"drop": [1, 2]},                # cut the ball close-ups with garbled lettering
    "c43": {"pre": "crop=1190:680:77:0"},   # crop out a logo burned into the bottom-left corner
}

# Showreel, in order: (shot id, which shot inside it, counted from 0) or (ad slug, start second).
# Only the most true-to-life footage, one clean shot each, no garbled text.
SHOWREEL = [("c24", 2), ("c01", 1), ("burger-commercial", 23.0), ("c15", 0), ("c18", 1),
            ("buffalo-wings-ad", 7.0), ("c16", 1), ("c25", 0), ("clothing-brand-reel", 5.5), ("c45", 0),
            ("c20", 0), ("c12", 2), ("c50", 0), ("c48", 0), ("c22", 0)]


def all_projects():
    out = []
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
