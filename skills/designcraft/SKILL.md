---
name: designcraft
description: 面向设计系统的视觉规范（Designcraft）。用于颜色、排版、空间、动效与表面的设计评审、取档建议和规范落地检查；不写代码架构，不做业务建模。Design system visual standards for color, typography, space, motion and surface.
---

# Designcraft

> 方向：设计系统与视觉规范。当前覆盖排版与颜色；空间、动效、表面待补。
> 定位：把视觉判断从「看起来差不多」变成「能引用判据、能算回去」。

## 范围

| 项 | 内容 |
|---|---|
| 覆盖 | 字号与场景阶梯、字重、行高、字距、文字角色；色彩空间、色族派生、对比合同、深浅配对、取色与搭配 |
| 可复用 | 任意设计系统 / 组件库的视觉评审、取档、对比度核对 |
| 不适用 | 代码规范与代码架构（用 Codecraft）；业务建模；纯视觉美化 |
| 不在范围 | 品牌创作、插画、图标绘制；上层项目的页面级审计 |

## 目录

| 目录 | 放什么 |
|---|---|
| `docs/` | 面向 AI 的规范提炼：排版、颜色、索引 |
| `scenarios/` | 排版评审、颜色评审、品牌色配置、审计分级 |
| `prompts/` | 输出格式 |
| `templates/` | 评审报告、品牌色检查表 |
| `evals/` | 黄金任务 |

## 读法（按任务路由）

| 任务 | 先读 | 产出 |
|---|---|---|
| 排版评审 | `docs/typography.md` + `scenarios/review-typography.md` | 评审报告 |
| 颜色评审 / 对比度 | `docs/color.md` + `scenarios/review-color.md` | 评审报告 |
| 配置品牌色 | `docs/color.md` + `scenarios/configure-brand-color.md` | 可达性结论 + 建议 |
| 审计分级 / 边界 | `docs/color.md` + `scenarios/check-contrast-audit.md` | 分级说明 |
| 规范来源与同步 | `docs/README.md` | 同步结论 |
| 输出格式 | `prompts/output.md` | 报告 / 清单 |

## 先读

1. 项目 seed / 主题 / tokens
2. `docs/typography.md` 或 `docs/color.md`
3. 相关 `scenarios/`
4. 输出按 `prompts/output.md`；模板见 `templates/`

## 模式

- **Audit**：只读评审，不改文件。
- **Plan**：给取档 / 调整方案，不改文件。
- **Apply**：只改文档或报告，不改代码与 token。

## 工作流

1. 确认范围：模式 / 平台 / 声明底 / 目标。
2. 找判据：先定位是排版、颜色还是配对。
3. 换算：对比度换到 sRGB 相对亮度；透明 / 叠层先合成。
4. 给最近可行档；没有就标「偏好」或「需要上层覆盖」。
5. 输出按 `prompts/output.md`，不写实现状态。

## 禁止

- 不发明档位 / 目标；只在既有档位里取最近档。
- 不把 alpha 当设计值；目标是值位，alpha 是产物。
- 不把未知底判成通过；图片 / 动态色标 `unverified`。
- 不在 Audit / Plan 改文件。
- 不写实现状态；以项目 roadmap 为准。
- 不复制源正文；提炼只做删减与压缩。

## 与其它 skill 的边界

- **Codecraft**：代码规范、架构、门禁。
- **Docscraft**：文档分层、真源治理、ADR。
- **Designcraft**：视觉规范、设计评审、取档与对比度。
