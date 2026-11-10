# Designcraft

面向设计系统的设计知识 skill：原则、语言、流程、颜色、排版、空间与形状、布局、表面与光影、动效、交互状态、数据 / 图形 / 内容、构图、结构方案、评审与风格。让 AI 的判断能引用判据、能算回去，而不是凭感觉。

[![npm](https://img.shields.io/npm/v/@ultime/designcraft?label=%40ultime%2Fdesigncraft&color=black)](https://www.npmjs.com/package/@ultime/designcraft)
[![license](https://img.shields.io/badge/license-MIT-black)](./LICENSE)

---

## 快速开始

```bash
npx skills add ultime-space/skills --skill designcraft
```

装好后对 AI 说：

```text
用 Designcraft 检查这个页面的排版、配色和间距，只读，不改文件。
```

> 带上 `Designcraft` 这个名字最稳；只启用 skill 而不点名时，agent 未必进入该模式。

---

## 常用场景怎么说

先说模式（Audit / Plan / Compose / Refine / Style / Apply）、范围、声明底。下面可以直接复制。

**排版评审**

```text
用 Designcraft 评审这份排版，Audit 模式，只读。
范围：<页面 / 组件>；重点看字号是否落在 9 档、角色是否对齐、行高与字距是否合规。
```

**颜色评审**

```text
用 Designcraft 评审这组颜色配对，Audit 模式，只读。
背景：<画布 / 抬升面 / 浮层面 / 凹陷面 / soft / solid>；文字：<颜色值>；给出目标、实测和分级。
```

**结构评审**

```text
用 Designcraft 评审这个页面的间距、控件高度、密度、热区、圆角和边界，Audit 模式，只读。
范围：<移动 / 平板 / 桌面>；重点看是否落在档位、compact 是否兜底热区、是否只有一个滚动容器。
```

**配置品牌色**

```text
用 Designcraft 按 scenarios/configure-brand-color.md 检查这个品牌色，Plan 模式。
要求：浅色白字、深色黑字，目标 4.5；给出两端可达值和调整建议。
```

**评审分级**

```text
用 Designcraft 按 scenarios/check-contrast-audit.md 说明这次评审的分级与边界，只读。
重点：哪些是可评审项，哪些是项目自检，哪些是未知底。
```

**结构方案（Refine）**

```text
用 Designcraft 按 scenarios/refine.md 给这一页 2–3 套结构方案，Refine 模式。
内容固定：<字段与条目数量>；现状：单列列表，用户说太平、没重点；范围：只改排列与密度，不改顺序。
```

更多场景见 [`scenarios/`](./scenarios/) 与 [`prompts/output.md`](./prompts/output.md)。

## 适用

- 设计稿 / 组件样式的颜色、排版、间距、尺寸、圆角与边界评审
- 品牌色在深浅两端的可达性检查
- 对比度目标、门槛、分级的对齐
- 设计值的取档与语义角色检查
- 页面结构、滚动归属、栅格与响应式的设计建议
- 已有页面的结构方案：同一份内容换成哪几种排法、各付什么代价
- 给 AI 一个稳定的设计判断入口

## 不适用

- 代码架构与代码分层：用 Codecraft
- 文档组织与真源治理：用 Docscraft
- 业务建模、纯视觉美化
- 品牌创作、插画、图标绘制
- 强制检查与阻断性结论：本 skill 只给报告与建议

## 结构

```text
designcraft/
├── SKILL.md
├── docs/
│   ├── README.md
│   ├── foundations.md
│   ├── color.md
│   ├── typography.md
│   ├── space-shape.md
│   ├── layout.md
│   ├── depth.md
│   ├── motion.md
│   ├── states.md
│   ├── data-graphics-content.md
│   ├── composition.md
│   ├── patterns.md
│   ├── review.md
│   └── style.md
├── scenarios/
│   ├── review-typography.md
│   ├── review-color.md
│   ├── review-structure.md
│   ├── review-depth.md
│   ├── review-motion.md
│   ├── review-states.md
│   ├── review-content.md
│   ├── review-critique.md
│   ├── compose-page.md
│   ├── compose-component.md
│   ├── build-style.md
│   ├── configure-brand-color.md
│   ├── check-contrast-audit.md
│   └── refine.md
├── prompts/output.md
├── templates/
│   ├── review-report.md
│   ├── brand-color-check.md
│   ├── design-spec.md
│   ├── critique-report.md
│   ├── style-brief.md
│   └── option-set.md
├── evals/golden-tasks.md
├── tests/                 结构、版本对齐、相对链接、SKILL 路由、适用范围头、纯知识检查
├── scripts/               release-check（版本 / CHANGELOG / 打包文件）
├── package.json
├── VERSION
└── CHANGELOG.md
```

## 验证

```bash
npm test              # 结构、版本对齐、相对链接、SKILL 路由、适用范围头、纯知识检查
npm run release-check # 版本 / CHANGELOG / 打包清单 + 发布内容扫描
npm pack --dry-run    # 查看实际打包文件
```

`release-check` 会读取 npm 的实际打包清单，逐文件扫描内部仓库路径、内部包名、本地绝对路径与敏感文件；规则在 `scripts/check-package-content.mjs`，需要例外时在 `ALLOW` 里写明理由，不用注释绕过。

## 四条底线

1. **判据可引用**：结论必须回到 `docs/` 的规则或可反解的约束；给不出就标「偏好」。
2. **目标先行**：对比度目标 / 档位是设计值，alpha 与色值是产物，不反过来用 alpha 定义档位。
3. **边界清晰**：只给设计知识、报告与建议；不做强制检查，不替使用者做决定。
4. **方案不是规则**：结构方案只报代价与偏好开关，不写成规范条款，也不给唯一答案。

## 参考与方法来源

Designcraft 是面向 AI 的设计知识，不复制外部正文。设计时对照过：

- WCAG 2.2：1.4.3 对比度（最低）、1.4.6 对比度（增强）、1.4.11 非文本对比
- Material Design 3：颜色与对比度实践、列表与卡片、典型布局
- 政府服务与电商后台的公开设计体系：表格、摘要列表、资源列表、空态与错误汇总的结构条件
- APCA / WCAG 3 草案：仅作评估参考，不作当前门槛

方案库只取结构与适用条件，不复制文案、截图或视觉资产；站点文案的许可未逐项核实，因此不转述原文。

## 版本

- `0.10.0`：新增结构方案库、Refine 模式、方案集模板与对应 evals；方案库按内容关系与四项代价组织，是经验而非规则。
- `0.9.2`：新增发布内容检查，按实际打包清单扫描内部路径、内部包名、本地绝对路径与敏感文件。
- `0.9.1`：状态叠墨改为目标反解，语义色四状态，`pressed` 统一；P9 / P12 对齐；画布对称带补 1.26；动效角色表改档号；排版补 `small` / `row` 说明。
- `0.9.0`：面改为层级 + 填充 + 形态；光影改为全局光 / 环境光两套系统与五个光槽；受光边跟方位角、方向高光必须有环境底；投影改为三层结构；扁平补组合轴与反例。
- `0.8.1`：表面补一级面容器可读性风险口径；半透明可用，按最坏背景验证合成对比度，不强制实色。
- `0.8.0`：动效补充可打断、来去路径、常用动效模式与曲线选择；补对应 evals；版本与文档索引同步到 0.8.x。
- `0.7.0`：新增风格体系、风格构建场景与风格 brief；新增风格 evals；版本与文档索引同步到 0.7.x。
- `0.6.0`：新增数据 / 图形 / 内容、构图、评审；新增页面 / 组件设计规格与设计批评场景、模板；版本与文档索引同步到 0.6.x。
- `0.5.0`：新增表面与光影、动效与反馈、交互状态；补对应场景与 evals；版本与文档索引同步到 0.5.x。
- `0.4.0`：新增设计原则 / 语言 / 流程、空间与形状、布局；重写颜色与排版；统一为纯设计知识，去除产品名、实现术语、工具命令与强制检查表述。
- `0.3.0`：`on` 更名为 `foreground`，补 L 等距与彩色实心面边界；排版补大字号门槛。
- `0.2.1`：首次通过 GitHub Actions + Trusted Publishing 发布，验证 CI 发版链路；无功能变更。
- `0.2.0`：颜色模型按新目标重写；补齐 skill 结构与 CI。
- `0.1.0`：初始化，覆盖排版与颜色两篇。

## 许可

MIT
