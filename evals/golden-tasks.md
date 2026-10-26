# Golden Tasks（评估任务）

用于验证 skill 是否真的按规范工作。每条任务记录：结果、版本、误报 / 漏报。

## 1. 新项目架构计划

- 输入：一个 mp + admin 的小项目，后端契约未知。
- 模式：Plan（只读）。
- 期望：选 L0/L1；列必需 / 可选环节；出目录树；分阶段计划；不改文件。
- 失败信号：直接生成代码；把所有环节都设为必需；不标未定项。

## 2. 旧项目审计

- 输入：一个页面直接 import api、store 放请求的旧项目。
- 模式：Audit（只读）。
- 期望：引用 A3/A4/A17；给 severity；给升级计划；不改文件。
- 失败信号：只给泛泛建议；无文件证据；顺手改代码。

## 3. 新增页面

- 输入：按族卡新增一个列表页。
- 模式：Apply。
- 期望：页面只组合；不 import api；loading/empty/error 可见；跑门禁。
- 失败信号：页面里写请求；错误被吞；状态用多个布尔。

## 4. 新增 Wrapper

- 输入：第三方接口字段与内部类型不一致。
- 模式：Apply。
- 期望：外部类型只在 Wrapper；内部类型 `Xxx`；错误归一；不改调用方。
- 失败信号：页面直接 import 外部类型；内部类型叫 `XxxDto`；字段泄漏到 UI。

## 5. 评审一个边界违规

- 输入：一个 diff，内部组件 import `external/`。
- 模式：Review（只读）。
- 期望：命中 A4/A17；给最小改法；不改文件。
- 失败信号：没发现；建议大重构；直接改代码。

## 6. Library 审计

- 输入：一个 `packages/` 仓库，core 导入了未声明的 workspace 包；`dist/tokens.css` 没有“勿手改”标记。
- 模式：Audit（只读，`--pack library`）。
- 期望：命中 A2 / A11；只读；报告带包名与文件。
- 失败信号：把 `tokens.json`（seed 源文件）误判成生成物；漏掉未声明依赖。

## 7. Gates 汇总

- 输入：`codecraft.config.json` 里一个 gate 成功、一个失败。
- 模式：Audit。
- 期望：报告列出两个 gate、失败输出、退出码 1；不改文件。
- 失败信号：跳过 gate；只报内置规则；不报告退出码。

## 8. Plan from findings

- 输入：一个含 A17 违规的项目。
- 模式：Plan（只读）。
- 期望：输出 P1 项、动作、验证命令；默认不跑 gates；不改文件。
- 失败信号：直接改代码；没有验证命令；把 warn 当 error 阻断。

## 9. Init dry-run

- 输入：一个空目录，`--name demo`。
- 模式：Init（dry-run）。
- 期望：输出 `apps/demo/...`、`docs/`、`codecraft.config.json`；目录仍然为空。
- 失败信号：写盘；缺 `src/pages` / `src/external`；没有 config 预览。

## 10. Init apply

- 输入：一个空目录，`--name demo --apply`。
- 模式：Init（apply）。
- 期望：目录与模板文件写入；README / package.json 的占位符已替换；再跑一次输出 Skipped、不覆盖已改文件。
- 失败信号：覆盖已有文件；`--apply` 缺 `--name` 仍写盘；占位符残留。

## 11. 模式选型

- 输入：一个 12 分支的导出格式选择，分支签名一致。
- 模式：Plan（只读）。
- 期望：先答选型四问；给 Strategy（策略）与代价；给反例；不改文件。
- 失败信号：只报模式名；没有代价；分支签名不同还硬做函数表。

## 评分

- 每条任务：pass / fail。
- 记录：版本、误报数、漏报数、审稿轮次。
- 目标：一次通过率上升，审稿轮次下降。
