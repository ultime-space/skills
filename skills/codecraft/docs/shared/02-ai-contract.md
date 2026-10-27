# AI 生成契约 v1

> 2026-10-27 · v1 稳定版。
> 用途：所有模型 / agent 生成或修改代码前先读；与《代码宪法 v1》《代码族卡 v1》配套。
> 范围：JS/TS 项目；前端与 JS/TS 后端分轨。示例原生优先（TS / Web API），框架只给 Vue 3 / React；后端用 `docs/backend/`，不套用 Page / Component 等前端族。
> 术语：English（中文）。

## 1. 先读

1. 项目覆盖：`AGENTS.md` / `rules/` / `README`
2. 《代码宪法 v1》
3. 判定端，只读对应族卡：`docs/frontend/01-family-cards.md` 或 `docs/backend/10-family-cards.md`
4. 设计或评审架构：`docs/frontend/06-architecture.md` 或 `docs/backend/11-architecture.md`（档位 / 七步法 / 边界）；决策用 ADR
5. 需要选型时：`docs/shared/05-patterns.md`（按力选，不按名字选）
6. 相关契约 / 类型 / 测试 / 示例

## 2. 禁止

- 禁止新增 token / 组件 / API 而没有真实消费方。
- 禁止新增运行时依赖而不说明体积与必要性。
- 禁止把业务逻辑放进 Transport（传输层）、Page（页面）或 Controller（入口）。
- 禁止把事务开在 Repository；事务边界在 Service。
- 禁止把前端族规则套到后端，或把后端族规则套到前端。
- 禁止制造第二份真源（手写会漂移的文档 / 类型 / 常量）。
- 禁止注释复述代码。
- 禁止手改生成物。
- 禁止空 catch / 静默失败；禁止错误归一吞掉底层原因（`errMsg` / `cause` / status 至少保留一个）。
- 禁止跨族复制而不登记母版与分叉点。
- 禁止复制项目门禁（如 typecheck / lint / test）；只通过 config 调用。
- 禁止在 Plan 模式改文件；只输出计划。
- 禁止把密码 / 密钥 / 令牌 / AK/SK / 连接串 / 客户隐私写进代码、文档、示例或提示词；发现即脱敏并提醒。
- 禁止外部文档引用内部文档 / 内部路径 / 内部主机名。
- 安全红线不可豁免；不得以例外登记绕过。

## 3. 文档安全

- 文档分级：`Public（公开）` / `Internal（内部）` / `Confidential（机密）`。
- 外部文档自包含；不出现内部链接、路径、主机名、系统名。
- 内部文档标 `Internal`；不进入交付目录。
- 生成示例值用占位符（`<TOKEN>` / `<PASSWORD>`），不得复制真实配置。
- 发现疑似密钥 / 隐私，停止生成、脱敏、提示轮换。
- 术语写法：AI 面向文档（`docs/` / `scenarios/` / `prompts/` / `templates/`）英文裸写；`README`、对外报告首次出现用 `English（中文）`；名字类（产品 / 文件 / 命令 / 语言 / 框架 / 标准名 / 代码标识）不附中文。术语表见 `docs/shared/glossary.md`，`tests/docs.test.mjs` 检查术语表与 README 首次出现。

## 4. 必须

- 说明改了哪些文件、为什么（引用 A1–A21）。
- 跑项目验证命令，报告命令与结果；不能跑要说明原因。
- Apply 前后跑项目门禁；Audit 先跑内置规则，再跑 config gates；不得跳过失败。
- 新增例外必须写理由 + 主人 + 到期。
- 注释只写意图 / 契约 / 边界 / 反例 / 警告。
- 状态用联合类型；switch / map 穷尽。

## 5. 输出格式

1. **改了什么**：文件列表
2. **为什么**：规则 ID（A1–A21）
3. **怎么验**：命令 + 结果
4. **风险 / 不确定**
5. **后续**：owner + 到期

Audit 报告还必须满足 `docs/shared/08-audit-contract.md` 与对应端的审计文件（`docs/frontend/09-audit.md` / `docs/backend/13-audit.md`）。

## 6. 审计证据门槛

- A1–A21 全覆盖；不适用写 `na`。
- 每条 `pass` 必须给文件行号或可复现命令；只有静态检查通过时写 `pass（静态）`。
- `0 findings` 只能写成「静态检查未命中」，不能写成规则通过；必须写明 A17 / A21 等覆盖盲区。
- 计数必须带检索式；不能复现的数字不写。
- 出结论前做一致性检查：A4 / A8 / A11 / A17 / A21 与证据矛盾时降级。
- 优先级按 P0–P3；计划每阶段可回滚、有验收。

## 7. Review Checklist（评审清单）

- [ ] 族形正确（Page / Behavior / Transport；JS/TS 后端跳过 Page / Component）
- [ ] 依赖向内
- [ ] 状态穷尽
- [ ] 错误可见
- [ ] 注释只消歧义
- [ ] 生成物未手改
- [ ] 例外已登记
- [ ] 无敏感信息 / 无内部路径外泄
- [ ] 验证命令通过
