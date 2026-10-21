# 购买接入验收记录

更新至 2026-10-20。购买保持关闭，此记录不是正式开放购买的验收凭据。

## 本地验证

- Node 项目测试 25 项通过，包含测试与正式结账主机隔离、双语根路径及子路径链接、正式开放门禁、回跳恶意参数及响应头。
- 根路径和 https://youngluo.github.io/cleanu-site/ 子路径分别构建十二页，通过内部引用、双语回跳 HTML 元信息及 Cloudflare `_headers` 检查；最终恢复根路径预览产物。
- 默认关闭可构建下载站点；公开开启要求 live、真实标识、兼容已发布 App 与验收记录，当前 test 配置不能开启。
- 中英文首页保留 $9 一次性购买、永久更新、30 天完整试用与两台 Mac，移除离线验证条目和后台频率。七天使用限制集中在购买条款；隐私页仅披露定期联网和数据处理，日期更新为 2026-10-20。条款继续保留适用法律及支付平台要求的例外。
- App 已移除联系支持与复制支持编号入口，官网支持文案改为提供购买邮箱、必要订单信息与问题描述，不再指向已删除的 App 入口。本轮 Node 25 项测试、十二页根路径构建与静态检查通过。
- 支持页和回跳页不再生成直接邮件链接，统一提示通过 Dodo 购买邮件中的支持入口联系；两种语言的条款页均能到达支持页。
- 模拟脚本覆盖成功、处理中、失败、取消、未知及无脚本中立指引；清理 query、fragment 与 history state，不把邮箱、订单或许可证写入生成文案、链接和存储。
- Publish 保留原有发布同步、测试、Astro 构建、DMG 恢复、appcast 校验和部署，新增静态页面检查，没有添加另一条发布通路。

本机 pnpm 自动依赖检查受网络限制，验证使用现有 Node 和 Astro 7.3.8 执行同一套命令，并设 ASTRO_TELEMETRY_DISABLED=1 避免写入系统偏好目录；未修改锁文件或下载替代依赖。

## Dodo Test Mode 与浏览器

- 维护者明确确认 Test Mode 并授权测试收件地址后，创建真实一次性商品 pdt_0Nq80GcubxvdvSSD9Yh3S，关联自动 License Key entitlement ent_0Nq80Cxpfq5pnkW55poss，限制两实例、无到期日。测试收件地址不写入公开配置或文档。
- 实际 Payment Link 由 Dodo API 返回，主机为 https://test.checkout.dodopayments.com；公开 JSON 已保存真实测试标识及链接。test 配置只用于测试，购买开关仍关闭。
- 管理 MCP 创建仅用于开发验收的 Checkout Session cks_0Nq81yXgTO1VUHbe7yi2X；网站本身不创建 Session，也不持有商户 key。
- Chrome 实际结账显示 Test Mode、USD $9、数量一份和 License Key。使用官方模拟成功卡后，支付 pay_0Nq82GkwVORkUJYrINOH4 为 succeeded；未真实扣款。
- 自动权益 grant 为 Delivered，订单与许可证邮件均为提供方 delivered，维护者确认收到。现代 entitlement 已自动发码，不再启用旧商品发码开关。
- 实际回到本机 /purchase/complete/，地址栏已清除查询参数；中文页面说明“支付服务返回成功提示，本页未独立核实订单”，提供邮件激活及 Dodo 订单邮件支持指引。
- 同一测试许可证经 API 验证两实例、第三实例 422、释放重激活和禁用/恢复。相同名称会创建不同实例。合成测试实例已释放；随后原生 App activate 201、validate 200，后台本机实例有效，占用 1/2 个名额。这些记录不代表两台物理 Mac 或所有恢复路径已验收。

- 本轮新增回归确认首页和隐私资源不含后台频率或离线天数，购买条款仍披露七天限制；根路径与子路径静态构建检查通过。本轮浏览器预览工具返回 native pipe path unavailable，未将静态检查当作新增视觉验收。

## 待完成

- 原生 App 首次激活和校验已通过；本机取消、真实响应丢失恢复及完整使用链路仍待完成。
- 窄屏、键盘、主题、减动效、无脚本及英文回跳的完整浏览器视觉验收。当前实际验证仅覆盖中文成功回跳，其余模拟与静态检查不替代人工验收。
- Dodo 默认品牌支持邮箱的 API 更新返回 403 / Primary brand cannot be updated via this API endpoint，需通过商户后台配置；未为绕过限制新增品牌。
- 正式商户和商品、正式 Payment Link、税费、最终条款与源码许可说明，以及授权兼容 App 发布和下载验收。暂不填写正式 minimumAppVersion 或 acceptanceReference。
- 关闭新购买后的静态构建与指引已通过；支持恢复仍需实际原生 App 演练。未执行部署、真实扣款、提交代码或归档 change。

tasks 当前 14/19；4.2 的测试购买、收件与原生 App 激活已完成，完整联调与正式发布仍保留未完成。
