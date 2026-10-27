# 代码族卡 · 后端 v1（10 个环节 · JS/TS）

> 2026-10-27 · v1
> 用途：把《代码宪法 v1》落到后端代码族；前端族卡见 `docs/frontend/01-family-cards.md`。
> 范围：JS/TS 后端；默认 HTTP + 关系型数据库示例，不绑定运行时、框架、ORM 或部署形态。
> 形状原生优先：框架只作实现，族本身与框架无关。
> 术语：English（中文）。

## 0. 卡模板

每个代码族写清：**职责 / 形状 / 命名 / 契约 / 状态与错误 / 测试 / 正例 / 反例 / 验收**。

> 族是「角色 / 环节」，不是目录；项目没有这个职责时，这一族可以不存在。
> 同族可以落在不同目录：目录名只是默认示例，不是契约。

## 0.1 族地图

| 分组 | 族 |
|---|---|
| 入口 | Route / Controller |
| 边界 | Validation、Auth |
| 行为 | Service |
| 数据 | Repository、Database / Migration、Cache |
| 异步 | Job / Queue |
| 支撑 | Observability、Config |

> 路由组织属于实现自由：装饰器控制器、显式 router 表、文件路由都可以；Route 与 Controller 可以合并在一个 handler 文件。

## 1. Route / Controller（入口）

- **职责**：把 URL / method 映射到 handler；解析 path / query / body；调用 Service；把结果映射成响应；不写业务规则、不碰数据库。
- **形状**：`routes/` + `controllers/`，或 `modules/<domain>/<domain>.controller.ts`；也可合并为 `modules/<domain>/handler.ts`。框架装饰器只是实现。
- **命名**：资源名用复数；handler 用 `listXxx` / `getXxx` / `createXxx` / `updateXxx` / `removeXxx`；控制器 `XxxController`。
- **契约**：只接收 Validation 产出的已解析输入；输出 DTO / 状态码；业务错误交给统一 error mapper。
- **状态与错误**：400 参数错误、401 未认证、403 无权限、404 不存在、409 冲突；不吞异常、不把内部堆栈返回给调用方。
- **测试**：路由级 e2e（supertest / fetch）；错误映射表；鉴权 guard 覆盖。
- **正例**：`POST /orders` → `createOrder(input)` → `201 { id }`；异常由统一 mapper 转成 problem details。
- **反例**：controller 里写折扣 / 状态机；controller 直接 import repository 或 ORM；把 ORM entity 原样返回。
- **验收**：controller 不含业务分支；路由表与 handler 清单一致；所有入口都经过 Validation 与 Auth。

## 2. Validation（校验 / DTO）

- **职责**：边界输入的形状 / 格式 / 范围校验；类型从 schema 推导；不做业务判断。
- **形状**：`schemas/<domain>.ts` + DTO；zod / valibot / class-validator / pipe 都可以；与 OpenAPI 同源优先。
- **命名**：`XxxInput` / `XxxQuery` / `XxxParams`；schema `xxxSchema`；不要 `XxxDto` 与 `XxxInput` 并存两份。
- **契约**：输入未知形状，输出已解析的强类型；错误结构统一（字段 + 稳定错误码 + 可读消息）。
- **状态与错误**：字段级错误一次返回；国际化文案留在展示层或错误码映射。
- **测试**：schema 正反例、边界值、未知字段策略（strip / reject）。
- **正例**：`createOrderSchema` 同时产出 TS 类型与 OpenAPI 片段。
- **反例**：controller 手写 `if (!body.name)`；schema 与类型各维护一份；把「余额是否足够」写进 schema。
- **验收**：所有外部输入经 schema；类型由 schema 推导；错误格式统一且可机检。

## 3. Service（用例 / 领域服务）

- **职责**：业务规则与用例编排；事务边界；组合 Repository、Wrapper、Job、Cache；不碰 HTTP、不拼 SQL。
- **形状**：`modules/<domain>/<verb>.service.ts` 或 `services/<domain>.ts`；纯函数优先，依赖注入可选。
- **命名**：动词开头 `createOrder` / `cancelOrder` / `settleInvoice`；类 `XxxService`。
- **契约**：输入内部类型；输出领域结果 / `Result`；业务错误是值或 domain error；不返回 ORM entity。
- **状态与错误**：事务在此层开启与提交；写操作支持幂等键；跨服务失败要有补偿或明确不可回滚点。
- **测试**：领域单测 + Repository fake；事务与幂等用集成测试；关键分支覆盖。
- **正例**：`createOrder` 内完成库存扣减 + 订单写入 + 事件投递，事务边界清晰。
- **反例**：service 接收 `req` / `res`；service 里拼 SQL；controller 里开启事务；业务判断散落在 repository。
- **验收**：service 不 import HTTP / 框架请求对象；事务只在此层；业务错误不靠字符串判断。

## 4. Repository（数据访问）

- **职责**：数据读写与持久化模型映射；不写业务判断。
- **形状**：`modules/<domain>/repository.ts` 或 `repositories/<entity>.ts`；接口 + 实现，便于测试替换。
- **命名**：`findById` / `findMany` / `save` / `remove`；`XxxRepository`；查询对象 `XxxQuery`。
- **契约**：接收领域查询条件；返回领域对象；分页 / 排序显式；不泄漏 ORM 类型。
- **状态与错误**：唯一约束、外键冲突映射成领域错误；不吞数据库异常。
- **测试**：集成测试（testcontainers / 临时库）；热路径看查询计划与索引。
- **正例**：`findActiveByUser(userId, page)` 返回领域对象与 `PageInfo`。
- **反例**：ORM entity 直接给 controller；循环里查 N+1；分页默认全量。
- **验收**：repository 无业务 if；分页必填或显式上限；高频查询有索引依据。

