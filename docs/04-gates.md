# Gates（两层门禁）

> Codecraft 只内置“规范性通用门禁”；业务门禁由项目实现，Codecraft 负责编排与汇总。

## 1. 两层模型

| 层 | 负责 | 例子 | 是否内置 |
|---|---|---|---|
| **Universal（通用）** | Codecraft | A2 / A4 / A11 / A17、密钥扫描、文档路径 | 是 |
| **Business（业务）** | 项目 | typecheck、单测、`kit:check`、契约测试、视觉回归、迁移检查 | 否，通过 config 调用 |

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
    { "name": "kit", "run": "pnpm kit:check", "timeoutMs": 120000 }
  ]
}
```

- `pack`：`app` / `library` / `auto`；CLI `--pack` 优先。
- `gates`：数组；每项必须有 `run`，可选 `name` / `timeoutMs`。
- 配置文件默认 `codecraft.config.json`；可用 `--config` 指定。

## 4. 按项目类型选门禁

| 项目类型 | 通用 | 业务 |
|---|---|---|
| **App** | A4 / A17 | typecheck、单测、e2e、视觉回归 |
| **Library** | A2 / A11 | build、单测、exports 检查、依赖对账 |
| **Design System** | A2 / A11 | `kit:check`、契约快照、视觉回归、a11y |
| **Docs** | A21 | 死链、三线头、交付白名单 |

## 5. 执行顺序

1. 快速静态（内置规则、lint）；
2. typecheck；
3. 单测；
4. 契约 / 集成；
5. 视觉 / e2e；
6. 交付检查。

失败策略：默认继续跑完再汇总；`--fail-fast` 可后续加。

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
