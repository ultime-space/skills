# Changelog

## 0.7.0 - 2026-10-26

- `init --apply`：写入 app / library 骨架；已存在路径跳过，不覆盖；`--apply` 必须带 `--name`。
- 新增 `templates/`：app 与 library 的 README / package.json / CHANGELOG / compat。
- 新增 `docs/05-patterns.md`：按力选型的设计模式工具箱。
- 适配器与 golden tasks 同步 `init --apply` 与模式选型。
- 测试：18 个用例通过。

## 0.6.0 - 2026-10-26

- 新增 `init`（dry-run）：输出要创建的目录 / 文件 / 配置，不写盘。
- 支持 `--name` 指定 app / package 名称；`--apply` 暂未实现。
- 测试：16 个用例通过。

## 0.5.0 - 2026-10-26

- 新增 `plan`：只读，把 findings 转成可执行的升级计划。
- 默认不跑 gates；`--with-gates` 才跑配置里的 gates。
- 输出：Summary / Plan（P1…）/ Action / Verification；JSON 包含 `plan`。
- 测试：13 个用例通过。

## 0.4.0 - 2026-10-26

- 新增 gates 编排：`audit` 跑内置规则 + `codecraft.config.json` 的 gates。
- 新增 `--config` / `--no-gates`；JSON 报告包含 gate 结果。
- 新增 `docs/04-gates.md`：通用门禁 vs 业务门禁、Gate Contract、配置与执行顺序。
- 新增 `codecraft.config.example.json`。
- 测试：11 个用例通过。

## 0.3.0 - 2026-10-26

- 新增 `--pack app|library|auto`。
- `library` 包：A2（包依赖方向）/ A11（生成物标记）。
- `app` 包：A4 / A17（内部不 import external / generated）。
- 跳过 `tokens.json`（seed 源文件），生成物接受“生成物 / 派生 / 勿手改”等标记。
- 测试：7 个用例通过。

## 0.2.0 - 2026-10-26

- CLI：`codecraft check`，先做 A4 / A17。
- `audit` 作为 `check` 的只读别名；`plan` / `init` 计划中。
- 输出：Markdown 默认，`--format json` 可选。
- 测试：Node 内置 `node:test`。

## 0.1.0 - 2026-10-26

- 建立源文件：宪法、族卡、AI 契约、风格总图。
- 场景：新项目、旧项目审计、只出报告、重构评审。
- 适配器：generic / Trae / Claude（骨架）。
