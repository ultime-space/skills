# Changelog

## 1.6.0 - 2026-10-27

- 新增代码架构分析报告场景与模板：`scenarios/architecture-report.md`、`templates/architecture-report.md`。
- README 增加「适用场景」与不适用清单；明确 Codecraft 只做代码架构，不含业务架构。
- `docs/06-architecture.md` 收口为「代码架构设计方法」；`prompts/output.md` 增加架构报告输出指引。
- 统一术语写法：AI 面向文档英文裸写，`README` / 对外报告首次出现标注中文，名字类不附中文；新增 `docs/09-glossary.md` 与 `tests/docs.test.mjs`。

## 1.5.0 - 2026-10-27

- 新增 `--exclude <glob>`（可重复）：扫描级排除，用于 fixture / 第三方目录；报告头与 JSON 记录 exclude 模式。
- 新增 `npm run self-check`，CI 同步执行；仓库自检以 `--exclude 'evals/fixtures/**'` 达到 0 findings。
- 修正 README 与 FAQ 的扫描范围描述：A21 额外扫描配置与后端源码扩展名，结构规则仍只扫 JS/TS。
- pack 自动判定补齐 Vue CLI（`vue.config.*`）与单页 Web 入口（html + 框架依赖 + `src/main.*`），避免把 Vue / React 应用判成 `library`。
- 结构规则跳过压缩 / 构建产物（A21 不受影响），减少与源码重复的 A6 / A17 findings。
- A21 修正误报：`MYSQL_PWD="$VAR" cmd` 这类 shell 环境变量前缀不再算明文口令；引号值只取引号内内容。
- 扫描跳过 `.agents` / `.trae` / `.claude` / `.cursor` 等 agent 安装目录，避免把已安装 skill 的 fixture 当项目代码。
- 修复 A6 行号漂移：剥离注释时保留换行，空 catch 的行号与源码一致。
- A17 支持按文件头识别生成类型（`本文件由…生成` / `勿手改` / `@generated`），并解析相对路径与 `@/` `~/` `#/` 别名；生成的数据 / 资源模块不触发。
- A21 扩充：新增阿里云 `LTAI`、明文 `password` / `secret` / `apiKey` / `accessKey` 赋值扫描，覆盖 `.java` / `.kt` / `.properties` / `.xml` / `.env`；跳过环境变量、占位符与测试目录。
- 新增单元测试与 CLI eval（`a17-generated-header` / `a21-plaintext`）。
- 移除 `adapters/claude` / `adapters/trae` 等单 agent 入口；手动指针统一指向 `SKILL.md`，文档改用通用 `.agents` 表述。
- 新增 `docs/08-audit-contract.md`：逐条判定、证据门槛、静态边界、A1–A21 判定矩阵、一致性检查、P0–P3 与计划表。
- `prompts/output.md` 增加 A1–A21 全覆盖、证据 / 局限列、0 findings 声明与计数可复现要求。
- `docs/02-ai-contract.md` 与 `scenarios/audit-existing.md` 接入审计证据门槛。
- `SKILL.md` 路由与读法把审计指向 `08`；`README` 目录说明同步。
- 新增 A6 空 catch 静态检查（app / library）。
- A17 支持 `boundaries.external` / `boundaries.generated` 配置，覆盖约定外的生成类型路径。
- 新增 `--format sarif`（SARIF 2.1.0），可直接接 GitHub Code Scanning。
- 新增 `--changed` / `--since <ref>`：只报告变更 / 未跟踪文件中的 findings；底层仍全量扫描。
- 新增 GitHub Actions CI：`npm test` + `npm run eval` + `npm pack --dry-run`。
- 新增 `evals/run.mjs` + fixtures：覆盖 A6 / A17（含 boundaries）/ ignore / A11 / 0 文件 / SARIF。

## 1.4.0 - 2026-10-27

- 仓库改为 `skills/codecraft` 标准集合布局，可被 `skills` CLI 直接发现。
- 移除 `codecraft install`、agent 注册表与自定义 agent；安装改由 `npx skills add ultime-space/skills --skill codecraft` 或 `skills-npm` 负责。
- 发布 workflow、README、适配器与评测路径同步到集合布局。

## 1.3.0 - 2026-10-27

- 新增 agent 注册表：内置 generic / claude / cursor / trae / trae-cn，`--list-agents` 查看项目 / 全局路径与检测结果。
- 支持项目级 `codecraft.agents.json` 与用户级 `~/.codecraft/agents.json` 自定义 agent（project / global / markers），项目级覆盖用户级。
- `auto` 按注册表检测所有匹配的 agent，不优先任何一家；重复目标的 agent 自动合并，避免重复复制。
- 仍保留 `--dest` 作为临时目录逃生口。

## 1.2.1 - 2026-10-27

- 修复 pack 自动判定：识别 Nuxt 2 的 `pages/`、Nuxt 3 的 `app/`、uni-app 的 `manifest.json + pages.json`、Taro / uni-app 依赖，以及 workspace 内的嵌套应用。
- 新增 `trae-cn` 安装目标（`~/.trae-cn/skills`）；`--agent` 顺序改为 generic / claude / cursor / trae / trae-cn，不再默认优先 Trae。
- 扫描 0 个源文件时输出警告并以 2 退出，避免把空扫描当成通过。
- README 补充 agent 列表、`--dest`、`Files: 0` 与 Trae CN 的说明。

