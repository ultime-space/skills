# Changelog

## 0.3.0

- `docs/color.md`：`on` 更名为 `foreground`，改为 `tone.{族}.solid.foreground` 配对槽位；补 L 等距（`Δ ≤ 2–3`）、彩色实心面只作点缀、`ink` 不用于彩色实心面、颜色审计不阻断。
- `docs/typography.md`：补角色对比门槛（仅 `display` / `page` 走 3.0）。
- 同步源文档：`docs/design-system/design.md`（§3 / §5）。

## 0.2.1

- 首次通过 GitHub Actions + Trusted Publishing 发布，验证 CI 发版链路；无功能变更。

## 0.2.0

- `docs/color.md`：按新颜色模型重写——对比度目标（7.2 / 6 / 5 / 2.0）、alpha 反解、`on` 独立配对维度、三条文字线、审计分级与 core 边界、品牌色可达性。
- `docs/typography.md`：墨档引用 color.md；可机检项区分 core 合同与项目自检。
- 补齐 skill 结构：`scenarios/`、`prompts/`、`templates/`、`evals/`、`tests/`、`scripts/`、`CONTRIBUTING.md`、`SECURITY.md`。
- 增加 `npm test` / `npm run release-check` / `prepublishOnly`，与 skills 仓库其它技能保持一致。

## 0.1.0

- 初始化 Designcraft：SKILL.md 薄路由 + 红线。
- `docs/typography.md`：9 档字号、场景阶梯、字重 / 行高 / 字距、9 个文字角色、评审口径。
- `docs/color.md`：三空间分工、色族派生、语义色矩阵（含 `on` 入矩阵）、深浅配对、对比门槛、取色与搭配。
- 范围只含排版与颜色；空间、动效、表面待补。
