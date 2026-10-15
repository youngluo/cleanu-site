# 国际化验收记录

验收日期为 2026-10-10。`add-site-localization` 的实现与以下规格逐项对应，全部通过。

## 验收环境

- Vite 8.3.1，Node.js 22.21.0，独立 Chrome 154 测试上下文，不使用用户浏览器资料。
- 开发服务 `http://127.0.0.1:5173/`、`pnpm preview` 服务 `http://127.0.0.1:4173/`，以及临时静态服务的 `/cleanu-site/` 子路径。
- 浏览器回归使用受控 GitHub API 数据，不依赖实际 Release 或接口配额；118 项浏览器检查通过。
- `pnpm test` 的 10 项测试通过，`pnpm build`、`git diff --check` 和 OpenSpec strict 校验通过。

## 规格对应

| 规格要求 | 实际验证 |
| --- | --- |
| Independently addressable language versions | 三种服务分别访问四个 HTML URL；文档语言、标题、对应页面语言链接正确，根地址保持中文 |
| Complete static localization | 浏览器禁用 JavaScript 后阅读四个页面；正文、元信息、导航、辅助文本、FAQ 答案及 Release 备用入口可用，`node_modules` 保留为 `code` |
| Accessible language switching and consistent navigation | 普通链接可通过 Enter 激活；首页与更新日志保持当前语言，`#faq` 和跨页 `#features` 保留，后退与刷新正常 |
| URL is the language authority | 中文浏览器偏好下英文 URL 不跳转；禁用 localStorage / sessionStorage 仍可切换语言和跨页导航；无效片段不追加到语言链接 |
| Localized runtime translations and dates | 两种语言循环三种主题并刷新验证持久化；Apple Silicon、Intel、未知架构、异步 UA hints 和 API 失败备用下载均正确；加载、空列表、403、404、网络失败及超时提示逐项验证 |
| External content and screenshot boundaries | 中文到英文复用原始 Release 缓存，仅重绘日期与站点提示；远端标题、说明、附件名不翻译，含 HTML 的说明仍为纯文本，未执行注入；真实截图资产未修改 |
| Discoverable published language variants | 用测试地址 `https://youngluo.github.io/cleanu-site/` 验证四页的两个绝对 hreflang 目标；它不是对实际部署地址的确认。缺失 SITE_URL 或使用 localhost 时，发布模式构建失败；普通本地构建成功且不伪造 SEO 地址 |
| Development and build consistency | 清空派生入口后分别启动开发和构建，四入口自动生成且被 Git 忽略；修改翻译和模板触发刷新，无循环；缺失翻译出现错误提示，恢复到相同有效内容也能清除提示；失败条件单元测试覆盖缺失键、参数不一致、未知占位符、未知引用、缺失页面 / 资源及残留嵌套目录 |
| Responsive localized controls | 两种语言在 1280、861、860、360、320px 验证标签等宽、滑块对齐和无水平溢出；移动导航与 Escape、标签方向键 / End、减动效均正常；另验证 FAQ 键盘开合、自动播放、悬停暂停与长图平移终点 |

## 验收中修正的问题

- Vite 会把产物中的外部 CSS 放到 head 后部，覆盖原有 noscript 样式。无 JS 降级已统一移至 `html:not(.has-js)` 的共享 CSS；FAQ 初始 ARIA 状态与静态展开一致，JS 初始化再收起。
- 翻译输入报错后恢复原值时，生成内容可能没有变化。开发插件记住错误状态，恢复成功也发出刷新，确保错误提示被清除。
- 320px 中英文标签保留等宽，缩短英文扫描标签并移除窄屏按钮的横向内边距，避免英文单词断开；图片替代文本独立于简短标签。

## 首版边界与交付

- 截图保持实际中文界面；Release 标题、正文、版本和附件名保持远端原文，不增加翻译服务或运行时数据源。
- 默认页面仍为中文，语言不写入浏览器存储，主题持久化保持原样。
- 发布工作流读取仓库变量 `SITE_URL`；本次未执行工作流、提交、线上发布或 OpenSpec 归档。
- 部署包只包含 `dist/` 的四个根 HTML 和资源，不发布模板与派生目录。开发命令和发布地址配置见两份 README。

## Astro 迁移初始复验（历史路由）

验收日期为 2026-10-11。此节记录 Astro 初次迁移、仍采用扁平 `.html` 路径时的历史检查；后续采用 Astro 原生目录式路由后的最终状态见下一节。

