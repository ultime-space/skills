# 代码族卡 v1（11 个环节 · JS/TS）

> 2026-10-27 · v1 稳定版。
> 用途：把《代码宪法 v1》落到每个代码族（环节）；不同族可以不同形状，族内必须同形。
> 形状与示例原生优先：TS + 原生 Web API（DOM / fetch / CustomEvent）为默认；框架示例只给 Vue 3 / React。
> 其它框架不预建，先在 §12 扩展位登记。
> 前端专用族：Page / Component；Node 后端只复用结构与边界类族。
> 术语：English（中文）。

## 0. 卡模板

每个代码族写清：**职责 / 形状 / 命名 / 契约 / 状态与错误 / 测试 / 正例 / 反例 / 验收**。

> 族是「环节」，不是必须模块；项目没有这个职责时，这一族可以不存在。

## 0.1 适用范围

| 族 | 前端 | Node 后端 | 备注 |
|---|---|---|---|
| Page | ✅ | ❌ | 后端无对应物，不要硬造 |
| Component | ✅ | ❌ | 同上 |
| Behavior | ✅ | ⚠️ | 对应 domain service；core 不依赖框架仍成立 |
| Transport | ✅ | ✅ | 后端是 client / adapter |
| Wrapper | ✅ | ✅ | 防腐层，规则一致 |
| Type | ✅ | ✅ | 联合类型等验收项按语言替换 |
| Package | ✅ | ✅ | 包边界、版本、public API 规则通用 |
| State | ✅ | ⚠️ | 状态机 / 领域状态可用；computed 换成同义派生 |
| Util | ✅ | ✅ | 纯函数，规则一致 |
| Script | ✅ | ✅ | 脚本通用 |
| Test | ✅ | ✅ | 分层测试策略通用 |

> ✅ 直接用；⚠️ 思路可用、形状要按项目重写；❌ 不适用。

## 1. Page（页面）· 前端专用

- **职责**：组合根；路由入口；只做编排、布局、状态展示；不承载业务规则。
- **形状**：`pages/<domain>/index.html` + `index.ts`（原生）；`index.vue`（Vue）；`index.tsx`（React）。页面级类 `page-*`；页面骨架固定为顶栏 / 内容 / 底栏 / 弹层四插槽（组件名按项目命名）。
- **命名**：目录 kebab-case；页面级类 `page-*`（标作用域，不做装饰）；组件名原生用 kebab-case 自定义元素，Vue / React 用 PascalCase。
- **契约**：接收路由参数；调用 Behavior Layer（行为层）；渲染 loading / empty / error / success；不直接 import api。
- **状态与错误**：页面状态由 Behavior Layer 提供；页面只持有纯 UI 状态（弹窗、tab）；错误必须可见。
- **测试**：集成 / 视觉回归；纯 UI 不写单元测试。
- **正例**：列表页只组合列表组件与行为层；详情页只组合详情组件与行为层。
- **反例**：页面直接 import api；页面里写请求与转换；多个互斥布尔。
- **验收**：lint「pages 不 import `@/api`」；路由 / 页面清单；视觉回归。

## 2. Behavior Layer（行为层）· 前端为主

- **职责**：页面无关的行为；状态转移、校验、编排；不放 UI、不放平台细节。
- **形状**：默认 `behavior/<domain>/<verb>.ts`（纯 TS，不依赖框架）；需要框架绑定时再加薄适配 `useXxx.ts`（Vue composable / React hook）。
- **命名**：`xxxCore` / `xxxBehavior` 核心；`useXxx` 适配器；一个文件一个动词；同族一种前缀。
- **契约**：入参 / 选项明确；返回状态 + 动作；不藏模块级单例；core 不 import 框架。
- **状态与错误**：状态用联合类型；派生用纯函数（Vue `computed` / React selector）；预期失败用 Result / 域变体。
- **测试**：core 属性测试；适配器集成测试。
- **正例**：`listBehavior` + `useList`（适配层）；`refreshList(state, fetchPage)`。
- **反例**：适配层直接 toast / 跳转；模块级可变状态；为一次性页面逻辑硬抽 composable。
- **验收**：依赖规则「behavior core 不 import vue / react 或其它框架运行时」；状态转移测试；`any` lint。

