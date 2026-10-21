import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig } from 'astro/config';
import { resolveSiteUrl, validateTranslations } from './scripts/localization.js';
import { checkedPurchaseConfig, checkoutHeaders } from './src/data/purchase.js';

const root = import.meta.dirname;
const siteUrl = resolveSiteUrl(process.env.SITE_URL, process.env.REQUIRE_SITE_URL === 'true');
const locales = ['zh-CN', 'en'];
const translationsByLocale = Object.fromEntries(await Promise.all(locales.map(async (locale) => {
  const file = resolve(root, 'src/locales', `${locale}.json`);
  return [locale, JSON.parse(await readFile(file, 'utf8'))];
})));
validateTranslations(translationsByLocale);
await checkedPurchaseConfig();

const base = siteUrl ? siteUrl.pathname.replace(/\/+$/, '') || '/' : '/';

export default defineConfig({
  site: siteUrl ? `${siteUrl.origin}/` : undefined,
  base,
  i18n: {
    defaultLocale: 'zh-CN',
    locales,
    routing: { prefixDefaultLocale: false },
  },
  trailingSlash: 'always',
  output: 'static',
  devToolbar: { enabled: false },
  outDir: './dist',
  build: { format: 'directory' },
  integrations: [{
    name: 'purchase-response-headers',
    hooks: { 'astro:build:done': async ({ dir }) => writeFile(new URL('_headers', dir), checkoutHeaders(base)) },
  }],
});
