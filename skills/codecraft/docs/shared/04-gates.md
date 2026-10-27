# Gates（两层门禁）

> Codecraft 只内置“规范性通用门禁”；业务门禁由项目实现，Codecraft 负责编排与汇总。
> 示例命令按 JS/TS 生态（`pnpm`）书写；gate 契约本身与语言无关，JS/TS 后端项目同样适用。

## 1. 两层模型

| 层 | 负责 | 例子 | 是否内置 |
|---|---|---|---|
| **Universal（通用）** | Codecraft | A2 / A11 / A17、密钥扫描、文档路径 | 是 |
| **Business（业务）** | 项目 | typecheck、单测、lint、契约测试、视觉回归、迁移检查 | 否，通过 config 调用 |

原则：**通用规则内置，业务门禁编排。** 不复制项目门禁，避免第二套实现。

## 2. Gate Contract（门禁契约）

每个 gate 必须满足：

- 命令可直接运行，不需要交互；
- 退出码 `0` 成功、`1` 失败、`2` 用法 / 配置错误；
- stdout 输出结论，stderr 输出日志；
- 幂等；除非是 Apply 模式，否则只读；
- 有超时；默认 120s；
- 失败时输出下一步，不只输出堆栈。

## 3. 配置

```json
{
  "pack": "auto",
  "gates": [
    { "name": "typecheck", "run": "pnpm typecheck", "timeoutMs": 120000 },
    { "name": "test", "run": "pnpm test", "timeoutMs": 120000 }
  ],
  "ignore": [
    { "rule": "A17", "file": "src/pages/legacy/**", "reason": "legacy page", "expires": "2026-12-31" }
  ],
  "boundaries": {
    "external": ["@/types/external"],
    "generated": ["@/types/project"]
  }
}
```

- `pack`：`app` / `library` / `design-system` / `auto`；CLI `--pack` 优先。
- `gates`：数组；每项必须有 `run`，可选 `name` / `timeoutMs`。
- `ignore`：例外登记（A12）；`rule` / `file` / `reason` 必填，`expires` 可选。过期条目不生效，报告中单列；安全规则 `A21` 不可豁免。
- `boundaries`：A17 的补充路径；生成类型优先按文件头识别，`external` / `generated` 填 import 前缀或 glob，覆盖头部无标记或路径不在约定内的项目。
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
| A6 | all | 空 catch / 静默失败 |
| A11 | library / design-system | 生成物必须有“勿手改 / 派生”标记 |
| A17 | app | `pages / components / behavior` 不 import `external/` / `generated/`；生成类型按文件头（`本文件由…生成` / `勿手改` / `@generated`）自动识别；自定义路径用 `boundaries` 补充 |
| A21 | all | 高置信密钥模式（私钥 / AWS / 阿里云 `LTAI` / GitHub / Slack / API key）；配置与后端源码中的明文 `password` / `secret` / `apiKey` / `accessKey` 赋值；环境变量引用与占位符不报 |
| A21 | design-system | 包内公开文档（README / USAGE / CHANGELOG / contract）不引用内部 `docs/` |

A4（单一收口）是结构判断，仍由 review / 项目门禁负责，不由静态扫描替代。

### 4.2 CI 用法

```bash
codecraft check --changed --ci                  # PR 只拦变更文件
codecraft check --changed --format sarif > codecraft.sarif
```

`--changed` / `--since` 只过滤 findings；底层仍做全量扫描。SARIF 可直接上传 GitHub Code Scanning。

## 5. 执行顺序

1. 快速静态（内置规则、lint）；
2. typecheck；
3. 单测；
4. 契约 / 集成；
5. 视觉 / e2e；
6. 交付检查。

失败策略：默认继续跑完再汇总；`--fail-fast` 遇到第一个失败即停止。

## 6. 安全

- gates 是任意命令，只能来自可信配置。
- 执行前打印命令；`--ci` 下非交互。
- 不把密钥写进 config；用环境变量。
- 不让 gate 修改工作区，除非明确是 Apply 模式。

## 7. Codecraft 的职责

- `check`：只跑内置规则。
- `audit`：内置规则 + config gates，汇总成一份报告。
- `plan`：只读升级计划；默认不跑 gates，`--with-gates` 才跑。
- `init`：dry-run 脚手架，只输出目录 / 文件 / 配置；不跑业务门禁。
