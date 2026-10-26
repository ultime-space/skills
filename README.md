# Skills

> 自用 skill 集合。每个子目录是一个可独立使用的 skill；规则、实现和版本都在 skill 内，根目录只做索引。

## 包含

| Skill | 用途 | 入口 |
|---|---|---|
| [codecraft](./codecraft/README.md) | 语言无关的代码规范：审计、计划、架构、脚手架与门禁编排 | [`codecraft/adapters/`](./codecraft/adapters/README.md) |

## 使用

- 安装、接入 agent、命令与配置：见对应 skill 的 `README.md`。
- 新增 skill：在根目录建 `<name>/`，自带 README 与入口文件；根目录不复制规则正文。

## 约定

- 每个 skill 自包含：文档、适配器、脚本、版本都在自己的目录里。
- 根目录不设统一版本；skill 各自 semver。
- 根目录只放索引与仓库级文件（`.gitignore`、本 README）。
- skill 之间不互相 import；需要共享时先提炼成独立 skill。
