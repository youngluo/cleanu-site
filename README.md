# cleanu-site

CleanU 官网，单页中文静态站点，源码在 `web/`（HTML + CSS + 原生 JS，无构建步骤）。

## 本地预览

```bash
python3 -m http.server 4173 --bind 127.0.0.1 --directory web
```

打开 http://127.0.0.1:4173/ 。

## 下载区的数据来源

`web/config.js` 里的 `release.owner` / `release.repo` 指向发布 DMG 的仓库（当前为 `youngluo/cleanu`，由它的 GitHub Actions 发布 Release）。页面运行时请求该仓库的 `releases/latest`：

- 取到 Release：显示真实 tag 与发布日期，并把两个架构按钮指向对应的 `.dmg` 附件（按文件名里的 `arm64` / `x86_64` 识别）。
- 取不到（仓库私有、还没有 Release、接口限流、离线）：版本位显示「最新 Release」，按钮回落到 Releases 页，并在下方说明原因。版本号不做硬编码。

所以 cleanu 那边发布新版本后，本站无需改动即会跟着更新。

## 主题

导航右侧的按钮在「跟随系统 → 亮色 → 暗色」之间循环，默认跟随系统。跟随系统时由 CSS 的 `prefers-color-scheme` 决定（不执行 JS 也成立）；手动选择写入 `localStorage` 的 `cleanu:theme-mode`，并在 `<head>` 的内联脚本里提前落到 `<html data-theme-mode>` 上，避免刷新时闪色。两套配色取值只在 `styles.css` 顶部定义一次（`--l-*` / `--d-*`），下面按模式重新映射。

## 文案边界

页面只描述已确认的产品事实（扫描只读、逐项确认后移入废纸篓、八类扫描范围、macOS 13+、双架构 DMG）。用户量、评分、媒体推荐、证言和「平均释放 X GB」这类效果数字一律不写。界面区块是 CSS 绘制的示意图，不是真实截图。

许可与授权相关内容已从站点移除，导航、首屏、常见问题、页脚都不再提许可证；仓库根目录的 `LICENSE` 只覆盖本站源码，与产品许可无关。
