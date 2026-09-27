# cleanu-site

CleanU 官网，单页中文静态站点。源码在 `web/`（HTML + CSS + 原生 JS，一个页面一个目录 `web/pages/<name>/`，目录名即产物名；共享层放 `web/` 根），用 Vite 构建到 `dist/`；构建只做三件事 —— 资源加内容哈希名、CSS/JS 压缩、共享模块提成一个 chunk，不引框架、不引第三方运行时依赖。发布物是 `dist/`，`web/` 不再直接对外。

## 本地预览

```bash
pnpm install
pnpm dev        # http://localhost:5173/
pnpm build      # 出 dist/
pnpm preview    # 起静态服务验产物
```

`dev` 的根目录是 `web/`，路由和 `dist` 同形 —— `/`、`/index.html`、`/changelog.html`（`vite.config.js` 里改写到 `pages/<name>/index.html`；页面引用都写根绝对路径，所以地址栏浅一层也不会解析错）。`build` 后的产物只剩根下的 `index.html` / `changelog.html` 和带哈希的 `assets/`。

Vite 绑的是 `localhost`，macOS 上它解析到 IPv6（`[::1]`），用 `curl http://127.0.0.1:5173` 探会连不上。

## 验产物

断言清单在 `AGENTS.md` 的「自检」。这里记量法与两个已知干扰：

- 断点尺寸用同源 iframe 载入产物再量（`scrollWidth` 与越界元素），量之前先 `fetch(url, {cache:'reload'})`，否则量到的是旧缓存。
- 后台标签页会冻结过渡与 WAAPI，插值中途的 computed 值不可信 —— 判行为要和改动前的同一页面对照，别只看单一读数。
- 状态码 200 不等于页面正常：页面用相对路径引用资源，引用解析错时文档本身仍返回 200，只有控制台和实际渲染会暴露。dev 下至少加载一次看有没有 404 与 `.is-active` 之类的运行态。

## 下载区的数据来源

`web/config.js` 里的 `release.owner` / `release.repo` 指向发布 DMG 的仓库（当前为 `youngluo/cleanu`，由它的 GitHub Actions 发布 Release）。页面运行时请求该仓库的 `releases/latest`：

- 取到 Release：显示真实 tag 与发布日期，并把两个架构按钮指向对应的 `.dmg` 附件（按文件名里的 `arm64` / `x86_64` 识别）。
- 取不到（仓库私有、还没有 Release、接口限流、离线）：版本位显示「最新 Release」，按钮回落到 Releases 页，并在下方说明原因。版本号不做硬编码。

所以 cleanu 那边发布新版本后，本站无需改动即会跟着更新。

## 截图与派生

预览区五张图的派生流程（页面上要写什么尺寸、`data-pan` 规则看 `AGENTS.md`）：

1. 原图进 `shots/`，按时间命名。`shots/` 已在 `.gitignore`（仓库里只有派生 WebP），别移进源码目录。
2. 统一裁剪框（以 5120×2880 原图为坐标）：`x 3072..5120`、`y 0..2116`。下边界由最高的面板决定，换分辨率要重量。量面板边界看「内部连续亮行」，别用行亮度落差 —— 下方天空同样亮，会误判。
3. `cwebp -q 72` 输出 2048×2116 到 `web/assets/`。构建只给它加哈希名，不改字节，所以发布包体积由这一步决定。

## 主题

导航右侧的按钮在「跟随系统 → 亮色 → 暗色」之间循环，默认跟随系统。跟随系统时由 CSS 的 `prefers-color-scheme` 决定（不执行 JS 也成立）；手动选择写入 `localStorage` 的 `cleanu:theme-mode`，并在 `<head>` 的内联脚本里提前落到 `<html data-theme-mode>` 上，避免刷新时闪色。两套配色取值只在 `styles.css` 顶部定义一次（`--l-*` / `--d-*`），下面按模式重新映射。

## 文案边界

页面只描述已确认的产品事实（扫描只读、逐项确认后移入废纸篓、八类扫描范围、macOS 13+、双架构 DMG）。用户量、评分、媒体推荐、证言和「平均释放 X GB」这类效果数字一律不写。预览区的五张是真实界面截图（`shots/` 原图经 `cwebp` 派生），不是画的示意图。

许可与授权相关内容已从站点移除，导航、首屏、常见问题、页脚都不再提许可证；仓库根目录的 `LICENSE` 只覆盖本站源码，与产品许可无关。
