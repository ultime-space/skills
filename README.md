# Skills

> 面向 AI 编程的 skill 集合。每个 skill 可独立安装、独立版本，文档、适配器与实现都在各自目录内。

## Skills

| Skill | 说明 | CLI |
|---|---|---|
| [Codecraft](./codecraft/README.md) | 语言无关的代码规范：审计、计划、架构、脚手架与门禁编排 | `npx @ultime/codecraft` |

## 快速使用

以 Codecraft 为例：

1. 把入口接到 agent：`.trae/rules/codecraft.md`、`CLAUDE.md` 或 `AGENTS.md`。
2. 对 AI 说：`用 Codecraft 审计本项目，只读，不改文件。`

完整步骤见 [Codecraft 的 5 分钟上手](./codecraft/README.md#5-分钟上手)。

## 约定

- 每个 skill 自包含：文档、适配器、脚本、版本都在自己的目录里。
- 根目录不设统一版本；skill 各自 semver。
- 根目录只维护索引与仓库级文件（`.gitignore`、本 README）。
- skill 之间不互相 import；需要共享时先提炼成独立 skill。
