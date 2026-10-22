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

官网基于 Astro 静态构建，提供首页、更新日志、隐私政策、支持、购买条款与购买回跳页的中英文版本。

```bash
pnpm install
pnpm dev        # http://localhost:4321/
pnpm test       # 运行项目检查
pnpm build      # 生成 dist/
pnpm preview    # 本地预览构建产物
```

## 购买配置

购买默认关闭，下载与已售用户的 Dodo 校验不依赖此开关。官网始终使用 Dodo 生产结账，不提供环境切换。公开配置来自 `src/data/purchase-config.json`，非空环境变量用于填写正式商品信息。配置与真实链路验收完成前，不将 `PURCHASE_ENABLED` 设为 `true`。

| 变量 | 内容 |
| --- | --- |
| PURCHASE_ENABLED | 默认 false，开放时为 true |
| DODO_PRODUCT_ID | 与 App 一致的真实公开商品 ID |
| DODO_PAYMENT_LINK | Dodo 正式商品的 HTTPS Payment Link |
| SITE_URL | 正式公开 HTTPS 地址，可含部署子路径 |

购买支持邮箱只在 Dodo 后台配置，网站与 App 仓库不保存该邮箱。其余公开配置由网站在构建时读取；商户 API key 只用于可信管理连接，不能进入网站、App 或仓库。Test Mode 仅用于 App 本地开发；官网拒绝测试结账主机，源码不保留测试商品默认值。支持、回跳和条款页直接链接 Dodo 官方客户门户及联系页，未收到购买邮件也能继续求助。

先发布并下载验收支持授权的 App，再使用完整 Publish 开放购买。App 兼容性与购买到激活的验收结果记录在仓库文档中。流程保留 Release 同步、测试、Astro 构建、DMG 恢复、静态页面检查和 appcast 校验。执行 `pnpm site:check` 可检查构建后的十二页、内部链接与双语回跳响应头。关闭购买也使用相同 Publish 流程，保留下载、领取指引与支持；开关不撤销许可证。
