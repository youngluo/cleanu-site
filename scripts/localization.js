const parameters = (value) => [...new Set([...value.matchAll(/\{([a-zA-Z]\w*)\}/g)].map((match) => match[1]))].sort();

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
  if (entries.length < 2) throw new Error('At least two site locales are required');
  const [baselineLocale, baseline] = entries[0];
  for (const [locale, copy] of entries.slice(1)) {
    for (const key of new Set([...Object.keys(baseline), ...Object.keys(copy)])) {
      if (!(key in copy)) throw new Error(`${locale}: missing translation ${key}`);
      if (!(key in baseline)) throw new Error(`${baselineLocale}: missing translation ${key}`);
      if (parameters(copy[key]).join(',') !== parameters(baseline[key]).join(',')) {
        throw new Error(`${locale}: interpolation parameters differ at ${key}`);
      }
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
  if (url.protocol !== 'https:' || !host.includes('.') || forbidden || /^[\d.]+$/.test(host) || host.includes(':') || url.username || url.password || url.search || url.hash) {
    throw new Error(`SITE_URL must be a public HTTPS URL without credentials, query or fragment: ${value}`);
  }
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
  return url;
}
