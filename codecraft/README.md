# Codecraft（代码手艺）

> 语言无关的代码规范，作为可安装的 skill 包。
> 让 AI 和人在新项目、旧项目、评审中按同一套约束工作，并能按版本引入。

- 版本：见 [VERSION](./VERSION)
- npm：[@ultime/codecraft](https://www.npmjs.com/package/@ultime/codecraft)
- 许可：MIT（[LICENSE](./LICENSE)）
- 环境：Node.js >= 20；零运行时依赖
- 形态：规则文档 + 场景 + 适配器 + CLI + 脚手架

## 这是什么

| 是 | 不是 |
|---|---|
| 一套可执行的代码宪法（A1–A21）与代码族卡 | 业务组件库 |
| 面向 AI 的固定入口与输出格式 | 某个框架的编码风格指南 |
| 通用规则的静态检查 + 项目门禁编排 | 替代 typecheck / 单测 / e2e |

规则正文只在 [`docs/`](./docs/)；其它位置只放入口与指针，避免第二份真源。

## 快速开始

### 1. 直接运行

```bash
# 在 codecraft 目录内
node bin/codecraft.mjs check --root .

# 检查任意项目
node /path/to/codecraft/bin/codecraft.mjs check --root /path/to/project
```

### 2. 安装 / 运行

包名 `@ultime/codecraft`，命令 `codecraft`。发布到 npm 后可直接运行：

```bash
npx @ultime/codecraft check --root .
npx @ultime/codecraft@latest check --root .
```

安装为项目依赖：

```bash
npm i -D @ultime/codecraft
npx codecraft check --root .
```

本地开发 / 未发布时用 tarball：

```bash
npm pack
npm i -D /path/to/ultime-codecraft-<version>.tgz
npx codecraft check --root .
```

也可以直接 `pnpm link --global /path/to/codecraft`，之后在任意目录使用 `codecraft`。

### 3. 接入 agent（作为 skill）

适配器只做入口，不复制规则：

| 平台 | 入口文件 |
|---|---|
| 通用（读 `AGENTS.md`） | [`adapters/generic/AGENTS.md`](./adapters/generic/AGENTS.md) |
| Trae | [`adapters/trae/SKILL.md`](./adapters/trae/SKILL.md) |
| Claude | [`adapters/claude/SKILL.md`](./adapters/claude/SKILL.md) |

推荐**指针式接入**——不复制规则，升级只需更新仓库：

- Trae：在项目 `.trae/rules/codecraft.md` 写一行「代码任务先读 `<本仓库绝对路径>/adapters/trae/SKILL.md`」。
- Claude：在 `~/.claude/CLAUDE.md` 或项目 `CLAUDE.md` 加同一行。
- 其他 agent：在项目 `AGENTS.md` 加同一行。

如果确实要把 `SKILL.md` 复制到 agent 的 skills 目录，必须让 `docs/`、`scenarios/`、`prompts/` 与该文件保持 `../../` 的相对位置（符号链接即可），否则入口里的路径会失效。

### 4. 让 AI 怎么说

可直接复制的提示词见 [docs/07-ai-prompts.md](./docs/07-ai-prompts.md)：审计、只出报告、新项目、重构评审、架构设计、模式选型、脚手架、Design System 审计。

提示词只负责「怎么说」；模式、范围和规则仍以 `docs/` 为准。

## 三种模式

| 模式 | 是否改文件 | 对应命令 |
|---|---|---|
| **Audit（审计）** | 否 | `check` / `audit` |
| **Plan（计划）** | 否 | `plan` |
| **Apply（执行）** | 是，需确认范围 | 人工按计划改；`init --apply` 只创建骨架 |

## CLI

```bash
codecraft <command> [options]
```

| 命令 | 作用 |
|---|---|
| `check` | 只跑内置规则（默认命令） |
| `audit` | 内置规则 + `codecraft.config.json` 里的 gates，出只读报告 |
| `plan` | 把 findings 转成只读升级计划；默认不跑 gates |
| `init` | 生成 app / library 骨架；默认 dry-run |
| `version` | 输出版本号 |

### 常用

```bash
codecraft check --root .
codecraft check --pack library --root ../../packages/core
codecraft check --pack design-system
codecraft check --format json --ci
codecraft audit --severity error
codecraft audit --config codecraft.config.json --fail-fast
codecraft plan --root . --with-gates
codecraft init --root . --name demo              # dry-run
codecraft init --root . --name demo --apply      # 写盘
```

### 参数

| 参数 | 取值 | 默认 | 说明 |
|---|---|---|---|
| `--root <path>` | 目录 | `.` | 被检查的项目根 |
| `--pack <name>` | `app` / `library` / `design-system` / `auto` | `auto` | 规则包；CLI 优先于 config |
| `--config <path>` | 文件 | `codecraft.config.json` | 相对 `--root` |
| `--format <fmt>` | `md` / `json` | `md` | 输出格式 |
| `--severity <level>` | `warn` / `error` | `warn` | findings 的严重级别 |
| `--ci` | — | 关 | 等价于 `--severity error` |
| `--fail-fast` | — | 关 | gates 遇到第一个失败即停止 |
| `--no-gates` | — | 关 | `audit` 跳过 gates |
| `--with-gates` | — | 关 | `plan` 执行 gates |
| `--name <name>` | 字符串 | — | `init` 的 app / package 名称；`--apply` 时必填 |
| `--apply` | — | 关 | `init` 写盘；已存在路径跳过，不覆盖 |

### 退出码

| 码 | 含义 |
|---|---|
| `0` | 通过；warning 不阻断 |
| `1` | 有 error findings，或有 gate 失败 |
| `2` | 用法错误、root 不存在、配置非法 |

### 输出

- 默认 Markdown：头部元信息 + Findings 表 + Gates 表。
- `--format json`：包含 `version` / `mode` / `pack` / `rules` / `findings` / `plan` / `gates` / `summary`，用于 CI、趋势和两次运行 diff。
- 报告始终带版本号与规则 ID；`plan` 明确声明「No files were changed by this command.」。

## Rule Packs

| Pack | 内置规则 | 检查范围 |
|---|---|---|
| `app` | A17 / A21 | `pages / components / behavior` 不 import `external/` / `generated/`；密钥扫描 |
| `library` | A2 / A11 / A21 | 包不 import app、相对路径不逃逸、workspace 依赖必须声明；生成物必须有“勿手改 / 派生”标记；密钥扫描 |
| `design-system` | A2 / A11 / A21 | library 规则 + 包内公开文档不得引用内部 `docs/` |

`--pack auto` 的判定顺序：

1. 有 `apps/` 或 `src/pages` → `app`
2. 有 `packages/` 或根 `package.json` → `library`
3. 其余 → `app`

`design-system` 不参与自动判定，必须显式指定。

A4（单一收口）属于结构判断，由 review 与项目门禁负责，不由静态扫描替代。

## 配置

项目根放 `codecraft.config.json`（示例见 [`codecraft.config.example.json`](./codecraft.config.example.json)）：

```json
{
  "pack": "auto",
  "gates": [
    { "name": "typecheck", "run": "pnpm typecheck", "timeoutMs": 120000 },
    { "name": "kit", "run": "pnpm kit:check", "timeoutMs": 120000 }
  ]
}
```

- `pack`：`app` / `library` / `design-system` / `auto`。
- `gates`：数组；每项必须有一个非空的 `run` 字符串，可选 `name`、`timeoutMs`（默认 `120000`）。
- gate 在 `--root` 下通过 shell 执行，注入 `CI=1`；失败时报告尾部 40 行 / 4000 字符。
- `check` 不跑 gates；`audit` 默认跑；`plan` 只在 `--with-gates` 时跑。
- 通用规则内置，业务门禁只编排、不复制。构建指引见 [`docs/04-gates.md`](./docs/04-gates.md)。

## 目录

```text
docs/         宪法、族卡、AI 契约、风格总图、模式、架构、AI 提示词、门禁
scenarios/    新项目 / 旧项目审计 / 只出报告 / 重构评审
adapters/     generic / Trae / Claude 入口
prompts/      输出格式
src/ + bin/   CLI
tests/        node:test 用例
templates/    init --apply 的 app / library 骨架
evals/        golden tasks（人工回归）
```

## 版本与稳定承诺

- semver；当前版本见 [VERSION](./VERSION)。
- 规则 ID `A1–A21` 稳定；增删规则属于 minor 以上的变更。
- 报告始终携带版本号；跨版本对比以 JSON 为准。

## 边界

- 静态检查是文本级：能覆盖高置信模式，可能漏报或误报；最终以项目门禁与 review 为准。
- 不内置任何业务规则、框架约定或公司内部门禁。
- 不读取、不上传代码；所有检查在本地完成。

## 贡献与安全

- 贡献流程：[CONTRIBUTING.md](./CONTRIBUTING.md)
- 漏洞与密钥报告：[SECURITY.md](./SECURITY.md)
- 许可：MIT
