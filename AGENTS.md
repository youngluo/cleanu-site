# AGENTS.md — CleanU 官网

只记架构与出码规范；运行方式、数据来源与素材流程看 `README.md`。

## 架构

```
 浏览器
   ├── index.html ─────┬─ site.js（主题 / 抽屉 / 区块高亮 / 淡入）
   │                   └─ pages/index/index.js（幻灯片 / FAQ / 下载按钮）
   └── changelog.html ─┬─ site.js（同一份）
                       └─ pages/changelog/index.js（Release 列表渲染）
        config.js ── 两页共用的唯一外部数据源声明
        styles.css ─ 单文件，令牌 + 组件，两页共用
        （运行时）──> api.github.com：cleanu 的 Release ──> 按钮 href / 日志列表

 源码 web/                                        产物 dist/
   web/pages/index/{index.html, index.js}           index.html
   web/pages/changelog/{index.html, index.js}       changelog.html
   web/{styles.css, site.js, config.js,             assets/<name>-<hash>.<ext>
        favicon.svg, assets/*.webp}
   shots/*.png（原图，gitignore）──cwebp──> web/assets/*.webp

 发布物 = dist/，`pnpm build` 产出；纯静态，无后端、无第三方脚本
```

- **两页同构**：同一份导航、页脚、样式、`site.js`；差异只在各自的功能脚本。一个页面一个目录 `web/pages/<name>/{index.html, index.js}`，**目录名必须等于产物名**（首页目录叫 `index`，不叫 `home`）—— dev 路由、源码里的跨页链接、`dist` 文件名三者同形。新增页面只往 `vite.config.js` 的 `pages` 数组加一个名字，入口、压平、dev 路由三处都由它派生。
- **令牌驱动**：组件只引用语义变量（`--bg` / `--ink` / `--sp-*` / `--radius-*`），亮暗取值与标尺集中在 `:root`；主题切换只改 `data-theme-mode`，组件不感知。
- **脚本零框架**：三个手写 IIFE 以 `type="module"` 进打包，各页职责见图。跨页横切逻辑一律进 `site.js`，别复制到各页。
- **资产分层**：原图 `shots/` 不入库，仓库里只有派生 WebP；构建给位图只改哈希名、不动字节。

## 设计规范

- **颜色一律走语义变量**（`--bg` / `--ink` / `--line` / `--accent`），组件里不出现字面色值。
- **间距**只用 `--sp-1…--sp-10`（4/8/12/16/20/24/32/40/56/72）；区块留白由 `--sp-section` 一个值管（桌面 72，≤860px 56）。除 `0` / `1px` / `-1px` 外不引入标尺外的数字。
- **圆角**：交互件胶囊 `999`，其余四档 —— `22` 截图视口 / `18` 卡片 / `12` 导航与开关 / `6` 焦点环与行内代码。
- **玻璃面**：`.nav` / `.card` / `.rule` / `.tabs` / `.log__item` 共用 `--glass-*`（内高光 + 1px 内描边 + 半透明填充）。背景纯色、导航不透明，不要色晕；`backdrop-filter` 留着只为将来加回背景内容时生效。降级写进 `prefers-reduced-transparency` 与 `@supports not (backdrop-filter)` 两处，新增玻璃面记得同步。
- **阴影**：**只有截图视口**（`.show__stage`）有那层柔和阴影；卡片、边界块、日志条目、分段控件的滑块都不投影，层级靠描边 + 内高光。
- **分段控件**（幻灯片标签）：玻璃轨道 + `span.tabs__thumb` 纯色滑块（`--btn-bg`，无高光、无投影）；按钮 `padding: var(--sp-1) var(--sp-3)` + `line-height: 1.25`，桌面约 34px 高，≤620px 靠 `--sp-2` 纵向留触控高度；切标签只动 `transform`（0.28s `cubic-bezier(0.32, 0.72, 0, 1)`），宽高只在 `layoutThumb()` 写一次；标签等宽是滑块能纯位移的前提。
- **主题**三态，默认跟随系统；选择存 `cleanu:theme-mode`，由两页 `<head>` 的内联脚本先落到 `data-theme-mode`，避免闪色。
- **幻灯片** 5 屏，标签固定四字；视口 16:9（≤620px 转 4:3）；切屏是 0.32s `ease-in-out` 的交叠淡入淡出 —— 淡出侧必须把 `visibility` 延后 0.32s 收（`transition: opacity .32s ease-in-out, visibility 0s linear .32s`），否则两帧叠不到一起又变硬切；减动效靠全局那条 `transition-duration: 0.001ms` + `transition-delay: 0s` 兜底（delay 必须一起归零，否则 `visibility` 仍会晚 0.32s 收），不必逐处写。自动播放一屏 `PAN_MS + PAN_DWELL_MS`（3500 + 1700 = 5.2s）—— 间隔必须 ≥ 平移时长，所以只能由 `PAN_MS` 派生，不许写独立字面量；无播放开关，靠暂停：指针停在 `[data-show]`、焦点落在区内、区块滚出视口、`document.hidden` 任一成立就不排程，`prefers-reduced-motion` 下整段不播；手动切屏只重排定时器（`selectTab` 后必须跟 `arm()`，否则会把用户刚选的屏提前切走）。长图用 WAAPI 平移 3.5s、`cubic-bezier(0.42, 0, 0.58, 1)`，悬停暂停，落点同时写进 `--pan`（只写进动画会回弹到顶部），帧上不要 `data-reveal`。WAAPI 不吃 CSS 的 `prefers-reduced-motion`，减动效必须在 JS 里判。

