## Purpose

为 CleanU 官网提供可独立访问的简体中文和英文页面，让访问者能够阅读本地化的产品说明、使用下载入口并查看发布记录。语言通过页面 URL 明确表达，在刷新、分享与跨页导航后保持一致，同时保证静态内容、辅助技术文案和运行时状态使用对应语言。

## ADDED Requirements

### Requirement: Independently addressable language versions

站点 SHALL 提供中文首页 `index.html`、中文更新日志 `changelog.html`、英文首页 `index.en.html` 和英文更新日志 `changelog.en.html`。直接访问任意语言页面时，返回的 HTML MUST 已包含对应语言的静态正文。站点默认首页 SHALL 保持中文，现有中文 URL MUST 继续可用。

#### Scenario: Directly opening a language-specific page

- **WHEN** 访问者直接打开四个页面 URL 中的任意一个
- **THEN** 页面显示该 URL 对应的内容和语言，无需先访问首页或执行文案替换脚本

#### Scenario: Keeping existing Chinese addresses

- **WHEN** 访问者打开站点根地址、`index.html` 或 `changelog.html`
- **THEN** 站点显示对应的中文页面，已有页面锚点保持可访问

### Requirement: Complete static localization

每个页面 SHALL 为站点维护的正文、导航、页脚、标题、描述、图片替代文本及辅助技术标签提供对应语言的文案。中文页面的文档语言 MUST 为 `zh-CN`，英文页面 MUST 为 `en`。品牌名、技术标识、平台和架构名称不要求翻译。

#### Scenario: Reading an English page without JavaScript

- **WHEN** 访问者禁用 JavaScript 后打开英文首页或英文更新日志
- **THEN** 页面标题、静态正文、导航、页脚及相应的辅助技术标签使用英文，首页 FAQ 的静态答案仍可阅读
- **THEN** 更新日志提供指向 GitHub Releases 的可用链接，不要求在无 JavaScript 时加载远端发布列表

#### Scenario: Exposing the language to assistive technology

- **WHEN** 辅助技术读取任意语言版本的页面
- **THEN** 文档语言与该页面 URL 一致，导航名称、主题控件说明、跳过导航链接和预览图片替代文本使用对应语言

### Requirement: Accessible language switching and consistent navigation

两页 SHALL 提供可用键盘访问的普通语言切换链接，指向当前逻辑页面的另一种语言版本。站内跨页导航 MUST 保持当前页面语言。在 JavaScript 可用时，语言切换 MUST 保留当前有效锚点；禁用 JavaScript 时，语言切换 MUST 仍能到达对应逻辑页面。

#### Scenario: Switching the current page language

- **WHEN** 访问者在英文更新日志中选择中文
- **THEN** 浏览器打开中文更新日志，而不是跳回首页

#### Scenario: Preserving the current section

- **WHEN** JavaScript 可用，访问者在 `index.html#faq` 选择英文
- **THEN** 浏览器打开 `index.en.html#faq`，并定位到对应 FAQ 区块

#### Scenario: Navigating within the English site

- **WHEN** 访问者从英文首页打开更新日志，再通过导航返回首页的功能或安全边界区块
- **THEN** 所有目标页面保持英文，并保留链接所指定的区块锚点

#### Scenario: Switching without JavaScript

- **WHEN** 访问者禁用 JavaScript 并用键盘激活语言切换链接
- **THEN** 浏览器打开当前逻辑页面的另一种语言版本

### Requirement: URL is the language authority

页面语言 SHALL 由访问的页面 URL 决定。浏览器语言与已保存的主题或其他偏好 MUST NOT 改写该页面语言，也 MUST NOT 将访问者自动跳转到另一种语言页面。刷新和直接分享 URL SHALL 保持同一种语言。

#### Scenario: Opening English with Chinese browser preferences

- **WHEN** 浏览器首选语言为中文，访问者打开或刷新 `index.en.html`
- **THEN** 页面保持英文，不跳转到中文页面

#### Scenario: Storage is unavailable

- **WHEN** 浏览器禁止本地存储，访问者切换语言并继续跨页导航
- **THEN** 页面语言与导航目标仍由 URL 正确确定

### Requirement: Localized runtime copy and dates

动态主题提示、架构识别后的下载按钮、发布列表加载提示、空状态、错误提示、预发布标签和备用下载文字 SHALL 使用当前页面语言。发布日期 SHALL 按当前页面语言格式化。同一份远端数据在不同语言页面使用时 MUST 重新按当前页面语言呈现。

