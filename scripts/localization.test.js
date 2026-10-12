import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveSiteUrl, validateTranslations } from './localization.js';
import { assetHref, normalizeBasePath, pageRoute, pageNames } from '../src/i18n/routes.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function loadTranslations() {
  const locales = ['zh-CN', 'en'];
  const entries = await Promise.all(locales.map(async (locale) => {
    const source = await readFile(resolve(root, 'src/locales', `${locale}.json`), 'utf8');
    return [locale, JSON.parse(source)];
  }));
  return Object.fromEntries(entries);
}

test('translations have matching keys and interpolation parameters', async () => {
  validateTranslations(await loadTranslations());
});

test('translation validation rejects missing keys and mismatched interpolation parameters', () => {
  assert.throws(() => validateTranslations({
    zh: { section: { first: '你好 {name}', second: '保留' } },
    en: { section: { first: 'Hello {person}', second: 'Keep' } },
  }), /interpolation parameters differ at section\.first/);

  assert.throws(() => validateTranslations({
    zh: { section: { first: '保留' } },
    en: { section: { second: 'Keep' } },
  }), /missing translation/);
});

test('public site URL validation preserves deployment paths', () => {
  assert.equal(resolveSiteUrl(undefined), null);
  assert.throws(() => resolveSiteUrl(undefined, true), /SITE_URL is required/);
  assert.throws(() => resolveSiteUrl('http://example.org'), /public HTTPS URL/);
  assert.throws(() => resolveSiteUrl('https://localhost'), /public HTTPS URL/);

  const site = resolveSiteUrl('https://youngluo.github.io/cleanu-site/');
  assert.equal(site.href, 'https://youngluo.github.io/cleanu-site/');
  assert.equal(site.pathname, '/cleanu-site/');
});

test('page ids map to Astro file-based routes', () => {
  assert.deepEqual(pageNames, ['index', 'changelog', 'privacy', 'support']);
  assert.deepEqual(pageNames.map(pageRoute), ['', 'changelog', 'privacy', 'support']);
  assert.throws(() => pageRoute('missing'), /Unknown site page/);
});

test('asset routes include the deployment subpath and reject traversal', () => {
  assert.equal(assetHref('assets/icon.webp'), '/assets/icon.webp');
  assert.equal(assetHref('/assets/icon.webp', '/cleanu-site/'), '/cleanu-site/assets/icon.webp');
  assert.equal(assetHref('favicon.svg', '/cleanu-site/'), '/cleanu-site/favicon.svg');
  assert.throws(() => assetHref('assets/../secret'), /Invalid site asset path/);
});

test('base paths must be local absolute paths without URL suffixes', () => {
  assert.equal(normalizeBasePath('/'), '');
  assert.equal(normalizeBasePath('/cleanu-site/'), '/cleanu-site');
  assert.throws(() => normalizeBasePath('cleanu-site'), /Invalid site base path/);
  assert.throws(() => normalizeBasePath('//other.example'), /Invalid site base path/);
  assert.throws(() => normalizeBasePath('/cleanu-site?preview=true'), /Invalid site base path/);
});
