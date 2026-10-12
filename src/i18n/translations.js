import { getRelativeLocaleUrl } from 'astro:i18n';
import english from '../locales/en.json';
import chinese from '../locales/zh-CN.json';
import { assetHref as createAssetHref, pageRoute } from './routes.js';

const translationsByLocale = {
  'zh-CN': chinese,
  en: english,
};

const locales = new Set(Object.keys(translationsByLocale));

const runtimeNames = {
  changelog: 'log',
};

export { pageRoute };

export function translationsFor(locale) {
  const translations = translationsByLocale[locale];
  if (!translations) throw new Error(`Unsupported site locale: ${locale}`);
  return translations;
}

export function pageHref(page, locale) {
  if (!locales.has(locale)) throw new Error(`Unsupported site locale: ${locale}`);
  return getRelativeLocaleUrl(locale, pageRoute(page));
}

export function assetHref(path) {
  return createAssetHref(path, import.meta.env.BASE_URL);
}

export function runtimeTranslationsFor(page, translations) {
  const runtimeName = runtimeNames[page];
  const runtime = { theme: translations.runtime.theme };
  if (runtimeName) runtime[runtimeName] = translations.runtime[runtimeName];
  return JSON.stringify(runtime).replace(/</g, '\\u003c');
}
