# Refactor / Review（重构 / 评审）

## 何时用

已有改动或准备改动，需要按规范评审 / 重构。

## 模式

Apply 或 Review（只评审）。

## 步骤

1. 读 diff / 目标文件。
2. 对照该端族卡与规则：前端 `docs/frontend/01-family-cards.md` + `09-audit.md`；后端 `docs/backend/10-family-cards.md` + `13-audit.md`。
3. 列问题：边界、状态、错误、命名、注释、生成物。
4. 出最小改动计划；能不改就不改。
5. Apply：执行 + 跑门禁；Review：只出意见。
6. 输出五段式。

## 输出

- 问题清单
- 最小改动
- 验证命令与结果
- 风险 / 回滚

## 停止条件

- 需要跨族大改但无测试
- 需要改生成物
- 需要引入新依赖但未确认
