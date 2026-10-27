---
name: docscraft
description: 面向 JS/TS 仓库的文档组织与 AI 上下文治理（Docscraft）。用于审计文档分层、整理 README / AGENTS / rules / docs、写 ADR、检查文档漂移与规则过期；不写代码架构。Documentation organization and AI context governance for JS/TS repositories.
---

# Docscraft（文档手艺）

> 方向：JS/TS 仓库，默认前端 / Node；文档分层与规则治理不绑定框架，其它技术栈可复用结构与判据。
> 定位：让文档成为可维护的真源，而不是 AI 的第二次猜测。

## 范围

| 项 | 内容 |
|---|---|
| 覆盖 | README、AGENTS、rules、docs、ADR、CHANGELOG、索引与链接、规则治理、AI 上下文入口 |
| 可复用 | 任意仓库的文档分层、单一真源、事实 / 约束 / 判断分类、文档漂移检查 |
| 不适用 | 代码架构规范（用 Codecraft）；业务组件 / API 设计；纯写作润色 |
| 不在范围 | 客户名、本机路径、个人协作偏好；这些留在本地记忆或项目私有文档 |

## 读法（按任务路由）

| 任务 | 先读 | 产出 |
|---|---|---|
| 审计现有文档 | `docs/00-principles.md` + `docs/01-layers.md` + `scenarios/audit-docs.md` | 只读报告 |
| 重整文档结构 | `docs/01-layers.md` + `scenarios/reorganize-docs.md` | 迁移计划；确认后执行 |
| 写 ADR / 决策记录 | `docs/06-adr.md` + `scenarios/write-adr.md` | ADR |
| 治理规则 / 红线 | `docs/05-rule-types.md` + `scenarios/review-rules.md` | 规则清单 / 到期表 |
| 检查 AI 入口 | `docs/03-ai-context.md` | 入口修订建议 |
| 防漂移 | `docs/04-drift-guards.md` | 检查清单 / CI 建议 |

## 先读

1. 项目 `README.md`、`AGENTS.md`、各端 `rules/`
2. `docs/00-principles.md`
3. 按任务读 `docs/01`–`06`
4. 相关 `scenarios/`
5. 项目现有 `docs/` 与 ADR
6. 输出按 `prompts/output.md`

## 模式

- **Audit（审计）**：只读；找重复真源、入口缺失、规则过期、链接与事实漂移。
- **Plan（计划）**：只读；给迁移 / 合并 / 拆分方案与回滚点。
- **Apply（执行）**：改文档；每次只动一个主题，改完跑检查。

## 工作流

1. 确认范围：仓库 / 目录 / 读者（人 / agent / 维护者）。
2. 画出现有文档地图：入口、正文、决策、生成物、索引。
3. 找第二真源与过期规则；按事实 / 约束 / 判断分类。
4. 出最小改动计划：先修入口与错误事实，再合并重复正文。
5. Apply 时同步更新入口、正文、链接与索引。
6. 跑验证：链接、生成物比对、规则到期、示例可执行。
7. 报告改了什么、为什么、怎么验、风险。

## 禁止

- 不复制上游文档正文；用 canonical link + 本地差异。
- 不把 `.agents/rules/` 当正文；它只做入口索引。
- 不在 README 与 rules 各写一份同一规则。
- 不把判断型规则写成硬门禁；没有 owner 与复核日期就不算稳定规则。
- 不写度量快照；写查询命令。
- 不把客户名、本机路径、内部工具路径写进公开文档。
- 不让 AI 单独定稿判断型规则；只给选项与代价。
- 不在 Audit / Plan 模式改文件。

## 与 Codecraft 的边界

- Codecraft：代码分层、依赖方向、状态与错误处理、代码门禁。
- Docscraft：文档分层、入口、真源、规则治理、ADR、文档漂移。
- 两者可互相引用，但不复制对方正文。
