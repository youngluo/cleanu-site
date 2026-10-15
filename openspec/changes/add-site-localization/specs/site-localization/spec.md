## Purpose

为 CleanU 官网提供可独立访问的简体中文和英文页面，让访问者能够阅读本地化的产品说明、使用下载入口并查看发布记录。语言通过页面 URL 明确表达，在刷新、分享与跨页导航后保持一致，同时保证静态内容、辅助技术文案和运行时状态使用对应语言。

## ADDED Requirements

### Requirement: Independently addressable language versions

站点 SHALL 使用 Astro 原生 i18n 路由提供首页、更新日志、隐私政策和支持页的简体中文与英文静态版本。简体中文为默认语言，路由为 `/`、`/changelog/`、`/privacy/`、`/support/`；英文路由为 `/en/`、`/en/changelog/`、`/en/privacy/`、`/en/support/`。直接访问任意页面时，返回的 HTML MUST 已包含 URL 对应语言的正文。站点默认首页 SHALL 保持中文。

#### Scenario: Directly opening a language-specific page

- **WHEN** 访问者直接打开八个页面 URL 中的任意一个
- **THEN** 页面显示该 URL 对应的内容和语言，无需先访问首页或执行文案替换脚本

#### Scenario: Keeping the default locale at the root

- **WHEN** 访问者打开站点根地址或任一中文页面 URL
- **THEN** 站点显示对应的中文页面，已有页面锚点保持可访问

### Requirement: Complete static localization

四类页面 SHALL 为站点维护的正文、导航、页脚、标题、描述、图片替代文本及辅助技术标签提供对应语言的文案。中文页面的文档语言 MUST 为 `zh-CN`，英文页面 MUST 为 `en`。品牌名、技术标识、平台和架构名称不要求翻译。

#### Scenario: Reading an English page without JavaScript

- **WHEN** 访问者禁用 JavaScript 后打开任一英文页面
- **THEN** 页面标题、静态正文、导航、页脚及相应辅助技术标签使用英文；首页 FAQ 答案与完整更新日志均可阅读

#### Scenario: Exposing the language to assistive technology

- **WHEN** 辅助技术读取任意语言版本的页面
- **THEN** 文档语言与该页面 URL 一致，导航名称、主题控件说明、跳过导航链接和预览图片替代文本使用对应语言

### Requirement: Accessible language switching and consistent navigation

四类页面 SHALL 提供可用键盘访问的普通语言切换链接，指向当前逻辑页面的另一种语言版本。站内跨页导航 MUST 保持当前页面语言。在 JavaScript 可用时，语言切换 MUST 保留当前有效锚点；禁用 JavaScript 时，语言切换 MUST 仍能到达对应逻辑页面。

#### Scenario: Switching the current page language

- **WHEN** 访问者在英文更新日志、隐私政策或支持页中选择中文
- **THEN** 浏览器打开相同逻辑页面的中文版本，而不是跳回首页

#### Scenario: Preserving the current section

- **WHEN** JavaScript 可用，访问者在 `/#faq` 选择英文
- **THEN** 浏览器打开 `/en/#faq`，并定位到对应 FAQ 区块

#### Scenario: Navigating within the English site

- **WHEN** 访问者从任一英文页面打开另一站内页面，再通过导航返回首页的功能或安全边界区块
- **THEN** 所有目标页面保持英文，并保留链接所指定的区块锚点

#### Scenario: Switching without JavaScript

- **WHEN** 访问者禁用 JavaScript 并用键盘激活语言切换链接
- **THEN** 浏览器打开当前逻辑页面的另一种语言版本

### Requirement: URL is the language authority

页面语言 SHALL 由访问的页面 URL 决定。浏览器语言与已保存的主题或其他偏好 MUST NOT 改写该页面语言，也 MUST NOT 将访问者自动跳转到另一种语言页面。刷新和直接分享 URL SHALL 保持同一种语言。

#### Scenario: Opening English with Chinese browser preferences

- **WHEN** 浏览器首选语言为中文，访问者打开或刷新 `/en/`
- **THEN** 页面保持英文，不跳转到中文页面

#### Scenario: Storage is unavailable

- **WHEN** 浏览器禁止本地存储，访问者切换语言并继续跨页导航
- **THEN** 页面语言与导航目标仍由 URL 正确确定

