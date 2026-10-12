## Context

CleanU 官网提供首页、更新日志、隐私政策和支持页，页面文案存放于 `src/locales/{zh-CN,en}.json`。用户要求改用 Astro，并明确只需保持现有视觉样式，其余采用 Astro 约定。

行为契约见 `specs/site-localization/spec.md`。最终产物为八个独立静态页面与共享资源，部署工作流继续上传 `dist/`。

## Goals / Non-Goals

**Goals:**

- 使用 Astro 的静态多页面构建和组件组织，删去手写 HTML 生成与引用压平层。
- 保持现有页面视觉样式，继续提供语言一致的页面、站内导航和 Pages 子路径部署。
- 复用语言 JSON、Release API 行为、主题存储和现有图片，不引入 UI 框架运行时。
- 让开发服务和发布构建都由 Astro 直接渲染同一组页面源文件。

**Non-Goals:**

- 不重新设计页面、不改写产品文案或重新制作截图。
- 不增加自动语言跳转、客户端路由、服务端渲染、CMS 或新运行时数据源。
- 不把 GitHub Release 内容改为构建期抓取；浏览器端读取和显示行为保持不变。

## Decisions

### 1. Astro 原生 i18n 路由与目录式静态输出

使用 Astro `output: 'static'`、`build.format: 'directory'` 和 `trailingSlash: 'always'`。配置 `zh-CN` 为默认 locale，并关闭默认 locale 前缀；中文页面由 `pages/` 下的入口提供，英文页面放入 `pages/en/`。公开路径分别为 `/`、`/changelog/`、`/privacy/`、`/support/` 和 `/en/`、`/en/changelog/`、`/en/privacy/`、`/en/support/`。

页面语言链接和绝对 `hreflang` 地址使用 `astro:i18n` 的 `getRelativeLocaleUrl`、`getAbsoluteLocaleUrl`。`src/i18n/routes.js` 仅映射站点页面标识及资源 base，不再重复实现 locale 路由，并由页面文案入口复用。发布工作流注入 `SITE_URL` 时，从其路径派生 Astro `base`；本地开发没有 `SITE_URL` 时使用站点根路径。

Astro 按静态站点构建；页面不需要服务器，也不以客户端路由接管普通导航。开发和构建都直接编译 Astro 源码，不再预先写出 `.generated/` HTML。

### 2. 共享布局与页面组件只提取重复结构

`src/layouts/SiteLayout.astro` 负责文档语言、标题与描述、主题色、共享 CSS、导航、主题初始化、页脚和页面运行时文案数据。首页、更新日志、隐私政策和支持页各有一个页面组件；八个薄入口仅传入对应语言。

页面继续使用原有视觉样式和交互钩子。Astro 页面组件按职责组织，避免为适配旧模板而维护重复 HTML 生成层。

语言文案由 `src/locales/{zh-CN,en}.json` 提供。构建前校验两种语言的文案键、非空文本和插值参数集合；运行时字典只包含当前页面实际使用的必要类别。HTML 内容由 Astro 正常转义，运行时 JSON 嵌入前额外转义 `<`，避免文案中的结束标签截断脚本数据块。

页面使用 `translationsFor()` 获取当前语言文案；布局属性和运行时文案数据统一称为 `translations`，浏览器端通过 `translate()` 读取单条运行时文案。

运行时文案读取与全站交互初始化分别放在 `src/common/translations.js` 和 `src/common/site.js`；页面模块通过 `src/common/index.js` 使用共享的配置与翻译接口，避免依赖初始化脚本的副作用。

构建期的文案和 `SITE_URL` 校验实现及其 Node 测试放在根级 `scripts/`。页面源码会调用的路由与资源路径辅助放在 `src/i18n/`；根级 `build/` 不作为源码目录，避免与生成产物 `dist/` 混淆。

### 3. 将现有 CSS 和交互原样接入 Astro

