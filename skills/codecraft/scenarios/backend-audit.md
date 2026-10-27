# Backend Audit（后端服务审计）

## 何时用

接手 / 升级 / 重构 JS/TS 服务前的体检；也用于后端 PR 的增量评审。

## 输入

- 仓库路径 / 分支 / 目录范围
- 服务边界与调用方
- 数据存储（关系型 / 文档 / 缓存）与消息中间件
- 部署形态（单服务 / 模块化单体 / 多服务）
- 能否跑命令（迁移、集成测试）

## 先读

1. 项目 `AGENTS.md` / `rules/`
2. `docs/shared/00-constitution.md`
3. `docs/backend/10-family-cards.md`（只读相关族）
4. `docs/backend/11-architecture.md`（链路 / 依赖 / 事务 / 迁移）
5. `docs/shared/08-audit-contract.md` + `docs/backend/13-audit.md`
6. `prompts/output.md`

## 步骤

1. 确认范围：仓库 / 模块 / 接口、只读声明、能否跑迁移与集成测试。
2. 盘点：技术栈、模块、入口、Service、Repository、DB / 迁移、Job / Queue、Cache、Auth、Config、测试与门禁。
3. 跑静态检查：`codecraft check / audit`，记录 `files / findings / 覆盖范围`；写明 CLI 不覆盖事务 / 幂等 / 迁移。
4. 按 `backend/13-audit.md` 逐条判定：A1–A21 的后端解释，标 `pass` / `pass（静态）` / `warn` / `fail` / `na`。
5. 专项检查：事务边界、幂等、迁移兼容、N+1 / 索引、权限矩阵、配置与密钥、观测字段、队列重试。
6. 一致性检查：入口写业务、ORM entity 外泄、只有接口文档没有契约测试等要降级。
7. 出差距清单：影响、成本、优先级（P0–P3）。
8. 出升级计划：分阶段、可回滚、每阶段验收；不写时间估算。
9. 风险：数据迁移、权限变更、发布顺序、回滚。

## 输出

- 体检报告（按 `docs/shared/08-audit-contract.md`）
- 逐条判定表（A1–A21 的后端解释，含证据与局限）
- 专项检查表（事务 / 幂等 / 迁移 / N+1 / 权限 / 配置 / 观测）
- 差距清单（P0–P3）
- 升级计划与回滚方案

## 停止条件

- 无法只读访问
- 需要改动生产配置或执行破坏性迁移才能判断
- 发现密钥 / 隐私：停止并提示轮换

## 验收

- 只读；不改代码、不跑迁移
- 该端规则全覆盖或写明 `na`
- 每条结论有文件路径 / 命令 / A-ID
- 事务、幂等、迁移、权限至少各有一条证据
- `0 findings` 已注明「仅静态未命中」，没有写成通过
- 计数可用文中命令复现