### Requirement: Localized runtime translations and dates

主题提示、日志空状态和最新版本标签 SHALL 使用当前页面语言。发布日期 SHALL 在构建时按 locale 与 UTC 格式化。首页 SHALL 提供唯一的静态最新通用包链接，支持部署子路径，不探测硬件或请求 GitHub API。尚无本地记录时，开发页面 SHALL 使用站内日志入口；正式部署 SHALL 拒绝空记录。

#### Scenario: Reading localized release notes

- **WHEN** 访问者打开中文或英文更新日志
- **THEN** 同一版本分别显示已确认的 zh-CN 或 en 说明，无客户端翻译或跨语言回退

### Requirement: External content and screenshot boundaries

发布数据 SHALL 同时提供非空 zh-CN 与 en 条目。说明 MUST 按纯文本经 HTML 转义输出；版本标识及文件名无需翻译。站点 SHALL NOT 引入运行时翻译服务。首版截图继续使用真实中文界面截图，替代文本使用页面语言。

#### Scenario: Escaping release content

- **WHEN** 说明中包含 HTML 片段
- **THEN** 片段作为文字显示，不作为页面标记执行

### Requirement: Discoverable published language variants

正式发布的八个页面 SHALL 提供自身语言和对应另一种语言页面的 `hreflang` 链接。链接 MUST 使用实际部署站点的完整公开 URL，包含部署子路径。发布流程 MUST 在无法确定有效公开站点 URL 时失败，不能发布指向示例域名或本机地址的语言关联。

#### Scenario: Publishing under a repository subpath

- **WHEN** 站点发布到一个带子路径的公开地址
- **THEN** 各页面的语言关联包含该子路径，并将每种逻辑页面与另一种语言的同页版本正确配对

#### Scenario: Rejecting missing publication metadata

- **WHEN** 正式发布流程无法取得有效公开站点 URL
- **THEN** 发布构建中止并说明缺失或无效的配置，不上传错误的语言关联产物

### Requirement: Development and build consistency

开发环境与构建后的静态产物 SHALL 提供相同的八种页面路径、静态文案和站内语言导航行为。编辑页面组件或语言资源后，开发页面 SHALL 更新到新内容。缺失必需翻译或缺失页面产物 MUST 导致构建失败，并指出相关页面或文案键。产物 SHALL 在根目录或部署子路径下正确解析页面链接和资源。

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

- **WHEN** 构建发现缺少预期页面、站内链接目标或静态资源
- **THEN** 构建失败并报告问题目标，不生成看似成功但无法导航的发布包

### Requirement: Responsive localized controls

中英文页面 SHALL 在桌面与移动端保持语言切换入口和导航可用，不因英文文案产生页面水平溢出。产品预览标签 MUST 保持等宽，选中滑块 MUST 与当前标签对齐，键盘切换与既有减动效行为 SHALL 继续可用。

#### Scenario: Using English preview labels

- **WHEN** 访问者在桌面或窄屏英文页面切换任意预览标签
- **THEN** 标签等宽、文本可读、滑块覆盖对应标签，页面没有由该控件引起的水平溢出

#### Scenario: Using navigation on a narrow screen

- **WHEN** 访问者在窄屏中英文页面打开导航并使用语言切换入口
- **THEN** 导航和语言入口可见且可操作，目标语言页面保持对应的逻辑页面

### Requirement: Existing visual design and interactions are preserved

Astro 重构 MUST 保留现有页面的视觉风格、布局、排版、颜色令牌、页面专属样式和控件外观。中英文版本 MUST 共用对应页面的视觉规则；路由和组件组织按 Astro 约定实现，现有页面功能仍须可用。项目 MUST 使用根级默认 `src/` 和 `public/` 目录；`src/pages/` 只存放 Astro 路由入口，页面专属脚本和样式与对应组件同目录，共享浏览器模块放在 `src/common/`，使用方直接引用所需模块；运行时翻译读取与全站交互初始化 MUST 分离，不保留没有调用方的转发入口。全站共享样式放在 `src/styles/site.css`。页面源码使用的路由与资源路径辅助 MUST 放在 `src/i18n/`；构建期文案与发布地址校验及其测试 MUST 放在根级 `scripts/`，不得混入生成产物目录。旧 `web/` 目录及 Vite 专用配置和入口生成器 MUST 移除。

