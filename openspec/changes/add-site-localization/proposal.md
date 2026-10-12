## Why

CleanU 官网需要为首页、更新日志、隐私政策和支持页提供可直接访问的简体中文与英文版本，同时继续通过现有 Cloudflare Pages 工作流发布静态网站。Astro 重构保持现有视觉样式，国际化路由遵循 Astro 的 locale 目录约定。

## What Changes

- 使用 Astro 静态构建官网，以共享布局和页面组件承载四类页面；每种语言直接生成独立 HTML。
- 使用 Astro 原生 i18n 路由：简体中文默认路由不带语言前缀，英文页面位于 `/en/` 下；根路径继续显示中文首页。
- 保持现有颜色、排版、布局、截图和控件视觉；页面入口与路由按 Astro 文件系统约定组织，继续保留主题、导航、首页预览与 GitHub Release 功能。
- 继续从中英文语言资源读取静态和运行时文案；通过 URL 决定语言，不自动跳转或回退到另一种语言。
- 保留正式构建的 `SITE_URL` 校验、子路径部署和对应语言页面的 `hreflang`。
- 移除已不再需要的 Vite 多入口生成器与路径压平插件，构建仍只发布 `dist/`。
- 用户后续确认首页只保留一个本地化下载按钮，指向最新 Release 的通用 DMG；移除架构探测与分架构按钮，无通用产物或请求失败时保留发布页入口。

## Capabilities

### New Capabilities

- `site-localization`: 官网四类页面的中英文静态版本、语言切换、语言一致的站内导航、静态与动态文案本地化、视觉与交互连续性，以及开发和发布构建的一致性。

### Modified Capabilities

无。当前项目没有已发布的 OpenSpec 能力规格。

## Impact

- `astro.config.mjs`、`package.json` 与锁文件：Astro 静态输出、原生 i18n 路由和子路径部署。
- `src/`：Astro 页面入口、共享布局、页面组件、语言资源与 `common/` 共享浏览器模块；共享模块从 `common/index.js` 暴露，页面专属脚本和样式与组件并置，全站共享样式放在 `src/styles/site.css`。
- `src/i18n/translations.js`、`src/i18n/routes.js`：页面文案、页面标识和资源路径辅助；根级 `scripts/`：构建期文案与 `SITE_URL` 校验及测试，不使用含义模糊的根级 `build/` 源码目录。
- `public/`：保留现有静态图片和 favicon；沿用 Astro 默认公开资源目录。
- 移除 `vite.config.js`、`build/flatten-pages.js` 及基于占位符生成 HTML 的实现；保留适用的语言校验与回归检查。
- README、`AGENTS.md` 和 Cloudflare Pages 发布工作流文档。
- 继续通过 Cloudflare Pages 发布静态 `dist/`，不引入服务端运行时、React/Vue 前端运行时或新数据服务。
