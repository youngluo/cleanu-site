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
| Localized runtime copy and dates | 两种语言循环三种主题并刷新验证持久化；Apple Silicon、Intel、未知架构、异步 UA hints 和 API 失败备用下载均正确；加载、空列表、403、404、网络失败及超时提示逐项验证 |
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
- Pages 工作流已在构建前取得 `base_url`；本次未执行工作流、提交、线上发布或 OpenSpec 归档。
- 部署包只包含 `dist/` 的四个根 HTML 和资源，不发布模板与派生目录。开发命令和发布地址配置见两份 README。
