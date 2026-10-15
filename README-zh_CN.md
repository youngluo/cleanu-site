<div align="center">
  <img src="public/assets/icon.webp" width="128" height="128" alt="CleanU">
  <h1>CleanU</h1>
  <p>安全、透明的 macOS 菜单栏清理工具。</p>
  <p>简体中文&nbsp;&nbsp;|&nbsp;&nbsp;<a href="README.md">English</a></p>
</div>

CleanU 是 macOS 菜单栏上的磁盘清理工具：一次深度扫描把可清理项和启动磁盘占用一起列出来，每一项都带完整路径和实际体积，你逐项勾选确认之后才会移入废纸篓。

## 功能

- **八类扫描来源**：缓存、临时文件、开发工具缓存、项目产物、应用残留、安装包、压缩包、大文件。
- **结果分四组**：缓存清理、项目清理、应用残留、空间分析；每项列条目数与体积。常见条目如 iOS 模拟器、Xcode 真机调试支持、DerivedData、npm 与 Homebrew 缓存。
- **平台**：macOS 13+，支持 Apple Silicon 与 Intel 两种架构。

## 安全边界

首页用这五条说明 CleanU 在这台 Mac 上的行为范围：

1. **扫描只读** —— 只读目录和文件属性，不写入、不移动、不删除。
2. **清理需要明确确认** —— 候选项只有你点下确认之后才会被处理，没有后台自动清理。
3. **执行前二次校验** —— 动手前重新核对一遍候选项，路径或体积对不上的会被排除。
4. **只进废纸篓** —— 确认后的文件移入废纸篓，可以随时放回；Time Machine 快照按系统方式精简，不进废纸篓。
5. **无需提权** —— 以当前用户权限运行，不需要管理员密码；读不到的路径不出现在结果里。

## 本地开发

```bash
pnpm install
pnpm dev        # http://localhost:4321/
pnpm build      # 产物在 dist/，发布只传 dist/
pnpm preview    # 起静态服务验产物
```

首页、更新日志、隐私政策和支持页均有简体中文与英文版本。简体中文是默认语言，使用 `/`、`/changelog/`、`/privacy/`、`/support/`；英文使用 `/en/`、`/en/changelog/`、`/en/privacy/`、`/en/support/`。站点不根据浏览器偏好跳转。

Astro 使用默认的根级 `src/` 和 `public/` 目录。页面入口位于 `src/pages/`，英文入口放在 `src/pages/en/`，简体中文默认路由不带语言前缀。共享页面组件和布局位于 `src/components/`、`src/layouts/`。文本统一放在 `src/locales/{zh-CN,en}.json`，页面专属脚本和样式与对应组件并置，全站共享浏览器脚本放在 `src/common/`，构建期校验和测试放在根级 `scripts/`。全站共享样式放在 `src/styles/site.css`，静态资源放在 `public/`。Astro 原生 i18n helper 生成语言链接，构建会校验语言键和插值参数，并按目录路由写入 `dist/`。

普通本地构建可不设置 `SITE_URL`，此时不输出 SEO 语言关联。验证正式元信息时，设置包含部署子路径的真实 HTTPS 地址，例如 `SITE_URL=https://你的公开域名/站点路径/ pnpm build`。发布工作流读取仓库变量 `SITE_URL`，并用 `REQUIRE_SITE_URL=true` 拒绝缺失或无效配置。

运行 `pnpm test` 检查翻译契约、公开站点地址校验以及页面/资源路径映射。截图仍为实际中文界面，发布日志使用已确认的中英文说明；语言关联不会改变站内导航。

## 双语发布日志与 Pages 下载

链路为 `CleanU 发版 PR 合并 → 测试/升版本/DMG/tag/Release → 通知官网 → 拉取最新 Release 的 tag JSON 与 DMG → Astro 静态构建 → 校验 → Pages 部署`。

CleanU 根目录 `changelogs.json` 保存全量双语历史，最新记录包含通用包文件名、大小和 SHA-256。模型只生成新增版本的中英文说明；JSON 与应用版本、appcast 一起进入发布 commit/tag。GitHub Release 正文仅英文，附件仅 DMG。官网始终查询最新已发布稳定 Release，并按该 tag 读取 JSON，不读取 main 的未发布内容，也不依赖 release-data 分支或 Actions 缓存。

每次部署都生成对应语言的静态日志 HTML；Astro 构建后从同一私有 Release 恢复唯一最新 DMG，校验大小、SHA-256 和 25 MiB 上限，再输出 `dist/downloads/{version}/CleanU-{version}.dmg` 与 `dist/updates/appcast.json`。首页与 universal/arm64/x86_64 入口引用同一文件，已发布包保留原文件名；历史日志保留，旧下载链接移除。官网单独重建也恢复安装包，因此不会覆盖丢失下载资源。失败不进入部署，线上上一版保持可用。

配置以下凭据与变量：

| 所在仓库 | 名称 | 权限或用途 |
| --- | --- | --- |
| CleanU | GEMINI_API_KEY | Gemini 免费档生成增量双语说明 |
| CleanU | SITE_DISPATCH_TOKEN | 仅官网仓库 Contents write，发送 cleanu-release |
| cleanu-site | CLEANU_RELEASES_TOKEN | 仅私有 CleanU 仓库 Contents read，读取 Release/tag JSON 并下载 DMG |
| cleanu-site | CLOUDFLARE_API_TOKEN | Cloudflare Pages 部署 |
| cleanu-site | CLOUDFLARE_ACCOUNT_ID | Cloudflare 账号 ID |
| cleanu-site 变量 | SITE_URL | 公开 HTTPS 官网地址及可选子路径 |

CleanU Actions 设置须允许创建 PR。凭据不得放进源码、PUBLIC_* 变量或发布数据。首次同步需发布一个包含根目录 changelogs.json 的新应用版本；旧 Release 缺少该文件时明确失败。应用发布成功后会自动启动官网 Publish。需要手动刷新时，在本仓库运行 Publish；它会读取最新应用 Release 并执行完整构建/部署，同时递增官网自身版本、创建 tag 和 GitHub Release。应用自动事件不会递增官网版本。

生产部署由同一工作流串行执行；上传前重新检查最新 Release/tag 的 JSON 修订和线上 appcast，拒绝过期数据、版本降级及同版本文件替换。官网代码回滚也走完整流水线。关闭绕过此流程的 Cloudflare Git 自动构建；不要直接回滚到缺少当前包的旧 Pages 部署。

本地命令通过环境变量提供凭据：

```bash
pnpm release:sync       # CLEANU_RELEASES_TOKEN 读取最新 Release 的 tag JSON
pnpm test
pnpm build              # SITE_URL 指定公开地址及部署子路径
pnpm release:assets  # CLEANU_RELEASES_TOKEN 恢复并校验最新 DMG
pnpm release:check   # 同一 token 检查发布修订及线上 appcast
```

离线预览读取空的 src/data/changelogs.json，或用 CLEANU_RELEASES_FILE 指定测试快照，不联网。单独 pnpm build 只生成页面；正式部署必须完成同步、安装包恢复与校验。超过 25 MiB 明确失败，不自动切换到其他存储。

发布相关代码只保留两个模块：`src/data/releases.js` 读取和校验本地快照、提供下载路径，供 Astro 页面使用；`scripts/releases.js` 统一执行 sync、assets、check 三个阶段，处理私有 GitHub 数据、安装包和部署检查。页面数据模块不包含网络请求。
