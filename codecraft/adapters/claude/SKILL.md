---
name: codecraft
description: 面向 JS/TS 的代码规范与架构设计（Codecraft）。默认 Web 前端，Node 后端可复用结构规则；用于审计、架构设计、重构评审、规范检查与脚手架。
---

# Codecraft（代码手艺）

> 方向：JS/TS（默认前端）。后端只复用结构规则；Page / Component 等前端族不套用到后端。

## 先读

1. 项目 `AGENTS.md` / `rules/`
2. `../../docs/00-constitution.md`
3. 只读相关族卡：`../../docs/01-family-cards.md`
4. 设计架构时：`../../docs/06-architecture.md`
5. 需要选型时：`../../docs/05-patterns.md`
6. 选场景：`../../scenarios/`

## 模式

- **Audit（审计）**：只读，出报告。
- **Plan（计划）**：只读，出架构 / 升级计划。
- **Apply（执行）**：改代码 + 跑门禁。

## 工作流

1. 判定任务属于哪个场景。
2. 只读相关族卡，不要一次加载全部。
3. 先出计划；Apply 前确认范围。
4. 跑项目验证命令；不能跑要说明原因。
5. 按 `../../prompts/output.md` 输出。

## 禁止

- Audit / Plan 模式改文件。
- 把业务逻辑放进 Transport 或 Page。
- 内部代码 import `external/` 或生成类型。
- 手改生成物。
- 写敏感信息；发现即停止、脱敏、提示轮换。
- 安全红线登记例外。

规则正文只在 `docs/`；本文件只做入口。
