---
name: designcraft
description: 面向设计系统的设计知识：原则、语言、流程、颜色、排版、空间与形状、布局、构图、结构方案、评审与风格。用于设计评审、取档建议、设计规格与结构方案；不写代码架构，不做业务建模。
---

# Designcraft

> 方向：设计系统知识。当前覆盖设计原则、设计语言、设计流程、颜色、排版、空间与形状、布局、表面与光影、动效、交互状态、数据 / 图形 / 内容、构图、结构方案、评审与风格。
> 定位：把视觉判断从「看起来差不多」变成「能引用判据、能算回去、能给出建议」；结构方案部分只给可选结构、代价与偏好，不给唯一答案。

## 范围

| 项 | 内容 |
|---|---|
| 覆盖 | 设计原则与语言、设计流程、颜色、排版、空间与形状、布局、表面与光影、动效、交互状态、数据 / 图形 / 内容、构图、结构方案、评审与风格 |
| 可复用 | 任意设计系统 / 组件库的设计评审、取档、对比度核对、页面结构、层级、状态、设计规格、结构方案与风格方案集 |
| 不适用 | 代码规范与代码架构（用 Codecraft）；文档组织（用 Docscraft）；业务建模 |
| 不在范围 | 品牌创作、插画、图标绘制；强制检查与阻断性结论；具体实现与工具命令；导航与信息架构、多步流程 |

## 目录

| 目录 | 放什么 |
|---|---|
| `docs/` | 面向 AI 的设计知识：基础、颜色、排版、空间与形状、布局、表面与光影、动效、状态、数据 / 图形 / 内容、构图、结构方案、评审、风格 |
| `scenarios/` | 各维度评审、内容评审、设计批评、页面 / 组件设计规格、风格构建、品牌色配置、评审分级、结构方案 |
| `prompts/` | 输出格式 |
| `templates/` | 评审报告、品牌色检查表、设计规格、批评报告、风格方案集、方案集 |
| `evals/` | 黄金任务 |

## 读法（按任务路由）

| 任务 | 先读 | 产出 |
|---|---|---|
| 设计任务的前置判断 / 流程 | `docs/foundations.md` | 设计决策与输出建议 |
| 排版评审 | `docs/typography.md` + `scenarios/review-typography.md` | 评审报告 |
| 颜色评审 / 对比度 | `docs/color.md` + `scenarios/review-color.md` | 评审报告 |
| 间距 / 尺寸 / 圆角 / 边界 | `docs/space-shape.md` + `scenarios/review-structure.md` | 评审报告 |
| 页面结构 / 栅格 / 响应式 | `docs/layout.md` + `scenarios/review-structure.md` | 评审报告 |
| 表面 / 层级 / 光影 | `docs/depth.md` + `scenarios/review-depth.md` | 评审报告 |
| 动效 / 反馈 | `docs/motion.md` + `scenarios/review-motion.md` | 评审报告 |
| 交互状态 | `docs/states.md` + `scenarios/review-states.md` | 评审报告 |
| 数据 / 图形 / 内容 | `docs/data-graphics-content.md` + `scenarios/review-content.md` | 评审报告 |
| 构图 / 场景 | `docs/composition.md` + `scenarios/review-critique.md` | 评审 / 批评报告 |
| 结构方案（已有页面换排法） | `docs/patterns.md` + `scenarios/refine.md` | 方案集 |
| 设计批评 | `docs/review.md` + `scenarios/review-critique.md` | 批评报告 |
| 页面设计规格 | `docs/composition.md` + `docs/layout.md` + `scenarios/compose-page.md` | 设计规格 |
| 组件设计规格 | `docs/space-shape.md` + `docs/states.md` + `scenarios/compose-component.md` | 设计规格 |
| 构建风格 | `docs/style.md` + `scenarios/build-style.md` | 风格方案集 |
| 配置品牌色 | `docs/color.md` + `scenarios/configure-brand-color.md` | 可达性结论 + 建议 |
| 审计分级 / 边界 | `docs/color.md` + `scenarios/check-contrast-audit.md` | 分级说明 |
| 知识库索引 | `docs/README.md` | 阅读顺序与单一归属 |
| 输出格式 | `prompts/output.md` | 报告 / 清单 / 规格 / 方案集 |

## 先读

1. 项目现状、平台、模式、密度与内容最坏情况。
2. `docs/foundations.md`，确认范围与判断方式。
3. 相关维度文档与 `scenarios/`。
4. 输出按 `prompts/output.md`；模板见 `templates/`。

## 模式

| 模式 | 读写 | 产物 |
|---|---|---|
| **Audit** | 只读 | 评审报告、批评报告、一致性检查 |
| **Plan** | 只读 | 设计规格、结构方案集、风格方案集、调整计划 |
| **Apply** | 可改文档或报告，需明确要求 | 改动后的文档；不改代码与设计值 |

Compose（设计规格）、Refine（结构方案）、Critique（设计批评）、Style（风格方案）不再作为模式名，它们是 Plan 或 Audit 下的场景，文件仍在 `scenarios/`。

本 skill 默认出报告；只有明确要求才落到文件。

## 工作流

1. 确认范围：模式 / 平台 / 场景 / 目标。
2. 找判据：先定位是原则、语言、颜色、排版、空间形状还是布局；结构方案场景的判据是方案库条目与五项代价，不是规范条款。
3. 换算：对比度换到 sRGB 相对亮度；透明 / 叠层先合成。
4. 给最近可行档；没有就标「偏好」或「需要项目自定义」。
5. 输出按 `prompts/output.md`，不写实现状态。

## 禁止

- 不发明档位 / 目标；只在既有档位里取最近档。
- 不把 alpha 当设计值；目标是值位，alpha 是产物。
- 不把未知底判成通过；图片 / 动态色标 `unverified`。
- 不在 Audit / Plan 改文件。
- 不写实现状态；不引用产品名、实现术语、工具命令。
- 不把建议写成强制检查；不下阻断性结论。
- 不新增知识库没有的规则；数值、公式与档位表要与正文一致，并随版本更新。

## 与其它 skill 的边界

- **Codecraft**：代码规范、架构与工程检查。
- **Docscraft**：文档分层、真源治理、ADR。
- **Designcraft**：设计知识、视觉评审、取档与设计规格。
