# Architecture Report（代码架构分析报告）

> 定位：把代码架构讲清楚，形成一份人能读、能评审、能执行的 Markdown 文档。
> 范围：只做代码架构；业务能力、角色、业务流程、领域规则不在本 skill 范围。
> 关系：方法见 `docs/frontend/06-architecture.md` 或 `docs/backend/11-architecture.md`；证据门槛见 `docs/shared/08-audit-contract.md`；模板见 `templates/architecture-report.md`。

## 何时用

- 接手老项目，需要一份能读的代码架构说明。
- 重构 / 迁移 / 拆包前，先固定现状与约束。
- 新项目立项，需要目标架构、边界与阶段计划。
- 向人 / 客户汇报代码架构（不含业务架构）。

不适用：业务能力地图、角色与流程、领域建模、UI 设计、运行时性能、渗透测试。

## 输入

- 仓库路径 / 分支 / 目录范围。
- 模式：老项目 `Audit`；新项目 `Plan`；只出报告 `Audit`。
- 目标：体检 / 重构 / 迁移 / 新建立 / 汇报。
- 约束：能否跑命令、时间范围、必须保留的边界。
- 已知业务背景（可选）：只作为上下文，不写成业务架构结论。

## 先读

1. 项目 `AGENTS.md` / `rules/`
2. `docs/shared/00-constitution.md`
3. 判定端，读对应架构方法：`docs/frontend/06-architecture.md` 或 `docs/backend/11-architecture.md`
4. 只读该端族卡：`docs/frontend/01-family-cards.md` 或 `docs/backend/10-family-cards.md`
5. 审计模式：`docs/shared/08-audit-contract.md` + `docs/frontend/09-audit.md` / `docs/backend/13-audit.md`
6. 输出：`prompts/output.md` + `templates/architecture-report.md`

## 步骤

1. **确认范围**：仓库 / 目录 / 包、只读声明、能否跑命令、本次不覆盖什么。
2. **盘点**：技术栈、入口、页面 / 路由、模块、包、请求层、状态、类型、生成物、测试与门禁。
3. **结构**（用表格 / 列表，不画图）：
   - 系统上下文：外部系统、运行时、部署单元。
   - 容器 / 模块：职责、边界、依赖方向。
   - 公共 API：哪些是契约，哪些是内部实现。
4. **关键链路**：请求链、状态链、错误模型、数据流、生成链；每段给 `file:line`。
5. **跑静态检查**：`codecraft check / audit`，记录 `files / findings / 覆盖范围`；前端写明 A17 / A21 盲区，后端写明事务 / 幂等 / 迁移未由 CLI 覆盖。
6. **逐条判定**：按该端判定矩阵（前端 `09` / 后端 `13`）标 `pass` / `pass（静态）` / `warn` / `fail` / `na`，每条带证据与局限。
7. **风险与技术债**：按 P0–P3 排；区分「已发生」与「可能发生」。
8. **演进计划**：
   - 老项目：现状 → 目标 → 分阶段迁移，每阶段可回滚、有验收命令。
   - 新项目：目标架构 → 边界 → 目录 / 契约 → 阶段计划。
9. **未知项**：没有证据的角色、规则、运行时行为单列，不猜。

## 输出

- 一份 Markdown 报告，按 `templates/architecture-report.md`。
- 默认不画图；用表格、列表、缩进表达结构。
- 如果后续需要图，图只作为视图，源仍写在 Markdown 里，不把图片当唯一真源。
- 报告落在项目 `docs/` 下；文件名建议 `<主题>-代码架构分析报告.md`，并纳入项目文档索引。

## 证据

- 每条结论给 `path/to/file:line`，或可复现命令。
- 计数写检索式与统计口径（行 / 处 / 文件）。
- `0 findings` 只能写「静态检查未命中」，不能写成「架构通过」。
- 不写密钥、客户名、本机绝对路径；发现即停止并提示轮换。

## 停止条件

- 无法只读访问仓库。
- 需要改动生产配置或运行服务才能判断。
- 发现凭证 / 隐私。
- 业务结论超出代码证据，必须由人确认。

## 验收

- 报告结构与模板一致，结论 / 证据 / 风险 / 计划 / 未知项齐全。
- 该端规则全覆盖或写 `na`；每条有证据。
- 明确写了「只做代码架构，不含业务架构」。
- Audit / Plan 模式未改任何文件。
- 计数与命令可复现。

## 与其他场景的区别

| 场景 | 侧重 | 产出 |
|---|---|---|
| `audit-existing.md` | 前端 A1–A21 体检 | findings、差距、升级计划 |
| `backend-audit.md` | 后端 A1–A21 解释 + 专项检查 | findings、差距、升级计划 |
| `new-project.md` | 新项目设计 | 目标架构、骨架、阶段计划 |
| `report-only.md` | 只要 findings | 只读问题清单 |
| 本场景 | 结构叙事 + 演进 | 一份完整代码架构分析报告 |

本场景可以复用 `audit-existing` 的 findings，但不重复做业务架构。
