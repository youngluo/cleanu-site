# AGENTS.md — CleanU 官网

只记架构与规范；产品介绍与 `pnpm` 命令见 `README-zh_CN.md`。

## 架构

```
web/
├── pages/
│   ├── index/{index.html, index.js}      首页模板与交互
│   └── changelog/{index.html, index.js}  更新日志模板与交互
├── locales/{zh-CN,en}.json              唯一文案源（静态 + 运行时）
├── .generated/pages/<stem>/index.html   启动 / 构建派生入口，不提交
├── site.js         语言 / 文案 / 主题 / 抽屉 / 区块高亮 / 淡入（两页共用）
├── styles.css      令牌 + 组件（两页共用）
├── config.js       唯一外部数据源：运行时只请求 api.github.com 上 cleanu 的 Release
├── favicon.svg
└── assets/*.webp   预览图 + 品牌图标（由 gitignore 的 shots/ 原图经 cwebp 派生）
```

- 页面、语言与产物映射只在 `vite.config.js` 定义；两页共用各自一份 HTML 模板。中文输出 `index.html` / `changelog.html`，英文输出 `index.en.html` / `changelog.en.html`，根地址保持中文。
- 生成入口目录名等于输出文件去掉 `.html` 的名称；`build/localization.js` 在 Vite 读取入口之前生成真实 HTML，开发监听只读模板与语言资源，不监听派生目录。
- 模板只用受限的 `{{text:key}}`、`{{route:page}}` 和元信息占位符；文案只保存文本，HTML 插值转义，运行时 JSON 转义 `<`。缺失键、参数不一致或未知占位符必须失败，不能跨语言回退。
- 语言以 URL 为准，普通链接切换；JS 只增强有效锚点保留。GitHub Release 缓存保存原始数据，标题 / 正文 / 附件名不翻译，正文只用 `textContent`。
- 正式发布从 Pages `base_url` 取得 `SITE_URL`（含子路径），启用 `REQUIRE_SITE_URL=true`；本地可省略但不生成 `hreflang`，不得猜公开域名。
- 横切逻辑一律进 `site.js`，别复制到各页。
- 只发布 `dist/`：整目录传 `web/` 会得到 `/pages/<name>/index.html` 这种 URL。
- 平台关闭了目录索引，所以产物里两页互链是 `./changelog.html` 同目录形式，不是 `/changelog/`；URL 形状只在 `vite.config.js` 改（`base`、`pages`、`flatten-pages`）。
- 模板 HTML 的本地 `src`/`href` 一律根绝对，跨页用 `{{route:page}}`；JS 的 `import` 走相对路径，压平插件不改写它。
- 改 `flatten-pages` 三条不可回退：单次遍历改写每条 `src`/`href`；认不出的引用形态直接让构建失败并打出那条引用；重新落名走 `this.emitFile`。

## 样式规范

- 颜色只用语义变量，组件里不写字面色值。
- 间距只用 `--sp-*` 标尺（除 `0` / `1px` / `-1px` 外不引入标尺外的数字，控件自身尺寸按实寸写），区块留白只由 `--sp-section` 一个值管；圆角只用 `999` 加 `22` / `18` / `12` / `6` 四档。
- 阴影只有两处：`.show__stage` 和 ≤860px 展开的 `.nav__links`；其余靠描边 + 内高光分层。
- 玻璃降级要同时写进 `prefers-reduced-transparency` 与 `@supports not (backdrop-filter)` 两条选择器，新增玻璃面记得补；`.nav` 用高占比页面底色且**不叠 `saturate`**（它是色晕来源），页面背景保持纯色。
- 切屏的淡出侧必须把 `visibility` 延后一个淡出时长再收，否则两帧叠不到一起又变硬切。减动效靠全局压 `transition-duration` 并把 `transition-delay` 归零；WAAPI 不吃 `prefers-reduced-motion`，长图平移的减动效在 JS 里判。
- 幻灯片标签必须等宽（滑块能纯位移的前提），宽高只在 `layoutThumb()` 写一次；长图平移落点要同时写进 `--pan`（只写动画会回弹到顶部）；帧上不要 `data-reveal`。
