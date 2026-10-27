---
name: codecraft
description: 面向 JS/TS 的代码规范与架构设计（Codecraft）。默认 Web 前端，Node 后端可复用结构规则；用于审计、架构设计、重构评审、规范检查与脚手架。Code standard and architecture design for JS/TS projects (frontend-first; structural rules reusable for Node backends).
---

# Codecraft（代码手艺）

> 方向：JS/TS。默认场景是 Web 前端；示例原生优先（TS / 原生 Web API），框架只给 Vue 3 / React；Node 后端只复用结构规则；其它语言不在范围。

## 范围

| 项 | 内容 |
|---|---|
| 覆盖 | JS/TS 项目；页面、组件、行为、状态、传输、类型、包、脚本、测试 |
| 可复用 | Node 后端：模块边界、依赖方向、内外分离、生成物、门禁与文档规则 |
| 不适用 | 前端专属族（Page / Component）；后端数据库、缓存、并发、事务等专项规范 |
| 不在范围 | Java / Go / Python 等其它语言；后端专项另立体系，本 skill 不承诺覆盖 |

> 示例顺序：原生 → Vue 3 / React；其它框架不预建，先在 `docs/01-family-cards.md` §12 登记。

## 读法（按任务路由）

| 任务 | 先读 | 产出 |
|---|---|---|
| 审计 / 评审现有代码 | 宪法 + `docs/08-audit-contract.md` + 相关族卡 | 报告（只读） |
| 设计架构 / 拆边界 | `docs/06-architecture.md` + 宪法 | 计划 / ADR（只读） |
| 新项目 / 脚手架 | `06` + `scenarios/new-project.md` | 骨架计划；必要时 `init` |
| 选型（模式 / 库） | `docs/05-patterns.md` | 选型与代价 |
| 改代码 | 宪法 + 相关族卡 + 项目门禁 | 变更 + 验证 |

## 先读

1. 项目 `AGENTS.md` / `rules/`
2. `docs/00-constitution.md`
3. 设计架构时：`docs/06-architecture.md`
4. 只读相关族卡：`docs/01-family-cards.md`（前端项目才读 Page / Component）
5. 需要选型时：`docs/05-patterns.md`
6. 选一个场景：`scenarios/`
7. 按 `docs/02-ai-contract.md` 执行；审计还必须读 `docs/08-audit-contract.md`
8. 按 `prompts/output.md` 输出
9. 不知道怎么说时：`docs/07-ai-prompts.md`

## 模式

- **Audit（审计）**：只读，出报告。
- **Plan（计划）**：只读，出架构 / 升级计划。
- **Apply（执行）**：改代码 + 跑门禁。

## 工作流

1. 判定任务属于哪个场景。
2. 只读相关族卡，不要一次加载全部。
3. 先出计划；Apply 前确认范围。
4. 跑项目验证命令；不能跑要说明原因。
5. 按 `prompts/output.md` 输出。

## 禁止

- Audit / Plan 模式改文件。
- 把业务逻辑放进 Transport 或 Page。
- 内部代码 import `external/` 或生成类型。
- 手改生成物。
- 把前端族规则套到 Node 后端（Page / Component / UI 不适用）。
- 写敏感信息；发现即停止、脱敏、提示轮换。
- 安全红线登记例外。

规则正文只在 `docs/`；本文件只做入口。