## 1.2.0 - 2026-10-27

- 新增 `ignore` 例外配置（A12）：`rule` / `file` / `reason` 必填，`expires` 可选；支持 `*` / `**` / `?` 路径匹配；安全规则 `A21` 不可豁免。
- 命中例外的 findings 不再影响退出码，但仍在报告的 `Ignored` 表和 JSON 的 `ignored` / `exceptions` 中可见；过期例外汇总到 `Expired Exceptions`。
- 错误信息补充下一步：root 不存在、config 非法、pack 不匹配、未知命令。
- README 增加 FAQ 与版本口径；`docs/04` 与配置示例补充 `ignore`。
- 文档明确范围：JS/TS、默认前端、示例原生优先、Node 后端只复用结构规则；框架示例只保留 Vue 3 / React，其它框架留扩展位。

## 1.1.0 - 2026-10-27

- 新增根 `SKILL.md`，兼容 Agent Skills / `skills-npm`；安装 `@ultime/codecraft` 后可被自动发现。
- 新增 `codecraft install`：自动检测 Claude / Trae / Cursor，写入 `.agents/skills` 与对应目录；支持 `--agent` / `--global` / `--dest` / `--force` / `--dry-run`。
- README 增加三种安装方式：`skills-npm`、内置安装器、手动指针。
- `docs/07-ai-prompts.md` 与 adapters 补充安装入口。

## 1.0.3 - 2026-10-27

- 文档从 v0 草稿固化为 v1 稳定版。
- 示例门禁改为通用 typecheck / test / lint，不再出现项目专用命令。
- 适配器描述加入中文触发词，不读文档时也能更准确地触发。
- README 增加 5 分钟上手教程；Skills 集合 README 去除自用表述。
- CI 使用 Node 22，并在发布前检查版本是否已存在。
- 新增 CLI 测试：version / help / 未知命令 / `--ci` / init 参数校验。

## 1.0.2 - 2026-10-27

- 新增 `docs/07-ai-prompts.md`：可直接复制的 AI 提示词，覆盖审计 / 报告 / 新项目 / 评审 / 架构 / 模式 / 脚手架 / Design System。
- README 增加「让 AI 怎么说」入口；adapters 增加提示词指针。

## 1.0.1 - 2026-10-27

- 规范化 `bin` 路径，源码与发布元数据一致。
- README 增加 npm 包链接。
- CI：推送 `codecraft-v*` tag 自动发布，发布前校验 tag 与版本一致。

## 1.0.0 - 2026-10-26

首个稳定版本。

### 规则体系

- 代码宪法：五条元判据（M1–M5）+ 二十一条不变量（A1–A21），每条含理由与验收。
- 代码族卡：11 个代码族的职责、形状、命名、契约、状态与错误、测试、正反例、验收。
- AI 生成契约：先读顺序、禁止项、模式边界与安全红线。
- 风格总图：中性总览，用于跨项目复用。
- 设计模式工具箱：按「力」选型，不按模式名字选型。
- 架构设计方法：档位、七步法、C4 最小集、边界切分、依赖规则、ADR、反模式与评审清单。

### CLI

- 命令：`check` / `audit` / `plan` / `init` / `version`。
- Rule Packs：`app` / `library` / `design-system` / `auto`。
- 内置检查：A2（包依赖方向）、A11（生成物标记）、A17（内部不 import external / generated）、A21（密钥扫描与公开文档路径）。
- `init` 默认 dry-run；`--apply --name <name>` 写入 app / library 骨架，已存在路径跳过、不覆盖。
- 输出 Markdown（默认）或 JSON；报告带版本号与规则 ID。
- 退出码：`0` 通过、`1` 有 error 或 gate 失败、`2` 用法 / 配置错误。
- 选项：`--root`、`--pack`、`--config`、`--format`、`--severity`、`--ci`、`--fail-fast`、`--no-gates`、`--with-gates`。

### 门禁

- 两层模型：通用规则内置，业务门禁由项目实现、由 `codecraft.config.json` 编排。
- Gate Contract：非交互、幂等、只读、有超时（默认 120s）、失败输出下一步。
- `audit` 汇总内置规则与业务 gate；`plan` 默认只读，`--with-gates` 才执行门禁。
- `--fail-fast` 在第一个 gate 失败时停止。

### 适配器与脚手架

- 适配器：generic（`AGENTS.md`）、Trae（`SKILL.md`）、Claude（`SKILL.md`）。
- 场景：新项目、旧项目审计、只出报告、重构评审。
- 统一输出格式：结论 / 证据 / 差距与风险 / 计划 / 验证 / 下一步。
- 模板：`app` 与 `library` 的 README、package.json、CHANGELOG、compat。

### 工程

- MIT 许可；贡献流程与安全报告流程。
- `node:test` 用例覆盖内置规则、gates、CLI 与脚手架。
- golden tasks 用于人工回归。
