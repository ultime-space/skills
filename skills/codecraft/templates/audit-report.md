# <项目 / 模块> A1–A21 审计报告（Codecraft）

> 模式：Audit（只读）· 日期：YYYY-MM-DD · 仓库：`<repo>` · 分支：`<branch>` · HEAD：`<sha>`
> 范围：`<目录 / 包>` · 规则版本：Codecraft `<version>` · 端：前端 / 后端
> 依据：`docs/shared/08-audit-contract.md` + `docs/frontend/09-audit.md` 或 `docs/backend/13-audit.md`
> 只读声明：未改代码、未起服务。未执行：`<typecheck / build / 单测>`。
> 口径：只做规范体检；结构叙事用 `templates/architecture-report.md`；单域深挖用 `templates/specialist-report.md`。

## 1. 结论

- 一句话结论：
- 计数：pass `<n>` / warn `<n>` / fail `<n>` / na `<n>`
- 最高风险：
- 置信度：High / Medium / Low（依据：静态 + 人工抽样 + 关键路径）

## 2. 范围与方法

| 项 | 内容 |
|---|---|
| 范围 | |
| 已执行 | |
| 未执行 | |
| 覆盖边界 | |
| 静态检查 | `codecraft check` 的 `files / findings` 与排除项 |
| 盲区 | 前端 A17 / A21；后端事务 / 幂等 / 迁移未由 CLI 覆盖 |

## 3. 逐条判定（A1–A21）

| ID | 判定 | 证据 | 局限 |
|---|---|---|---|
| A1 | pass / pass（静态）/ warn / fail / na | `path:line` 或命令 | |
| … | | | |

- 不适用写 `na` 并说明原因。
- `0 findings` 只能写「静态检查未命中」，不能写成通过。
- 与证据矛盾时按一致性检查降级。

## 4. 差距与优先级

| 优先级 | 问题 | 证据 | 影响 | 建议 |
|---|---|---|---|---|
| P0 | | | | |
| P1 | | | | |
| P2 | | | | |
| P3 | | | | |

## 5. 升级计划

| 阶段 | 内容 | 可回滚 | 验收 |
|---|---|---|---|
| 0 | | | |
| 1 | | | |

- 不写时间估算；每阶段一个可验收的垂直切片。

## 6. 待确认

| # | 问题 | 为什么无法确认 | 需要谁 / 什么证据 |
|---|---|---|---|
| 1 | | | |

## 7. 证据与命令

```bash
# 本次执行的检查
```

- 相关文件：
- 相关文档：
