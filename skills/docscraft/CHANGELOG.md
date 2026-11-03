# Changelog

## 0.4.0 - 2026-11-04

- `docs/contracts/00-ai-context.md`：补 Agent Skills 标准与预算（frontmatter 必填 / 可选字段、目录约定、三级渐进披露、`skills-ref validate`）与「AGENTS.md vs SKILL.md」选择判据。
- `docs/rules/01-layers.md`：新增「包级文档模型」——每包 README / DESIGN / AGENTS / rules / llms.txt / skills.md / agent.md 的职责、版本戳与指针规则；「新增端 / 包」步骤同步补 AI 三件套。

## 0.3.1 - 2026-11-03

- 文档编号修复：`docs/` 拆子目录时沿用的平铺时代全局序号改为**目录内连续编号**——rules 00–04（05-rule-types→03、06-doc-safety→04）、contracts 00–01（03-ai-context→00、08-checklist→01）、guides 00–01（04-drift-guards→00、06-adr→01）；SKILL / README / prompts / 正文互链与结构测试同步更新。历史 CHANGELOG 条目保留旧路径不改写。
- 打包补齐：`files` 增 `CONTRIBUTING.md` / `SECURITY.md`；新增根级发布配套与两份包内文件（贡献流程 / 漏洞与密钥报告）。
- `author` 统一为 `Ultime contributors`（与 LICENSE 版权行一致）。
- README 结构树补 `scripts/`（release-check），结尾补「贡献与安全」节。

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
