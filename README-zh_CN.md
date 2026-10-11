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

Astro 使用默认的根级 `src/` 和 `public/` 目录。页面入口位于 `src/pages/`，英文入口放在 `src/pages/en/`，简体中文默认路由不带语言前缀。共享页面组件和布局位于 `src/components/`、`src/layouts/`。文本统一放在 `src/locales/{zh-CN,en}.json`，脚本放在 `src/scripts/`，样式放在 `src/styles/`，静态资源放在 `public/`。Astro 原生 i18n helper 生成语言链接，构建会校验语言键和插值参数，并按目录路由写入 `dist/`。

普通本地构建可不设置 `SITE_URL`，此时不输出 SEO 语言关联。验证正式元信息时，设置包含部署子路径的真实 HTTPS 地址，例如 `SITE_URL=https://你的公开域名/站点路径/ pnpm build`。发布工作流读取仓库变量 `SITE_URL`，并用 `REQUIRE_SITE_URL=true` 拒绝缺失或无效配置。

运行 `pnpm test` 检查翻译契约、公开站点地址校验以及页面/资源路径映射。截图仍为实际中文界面，GitHub Release 内容保留原文；语言关联不会改变站内导航。
