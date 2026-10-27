# 后端风格总图（一页）

> 2026-10-27 · v1
> 范围：JS/TS 后端；框架、运行时与数据库只作实现示例。
> 关系：族卡见 `docs/backend/10-family-cards.md`；方法与边界见 `docs/backend/11-architecture.md`。

## 1. 不变量

| 主题 | 不变量 |
|---|---|
| 入口 | Route / Controller 只解析、调用、映射响应；不写业务、不碰数据库 |
| 校验 | 所有外部输入经 Validation；类型从 schema 推导 |
| 用例 | 业务规则与事务在 Service；一个用例一个入口 |
| 数据 | Repository 不写业务；ORM entity 不出数据层；分页显式 |
| 演进 | 只通过迁移改 schema；expand / contract；可回滚 |
| 异步 | 至少一次投递，消费幂等；重试有上限，失败进死信 |
| 错误 | 业务错误是值；HTTP 映射集中；不泄漏内部信息 |
| 权限 | 认证与授权分开；权限判断单点；越权默认拒绝 |
| 配置 | 启动即校验；密钥只来自环境 / secret manager |

## 2. 目录示例（不是契约）

```text
src/
  modules/
    order/
      order.controller.ts
      order.service.ts
      order.repository.ts
      order.schema.ts
      order.types.ts
  shared/
    config.ts
    logger.ts
    db.ts
    errors.ts
  jobs/
  migrations/
  app.ts
```

- 模块按业务能力切；模块内聚，模块间只走入口。
- `shared/` 只放无业务的基础能力；不放跨模块业务。
- 文件数少时可以合并实现，但职责不合并。

## 3. 命名

- 入口：`listOrders` / `createOrder` / `cancelOrder`；类 `OrderController`。
- 校验：`createOrderSchema` → `CreateOrderInput`；不要 `Dto` 与 `Input` 并存。
- 用例：动词开头的 Service 方法；类 `OrderService`。
- 数据：`OrderRepository`；方法 `findById` / `findMany` / `save`。
- 迁移：`20261028_add_order_status`；一个迁移一个意图。
- 配置：`UPPER_SNAKE`；密钥名进 `.env.example` 时只写占位符。

## 4. 错误与响应

- 领域错误：稳定错误码 + 语义类型；Service 不抛字符串。
- HTTP：400 / 401 / 403 / 404 / 409 / 422 / 500 集中映射。
- 日志：结构化字段 + request id；不记录 token / 密码 / 个人敏感信息。

## 5. 反模式

- `common/` 变成跨模块业务桶。
- Controller 里开事务、写状态机、判角色。
- Service 返回 ORM entity 或直接拼 SQL。
- Repository 里判权限、做业务分支。
- 写接口无幂等，重试产生重复订单 / 重复通知。
- 迁移与删列同一发布；无回滚路径。
- 前端隐藏按钮当成授权；后端无越权用例。

## 6. 代价

- 分层带来文件数与跳转成本；小项目允许合并实现，但不能省掉职责。
- 幂等、迁移兼容、权限矩阵都增加前期工作量；换来的可回滚与可审计。
- 规则少而硬：能机检的进 lint / 单测 / 迁移检查，不能机检的写 owner 与复核方式。
