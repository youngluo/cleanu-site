# AGENTS.md — CleanU 官网

只记架构与规范；产品介绍与 `pnpm` 命令见 `README-zh_CN.md`。

- Astro 生成静态目录路由，`zh-CN` 为无前缀默认语言，英文位于 `/en/`；使用默认根级 `src/`、`public/` 目录，只发布 `dist/`。
- 每个页面和语言各有一个薄入口，共用布局与页面组件。`src/locales/{zh-CN,en}.json` 是唯一界面文案源；构建时校验两种语言的键、类型和插值参数，缺失键不得回退到另一种语言。
- 语言以 URL 为准，导航使用普通链接；页面链接与 `hreflang` 由 `astro:i18n` 生成。`src/i18n/routes.js` 映射页面标识，`src/i18n/translations.js` 管理文案并使用 `BASE_URL` 生成静态资源地址，支持 Pages 子路径。
- 更新日志与首页下载链接在构建时读取双语发布快照。界面文案来自 locale JSON，版本说明来自应用已确认的 changelogs。生产快照必须查询最新已发布 Release，并按其 tag 从 CleanU 代码库根目录读取 changelogs.json；每次 Astro 构建后恢复并校验唯一最新稳定版 DMG，再输出公开 appcast。浏览器不请求 GitHub 或翻译 API，历史日志不含旧下载链接。自动事件不递增官网版本；全部部署必须走完整 Publish 工作流。

- 发布代码只保留 `src/data/releases.js` 本地数据模块与 `scripts/releases.js` 执行脚本。Astro 页面引用前者；后者通过 `release:sync`、`release:assets`、`release:check` 分别同步、恢复产物和部署校验，不拆分仅作转发的入口文件。
