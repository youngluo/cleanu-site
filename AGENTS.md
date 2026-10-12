# AGENTS.md — CleanU 官网

只记架构与规范；产品介绍与 `pnpm` 命令见 `README-zh_CN.md`。

- Astro 生成静态目录路由，`zh-CN` 为无前缀默认语言，英文位于 `/en/`；使用默认根级 `src/`、`public/` 目录，只发布 `dist/`。
- 每个页面和语言各有一个薄入口，共用布局与页面组件。`src/locales/{zh-CN,en}.json` 是唯一文案源；构建时校验两种语言的键、类型和插值参数，缺失键不得回退到另一种语言。
- 语言以 URL 为准，导航使用普通链接；页面链接与 `hreflang` 由 `astro:i18n` 生成。`src/i18n/routes.js` 映射页面标识，`src/i18n/translations.js` 管理文案并使用 `BASE_URL` 生成静态资源地址，支持 Pages 子路径。
