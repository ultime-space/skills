# Output Format（输出格式）

默认 Markdown；JSON 仅用于 CLI / CI。

## Markdown

```md
## 结论

## 证据

## 差距 / 风险

## 计划

## 验证

## 下一步
```

规则：

- 每条结论引用 A-ID 或文件路径。
- 不写敏感信息；示例用占位符。
- 英文术语首次出现用 `English（中文）`。
- 不把“计划”写成“已完成”。
- Audit / Plan 模式只输出报告，不改文件。
