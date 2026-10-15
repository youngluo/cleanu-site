<div align="center">
  <img src="public/assets/icon.webp" width="128" height="128" alt="CleanU">
  <h1>CleanU</h1>
  <p>安全、透明的 macOS 菜单栏清理工具。</p>
  <p>简体中文&nbsp;&nbsp;|&nbsp;&nbsp;<a href="README.md">English</a></p>
</div>

CleanU 是一款安全、透明的 macOS 菜单栏清理工具，支持 macOS 13+、Apple Silicon 与 Intel。

- 扫描缓存、临时文件、开发工具缓存、项目产物、应用残留、安装包、压缩包和大文件。
- 按缓存清理、项目清理、应用残留和空间分析分组，展示完整路径和实际体积。
- 扫描只读，勾选确认后清理，执行前再次校验。普通文件移入废纸篓，Time Machine 快照按系统方式精简，全程以当前用户权限运行。

## 本地开发

官网基于 Astro 静态构建，提供首页、更新日志、隐私政策和支持页的中英文版本。

```bash
pnpm install
pnpm dev        # http://localhost:4321/
pnpm test       # 运行项目检查
pnpm build      # 生成 dist/
pnpm preview    # 本地预览构建产物
```