- Astro 7.3.8，Node.js 22.21.0；`pnpm test` 的 6 项翻译和路由检查通过，`pnpm build` 成功生成八个根级 `.html` 页面。
- 在 `/`、`changelog.html`、`privacy.html`、`support.html` 检查中文页面；检查英文首页直接访问、语言切换、主题切换、预览状态切换与 FAQ 展开。
- 用 `SITE_URL=https://youngluo.github.io/cleanu-site/` 构建并检查八页的双向 `hreflang`、语言链接、图标与截图资源路径和站内目标均包含 `/cleanu-site/`。没有把该测试地址当成实际线上部署确认。
- `REQUIRE_SITE_URL=true` 且缺少 `SITE_URL` 时构建失败；本地不设置 `SITE_URL` 时构建成功且不输出虚构的绝对语言地址。静态 HTML 已包含页面正文和 Release 备用链接。
- 四个页面的外观延续现有共享与页面 CSS；Astro 开发工具栏已关闭，避免在开发预览中遮挡原有页面。工作流、线上发布与 OpenSpec 归档未执行。

## Astro 原生路由复验

- 将默认语言保留在 `/`，中文子页面改为 `/changelog/`、`/privacy/`、`/support/`；英文页面使用 `/en/`、`/en/changelog/`、`/en/privacy/`、`/en/support/`。根路径和子路径 Astro 构建均成功生成八个目录式页面。
- 生成的导航、页脚、语言切换链接均按当前 locale 指向对应页面；英文页面的品牌、区块导航回到 `/en/`，语言切换回到对应中文页。
- 通过 `SITE_URL=https://youngluo.github.io/cleanu-site/ REQUIRE_SITE_URL=true` 构建，确认 `hreflang` 绝对链接、页面链接、favicon、截图和 `_astro` 资源都带 `/cleanu-site/` 子路径。
- 原有页面样式由共享 CSS 与各页面 CSS 继续加载；移除 Astro 迁移时新增的 body/main 弹性布局规则，恢复短页面原有的文档流。路由调整没有改动页面专属 CSS；本轮未运行 `pnpm test`。
- 复验时发现 4179 端口的旧 `astro preview` 进程仍持有 `trailingSlash: 'never'` 配置，访问 `/en/` 因缺少旧配置要求的无尾斜杠路径而返回 404。重新构建并重启预览后，`/en/#features` 正常显示英文首页；切换中文、再切回英文均保留 `#features`，英文更新日志、支持和隐私页也分别在 `/en/changelog/`、`/en/support/`、`/en/privacy/` 正常打开。
- 按 Astro 默认目录整理源码：路由入口只留在 `src/pages/`，组件、布局、语言文案、脚本和样式分别归入 `src/components/`、`src/layouts/`、`src/locales/`、`src/scripts/` 和 `src/styles/`，静态资源放在根级 `public/`；移除旧 `web/`。重建无路由冲突并生成八个页面；浏览器刷新后英文直达页保持英文，语言双向切换和四个英文页面链接正常，现有视觉样式与截图保持一致。
- 目录命名复核后，将页面源码复用的路径辅助移入 `src/i18n/routes.js`，将构建期本地化校验及其测试移入根级 `scripts/`，同步更新导入、`pnpm test` 脚本和项目架构文档，并移除空的根级 `build/`。Astro 构建成功生成八个页面，`git diff --check` 通过；本次未运行测试套件。
- 按组件样式就近组织约定，将四个页面专属 CSS 移入各自的 `src/components/*Page/`，全站共享 CSS 仍位于 `src/styles/site.css`；CSS 声明未改，Astro 构建生成八个页面，strict OpenSpec 校验和 `git diff --check` 通过。
- 将首页和更新日志专属脚本移入各自的 `src/components/*Page/`，共享浏览器脚本留在 `src/scripts/`，构建期脚本留在根级 `scripts/`；更新导入和目录规则。Astro 构建生成八个页面，strict OpenSpec 校验、旧路径引用扫描和 `git diff --check` 通过；本次未运行测试。
- 按目录约定将跨页面共享浏览器逻辑与 Release 配置由 `src/scripts/` 移至 `src/common/`，同步更新组件和布局导入及项目文档。Astro 构建生成八个页面，strict OpenSpec 校验、当前源码与规范中的旧路径扫描和 `git diff --check` 通过；本次未运行测试。
- 将本地化数据从 `copy` 命名统一为 `translations`：重命名 `src/i18n/translations.js` 及其 API，更新布局 / 组件属性、运行时 `translate()` helper 与数据节点标识。Astro 构建生成八个页面，旧命名扫描、strict OpenSpec 校验和 `git diff --check` 通过；本次未运行测试。
- 将运行时翻译读取从全站交互初始化中拆出，页面脚本通过 `src/common/index.js` 导入共享配置和翻译接口；构建期校验及测试 helper 统一为 `validateTranslations` / `loadTranslations`。Astro 构建生成八个页面，strict OpenSpec 校验、旧标识扫描和 `git diff --check` 通过；本次未运行测试。
# 2026-10-13 静态更新日志补充验收

