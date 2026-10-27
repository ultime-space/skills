# Changelog

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
