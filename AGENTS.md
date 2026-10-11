# AGENTS.md — CleanU 官网

只记架构与规范；产品介绍与 `pnpm` 命令见 `README-zh_CN.md`。

## 架构

```
src/
├── pages/                     # Astro 文件路由；默认 zh-CN + en/ 下的英文路由
├── layouts/SiteLayout.astro
├── components/                # 共享导航、页脚及四种页面内容
├── i18n/{copy,routes}.js      # 文案、页面标识与资源 URL
├── locales/{zh-CN,en}.json   # 唯一文案源（静态 + 运行时）
├── scripts/                   # 主题、导航、预览和 Release 交互
└── styles/                    # 全局及页面专属 CSS
public/                        # favicon 与截图、品牌图标等静态资源
scripts/                       # 构建期文案与发布地址校验及测试
```

- Astro 负责静态构建和原生国际化路由。`zh-CN` 是无前缀默认语言，英文路由位于 `/en/`；文件系统路由与 `astro:i18n` URL helper 共同生成语言地址，根地址保持中文。
- 页面标识和资源 URL 辅助放在 `src/i18n/routes.js`，由应用源码复用；构建期文案与发布地址校验及其测试放在根级 `scripts/`，根级 `build/` 不存放源码。
- 每个页面和语言各有一个薄 Astro 入口，共用页面组件、布局和导航/页脚。文案保存在 `src/locales/{zh-CN,en}.json`，构建配置会校验两种语言的键、类型和插值参数；缺失键不能回退到另一种语言。
- 语言以 URL 为准，普通链接切换；JS 只增强有效锚点保留。GitHub Release 缓存保存原始数据，标题 / 正文 / 附件名不翻译，正文只用 `textContent`。
- 正式发布设置包含部署子路径的 `SITE_URL`，并启用 `REQUIRE_SITE_URL=true`；本地可省略，省略时不生成 `hreflang`，不得猜公开域名。
- 横切逻辑放在 `src/scripts/site.js`，别复制到各页；运行时 Release 配置放在 `src/scripts/config.js`。页面交互脚本和样式分别放在 `src/scripts/`、`src/styles/`，不要放入 `src/pages/`，避免 Astro 将它们识别为路由。公共令牌、基础排版、导航 / 页脚和跨页共用的长文排版统一放在 `src/styles/site.css`。
- 静态资源置于 `public/`；资源地址通过 `src/i18n/copy.js` 的 `BASE_URL` helper 生成，页面地址由 `astro:i18n` helper 生成，确保 Pages 子路径部署正确。
- 使用 Astro 默认的根级 `src/` 与 `public/` 目录，只发布 `dist/`。Astro 使用目录式静态输出，首页与子页面都遵循文件系统路由结构。

## 样式规范

- 颜色只用语义变量，组件里不写字面色值。
- 间距只用 `--sp-*` 标尺（除 `0` / `1px` / `-1px` 外不引入标尺外的数字，控件自身尺寸按实寸写），区块留白只由 `--sp-section` 一个值管；圆角只用 `999` 加 `22` / `18` / `12` / `6` 四档。
- 阴影只有两处：`.show__stage` 和 ≤860px 展开的 `.nav__links`；其余靠描边 + 内高光分层。
- 玻璃降级要同时写进 `prefers-reduced-transparency` 与 `@supports not (backdrop-filter)` 两条选择器，新增玻璃面记得补；`.nav` 用高占比页面底色且**不叠 `saturate`**（它是色晕来源），页面背景保持纯色。
- 切屏的淡出侧必须把 `visibility` 延后一个淡出时长再收，否则两帧叠不到一起又变硬切。减动效靠全局压 `transition-duration` 并把 `transition-delay` 归零；WAAPI 不吃 `prefers-reduced-motion`，长图平移的减动效在 JS 里判。
- 幻灯片标签必须等宽（滑块能纯位移的前提），宽高只在 `layoutThumb()` 写一次；长图平移落点要同时写进 `--pan`（只写动画会回弹到顶部）；帧上不要 `data-reveal`。