## 代码规范

- **包管理只用 pnpm**：`pnpm install` / `dev` / `build` / `preview`。提交 `pnpm-lock.yaml`，`node_modules/` 不提交。
- **构建**：`pnpm build` 从 `web/` 出 `dist/`。源码里的引用一律根绝对：共享层 `/styles.css`、`/site.js`、`/assets/…`、`/pages/<name>/index.js`，跨页链接 `/index.html`、`/index.html#faq` —— 裸 `index.html` 在 `pages/index/` 里指的就是本页自己。dev 路由与 `dist` 同形（`/`、`/index.html`、`/changelog.html`，用改写实现，引用根绝对之后 URL 变浅不影响解析）。产物 URL 形状只在 `vite.config.js` 改 —— `base: './'`（平台关闭目录索引，产物里两页互链是 `./changelog.html` 这种同目录形式，不是 `/changelog/`）、`pages` 数组、`flatten-pages` 压平插件。改插件时两条写法不可回退：单次遍历改写每条 `src`/`href`（分步正则叠加会把跨页链接二次改写成自指链接），重新落名走 `this.emitFile`。
- **数据**：源在 `config.js`，以 ES 默认导出声明 owner/repo，由两页的 `index.js` 各自 `import`，不挂 `window.CLEANU`；两页各自 fetch、各自 sessionStorage 缓存，键 `cleanu:release:<owner>/<repo>` 与 `cleanu:releases:<owner>/<repo>`。读不到就如实显示原因，不编版本号；发布说明只走 `textContent` + `white-space: pre-wrap`，不解析 Markdown、不把远端内容当 HTML 插入。
- **下载**默认两个架构按钮；只有「认得出架构 + 该架构在最新 Release 里真有 `.dmg`」同时成立才合并成一个。识别先读 WebGL 显卡型号，再退 `userAgentData`（Safari 没有），识别不出就保持两个。

## 截图标记

- `img` 的 `width` / `height` 要和 `web/assets/` 里派生图的实寸一致（视口比例靠它）。
- 短图不加 `data-pan`；长图加 `data-pan="bottom"`，平移落在按钮行。派生流程看 `README.md`。

## 自检

- `node --check web/*.js web/pages/*/*.js`；`pnpm build` 后验产物：`dist/` 根下要有两页 `<name>.html`、不残留 `../`、每条本地引用磁盘命中，**页面间链接清单还要和基线逐条对照**（只查文件是否存在，会漏掉链接被改写成本页自己）。
- 标记层：无重复 `id`、无失效 `aria-*` 与锚点；图片 `complete && naturalWidth > 0`；375 / 768 / 1440 三档宽度下 `scrollWidth` 不越界。量法与坑见 `README.md`。
