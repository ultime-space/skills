# Codecraft（代码手艺）

> 语言无关的代码规范，作为可安装的 skill 包。
> 目标：让 AI 在新项目 / 旧项目 / 评审中按同一套约束工作，并能版本化引入。

## 包含

- `docs/` — 宪法、族卡、AI 契约、风格总图、设计模式工具箱、两层门禁
- `scenarios/` — 新项目、旧项目审计、只出报告、重构评审
- `adapters/` — generic / Trae / Claude
- `prompts/` — 输出格式
- `src/` + `bin/` — CLI（`check` / `audit` / `plan` / `init`）
- `evals/` — golden tasks
- `templates/` — `init --apply` 使用的 app / library 骨架

## 三种模式

- **Audit（审计）**：只读，出检查报告。
- **Plan（计划）**：只读，出架构 / 升级计划。
- **Apply（执行）**：改代码 + 跑门禁。

## 快速开始

```bash
node bin/codecraft.mjs check --root .
node bin/codecraft.mjs check --root ../../packages/core
node bin/codecraft.mjs check --format json
node bin/codecraft.mjs audit --severity error
node bin/codecraft.mjs audit --config codecraft.config.json
node bin/codecraft.mjs plan --root .
node bin/codecraft.mjs init --root . --name demo
node bin/codecraft.mjs init --root . --name demo --apply
```

`init` 默认 dry-run：只列目录 / 文件 / 配置，不写盘；`--apply` 才写，且跳过已存在路径、不覆盖。

默认 `--pack auto`：有 `apps/` 或 `src/pages` → `app`；有 `packages/` 或 `package.json` → `library`。

## Rule Packs

| Pack | 规则 | 作用 |
|---|---|---|
| `app` | A4 / A17 | `pages / components / behavior` 不 import `external/` / `generated/` |
| `library` | A2 / A11 | 包依赖方向；生成物必须有“勿手改 / 派生”标记 |

## CLI

| 命令 | 状态 | 作用 |
|---|---|---|
| `check` | 已实现 | 只跑内置规则 |
| `audit` | 已实现 | 内置规则 + config gates |
| `plan` | 已实现 | 只读升级计划；默认不跑 gates |
| `init` | 已实现 | dry-run 默认；`--apply` 写盘，跳过已存在路径 |
| `version` | 已实现 | 输出版本 |

## 版本

- semver；规则 ID A1–A21 稳定；报告必须带版本号。

## Gates

- 通用门禁内置（A2 / A4 / A11 / A17）；业务门禁由项目实现。
- `audit` 通过 `codecraft.config.json` 的 `gates` 调用项目门禁，并汇总结果。
- 构建指引见 [docs/04-gates.md](./docs/04-gates.md)。

## 开源准备

- 私有起步；LICENSE 待定；示例脱敏；英文文件名 + 中文内容。
