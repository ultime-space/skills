# Skills

面向 AI 编程的 skill 集合。每个 skill 自包含：规则、适配器、CLI 与版本都在各自目录内，可独立安装、独立升级。

[![npm](https://img.shields.io/npm/v/@ultime/codecraft?label=%40ultime%2Fcodecraft&color=black)](https://www.npmjs.com/package/@ultime/codecraft)
[![node](https://img.shields.io/node/v/@ultime/codecraft?label=node)](https://www.npmjs.com/package/@ultime/codecraft)
[![license](https://img.shields.io/badge/license-MIT-black)](./codecraft/LICENSE)

---

## 快速开始

装到当前项目（自动识别 Trae / Claude / Cursor）：

```bash
npx @ultime/codecraft install
```

装好后对 AI 说：

```text
用 Codecraft 审计本项目，只读，不改文件。
```

> 带上 `Codecraft` 这个名字最稳；只启用 skill 而不点名时，agent 未必进入 Audit 模式。

---

## Skills

| Skill | 说明 | 入口 |
|---|---|---|
| **Codecraft** | 面向 JS/TS 的代码规范与架构设计（前端默认）：审计、计划、架构、脚手架与门禁编排 | [README](./codecraft/README.md) · [SKILL.md](./codecraft/SKILL.md) · [VERSION](./codecraft/VERSION) |

---

## 安装方式

### A · npm + skills-npm（推荐，多项目 / 团队）

```bash
npm i -D @ultime/codecraft skills-npm
npx skills-npm setup
```

之后每次 `npm install` 都会把 `node_modules/@ultime/codecraft` 同步到 `.agents/skills/codecraft` 及检测到的 agent 目录。需要 Node.js >= 22.20（`skills-npm` 的要求）。

### B · 自带安装器（单次，无额外依赖）

```bash
npx @ultime/codecraft install                                  # 自动检测
npx @ultime/codecraft install --agent trae,claude              # 指定 agent
npx @ultime/codecraft install --global --agent claude          # 装到用户目录
npx @ultime/codecraft install --dry-run                        # 只看计划
npx @ultime/codecraft install --force                          # 覆盖已有目录
```

### C · 手动指针（不复制文件）

在项目的规则文件里留一行，指向对应平台的入口：

| 平台 | 规则文件 | 入口 |
|---|---|---|
| Trae | `.trae/rules/codecraft.md` | [`adapters/trae/SKILL.md`](./codecraft/adapters/trae/SKILL.md) |
| Claude | `CLAUDE.md` / `~/.claude/CLAUDE.md` | [`adapters/claude/SKILL.md`](./codecraft/adapters/claude/SKILL.md) |
| 通用 | `AGENTS.md` | [`adapters/generic/AGENTS.md`](./codecraft/adapters/generic/AGENTS.md) |

```md
代码任务先读 <Codecraft 路径>/codecraft/adapters/trae/SKILL.md
```

完整参数与三种方式的差异见 [Codecraft · 安装](./codecraft/README.md#安装)。

---

## 仓库结构

```text
skills/
├── README.md            本文件：索引与安装入口
├── .github/workflows/   发布流水线（tag 触发 → npm）
└── codecraft/           一个独立 skill
    ├── SKILL.md         agent skill 标准入口
    ├── docs/            宪法、族卡、AI 契约、风格、模式、架构、门禁
    ├── scenarios/       新项目 / 旧项目审计 / 只出报告 / 重构评审
    ├── adapters/        generic / Trae / Claude 手动指针
    ├── prompts/         输出格式
    ├── src/ + bin/      CLI
    ├── templates/       init --apply 的骨架
    ├── tests/           node:test 用例
    └── evals/           golden tasks（人工回归）
```

---

## 约定

- **自包含**：文档、适配器、脚本、版本都在 skill 自己的目录里。
- **独立版本**：根目录不设统一版本，每个 skill 各自 semver。
- **不互相 import**：需要共享时先提炼成独立 skill，而不是交叉引用。
- **根目录只维护索引**：`README.md` 与仓库级文件（`.gitignore`、workflow）。

---

## 开发与发布

```bash
cd codecraft
npm test                       # node:test，无框架依赖
npm pack --dry-run             # 检查发布内容
```

发布走 tag：`package.json` 版本与 tag 对齐后推送，GitHub Actions 用 npm Trusted Publishing（OIDC）发布，不存 token。

```bash
git tag codecraft-v<version>
git push origin codecraft-v<version>
```

版本变更记录见 [CHANGELOG.md](./codecraft/CHANGELOG.md)。

---

## 许可与反馈

- 许可：MIT，见 [LICENSE](./codecraft/LICENSE)
- 贡献流程：[CONTRIBUTING.md](./codecraft/CONTRIBUTING.md)
- 安全问题：[SECURITY.md](./codecraft/SECURITY.md)
- 路线图：[ROADMAP.md](./codecraft/ROADMAP.md)
