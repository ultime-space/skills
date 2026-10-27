# Contributing（贡献指南）

> 定位：给贡献者与 AI 的最短协作规则；规范正文在 `docs/`。
> 状态：现行（2026-10）。
> 关系：行为约束见 `docs/shared/02-ai-contract.md`；门禁口径见 `docs/shared/04-gates.md`。

## 工作流

1. 从 `main` 切分支：`feat/<主题>` / `fix/<主题>`。
2. 开发完成后 `git rebase main`，再合并回 `main`；主分支不保留中间提交。
3. 一次提交一件事；提交信息用 `type(scope): subject`，正文写「为什么」。

## 改规则

- 先改本地底稿，确认后再改 `docs/`；不在本仓保留调研来源。
- 规则改动必须同时更新：规则正文、`evals/golden-tasks.md`、相关测试。
- 契约类改动（档位 / 命名 / 单位 / 角色）整族刷新，不做零散小改。

## 验证

```bash
npm test
npm run eval
npm run self-check
npm pack --dry-run
node bin/codecraft.mjs check --root <项目>
```

- 新增 / 修改规则必须补测试；没有反例的规则降级为「参考」。
- 不提交密钥、客户名、内部路径；发现疑似凭据立即停止并提示轮换。

## 版本号

只按 semver，不按「感觉重要」升 major：

- **major**：破坏性变更——规则 ID 语义变更、配置格式不兼容、JSON 输出结构变化。
- **minor**：新能力——CLI 选项、检查规则、适配器、模板、向后兼容的配置字段。
- **patch**：修复、文档、提示词、测试、CI，或无行为变化的内部调整。
- `2.0` 不设时间表；没有破坏性变更就不进 major。
- v1 内容收口未完成前不发版；内容变更先累积在 `CHANGELOG.md` 的 Unreleased。
- 发布前同时改 `VERSION`、`package.json`、`CHANGELOG.md`，并跑 `npm test` 与 `npm pack --dry-run`。