公共 `src/styles/site.css` 保留全站令牌、基础排版和跨组件规则；四个页面组件各自的 CSS 与所属 Astro 组件放在同一目录，CSS 声明值保持不变。页面私有交互脚本也与所属组件并置；跨页共享浏览器逻辑与 Release 配置放在 `src/common/`，仍以普通模块脚本加载，无需改写成 Vue、React 或客户端水合组件。构建期校验与测试留在根级 `scripts/`；`src/pages/` 只放 Astro 文件路由。静态资源使用 Astro 默认的根级 `public/` 目录。

静态图标、截图与 favicon 放入 Astro `public` 资源目录，构建路径通过 `BASE_URL` 生成，以兼容仓库子路径。页面专属样式继续使用既有类名，特别保留首页预览标签的等宽布局、单一滑块尺寸计算、减动效、键盘操作与窄屏规则。

主题初始化脚本保持在 head 中尽早运行，以防首次绘制闪现错误主题。Release 列表仍在浏览器端从 `api.github.com` 加载，保留原始内容、纯文本插入、会话缓存、超时和本地化状态提示。

### 4. 正式 URL 与语言关联继续显式校验

复用现有 `SITE_URL` 规则：本地可省略，正式发布通过 `REQUIRE_SITE_URL=true` 要求有效的公开 HTTPS URL。Astro `base` 采用其站点子路径，`getAbsoluteLocaleUrl` 生成带部署路径的绝对 `hreflang` 地址；中文和英文页面配对同一逻辑页面。

站内地址由 Astro locale helper 生成，不能在组件里拼接遗漏 base 的根绝对路径。HTML 导出后检查八个页面入口、语言关联、站内目标和静态资源引用，避免只在开发服务器根路径有效。

### 5. 以现有页面为基准进行视觉和行为验收

重构前在现有开发服务记录首页、更新日志、隐私政策和支持页的视觉基准。Astro 版本在相同视口和主题下复查；首页还检查预览切换、导航、主题、FAQ、下载入口和减动效。窄屏检查语言入口、导航展开、预览标签与内容溢出。页面与路由组织可按 Astro 约定调整，视觉样式保持一致。

除了截图对照，还检查八个 locale URL、英语/中文切换、无 JavaScript 的静态正文、`hreflang`、默认中文根路径及 Pages 子路径资源加载。不得以修改样式值来适配路由或组件结构。

## Risks / Trade-offs

首页下载入口按用户后续确认调整为单个静态本地化按钮。浏览器端只选择文件名以 `-universal.dmg` 结尾且提供真实下载地址的 Release 产物，不再读取 WebGL 或 UA architecture。中文与英文按钮分别保持「下载」与「Download」，请求成功只更新 href。若尚无通用包、API 失败或限流，按钮仍可访问最新发布页；不把旧的单架构 DMG 当作通用包。移除不再使用的架构文案和运行时下载标签，更新相关安装说明。

- [静态输出的路由名或子路径与 Astro 配置不同] → 使用 Astro locale URL helper，并核验根路径与部署子路径的最终 `dist/`。
- [Astro 改写 HTML 结构后样式选择器失效] → 保留 class/ID/ARIA/data 属性和 CSS 声明；逐页浏览器对比。
- [public 资源移动后子路径请求 404] → 统一用 `BASE_URL` 生成 HTML 资源路径，检查构建产物本地引用。
- [语言 JSON 被漏用或运行时字典变大] → 静态和动态文案都引用现有字典，只注入页面所需运行时类别，构建时校验字典。
- [构建期读取 Release 导致发布依赖 GitHub API] → Release 继续按当前方式在浏览器加载。
- [Astro 版本升级带来配置变化] → 锁定 package 与 lockfile 的依赖版本，并以项目构建为准验证。

## Migration Plan

1. 添加 Astro 并配置原生 i18n、目录式静态输出、站点 base 与正式 URL 验证。
2. 建立共享布局与四类页面组件，保持视觉样式并产生八个 locale 路由。
3. 迁移公共和页面专属样式、favicon 与截图到 Astro 兼容的资源入口，确认子路径链接。
4. 删除旧 Vite 配置、入口占位符生成器和压平插件，更新构建、开发、测试和 README 命令。
5. 运行本地化检查、静态构建与页面视觉/交互验收；完成后仍通过现有 Pages 工作流发布 `dist/`，不自动执行线上发布。
