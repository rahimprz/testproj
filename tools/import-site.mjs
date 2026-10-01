#!/usr/bin/env node
/**
 * Import the original site's content so the placeholders can be replaced.
 *
 *   npm install                      # once, installs node-html-parser
 *   node tools/import-site.mjs [url] [--depth=1] [--max-pages=25]
 *
 * Default url: https://orchid-tapir-982695.hostingersite.com/
 * Behind an HTTPS proxy (e.g. a sandbox), run with NODE_USE_ENV_PROXY=1 so Node's fetch honours HTTPS_PROXY.
 *
 * Output
 *   assets/img/original/            every image referenced by the pages and their stylesheets
 *   content/original/manifest.json  image list: source url, local file, alt text, page, nearest heading, size hints
 *   content/original/outline.md     page text in document order (headings, paragraphs, lists, buttons, quotes)
 *   content/original/site.json      title, meta, nav, footer, contact links, socials, colours, fonts per page
 *   content/original/pages/*.html   raw HTML snapshots
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

let parse;
try {
  ({ parse } = await import('node-html-parser'));
} catch {
  console.error('Missing dependency. Run `npm install` first (installs node-html-parser).');
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opts = Object.fromEntries(argv.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const startUrl = new URL(argv.find((a) => !a.startsWith('--')) || 'https://orchid-tapir-982695.hostingersite.com/');
const depth = Number(opts.depth ?? 1);
const maxPages = Number(opts['max-pages'] ?? 25);
const imgDir = join(root, 'assets/img/original');
const outDir = join(root, 'content/original');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36 OrchidImporter/1.0';
const IMG_EXT = /\.(png|jpe?g|webp|gif|svg|avif|ico)(\?|#|$)/i;

async function get(url, as = 'text') {
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: as === 'text' ? 'text/html,text/css,*/*' : '*/*' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return as === 'text' ? { body: await res.text(), type: res.headers.get('content-type') || '', url: res.url } : { body: Buffer.from(await res.arrayBuffer()), type: res.headers.get('content-type') || '', url: res.url };
}

const abs = (u, base) => { try { return new URL(u.trim().replace(/&amp;/g, '&'), base).href; } catch { return null; } };
const largestFromSrcset = (srcset, base) => {
  const items = srcset.split(',').map((s) => s.trim()).filter(Boolean).map((s) => { const [u, d] = s.split(/\s+/); return { u: abs(u, base), w: parseFloat(d) || 1 }; });
  items.sort((a, b) => b.w - a.w);
  return items[0]?.u || null;
};
const cssUrls = (css, base) => [...css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) => abs(m[1], base)).filter((u) => u && !u.startsWith('data:'));
const clean = (s) => s.replace(/\s+/g, ' ').trim();

const images = new Map(); // url -> record
const addImage = (url, rec) => {
  if (!url || url.startsWith('data:')) return;
  if (!images.has(url)) images.set(url, { url, ...rec, pages: new Set([rec.page]) });
  else { const r = images.get(url); r.pages.add(rec.page); if (!r.alt && rec.alt) r.alt = rec.alt; }
};

const pages = [];
const queue = [{ url: startUrl.href, d: 0 }];
const seen = new Set();
const cssSeen = new Set();

while (queue.length && pages.length < maxPages) {
  const { url, d } = queue.shift();
  const key = url.replace(/#.*$/, '').replace(/\/$/, '');
  if (seen.has(key)) continue;
  seen.add(key);
  let page;
  try { page = await get(url); } catch (e) { console.warn('skip', e.message); continue; }
  if (!/html/.test(page.type)) continue;
  const doc = parse(page.body, { comment: false });
  const pageUrl = page.url;
  const slug = new URL(pageUrl).pathname.replace(/\/+$/, '').replace(/^\//, '').replace(/[^\w-]+/g, '-') || 'home';
  console.log(`page ${pages.length + 1}: ${pageUrl}`);

  // ---- text outline in document order ----
  const outline = [];
  let lastHeading = '';
  const body = doc.querySelector('body') || doc;
  body.querySelectorAll('script, style, noscript, svg, template').forEach((n) => n.remove());
  const walk = (node) => {
    for (const el of node.childNodes) {
      if (el.nodeType !== 1) continue;
      const tag = el.tagName?.toLowerCase();
      if (/^h[1-6]$/.test(tag)) { const t = clean(el.text); if (t) { outline.push(`${'#'.repeat(Number(tag[1]) + 1)} ${t}`); lastHeading = t; } continue; }
      if (tag === 'p' || tag === 'blockquote' || tag === 'figcaption') { const t = clean(el.text); if (t) outline.push(tag === 'blockquote' ? `> ${t}` : t); continue; }
      if (tag === 'li') { const t = clean(el.text); if (t && t.length < 400) outline.push(`- ${t}`); continue; }
      if (tag === 'a' || tag === 'button') {
        const t = clean(el.text);
        const cls = el.getAttribute('class') || '';
        if (t && (tag === 'button' || /btn|button|cta/i.test(cls))) outline.push(`[${t}](${el.getAttribute('href') || ''})`);
        else if (el.childNodes.some((c) => c.nodeType === 1)) walk(el);
        continue;
      }
      if (tag === 'img') {
        const src = el.getAttribute('data-src') || el.getAttribute('data-lazy-src') || el.getAttribute('src');
        const set = el.getAttribute('data-srcset') || el.getAttribute('data-lazy-srcset') || el.getAttribute('srcset');
        const best = (set && largestFromSrcset(set, pageUrl)) || abs(src || '', pageUrl);
        const alt = clean(el.getAttribute('alt') || '');
        addImage(best, { alt, page: pageUrl, heading: lastHeading, width: el.getAttribute('width'), height: el.getAttribute('height') });
        outline.push(`![${alt}](${best})`);
        continue;
      }
      walk(el);
    }
  };
  walk(body);

  // ---- other image sources ----
  doc.querySelectorAll('source[srcset], source[data-srcset]').forEach((s) => addImage(largestFromSrcset(s.getAttribute('data-srcset') || s.getAttribute('srcset'), pageUrl), { alt: '', page: pageUrl, heading: 'picture source' }));
  doc.querySelectorAll('[style*="url("]').forEach((el) => cssUrls(el.getAttribute('style'), pageUrl).forEach((u) => addImage(u, { alt: '', page: pageUrl, heading: 'inline background' })));
  doc.querySelectorAll('[data-bg], [data-background], [data-settings]').forEach((el) => {
    for (const a of ['data-bg', 'data-background', 'data-settings']) {
      const v = el.getAttribute(a);
      if (v) for (const m of v.matchAll(/https?:\\?\/\\?\/[^"'\s,]+?\.(?:png|jpe?g|webp|gif|svg|avif)/gi)) addImage(m[0].replace(/\\\//g, '/'), { alt: '', page: pageUrl, heading: 'data attribute' });
    }
  });
  doc.querySelectorAll('video[poster]').forEach((v) => addImage(abs(v.getAttribute('poster'), pageUrl), { alt: 'video poster', page: pageUrl, heading: 'video' }));
  doc.querySelectorAll('link[rel*="icon"], meta[property="og:image"], meta[name="twitter:image"]').forEach((el) => addImage(abs(el.getAttribute('href') || el.getAttribute('content') || '', pageUrl), { alt: 'site icon / social image', page: pageUrl, heading: 'head' }));

  // ---- stylesheets: images, colours, fonts ----
  const styleText = [...doc.querySelectorAll('style')].map((s) => s.text).join('\n');
  const sheets = doc.querySelectorAll('link[rel="stylesheet"]').map((l) => abs(l.getAttribute('href'), pageUrl)).filter(Boolean);
  let cssAll = styleText;
  for (const href of sheets) {
    if (cssSeen.has(href)) continue;
    cssSeen.add(href);
    try { const { body: css } = await get(href); cssAll += '\n' + css; cssUrls(css, href).filter((u) => IMG_EXT.test(u)).forEach((u) => addImage(u, { alt: '', page: pageUrl, heading: `stylesheet ${href}` })); } catch {}
  }
  cssUrls(styleText, pageUrl).filter((u) => IMG_EXT.test(u)).forEach((u) => addImage(u, { alt: '', page: pageUrl, heading: 'inline style' }));
  const colorVars = Object.fromEntries([...cssAll.matchAll(/(--[\w-]*colou?r[\w-]*)\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]+\))/gi)].map((m) => [m[1], m[2]]));
  const fonts = [...new Set([...cssAll.matchAll(/font-family\s*:\s*([^;}{]+)/gi)].map((m) => clean(m[1].replace(/!important/, ''))))].slice(0, 30);
  const googleFonts = doc.querySelectorAll('link[href*="fonts.googleapis.com"]').map((l) => l.getAttribute('href'));

  const nav = doc.querySelectorAll('header a, nav a').map((a) => ({ text: clean(a.text), href: a.getAttribute('href') })).filter((a) => a.text);
  const footer = clean((doc.querySelector('footer') || { text: '' }).text).slice(0, 2000);
  const links = doc.querySelectorAll('a[href]').map((a) => a.getAttribute('href'));
  pages.push({
    url: pageUrl,
    slug,
    title: clean(doc.querySelector('title')?.text || ''),
    description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
    nav: nav.filter((v, i, arr) => arr.findIndex((x) => x.text === v.text && x.href === v.href) === i),
    footer,
    contact: [...new Set(links.filter((h) => /^(mailto|tel):/i.test(h || '')))],
    socials: [...new Set(links.filter((h) => /(instagram|facebook|linkedin|twitter|x\.com|tiktok|youtube|behance|dribbble|pinterest)\./i.test(h || '')))],
    colorVars,
    fonts,
    googleFonts,
    outline,
  });
  await mkdir(join(outDir, 'pages'), { recursive: true });
  await writeFile(join(outDir, 'pages', `${slug}.html`), page.body);

  if (d < depth) {
    for (const h of links) {
      const u = abs(h || '', pageUrl);
      if (!u) continue;
      const nu = new URL(u);
      if (nu.host === startUrl.host && !IMG_EXT.test(nu.pathname) && !/\/(wp-admin|wp-login|feed|wp-json|cart|checkout|my-account)/.test(nu.pathname) && !/\.(pdf|zip|xml)$/i.test(nu.pathname)) queue.push({ url: nu.href.replace(/#.*$/, ''), d: d + 1 });
    }
  }
}

// ---- download images ----
await mkdir(imgDir, { recursive: true });
const list = [...images.values()];
console.log(`downloading ${list.length} images...`);
const used = new Set();
let i = 0;
const worker = async () => {
  while (i < list.length) {
    const rec = list[i++];
    try {
      const { body, type } = await get(rec.url, 'buffer');
      let ext = (extname(new URL(rec.url).pathname) || '').toLowerCase();
      if (!IMG_EXT.test(ext)) ext = type.includes('svg') ? '.svg' : type.includes('png') ? '.png' : type.includes('webp') ? '.webp' : type.includes('gif') ? '.gif' : type.includes('avif') ? '.avif' : '.jpg';
      let base = new URL(rec.url).pathname.split('/').pop().replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '-').slice(0, 60) || 'image';
      if (used.has(base + ext)) base += '-' + createHash('md5').update(rec.url).digest('hex').slice(0, 6);
      used.add(base + ext);
      rec.file = `assets/img/original/${base}${ext}`;
      rec.bytes = body.length;
      await writeFile(join(root, rec.file), body);
    } catch (e) {
      rec.error = e.message;
    }
  }
};
await Promise.all(Array.from({ length: 6 }, worker));

// ---- write reports ----
await mkdir(outDir, { recursive: true });
const manifest = list.map((r) => ({ ...r, pages: [...r.pages] }));
await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
await writeFile(join(outDir, 'site.json'), JSON.stringify(pages.map(({ outline, ...p }) => p), null, 2));
const md = pages.map((p) => `# ${p.title || p.url}\n\nURL: ${p.url}\n\n${p.description ? `> ${p.description}\n\n` : ''}${p.outline.join('\n\n')}\n`).join('\n\n---\n\n');
await writeFile(join(outDir, 'outline.md'), md);
const ok = manifest.filter((m) => m.file).length;
console.log(`done: ${pages.length} page(s), ${ok}/${manifest.length} images saved to assets/img/original, reports in content/original/`);
