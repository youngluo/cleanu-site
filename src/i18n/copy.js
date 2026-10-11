import { getRelativeLocaleUrl } from 'astro:i18n';
import english from '../locales/en.json';
import chinese from '../locales/zh-CN.json';
import { assetHref as createAssetHref, pageRoute } from './routes.js';

const dictionaries = {
  'zh-CN': chinese,
  en: english,
};

const locales = new Set(Object.keys(dictionaries));

const runtimeNames = {
  index: 'download',
  changelog: 'log',
};

export { pageRoute };

export function copyFor(locale) {
  const copy = dictionaries[locale];
  if (!copy) throw new Error(`Unsupported site locale: ${locale}`);
  return copy;
}

export function pageHref(page, locale) {
  if (!locales.has(locale)) throw new Error(`Unsupported site locale: ${locale}`);
  return getRelativeLocaleUrl(locale, pageRoute(page));
}

export function assetHref(path) {
  return createAssetHref(path, import.meta.env.BASE_URL);
}

export function runtimeCopy(page, copy) {
  const runtimeName = runtimeNames[page];
  const runtime = { theme: copy.runtime.theme };
  if (runtimeName) runtime[runtimeName] = copy.runtime[runtimeName];
  return JSON.stringify(runtime).replace(/</g, '\\u003c');
}
