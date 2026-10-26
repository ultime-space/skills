# Roadmap

> 用途：Codecraft 后续版本的公开计划与交接说明，供人和其它 agent 窗口继续开发。
> 状态：1.0.3 已发布；以下为计划，不构成发布承诺。
> 关系：规则正文见 `docs/`；发布流程见 `CONTRIBUTING.md`；变更记录见 `CHANGELOG.md`。

## 1. 版本策略

- semver；规则 ID `A1–A21` 稳定。
- **patch**：文档、提示词、测试、CI、bug fix。
- **minor**：新增 CLI 能力、检查规则、适配器、模板；不破坏现有配置。
- **major**：规则 ID、配置格式或 JSON 输出结构的破坏性变更。
- 文档大版本（当前 `v1`）与包版本解耦；宪法 / 族卡整体重写时才升 `v2`。

## 2. 当前状态（1.0.3）

- 文档：宪法 v1、族卡 v1、AI 契约 v1、风格总图、模式、架构、门禁、AI 提示词。
- CLI：`check` / `audit` / `plan` / `init` / `version`；packs：`app` / `library` / `design-system` / `auto`。
- 内置检查：A2 / A11 / A17 / A21。
- 适配器：generic / Trae / Claude。
- 测试：26 个；npm 发布走 Trusted Publishing（OIDC）。

## 3. 下一步

### P0 · 1.1.0 可用性

- [ ] 配置支持例外：`ignore: [{ rule, file, reason, expires }]`，落地 A12 的例外登记；报告单列 ignored。
- [ ] `--format sarif`：接入 GitHub Code Scanning。
- [ ] `--changed` / `--since <ref>`：只检查改动文件，适合 CI。
- [ ] 错误信息补下一步：root 不存在、config 非法、pack 不匹配。
- [ ] README / `docs/07-ai-prompts.md` 增加常见问题（FAQ）。

### P1 · 1.2.0 检查深度

- [ ] A6：空 catch / 静默失败。
- [ ] A5：互斥布尔 / 非法状态（先做 TS 联合类型启发式）。
- [ ] A4：单一收口（入口 / 配置 / 提示 / 分页的重复实现）。
- [ ] A8：派生状态被重复存储。
- [ ] 规则误报评估：在 2–3 个真实仓库跑，记录误报率与豁免方式。
- [ ] 为每条新规则补正例 / 反例 fixture。

### P2 · 1.3.0 评估与适配

- [ ] 可执行 evals：`evals/run.mjs` 读取 golden tasks，输出通过率与失败原因。
- [ ] CI 增加 eval job：不阻断发布，失败只提醒。
- [ ] 适配器：Cursor / Copilot / Gemini 的入口文件，或统一 generic 指引。
- [ ] `init` 增加页面 / 组件 / Wrapper 单文件模板（仅当跨框架共性足够时）。

### P3 · 2.0.0（暂不启动）

- [ ] 多语言方言：Java / Go 的族卡与检查。
- [ ] 规则集分级（L0 / L1 / L2）与项目档位绑定。
- [ ] 输出 JSON schema 版本化。
- 启动条件：1.x 的误报率稳定，且至少有 3 个真实项目长期使用。

## 4. 非目标

- 不做业务组件库、请求层、路由。
- 不替代 typecheck / 单测 / e2e。
- 不内置公司内部门禁；只通过 config 编排。
- 不为每个框架写专属模板。

## 5. 新增 skill 的准入（skills 集合）

- 方法论稳定、可独立验证、与 Codecraft 不重叠。
- 自带 README、入口文件、版本与 CHANGELOG。
- 不复制 Codecraft 的规则正文；需要共享时先提炼成独立 skill。
- 候选方向（待定）：文档规范、测试策略、需求拆解。

## 6. 交接给其它 agent 窗口

先读：

1. `README.md`
2. `docs/00-constitution.md`、`docs/02-ai-contract.md`
3. `CONTRIBUTING.md`
4. 本文件

工作流：

```bash
git switch -c feat/<topic>
# 开发 + npm test
git rebase main
# 合并回 main（人工）
```

发布：

```bash
# 1. 改 VERSION、package.json、CHANGELOG
# 2. 提交并推送 main
git tag codecraft-vX.Y.Z
git push origin main
git push origin codecraft-vX.Y.Z
```

CI 使用 npm Trusted Publishing，不需要 `NPM_TOKEN`。

验收：

- `npm test` 全绿
- `node bin/codecraft.mjs check --root . --pack design-system` 0 findings
- `npm pack --dry-run` 内容符合预期
- `CHANGELOG.md` 只写用户可见变更

## 7. 待定问题

- 第二个语言方言选 Java 还是 Go？
- 是否把 `docs/` 拆成按主题的子目录？
- 例外配置放 `codecraft.config.json` 还是独立 `.codecraftignore`？
