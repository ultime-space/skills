# 使用说明

> 适用：Designcraft 的模式、任务路由、提示词、输出与边界；第一次使用先读根 README。
> 状态：现行（2026-11-19）。
> 关系：根 README 见 [../README.md](../README.md)；路由见 [../SKILL.md](../SKILL.md)；场景见 [`../scenarios/`](../scenarios/)；输出格式见 [`../prompts/output.md`](../prompts/output.md)。

## 一、三种模式

| 模式 | 读写 | 适合 | 产出 |
|---|---|---|---|
| **Audit** | 只读 | 评审、诊断、查漏 | 评审报告、诊断单、问题清单 |
| **Plan** | 只读 | 设计方案、结构方案、风格方案 | 设计规格、方案集、调整计划 |
| **Apply** | 可改文档或报告，需明确要求 | 把结论写回文档 | 改动后的文档；不改代码与设计值 |

默认只出报告；没有明确要求不落文件。

## 二、任务路由

| 我要… | 先读 | 产出 |
|---|---|---|
| 评审颜色 / 对比度 | `docs/color.md` + `scenarios/review-color.md` | 评审报告 |
| 选配色方向 / 从情绪词到三轴 | `docs/color.md` | 方向、起点与收口检查 |
| 评审排版 / 字号角色 | `docs/typography.md` + `scenarios/review-typography.md` | 评审报告 |
| 评审间距 / 圆角 / 边界 | `docs/space-shape.md` + `scenarios/review-structure.md` | 评审报告 |
| 评审表面 / 光影 | `docs/depth.md` + `scenarios/review-depth.md` | 评审报告 |
| 评审动效 / 状态 | `docs/motion.md` / `docs/states.md` + 对应场景 | 评审报告 |
| 评审内容 / 数据图形 | `docs/data-graphics-content.md` + `scenarios/review-content.md` | 评审报告 |
| 诊断「不够高级」 | `docs/perceived-quality.md` + `scenarios/review-quality.md` | 诊断单 + 修改顺序 |
| 设计批评 / 排序 | `docs/review.md` + `scenarios/review-critique.md` | 批评报告 |
| 页面 / 组件设计规格 | `docs/composition.md` / `docs/layout.md` / `docs/space-shape.md` + `compose-*` | 设计规格 |
| 换结构方案 | `docs/patterns.md` + `scenarios/refine.md` | 方案集 |
| 构建风格 | `docs/style.md` + `scenarios/build-style.md` | 风格方案集 |
| 参考已有风格复刻 | `docs/style.md` + `scenarios/reproduce-style.md` | 特征、归因、缺口清单 |
| 配置品牌色 | `docs/color.md` + `scenarios/configure-brand-color.md` | 可达性结论 + 建议 |
| 修改任务前自检 | `SKILL.md`「修改任务入口」 | 必读维度与自检顺序 |
| 判断项目 / 页面先解决什么 | `docs/project-types.md` | 类型与角色倾向 |
| 光学对齐 | `docs/optical-alignment.md` | 对齐判断与修正建议 |

## 三、提示词

### 评审一个页面

```text
用 Designcraft 评审这个页面，Audit 模式，只读。
范围：<页面 / 组件>；平台：<移动 / 平板 / 桌面>；模式：<浅色 / 深色>。
重点：颜色、排版、间距、表面、状态；先给影响排序，再给最近可行档与代价。
```

### 出设计规格

```text
用 Designcraft 给这个页面出设计规格，Plan 模式。
内容：<字段 / 条目 / 最坏内容>；目标：<任务>；约束：<平台 / 品牌 / 性能>。
输出：结构、层级、间距、字号角色、表面与状态；不写代码。
```

### 参考复刻

```text
用 Designcraft 复刻这个参考风格，Plan 模式。
参考：<截图 / 页面 / 产品>；范围：<整页 / 局部 / 组件>；必须保留：<骨架 / 品牌资产>。
只提取维度关系，不照抄数值；给我差异归因与缺口清单。
```

### 诊断感知质量

```text
用 Designcraft 诊断这页为什么不够「高级」，Audit 模式，只读。
品类：<…>；价格带：<…>；品牌承诺：<…>；受众：<…>。
先给主信号，再给缺陷清单与修改顺序；不产出风格配方。
```

## 四、输出与边界

- 结论要能引用判据、档位或可反解的约束；给不出就标「偏好」。
- 不发明档位、角色或设计值；只从既有档位取最近可行档。
- 对比度先算目标与合成后的值；未知底标 `unverified`，不假装通过。
- 设计批评与规范评审分开写；分数不能推翻可访问性结论。
- 不把建议写成强制检查；本 skill 只给报告与建议。
- 不写实现契约、产品名、内部路径或工具命令。

## 五、常见问题

**要读全部文档吗？** 不用。先按任务路由读 2–3 篇，再按需扩展。

**结论和现有规范冲突怎么办？** 以规范为准，报告里写清冲突与代价；不要把偏好写成规范。

**可以改文件吗？** 只有 Apply 模式且明确要求时才改；默认只出报告。

**参考复刻要一模一样吗？** 不。看维度选择、交互逻辑与规范下限，不以逐值相等为通过条件。