#### Scenario: Viewing pages after the framework migration

- **WHEN** 访问者打开首页、更新日志、隐私政策或支持页的任一语言版本
- **THEN** 页面继续使用迁移前对应页面的布局、配色、排版、截图和控件样式

#### Scenario: Using existing interactive controls

- **WHEN** 访问者使用主题切换、移动导航、首页预览与 FAQ，或查看静态 Release 列表
- **THEN** 控件的键盘与减动效行为保持可用，更新日志可直接阅读

### Requirement: Static private release synchronization

页面构建 SHALL 通过本地数据模块读取快照，不包含网络请求。同步、安装包恢复和部署检查 SHALL 使用同一个发布 CLI 的独立阶段，减少包装入口且保留每阶段失败停止后续部署的行为。

CleanU 发布成功后 SHALL 发送仅包含 tag 的 cleanu-release 事件。官网构建 SHALL 使用私有仓库只读凭据查询最新稳定 Release，按其 tag 读取 CleanU 根目录全量 changelogs.json，并从同一 Release 解析最新 DMG 附件 ID。SHALL NOT 使用 main 中未发布数据、release-data 分支、事件日志或 Actions 缓存作为来源。JSON 保留全部双语历史；Release 正文仅英文。重复通知 MUST 幂等，同版本产物变化 MUST 拒绝。自动同步 SHALL NOT 递增官网版本或创建官网 Release。需要手动刷新时 SHALL 运行官网 Publish，执行同一完整同步、构建和部署；手动 Publish 保留官网自身版本/tag/Release 流程。

#### Scenario: Rebuilding only website code

- **WHEN** 官网更新代码或重新构建
- **THEN** 读取最新已发布 Release 的 tag JSON 并恢复同一版本 DMG，不因主分支快照为空而丢失下载

#### Scenario: Receiving an older notification

- **WHEN** 旧版本事件晚于新版本事件到达
- **THEN** 按语义版本选择最高稳定版本，保留所有双语日志，不回退下载与 appcast

### Requirement: Latest-only Pages distribution

每次正式部署 SHALL 在 Astro 构建后从私有 GitHub Release 恢复并校验最新稳定版本的唯一 DMG，输出 downloads/{version}/{filename} 与 updates/appcast.json。首页与 appcast MUST 引用相同文件，兼容 universal/arm64/x86_64 键。Pages SHALL 仅保留最新 DMG，历史日志 SHALL NOT 提供过期下载链接。凭据及私有附件 URL MUST NOT 进入静态产物。生产部署 SHALL 串行执行并在部署前检查数据修订，拒绝版本降级或同版本校验值变化。

新包文件名 SHALL 为 CleanU-{version}.dmg。读取和恢复时 SHALL 使用已发布 JSON 的实际文件名，并继续接受此前的 CleanU-{version}-universal.dmg；SHALL NOT 因官网重建而重命名已发布包或改写其下载地址。

#### Scenario: Deploying a new app version

- **WHEN** 新版本的完整站点与 DMG 校验通过并部署成功
- **THEN** 首页和 appcast 指向新 DMG，旧 DMG 不进入本次部署，历史日志仍可阅读

#### Scenario: Blocking incomplete deployment

- **WHEN** 凭据缺失、持久化数据缺失、文件恢复失败、校验不符、单文件超过 25 MiB，或构建数据已过期
- **THEN** 不执行 Pages 部署，线上上一份完整站点与下载保持可用

### Requirement: 官网手动发布收尾

手动 Publish SHALL 按所选升级类型在部署前本地准备官网版本 commit/tag，并在完整校验与 Pages 部署成功后推送 main/tag、创建 GitHub Release。main 与 tag SHALL 原子推送。自动应用通知 SHALL 执行同一同步与部署链路，并跳过官网版本准备和发布步骤。

#### Scenario: 手动官网发版

- **WHEN** 维护者运行手动 Publish 且 Pages 部署成功
- **THEN** 按所选 patch/minor/major 发布官网版本；任一部署前步骤或部署失败均不推送官网版本提交

#### Scenario: 自动同步不写官网版本

- **WHEN** 应用通知触发 Publish
- **THEN** 同步、构建、校验并部署最新应用数据，不创建官网版本提交、tag 或 Release