## 5. Database / Migration（库表与迁移）

- **职责**：schema、索引、迁移与回滚；数据契约的版本管理。
- **形状**：`migrations/<timestamp>_<verb>_<object>.sql|ts` + schema 定义；只通过迁移改库。
- **命名**：`20261028_add_order_status`；一个迁移一个意图。
- **契约**：expand / contract 两步走；不删列、不改类型与代码同一发布；大表变更分批。
- **状态与错误**：迁移失败可回滚；数据修复脚本幂等；生产变更前有备份 / 快照。
- **测试**：空库 + 生产快照各跑一次；schema diff；回滚演练。
- **正例**：先加可空列 → 双写 → 回填 → 切读 → 删旧列。
- **反例**：代码与删列同一发布；迁移里写业务逻辑；手改生产库不回填。
- **验收**：迁移可重复执行；有回滚路径；索引与查询匹配。

## 6. Job / Queue（异步任务）

- **职责**：异步任务、重试、延迟、死信；把耗时 / 可失败工作移出请求链路。
- **形状**：`jobs/<name>.ts`；producer 与 consumer 分开；调度配置独立。
- **命名**：`sendXxx` / `processXxx` / `syncXxx`；任务名稳定，不随实现改名。
- **契约**：载荷可序列化、带版本；消费者幂等；重试次数 + 退避 + 死信队列明确。
- **状态与错误**：至少一次投递意味着必须幂等；失败可观测、可重放。
- **测试**：重复消费不产生二次副作用；重试 / 死信路径。
- **正例**：`processPaymentCallback` 用业务键去重，重复投递返回同一结果。
- **反例**：任务里发通知两次；无上限重试；把事务包在整个异步任务外。
- **验收**：重复消费安全；任务有超时、重试上限与 owner。

## 7. Cache（缓存）

- **职责**：读缓存、失效与隔离；缓存不是唯一真源。
- **形状**：`cache/<domain>.ts`；key 构造集中；客户端单例由 Config 注入。
- **命名**：`<app>:<domain>:<id>:<version>`；版本用于整体失效。
- **契约**：TTL 必填；失效策略明确（写后删 / 版本号 / 事件）；不缓存敏感数据。
- **状态与错误**：缓存故障降级到源；不因缓存失败阻断主流程。
- **测试**：命中、失效、降级、并发回源。
- **正例**：写订单后删 `order:<id>` 与列表版本键。
- **反例**：永久缓存；key 散落在业务代码；把权限结果缓存给所有用户。
- **验收**：key 可检索；每个缓存有失效触发点；无永久脏数据。

## 8. Auth（认证 / 授权）

- **职责**：认证（登录态 / token）与授权（策略）；权限判断单一真源。
- **形状**：middleware / guard 负责认证；policy / ability 负责授权；资源级检查在 service 或 policy。
- **命名**：`authenticate` / `authorize`；动作常量 `order:read` / `order:write`。
- **契约**：认证产出 principal；授权接收 principal + resource + action；业务层不散落角色字符串。
- **状态与错误**：401 与 403 区分；不泄漏资源是否存在；越权默认拒绝。
- **测试**：权限矩阵；越权用例；token 过期 / 刷新。
- **正例**：路由 guard 认证，service 调 `authorize(principal, 'order:write', order)`。
- **反例**：controller 里 `if (user.role === 'admin')`；只在前端隐藏按钮；越权返回 404 掩盖。
- **验收**：权限判断单点；所有入口有认证；无硬编码角色判断散落。

## 9. Observability（可观测）

- **职责**：结构化日志、指标、追踪、请求 id；让失败可定位。
- **形状**：logger / tracer 适配层；middleware 注入 request id；错误上报统一。
- **命名**：事件名稳定；字段用 `requestId` / `userId` / `durationMs` / `status`。
- **契约**：不记录密钥、token、个人敏感信息；错误带上下文与错误码。
- **状态与错误**：采样可配置；上报失败不影响主流程。
- **测试**：日志字段快照；关键路径 trace；错误上报烟测。
- **正例**：每个请求带 request id，错误日志可关联同一次调用链。
- **反例**：`console.log(body)` 打出密码；每个模块自建 logger 格式；错误只打 message。
- **验收**：请求可追踪；错误有 request id；日志无敏感字段。

## 10. Config（配置 / 密钥）

- **职责**：环境变量、运行时配置、密钥引用；启动时校验。
- **形状**：`config/` + schema；`.env.example` 只放占位符；密钥来自环境或 secret manager。
- **命名**：`UPPER_SNAKE`；配置对象按域分组（`db` / `auth` / `queue`）。
- **契约**：启动即校验；默认值显式；环境差异有记录；不把密钥写进仓库。
- **状态与错误**：缺失 / 非法配置立即失败；不静默用危险默认值。
- **测试**：config schema 单测；启动 smoke；密钥缺失用例。
- **正例**：`config.db.url` 从 env 读取，缺失时启动失败并给出变量名。
- **反例**：代码里回退到 `localhost` 生产默认；`.env` 入库；配置散落在各模块直接读 `process.env`。
- **验收**：无硬编码密钥；配置清单与示例一致；启动校验覆盖必填项。