## 3. Transport（传输层）

- **职责**：网络、HTTP、取消；原样透传；不解释业务 code。401 / 日志是可选环节；外部契约转换在 Wrapper（包装层）。
- **形状**：`api/` 或 `request/`；`adapter/` / `interceptors/` / `modules/`；默认用原生 `fetch` + `AbortController`，框架封装只作可选实现；`pending/` / `console/` 是可选环节，不是必须目录。
- **命名**：API 文件 snake_case 且与 URL 同名；一 URL 一文件。新代码推荐 `api/<domain>/<action>.ts` + `fetchXxx` / `getXxx`；旧项目可保留 `api_` 前缀（防重名、可搜索、标层）；同族不要混用。
- **契约**：返回 raw response 或传输层结果；不产出域类型；错误只做传输层归一。
- **状态与错误**：无 UI 状态；401 单一收口；超时 / 取消 / 网络错误；不弹业务 toast。
- **并发与去重**：可选环节；查询默认共享 in-flight（同一 key 返回同一 Promise），变更默认按 key 去重；可按 route / page / instance 隔离 scope；可用第三方库或不实现。
- **日志**：可选环节；dev-only 结构化日志（request id / method / url / timing / status）；prod 静默；可用第三方 APM 或不实现。
- **测试**：契约测试 / mock server；边界 schema 校验在域解析器。
- **正例**：`adapter + interceptors` 组合；`createApi` 工厂统一注入 baseURL / 超时 / 错误归一。
- **反例**：传输层把业务 code 解析成域变体；transport import store / UI；全局单例藏副作用。
- **验收**：lint「transport 不 import UI / store」；401 / pending 测试；契约测试。

## 4. Wrapper（包装层）

- **职责**：外部契约适配；把后端 / 第三方的类型、字段、code 转成内部类型 / 错误；不放业务规则、不放 UI。
- **形状**：`adapters/<source>/` 或 `api/<domain>/<source>.ts`；一个外部来源一个适配器。
- **命名**：`fromXxx` / `toXxx` / `parseXxx`；外部类型只在包装层内命名（如 `BackendUser` / `ThirdPartyArticle`）。
- **契约**：输入外部 raw / 外部类型；输出内部 `Xxx` / `Result`；外部字段不泄漏。
- **状态与错误**：把外部 code / 错误映射成内部错误分类；不弹 toast、不做 UI。
- **测试**：fixture / 契约测试；第三方响应快照。
- **正例**：gen-api 类型 → 内部 `User`；资讯平台 → `Article`；支付渠道 → `PaymentResult`。
- **反例**：页面直接 import `UserDto`；内部类型叫 `UserVo`；第三方字段名出现在 UI。
- **验收**：lint「内部代码不 import `external/` 或生成类型」；Wrapper 单测；换源不改内部。
- **转换示例**：一个后端接口返回三个系统的数据 → Wrapper 拆成 `FinanceSummary / OperationsSummary / SupportSummary` 三个内部模型；三个页面各取所需，不共享一个「大而全」的后端类型。
- **导入规则**：只有 Wrapper / API 层可以 import `external/`；页面 / 组件 / 行为层不得 import。

## 5. Type（类型）

- **职责**：描述三层形状——External（外部）/ Domain（领域）/ View（视图）；不放行为。
- **形状**：
  - `external/<source>/`：保持外部原名，勿手改；
  - 单应用：`types/common/`；单仓多包且前后端同为 TS：可用 `shared/types/` 作为前后端单一类型源（只放类型 / 契约；业务类型留应用；跨应用业务建领域包）；
  - `types/<domain>/`：业务类型（`Xxx / XxxQuery / XxxInput / XxxView / XxxResult / XxxError / XxxState / XxxOptions`）；
  - UI 类型（`XxxProps / XxxEmits`）放组件目录或 `types/<domain>`。
