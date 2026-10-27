# 代码宪法 v1（JS/TS）

> 2026-10-27 · v1 稳定版。
> 用途：给人和 AI 的共同约束；适用于 JS/TS 项目，默认前端场景。
> 读者：团队 / AI（Design Specification）。
> 术语：English（中文）。

## 0. 范围与读法

| 项 | 内容 |
|---|---|
| 覆盖 | JS/TS；Web 前端为默认场景 |
| 可复用 | Node 后端：M1–M5 与 A1–A21 中的结构、边界与安全规则 |
| 部分适用 | A5 / A6 / A8 的验收列是 TS / 前端写法（`assertNever` / `satisfies` / `computed`）；其它实现只要证明同一不变量即可 |
| 示例顺序 | 原生（TS / Web API）→ Vue 3 / React → 其它框架（不预建，族卡 §12 登记） |
| 不在范围 | Page / Component 等前端族；数据库、缓存、并发、事务；其它语言 |

> 读法：§1 元判据 → §2 不变量 → 按主题查 §3 → 族形查《代码族卡 v1》。

## 0.1 第一性

**可预测性（Predictability）**：同一类东西长得一样；同一类改动只动一处；错误看得见；文档不会撒谎。

规范面向未来，不迁就历史；历史只提供反例与来源。

> 不是统一所有代码，而是「同族同形 + 可验证 + 防漂移」。
>
> 完整在底层，取舍在上层：规范覆盖大型项目的能力，默认只启用小项目需要的那部分；能力有档位，项目按需启用。

## 1. 五条元判据

| ID | 元判据 | 一句话 |
|---|---|---|
| M1 | 缺席检验（Deletion Test） | 删掉它，哪一层会塌？说不出就删。 |
| M2 | 单一来源（Single Source） | 一个事实、一份正文、一个入口。 |
| M3 | 结构与值分离（Structure vs Value） | 骨架恒常、值可变；契约恒常、实现可变。 |
| M4 | 变化局部化（Locality of Change） | 改一个需求最多动一族；动两族以上说明边界错了。 |
| M5 | 可验证性（Verifiability） | 能算、能 diff、能 lint、能测，才算契约。 |

## 2. 二十一条不变量

| ID | 不变量 | 为什么 | 验收 |
|---|---|---|---|
| A1 | 同族同形（Same Family, Same Shape） | 降低认知负担；AI 可预测 | 每个代码族只有一种模板 |
| A2 | 依赖向内（Dependencies Point Inward） | 核心可脱离框架测试 | core 不 import 框架 / UI / 传输 |
| A3 | 传输透明（Transport Transparency） | 后端可能不按规范；特殊 code 要定制 | 传输层不解释业务 code |
| A4 | 单一收口（Single Funnel） | 改一处全局生效 | 401 / 提示 / 配色 / 分类 / 分页各一处 |
| A5 | 状态穷尽（Exhaustive States） | 非法状态不可表示 | 联合类型 + `assertNever` + `satisfies` |
| A6 | 预期失败是值（Expected Failure as Value） | 错误必须被处理 | Result / 域变体；空 catch 为零 |
| A7 | 表优于分支（Tables over Branches） | 加 case 只加一行 | 可枚举变化用表 |
| A8 | 派生不存储（Derive, Don't Store） | 避免不同步 | 派生状态用 selector / computed |
| A9 | 注释消歧义（Comments Disambiguate） | 注释会漂移 | 只写意图 / 契约 / 边界 / 反例 / 警告 |
| A10 | 例外登记（Exceptions Registered） | 例外会变成第二套规则 | 理由 + 主人 + 到期；安全红线不可豁免 |
| A11 | 生成物只读（Generated Code Is Read-Only） | 手改会漂移 | 标「勿手改」；CI 比对；生成文档可重建 / 校验 |
| A12 | 复制登记（Copy Registered） | 复制是分发，不是标准 | 母版名 / 版本 / 分叉点 / 升级路径 |
| A13 | 可定位性（Locatability） | 抽象不能让人找不到源头 | 每加一层都能一眼定位 |
| A14 | 按需求付工程费（Pay for Engineering by Need） | 过度设计也是债 | L0→L1→L2，有触发条件 |
| A15 | AI 输出契约（AI Output Contract） | 多模型 / 多 agent 会漂移 | 说明改了什么 / 为什么 / 怎么验 / 风险 |
| A16 | 命名即导航（Naming as Navigation） | 前缀 / 后缀标层、防重名、可搜索；组合时读出骨架 | 同族一种前缀；搜索可见 |
| A17 | 内外分离（Inside/Outside Separation） | 前端规范只管内部；外部契约在包装层转换 | 内部不 import 外部类型 |
| A18 | 预案完整，默认最小（Full Plan, Minimal Default） | 规范覆盖大项目能力，默认只启用小项目所需 | 有档位；默认 L0；按触发升级 |
| A19 | 实现自由，边界固定（Implementation Free, Boundary Fixed） | 模块内部形式自由；public contract 固定；可替换 | 入参/出参/错误/副作用边界一致；有契约测试 |
| A20 | 记录环节，不记录实现（Record the Stage, Not the Implementation） | 只记录需要什么功能 / 环节、职责与契约；实现可自研 / 第三方 / 暂时没有 | 环节可消失；不把库当架构层 |
| A21 | 文档安全边界（Document Security Boundaries） | 外部文档不引内部；git 不存密钥；内部文档不外发 | 分级 + 扫描 + 交付白名单；不可豁免 |

