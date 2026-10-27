# Skills

面向 AI 编程的 skill 集合。每个 skill 自包含：规则、适配器、版本都在各自目录内；安装交给 [`skills`](https://github.com/vercel-labs/skills) CLI，不在本仓维护 agent 列表。

[![npm](https://img.shields.io/npm/v/@ultime/codecraft?label=%40ultime%2Fcodecraft&color=black)](https://www.npmjs.com/package/@ultime/codecraft)
[![node](https://img.shields.io/node/v/@ultime/codecraft?label=node)](https://www.npmjs.com/package/@ultime/codecraft)
[![license](https://img.shields.io/badge/license-MIT-black)](./skills/codecraft/LICENSE)

---

## 快速开始

```bash
# 装全部 skill；交互选择要装到哪些 agent
npx skills add ultime-space/skills --skill='*'

# 只装 Codecraft
npx skills add ultime-space/skills --skill codecraft

# 全局安装
npx skills add ultime-space/skills --skill='*' -g
```

- 不传 `-a` 时，CLI 会检测本机 agent 并让你多选；agent 支持由 `skills` CLI 维护，本仓不枚举。
- 非交互场景用 `-a <agent>`，例如 `-a claude-code`。
- 需要 Node.js >= 22.20（`skills` CLI 的要求）。

装好后对 AI 说：

```text
用 Codecraft 审计本项目，只读，不改文件。
```

> 带上 `Codecraft` 这个名字最稳；只启用 skill 而不点名时，agent 未必进入 Audit 模式。

---

## Skills

| Skill | 说明 | 入口 |
|---|---|---|
| **Codecraft** | 面向 JS/TS 的代码规范与代码架构设计（不含业务架构）：审计、架构报告、代码架构设计、脚手架与门禁编排 | [README](./skills/codecraft/README.md) · [SKILL.md](./skills/codecraft/SKILL.md) · [VERSION](./skills/codecraft/VERSION) |
| **Docscraft** | 文档组织与 AI 上下文治理：分层、单一真源、规则治理、ADR、文档漂移检查 | [README](./skills/docscraft/README.md) · [SKILL.md](./skills/docscraft/SKILL.md) · [VERSION](./skills/docscraft/VERSION) |

---

## 安装方式

### A · skills CLI（推荐）

```bash
npx skills add ultime-space/skills --skill codecraft
```

交互选择 agent；`-g` 装到用户目录，`-a` 指定 agent。

### B · npm + skills-npm（多项目 / 团队）

```bash
npm i -D @ultime/codecraft @ultime/docscraft skills-npm
npx skills-npm setup
```

每次 `npm install` 会把两个包（`node_modules/@ultime/codecraft`、`node_modules/@ultime/docscraft`）同步到 `.agents/skills/` 及检测到的 agent 目录。需要 Node.js >= 22.20。

### C · 手动指针（不复制文件）

在项目通用入口 `AGENTS.md` 留一行：

```md
代码任务先读 <Codecraft 路径>/skills/codecraft/SKILL.md
```

入口示例：[`adapters/generic/AGENTS.md`](./skills/codecraft/adapters/generic/AGENTS.md)。其它 agent 使用自己的入口文件，统一指向 `SKILL.md`；不为单一 agent 维护专属文件。

完整用法见 [Codecraft · 安装](./skills/codecraft/README.md#安装)。

---

## 仓库结构

```text
skills/
├── README.md            本文件：集合索引与安装入口
├── .github/workflows/   发布流水线（tag 触发 → npm）
└── skills/
    ├── codecraft/       代码规范与架构
    │   ├── SKILL.md     agent skill 标准入口
    │   ├── docs/        宪法、族卡、AI 契约、审计契约、风格、模式、架构、门禁、术语表
    │   ├── scenarios/   新项目 / 旧项目审计 / 代码架构报告 / 只出报告 / 重构评审
    │   ├── adapters/    generic 手动指针（其它 agent 统一指向 SKILL.md）
    │   ├── prompts/     输出格式
    │   ├── src/ + bin/  CLI（check / audit / plan / init）
    │   ├── templates/   init --apply 的骨架 + 架构报告模板
    │   ├── tests/       node:test 用例
    │   └── evals/       CLI eval fixtures + golden tasks（人工回归）
    └── docscraft/       文档组织与 AI 上下文治理
        ├── SKILL.md
        ├── docs/        原则、分层、类型、AI 上下文、防漂移、规则治理、ADR、术语表
        ├── scenarios/   文档审计 / 重整 / 写 ADR / 复查规则
        ├── prompts/     输出格式
        ├── templates/   AGENTS / rules / ADR
        ├── tests/       包结构与链接校验
        └── evals/       golden tasks（人工回归）
```

> 目录采用 `skills/<name>/SKILL.md`，可被 `skills` CLI 直接发现；新增 skill 只加目录与索引行。

---

## 约定

- **自包含**：文档、适配器、脚本、版本都在 skill 自己的目录里。
- **独立版本**：根目录不设统一版本，每个 skill 各自 semver。
- **安装归集合**：不在 skill 内维护安装器与 agent 列表；统一走 `skills` CLI 或 `skills-npm`。
- **不互相 import**：需要共享时先提炼成独立 skill，而不是交叉引用。
- **根目录只维护索引**：`README.md` 与仓库级文件（`.gitignore`、workflow）。

---

## 开发与发布

```bash
cd skills/codecraft
npm test                       # node:test，无框架依赖
npm run eval                   # CLI fixtures：A2 / A6 / A11 / A17 / A21 / ignore / SARIF
npm run self-check             # 仓库自检；fixtures 含故意违规样本，用 --exclude 跳过
npm pack --dry-run             # 检查发布内容

cd ../docscraft
npm test                       # 结构、版本对齐、相对链接与路由路径
npm pack --dry-run
```

发布走 tag：`package.json` 版本与 tag 对齐后推送，GitHub Actions 用 npm Trusted Publishing（OIDC）发布，不存 token。

```bash
git tag codecraft-v<version>
git push origin codecraft-v<version>

git tag docscraft-v<version>
git push origin docscraft-v<version>
```

版本变更记录见 [Codecraft CHANGELOG](./skills/codecraft/CHANGELOG.md) 与 [Docscraft CHANGELOG](./skills/docscraft/CHANGELOG.md)。

---

## 许可与反馈

- 许可：MIT，见 [LICENSE](./skills/codecraft/LICENSE)
- 贡献流程：[CONTRIBUTING.md](./skills/codecraft/CONTRIBUTING.md)
- 安全问题：[SECURITY.md](./skills/codecraft/SECURITY.md)
- 版本历史：[CHANGELOG.md](./skills/codecraft/CHANGELOG.md)
