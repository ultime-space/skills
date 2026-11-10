# Gates（两层门禁）

> Codecraft 只内置“规范性通用门禁”；业务门禁由项目实现，Codecraft 负责编排与汇总。
> 示例命令按 JS/TS 生态（`pnpm`）书写；gate 契约本身与语言无关，JS/TS 后端项目同样适用。

## 1. 两层模型

| 层 | 负责 | 例子 | 是否内置 |
|---|---|---|---|
| **Universal（通用）** | Codecraft | A2 / A11 / A17、密钥扫描、文档路径 | 是 |
| **Business（业务）** | 项目 | typecheck、单测、lint、契约测试、视觉回归、迁移检查 | 否，通过 config 调用 |

原则：**通用规则内置，业务门禁编排。** 不复制项目门禁，避免第二套实现。

## 2. Gate Contract（门禁契约，2.0）

声明采用 **pre-commit 形状**（行业收敛共识，不发明新形状）：

| 字段 | 必填 | 说明 |
|---|---|---|
| `id` | 是 | gate 标识（1.x 的 `name` 已移除，职责并入 `id`） |
| `entry` | 是 | 可直接运行的命令（1.x 的 `run` 已移除） |
| `args` | 否 | 字符串数组，追加在 `entry` 后 |
| `files` / `exclude` | 否 | glob 作用域；`--changed` / `--since` 模式下，变更文件不落在作用域内的 gate 跳过（不算失败）；全量模式不评估 |
| `output` | 否 | 结构化输出声明：`sarif` / `junit` / `gitlab`（GitLab Code Quality）；声明后解析 issue 数 |
| `threshold` | 否 | 三元组 `{ metric: "issues", operator: "<|<=|>|>=|==", value: N }`，SonarQube 惯例，条件以失败口吻陈述；**必须同时声明 `output`**（否则配置期报错）；issue 数解析不出时按失败处理（fail-closed） |
| `timeoutMs` | 否 | 默认 `120000` |

每个 gate 还必须满足：

- 命令可直接运行，不需要交互；
- 退出码 `0` 成功、`1` 失败、`2` 用法 / 配置错误；
- stdout 输出结论，stderr 输出日志；能输出结构化格式（SARIF / JUnit / GitLab Code Quality）时在 `output` 声明，报告可获得 issue 计数与阈值判定；
- 幂等；除非是 Apply 模式，否则只读；
- 失败时输出下一步，不只输出堆栈。

gate 失败判定：**退出码非 0 或 `threshold` 条件为真**；作用域跳过不算失败。不引入 OPA / Rego（对 lint 类门禁过重）。

## 3. 配置

配置示例以 [`codecraft.config.example.json`](../../codecraft.config.example.json) 为唯一可执行真源；字段说明见 [`README.md`](../../README.md) 的「配置」。本文只保留门禁契约，不再复制 JSON。

- `pack`：`app` / `library` / `design-system` / `auto`；CLI `--pack` 优先。
- `gates`：数组；2.0 pre-commit 形状（`id` / `entry` / `files` / `exclude` / `args` / `output` / `threshold` / `timeoutMs`），见上「Gate Contract」。
- `ignore`：例外登记（A12）；`rule` / `file` / `reason` 必填，`expires` 可选。过期条目不生效，报告中单列；安全规则 `A21` 不可豁免。
- `exclude`：扫描级排除，与 `--exclude` 合并。
- `boundaries`：A17 的补充声明；`external` / `generated` 填 import 前缀，`allowedImporters` / `generatedDirs` 填相对 `--root` 的路径或 glob。
- 配置文件默认 `codecraft.config.json`；可用 `--config` 指定。

## 4. 按项目类型选门禁

| 项目类型 | 通用 | 业务 |
|---|---|---|
| **App** | A6 / A17 / A21（A4 人工评审） | typecheck、单测、e2e、视觉回归 |
| **Library** | A2 / A6 / A11 / A21 | build、单测、exports 检查、依赖对账 |
| **Design System** | A2 / A6 / A11 / A21 | 构建、契约快照、视觉回归、a11y |
| **Docs** | A21 | 死链、三线头、交付白名单 |

### 4.1 内置规则

