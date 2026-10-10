import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { generatePages, resolveSiteUrl } from './build/localization.js';
import { flattenPages } from './build/flatten-pages.js';

const root = resolve(import.meta.dirname, 'web');
// The only page/locale/output naming table. Source templates remain one per logical page.
const pages = [{ name: 'index', runtime: 'download' }, { name: 'changelog', runtime: 'log' }];
const locales = ['zh-CN', 'en'];
const defaultLocale = 'zh-CN';
export const manifest = pages.flatMap((page) => locales.map((locale) => {
  const stem = page.name + (locale === defaultLocale ? '' : `.${locale}`);
  return {
    page: page.name, locale, runtime: page.runtime,
    template: `pages/${page.name}/index.html`,
    input: `.generated/pages/${stem}/index.html`, output: `${stem}.html`,
  };
}));
if (new Set(manifest.map((entry) => entry.output)).size !== manifest.length) throw new Error('Duplicate page output');

function localizedDevPages(options) {
  const sources = new Set(manifest.map((entry) => resolve(root, entry.template)));
  for (const locale of locales) sources.add(resolve(root, 'locales', `${locale}.json`));
  const routes = new Map(manifest.map((entry) => [`/${entry.output}`, `/${entry.input}`]));
  routes.set('/', routes.get('/index.html'));
  return {
    name: 'localized-dev-pages',
    configureServer(server) {
      server.watcher.add([...sources]);
      let pending = Promise.resolve();
      let hasError = false;
      const regenerate = (file) => {
        if (!sources.has(file)) return;
        pending = pending.then(async () => {
          try {
            const changed = await generatePages(options);
            if (changed || hasError) server.ws.send({ type: 'full-reload', path: '*' });
            hasError = false;
          } catch (error) {
            hasError = true;
            server.config.logger.error(error.message);
            server.ws.send({ type: 'error', err: { message: error.message, stack: error.stack, plugin: 'localized-dev-pages' } });
          }
        });
      };
      server.watcher.on('change', regenerate);
      server.watcher.on('add', regenerate);
      server.watcher.on('unlink', regenerate);
      server.middlewares.use((req, _res, next) => {
        const url = new URL(req.url, 'http://vite.local');
        const target = routes.get(url.pathname);
        if (target) req.url = target + url.search;
        next();
      });
    },
    handleHotUpdate(context) {
      // Reload only after generation succeeds, never expose the raw template.
      if (sources.has(context.file)) return [];
    },
  };
}

export default defineConfig(async () => {
  const siteUrl = resolveSiteUrl(process.env.SITE_URL, process.env.REQUIRE_SITE_URL === 'true');
  const options = { root, manifest, siteUrl };
  await generatePages(options);
  return {
    root, base: './',
    plugins: [localizedDevPages(options), flattenPages(manifest)],
    server: { watch: { ignored: ['**/.generated/**'] } },
    build: {
      outDir: resolve(import.meta.dirname, 'dist'), emptyOutDir: true,
      rolldownOptions: { input: Object.fromEntries(manifest.map((entry) => [entry.output, resolve(root, entry.input)])) },
    },
  };
});
