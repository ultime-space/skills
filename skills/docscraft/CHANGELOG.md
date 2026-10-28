# Changelog

## 0.3.0 - 2026-10-28

- 新增 `docs/rules/06-doc-safety.md`：文档分级、隐私与个人信息、凭据与内部信息、第三方引用、版权与许可、发现后的处置、检查方式与反模式。
- `docs/contracts/08-checklist.md` 新增 D13「安全与引用」，判定范围改为 D1–D13，补一致性检查、机检映射与自检项；结构测试数量同步。
- `SKILL.md` 路由、覆盖与禁止项接入；`prompts/output.md` 补引用格式与隐私规则；`00-principles.md` §9 增加指针；README 同步。

## 0.2.1 - 2026-10-28

- `SKILL.md` 路由补 `docs/rules/02-doc-types.md`（文档类型速查）。
- 新增 docs 路由覆盖测试与 `release-check` 脚本（接入 `prepublishOnly`）。

## 0.2.0 - 2026-10-27

- 新增 `docs/contracts/08-checklist.md`：D1–D12 判定矩阵、判定口径、一致性检查、机检映射、交付前自检与计划表。
- `docs/` 拆分为 `rules/`、`contracts/`、`guides/`；术语表移到 `docs/glossary.md`，`SKILL.md` 路由与 README 同步。
- 新增结构测试：校验清单覆盖 `04-drift-guards.md` 的全部漂移类型，且 ID 唯一。

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
