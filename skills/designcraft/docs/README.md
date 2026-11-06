# Designcraft 文档

> 定位：面向 AI 的设计知识库，覆盖设计原则、设计语言、设计流程、颜色、排版、空间与形状、布局、表面与光影、动效、交互状态、数据 / 图形 / 内容、构图、评审与风格。
> 状态：0.9.x；版本与变更见 [CHANGELOG](../CHANGELOG.md)。

## 索引

| 文件 | 回答什么 |
| --- | --- |
| [foundations](./foundations.md) | 设计原则、设计语言、设计流程、评审与建议边界 |
| [color](./color.md) | 色彩空间、色族、中性 / 表面、语义色、深浅、偏色、配对、评审 |
| [typography](./typography.md) | 字号、场景阶梯、字重、行高、字距、角色、多语言、字体接入、行内图标 |
| [space-shape](./space-shape.md) | 间距、控件高度、密度、热区、圆角、边界、焦点 |
| [layout](./layout.md) | 页面结构、滚动归属、栅格、容器、断点、构图模式、响应式 |
| [depth](./depth.md) | 面（层级 / 填充 / 形态）、半透明、分块、遮罩、未知底、材质；两套光系统、五个光槽、投影三层、边界与深度 |
| [motion](./motion.md) | 时长、循环、延迟、曲线、角色、编排、反馈、减少动效 |
| [states](./states.md) | 交互态、数据态、异步态、状态组合、输入环境 |
| [data-graphics-content](./data-graphics-content.md) | 数据色、图标尺寸与使用场景、图形 / 插画、内容设计 |
| [composition](./composition.md) | 构图原则、场景对照、构图评审问题 |
| [review](./review.md) | 规范评审与设计批评、流程、证据、分级、边界 |
| [style](./style.md) | 风格 = 维度组合、系统原生风格、流行 recipe、警告与 style brief |

> 无障碍没有独立文档：内容分散在 `color.md`、`states.md`、`motion.md`、`space-shape.md`、`review.md`。

## 单一归属

一条规则只有一个主人。跨文档只引用，不复制正文。

| 主题 | 主人 |
|---|---|
| 原则、语言、流程、评审与建议边界 | `foundations.md` |
| 颜色值、对比目标、配对、深浅、偏色 | `color.md` |
| 字号、字重、行高、字距、角色、多语言 | `typography.md` |
| 间距、控件高度、密度、热区、圆角、边界、焦点 | `space-shape.md` |
| 页面结构、栅格、容器、断点、响应式 | `layout.md` |
| 面（层级 / 填充 / 形态）、半透明、分块、遮罩、未知底、材质 | `depth.md` |
| 两套光系统、五个光槽、投影三层、光源、深度 | `depth.md` |
| 时长、循环、延迟、曲线、编排、反馈、减少动效 | `motion.md` |
| 状态语义、状态组合、输入环境 | `states.md` |
| 数据色、图标尺寸与使用场景、图形 / 插画、内容设计 | `data-graphics-content.md` |
| 构图原则、场景对照 | `composition.md` |
| 评审流程、两条轨道、分级与边界 | `review.md` |
| 风格家族、风格 recipe、风格警告 | `style.md` |

## 维护

- 跨文档只引用，不复制正文；本目录是 Designcraft 的规则正文。
- 版本变更记录在 [CHANGELOG](../CHANGELOG.md)；历史查 commit。
- 数值、公式与档位表可以完整落地，如内圆角 = 外圆角 − 内衬、投影三层几何、面阶目标；不新增本目录没有的规则。
- **不写实现契约**：产品名、代码接口、内部字段、工具命令；这些由实现侧拥有。