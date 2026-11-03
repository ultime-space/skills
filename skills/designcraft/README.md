# Designcraft

面向设计系统的视觉规范 skill：排版、颜色与取档建议。让 AI 的视觉判断能引用判据，而不是凭感觉。

[![npm](https://img.shields.io/npm/v/@ultime/designcraft?label=%40ultime%2Fdesigncraft&color=black)](https://www.npmjs.com/package/@ultime/designcraft)
[![license](https://img.shields.io/badge/license-MIT-black)](./LICENSE)

---

## 快速开始

```bash
npx skills add ultime-space/skills --skill designcraft
```

装好后对 AI 说：

```text
用 Designcraft 检查这个页面的排版和配色，只读，不改文件。
```

> 带上 `Designcraft` 这个名字最稳；只启用 skill 而不点名时，agent 未必进入该模式。

---

## 常用场景怎么说

先说模式（Audit / Plan / Apply）、范围、声明底。下面可以直接复制。

**排版评审**

```text
用 Designcraft 评审这份排版，Audit 模式，只读。
范围：<页面 / 组件>；重点看字号是否落在 9 档、角色是否对齐、行高与字距是否合规。
```

**颜色评审**

```text
用 Designcraft 评审这组颜色配对，Audit 模式，只读。
背景：<画布 / 卡片 / soft / solid>；文字：<token 或色值>；给出目标、实测和分级。
```

**配置品牌色**

```text
用 Designcraft 按 scenarios/configure-brand-color.md 检查这个品牌色，Plan 模式。
要求：浅色白字、深色黑字，目标 4.5；给出两端可达值和调整建议。
```

**审计分级**

```text
用 Designcraft 按 scenarios/check-contrast-audit.md 说明这次审计的分级与边界，只读。
重点：哪些是 core 合同，哪些是项目自检，哪些是未知底。
```

更多场景见 [`scenarios/`](./scenarios/) 与 [`prompts/output.md`](./prompts/output.md)。

## 适用

- 设计稿 / 组件样式的排版与配色评审
- 品牌色在深浅两端的可达性检查
- 对比度目标、门槛、分级的对齐
- 设计 token 的取档与语义角色检查
- 给 AI 一个稳定的视觉判断入口

## 不适用

- 代码架构与代码分层：用 Codecraft
- 文档组织与真源治理：用 Docscraft
- 业务建模、纯视觉美化
- 品牌创作、插画、图标绘制

## 结构

```text
designcraft/
├── SKILL.md
├── docs/
│   ├── README.md
│   ├── typography.md
│   └── color.md
├── scenarios/
│   ├── review-typography.md
│   ├── review-color.md
│   ├── configure-brand-color.md
│   └── check-contrast-audit.md
├── prompts/output.md
├── templates/
│   ├── review-report.md
│   └── brand-color-check.md
├── evals/golden-tasks.md
├── tests/                 结构、版本对齐、相对链接、SKILL 路由、目标值与旧口径
├── scripts/               release-check（版本 / CHANGELOG / 打包文件）
├── package.json
├── VERSION
└── CHANGELOG.md
```

## 验证

```bash
npm test              # 结构、版本对齐、相对链接、SKILL 路由、目标值与旧口径
npm run release-check # 版本 / CHANGELOG / 打包文件
npm pack --dry-run    # 检查发布内容
```

## 三条底线

1. **判据可引用**：结论必须回到 `docs/` 的规则或可反解的约束；给不出就标「偏好」。
2. **目标先行**：对比度目标 / 档位是设计值，alpha 与色值是产物，不反过来用 alpha 定义档位。
3. **边界清晰**：core 合同只审 core / 语义表 / 配置器；上层项目靠文档与指南，不把页面问题算进 core 发版门槛。

## 参考与方法来源

Designcraft 是内部规范提炼，不复制外部正文。设计时对照过：

- WCAG 2.2：1.4.3 对比度（最低）、1.4.6 对比度（增强）、1.4.11 非文本对比
- Material Design 3：颜色与对比度实践
- APCA / WCAG 3 草案：仅作评估参考，不作当前门槛

## 版本

- `0.3.0`：`on` 更名为 `foreground`，补 L 等距与彩色实心面边界；排版补大字号门槛。
- `0.2.1`：首次通过 GitHub Actions + Trusted Publishing 发布，验证 CI 发版链路；无功能变更。
- `0.2.0`：颜色模型按新目标重写；补齐 skill 结构与 CI。
- `0.1.0`：初始化，覆盖排版与颜色两篇。
- 规范源是 Ultime 内部的 `docs/design-system/design.md`（不对外分发）；本 skill 是对外载体。源更新后按需同步，不要求逐条镜像。

## 许可

MIT
