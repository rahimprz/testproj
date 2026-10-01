# William W. Halford: POR! Prince of Borland

An animated rebuild of the author landing page at `https://orchid-tapir-982695.hostingersite.com/`, made with
GSAP 3.15 (every plugin, vendored), Lenis smooth scrolling, a canvas starfield and scroll-driven choreography.
It is plain static HTML, CSS and JS: upload the files to any host (Hostinger shared hosting included) and it runs.

## Content and images

All copy comes from the WordPress page source: hero, About The Author, the six themes in About The Book,
My Book Series, the trailer, the five reader reviews, Recent Posts, the contact form and the footer.

A few things were changed or need your input:
- Typos fixed: "Amzaon" to "Amazon", "Halllford" to "Halford", "Trailor" to "Trailer".
- The "Buy Now On Amazon" button still links to the About The Book section, as on the WordPress page. Add the real Amazon URL in `src/sections/10-hero.html`.
- The series blurb on the WordPress page is lorem ipsum. It now reuses the hero line; replace it in `src/sections/40-series.html`.
- The three blog cards are the site's placeholder posts ("Lorem Ipsum Is Dummy") and link to those post URLs.
- The contact form and newsletter form post to the existing WordPress Contact Form 7 form and Newsletter plugin.
- Instagram and Facebook links are `#` on the WordPress page too.

Every image is loaded in this order: a local copy in `assets/img/original/`, then the live WordPress upload,
then a designed stand-in (a CSS book cover or a starfield panel). To serve the images locally, run the importer
below. Headings use Clash Display from the WordPress uploads, falling back to a condensed Archivo.

## Import the original site

```bash
npm install
npm run import                      # pulls every image and the page text from the WordPress site
# or: node tools/import-site.mjs https://example.com/ --depth=1 --max-pages=25
# behind an HTTPS proxy: NODE_USE_ENV_PROXY=1 npm run import
```

It writes:
- `assets/img/original/` with every image the pages and their stylesheets reference (largest `srcset` candidate, lazy-load attributes, CSS backgrounds, icons).
- `content/original/outline.md` with the page text in document order.
- `content/original/manifest.json` mapping each image to its source URL, alt text and nearest heading.
- `content/original/site.json` with titles, navigation, footer text, contact links, socials, colour variables and fonts.

The page already points at those file names, so no markup changes are needed after an import. Run `npm run build` after any edit.

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
- Poppins, Jost and Archivo via Fontsource (SIL Open Font License, see `assets/fonts/`).
