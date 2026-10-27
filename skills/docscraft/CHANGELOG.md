# Changelog

## 0.1.2 - 2026-10-27

- 统一术语写法：AI 面向文档英文裸写，`README` / 对外报告首次出现标注中文；新增 `docs/07-glossary.md` 与 `tests/terms.test.mjs`；README / SKILL 的名字去掉中文别名。

## 0.1.1 - 2026-10-27

- 验证 npm Trusted Publishing 发布链路；无内容变更。

## 0.1.0 - 2026-10-27

- 初始版本：文档分层、文档类型、AI 上下文、漂移检查、规则治理、ADR。
- 提供 audit / reorganize / write-adr / review-rules 四个场景。
- 提供 AGENTS / rules / ADR 模板与 golden tasks。
- 入口示例统一使用通用 `.agents/rules/`，不绑定单一 agent。
- 新增 npm 包元数据（`@ultime/docscraft`）、结构测试与 CI / 发布流水线。
