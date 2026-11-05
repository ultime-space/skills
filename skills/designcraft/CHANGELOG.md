# Changelog

## 0.8.1

- 表面与光影：新增「一级面容器是可读性风险区」口径；半透明可用，按最坏背景验证合成对比度；底不可控时给底衬 / 遮罩 / 回退，不强制实色。
- 同步 `depth.md`、`color.md`、`style.md`、`scenarios/review-depth.md` 与 evals。
- 版本与文档索引同步到 0.8.x。

## 0.8.0

- `docs/motion.md`：补可打断与可重定向、来去路径、常用动效模式、曲线选择顺序。
- `evals/golden-tasks.md`：新增可打断、来去路径、曲线与常用模式三条任务。
- 同步设计规范的动效补充；版本与文档索引同步到 0.8.x。

## 0.7.0

- 新增 `docs/style.md`：风格 = 维度组合、身份 / 骨架维度、系统原生风格、流行 recipe、警告与 style brief。
- 新增 `scenarios/build-style.md` 与 `templates/style-brief.md`。
- 新增风格 evals：毛玻璃警告、风格不越界、风格 brief。
- 更新 `SKILL.md` 路由与 Style 模式、`docs/README.md` 索引与单一归属。
- 版本与测试同步到 0.7.0。

## 0.6.0

- 新增 `docs/data-graphics-content.md`：数据色、图标尺寸与使用场景、图形 / 插画、内容设计；图标只规范尺寸与场景，不绑定第三方图标库。
- 新增 `docs/composition.md`：构图原则、场景对照、构图评审问题。
- 新增 `docs/review.md`：规范评审与设计批评、流程、证据、分级、边界。
- 新增 `scenarios/review-content.md`、`review-critique.md`、`compose-page.md`、`compose-component.md`。
- 新增 `templates/design-spec.md`、`critique-report.md`。
- 更新 `SKILL.md` 路由与模式（Compose / Critique）、`docs/README.md` 索引、`evals/golden-tasks.md`。
- 版本与测试同步到 0.6.0。

## 0.5.0

- 新增 `docs/depth.md`：面阶、半透明、分块、遮罩、未知底、材质边界；方向光、阴影、环境遮蔽、边缘高光、明暗。
- 新增 `docs/motion.md`：时长、循环、延迟、曲线、角色、编排、反馈、减少动效。
- 新增 `docs/states.md`：交互态、数据态、异步态、状态组合、输入环境。
- 新增 `scenarios/review-depth.md`、`review-motion.md`、`review-states.md`。
- 更新 `SKILL.md` 路由、`docs/README.md` 索引与单一归属、`evals/golden-tasks.md`。
- 版本与测试同步到 0.5.0。

## 0.4.0

- 新增 `docs/foundations.md`：设计原则、设计语言、设计流程、评审与建议边界。
- 新增 `docs/space-shape.md`：间距、控件高度、密度、热区、圆角、边界、焦点。
- 新增 `docs/layout.md`：页面结构、滚动归属、栅格、容器、断点、构图模式、响应式。
- 重写 `docs/color.md` 与 `docs/typography.md`，对齐新结构，去掉实现术语与产品名。
- 新增 `scenarios/review-structure.md`；更新颜色 / 排版 / 品牌色 / 分级场景。
- 更新 `prompts/output.md`、`templates/review-report.md`、`evals/golden-tasks.md`。
- 测试新增：来源头、纯知识禁用词、文档路由；版本对齐到 0.4.0。
- 统一口径：只给设计知识、报告与建议，不做强制检查。

## 0.3.0

- `docs/color.md`：`on` 更名为 `foreground`，改为配对槽位；补 L 等距（`Δ ≤ 2–3`）、彩色实心面只作点缀、`ink` 不用于彩色实心面、颜色评审不阻断。
- `docs/typography.md`：补角色对比门槛（仅 `display` / `page` 走 3.0）。
- 同步源规范（§3 / §5）。

## 0.2.1

- 首次通过 GitHub Actions + Trusted Publishing 发布，验证 CI 发版链路；无功能变更。

## 0.2.0

- `docs/color.md`：按新颜色模型重写——对比度目标（7.2 / 6 / 5 / 2.0）、alpha 反解、配对前景、三条文字线、评审分级与边界、品牌色可达性。
- `docs/typography.md`：墨档引用 color.md；可机检项区分规范与项目自检。
- 补齐 skill 结构：`scenarios/`、`prompts/`、`templates/`、`evals/`、`tests/`、`scripts/`、`CONTRIBUTING.md`、`SECURITY.md`。
- 增加 `npm test` / `npm run release-check` / `prepublishOnly`，与 skills 仓库其它技能保持一致。

## 0.1.0

- 初始化 Designcraft：SKILL.md 薄路由 + 红线。
- `docs/typography.md`：9 档字号、场景阶梯、字重 / 行高 / 字距、9 个文字角色、评审口径。
- `docs/color.md`：三空间分工、色族派生、语义色矩阵、深浅配对、对比门槛、取色与搭配。
- 范围只含排版与颜色；空间、动效、表面待补。
