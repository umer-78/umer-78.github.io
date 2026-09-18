# umer-78.github.io

My project portfolio — a single page listing everything I have published, with
search, category filters and links to the code and the live demos.

**Live: https://umer-78.github.io/**

No framework, no build step, no dependencies. It is three files of HTML, CSS and
ES modules, and it loads in one request plus three static assets.

## Why it is built this way

The project list lives in [`scripts/data.js`](scripts/data.js) as a plain module,
not as a JSON file fetched at runtime. That means the page works when opened
straight from disk, there is no loading flash, and — the part that matters — the
tests import the exact data the page renders, so a project with a missing summary
or a demo link pointing at the wrong repository fails CI instead of shipping.

The filtering logic is in [`scripts/filters.js`](scripts/filters.js) with no DOM
in it. [`scripts/app.js`](scripts/app.js) is the only file that touches the page.
Same functions in the browser and in the tests.

## Running it

```bash
git clone https://github.com/umer-78/umer-78.github.io.git
cd umer-78.github.io
npm test              # 13 tests, no dependencies to install
npm run serve         # http://localhost:8080
```

`npm test` uses Node's built-in test runner — there is nothing in
`node_modules`, because there is no `node_modules`.

```
$ npm test
# tests 13
# pass 13
# fail 0
```

## What the tests check

They are data-integrity tests as much as logic tests, because the data is what
goes wrong on a page like this:

- every project has a title, summary, language, at least two highlights and two topics
- project names are unique
- every category used is one the page actually offers as a filter chip
- every demo link is `https`, on `umer-78.github.io`, and points at that project's own path
- an empty query selects everything; a nonsense query selects nothing
- multiple search words are **and**, not **or** — "python security" is narrower than "python"
- category counts add up to the project total, and appear in the declared order

## Features

- Search across titles, summaries, topics and highlights, with matches highlighted
- Category chips with live counts
- Filters are mirrored into the URL, so a filtered view can be linked to and reloaded
- `/` focuses the search box, `Escape` clears it
- Light and dark themes from the system setting
- Keyboard-reachable throughout, with a skip link and visible focus rings
- Works down to 360px wide with no horizontal scrolling

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
  demo: 'https://umer-78.github.io/repo-name/'   // optional
}
```

Then run `npm test`. If the category is not in the list, or the demo URL does not
match the repository, the tests say so.

## Layout

```
index.html            the page
assets/styles.css     theming, layout, cards
assets/favicon.svg
scripts/data.js       the project list
scripts/filters.js    search and category selection, no DOM
scripts/app.js        rendering and events
test/filters.test.js  13 tests
```

## Licence

MIT — see [LICENSE](LICENSE).
