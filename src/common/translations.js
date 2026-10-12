/** Current URL's document language; browser and storage preferences cannot override it. */
export const locale = document.documentElement.lang;

const runtimeTranslations = JSON.parse(document.getElementById('site-translations').textContent);

/** Read runtime translations and substitute named, text-only parameters. */
export function translate(key, params = {}) {
  const value = key.split('.').reduce((part, name) => part && part[name], runtimeTranslations);
  if (typeof value !== 'string') throw new Error(`Missing runtime translation: ${locale}/${key}`);
  return value.replace(/\{([a-zA-Z]\w*)\}/g, (_match, name) => {
    if (!Object.hasOwn(params, name)) throw new Error(`Missing translation parameter: ${key}/${name}`);
    return String(params[name]);
  });
}