## 3. 决策程序

| 问题 | 判据 | 默认 |
|---|---|---|
| 模块内部组织（Module Internal Organization） | 只约束边界与 public contract；函数组合 / 声明式 / OOP / 闭包 / 状态机 / 管道 / actor 都可；按状态复杂度、生命周期、性能 / 体积、可测试性选 | 组合函数 |
| map vs switch | 值是表 → map；动作同签名 → 函数表；不同签名 / 局部 2–3 分支 → switch | 先看签名 |
| 抽象 vs 重复 | 同一性 / 第三次出现 / 第三个消费者 → 抽象；文本相同但语义无关 → 重复 | 先重复 |
| 分层 vs 平铺 | 按「什么一起变」；职责单一、依赖单向即可 | 平铺优先 |
| 框架 vs 原生 | 框架移除的复杂度 > 引入的复杂度 | 原生 / 最小功率 |
| 同步 vs 异步 | 只有 IO / 等待才异步；异步 UI 用状态机 | 同步 |

### 3.1 命名设计（Naming Design）

> 历史做法 ≠ 规范。`api_` / `Model` 是验证过可用的旧约定；新代码按下面的推荐设计，旧项目保留方言，不强制迁移。

**命名四问**

1. 命名空间是否已经给出上下文？（模块 / 目录 / import）→ 是则不重复前缀。
2. 是否在扁平 / 全局命名空间？（CSS 类、easycom、旧 API 模块）→ 是则加前缀。
3. 类型是否已由 TS 表达？→ 是则不加类型后缀（`IUser` / `UserModel`）。
4. 是否需要跨仓库搜索？→ 是则加领域前缀（`api_` / `Doc`）。

**推荐（新代码） vs 历史（旧项目）**

| 场景 | 推荐（新代码） | 历史（可保留，不强制迁移） |
|---|---|---|
| 传输 | `api/<domain>/<action>.ts` + `fetchXxx` / `getXxx` | `api_xxx` 前缀 |
| 行为适配器 | `useXxx` | 同左 |
| 行为核心 | `xxxCore` / `xxxBehavior` | `services/*`（Vue2） |
| 内部实体 | `User` | `UserModel` |
| 内部查询 | `UserQuery` | `UserSearchModel` |
| 内部输入 | `UserInput` | `UserSetModel` |
| 内部视图模型 | `UserView` | 无 |
| 外部类型（后端 / 第三方） | 只存在于 `external/` 或 Wrapper；不参与内部命名 | 生成物原名 |
| UI 原语 | `app-` | 同左 |
| 页面类 | `page-*` | 同左 |
| 表 | `statusMap` / `apiMap` | 同左 |

**动词表**

| 动词 | 用途 |
|---|---|
| `get` | 同步 / 本地读取 |
| `fetch` | 异步 / 远程读取 |
| `set` | 写入 / 设置 |
| `update` | 局部更新 |
| `create` | 新建 |
| `build` | 组装 |
| `resolve` | 补默认 / 归一 |
| `parse` | 外部输入 → 领域类型 |
| `validate` | 校验（只报问题） |
| `assert` | 断言不变量 |
| `is` / `has` | 布尔判断 |
| `to` / `from` | 转换 |
| `on` | 事件绑定 |
| `handle` | 内部事件处理 |

