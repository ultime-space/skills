# Adapters（适配器）

Core 是 `docs/` + `scenarios/` + `scripts/`；adapters 只做入口，不复制规则。

- `generic/AGENTS.md`：任何读 `AGENTS.md` 的 agent

其它 agent 使用自己的入口文件，统一指向包根 [`SKILL.md`](../SKILL.md)；不为单一 agent 维护专属文件。

规则：adapter 只写“读什么、按什么流程、输出什么”，规则正文留在 `docs/`。

包根的 [`SKILL.md`](../SKILL.md) 是标准 agent skill 入口（`skills add` / `skills-npm` 使用）；本目录只保留通用手动指针。

使用者提示词（怎么对 AI 说）：[`../docs/shared/07-ai-prompts.md`](../docs/shared/07-ai-prompts.md)。
