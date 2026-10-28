# Output Format（输出格式）

默认 Markdown；JSON 仅用于 CLI / CI。Audit 还必须满足 `docs/shared/08-audit-contract.md` 与对应端的审计文件（`docs/frontend/09-audit.md` / `docs/backend/13-audit.md`）。

## Markdown

```md
## 结论

## 范围与方法

## 逐条判定（A1–A21）

| ID | 判定 | 证据 | 局限 |
|---|---|---|---|
| A1 | pass | `src/pages/home/index.vue:1` | 仅抽样 |

## 差距 / 风险

## 计划

## 验证

## 下一步
```

## 架构报告

代码架构分析报告按 [`../templates/architecture-report.md`](../templates/architecture-report.md) 输出；默认不画图，用表格 / 列表表达结构；证据、局限与 `0 findings` 口径同 Audit。

## 规则

- A1–A21 全部出现；不适用写 `na` 并说明原因。
- 每条结论引用 A-ID，并给文件行号或可复现命令；计数必须带检索式。
- `pass` 必须有证据；只有静态检查通过时写 `pass（静态）`，不能替代人工抽样。
- `codecraft check` 的 0 findings 只能写「静态检查未命中」；同时写明 A17 / A21 的覆盖盲区。
- 涉及密码、传输、密钥、令牌时先读 `docs/shared/09-security.md`；命中禁止项写入「差距 / 风险」并标 P0，给替代方案与验证命令。
- 涉及登录、会话、权限时先读 `docs/shared/10-auth.md`；前端守卫与隐藏按钮不能作为授权证据，命中 P0 写入「差距 / 风险」。
- 涉及文件存储、上传时先读 `docs/shared/11-storage.md`；密钥进前端、前端拼 key、永久 URL 入库按 P0 / P1 写入「差距 / 风险」。
- 报告按用途选模板：全面分析用 `templates/architecture-report.md`；A1–A21 体检用 `templates/audit-report.md`；新项目设计用 `templates/architecture-design.md`；单域深挖用 `templates/specialist-report.md`。
- 出结论前做一致性检查：A4 / A8 / A11 / A17 / A21 与证据矛盾时必须降级。
- 不写敏感信息；示例用占位符。
- 英文术语首次出现用 `English（中文）`。
- 不把“计划”写成“已完成”。
- Audit / Plan 模式只输出报告，不改文件。
- 计划每阶段可回滚，验收用命令或检索结果，不写时间估算。
