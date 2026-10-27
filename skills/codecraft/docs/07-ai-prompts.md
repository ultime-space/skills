# AI 使用提示词（Prompts）

> 用途：给使用者一份可以直接复制的说法，让 AI 按 Codecraft 的模式工作。
> 范围：提示词按 JS/TS 项目写；Node 后端只复用审计 / 架构 / 评审类提示词。
> 读法：先看「最小开场」，再按场景复制；提示词不替代规则，规则正文仍在 `docs/`。
> 关系：入口见 `adapters/`；输出格式见 `prompts/output.md`；约束见 `02-ai-contract.md`。

## 1. 先让 AI 找到 Codecraft

最快的方式：

```bash
npx skills add ultime-space/skills --skill codecraft
```

交互选择 agent；非交互用 `-a <agent>`，全局加 `-g`。

或走 npm 同步：

```bash
npm i -D @ultime/codecraft skills-npm
npx skills-npm setup
```

装好后项目里会有 `.agents/skills/codecraft/SKILL.md`（以及检测到的 agent 目录）。

也可以手动在 agent 入口里留一条指针，不要复制规则：

- 通用：`AGENTS.md`
- Claude：`CLAUDE.md`
- Trae：项目 `.trae/rules/codecraft.md`

```md
代码任务先读 <Codecraft 仓库路径>/skills/codecraft/adapters/<平台>/...
```

平台对应：Trae → `adapters/trae/SKILL.md`，Claude → `adapters/claude/SKILL.md`，其他 → `adapters/generic/AGENTS.md`。

## 2. 最小开场

任何任务都可以先用这段，再补场景：

```text
使用 Codecraft（<Codecraft 仓库路径>/skills/codecraft）。
模式：Audit / Plan / Apply。
范围：<目录 / 包 / 文件 / diff>。
任务：<一句话>。
要求：先读 docs/00-constitution.md 和相关族卡；Audit / Plan 不改文件；按 prompts/output.md 输出。
```

模式：

- **Audit**：只读，出报告。
- **Plan**：只读，出计划。
- **Apply**：改代码 + 跑门禁，先确认范围。

## 3. 场景模板

### 3.1 旧项目审计（Audit）

```text
使用 Codecraft（<路径>/codecraft）。
模式：Audit，只读，不改文件。
范围：当前仓库。
任务：按 scenarios/audit-existing.md 做一次体检。
要求：逐条对照 A1–A21，标 pass / warn / fail；每条结论给文件路径、行号和 A-ID；最后给差距清单和分阶段升级计划。
```

### 3.2 只出报告（Report Only）

```text
使用 Codecraft（<路径>/codecraft）。
模式：Audit。
范围：<目录>。
任务：只出 findings，不做升级计划，不写文件。
要求：按 scenarios/report-only.md 输出；每条 finding 有 severity、证据、影响、一句话建议；附版本号和扫描范围。
```

### 3.3 新项目设计（Plan）

```text
使用 Codecraft（<路径>/codecraft）。
模式：Plan，只读。
输入：业务目标 <...>；端 <mp/app/web/admin>；团队规模 <...>；交付周期 <...>。
任务：按 scenarios/new-project.md 设计架构。
要求：先选规模档位（L0/L1/L2），再选环节、目录、契约；给分阶段计划，每阶段一个可验收的垂直切片。
```

### 3.4 重构 / 评审（Review / Apply）

```text
使用 Codecraft（<路径>/codecraft）。
模式：Review（只评审）或 Apply（执行）。
范围：<diff / 文件 / 模块>。
任务：按 scenarios/refactor-review.md 评审。
要求：先列问题（边界 / 状态 / 错误 / 命名 / 注释 / 生成物），再给最小改动计划；能不改就不改；Apply 后跑门禁。
```

### 3.5 架构设计

```text
使用 Codecraft（<路径>/codecraft）。
模式：Plan。
任务：按 docs/06-architecture.md 给候选架构。
要求：先定档位和边界，再给 2–3 个候选方案与代价表；不要直接替我做决定；需要时用 ADR 记录取舍。
```

### 3.6 模式选型

```text
使用 Codecraft（<路径>/codecraft）。
模式：Plan。
任务：在 <场景> 下按 docs/05-patterns.md 选型。
要求：先说明要解决的「力」（变化点 / 约束 / 代价），再给候选模式；不要按模式名字反推需求。
```

### 3.7 脚手架

CLI：

```bash
npx @ultime/codecraft init --root . --name <name>
npx @ultime/codecraft init --root . --name <name> --apply
```

对 AI 说：

```text
使用 Codecraft（<路径>/codecraft）。
模式：Apply。
任务：按 codecraft init 的 app / library 骨架创建 <name>；先给 dry-run 清单，确认后再 --apply；已存在路径不覆盖。
```

### 3.8 Design System 审计

CLI：

```bash
npx @ultime/codecraft check --pack design-system --root .
```

对 AI 说：

```text
使用 Codecraft（<路径>/codecraft）。
模式：Audit。
范围：packages/。
任务：按 design-system pack 审计包依赖、生成物标记、密钥和公开文档路径。
要求：不要改文件；按 A2 / A11 / A21 归类；给最小修复计划。
```

## 4. 说法上的要点

- 先说模式，不要让 AI 猜。
- 给范围：目录 / 包 / 文件 / diff。
- 要求「先读后做」，只读相关族卡，不要一次加载全部。
- 要求证据和验证命令；结论要能反解到 A-ID。
- 不要用「优化一下」「看着改」这类没有范围的说法。
- 安全红线不可豁免；发现密钥立即停止并提示轮换。

## 5. 参考

- [02-ai-contract.md](./02-ai-contract.md)
- [04-gates.md](./04-gates.md)
- [../prompts/output.md](../prompts/output.md)
- [../scenarios/](../scenarios/)