- **项目决策**：`shared` 不是强制层；后端非 TS 时用 external + Wrapper；只有一个消费者时不建 shared。
- **特殊**：`shared/types/` 不能变成杂物间；跨应用业务类型用 `packages/domain-<x>`。
- **命名**：按《代码宪法 v1》§3.1（外部保持原名；通用中性；业务后缀角色；不用 `I` / `model_xxx`）；本卡不重复全表。
- **依赖**：General ← Business；Business 不 import External；UI 只消费 Business / General。
- **契约**：外部类型只被 Wrapper import；页面 / 组件 / 行为层只用内部类型。
- **状态与错误**：类型里不允许不可能组合；互斥状态用联合类型。
- **测试**：类型测试（tsd / expect-type）可选；Wrapper 契约测试。
- **正例**：`BackendUser` → `toUser()` → `User` → `UserView`。
- **反例**：页面直接 import `BackendUser`；内部类型命名为 `UserDto`；用后端类型定义页面 loading / error 状态。
- **验收**：lint「pages / components / behavior 不 import `external/` 或生成类型」；生成物 CI 比对。

## 6. Package（包）

- **职责**：一个可发布的单一能力单元；有明确 public API、版本与兼容责任。
- **类型**：App（应用）/ Shared Types（类型）/ Toolkit（工具包）/ UI（UI 包）/ Adapter（适配包）；Assets / Docs / Temp 是目录，不是包。
- **开放清单**：包类型不是封闭枚举；组织自由；包内高内聚；新增类型按职责命名，不强套现有类型。
- **目录优先**：资源 / 文档默认是目录，不是包；跨应用共享 + 需要版本 / 兜底 / 离线 / public API 时才升包；文件存储不设默认（OSS / 本地 / CDN / 仓库 / `.local`）。
- **形状**：`packages/<name>/{src,package.json,README.md,CHANGELOG.md,compat.md,tests}`；`exports` 明确公开入口。
- **目录**：`apps/` 只放交付物；`packages/` 只放可复用能力；应用不跨 app import。
- **共享类型**：`shared` 是包，不是特殊目录（`packages/types` / `packages/shared-types`）；只在前后端同为 TS + 多消费者时建。
- **外部类型**：跟 Wrapper 走；应用本地 `apps/<app>/src/external/`；跨应用 `packages/contracts-<source>/`。
- **命名**：推荐 `@scope/<capability>`；工具包可 `@scope/toolkit-<capability>` 或 `@scope/<capability>`；不强制定式；同仓一种风格；禁止 `utils` / `common` / `helpers`。
- **契约**：只暴露 public API；禁止深层 import；跨包只走包名 + `exports`。
- **兼容性**：工具包负责平台兼容矩阵；每端 smoke / contract test；不把兼容责任丢给应用。
- **版本**：semver + changelog；破坏性变更 major；发布不可覆盖。
- **正例**：PDF 导出工具包、`shared/types`、tokens / UI 包。
- **反例**：`utils` 包；工具包 import 应用；包内混入业务页面。
- **验收**：`boundaries`；包 build / test；`exports` 检查；兼容矩阵。

## 7. Component（组件）· 前端专用

- **职责**：UI 展示与交互；只消费 props / emit；不取数、不放业务规则；可复用、可组合。
- **形状**：`components/<Name>/index.html` + `index.css`（+ 可选 `index.ts`）；Vue `index.vue`；React `index.tsx`；全局原语放 `app-ui/`；页面私有组件放页面目录。
- **命名**：原生自定义元素 kebab-case；Vue / React 组件 PascalCase；`app-` 用于全局原语；角色后缀 `XxxCard / XxxList / XxxForm / XxxModal / XxxPage`；类型 `XxxProps / XxxEmits`（Vue / React）。
- **契约**：attributes / properties 下行、`CustomEvent` 上行（Vue / React 对应 props / emit）；不 import api / behavior；不读业务 store（仅全局身份 / 权限例外）；样式 scoped / BEM；可访问性（键盘 / ARIA / 对比度）。
- **状态与错误**：只持有纯 UI 状态（open / hover / focus）；loading / empty / error 由 props 传入；不吞错。
- **测试**：示例页 / Storybook；交互测试；视觉回归；a11y。
- **正例**：页面骨架组件、`XxxCard`、`XxxGrid`。
- **反例**：组件内发请求；组件直接读业务 store；组件里写路由；为覆盖样式包一层无业务组件。
- **验收**：lint「components 不 import api / behavior」；props / emits 类型；a11y / visual checks。

## 8. State（状态）