- `node --test scripts/*.test.js` 通过 12 项测试，包括分页私有 API、草稿过滤、字段白名单、无效数据、认证/网络失败、缺失指定 tag 和离线快照读取。
- Astro 构建成功生成八个 HTML 页面。分别构建空快照和 `/private/tmp/cleanu-releases-preview.json` 测试快照；两种语言日志正文直接位于 HTML，测试 `<script>` 被转义为文字，未执行。
- 使用 `SITE_URL=https://youngluo.github.io/cleanu-site/` 和 `REQUIRE_SITE_URL=true` 构建，检查八个页面的本地资源/链接、hreflang 和 base 路径全部有效。
- 浏览器检查中文/英文、亮色/暗色、版本锚点与语言链接的锚点保留。320px 与 360px 视口无水平溢出，列表正确切换为单列。
- 更新日志不再包含加载提示、私有 Releases 链接或独立日志脚本；共用浏览器脚本不请求 Release API 或使用会话缓存。首页保留已有下载行为。
- 同步 CLI 缺少 token 时以非零状态退出，原快照不变。两仓库 workflow YAML、shell 语法、通知依赖与自动同步跳过官网版本发布的条件验证通过。
- 普通本地构建使用已安装的 Astro CLI，并设置 `ASTRO_TELEMETRY_DISABLED=1`。本机 pnpm 的依赖预检尝试访问不可用镜像，故本轮用等价的 Node CLI 执行测试和构建，没有更改依赖。
- 真实私有 Release 与线上自动部署尚未验证：GitHub CLI 未登录，两份 Actions secret 尚未配置。初始快照为空，测试数据不提交；步骤见两份 README。应用的待验证任务为 `add-update-check` 6.3。

## 双语日志与最新 Pages 包（2026-10-13）

- 官网 16 项测试、发布侧 Python 9 项测试通过；最新 DMG 每次干净重建恢复，新版本只保留新 DMG，历史双语日志继续生成。
- 私有下载的 302 跳转请求不携带仓库 token；大小、hash、25 MiB、认证与生产版本替换/降级失败条件均有覆盖。
- 八页根路径/子路径构建、本地资源和下载/appcast 同源核对通过；中英文正文独立且转义，320px 页面无水平溢出。
- 自动同步不递增官网版本；所有 Pages 发布在恢复与部署门禁之后。
- GitHub CLI 未登录，未配置 secrets、初始化远端 release-data 或执行真实发布；线上最新包与重建验证仍待完成。

## 最终 Release/tag JSON 流程验收

数据源已从官网 release-data 分支改为最新已发布 CleanU Release 对应 tag 的根目录 changelogs.json。GitHub Release 仅显示当前版本英文且只附 DMG；官网按同一 JSON 渲染双语全量历史。17 项 Node 测试、根路径及 /site/ 子路径各八页静态构建、转义与链接检查通过。应用侧 23 项 Python 测试和 Debug 构建通过。未触发真实 PR 合并、应用 Release 或 Pages 部署，等待凭据/权限配置后的端到端验收。此前 release-data 初始化记录为已替代方案的历史证据。

## 发布脚本简化验收（2026-10-14）

- 五个发布模块收敛为 scripts/releases.js 执行脚本和 src/data/releases.js 本地数据模块，合计 227 → 214 行；页面不再导入含网络和部署逻辑的模块。
- 17 项 Node 与 23 项应用 Python 测试通过，工作流 YAML/shell、两仓库 OpenSpec strict 和 diff 检查通过。
- 临时工程中实际执行新 sync/assets/check CLI，使用替身 API 和已有真实 Universal DMG；缺失 token 保留快照，损坏包保留原文件，修订过期和降级均失败。
- 连续两次干净构建分别输出根路径与 /site/ 子路径的八页静态 HTML，并恢复同一份校验通过的最新 DMG；双语正文、站内链接、首页下载与公开 appcast 路径一致。
- 应用 workflow 的 PR 文案、summary 和 gh tag 通知用替身命令实跑；此前的手动补发校验拒绝草稿和非法版本，该入口现已移除，手动刷新统一走官网 Publish。没有真实模型请求、GitHub 发布或 Cloudflare 部署。
