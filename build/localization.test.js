import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { manifest } from '../vite.config.js';
import { generatePages, renderPage, resolveSiteUrl, validateCopy } from './localization.js';
import { flattenPages, rewriteReference } from './flatten-pages.js';

const root = resolve(import.meta.dirname, '../web');
const dictionaries = Object.fromEntries(await Promise.all(['zh-CN', 'en'].map(async (locale) => [locale, JSON.parse(await readFile(resolve(root, 'locales', `${locale}.json`), 'utf8'))])));
const outputs = new Set(manifest.map((entry) => entry.output));
const englishHome = manifest.find((entry) => entry.output === 'index.en.html');
const template = await readFile(resolve(root, englishHome.template), 'utf8');

test('manifest covers two pages in two languages without naming collisions', () => {
  assert.deepEqual([...outputs].sort(), ['changelog.en.html', 'changelog.html', 'index.en.html', 'index.html']);
  assert.equal(manifest.length, 4);
  for (const entry of manifest) assert.equal(entry.input.split('/')[2], entry.output.replace(/\.html$/, ''));
});

test('translation keys, value types and interpolation parameters are strict', () => {
  validateCopy(dictionaries);
  for (const mutate of [
    (copy) => { delete copy.en.index.heading; },
    (copy) => { copy.en.index.heading = 12; },
    (copy) => { copy.en.runtime.download.label = 'Download {wrong}'; },
  ]) {
    const copy = structuredClone(dictionaries);
    mutate(copy);
    assert.throws(() => validateCopy(copy), /en:.*(index.heading|runtime.download.label)/);
  }
  const repeated = structuredClone(dictionaries);
  repeated.en.runtime.download.label = 'Download {arch} ({arch})';
  validateCopy(repeated); // Compare parameter sets, not occurrence counts.
});

test('static rendering preserves semantic markup and includes only page runtime copy', async () => {
  for (const entry of manifest) {
    const source = await readFile(resolve(root, entry.template), 'utf8');
    const html = renderPage(source, entry, manifest, dictionaries[entry.locale], null);
    assert.ok(html.includes(`<html lang="${entry.locale}">`));
    assert.ok(html.includes(`href="/${entry.locale === 'en' ? entry.page : entry.page + '.en'}.html"`));
    assert.doesNotMatch(html, /\{\{[^]*\}\}/);
    const runtime = JSON.parse(html.match(/id="site-copy">([^]*?)<\/script>/)[1]);
    assert.deepEqual(Object.keys(runtime), ['theme', entry.runtime]);
    if (entry.page === 'index') {
      assert.ok(html.includes('<code>node_modules</code>'));
      assert.equal((html.match(/class="faq__a"/g) || []).length, 4);
      assert.equal((html.match(/role="tabpanel"/g) || []).length, 5);
      assert.equal((html.match(/class="rule"/g) || []).length, 5);
    }
  }
});

test('quotes, ampersands and tags cannot break text, attributes or the JSON data block', () => {
  const copy = structuredClone(dictionaries.en);
  const attack = '" & <img onerror="alert(1)"> </script><script>alert(2)</script>';
  copy.index.heading = attack;
  copy.runtime.download.label = attack + '{arch}';
  const html = renderPage('<h1 title="{{text:index.heading}}">{{text:index.heading}}</h1><script type="application/json" id="site-copy">{{runtime}}</script>', englishHome, manifest, copy, null);
  assert.doesNotMatch(html, /<img|<script>alert/);
  assert.ok(html.includes('&quot; &amp; &lt;img'));
  assert.equal((html.match(/<\/script>/g) || []).length, 1);
  assert.equal(JSON.parse(html.match(/id="site-copy">([^]*?)<\/script>/)[1]).download.label, attack + '{arch}');
});

test('missing static/runtime keys and unknown or malformed placeholders identify the page and key', () => {
  assert.throws(() => renderPage('{{text:index.unknown}}', englishHome, manifest, dictionaries.en, null), /index\/en: missing translation index.unknown/);
  assert.throws(() => renderPage('{{wrong}}', englishHome, manifest, dictionaries.en, null), /index\/en: unknown placeholder.*wrong/);
  assert.throws(() => renderPage('{{text:index.heading', englishHome, manifest, dictionaries.en, null), /index\/en: unresolved placeholder.*heading/);
  const copy = structuredClone(dictionaries.en);
  delete copy.runtime.theme.auto;
  assert.throws(() => renderPage(template, englishHome, manifest, copy, null), /index\/en: missing translation runtime.theme.auto/);
});