**类型命名（Type Naming）**

> 外部保持原名；内部分**通用层（General）**与**业务层（Business）**；后缀表角色，类型用 PascalCase。

| 层 | 类别 | 命名 | 例子 |
|---|---|---|---|
| External | 外部（后端 / 第三方） | 保持原名，不重命名、不失真 | `AdminUserVO` / `ProductDTO` |
| General | 通用结果 | `Result<T, E>` / `Option<T>` | — |
| General | 通用响应 | `Res<T>` / `ResList<T>` | — |
| General | 通用分页 | `PageParams` / `PageResponse<T>` | — |
| General | 通用状态 | `AsyncState` / `ListState<T>` | — |
| Business | 领域实体 | `Xxx` | `User` |
| Business | 查询参数 | `XxxQuery` | `UserQuery` |
| Business | 输入载荷 | `XxxInput` | `UserInput` |
| Business | 视图模型 | `XxxView` | `UserView` |
| Business | 操作结果 | `XxxResult` | `PaymentResult` |
| Business | 领域错误 | `XxxError` | `PaymentError` |
| Business | 业务状态 | `XxxState` | `UserState` |
| Business | 业务选项 | `XxxOptions` | `UserOptions` |
| UI | 组件属性 | `XxxProps` | `CardProps` |
| UI | 组件事件 | `XxxEmits` | `CardEmits` |
| Value | 表 / 常量 | `xxxMap` / `UPPER_SNAKE` | `statusMap` / `MAX_RETRY` |

- **通用层**放 `types/common/`（单应用）；**`shared/types/` 只是项目决策**：当单仓多包且前后端同为 TS 时，可作为前后端单一类型源；只放类型 / 契约，不放业务 / UI；跨应用业务类型建领域包。
- **业务层**放 `types/<domain>/`；可以 import 通用层，不能 import 外部类型。
- 依赖方向：External → Wrapper → Business → UI；General 被所有层引用，自己不引用业务。
- 外部类型保持原名，由 Wrapper 函数（`toXxx` / `parseXxx`）负责映射；不需要 `BackendXxx` 这类改名。
- 不用 `I` 前缀（`IUser`）；不用 `model_xxx` 小写下划线作类型名。
- 一个实体一个基名；同概念多体系时用限定词（`LoginUser` / `MemberUser`），不用 `User1 / User2`。
- 为什么不用 `model_xxx`：类型名用 PascalCase；`model_user` 破坏大小写惯例，`ModelUser` 读起来像「对 user 做 model 动作」；角色已经由后缀 / 文件夹表达，不需要再前缀一遍。

**规则**

- 同一族只用一种模式；新旧不混用。
- 改名是契约变更：同族一次同步。
- 前缀只解决「命名空间 / 搜索 / 防重名」，不做装饰。

### 3.2 内外边界（Inside/Outside Boundary）

- 前端规范只管**内部代码**；后端 API、第三方 API 的契约风格不在规范内。
- 外部内容只在 **Wrapper** 出现；Wrapper 负责把外部类型 / 字段 / code 转成内部类型 / 错误。
- 内部代码不 import 外部类型；Wrapper 是唯一入口。
- Wrapper 可自由适配，但必须：类型安全、错误归一、不泄漏外部字段、可插拔。
- 换后端 / 第三方 = 换 Wrapper，不改内部。
- 类型分三层：**External（外部形状）/ Domain（内部领域）/ View（页面视图）**。
- External 只被 Wrapper import；Domain 供行为层 / 页面；View 由页面 / 行为层派生。
- 页面 / 组件不得用后端类型定义交互状态；UI 状态用内部联合类型 / 视图模型。

### 3.3 规模档位（Scale Tiers）

| 档 | 场景 | 默认启用 |
|---|---|---|
| **L0** | 单应用 | 单层 `types/`、无 shared、无契约测试 |
| **L1** | 单仓多包 | `shared/types/`（按需）、跨包契约、生成物比对 |
| **L2** | 单仓多包（应用 + 工具包 + 类型包 + UI 包） | 跨包契约、生成物比对、兼容矩阵、视觉回归 |

