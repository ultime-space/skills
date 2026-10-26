# Templates

`init --apply` 使用的项目骨架。占位符：`{{name}}`（展示名）/ `{{id}}`（package.json 名）。

| 目录 | 内容 |
|---|---|
| `app/` | 应用骨架：`README.md` + `package.json` |
| `library/` | 包骨架：`README.md` + `CHANGELOG.md` + `compat.md` + `package.json` |

- 目录结构由 `src/init.mjs` 定义，模板只提供文件内容。
- 页面 / 组件 / Wrapper 的单文件形态见 `docs/01-family-cards.md`，不单独出模板：不同框架的写法差异大于共性。
