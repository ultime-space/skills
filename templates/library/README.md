# {{name}}

> 代码包骨架。边界约定见 codecraft 宪法 A2（依赖向内）/ A11（生成物只读）。

## 结构

| 路径 | 职责 |
|---|---|
| `src/` | 实现；对外只暴露 public contract |
| `tests/` | 测试：契约 / 单元 |
| `compat.md` | 兼容矩阵：支持范围与不可用能力 |
| `CHANGELOG.md` | 版本变更 |

## 规则

- 不 import 上层应用（`apps/`）。
- 不通过相对路径逃出自身目录。
- 依赖必须写进 `package.json`。
- 生成物必须有「勿手改 / 派生」标记。
- 破坏性变更升 major；发布不覆盖。

## 验证

```bash
codecraft check --pack library
```
