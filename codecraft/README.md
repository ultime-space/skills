# Codecraft（代码手艺）

> 面向 JS/TS 的代码规范与架构设计，作为可安装的 skill 包。
> 默认 Web 前端；示例原生优先（TS / 原生 Web API），框架只给 Vue 3 / React；Node 后端只复用结构规则；其它语言不在范围。

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

> 第一次用：直接看 [安装](#安装) 和 [第一次使用](#第一次使用)。

## 范围与分层

| 项 | 内容 |
|---|---|
| 覆盖 | JS/TS 项目；Web 前端为默认场景（示例原生优先，框架仅 Vue 3 / React） |
| 可复用 | Node 后端：模块边界、依赖方向、内外分离、生成物、门禁与文档规则 |
| 不适用 | Page / Component 等前端族；数据库、缓存、并发、事务等后端专项 |
| 不在范围 | Java / Go / Python 等其它语言；后端专项另立体系 |

内容分三层，按需取用：

| 层 | 回答什么 | 位置 |
|---|---|---|
| **规则** | 什么不能变 | [`docs/00-constitution.md`](./docs/00-constitution.md) |
| **形状** | 边界与结构长什么样 | [`docs/06-architecture.md`](./docs/06-architecture.md)、[`docs/01-family-cards.md`](./docs/01-family-cards.md) |
| **示例** | 原生怎么落，框架怎么对应 | 族卡的形状、[`templates/`](./templates/)、[`docs/05-patterns.md`](./docs/05-patterns.md) |

> 族卡的形状默认原生（HTML + TS）；框架示例只给 Vue 3 / React，其它框架在族卡 §12 登记，不预建。


## 安装

### 方式 A：npm + skills-npm（推荐，多项目 / 团队）

```bash
npm i -D @ultime/codecraft skills-npm
npx skills-npm setup
```

之后每次 `npm install` 都会把 `node_modules/@ultime/codecraft` 里的 skill 同步到 agent 目录：`.agents/skills/codecraft`，以及检测到的 Claude / Trae / Cursor 目录。需要 Node.js >= 22.20（`skills-npm` 的要求）。

### 方式 B：Codecraft 自带安装器（单次，无额外依赖）

```bash
npx @ultime/codecraft install
```

自动检测当前项目的 agent，把 `SKILL.md`、`docs/`、`scenarios/`、`prompts/` 复制到 `.agents/skills/codecraft` 和对应 agent 目录（`.claude/skills`、`.cursor/skills`、`.trae/skills`、`.trae-cn/skills`）。不传 `--agent` 时只按检测结果安装，不优先任何一家。

```bash
npx @ultime/codecraft install --agent generic          # 指定 agent，可逗号分隔
npx @ultime/codecraft install --global --agent claude  # 装到用户目录
npx @ultime/codecraft install --global --agent trae-cn # Trae CN 的全局目录
npx @ultime/codecraft install --global --dest .trae-cn/skills  # 自定义目录
npx @ultime/codecraft install --dry-run                # 只看计划
npx @ultime/codecraft install --force                  # 覆盖已有目录
```

可选 agent：`generic` / `claude` / `cursor` / `trae` / `trae-cn`；未知目录用 `--dest`。

### 方式 C：手动指针

不复制文件，只在项目规则里留一行：

- Trae：`.trae/rules/codecraft.md`
- Claude：`CLAUDE.md` 或 `~/.claude/CLAUDE.md`
- 其他：`AGENTS.md`

```md
代码任务先读 <Codecraft 路径>/codecraft/adapters/trae/SKILL.md
```

平台入口：

| 平台 | 入口文件 |
|---|---|
| 通用（读 `AGENTS.md`） | [`adapters/generic/AGENTS.md`](./adapters/generic/AGENTS.md) |
| Trae | [`adapters/trae/SKILL.md`](./adapters/trae/SKILL.md) |
| Claude | [`adapters/claude/SKILL.md`](./adapters/claude/SKILL.md) |

## 第一次使用

```text
用 Codecraft 审计本项目，只读，不改文件。
```

只启用 skill、不说 Codecraft 时，agent 可能按普通项目分析处理，不保证走 Audit 模式。带上名字最稳。

更多场景（只出报告、新项目、重构评审、架构设计、模式选型、脚手架、Design System）见 [docs/07-ai-prompts.md](./docs/07-ai-prompts.md)。

需要本地检查时再装 CLI：

```bash
npx @ultime/codecraft check --root .
npx codecraft check --root .        # 已安装为项目依赖时
```

本地开发 / 未发布时用 tarball：

```bash
npm pack
npm i -D /path/to/ultime-codecraft-<version>.tgz
npx codecraft check --root .
```

## 模式

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
| `install` | 把 skill 安装到 agent skills 目录；默认写入，`--dry-run` 只看计划 |
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
codecraft install                                # 自动检测并安装
codecraft install --agent trae,claude --force
codecraft install --dry-run
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
| `--agent <list>` | `auto` / `claude` / `trae` / `cursor` / `generic` | `auto` | `install` 目标，可逗号分隔 |
| `--global` | — | 关 | `install` 写入用户目录 |
| `--dest <path>` | 目录 | — | `install` 的显式目标 |
| `--force` | — | 关 | `install` 覆盖已有 codecraft 目录 |
| `--dry-run` | — | 关 | `install` 只输出计划，不写盘 |

### 退出码

| 码 | 含义 |
|---|---|
| `0` | 通过；warning 不阻断 |
| `1` | 有 error findings、install 失败，或有 gate 失败 |
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

`--pack auto` 的判定顺序（基于 JS/TS 生态的目录与 `package.json`）：

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
    { "name": "test", "run": "pnpm test", "timeoutMs": 120000 }
  ],
  "ignore": [
    {
      "rule": "A17",
      "file": "src/pages/legacy/**",
      "reason": "legacy page; migrate in 2026-Q4",
      "expires": "2026-12-31"
    }
  ]
}
```

- `pack`：`app` / `library` / `design-system` / `auto`。
- `gates`：数组；每项必须有一个非空的 `run` 字符串，可选 `name`、`timeoutMs`（默认 `120000`）。
- `ignore`：例外登记（A12）。每项必须有 `rule` / `file` / `reason`，`expires` 可选（`YYYY-MM-DD`）；`file` 支持 `*` / `**` / `?`。安全规则 `A21` 不可豁免。
- 命中的 findings 不参与退出码，但仍出现在报告的 `Ignored` 表与 JSON 的 `ignored`；过期的条目不生效，列在 `Expired Exceptions`。
- gate 在 `--root` 下通过 shell 执行，注入 `CI=1`；失败时报告尾部 40 行 / 4000 字符。
- `check` 不跑 gates；`audit` 默认跑；`plan` 只在 `--with-gates` 时跑。
- 通用规则内置，业务门禁只编排、不复制。构建指引见 [`docs/04-gates.md`](./docs/04-gates.md)。

## 目录

```text
SKILL.md      标准 agent skill 入口（skills-npm / install 使用）
docs/         宪法、族卡、AI 契约、风格总图、模式、架构、AI 提示词、门禁
scenarios/    新项目 / 旧项目审计 / 只出报告 / 重构评审
adapters/     generic / Trae / Claude 手动指针
prompts/      输出格式
src/ + bin/   CLI（含 install）
tests/        node:test 用例
templates/    init --apply 的 app / library 骨架
evals/        golden tasks（人工回归）
ROADMAP.md    后续版本计划与交接说明
```

## 版本与稳定承诺

- semver；当前版本见 [VERSION](./VERSION)。
- **major**：只用于破坏性变更——规则 ID 语义变更、配置格式不兼容、JSON 输出结构变化。
- **minor**：新能力——CLI 选项、检查规则、适配器、模板、向后兼容的配置字段。
- **patch**：修复、文档、提示词、测试、CI，或无行为变化的内部调整。
- 不按「感觉重要」升 major；`2.0` 不设时间表。
- 规则 ID `A1–A21` 稳定；增删规则属于 minor 以上的变更。
- 报告始终携带版本号；跨版本对比以 JSON 为准。
- 后续计划：[ROADMAP.md](https://github.com/ultime-space/skills/blob/main/codecraft/ROADMAP.md)。

## FAQ

- **静态检查误报怎么办？** 在 `codecraft.config.json` 的 `ignore` 里登记 `rule` + `file` + `reason`，必要时加 `expires`；不要直接删规则。
- **`Files: 0` 是什么意思？** 没有扫到源文件，命令会输出警告并以 2 退出；用 `--pack app|library` 指定正确类型，或检查 `--root`。
- **Trae CN 装到哪？** 用 `--agent trae-cn`（`~/.trae-cn/skills`）；未知目录用 `--dest`。
- **`check` / `audit` / `plan` 有什么区别？** `check` 只跑内置规则；`audit` 额外跑 config 里的 gates；`plan` 只读，把 findings 转成计划，默认不跑 gates。
- **为什么不自动跑 typecheck / test？** 门禁由项目提供，Codecraft 只编排，避免第二套实现。
- **monorepo 为什么被判成 app / library？** 有 `pages/`、`app/`、`manifest.json + pages.json`、Taro / uni-app 依赖或嵌套应用时按 `app`；有 `packages/` 或 `src/` 时按 `library`；仍不确定就显式传 `--pack`。
- **支持哪些文件？** 只扫 JS/TS 相关扩展名与 `package.json`；其它语言不覆盖。

## 边界

- 静态检查是文本级：能覆盖高置信模式，可能漏报或误报；最终以项目门禁与 review 为准。
- 机检只扫描 JS/TS 相关文件（`.ts` / `.tsx` / `.js` / `.jsx` / `.mjs` / `.cjs` / `.vue` / `.svelte`）与 `package.json`，其它语言不覆盖。
- 不内置任何业务规则、框架约定或公司内部门禁。
- 不读取、不上传代码；所有检查在本地完成。

## 贡献与安全

- 贡献流程：[CONTRIBUTING.md](./CONTRIBUTING.md)
- 漏洞与密钥报告：[SECURITY.md](./SECURITY.md)
- 许可：MIT
