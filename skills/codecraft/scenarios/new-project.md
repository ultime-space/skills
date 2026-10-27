# New Project（新项目）

## 何时用

从 0 设计架构、技术选型、目录与分阶段计划。

## 输入

- 业务目标 / 页面清单（前端）或服务边界 / 数据所有权（后端）
- 端（mp / app / web / admin / service）
- 团队规模 / 交付周期
- 已有技术栈约束

## 先读

1. 项目 `AGENTS.md` / `rules/`
2. `../docs/shared/00-constitution.md`
3. 判定端：`../docs/frontend/01-family-cards.md` 或 `../docs/backend/10-family-cards.md`（只读相关族）
4. 该端风格总图：`../docs/frontend/03-style-map.md` 或 `../docs/backend/12-style-map.md`
5. 该端架构方法：`../docs/frontend/06-architecture.md` 或 `../docs/backend/11-architecture.md`（档位 / 七步法 / 边界）；决策用 ADR
6. 需要选型时：`../docs/shared/05-patterns.md`

## 步骤

1. 盘点：页面、角色、数据、外部系统；后端补充数据所有权与调用方。
2. 选规模档位：L0 / L1 / L2。
3. 选环节：前端 Transport / Wrapper / Behavior / State / …；后端 Route / Service / Repository / DB / Job / Cache / Auth / …；标明必需 / 可选。
4. 定目录：前端 `apps/` + `packages/`（如果需要）；后端 `modules/` + `shared/`（实现自由）。
5. 定契约：类型来源、命名、门禁、迁移与幂等策略（后端）。
6. 出分阶段计划：每阶段一个可验收的垂直切片。

## 输出

- 架构图（文字）
- 目录树
- 环节清单
- 分阶段计划
- 风险与未定项

## 停止条件

- 业务目标不清
- 后端契约未知且无法假设
- 需要引入新的外部服务但无人确认

## 验收

- 每条规则引用 A-ID
- 计划可执行、可验收
- 不含敏感信息
