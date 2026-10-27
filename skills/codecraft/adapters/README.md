# Adapters（适配器）

Core 是 `docs/` + `scenarios/` + `scripts/`；adapters 只做入口，不复制规则。

- `generic/AGENTS.md`：任何读 `AGENTS.md` 的 agent
- `trae/SKILL.md`：Trae skill
- `claude/SKILL.md`：Claude skill
- 未来：Cursor / Copilot / Gemini 等

规则：adapter 只写“读什么、按什么流程、输出什么”，规则正文留在 `docs/`。

包根的 [`SKILL.md`](../SKILL.md) 是标准 agent skill 入口（`skills add` / `skills-npm` 使用）；本目录的平台文件用于手动指针接入。两者二选一，不要同时维护两套正文。

使用者提示词（怎么对 AI 说）：[`../docs/07-ai-prompts.md`](../docs/07-ai-prompts.md)。
