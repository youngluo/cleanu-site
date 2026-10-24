import { readFile, access } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pageNames, pageRoute } from '../src/i18n/routes.js';
import { resolveSiteUrl } from './localization.js';
import { checkoutHeaders } from '../src/data/purchase.js';

const directory = fileURLToPath(new URL('../dist/', import.meta.url));
const site = resolveSiteUrl(process.env.SITE_URL) || new URL('https://cleanu.ls63.cc/');
const base = site.pathname.replace(/\/$/, '');
let checked = 0;
for (const locale of ['zh-CN', 'en']) {
  for (const page of pageNames) {
    const route = `${locale === 'en' ? 'en/' : ''}${pageRoute(page)}`.replace(/\/+$/, '');
    const path = join(directory, route ? `${route}.html` : 'index.html');
    const html = await readFile(path, 'utf8');
    const currentPath = [base, route].filter(Boolean).join('/');
    const current = new URL(`/${currentPath}`, site.origin);
    if (page === 'checkout') {
      if (!html.includes('name="robots" content="noindex, noarchive"') || !html.includes('name="referrer" content="no-referrer"')) throw new Error(`Missing return privacy metadata: ${route}`);
      if (!html.includes('URLSearchParams') || !html.includes('data-checkout-message="neutral"')) throw new Error(`Missing safe return guidance: ${route}`);
      const sanitizer = html.indexOf('URLSearchParams');
      if (sanitizer > html.indexOf('rel="icon"')) throw new Error(`Return sanitizer is too late: ${route}`);
    }
    for (const match of html.matchAll(/\b(?:href|src)="([^"<>]+)"/g)) {
      const raw = match[1].replace(/&amp;/g, '&');
      if (raw.startsWith('#')) continue;
      const target = new URL(raw, current);
      if (target.origin !== site.origin || !['http:', 'https:'].includes(target.protocol)) continue;
      if (target.search) throw new Error(`Unexpected internal query: ${route}`);
      if (!target.pathname.startsWith(`${base}/`)) throw new Error(`Link lost deployment path: ${route}`);
      const relative = decodeURIComponent(target.pathname.slice(base.length + 1));
      // Release assets are restored and checked by the existing dedicated release steps.
      if (relative.startsWith('downloads/')) continue;
      const file = resolve(directory, relative ? (extname(relative) ? relative : `${relative}.html`) : 'index.html');
      await access(file);
    }
    checked += 1;
  }
}
const headers = await readFile(join(directory, '_headers'), 'utf8');
if (headers !== checkoutHeaders(site.pathname)) throw new Error('Purchase return response headers do not match deployment base');
console.log(`Verified ${checked} static pages, local references, return metadata and response headers`);