test('generation starts from an empty derived directory and unchanged output is not rewritten', async (context) => {
  const fixture = await mkdtemp(resolve(tmpdir(), 'cleanu-localization-'));
  context.after(() => rm(fixture, { recursive: true, force: true }));
  await cp(resolve(root, 'pages'), resolve(fixture, 'pages'), { recursive: true });
  await cp(resolve(root, 'locales'), resolve(fixture, 'locales'), { recursive: true });
  const options = { root: fixture, manifest, siteUrl: null };
  assert.equal(await generatePages(options), true);
  assert.equal(await generatePages(options), false);
  for (const entry of manifest) assert.ok((await readFile(resolve(fixture, entry.input), 'utf8')).includes(`<html lang="${entry.locale}">`));
});

test('relative page and Vite asset links preserve queries and fragments in one rewrite', () => {
  assert.equal(rewriteReference('/index.en.html?from=log#faq', outputs), './index.en.html?from=log#faq');
  assert.equal(rewriteReference('../../../assets/site-123.js?v=2', outputs), './assets/site-123.js?v=2');
  for (const ref of ['#faq', 'https://github.com/a/b', 'data:image/svg+xml,a']) assert.equal(rewriteReference(ref, outputs), ref);
  for (const ref of ['/missing.en.html#faq', '/pages/index/index.html', '../unknown.js', 'index.en.html', '/assets/foo.js', 'javascript:alert(1)', '//unknown.example/a']) {
    assert.throws(() => rewriteReference(ref, outputs), (error) => error.message.includes(ref));
  }
});

test('bundle flattening uses emitFile and fails on missing entries or unknown original references', () => {
  const plugin = flattenPages(manifest);
  assert.throws(() => plugin.generateBundle({}, {}), /missing generated page/);
  const invalid = Object.fromEntries(manifest.map((entry) => [entry.input, { type: 'asset', source: '<a href="/missing.en.html">bad</a>' }]));
  assert.throws(() => plugin.generateBundle({}, invalid), /\/missing.en.html/);
  const bundle = Object.fromEntries(manifest.map((entry) => [entry.input, { type: 'asset', source: '<a href="/index.en.html#faq">FAQ</a>' }]));
  const emitted = [];
  plugin.generateBundle.call({ emitFile: (asset) => emitted.push(asset) }, {}, bundle);
  assert.equal(Object.keys(bundle).length, 0);
  assert.deepEqual(emitted.map((asset) => asset.fileName), manifest.map((entry) => entry.output));
  assert.ok(emitted.every((asset) => asset.source.includes('./index.en.html#faq')));
});

test('public SEO URLs retain subpaths and local builds omit alternates', () => {
  const site = resolveSiteUrl('https://youngluo.github.io/cleanu-site', true);
  for (const entry of manifest) {
    const html = renderPage('{{alternates}}', entry, manifest, dictionaries[entry.locale], site);
    for (const counterpart of manifest.filter((page) => page.page === entry.page)) assert.ok(html.includes(`hreflang="${counterpart.locale}" href="https://youngluo.github.io/cleanu-site/${counterpart.output}"`));
    assert.equal(renderPage('{{alternates}}', entry, manifest, dictionaries[entry.locale], null), '');
  }
  assert.equal(resolveSiteUrl(undefined), null);
  assert.throws(() => resolveSiteUrl('', true), /required/);
  for (const url of ['bad', 'http://youngluo.github.io/', 'https://localhost/', 'https://127.0.0.1/', 'https://example.com/', 'https://site.test/', 'https://user:pass@youngluo.github.io/', 'https://youngluo.github.io/?wrong']) assert.throws(() => resolveSiteUrl(url, true), /SITE_URL/);
});

test('disk validation rejects absent output, resources and nested entries', async (context) => {
  const fixture = await mkdtemp(resolve(tmpdir(), 'cleanu-output-'));
  context.after(() => rm(fixture, { recursive: true, force: true }));
  const plugin = flattenPages(manifest);
  plugin.configResolved({ build: { outDir: fixture } });
  const bundle = Object.fromEntries(manifest.map((entry) => [entry.input, { type: 'asset', source: '<script src="../../../assets/missing.js"></script>' }]));
  plugin.generateBundle.call({ emitFile: () => {} }, {}, bundle);
  assert.throws(() => plugin.closeBundle(), /missing output index.html/);
  for (const entry of manifest) await writeFile(resolve(fixture, entry.output), '<script src="./assets/missing.js"></script>');
  assert.throws(() => plugin.closeBundle(), /index.html references missing .\/assets\/missing.js/);
  for (const entry of manifest) await writeFile(resolve(fixture, entry.output), '<a href="./index.en.html">English</a>');
  plugin.closeBundle();
  await mkdir(resolve(fixture, '.generated'));
  assert.throws(() => plugin.closeBundle(), /nested output remains at .generated/);
});
