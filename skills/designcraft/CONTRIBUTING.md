# Contributing（贡献指南）

> 定位：给贡献者与 AI 的最短协作规则；规范正文在 `docs/`。

## 工作流

1. 从 `main` 切分支：`feat/<主题>` / `fix/<主题>`。
2. 开发完成后 `git rebase main`，再合并回 `main`；主分支不保留中间提交。
3. 一次提交一件事；提交信息用 `type(scope): subject`，正文写「为什么」。

## 改动规则

- 规则改动必须同时更新：`docs/` 正文、`SKILL.md` 路由表、相关场景 / 测试。
- 契约类改动（目标值 / 命名 / 评审分级 / 边界）整族刷新，不做零散小改。
- 提炼不能新增知识库没有的规则；需要新增时先补对应主题文档，再同步场景与测试。
- `docs/patterns.md` 是经验方案，不是规则：新增条目只改它、`templates/option-set.md` 与 evals，不改判据，也不新增档位。

## 验证

```bash
npm test              # 结构、版本对齐、相对链接、SKILL 路由、适用范围头、纯知识检查
npm run release-check # 版本 / CHANGELOG / 打包清单 + 发布内容扫描
npm pack --dry-run    # 查看实际打包文件
```

- 新增 / 修改文档结构必须过 `npm test`；被引用的路径必须存在。
- `release-check` 会按 npm 实际打包清单扫描内部路径、内部包名、本地绝对路径与敏感文件；规则在 `scripts/check-package-content.mjs`，例外写在 `ALLOW` 并注明理由。
- 不提交密钥、客户名、内部路径；发现疑似凭据立即停止并提示轮换。

## 发布前自检

1. `VERSION` / `package.json` / `CHANGELOG.md` 版本一致（`npm test` 会校验）。
2. `npm test` 通过。
3. `npm run release-check` 通过。
4. `npm pack --dry-run` 确认打包清单只含预期文件。
5. 独立代理回归：至少覆盖入口、列表、详情、官网各一个样本；只给 skill 文件与页面路径，不给口头解释，不读既有评测记录。
6. 发布由维护者执行；先确认该版本未发布，再发布。

## 版本

只按 semver：

- **major**：破坏性变更——路由结构不兼容、模板字段删除、配置格式变化。
- **minor**：新能力——新场景、新模板、新规则文件、向后兼容的结构调整。
- **patch**：修复、文档、提示词、测试、CI，或无行为变化的内部调整。