- **职责**：领域状态建模；状态是数据，不是布尔堆；转移通过事件 / 动作。
- **形状**：默认纯 TS：`types/<domain>` 的联合类型 + `behavior/<domain>/core.ts` 的 reducer / state machine；store 只存数据 + setter，框架只做订阅与派生。
- **命名**：`XxxState` / `XxxStatus` / `XxxEvent` / `XxxAction`；通用 `AsyncState / ListState` 放 `types/common`。
- **契约**：状态用联合类型；非法状态不可表示；`success` 有 data，`error` 有 error；派生用纯函数（Vue `computed` / React selector）。
- **错误**：错误分类；预期失败用 Result / 域变体；空 catch 为零。
- **测试**：状态转移表 / 属性测试；关键流程。
- **正例**：`listBehavior` 的 status；auth machine；form state。
- **反例**：`loading / error / data` 三个布尔；store 放请求逻辑；派生状态另存一份。
- **验收**：`assertNever`；`satisfies Record<Union, T>`；状态转移测试。

## 9. Util（工具）

- **职责**：纯函数、无副作用、可单测；不依赖框架 / 业务状态。
- **形状**：`utils/<domain>/index.ts` 或单文件；跨项目通用工具放 `packages/toolkit-*`；领域工具放 `utils/<domain>`。
- **命名**：`toXxx / fromXxx`、`isXxx / hasXxx`、`parseXxx / formatXxx`、`assertXxx`；避免 `helper / utils / common` 大杂烩。
- **契约**：输入输出明确；不读全局；不弹 toast / 不跳路由；不写 DOM 交互（DOM / 平台适配放 adapter / ui）。
- **错误**：纯函数返回 Result / 默认值；不抛业务异常；处理边界输入。
- **测试**：属性测试 / 边界测试；纯函数。
- **正例**：date / format、palette、categories、queryString。
- **反例**：util 里发请求 / 读 store；util 里写业务规则；`utils` 包什么都装。
- **验收**：lint「utils 不 import api / store / ui」；纯函数测试；覆盖率。

## 10. Script（脚本）

- **职责**：开发 / 构建 / 生成 / 审计 / 迁移；不是运行时业务代码。
- **形状**：`scripts/<verb>-<object>.ts`；包内 `scripts/`；生成物不手改。
- **命名**：`build-*`、`gen-*`、`audit-*`、`sync-*`、`migrate-*`；动词开头。
- **契约**：参数 / 环境变量明确；幂等；stdout 出数据、stderr 出日志；退出码 0 / 1 / 2；不隐式改工作区。
- **错误**：失败即非零退出；错误信息包含下一步；不吞错。
- **测试**：脚本 smoke test；fixture；CI 运行。
- **正例**：`gen-api`、`tokens`、`boundaries`、`design-audit-code`。
- **反例**：脚本依赖本机私有路径；脚本无退出码；脚本隐式改文件；脚本里写业务。
- **验收**：`--check` 模式；CI；用法文档。

## 11. Test（测试）

- **职责**：保护契约与关键路径；不是追覆盖率。
- **形状**：`tests/` 或 `__tests__/`；fixture 单独；命名 `<unit>.test.ts`；默认 `node:test`，组件交互 / 视觉测试再按项目选工具。
- **命名**：`describe('<unit> · <behavior>')`、`it('does X when Y')`；中英文随项目，保持一致。
- **契约**：
  - Pure core → 属性测试 / 单元测试；
  - Behavior adapter → 集成测试；
  - Wrapper → 契约测试 / fixture；
  - Page / Component → 交互 / 视觉 / a11y；
  - Script → smoke / exit code；
  - 不测框架 / 第三方内部。
- **覆盖重点**：非法状态、错误分支、取消 / 重试、边界输入；不只 happy path。
- **正例**：`_shared/list` 分页；`derive` 对比度；Wrapper fixture。
- **反例**：为覆盖率写断言；mock 一切；只测 happy path；测试实现细节。
- **验收**：CI；关键路径覆盖；bug fix 附回归测试。

## 12. 扩展位

当前收录的框架示例：Vue 3、React；其它框架不预建目录与示例，先在这里登记。

登记时补四项：入口形状、状态派生方式、组件契约（props / events）、测试工具。
