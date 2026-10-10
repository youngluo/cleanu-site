import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const references = /\b(src|href)=("|')([^"']*)\2/g;

/** Convert nested HTML links in one pass; unknown local shapes are errors. */
export function rewriteReference(ref, outputs) {
  if (!ref || /^(https?:|mailto:|#|data:)/i.test(ref)) return ref;
  const [, path, suffix] = ref.match(/^([^?#]*)([?#].*)?$/);
  if (path.startsWith('/') && outputs.has(path.slice(1))) return `.${path}${suffix || ''}`;
  const asset = path.match(/^(?:\.\.\/)+((?:assets\/)[^\\]+)$/);
  if (asset && !asset[1].split('/').includes('..')) return `./${asset[1]}${suffix || ''}`;
  throw new Error(`flatten-pages: unsupported local reference ${ref}`);
}

/** Rename via emitFile (Rolldown bundle assignment is unsupported), then verify disk output. */
export function flattenPages(manifest) {
  const outputs = new Set(manifest.map((entry) => entry.output));
  let outDir;
  let generated = false;
  return {
    name: 'flatten-pages', enforce: 'post',
    configResolved(config) { outDir = config.build.outDir; },
    generateBundle(_options, bundle) {
      for (const entry of manifest) {
        const asset = bundle[entry.input];
        if (!asset || asset.type !== 'asset') throw new Error(`flatten-pages: missing generated page ${entry.input}`);
        const html = String(asset.source).replace(references, (_match, attr, quote, ref) => `${attr}=${quote}${rewriteReference(ref, outputs)}${quote}`);
        delete bundle[entry.input];
        this.emitFile({ type: 'asset', fileName: entry.output, source: html });
      }
      generated = true;
    },
    closeBundle() {
      if (!generated) return;
      for (const entry of manifest) {
        const file = resolve(outDir, entry.output);
        if (!existsSync(file)) throw new Error(`flatten-pages: missing output ${entry.output}`);
        for (const [, , , ref] of readFileSync(file, 'utf8').matchAll(references)) {
          if (!ref.startsWith('./')) continue;
          if (!existsSync(resolve(outDir, ref.split(/[?#]/)[0]))) throw new Error(`flatten-pages: ${entry.output} references missing ${ref}`);
        }
      }
      for (const directory of ['pages', '.generated']) if (existsSync(resolve(outDir, directory))) throw new Error(`flatten-pages: nested output remains at ${directory}/`);
    },
  };
}
