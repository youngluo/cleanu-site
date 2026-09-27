# AGENTS.md — CleanU 官网

只记架构与规范；运行方式和数据来源的入门说明看 `README.md`。

## 架构

```
 浏览器
   ├── index.html ─────┬─ site.js（主题 / 抽屉 / 区块高亮 / 淡入）
   │                   └─ home.js（幻灯片 / FAQ / 下载按钮）
   └── changelog.html ─┬─ site.js（同一份）
                       └─ changelog.js（Release 列表渲染）
        config.js ── 两页共用的唯一外部数据源声明
        styles.css ─ 单文件，令牌 + 组件，两页共用
        （运行时）──> api.github.com：cleanu 的 Release ──> 按钮 href / 日志列表

  shots/*.png（原图，不发布） ──cwebp──> web/assets/*.webp（发布）
  发布物 = web/ 整个目录，纯静态，无构建、无后端、无第三方脚本
```

- **两页同构**：同一份导航、页脚、样式、`site.js`；差异只在各自的功能脚本。新增页面照此复制。
- **样式单文件令牌驱动**：组件只引用语义变量（`--bg` / `--ink` / `--sp-*` / `--radius-*`），亮暗两套取值与标尺集中在 `:root`，主题切换只改 `data-theme-mode`，组件本身不感知。
- **脚本无框架无打包**：三个 IIFE，按页面引用；跨页横切逻辑一律进 `site.js`，别复制到各页。
- **数据只有一处来源**：`config.js` 声明 owner/repo；两页各自 fetch、各自 sessionStorage 缓存，没有构建期注入，也没有服务端。
- **资产分层**：原图留 `shots/`，只有派生 WebP 进 `web/assets/`；发布包体积由派生图决定。

## 设计规范

- **颜色一律走语义变量**（`--bg` / `--ink` / `--line` / `--accent`），组件里不出现字面色值。
- **间距**只用 `--sp-1…--sp-10`（4/8/12/16/20/24/32/40/56/72）；区块留白由 `--sp-section` 一个值管（桌面 72，≤860px 56）。除 `0` / `1px` / `-1px` 外不引入标尺外的数字。
- **圆角**：交互件胶囊 `999`，其余四档 —— `22` 截图视口 / `18` 卡片 / `12` 导航与开关 / `6` 焦点环与行内代码。
- **玻璃面**：`.nav` / `.card` / `.rule` / `.tabs` / `.log__item` 共用 `--glass-*` 令牌（内高光 + 1px 内描边 + 半透明填充）。**背景是纯色、导航也不透明**（所有者要求：不要任何色晕），所以材质只靠半透明填充和内描边表达；`backdrop-filter` 在纯色底上不产生可见效果，留着只为将来加回背景内容时生效。降级写在 `prefers-reduced-transparency` 与 `@supports not (backdrop-filter)` 里，新增玻璃面记得同步两处。
- **阴影**：卡片、边界块、日志条目都不投影，层级靠描边 + 内高光；**只有截图视口**（`.show__stage`）有那层柔和阴影，分段控件的滑块也不投影。
- **分段控件**（幻灯片标签）：玻璃轨道 + `span.tabs__thumb` 滑块；滑块是纯色胶囊（`--btn-bg`，无高光、无投影），控件走紧凑档 —— 按钮 `padding: var(--sp-1) var(--sp-3)` + `line-height: 1.25`，桌面约 34px 高，≤620px 靠 `--sp-2` 纵向留触控高度；切标签时只动 `transform`（0.28s `cubic-bezier(0.32, 0.72, 0, 1)`），宽高只在 `layoutThumb()` 里写一次；标签等宽是滑块能纯位移的前提。
- **主题**三态，默认跟随系统；选择存 `cleanu:theme-mode`，由两页 `<head>` 的内联脚本先落到 `data-theme-mode`，避免闪色。
- **幻灯片** 5 屏，标签固定四字；视口 16:9（≤620px 转 4:3），切换瞬时（别加渐变，试过被否）；长图用 WAAPI 平移 3.5s、`cubic-bezier(0.42, 0, 0.58, 1)`，悬停暂停，落点同时写进 `--pan`（只写进动画会回弹到顶部）。帧上不要 `data-reveal`。

## 代码规范

- **纯静态，无构建**：`web/` 即部署目录，里面每个文件都会发布；`shots/` 放 5120×2880 原图，故意留在 `web/` 外，别移回去。平台关闭目录索引，两页互链必须写文件名（`changelog.html`，不是 `/changelog/`）。
- **JS 三层**：`site.js` 两页共用（主题、抽屉、区块高亮、淡入）；`home.js` 首页（幻灯片、FAQ、下载）；`changelog.js` 更新日志页。WAAPI 不受 CSS `prefers-reduced-motion` 覆盖，减动效要在 JS 里单独判断。
- **下载**默认两个架构按钮；只有「认得出架构 + 该架构在最新 Release 里真有 `.dmg`」同时成立才合并成一个。识别先读 WebGL 显卡型号，再退 `userAgentData`（Safari 没有），识别不出就保持两个。
- **数据**源在 `config.js`；缓存键 `cleanu:release:<owner>/<repo>` 与 `cleanu:releases:<owner>/<repo>`。读不到就如实显示原因，不编版本号；发布说明用 `textContent` + `white-space: pre-wrap` 输出，不解析 Markdown、不把远端内容当 HTML 插入。

## 资产管线

1. 换截图时原图进 `shots/`，按时间命名。
2. 统一裁剪框（5120×2880 坐标）：`x 3072..5120`、`y 0..2116`；下边界由最高的面板决定，换分辨率要重量。量面板边界看「内部连续亮行」，别用行亮度落差 —— 下方天空同样亮，会误判。
3. `cwebp -q 72` 输出 2048×2116 到 `web/assets/`；同步 `img` 的 `width` / `height`，视口比例靠它。
4. 短图不加 `data-pan`；长图加 `data-pan="bottom"`，平移落在按钮行。

## 自检

`node --check web/*.js`；同源 iframe 里量 375 / 768 / 1440 的 `scrollWidth` 与越界元素；无重复 `id`、无失效 `aria-*` 与锚点；图片 `complete && naturalWidth > 0`；量之前先 `fetch(url, {cache:'reload'})`。
