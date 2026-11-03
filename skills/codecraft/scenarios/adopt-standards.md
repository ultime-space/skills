# Adopt Standards（规范落地）

> 定位：把 Codecraft 宪法落到具体项目的 `rules/` 与门禁；不是照抄宪法，是裁剪与映射。

## 何时用

- 项目要采用 Codecraft 作为 AI 开发契约（写入 `AGENTS.md` / 项目 `rules/`）。
- 需要决定哪些规则进机检、哪些靠 review、哪些登记例外。

不适用：审计现状（用 Audit 模式）；设计新架构（用 New Project）。

## 输入

- 项目根、技术端（前端 / 后端）、现有 `AGENTS.md` / `rules/`。
- 团队规模与 CI 现状（有没有 PR 门禁、能不能跑命令）。

## 先读

1. 项目 `AGENTS.md` / `rules/`
2. `docs/shared/00-constitution.md`
3. 对应端族卡：`docs/frontend/01-family-cards.md` 或 `docs/backend/10-family-cards.md`
4. `docs/shared/04-gates.md`
5. [`codecraft.config.example.json`](../codecraft.config.example.json)

## 步骤

1. 逐条对照 A1–A21 与项目现状，分三类：**已满足**（写证据位置）/ **需落地**（给最小改法）/ **不适用**（写原因）。
2. 映射到门禁三层：**CLI enforces**（A6 / A17 / A21，library / design-system 另加 A2 / A11）；**项目门禁**（typecheck / test 等，写进 config `gates`）；**人工 review**（其余规则）。
3. 产出项目 `rules/` 增量：只写项目特定约定与指针，不复制宪法正文（单一真源；宪法变了跟着改指针）。
4. 产出 `codecraft.config.json`：`pack`、`gates`、`ignore`（带 `reason` / `expires`）、`exclude`；从 `codecraft.config.example.json` 起步，不要手写全量。
5. 给接入建议：从 L0（`check` 只报告）开始，进 Git 后再上 `--changed --ci`；**只给建议，不自动修改 CI 配置 / hooks / `package.json` scripts，是否阻断由人确认**。
6. 验证：`codecraft check` 跑通；`AGENTS.md` 的指针能被 agent 找到；`rules/` 无第二份宪法正文。

## 输出

- 规则映射表：规则 / 现状判定（已满足 / 需落地 / 不适用）/ 落点（机检 / review）
- `rules/` 增量与 `codecraft.config.json`
- 接入路径：当前档位（Local Advisory / Changed CI / Architecture）→ 下一档位的触发条件

## 停止条件

- 不复制宪法正文进项目文档。
- 不替用户提交 CI / hook 变更。
- 判断型规则只给选项与代价，不替人定稿。
