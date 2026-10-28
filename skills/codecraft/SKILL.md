---
name: codecraft
description: 面向 JS/TS 的代码规范与代码架构设计（Codecraft）。前端与 JS/TS 后端分轨：共享 A1–A21 与门禁，前端读 frontend 族卡，后端读 backend 族卡；用于审计、架构分析、架构设计、重构评审、规范检查与脚手架。不含业务架构。Code standard and code architecture for JS/TS projects, with separate frontend and backend tracks.
---

# Codecraft

> 方向：JS/TS。前端与 JS/TS 后端各有一条轨；共享宪法、门禁、模式与输出契约，族卡与架构分端读取；其它语言不在范围。

## 范围

| 项 | 内容 |
|---|---|
| 覆盖 | JS/TS 前端与 JS/TS 后端；页面、组件、行为、状态、传输、类型、入口、用例、数据访问、迁移、异步、权限、配置、密码与凭据安全、登录与会话、文件存储与上传 |
| 代码架构 | 系统 / 容器 / 模块 / 组件边界、依赖方向、关键链路、生成物、演进 |
| 共享 | A1–A21、门禁契约、模式选型、审计口径、术语 |
| 分端 | 前端：Page / Component / Behavior / State / Transport / Wrapper / Type …；后端：Route / Controller / Validation / Service / Repository / DB / Job / Cache / Auth … |
| 不适用 | 业务架构、角色 / 流程 / 领域建模、产品需求拆解 |
| 不在范围 | Java / Go / Python 等其它语言；云资源与部署拓扑 |

> 示例顺序：原生 → Vue 3 / React；其它框架不预建，先在 `docs/frontend/01-family-cards.md` §12 登记。

## 目录

| 目录 | 放什么 |
|---|---|
| `docs/shared/` | 宪法、AI 契约、审计契约、门禁、模式、提示词、术语、安全基线、身份与授权、文件存储 |
| `docs/frontend/` | 前端族卡、风格总图、架构 |
| `docs/backend/` | 后端族卡、风格总图、架构、后端审计判定 |

## 读法（按任务路由）

先判定端：只读该端的族卡与架构，不要两端一起加载。

| 任务 | 先读 | 产出 |
|---|---|---|
| 前端审计 / 评审 | 宪法 + `docs/frontend/01-family-cards.md` + `docs/frontend/09-audit.md` + `scenarios/audit-existing.md` + `templates/audit-report.md` | 报告（只读） |
| 后端审计 / 评审 | 宪法 + `docs/backend/10-family-cards.md` + `docs/backend/13-audit.md` + `scenarios/backend-audit.md` + `templates/audit-report.md` | 报告（只读） |
| 前端架构分析 / 设计 | `docs/frontend/06-architecture.md` + 宪法 | 报告 / 计划（只读） |
| 后端架构分析 / 设计 | `docs/backend/11-architecture.md` + 宪法 | 报告 / 计划（只读） |
| 新项目 / 脚手架 | 对应端架构 + `scenarios/new-project.md` + `templates/architecture-design.md` | 设计报告；必要时 `init` |
| 选型（模式 / 库） | `docs/shared/05-patterns.md` | 选型与代价 |
| 安全 / 密码学评审 | `docs/shared/09-security.md` + 宪法 | 建议与告警清单 |
| 身份 / 会话 / 授权评审 | `docs/shared/10-auth.md` + 宪法 | 方案建议与差距清单 |
| 文件存储 / 上传评审 | `docs/shared/11-storage.md` | 方案建议与差距清单 |
| 专项评估报告（安全 / 身份 / 存储） | `templates/specialist-report.md` + 对应 `docs/shared/09-security.md` / `docs/shared/10-auth.md` / `docs/shared/11-storage.md` | 报告（只读） |
| 门禁配置 / 契约 | `docs/shared/04-gates.md` | 两层门禁与 Gate Contract |
| 风格 / 模式速查 | `docs/frontend/03-style-map.md` / `docs/backend/12-style-map.md` | 速查表 |
| 改代码 | 宪法 + 对应端族卡 + 项目门禁 | 变更 + 验证 |

## 先读

1. 项目 `AGENTS.md` / `rules/`
2. `docs/shared/00-constitution.md`
3. 判定端，只读对应族卡：`docs/frontend/01-family-cards.md` 或 `docs/backend/10-family-cards.md`
4. 设计架构时：`docs/frontend/06-architecture.md` 或 `docs/backend/11-architecture.md`
5. 需要选型时：`docs/shared/05-patterns.md`
6. 涉及密码、传输、密钥、令牌时：`docs/shared/09-security.md`
7. 涉及登录、会话、权限时：`docs/shared/10-auth.md`
8. 涉及文件存储、上传、下载时：`docs/shared/11-storage.md`
9. 选一个场景：`scenarios/`
10. 按 `docs/shared/02-ai-contract.md` 执行；审计还必须读 `docs/shared/08-audit-contract.md` + 对应端审计文件（`frontend/09` / `backend/13`）
11. 按 `prompts/output.md` 输出
12. 不知道怎么说时：`docs/shared/07-ai-prompts.md`
13. 术语写法：`docs/shared/glossary.md`（AI 文档英文裸写；`README` / 对外报告首次出现标注中文；名字类不附中文）

## 模式

- **Audit**：只读，出报告。
- **Plan**：只读，出架构 / 升级计划。
- **Apply**：改代码 + 跑门禁。

## 工作流

1. 判定任务属于哪个场景、哪一端。
2. 只读该端相关族卡，不要一次加载全部。
3. 先出计划；Apply 前确认范围。
4. 跑项目验证命令；不能跑要说明原因。
5. 按 `prompts/output.md` 输出。

## 禁止

- Audit / Plan 模式改文件。
- 把业务架构 / 业务流程 / 领域规则写进代码架构报告；这些不在本 skill 范围。
- 把前端族规则套到后端，或把后端族规则套到前端。
- 把业务逻辑放进 Transport / Page / Controller；把事务放进 Repository。
- 内部代码 import `external/` 或生成类型。
- 手改生成物。
- 写敏感信息；发现即停止、脱敏、提示轮换。
- 用可逆加密 / MD5 / SHA-1 存密码；关闭 TLS 证书校验。
- 把前端隐藏按钮或路由守卫当授权。
- 把存储密钥写进前端；把用户文件名直接拼进存储路径。
- 安全红线登记例外。

规则正文只在 `docs/`；本文件只做入口。
