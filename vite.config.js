import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { defineConfig } from 'vite';

/*
  一个页面一个目录：web/pages/<name>/ 放 index.html + index.js，产物是根下的 <name>.html。
  目录名必须等于产物名（首页目录就叫 index，不要叫 home），这样 dev 路由、源码链接、
  dist 文件名三者同形，新增页面只往这个数组加一个名字。
*/
const root = resolve(import.meta.dirname, 'web');
const pages = ['index', 'changelog'];

const nested = (name) => `pages/${name}/index.html`;
const outputFile = (name) => `${name}.html`;

/*
  产物比源码少两层目录，Vite 写出的资源引用带 ../../，压平时要改回 ./。
  单次遍历按形态分类改写：认不出的形态直接让构建失败并打出那条引用 —— 分步正则叠加会
  二次改写（曾经把跨页链接改成指向本页自己），而「文件在不在磁盘上」查不出这种错。

  Rolldown 不支持给 generateBundle 的 bundle 赋值（会被静默忽略，构建仍报成功），
  所以重新落名走 this.emitFile，压平结果再在 closeBundle 里对磁盘复核一次。
*/
function flattenPages() {
  const localRef = /(?:src|href)="([^"]*)"/g;
  const pageNames = new Set(pages);
  let outDir;

  function rewrite(ref) {
    if (!ref || /^(https?:|mailto:|#|data:)/.test(ref)) return ref;

    const asset = ref.match(/^(\.\.\/)+assets\/(.+)$/);
    if (asset) return `./assets/${asset[2]}`;

    /* 页面链接在源码里写成根绝对的产物名（/index.html、/index.html#faq）：
       相对写法 `index.html` 在 pages/index/ 里会指到本页自己。 */
    const link = ref.match(/^\/([a-z]+)\.html(#[^"]*)?$/);
    if (link) return pageNames.has(link[1]) ? `./${link[1]}.html${link[2] || ''}` : null;

    return ref.includes('../') ? null : ref;
  }

  return {
    name: 'flatten-pages',
    enforce: 'post',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    /* dev 地址和 dist 同形：/ 与 /<name>.html。用改写而不是 302 —— 页面引用已全部
       根绝对（/styles.css、/assets/…、/pages/<name>/index.js），文档 URL 变浅不会让
       引用错位；早先相对引用时代只能靠跳转救。 */
    configureServer(server) {
      const alias = new Map([['/', `/${nested(pages[0])}`]]);
      for (const name of pages) alias.set(`/${outputFile(name)}`, `/${nested(name)}`);

      server.middlewares.use((req, _res, next) => {
        const target = alias.get(req.url.split('?')[0]);
        if (target) req.url = target;
        next();
      });
    },
    generateBundle(_options, bundle) {
      for (const name of pages) {
        const from = nested(name);
        const asset = bundle[from];
        if (!asset) throw new Error(`flatten-pages: 产物里找不到 ${from}`);

        const unknown = [];
        const html = asset.source.replace(localRef, (_m, ref) => {
          const next = rewrite(ref);
          if (next === null) unknown.push(ref);
          return _m.replace(ref, next ?? ref);
        });

        if (unknown.length) {
          throw new Error(`flatten-pages: ${from} 出现未覆盖的引用形态 ${unknown.join(' , ')}`);
        }

        delete bundle[from];
        this.emitFile({ type: 'asset', fileName: outputFile(name), source: html });
      }
    },
    closeBundle() {
      for (const name of pages) {
        if (!existsSync(join(outDir, outputFile(name)))) {
          throw new Error(`flatten-pages: 产物缺少 ${outputFile(name)}，压平没生效`);
        }
        if (existsSync(join(outDir, 'pages'))) {
          throw new Error('flatten-pages: 产物仍残留 pages/ 目录');
        }
      }
    },
  };
}

export default defineConfig({
  root,
  base: './',
  plugins: [flattenPages()],
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(pages.map((name) => [name, resolve(root, nested(name))])),
    },
  },
});
