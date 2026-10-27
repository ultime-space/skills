# 后端架构设计方法 v1

> 2026-10-27 · v1
> 用途：JS/TS 后端的系统级与模块级结构决策；前端方法见 `docs/frontend/06-architecture.md`。
> 边界：只讨论代码架构与模块边界；业务建模、部署拓扑、容量规划不在本文。运行时差异不改变角色划分。
> 关系：规则见 `docs/shared/00-constitution.md`；族卡见 `docs/backend/10-family-cards.md`；审计见 `docs/backend/13-audit.md`。

## 1. 请求链路

```text
HTTP → Route → Validation → Controller → Service → Repository → DB
                                      ├→ Wrapper（外部 API）
                                      ├→ Job / Queue（异步）
                                      ├→ Cache
                                      └→ Auth / Policy
```

- 每一环只做自己的事：Route / Controller 不写业务，Validation 不做业务，Service 不碰 HTTP 与 SQL，Repository 不写业务。
- 链路可以合并实现（如 handler 文件），但**职责不能合并**。
- 跨环调用只走下一环，不反向 import；Controller 不直接调 Repository。

## 2. 依赖规则

- 依赖方向：入口 → 用例（Service）→ 领域 / 数据访问；领域不 import 框架请求对象与 ORM 类型。
- 模块之间只走 public API（模块入口），禁止深路径 import。
- 共享代码分层：`shared/` 只放无业务的基础能力（config / logger / db client / errors），不放跨模块业务。
- 第二个消费者出现再抽公共模块；不要预建「common」大桶。

## 3. 三条边界

| 边界 | 规则 |
|---|---|
| HTTP ↔ 领域 | 请求 / 响应 DTO 不进入 Service；ORM entity 不出 Repository |
| 外部 ↔ 内部 | 外部 API 的形状只经 Wrapper 转换；内部不 import 外部 SDK 类型 |
| 模块 ↔ 模块 | 只通过模块 public API；跨模块数据用显式契约，不共享表访问 |

- Validation 产出的是「已解析输入」，不是领域模型；领域模型由 Service 负责获得。
- 错误在边界归一：外部错误在 Wrapper，HTTP 错误在 Controller / error mapper，领域错误在 Service。

## 4. 事务与幂等

- 事务边界在 Service（用例）层；Repository 不自行提交。
- 一个用例一个事务；跨聚合的强一致需求先合并用例，不靠分布式事务硬凑。
- 写接口支持幂等键：唯一约束 + 结果落库；重复请求返回同一结果。
- 异步任务按「至少一次」设计，消费端必须幂等；重试有上限与退避，失败进死信。

## 5. 数据演进

- 只通过迁移改 schema；应用代码与迁移同仓同评审。
- 采用 expand / contract：先加、再双写 / 回填、后切读、最后删旧；任何一步都可回滚。
- 大表变更分批；删除与改类型必须在代码停止使用后的独立发布。
- 索引跟着查询走：高频查询必须有索引依据，避免全表与 N+1。

## 6. 错误与响应

- 业务错误用错误码 + 语义类型，不靠字符串匹配。
- HTTP 状态映射集中一处：400 / 401 / 403 / 404 / 409 / 422 / 500。
- 不把堆栈、SQL、内部路径返回给调用方；日志保留 request id。
- 未知错误统一 500，已知业务错误不降级成 500。

## 7. 模块化与部署

- 默认模块化单体：按业务能力切模块，模块内高内聚，模块间 public API。
- 只有在独立扩缩容、独立发布、团队边界清晰时才拆服务；拆之前先保证模块边界可独立验证。
- 不把框架当成架构层；框架只是入口实现。

### 7.1 运行时与框架

- 运行时不改变角色：角色由职责定义，不由运行时或框架定义；本 skill 不维护框架 / 运行时清单。
- 运行时与框架专属 API 只出现在 Config / Repository / Observability 的适配实现里，不进入 Service。
- 选型按长期维护、团队现状与退出路径；新运行时或框架要有明确收益与替换成本。
- 审计时记录运行时与版本，并检查差异项（模块系统、TS 执行、env、文件系统、HTTP、包管理、权限、原生模块、部署限制），见 `docs/backend/13-audit.md`。

## 8. 与前端共用

- A1–A21 是跨端不变量；后端按 `docs/backend/13-audit.md` 解释，不重复维护规则正文。
- 门禁契约、模式选型、输出格式、术语表共用 `docs/shared/`。
- 接口契约（OpenAPI / schema）是前后端共同真源；前端不复制后端类型，后端不按前端 UI 需要改领域模型。

## 9. 反模式

- Controller 里写业务规则与事务。
- Service 直接拼 SQL 或返回 ORM entity。
- Repository 里做权限判断与业务分支。
- 用「common / utils」承接跨模块业务。
- 迁移与代码同一发布删列 / 改类型。
- 写接口没有幂等设计，重试产生重复副作用。
- 权限判断散落在 controller / UI，前端隐藏按钮当成授权。

## 10. 评审清单

- [ ] 请求链路每环职责清晰，没有反向依赖
- [ ] 事务边界在 Service，Repository 不提交
- [ ] 写接口有幂等键或明确的去重依据
- [ ] 迁移向后兼容，有回滚路径
- [ ] 权限判断单点，越权默认拒绝
- [ ] 外部契约经 Wrapper，内部不 import 外部类型
- [ ] 高频查询有索引依据，分页显式
- [ ] 错误映射集中，未知错误不泄漏内部信息
