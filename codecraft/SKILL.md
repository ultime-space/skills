---
name: codecraft
description: 语言无关的代码规范（Codecraft）。用于项目代码审计与分析、架构设计、重构评审、代码规范检查和脚手架。Language-agnostic code standard for auditing, reviewing, designing, and scaffolding code.
---

# Codecraft（代码手艺）

## 先读

1. 项目 `AGENTS.md` / `rules/`
2. `docs/00-constitution.md`
3. 只读相关族卡：`docs/01-family-cards.md`
4. 设计架构时：`docs/06-architecture.md`
5. 需要选型时：`docs/05-patterns.md`
6. 选一个场景：`scenarios/`
7. 按 `docs/02-ai-contract.md` 执行
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
- 写敏感信息；发现即停止、脱敏、提示轮换。
- 安全红线登记例外。

规则正文只在 `docs/`；本文件只做入口。