| Rule | Pack | 检查 |
|---|---|---|
| A2 | library / design-system | 包不 import apps；相对路径不逃逸；workspace 依赖必须声明 |
| A6 | all | 空 catch / 静默 Promise handler（文本级；`.catch(() => {})` 等空 handler、仅注释、仅返回 `null` / `undefined` / `{}`；注释不构成豁免） |
| A11 | library / design-system | 生成物必须有“勿手改 / 派生”标记 |
| A17 | app | **所有内部文件**不 import `external/` / `generated/`（Wrapper / API / adapters 目录与 `allowedImporters` 放行）；生成类型按文件头（`本文件由…生成` / `勿手改` / `@generated`）自动识别；自定义路径用 `boundaries` 补充 |
| A21 | all | 高置信密钥模式（私钥 / AWS / 阿里云 `LTAI` / GitHub / Slack / API key）；配置与后端源码中的明文 `password` / `secret` / `apiKey` / `accessKey` 赋值；环境变量引用与占位符不报。密钥 findings 带 `critical: true`（报告置顶，不可 ignore 豁免、不收录进 baseline），severity 仍为 `warn`——阻断只随 `--ci` |
| A21 | design-system | 包内公开文档（README / USAGE / CHANGELOG / contract）不引用内部 `docs/` |

A4（单一收口）是结构判断，仍由 review / 项目门禁负责，不由静态扫描替代。

### 4.2 CI 用法

```bash
codecraft check --changed --ci                  # PR 只拦变更文件
codecraft check --since origin/main --ci        # 以 merge-base 为基准，CI 检出干净工作区时用这条
codecraft check --changed --format sarif > codecraft.sarif
```

`--changed` / `--since` 只过滤 findings；底层仍做全量扫描。CI 检出的是干净工作区，此时单独 `--changed` 无变更文件会以 2 退出并提示改用 `--since <base>`。SARIF 可直接上传 GitHub Code Scanning。

### 4.3 存量接入（baseline）

- `baseline` 记录已接受的存量 findings；启用后只对**新增**问题失败；
- `--update-baseline` 只在本地 / 迁移期使用；CI 不允许生成，否则等于把新问题写进豁免；
- 只减不增：已有基线时拒绝新增条目，确需重建用 `--force`，并在 PR 说明原因；
- baseline 不替代 `ignore`：单点例外仍用 `rule` / `file` / `reason` / `expires` 登记，到期复核；
- 基线文件随仓提交；升级工具后若指纹漂移，重新生成并单独提交。

## 5. 执行顺序

1. 快速静态（内置规则、lint）；
2. typecheck；
3. 单测；
4. 契约 / 集成；
5. 视觉 / e2e；
6. 交付检查。

失败策略：默认继续跑完再汇总；`--fail-fast` 遇到第一个失败即停止。

## 6. 安全

- gates 是任意命令，只能来自可信配置；不要对 fork PR 或不可信仓库跑 `audit`。
- `audit` 从 2.0 起默认只跑静态规则；**gates 需要显式 `--run-gates`**，配置了 gates 未执行时 stderr 告警（`--no-gates` 显式跳过则不告警）。
- gate 输出全文捕获（不再截断尾部），进入报告前做高置信脱敏（私钥 / 令牌 / Authorization / 带凭据连接串 → `[REDACTED]`，命中数记入 `redacted`）；`--no-gate-output` 可整体省略输出。
- gate 继承完整 `process.env`：它能读到 CI 里的全部环境变量，这是「只能来自可信配置」的原因之一；本工具不收紧 env（会打断真实 gate），项目侧用最小权限的 CI 凭据。
- 执行前打印命令；`--ci` 下非交互。
- 不把密钥写进 config；用环境变量或 secret manager。
- 不让 gate 修改工作区，除非明确是 Apply 模式。

## 7. Codecraft 的职责

- `check`：只跑内置规则。
- `audit`：内置规则（+ 显式 `--run-gates` 时的 config gates），汇总成一份报告。
- `plan`：只读升级计划；默认不跑 gates，`--with-gates` 才跑。
- `init`：dry-run 脚手架，只输出目录 / 文件 / 配置；不跑业务门禁。