#### Scenario: Theme and download labels remain English

- **WHEN** 英文首页初始化、访问者切换主题，或异步请求取得匹配当前架构的 DMG
- **THEN** 主题控件的说明与下载按钮标签保持英文，下载目标继续指向正确附件

#### Scenario: Release status messages are localized

- **WHEN** 英文更新日志正在加载、没有公开 Release，或请求遇到 403、404、网络错误或超时
- **THEN** 页面显示与该状态对应的英文提示，并保留可用的 GitHub Releases 链接

#### Scenario: Reusing cached release data across languages

- **WHEN** 访问者先查看中文更新日志，再切换到英文更新日志并复用同一批已缓存的 Release 数据
- **THEN** 日期、预发布标签与站点状态提示使用英文，不沿用中文格式化结果

### Requirement: External content and screenshot boundaries

Release 标题、说明正文、版本标识和附件名称 SHALL 保持远端原文；Release 正文 MUST 按纯文本展示。国际化 SHALL 不引入翻译服务或新增运行时外部数据源。首版 SHALL 复用现有真实中文界面截图，其替代文本使用当前页面语言。

#### Scenario: Rendering remote release notes

- **WHEN** 英文更新日志收到中文 Release 正文或包含 HTML 片段的说明
- **THEN** 页面按原文和纯文本呈现这些内容，不翻译、不将其中的 HTML 作为页面标记执行

#### Scenario: Previewing the product in English

- **WHEN** 访问者查看英文首页的产品预览
- **THEN** 预览使用现有真实截图，标签与图片替代文本使用英文

### Requirement: Discoverable published language variants

正式发布的每个页面 SHALL 提供自身语言和对应另一种语言页面的 `hreflang` 链接。链接 MUST 使用实际部署站点的完整公开 URL，包含部署子路径。发布流程 MUST 在无法确定有效公开站点 URL 时失败，不能发布指向示例域名或本机地址的语言关联。

#### Scenario: Publishing under a repository subpath

- **WHEN** 站点发布到一个带子路径的公开地址
- **THEN** 各页面的语言关联包含该子路径，并将首页与首页、更新日志与更新日志正确配对

#### Scenario: Rejecting missing publication metadata

- **WHEN** 正式发布流程无法取得有效公开站点 URL
- **THEN** 发布构建中止并说明缺失或无效的配置，不上传错误的语言关联产物

### Requirement: Development and build consistency

开发环境与构建后的静态产物 SHALL 提供相同的四种页面路径、静态文案和站内语言导航行为。编辑模板或语言资源后，开发页面 SHALL 更新到新内容。缺失必需翻译、残留模板占位符、未知站内引用或缺失页面产物 MUST 导致构建失败，并指出相关页面、键或引用。产物 SHALL 在根目录或部署子路径下正确解析页面链接和资源。

#### Scenario: Comparing development and preview

- **WHEN** 访问者分别在开发服务器和构建产物预览中打开同一个语言页面
- **THEN** 两者的页面内容、文档语言、站内链接和语言切换目标一致

#### Scenario: Updating translations during development

- **WHEN** 开发者修改某个已使用的英文翻译
- **THEN** 对应开发页面更新并显示新文案，无需手动编辑生成文件

#### Scenario: Failing on incomplete translations

- **WHEN** 构建所需的翻译键缺失或生成 HTML 中残留未替换的占位符
- **THEN** 构建失败并报告页面与问题键或占位符，不用中文静默补齐英文

#### Scenario: Failing on invalid local references

- **WHEN** 构建发现不存在的站内页面、无法识别的站内引用形态或缺少预期页面产物
- **THEN** 构建失败并报告问题目标，不生成看似成功但无法导航的发布包

### Requirement: Responsive localized controls

中英文页面 SHALL 在桌面与移动端保持语言切换入口和导航可用，不因英文文案产生页面水平溢出。产品预览标签 MUST 保持等宽，选中滑块 MUST 与当前标签对齐，键盘切换与既有减动效行为 SHALL 继续可用。

#### Scenario: Using English preview labels

- **WHEN** 访问者在桌面或窄屏英文页面切换任意预览标签
- **THEN** 标签等宽、文本可读、滑块覆盖对应标签，页面没有由该控件引起的水平溢出

#### Scenario: Using navigation on a narrow screen

- **WHEN** 访问者在窄屏中英文页面打开导航并使用语言切换入口
- **THEN** 导航和语言入口可见且可操作，目标语言页面保持对应的逻辑页面
