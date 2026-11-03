# Agent Loop（agent 自检循环）

> 定位：AI 改完代码后用 CLI 自证清白的闭环；这是 skill 与 CLI 真正的咬合点，也是与「只出不执行」检查器的差异所在。

## 何时用

- agent（或人）在 Apply 模式改完代码，需要在收尾前验证没引入新问题。
- 长会话里连续多次改代码，需要一个廉价的确定性回归信号。

不适用：首次体检（用 Audit 模式）；设计新架构（用 New Project）。

## 三步循环

1. **改前基线**：`codecraft check --format json`（记下 findings；有 Baseline 的项目直接 `check`）。
2. **改后点检**：只验证触碰到的规则——`codecraft check --rules <触碰规则> --ci`（非 0 就继续修）。`--rules` 是 pack 的过滤器，config 的 pack 仍是唯一真源。
3. **修完全量**：`codecraft check`（有 Baseline 加 `--baseline`）；`--compare <上次.json>` 可给出新增 / 消失的趋势。

`--ci` 把所有 findings 视为 error（exit 1）；默认不带 `--ci` 时只报告、不阻断。退出码 2 是用法错误，先修命令再改代码。

## 步骤（作为 agent 工作流的一环）

1. 改代码前跑一次 `check`，把 findings 数记进上下文；这是「新增」的参照。
2. 改完先跑点检：从本次 diff 推断触碰的规则族（改了 catch → A6；改了 import / 依赖 → A17 / A2；改了配置 / 提交内容 → A21）。
3. 点检非 0：按 findings 修复，重跑点检；不要放宽规则或往 `ignore` 里塞没有理由的条目。
4. 收尾跑全量 `check`；有 Baseline 的项目跑 `check --baseline`，存量静默、新增阻断。
5. 需要趋势时保存本次 JSON 并在下次用 `--compare` 对比。

## 边界

- 静态规则只有 A2 / A6 / A11 / A17 / A21（按 pack）；结构 / 状态类规则（A4 / A5 / A8 等）仍靠 review 与测试，`0 findings` 不等于通过。
- 不自动改 CI 配置 / hooks / `package.json` scripts；是否阻断由人确认（见 SKILL.md 禁止项）。
- 安全规则 A21 命中即停止改代码，先脱敏、提示轮换，再继续。

## 停止条件

- 全量 `check`（含 Baseline，如有）退出码 0，且 findings 数不多于改前。
- 点检过的规则族在报告里可见（`rules` 字段），未覆盖的规则写明原因。
