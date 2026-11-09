# AGENTS.md — @ultime/skills

> 给在本仓库工作的 AI 与协作者：只放入口与红线。
> 定位：每个 skill 自包含；对外发布到 npm，包内内容会被外部读者直接看到。

## 先读

1. [`README.md`](./README.md) — 安装与 skill 索引。
2. 对应 skill 的 `SKILL.md` / `README.md` / `VERSION` / `CHANGELOG.md`。

## 红线

- **子包不写 Ultime 内部材料**：任何子包都不得包含 Ultime 内部目录（`docs/roadmap` / `docs/design-system` / `spec/` 等）、内部路径、内部包名、路线图或未发布内容。skills 是外发包，内部内容写进去就会随 npm 暴露。
- **概念 / 公式用抽象语言**：需要表达设计或工程判断时，写通用概念、条件与公式，不搬运内部正文、不写具体产品的实现细节。
- **跨包依赖只用已发布 npm 版本**：按版本声明，不引用其他包源码或根仓目录。
- **功能变更同批更新**：测试、README、`VERSION`、`CHANGELOG` 一起改；没有功能性更新时只改文档并写明。
- **包内只含自身内容**：每个 skill 目录独立自包含，不把其他 skill 或根仓材料复制进来。
