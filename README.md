# William W. Halford: POR! Prince of Borland

Author website for *POR! Prince of Borland*, built with **React 19 + Vite**, GSAP 3.15 scroll animations and
Lenis smooth scrolling, with an **admin panel** for blog posts, reviews, messages, subscribers and site links.
It deploys to **Vercel** as a static site plus serverless functions in `/api`.

## Pages

| URL | What it is |
| --- | --- |
| `/` | The landing page: hero, about the author, six book themes, book series, trailer, reviews, blog, contact form, newsletter. |
| `/#post-<slug>` | Opens a blog post in the full-screen reader (shareable link). |
| `/admin` | Admin panel. |

## Deploy to Vercel

1. Import this repository in Vercel. The framework preset is detected as **Vite** (`vercel.json` sets the build).
2. In **Project → Settings → Environment Variables**, add `ADMIN_PASSWORD` (your admin password).
   Optionally add `SESSION_SECRET` (any long random string) so changing the password does not reuse old sessions.
3. In **Project → Storage** (or the Vercel Marketplace), add **Upstash for Redis** and connect it to the project.
   It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
4. Redeploy. The first request seeds the database with the demo content, so the admin panel starts with examples.

### Demo mode

Without a database (steps 2–3 skipped, a static preview, or `npm run preview`) the site runs in **demo mode**:
everything uses the bundled demo data and changes made in the admin panel are saved in that browser only.
The demo admin password is `demo`. Contact messages and newsletter sign-ups made in demo mode also land in the
demo inbox on the same browser, so you can try the whole flow.

## Admin panel

- **Dashboard**: counts of posts, drafts, visible reviews, unread messages and subscribers.
- **Posts**: create, edit, publish or keep as draft, feature one post, upload a cover image, write in Markdown
  (`##` headings, `**bold**`, `*italic*`, `> quotes`, `- lists`, `[links](https://...)`) with a live preview.
- **Reviews**: add, edit, hide or reorder the reader reviews shown in the carousel.
- **Messages**: inbox for the contact form, with read/unread and reply by email.
- **Subscribers**: newsletter list with CSV export.
- **Settings**: Amazon link (used by "Buy Now On Amazon"), order link, Instagram, Facebook, contact email,
  and an announcement line shown in the hero.

Posts and messages marked "Example" are demo content. Delete or edit them before launch.

## Develop

```bash
npm install
npm run dev                 # http://localhost:5173 (demo mode)
STORE_FILE=.data/store.json ADMIN_PASSWORD=secret npm run dev   # live mode with a local JSON file as the database
npm run build && npm run preview
```

Add `?nopreload` to the URL to skip the intro animation while working.

| Path | What it holds |
| --- | --- |
| `src/site/App.jsx` | Loads content, renders the sections, then starts the animation engine. |
| `src/site/sections/*.jsx` | One React component per section. |
| `src/site/engine/` | GSAP + Lenis engine: smooth scroll, declarative scroll effects, preloader, cursor, nav. |
| `src/site/fx/*.js` | Each section's scroll choreography. |
| `src/styles/` | Design tokens, shared components and per-section CSS. |
| `src/admin/` | The admin panel (React). |
| `src/lib/store.js` | Data layer shared by the site and admin: live API or demo store. |
| `src/data/demo.json` | Demo content and the database seed. |
| `api/` | Vercel serverless functions: `content`, `contact`, `subscribe`, `media`, `admin`. |
| `public/` | Fonts, images and the trailer video. |

### Scroll-effect attributes

Most reveals need no JavaScript: `data-reveal="up|fade|scale|blur…"`, `data-split="lines|words|chars"`
(+ `data-split-anim="rise|fade|scrub"`), `data-parallax="0.2"`, `data-img-reveal="left"`, `data-count="240"`,
`data-draw`, `data-magnetic`, `data-cursor-label="View"`. All effects respect `prefers-reduced-motion`.

## Security notes

- The admin session is an HMAC-signed, httpOnly, SameSite=Strict cookie (7 days). Admin changes also require
  an `X-Requested-With: admin` header, which blocks cross-site form submissions.
- Login, contact and newsletter endpoints are rate limited; forms include a hidden honeypot field.
- Everything saved is validated server-side: link fields accept http(s)/mailto only, images must be bundled
  paths, uploaded media or https URLs, and post bodies are rendered from escaped Markdown.

## Credits

GSAP 3.15 (free for commercial use), Lenis (MIT), Poppins, Jost and Archivo (SIL Open Font License).
Book covers, logo, author photo and trailer supplied by the author.
