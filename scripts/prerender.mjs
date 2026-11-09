// Runs after the build (npm run build). For every public page in src/seo/routes.ts it writes
// that page's own HTML file with its title, description and canonical address, and for the main
// pages (home, dashboards) the page's text too, so search engines don't have to run the app to
// read it. Also writes sitemap.xml, and app.html (the plain app, for every other address).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const server = await import(pathToFileURL(path.join(root, 'dist-ssr', 'entry-prerender.js')).href);
const { render, ROUTES, SITE_URL, canonicalUrl } = server;

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const escape = (text) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function swap(html, pattern, value) {
  const found = typeof pattern === 'string' ? html.includes(pattern) : pattern.test(html);
  if (!found) throw new Error(`prerender: couldn't find ${pattern} in index.html`);
  return html.replace(pattern, () => value);
}

function pageHtml(route) {
  const url = canonicalUrl(route.path);
  const title = escape(route.title);
  const description = escape(route.description);
  let html = template;
  html = swap(html, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = swap(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${description}" />`);
  html = swap(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`);
  html = swap(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`);
  html = swap(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${title}" />`);
  html = swap(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${description}" />`);
  if (route.prerender) html = swap(html, '<div id="root"></div>', `<div id="root">${render(route.prerender, route.path)}</div>`);
  return html;
}

// Every other address (the old portal pages, typos) gets the plain app.
fs.writeFileSync(path.join(dist, 'app.html'), template);

for (const route of ROUTES) {
  const file = route.path === '/' ? path.join(dist, 'index.html') : path.join(dist, ...route.path.split('/').filter(Boolean), 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, pageHtml(route));
  console.log(`prerender: ${route.path}${route.prerender ? ' (with its text)' : ''}`);
}

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTES.map(
  (route) =>
    `  <url><loc>${canonicalUrl(route.path)}</loc><lastmod>${today}</lastmod><priority>${route.path === '/' ? '1.0' : route.prerender ? '0.9' : '0.7'}</priority></url>`,
).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
console.log(`prerender: sitemap.xml (${ROUTES.length} pages on ${SITE_URL})`);
