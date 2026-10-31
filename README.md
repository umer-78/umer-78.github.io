# umer-78.github.io

[![CI](https://github.com/umer-78/umer-78.github.io/actions/workflows/ci.yml/badge.svg)](https://github.com/umer-78/umer-78.github.io/actions/workflows/ci.yml)

My project portfolio: a gallery in 3D where every project is a monolith, and every
project opens into a 3D environment of its own, with search, category filters and
links to the code and the live demos.

**Live: https://umer-78.github.io/**

No framework, no build step, nothing to install. It is HTML, CSS and ES modules,
with three.js loaded from a CDN for the 3D. Without it, or without WebGL, the page
is the same index on a still background.

## What is on the page

- **The gallery.** One obsidian monolith per project stands in a ring around a
  sculpture of liquid gold held in a golden armillary. Each category is a gem
  (ruby, amethyst, sapphire, topaz, emerald, rose quartz) and forms its own arc.
  Hover a monolith to name its project, click it to walk into that project's
  world. The key under it lights one category; searching the index dims the
  monoliths it hides.
- **An environment for every project.** Sixteen kinds of world, each built around
  what a group of projects does: a vault of turning dials for password strength, a
  radar sweep for intrusion detection, arches of neurons for neural networks, a
  star chart whose shortest path lights up for route planning, a grove of decision
  trees for gradient boosting, a wall of tiles rewritten one window at a time for
  image processing. The project's name seeds everything inside its world (how many
  dials, which path, how the skyline is laid out, its own shade of the category's
  gem and the angle the camera comes in from), and the name itself is engraved in a
  ring of gold round it, so no two are alike. Drag to look around, scroll to zoom,
  ← → to travel to the next project, Escape to go back.
- **The collection.** The newest work, each with a still of its live demo.
- **The index.** Every project, searchable across titles, summaries, topics and
  highlights, with category chips, live counts, and a still of the demo that
  follows the pointer. Filters and the open project live in the URL
  (`?q=…&c=…&p=…`), so any view can be linked to and reloaded.
- **Live facts.** Stars and last update from one cached GitHub API call
  ([`scripts/github.js`](scripts/github.js), refreshed hourly), and each repo's CI badge.

It pauses rendering when the gallery is scrolled away or the tab is hidden, steps
down in resolution and bloom on devices that cannot keep up, holds every scene
still for reduced motion, and works down to 360px wide with no horizontal scroll.
The project view is a real dialog: focus moves into it, Tab stays inside, Escape
and the Back button close it.

## Why it is built this way

The project list lives in [`scripts/data.js`](scripts/data.js) as a plain module,
not as a JSON file fetched at runtime. The page works when opened straight from
disk, there is no loading flash, and the tests import the exact data the page
renders, so a project with a missing summary or a demo link pointing at the wrong
repository fails CI instead of shipping.

Which world each project gets is in [`scripts/environments.js`](scripts/environments.js),
also with no DOM and no three.js in it, so the tests check that every project has a
world of its own. The 3D code only draws what those two modules say.

## Running it

```bash
git clone https://github.com/umer-78/umer-78.github.io.git
cd umer-78.github.io
npm test              # 32 tests, no dependencies to install
npm run serve         # http://localhost:8080
```

`npm test` uses Node's built-in test runner; there is no `node_modules`.

## What the tests check

- every project has a title, summary, language, at least two highlights and two topics
- project names are unique, and every category used is one the page offers
- every demo link is `https`, on `umer-78.github.io`, and points at that project's own path
- every preview image a project names exists
- search: an empty query selects everything, nonsense selects nothing, several words are **and**
- category and language counts add up and keep their order
- every category has a gem colour readable as small text (4.5:1) on the page background
- every project is placed in a world by hand, the map names no project that is gone,
  no two projects share a world and a seed, and no kind of world holds more than five
- featured projects exist; seeds are stable; GitHub facts are parsed safely
- both pages carry a Content-Security-Policy that names the import map by its hash, and no
  page or script uses an inline event handler (the policy would refuse to run it)

## Adding a project

Add an entry to the `projects` array in `scripts/data.js`:

```js
{
  name: 'repo-name',              // must match the GitHub repository
  title: 'Human Readable Name',
  category: 'Applications & services',   // must be one of site.categories
  language: 'Go',
  summary: 'One sentence.',
  highlights: ['Two or more', 'specific points'],
  topics: ['go', 'sqlite'],
  demo: 'https://umer-78.github.io/repo-name/',   // optional
  preview: 'assets/previews/repo-name.webp',      // optional, a still of the demo
  private: true                                   // optional: no code link or CI badge
}
```

Then give it a world in `PROJECT_ENVIRONMENT` in `scripts/environments.js` and run
`npm test`. If you forget, the tests say so (the page itself falls back to the
category's world).

## Layout

```
index.html               the page
assets/styles.css        the design: tokens, layout, the gallery, the project dialog
assets/fonts/            Cormorant Garamond and Manrope (SIL Open Font License)
assets/previews/         a still of each live demo
scripts/data.js          the project list
scripts/environments.js  which world each project lives in, and the seeds (no DOM)
scripts/filters.js       search and category selection (no DOM)
scripts/palette.js       one gem colour per category
scripts/github.js        live stars, last update and CI badge (one cached API call)
scripts/app.js           the page: index, collection, filters, the project dialog
scripts/world.js         the 3D canvas: renderer, bloom, switching scenes, quality
scripts/gallery.js       the home page's gallery
scripts/scenes.js        the sixteen kinds of project environment
scripts/glsl.js          shader snippets the scenes share
test/                    filters, environments, palette and GitHub tests
```

## Licence

MIT — see [LICENSE](LICENSE). The fonts are under the SIL Open Font License; see
[`assets/fonts/`](assets/fonts/).
