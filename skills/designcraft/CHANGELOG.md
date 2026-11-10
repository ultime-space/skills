# Changelog

## 0.10.0

- 新增 `docs/patterns.md`：结构方案库。先按内容关系（单条 / 同构集合 / 比较集合 / 主辅 / 序列 / 录入 / 异构聚合）定可选上限，再按目标与最坏内容选变体，代价只记可比较性、一屏信息量、定位成本与最坏内容风险。
- 收录结构方案：详情页分层、长内容披露位置、同构集合单元形态与密度、集合分组、表格与卡片列表的取舍、多列数据窄屏退法、主辅并置与退法、序列结构、表单标签位置与栏数、异构卡片聚合。
- 收录状态姿态：空态三语义、表单错误两处呈现、加载姿态；状态语义仍由 `docs/states.md` 拥有，本文件只讲摆放。
- 新增 `scenarios/refine.md`：Refine 模式。已有页面只调结构、排列、主次与密度，出 2–3 套方案；A 排列级默认开放，B 结构级需同意。
- 新增 `templates/option-set.md` 与 `prompts/output.md` 的「方案集」格式。
- `SKILL.md`：模式表新增 Refine，路由表新增结构方案一行；`docs/README.md` 补索引与归属，并注明方案库是经验而非规则。
- 新增 evals：同构集合方案、详情页与长文案、仪表盘密度、方案集边界。
- 结构测试新增 `docs/patterns.md`、`scenarios/refine.md`、`templates/option-set.md` 必需文件与「每条方案保留五个字段」检查。
- 新增 P14「条件块与互斥结构」、P15「长文本的容器分配」；P3 补整除与「图先于名」；P10 补按用途分组。
- 代价由四项扩为五项，新增**一致性**：页内混用两种形态是代价，跨页槽位漂移是违背约定。
- 新增「页面族约定」：管理端与移动端的新增、条目操作、筛选、提交、危险操作各固定一个槽位；Refine 只检查与提示，不改全站。
- `templates/option-set.md` 与 `prompts/output.md` 同步五项代价与约定检查；evals 新增页面族约定、同页混用、只有设计稿三条。
- 新增 P16「整幅内容的放置」：不可拆块走集中段 / 带尾单次 / 横向序列，不参与网格；同屏数量随视觉重量下降。
- Refine 输入补「证据来源」：设计稿、实现或两者，不一致以实现为准；设计稿若是实现镜像只取视觉意图与比例。
- 明确空态、加载、错误态与最坏内容不会随输入自带，必须显式问或标注为假设；evals 新增设计稿与实现不一致、整幅块两条。
- 风格输出改为方案集：2–3 套方向，每套写意图、维度、用意、优点、代价与不适合；给对比与推荐，保留选择权；`docs/style.md`、模板与 evals 同步。
- 页面族约定降为参考，不再作为默认约束；Refine 只提示差异，由使用者决定。
- 方案集新增可选的「风格取向」：只写取向与取舍，不写具体颜色与字体值。

## 0.9.2

- 新增发布内容检查 `scripts/check-package-content.mjs`：读取 `npm pack` 实际清单，扫描内部仓库路径、内部包名、本地绝对路径与敏感文件；`release-check` 与 `prepublishOnly` 同步执行。
- README / CONTRIBUTING 补检查说明与例外写法。

## 0.9.1

- `docs/color.md`：状态叠墨改为目标 1.08 / 1.12 / 1.03 + alpha 反解；语义色改为四个状态；`active` 统一为 `pressed`；补 focus 不计入 fill 状态。
- `docs/foundations.md`：P9 / P12 名称与定义已对齐，并注明设计语境投影。
- `docs/depth.md`：画布对称带改为 1.15–1.26；补混合场景的层叠与焦点回归规则。
- `docs/motion.md`：角色表改用档号，避免与「禁止字面量」冲突。
- `docs/typography.md`：补 `small` 原生锚点说明与 `row` 仅单行限制。
- `docs/README.md`：索引简化为「文件 / 回答什么」，补无障碍映射与维护说明。

## 0.9.0

- `docs/depth.md`：面改为「层级 + 填充 + 形态」，补平面 / 凸起 / 凹陷与「平面无高光」；光影改为全局光 / 环境光两套系统与五个光槽；受光边跟方位角、方向高光必须有环境底、光色只有主光与环境两个来源；投影改为三层结构（接触线 / 半影 / 远场）。
- `docs/style.md`：扁平补「填充 × 边界」组合轴与常见反例；轻拟物补形态与按压口径。
- `docs/states.md`：按压补形态变化只能靠光影，杜绝用布局属性做状态反馈。
- 状态约束从「几何恒定」改为「占位恒定」：规范只保留原则，幅度、越界、热区、清晰度与减少动效的判断落在本指南。
- 占位恒定补「大幅形变」条目：推荐小幅反馈，反例是改变形状过大。
- `docs/README.md`：明确知识边界与版本策略：数值、公式与档位表可完整落地，不新增规则；变更在版本边界上体现。
- `docs/depth.md`：恢复面阶目标与投影三层几何的具体数值。
- 新增 evals：平面误加高光、方向高光缺环境底。
- 术语清扫：docs / scenarios / templates 中的 CSS 属性名改为中文设计语言，并加结构测试防回潮。
- 同步 `scenarios/review-depth.md`、`scenarios/compose-page.md` 与 evals。
- 版本与文档索引同步到 0.9.x。

## 0.8.1

- 表面与光影：新增「一级面容器是可读性风险区」口径；半透明可用，按最坏背景验证合成对比度；底不可控时给底衬 / 遮罩 / 回退，不强制实色。
- 同步 `depth.md`、`color.md`、`style.md`、`scenarios/review-depth.md` 与 evals。
- 版本与文档索引同步到 0.8.x。

## 0.8.0

- `docs/motion.md`：补可打断与可重定向、来去路径、常用动效模式、曲线选择顺序。
- `evals/golden-tasks.md`：新增可打断、来去路径、曲线与常用模式三条任务。
- 动效补充同步到文档与场景；版本与文档索引同步到 0.8.x。

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
- 测试新增：适用范围头、纯知识禁用词、文档路由；版本对齐到 0.4.0。
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