- 规范定义所有档位，项目只启用需要的档位。
- **多产品 / 多团队是管理问题，不在代码规范内**；仓库之间通过外部契约对接。
- 升级触发：重复 bug、接口漂移、多人 / 多 agent、跨包复用。

**包类型（Package Types）**

| 类型 | 例子 | 职责 | 兼容性 |
|---|---|---|---|
| **App（应用包）** | client / admin / server / mp / app / web | 单一交付物 | 端内 |
| **Shared Types（类型包）** | `shared/types` | 前后端 / 跨包类型单一来源 | 跟随契约 |
| **Toolkit（工具包）** | PDF 导出、业务工具、代码工具 | 多端通用能力 | 包负责兼容矩阵 |
| **UI（UI 包）** | tokens / components | 设计系统 | 包负责跨端 |
| **Adapter（适配包）** | 平台 API 适配 | 隔离平台差异 | 按平台 |

- 包类型是**开放式指引**，不是封闭枚举；组织自由，包内高内聚；新增类型按职责命名，不强套现有类型。

**目录类型（Directory Types）**

| 类型 | 例子 | 用途 | 共享方式 |
|---|---|---|---|
| **Assets（资源目录）** | 图片 / 字体 / 图标 | 跨应用共享 / 兜底 / 离线 | 目录引用；跨应用且需版本化时升包 |
| **Docs（文档目录）** | `docs/` | 设计说明书 / 交付说明书 / 其他 | 仓库内；内部组织自由；交付内容由开发者定义 |
| **Temp（临时目录）** | `.local/` / `tmp/` | 个人草稿 / 临时文档 | 不入 git |

- 目录优先：资源 / 文档默认是目录，不是包；升包条件 = 跨应用共享 + 需要版本 / 兜底 / 离线 / public API。
- 文件存储不设默认：OSS / 本地目录 / CDN / 仓库文档 / `.local` 都是实现；记录环节，不记录实现。
- 文档目录统一为根 `docs/`；内部组织自由；交付物属于开发者自定义内容，规范只到 `docs/` 这一层；临时文档放 `.local/`（不入 git）。

- 一包一能力；禁止 `utils` / `common` / `helpers` 杂物包。
- Toolkit 对外 API 平台无关；平台差异在包内 adapter 或独立适配包。
- 应用包依赖工具包，工具包不 import 应用。
- 第二个消费者出现才升包；一个消费者先留本地模块。
- 跨端兼容性由包负责：兼容矩阵 + 每端 smoke / contract test。
- semver + changelog；破坏性变更 major；发布不可覆盖。

### 3.4 目录约定（Directory Layout）

```text
repo/
  apps/
    <app>/                 # 交付物：client / admin / server / mp / app / web
      src/
        pages/
        components/
        behavior/
        api/
        adapters/
        types/
        external/
  packages/
    <capability>/          # 可复用包：types / toolkit / ui / adapter
      src/
      package.json
      README.md
      CHANGELOG.md
      compat.md            # 工具包 / UI 包 / 适配包
      tests/
```

- `apps/` 只放交付物；`packages/` 只放可复用能力；应用不跨 app import。
- 包类型：`types`（类型 / 契约）、`toolkit-<capability>`（工具）、`ui`（设计系统）、`adapter-<platform>`（平台适配）。
- 包名推荐 `@scope/<capability>`；工具包可用 `@scope/toolkit-<capability>` 或 `@scope/<capability>`；**不强制定式**，但同一仓库内保持一种风格；禁止 `utils` / `common` / `helpers` 这类无能力名。
- 兼容矩阵放包内 `compat.md` + CI matrix；应用不维护兼容。
- 依赖方向：apps → packages；packages → packages（无环）；packages 不 import apps。
- `shared` 是包，不是特殊目录：`packages/types` 或 `packages/shared-types`；只在「前后端同为 TS + 多消费者」时建。
- 外部类型跟 Wrapper 走：应用本地放 `apps/<app>/src/external/`；跨应用放 `packages/contracts-<source>/`。

### 3.5 环节清单（Stage Catalog）

