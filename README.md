# Orchid — animated GSAP landing page

A single-page, scroll-driven landing page built with GSAP 3.15 (every plugin, vendored), Lenis smooth scrolling
and hand-authored SVG / WebGL visuals. It is plain static HTML, CSS and JS: upload the files to any host
(Hostinger shared hosting included) and it runs. No build step is needed on the server.

## Status: placeholder content

This was commissioned as a recreation of `https://orchid-tapir-982695.hostingersite.com/`. That host was blocked by
the build environment's network policy, so the original text and images could not be read. The brand name "Orchid",
all copy, client names, numbers and testimonials on this page are **original placeholders**, and every visual is
original SVG / WebGL art. Swap in the real content with the importer below before publishing.

Placeholders to replace:
- Brand name, copy, project names, stats and testimonials in `src/sections/*.html`.
- Contact details: `hello@example.com`, `+1 (555) 010-2040`, social links (`href="#"`).
- Artwork in `assets/img/<section>/`. Every image slot carries `data-slot="<section>-<n>"`.

## Import the original site

```bash
npm install
npm run import                      # defaults to https://orchid-tapir-982695.hostingersite.com/
# or: node tools/import-site.mjs https://example.com/ --depth=1 --max-pages=25
# behind an HTTPS proxy: NODE_USE_ENV_PROXY=1 npm run import
```

It writes:
- `assets/img/original/` with every image the pages and their stylesheets reference (largest `srcset` candidate, lazy-load attributes, CSS backgrounds, icons).
- `content/original/outline.md` with the page text in document order.
- `content/original/manifest.json` mapping each image to its source URL, alt text and nearest heading.
- `content/original/site.json` with titles, navigation, footer text, contact links, socials, colour variables and fonts.

Then replace the copy in `src/sections/*.html`, point the `data-slot` images at files in `assets/img/original/`,
adjust colours in `src/css/base/01-tokens.css`, and run `npm run build`.

## Develop

```bash
npm run dev          # build, then serve on http://localhost:5173
npm run build        # regenerate index.html, assets/css/site.css, assets/js/site.js
```

Add `?nopreload` to the URL to skip the preloader while working.

`index.html`, `assets/css/site.css` and `assets/js/site.js` are generated. Edit the sources:

| Path | What it holds |
| --- | --- |
| `src/index.template.html` | Page shell. Partials `00-09` render before `<main>`, `10-94` inside it, `95-99` after it. |
| `src/sections/NN-name.html` | One partial per section, in page order. |
| `src/css/base/` | Fonts, design tokens, reset, typography, layout, shared components. |
| `src/css/sections/NN-name.css` | Styles scoped to one section. |
| `src/js/core/` | Engine: plugin setup, Lenis, declarative scroll FX, preloader, cursor, nav, chrome. |
| `src/js/sections/NN-name.js` | Each section's choreography, registered with `Site.register('name', ctx => {})`. |
| `assets/vendor/` | GSAP and Lenis, served locally. |
| `tools/` | Build script, static server, site importer. |

### Declarative scroll effects

Most reveals need no JavaScript. Add attributes in the HTML:

| Attribute | Effect |
| --- | --- |
| `data-reveal="up\|down\|left\|right\|fade\|scale\|blur"` | Reveal on enter. Options: `data-delay`, `data-duration`, `data-start`, `data-trigger="load"`. |
| `data-reveal-group` | Staggers its children. Option: `data-stagger`. |
| `data-split="lines\|words\|chars"` | SplitText reveal. `data-split-anim="rise\|fade\|scrub"`. |
| `data-parallax="0.2"` | Scroll parallax. Positive drifts down, negative rises. |
| `data-img-reveal="up\|down\|left\|right\|center"` | Clip-path wipe with an inner zoom-out. |
| `data-count="240"` | Count-up. Options: `data-count-suffix`, `-prefix`, `-decimals`. |
| `data-draw` / `data-draw="scrub"` | Draws SVG strokes. |
| `data-magnetic="0.3"` | Magnetic hover on fine pointers. |
| `data-skew="6"` | Skews with scroll velocity. |
| `data-cursor-label="View"` | Custom cursor label on hover. |

All effects respect `prefers-reduced-motion`: smooth scrolling, pins and scrubbed choreography switch off and content renders in its final state.

## Deploy

Upload `index.html`, `.htaccess` and the `assets/` folder to the site root (for Hostinger: `public_html/`).
The `.htaccess` sets compression and caching and hides the development folders if you upload the whole repo.

## Credits and licences

- GSAP 3.15 by GreenSock (free for commercial use under the GSAP standard license).
- Lenis by darkroom.engineering (MIT).
- Instrument Serif and Inter Tight via Fontsource (SIL Open Font License, see `assets/fonts/`).
