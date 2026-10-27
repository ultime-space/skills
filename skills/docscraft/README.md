# Docscraft

面向 JS/TS 仓库的文档组织与 AI 上下文治理 skill。

它解决的不是“怎么把文档写得漂亮”，而是：

- 同一事实是否只有一份正文
- 人、agent、维护者是否各有清晰入口
- 规则是否分为事实 / 约束 / 判断，并有 owner 与到期
- 文档是否与代码、生成物、链接、示例一起漂移
- AI 是否能在正确的上下文里工作，而不是靠猜

## 安装

```bash
npx skills add ultime-space/skills --skill docscraft
```

交互选择 agent；非交互用 `-a <agent>`，全局加 `-g`。安装路径由 `skills` CLI 维护，本 skill 不枚举 agent。

## 常用场景怎么说

先说模式（Audit（审计）/ Plan（计划）/ Apply（执行））、范围、读者。下面可以直接复制。

**文档审计**

```text
用 Docscraft 审计本仓库文档，Audit 模式，只读。
范围：根 README / AGENTS / rules / docs；重点找重复真源、入口缺失、过期规则和死链。
```

**重整文档结构**

```text
用 Docscraft 按 scenarios/reorganize-docs.md 给迁移计划，Plan 模式，只读。
范围：<目录>；先给目标分层和迁移表，确认后再改。
```

**写 ADR（架构决策记录）**

```text
用 Docscraft 按 scenarios/write-adr.md 写一份 ADR。
背景：<...>；候选：<A / B>；要求写取舍、后果和验证，不复制规范全文。
```

**治理规则 / 检查 AI 入口**

```text
用 Docscraft 按 scenarios/review-rules.md 治理规则，Audit 模式。
重点：事实 / 约束 / 判断分类、owner 与复核日期、入口是否只做索引。
```

更多场景见 [`scenarios/`](./scenarios/) 与 [`prompts/output.md`](./prompts/output.md)。

## 适用

- 仓库已有 README，但 agent 仍经常读错规则
- `AGENTS.md`、`rules/`、`docs/` 之间职责不清
- 同一规则在多处维护，改一处漏一处
- 文档里的数字、类型、命令已经过期
- 需要把决策理由与现行规范分开
- 想给 AI 一个稳定入口，但不想把整仓文档塞进上下文

## 不适用

- 代码架构与分层：用 Codecraft
- 业务组件 / API 设计
- 纯文案润色、排版美化
- 客户名、本机路径、个人偏好；这些不应进入通用 skill

## 结构

```text
docscraft/
├── SKILL.md
├── docs/
│   ├── 00-principles.md
│   ├── 01-layers.md
│   ├── 02-doc-types.md
│   ├── 03-ai-context.md
│   ├── 04-drift-guards.md
│   ├── 05-rule-types.md
│   ├── 06-adr.md
│   └── 07-glossary.md
├── scenarios/
│   ├── audit-docs.md
│   ├── reorganize-docs.md
│   ├── write-adr.md
│   └── review-rules.md
├── prompts/output.md
├── templates/
│   ├── AGENTS.md
│   ├── rules.md
│   └── adr.md
├── evals/golden-tasks.md
├── tests/                 结构与术语测试
├── package.json
├── VERSION
└── CHANGELOG.md
```

## 验证

```bash
npm test              # 结构、版本对齐、相对链接、SKILL 路由路径
npm pack --dry-run    # 检查发布内容
```

改动文档结构或新增场景时，同步更新 `SKILL.md` 路由表；测试会检查被引用的路径是否存在。

## 三条底线

1. **单一真源**：一条事实只留一份正文；其它地方只放指针。
2. **读者分层**：README 给人，AGENTS 给 agent，rules 给细则，docs 给交付，ADR（架构决策记录）给决策。
3. **可验证**：能用命令 / 链接 / 生成物 / 示例验证的，不靠记忆。

## 参考与方法来源

Docscraft 是内部方法整理，不复制外部正文。设计时对照过：

- Diátaxis（文档按用户需求分类）
- Write the Docs · Docs as Code（文档同仓、同评审、自动化检查）
- Kubernetes 文档内容指南：canonical link（规范链接）、反双份正文
- ADR（决策与理由分离）
- AGENTS.md / Agent Skills（人机入口分离、渐进披露）
- GitHub Spec Kit（规格 → 计划 → 任务 → 实现 → 收敛）
- Anthropic Context Engineering（上下文工程） / Claude Code Best Practices（上下文有限、先探索再计划、给验证手段）
- Vale / lychee（术语与死链检查）

只借机制，不复制文本、目录或示例。

## 版本

当前版本见 [VERSION](./VERSION)；变更见 [CHANGELOG.md](./CHANGELOG.md)。
