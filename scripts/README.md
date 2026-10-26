# CLI

包名：`@ultime/codecraft`；命令：`codecraft`。

## Commands

| 命令 | 状态 | 作用 |
|---|---|---|
| `check` | 已实现 | 只跑内置规则 |
| `audit` | 已实现 | 内置规则 + config gates |
| `plan` | 已实现 | 只读升级计划；默认不跑 gates |
| `init` | 已实现（dry-run） | 只输出目录 / 文件 / 配置，不写盘 |
| `version` | 已实现 | 输出版本 |

## Usage

```bash
node bin/codecraft.mjs check --root .
node bin/codecraft.mjs check --root ../../packages/core
node bin/codecraft.mjs check --format json
node bin/codecraft.mjs audit --severity error
node bin/codecraft.mjs audit --config codecraft.config.json
node bin/codecraft.mjs plan --root .
node bin/codecraft.mjs init --root . --name demo
node bin/codecraft.mjs version
```

## Packs

| Pack | 规则 | 作用 |
|---|---|---|
| `app` | A4 / A17 | 内部不 import `external/` / `generated/` |
| `library` | A2 / A11 | 包依赖方向；生成物标记 |

`--pack auto`（默认）：有 `apps/` 或 `src/pages` → `app`；有 `packages/` 或 `package.json` → `library`。

## Flags

- `--root <path>`
- `--pack app|library|auto`
- `--config <path>`（默认 `codecraft.config.json`）
- `--no-gates`（audit / plan 跳过 gates）
- `--with-gates`（plan 跑 gates；默认不跑）
- `--name <name>`（init 的 app / package 名称）
- `--apply`（init 写盘；暂未实现）
- `--format md|json`（默认 md）
- `--severity warn|error`（默认 warn）
- `--ci`（等价于 `--severity error`）

## Exit codes

- `0` 通过（warn 不阻断）
- `1` 有 error findings 或 gate 失败
- `2` 用法 / 配置错误

## JSON 的用途

用于 CI、趋势、eval 评分、两次运行 diff；默认 Markdown，不默认双份。JSON 里包含 `findings`、`plan` 和 `gates`。

## Gates

- Codecraft 只内置通用规则（A2 / A4 / A11 / A17）。
- 项目门禁通过 `codecraft.config.json` 的 `gates` 调用，例如 `["pnpm check"]`。
- `check` 只跑内置；`audit` 跑内置 + gates；`plan` 只读。
- 不复制 `kit:check` / `boundaries`；只编排。
- 详细构建指引见 [../docs/04-gates.md](../docs/04-gates.md)。

## 分发

```bash
npx @ultime/codecraft audit --format md
```