| 环节 | 职责 | 是否必需 | 可选实现 |
|---|---|---|---|
| **Transport（传输）** | 网络 / HTTP / 取消 | 有远程调用时 | 自研 / 第三方 |
| **Wrapper（包装）** | 外部 → 内部转换 | 有外部契约时 | 自研 / 生成 |
| **Behavior（行为）** | 页面无关行为 | 有复用 / 复杂逻辑时 | 纯函数 / 状态机；需要时再加 composable / hook / service |
| **State（状态）** | 状态建模与转移 | 有异步 / 多态时 | 联合类型 / 状态机 |
| **Concurrency（并发控制）** | 去重 / 共享 in-flight / 取消 | 有并发请求时 | 自研 / 第三方 / 不做 |
| **Observability（可观测性）** | 日志 / 追踪 / 请求序 | 需要排障时 | console / APM / 不做 |
| **Cache（缓存）** | 数据缓存与失效 | 需要时 | 自研 / 第三方 / 不做 |
| **Auth（鉴权）** | 登录态 / 401 刷新 | 有鉴权时 | 自研 / 第三方 |

- 环节可消失：技术变化导致某环节不再需要时，直接删除，不留兼容壳。
- 不把某个库当成架构层；库只是当前实现。
- 项目没有这个职责时，对应环节可以不存在。

### 3.6 文档安全（Document Security）

> 文档组织由项目决定；规范只管分级与安全，不管目录结构。

**分级**

| 级别 | 读者 | 规则 |
|---|---|---|
| **Public（公开）** | 客户 / 外部 | 自包含；不引用内部文档 / 路径 / 主机名；不含敏感信息 |
| **Internal（内部）** | 团队 / AI | 可引用内部文档；不对外交付 |
| **Confidential（机密）** | 指定人 | 不进 git；放 `.local/` 或密钥管理；不进入提示词 |

**红线**

- 进 git 的文档禁止出现密码、密钥、令牌、AK/SK、连接串、客户隐私数据。
- 外部文档禁止引用内部文档、内部路径、内部主机名、内部系统名。
- 内部文档必须标 `Internal（内部）`；交付物必须来自 `docs/` 下项目声明的交付目录（如 `docs/交付/`），不得把整个 `docs/` 直接打包交付。
- AI 生成文档时禁止复制配置值；发现敏感信息必须脱敏并提示。
- CI：secret scanning + 外部文档链接 / 路径检查；交付前跑白名单检查。
- 密钥一旦进 git：立即轮换，按已泄露处理；不要只删文件。
- 安全红线不可豁免；不得以例外登记绕过。

### 3.7 文档格式（Document Format）

- 文档中的英文术语首次出现用 `English（中文）`，如 `Transport（传输层）`。
- 同一篇文档内，同一术语的译名保持一致。
- 代码标识符、命令、路径、API 名保持英文，不加中文括注。
- 标题、表格、图注同样适用。
- 对外文档也遵守；面向非技术读者时，首次出现后可只用中文。

## 4. 规则字段

每条规则必须有：`ID / 规则 / 理由 / 正例 / 反例 / 验收 / 范围 / 主人 / 到期`。

没有反例的规则，降级为「参考」；没有验收的规则，等于不存在。

## 5. 使用方式

- **人**：review 时按 A1–A21 检查；新规则先写 ADR。
- **AI**：先读本宪法 + 相关《代码族卡》+ 项目覆盖；输出按 A15，安全按 A21。
- **修改**：一次变更一个状态；契约类改动全仓原子提交。

**规则分类**

| 类型 | 规则 |
|---|---|
| 硬规则（可机检或二元） | A2、A3、A4、A7（部分）、A11、A17、A21 |
| 判断规则（人检） | A1、A5、A8、A9、A10、A13、A14、A16、A18、A19、A20 |
| 流程规则 | A6、A12、A15 |

## 6. 机检现状

- 已内置（`codecraft check`）：A2 / A6（空 catch）/ A11 / A17 / A21（静态、文本级）。
- 需要项目门禁或人工评审：A3 / A4（收口判断）/ A5 / A7–A9（类型与结构）/ A12–A20。
- 静态扫描只覆盖高置信模式；漏报由项目门禁补，误报按 A12 登记例外。

## 7. 待定

- 每条规则的 owner 和到期日。
- 后端（Node）专项是否独立成体系；当前只复用本宪法的结构与安全规则。
