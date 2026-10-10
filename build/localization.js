import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const tokens = /\{\{([^{}]+)\}\}/g;
const parameters = (value) => [...new Set([...value.matchAll(/\{([a-zA-Z]\w*)\}/g)].map((match) => match[1]))].sort();
const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const runtimeKeys = {
  theme: ['auto', 'light', 'dark', 'label'],
  download: ['label'],
  log: ['empty', 'notFound', 'rateLimit', 'network', 'timeout', 'untagged', 'prerelease', 'download'],
};

function flattenCopy(value, label, prefix = '', result = {}) {
  if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error(`${label}: expected an object at ${prefix}`);
  for (const [key, child] of Object.entries(value)) {
    if (!/^[a-zA-Z]\w*$/.test(key)) throw new Error(`${label}: invalid copy key ${key}`);
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof child === 'string' && child.trim()) result[path] = child;
    else if (child && typeof child === 'object' && !Array.isArray(child)) flattenCopy(child, label, path, result);
    else throw new Error(`${label}: expected non-empty text at ${path}`);
  }
  return result;
}

/** Require identical text keys and interpolation parameters; never fall back to another language. */
export function validateCopy(dictionaries) {
  const entries = Object.entries(dictionaries).map(([locale, copy]) => [locale, flattenCopy(copy, locale)]);
  const [baselineLocale, baseline] = entries[0];
  for (const [locale, copy] of entries.slice(1)) {
    for (const key of new Set([...Object.keys(baseline), ...Object.keys(copy)])) {
      if (!(key in copy)) throw new Error(`${locale}: missing translation ${key}`);
      if (!(key in baseline)) throw new Error(`${baselineLocale}: missing translation ${key}`);
      if (parameters(copy[key]).join(',') !== parameters(baseline[key]).join(',')) throw new Error(`${locale}: interpolation parameters differ at ${key}`);
    }
  }
}

/** Local builds may omit SITE_URL; publication requires a public HTTPS URL, including its base path. */
export function resolveSiteUrl(value, required = false) {
  if (!value) {
    if (required) throw new Error('SITE_URL is required for publication');
    return null;
  }
  let url;
  try { url = new URL(value); } catch { throw new Error(`Invalid SITE_URL: ${value}`); }
  const host = url.hostname.toLowerCase();
  const forbidden = /(^|\.)(localhost|local|test|invalid|example)$/.test(host) || /(^|\.)example\.(com|org|net)$/.test(host);
  if (url.protocol !== 'https:' || !host.includes('.') || forbidden || /^[\d.]+$/.test(host) || host.includes(':') || url.username || url.password || url.search || url.hash) throw new Error(`SITE_URL must be a public HTTPS URL without credentials, query or fragment: ${value}`);
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
  return url;
}

/** Render only named text, route and metadata tokens. Resource values cannot introduce HTML. */
export function renderPage(template, entry, manifest, copy, siteUrl) {
  const label = `${entry.page}/${entry.locale}`;
  const text = flattenCopy(copy, label);
  for (const namespace of ['theme', entry.runtime]) {
    for (const key of runtimeKeys[namespace]) {
      if (!text[`runtime.${namespace}.${key}`]) throw new Error(`${label}: missing translation runtime.${namespace}.${key}`);
    }
  }
  const sibling = manifest.find((page) => page.page === entry.page && page.locale !== entry.locale);
  const runtime = { theme: copy.runtime.theme, [entry.runtime]: copy.runtime[entry.runtime] };
  const replacements = {
    locale: entry.locale, 'language:url': `/${sibling.output}`, 'language:lang': sibling.locale,
    runtime: JSON.stringify(runtime).replace(/</g, '\\u003c'),
    alternates: siteUrl ? manifest.filter((page) => page.page === entry.page).map((page) => `<link rel="alternate" hreflang="${page.locale}" href="${escapeHtml(new URL(page.output, siteUrl).href)}">`).join('\n') : '',
  };
  const html = template.replace(tokens, (_match, token) => {
    if (token.startsWith('text:')) {
      const key = token.slice(5);
      if (!(key in text)) throw new Error(`${label}: missing translation ${key}`);
      if (parameters(text[key]).length) throw new Error(`${label}: static translation has parameters at ${key}`);
      return escapeHtml(text[key]);
    }
    if (token.startsWith('route:')) {
      const target = manifest.find((page) => page.page === token.slice(6) && page.locale === entry.locale);
      if (!target) throw new Error(`${label}: unknown route ${token}`);
      return `/${target.output}`;
    }
    if (!(token in replacements)) throw new Error(`${label}: unknown placeholder {{${token}}}`);
    return replacements[token];
  });
  const unresolved = html.replace(/<script type="application\/json" id="site-copy">[\s\S]*?<\/script>/, '').match(/\{\{[^\n<]*|\}\}/);
  if (unresolved) throw new Error(`${label}: unresolved placeholder ${unresolved[0]}`);
  return html;
}

/** Read fresh source and validate every page before writing any derived entry. */
export async function generatePages({ root, manifest, siteUrl }) {
  const locales = [...new Set(manifest.map((entry) => entry.locale))];
  const dictionaries = Object.fromEntries(await Promise.all(locales.map(async (locale) => {
    const file = resolve(root, 'locales', `${locale}.json`);
    try { return [locale, JSON.parse(await readFile(file, 'utf8'))]; }
    catch (error) { throw new Error(`${file}: ${error.message}`); }
  })));
  validateCopy(dictionaries);
  const rendered = await Promise.all(manifest.map(async (entry) => {
    const template = await readFile(resolve(root, entry.template), 'utf8');
    return { file: resolve(root, entry.input), html: renderPage(template, entry, manifest, dictionaries[entry.locale], siteUrl) };
  }));
  let changed = false;
  for (const { file, html } of rendered) {
    const previous = await readFile(file, 'utf8').catch((error) => { if (error.code === 'ENOENT') return null; throw error; });
    if (previous === html) continue;
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
    changed = true;
  }
  return changed;
}
