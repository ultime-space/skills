# {{name}}

> 应用骨架。边界约定见 codecraft 宪法 A4（单一收口）/ A17（内外分离）。

## 目录

| 目录 | 职责 |
|---|---|
| `src/pages` | 页面：一个页面一个编排入口，只编排 |
| `src/components` | 展示与交互组件；原语薄、业务组件按域 |
| `src/behavior` | 页面无关行为：默认纯 TS core，框架绑定作薄适配（hooks / composables） |
| `src/api` | 请求收口；唯一可接触 `external/` 的层 |
| `src/adapters` | 平台适配（请求 / 存储 / 路由 / 导出） |
| `src/types` | 内部类型：通用层与业务层 |
| `src/external` | 外部契约（后端 / 第三方）原文或生成物 |

## 规则

- `pages / components / behavior` 不 import `external/` 或 `generated/`。
- 原生能表达的先写原生；Vue / React 只作页面与组件的落点。
- 外部类型只在 `api` / `adapters` 内转成内部类型。
- 鉴权失效、错误提示、分页各一处收口。
- 状态用联合类型；非法状态不可表示。

## 验证

```bash
codecraft check --pack app
```
