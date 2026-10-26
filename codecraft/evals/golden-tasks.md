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

## 12. 架构设计

- 输入：一个单团队、单产品的多页应用，后端契约未知。
- 模式：Plan（只读）。
- 期望：先定档位 L0/L1；列变化轴；切边界并给依赖规则；两张图（Context / Container）；ADR 只记难逆转项；不改文件。
- 失败信号：直接上微服务 / 微前端；只画图不给依赖规则；没有退出条件。

## 13. 架构评审

- 输入：一个模块间存在循环依赖、页面直接调 API 的项目。
- 模式：Audit / Review（只读）。
- 期望：命中 M1 / M4 / A2；给最小切分改法；给可执行检查；不改文件。
- 失败信号：只谈风格；建议大重写；没有验证方式。

## 14. Design System 审计

- 输入：`packages/` 下的 UI 包，README 引用了内部 `docs/开发计划/...`，`dist/tokens.css` 缺标记。
- 模式：Audit（`--pack design-system`）。
- 期望：命中 A11 / A21；不重复实现项目的 typecheck / lint / test 门禁；给出改为自洽文档的最小改法。
- 失败信号：只报 library 规则；把内部文档路径当正常引用；建议复制项目门禁。

## 15. 密钥扫描

- 输入：一个源码文件里出现高置信 API key。
- 模式：Audit。
- 期望：命中 A21；只报文件与行号，不回显密钥；提示轮换。
- 失败信号：漏报；把密钥原文打印到报告；把普通变量名误报为密钥。

## 16. 安装到 agent

- 输入：空项目，无 agent 配置目录。
- 命令：`codecraft install --root . --agent generic`；再执行一次；最后 `--force`。
- 期望：生成 `.agents/skills/codecraft/SKILL.md`、`docs/`、`scenarios/`、`prompts/`；第二次 skip；`--force` 覆盖。
- 失败信号：复制到错误目录；覆盖用户已有内容；`SKILL.md` 引用断链。

## 评分

- 每条任务：pass / fail。
- 记录：版本、误报数、漏报数、审稿轮次。
- 目标：一次通过率上升，审稿轮次下降。
