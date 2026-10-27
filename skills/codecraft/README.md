# Codecraft

> 面向 JS/TS 的代码规范与代码架构设计（不含业务架构），作为可安装的 skill 包。
> 前端与 JS/TS 后端分轨：共享 A1–A21、门禁与输出契约，族卡与架构按端读取；其它语言不在范围。

- 版本：见 [VERSION](./VERSION)
- npm：[@ultime/codecraft](https://www.npmjs.com/package/@ultime/codecraft)
- 许可：MIT（[LICENSE](./LICENSE)）
- 环境：Node.js >= 20；零运行时依赖
- 形态：规则文档 + 场景 + 适配器 + CLI + 脚手架

## 这是什么

| 是 | 不是 |
|---|---|
| 一套可执行的代码宪法（A1–A21）与前端 / 后端两套代码族卡 | 业务组件库 |
| 面向 AI 的固定入口与输出格式 | 某个框架的编码风格指南 |
| 通用规则的静态检查 + 项目门禁编排 | 替代 typecheck / 单测 / e2e |
| 代码架构分析与报告 | 业务架构 / 角色 / 流程 / 领域建模 |

规则正文只在 [`docs/`](./docs/)；其它位置只放入口与指针，避免第二份真源。

> 第一次用：直接看 [安装](#安装) 和 [第一次使用](#第一次使用)。

## 适用场景

按「新建 / 接手 / 演进 / 日常」分组，选一个入口即可：

| 分组 | 场景 | 典型任务 | 产出 | 模式 |
|---|---|---|---|---|
| 新建 | 架构设计 | 定档位、边界、依赖规则 | 目标架构 / ADR（架构决策记录） | Plan（计划） |
| 新建 | 脚手架 | app / library 骨架 | 目录、配置、门禁 | Apply（执行） |
| 接手 | 代码架构报告 | 把现有结构讲清楚 | 架构分析文档 | Audit（审计） |
| 接手 | 前端老项目审计 | A1–A21 体检 | 报告、差距、升级计划 | Audit |
| 接手 | 重构 / 迁移评审 | 现状 → 目标、回退点 | 迁移计划 | Plan |
| 演进 | 包 / monorepo（单仓多包）边界 | 拆包、依赖方向修正 | 边界计划 | Plan |
| 演进 | 生成物 / 契约链 | 单一生成链、diff 门禁 | 治理方案 | Plan |
| 演进 | 错误 / 状态模型 | Result、状态穷尽、失败可见 | 重构方案 | Plan |
| 日常 | PR / 增量审计 | 只看变更范围 | findings | Audit |
| 日常 | 规范落地 | 宪法 → 项目 `rules/` + 门禁 | 规则与门禁映射 | Apply |
| 日常 | Design System（设计系统） / 组件库 | 包边界、公共 API、文档自包含 | 审计报告 | Audit |
| 日常 | 后端服务审计 | 入口、用例、数据访问、迁移、权限 | 报告、差距、升级计划 | Audit |
| 日常 | 后端 PR / 增量审计 | 入口 / 用例 / 事务 / 迁移的变更 | findings | Audit |
| 新建 / 演进 | 后端架构设计 | 模块边界、事务与幂等、数据演进 | 目标架构 / ADR | Plan |
| 日常 | 只出报告 | 只读汇报 | 报告 | Audit |

不适用：业务能力地图、角色与业务流程、领域建模、UI / 交互设计、运行时性能、渗透测试、容量规划。

## 范围与分层

| 项 | 内容 |
|---|---|
| 覆盖 | JS/TS 前端与 JS/TS 后端；前端示例原生优先（框架仅 Vue 3 / React），后端不绑定运行时、框架 / ORM |
| 代码架构 | 系统 / 容器 / 模块 / 组件边界、依赖方向、关键链路、生成物、演进 |
| 共享 | A1–A21、门禁契约、模式选型、审计口径、术语 |
| 分端 | 前端：Page / Component / Behavior / State / Transport / Wrapper（内外转换）/ Type …；后端：Route / Controller / Validation / Service / Repository / DB / Job / Cache / Auth … |
| 不适用 | 业务架构、角色 / 流程 / 领域建模；前端族不套后端，后端族不套前端 |
| 不在范围 | Java / Go / Python 等其它语言；云资源、部署拓扑与容量规划 |

内容按「共享 + 两端」分层，按需取用：

| 层 | 回答什么 | 位置 |
|---|---|---|
| **共享规则** | 什么不能变 | [`docs/shared/00-constitution.md`](./docs/shared/00-constitution.md) |
| **前端形状** | 页面 / 组件 / 行为 / 状态怎么落 | [`docs/frontend/06-architecture.md`](./docs/frontend/06-architecture.md)、[`docs/frontend/01-family-cards.md`](./docs/frontend/01-family-cards.md) |
| **后端形状** | 入口 / 用例 / 数据 / 迁移怎么落 | [`docs/backend/11-architecture.md`](./docs/backend/11-architecture.md)、[`docs/backend/10-family-cards.md`](./docs/backend/10-family-cards.md) |
| **示例** | 原生怎么落，框架怎么对应 | 族卡的形状、[`templates/`](./templates/)、[`docs/shared/05-patterns.md`](./docs/shared/05-patterns.md) |

> 前端族卡的形状默认原生（HTML + TS）；框架示例只给 Vue 3 / React，其它框架在族卡 §12 登记，不预建。


## 安装

### 方式 A：skills CLI（推荐）

```bash
npx skills add ultime-space/skills --skill codecraft
```

不传 `-a` 时，CLI 会检测本机 agent 并让你多选；`-g` 装到用户目录，`-a` 指定 agent。agent 支持由 `skills` CLI 维护，本 skill 不枚举。

### 方式 B：npm + skills-npm（多项目 / 团队）

```bash
npm i -D @ultime/codecraft skills-npm
npx skills-npm setup
```

之后每次 `npm install` 都会把 `node_modules/@ultime/codecraft` 里的 skill 同步到 agent 目录：`.agents/skills/codecraft`，以及检测到的 agent 目录。需要 Node.js >= 22.20（`skills-npm` 的要求）。

### 方式 C：手动指针

不复制文件，只在通用入口里留一行：

- 通用：`AGENTS.md`（推荐）
- 其它 agent：使用该 agent 自己的入口文件，内容相同

```md
代码任务先读 <Codecraft 路径>/skills/codecraft/SKILL.md
```

入口示例：[`adapters/generic/AGENTS.md`](./adapters/generic/AGENTS.md)。其它 agent 不需要单独适配文件，统一指向 `SKILL.md`，避免维护多份正文。

## 第一次使用

前端：

```text
用 Codecraft 审计 client/，Audit 模式，只读，不改文件。
按 docs/frontend/09-audit.md 出报告，A1–A21 逐条给证据。
```

后端：

```text
用 Codecraft 审计 server/，Audit 模式，只读，不改文件。
按 scenarios/backend-audit.md 出报告；事务、幂等、迁移、权限各给证据。
```

需要一份能读的代码架构文档：

```text
用 Codecraft 按 scenarios/architecture-report.md 出一份代码架构分析报告。
只读，不改文件；不做业务架构，先不画图。
```

只启用 skill、不说 Codecraft 时，agent 可能按普通项目分析处理，不保证走 Audit 模式。带上名字最稳。

更多场景（代码架构报告、后端服务审计、只出报告、新项目、重构评审、架构设计、模式选型、脚手架、Design System）见 [docs/shared/07-ai-prompts.md](./docs/shared/07-ai-prompts.md)。

## 常用场景怎么说

说清三件事：模式、范围、产出。下面可以直接复制。

**前端审计**

```text
用 Codecraft 审计本项目，只读，不改文件。
范围：client/ 和 admin/；重点看边界、错误模型、生成物。
产出：按 docs/frontend/09-audit.md 出报告，A1–A21 逐条给证据。
```

**后端服务审计**

```text
用 Codecraft 审计 server/，Audit 模式，只读。
按 scenarios/backend-audit.md 和 docs/backend/13-audit.md 逐条判定；
重点：入口职责、事务边界、幂等、迁移兼容、权限与配置。
```

**后端架构设计**

```text
用 Codecraft 为 server/ 设计架构，Plan 模式，只读。
按 docs/backend/11-architecture.md 先定模块边界、事务与幂等策略、迁移与回滚；
输出目录树、角色清单、分阶段计划，不直接写代码。
```

**后端 PR 评审**

```text
用 Codecraft 评审 server/ 的 <diff / 模块>，Review 模式，只读。
重点：Controller 是否写业务、事务是否在 Service、迁移是否兼容、权限判断是否单点。
```

**代码架构分析报告**

```text
用 Codecraft 按 scenarios/architecture-report.md 出一份代码架构分析报告。
范围：<目录 / 包>；只读；不做业务架构，先不画图；按 templates/architecture-report.md 输出。
```

**新项目架构设计**

```text
用 Codecraft 按 scenarios/new-project.md 设计架构，Plan 模式，只读。
输入：<端 / 团队 / 约束>；先定档位和边界，再给分阶段计划，不要直接写代码。
```

**重构 / PR 评审**

```text
用 Codecraft 评审 <diff / 目录>，Audit 模式，只读。
重点看边界、依赖方向、错误模型、生成物；给最小改动计划，不改文件。
```

**Design System 审计**

```text
用 Codecraft 审计 packages/，Audit 模式，只读。
按 design-system pack 检查包边界、生成物标记、公开文档路径和密钥；给最小修复计划。
```

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
| `version` | 输出版本号 |

### 常用

```bash
codecraft check --root .
codecraft check --pack library --root ../../packages/core
codecraft check --pack design-system
codecraft check --format json --ci
codecraft check --changed --ci                    # 只看变更 / 未跟踪文件
codecraft check --since origin/main --ci          # PR 内变更
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
| `--changed` | — | 关 | 只报告变更 / 未跟踪文件中的 findings |
| `--since <ref>` | git ref | — | 只报告自该 ref 以来变动文件中的 findings |
| `--exclude <glob>` | 路径 / glob | — | 扫描时跳过；可重复。用于 fixture、第三方目录等不应参与检查的路径 |
| `--format <fmt>` | `md` / `json` / `sarif` | `md` | 输出格式 |
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

- 默认 Markdown：头部元信息 + Findings 表 + Gates（门禁）表。
- `--format json`：包含 `version` / `mode` / `pack` / `rules` / `exclude` / `findings` / `plan` / `gates` / `summary`，用于 CI、趋势和两次运行 diff。
- `--format sarif`：SARIF 2.1.0，可直接上传 GitHub Code Scanning。
- `--changed` / `--since` 只过滤 findings，底层仍做全量扫描；JSON 的 `scope` 为 `changed`，`changed` 为变更文件数。
- 报告始终带版本号与规则 ID；`plan` 明确声明「No files were changed by this command.」。

## Rule Packs

| Pack | 内置规则 | 检查范围 |
|---|---|---|
| `app` | A6 / A17 / A21 | 空 catch；`pages / components / behavior` 不 import `external/` / `generated/`（Wrapper / API / adapters 允许；含生成文件头与 `boundaries` 配置）；密钥扫描 |
| `library` | A2 / A6 / A11 / A21 | 包不 import app、相对路径不逃逸、workspace 依赖必须声明；空 catch；生成物必须有“勿手改 / 派生”标记；密钥扫描 |
| `design-system` | A2 / A6 / A11 / A21 | library 规则 + 包内公开文档不得引用内部 `docs/` |

> CLI 的结构规则以前端为主；后端审计按 [`docs/backend/13-audit.md`](./docs/backend/13-audit.md)，只把 A21 / A2 / A6 / A11 当抽样，不把 `0 findings` 当成通过。

`--pack auto` 的判定顺序（基于 JS/TS 生态的目录与 `package.json`）：

1. 有 `apps/`、`src/pages` / `pages` / `app` / `src/app`，或 Nuxt / Taro / uni-app / Vue CLI（`vue.config.*`）标记 → `app`
2. 单页 Web 入口三件套：`index.html`（根或 `public/`）+ 框架依赖（`vue` / `react` / `svelte` 等）+ `src/main.*` / `src/index.*` → `app`
3. 一级子目录命中上述任一标记（workspace 内嵌应用）→ `app`
4. 有 `packages/`、`src/` 或根 `package.json` → `library`
5. 其余 → `app`

`design-system` 不参与自动判定，必须显式指定。带 demo 页的库若被误判为 `app`，用 `--pack library` 覆盖。

A4（单一收口）、A5（互斥布尔 / 非法状态）、A8（派生状态）属于结构或状态判断，由 review 与项目门禁负责，不由静态扫描替代。

## 配置

项目根放 `codecraft.config.json`（示例见 [`codecraft.config.example.json`](./codecraft.config.example.json)）：

```json
{
  "pack": "auto",
  "exclude": ["dist/**", "coverage/**"],
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
  ],
  "boundaries": {
    "external": ["@/types/external"],
    "generated": ["@/types/project"],
    "allowedImporters": ["src/types/internal/*/wrapper.ts"],
    "generatedDirs": ["src/types/external"]
  }
}
```

- `pack`：`app` / `library` / `design-system` / `auto`。
- `exclude`：扫描级排除（路径或 glob），与 `--exclude` 合并；用于 fixture、构建产物、本地密钥文件。要登记规则例外用 `ignore`，两者不要混用。
- `gates`：数组；每项必须有一个非空的 `run` 字符串，可选 `name`、`timeoutMs`（默认 `120000`）。
- `ignore`：例外登记（A12）。每项必须有 `rule` / `file` / `reason`，`expires` 可选（`YYYY-MM-DD`）；`file` 支持 `*` / `**` / `?`。安全规则 `A21` 不可豁免。
- `boundaries`：A17 的补充声明。`external` / `generated` 填 import 前缀或 glob；`allowedImporters` 填允许 import 外部类型的文件（路径或 glob，相对 `--root`）；`generatedDirs` 填生成物根目录（相对 `--root`），目录内文件即使没有生成头也按生成物处理。
- 命中的 findings 不参与退出码，但仍出现在报告的 `Ignored` 表与 JSON 的 `ignored`；过期的条目不生效，列在 `Expired Exceptions`。
- gate 在 `--root` 下通过 shell 执行，注入 `CI=1`；失败时报告尾部 40 行 / 4000 字符。
- `check` 不跑 gates；`audit` 默认跑；`plan` 只在 `--with-gates` 时跑。
- 通用规则内置，业务门禁只编排、不复制。构建指引见 [`docs/shared/04-gates.md`](./docs/shared/04-gates.md)。

## 目录

```text
SKILL.md      标准 agent skill 入口（skills add / skills-npm 使用）
docs/shared/          宪法、AI 契约、审计契约、门禁、模式、提示词、术语表
docs/frontend/        前端族卡、风格总图、架构、审计判定
docs/backend/         后端族卡、风格总图、架构、审计判定
scenarios/    前端 / 后端审计、新项目、代码架构报告、只出报告、重构评审
adapters/     generic 手动指针（其它 agent 统一指向 SKILL.md）
prompts/      输出格式
src/ + bin/   CLI（check / audit / plan / init）
tests/        node:test 用例
templates/    init --apply 的 app / library 骨架 + 架构报告模板
evals/        CLI eval fixtures + golden tasks（人工回归）
```

## 版本与稳定承诺

- semver；当前版本见 [VERSION](./VERSION)。
- **major**：只用于破坏性变更——规则 ID 语义变更、配置格式不兼容、JSON 输出结构变化。
- **minor**：新能力——CLI 选项、检查规则、适配器、模板、向后兼容的配置字段。
- **patch**：修复、文档、提示词、测试、CI，或无行为变化的内部调整。
- 不按「感觉重要」升 major；`2.0` 不设时间表。
- 规则 ID `A1–A21` 稳定；增删规则属于 minor 以上的变更。
- 报告始终携带版本号；跨版本对比以 JSON 为准。
- 版本历史见 [CHANGELOG.md](./CHANGELOG.md)；计划不在仓库内维护。

## FAQ

- **静态检查误报怎么办？** 在 `codecraft.config.json` 的 `ignore` 里登记 `rule` + `file` + `reason`，必要时加 `expires`；不要直接删规则。
- **`Files: 0` 是什么意思？** 没有扫到源文件，命令会输出警告并以 2 退出；用 `--pack app|library` 指定正确类型，或检查 `--root`。
- **怎么装到指定 agent？** `npx skills add ultime-space/skills --skill codecraft`；交互选 agent，或用 `-a <agent>` 非交互。安装路径由 `skills` CLI 维护，本 skill 不枚举。
- **`check` / `audit` / `plan` 有什么区别？** `check` 只跑内置规则；`audit` 额外跑 config 里的 gates；`plan` 只读，把 findings 转成计划，默认不跑 gates。
- **为什么不自动跑 typecheck / test？** 门禁由项目提供，Codecraft 只编排，避免第二套实现。
- **monorepo 为什么被判成 app / library？** 有 `pages/`、`app/`、`manifest.json + pages.json`、Taro / uni-app / Vue CLI 标记、单页 Web 入口或嵌套应用时按 `app`；有 `packages/` 或 `src/` 时按 `library`；仍不确定就显式传 `--pack`。
- **支持后端吗？** 支持，读 `docs/backend/` 一轨；后端轨不绑定运行时与框架，CLI 本身仍需 Node.js >= 20。后端审计按 `docs/backend/13-audit.md` 人工补齐，不把 CLI 的 `0 findings` 当通过。
- **同一个仓库前后端都有，怎么审计？** 分两次跑：先说明端与目录（`client/` / `server/`），每次只读该端族卡与审计文件；不要在一次报告里混用两端判定。
- **支持哪些文件？** A2 / A6 / A11 / A17 扫描 JS/TS 相关扩展名与 `package.json`；A21 额外扫描配置与后端源码（`.yml` / `.yaml` / `.env` / `.properties` / `.xml` / `.java` / `.kt` 等）里的明文密钥。其它语言仍不在检查范围。

## 边界

- 静态检查是文本级：能覆盖高置信模式，可能漏报或误报；最终以项目门禁与 review 为准。
- 结构规则（A2 / A6 / A11 / A17）只扫描 JS/TS 相关文件（`.ts` / `.tsx` / `.js` / `.jsx` / `.mjs` / `.cjs` / `.vue` / `.svelte`）与 `package.json`；A21 额外扫描配置与后端源码扩展名（见上），但只做密钥 / 内部路径模式匹配，不做语言级分析。
- 压缩 / 构建产物（≤3 行且存在 >1000 字符的单行）不参与 A2 / A6 / A11 / A17，避免与源码重复报同一问题；A21 仍会扫描它们。
- `.agents` / `.trae` / `.claude` / `.cursor` 等 agent 安装目录不扫描，避免把已安装 skill 的 fixture 当项目代码。
- `--exclude` 是扫描级排除，不产生 findings；它不能替代 `ignore`（后者用于登记已发现问题的例外，且 A21 不可豁免）。
- 不内置任何业务规则、框架约定或公司内部门禁。
- 不读取、不上传代码；所有检查在本地完成。

## 贡献与安全

- 贡献流程：[CONTRIBUTING.md](./CONTRIBUTING.md)
- 漏洞与密钥报告：[SECURITY.md](./SECURITY.md)
- 许可：MIT
