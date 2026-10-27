# 前端审计判定 v1

> 2026-10-27 · v1
> 用途：A1–A21 在前端的判定方式、静态边界与一致性检查。
> 范围：JS/TS 前端；后端解释见 `docs/backend/13-audit.md`。
> 关系：报告结构、判定口径、证据与优先级见 `docs/shared/08-audit-contract.md`；规则正文见 `docs/shared/00-constitution.md` 与 `docs/frontend/01-family-cards.md`。

## 1. 静态检查边界

内置检查是**抽样工具**，不是审计结论：

- **A17**：按三条线索识别生成类型：路径含 `external/` / `generated/`、文件头有只读声明（`本文件由…生成` / `勿手改` / `@generated`）、`boundaries.external` / `boundaries.generated` 配置。只解析相对路径与 `@/` `~/` `#/` 别名；解析不到或头部无标记时仍是盲区，必须人工检查。
  - `boundaries.external` / `boundaries.generated` 填的是 import 前缀或 glob（如 `@/types/external`），不是目录路径；`boundaries.allowedImporters` 与 `boundaries.generatedDirs` 填的是相对 `--root` 的路径或 glob。
  - 允许 import 外部 / 生成类型的目录：默认 `wrapper` / `api` / `adapters` / `external` / `generated`；可用 `boundaries.allowedImporters` 追加（如 `client/src/types/internal/*/wrapper.ts`）。Wrapper 是角色，目录只是默认线索；报告必须写明本次放行清单，否则 0 findings 不可复现。
  - `boundaries.generatedDirs` 内的文件按生成物处理，不依赖文件头或目录名；仍只把导出类型 / 枚举 / 接口的模块算作契约，数据 / 资源模块不触发 A17。
  - 生成的数据 / 资源模块（如图标表）不算类型契约，不触发 A17。
  - 约定：生成 / 外部类型放在 `external/` 或 `generated/` 下；迁移前按人工检查，不能因 0 findings 判 `pass`。
  - 已知盲区：barrel 文件或纯别名 re-export 会把 import 解析到中间文件；静态检查按 import spec 判定，此类必须人工抽查。
- **A2 / A11**：只覆盖包结构、生成物标记等文本模式；没有类型图、没有运行时验证。
- **A21**：高置信 token 模式（私钥 / AWS / 阿里云 `LTAI` / GitHub / Slack / API key）+ 配置与 Java / Kotlin 源码中的明文强口令 / 密钥字段；跳过环境变量、占位符与测试目录。没有命中不等于不存在，必须写明扫描范围。
- **A4 / A5 / A8 / A12 / A13 / A19**：靠人工阅读，不做静态扫描。A4 需要语义判断；A5 需要状态可达性、A8 需要数据流分析，文本级扫描实测误报高；不能因为 CLI 0 findings 就给 `pass`。

因此：

- 报告必须写「`codecraft check` 的结果与覆盖范围」。
- 用了 `--exclude` 时必须列出排除路径；否则计数不可复现。
- `0 findings` 只能写成「静态检查未命中」，不能写成「规则通过」。
- 审计结论的置信度分为 High / Medium / Low：
  - High：静态 + 人工抽样 + 关键路径验证
  - Medium：静态 + 人工抽样
  - Low：仅静态检查

**局限列固定写法**：

| 场景 | 写法 |
|---|---|
| A17 只做了静态检查 | `A17 人工抽查：<目录 / 文件>；未覆盖 <barrel / 动态 import / 别名解析失败>；静态未命中不等于通过` |
| A21 只做了模式扫描 | `A21 扫描范围：<目录 / 扩展名>；未覆盖 <运行时拼装 / 加密配置>` |

## 2. A1–A21 判定矩阵

| ID | 判定方式 | `pass` 条件 | 常见误判 |
|---|---|---|---|
| A1 | 人工抽样（结构检索辅助） | 同族实例使用同一模板 / 插槽；抽样覆盖主要分支 | 只看到统一 Wrapper，忽略内部结构分叉 |
| A2 | 静态依赖 + 人工 | 无反向依赖、无跨层 import | 只看 core 的 import，漏掉传输层 import 状态 |
| A3 | 人工 | 传输层不解释业务 code、不承担 UI 反馈；成功判定在来源 Adapter | 401 收口一处就判通过；全局 interceptor 统一判业务码 |
| A4 | 人工 + 计数 | 每种关注点只有一个收口；多来源时「每来源一处」，不要求全局一个函数 | 全局一个判定函数里按来源分支；认证 / 提示各一处，但业务码判断散落 30+ 处 |
| A5 | 静态 + 人工 | 非法状态不可表示；联合类型 / 穷尽分支 | 有类型但大量 `any` / 多布尔并存 |
| A6 | 人工 + 静态（空 catch） | 错误是值；无静默失败；调用方必须处理；错误归一保留 `errMsg` / `cause` / status 至少一个底层原因 | 成功元组里 err 恒为 `undefined`；业务失败仍走成功分支；`catch (e) { throw new Error("失败") }` 吞掉原因 |
| A7 | 人工 | 可枚举变化用表；加 case 只加一行 | 有表但仍有并行 if / switch |
| A8 | 人工 | 派生状态不落库 / 不重复存储 | 有 computed，同时把结果再存一份 |
| A9 | 人工 | 注释只写意图 / 契约 / 边界 / 反例 | 注释复述代码，或规范文档本身漂移 |
| A10 | 人工 + 配置 | 例外有理由 / 主人 / 到期；安全不可豁免 | 只写“历史原因”，没有到期 |
| A11 | 静态（标记）+ CI 比对 | 生成物有只读标记，且再生成 diff 为空 | 只有“勿手改”头，没有再生成比对 |
| A12 | 人工 | 复制有母版、版本、分叉点、升级路径 | 多处副本，未指明母版 |
| A13 | 人工 | 每一层都能一眼定位源头 | `utils/` 成为域名 / 传输 / 海报的混合桶 |
| A14 | 人工 | 抽象有真实消费方与触发条件 | 以“以后可能用”为由提前抽象 |
| A15 | 流程 / 输出检查 | 变更说明含改了什么 / 为什么 / 怎么验 / 风险 | 用 A15 去评价代码结构 |
| A16 | 人工 + 搜索 | 命名标层、可搜索、组合可读 | 单项目内一致，但跨端 / 跨团队歧义 |
| A17 | 静态（路径 / 文件头 / 配置）+ 人工 | 内部不 import 外部类型；外部形状只经 Wrapper 角色转换（载体不限） | 别名解析不到或头部无标记就判通过；把生成数据模块当成类型契约；漏掉 barrel re-export；把「没有 wrapper 目录」当成没有 Wrapper |
| A18 | 人工 | 有档位；默认 L0；按触发升级 | 所有能力默认开启 |
| A19 | 人工 + 契约测试 | public contract 固定；有可替换性验证 | 边界口头清楚，但没有契约测试 |
| A20 | 人工 | 记录环节 / 职责 / 契约，不把库当层 | 用框架名代替架构层 |
| A21 | 静态扫描 + 人工 | 无密钥 / 内部路径外泄；交付白名单一致 | 模式扫描 0 命中就判全局通过；把运行时变量名当明文密钥 |

## 3. 一致性检查

出结论前，必须做一次交叉检查；发现矛盾就降级：

| 场景 | 要求 |
|---|---|
| A4 判 `pass`，但存在多处 `code === 200` / 重复错误处理 | 改为 `warn`；单一收口未成立 |
| A11 判 `pass`，但没有再生成比对 / CI diff | 最多 `warn`；只能写“生成物有只读标记” |
| A8 判 `pass`，但派生状态被落库 / 重复存储 | 改为 `warn`，或写明可接受理由与主人 |
| A21 判 `pass`，但只做了模式扫描 | 写 `pass（有限）` 或 `warn`；列扫描范围 |
| A17 判 `pass`，但存在生成类型直用 | 改为 `warn`；路径不在 `external/` 也算 |
| A12 判 `pass`，但同族存在多份副本 | 改为 `warn`；必须指明母版 |
| A3 判 `pass`，但传输层直接弹 Toast / 跳转 | 改为 `warn`；传输层不应承担 UI 反馈 |

## 4. 外部集成抽查

OSS 直传、第三方 API、多后端、上传 / 下载按人工抽查（不新增族卡）。

**成功分三层，不混用**

| 层 | 判定 | 归属 |
|---|---|---|
| 协议 | HTTP 2xx；OSS 2xx；平台 API 无 `errMsg` | Transport |
| 信封 | `code` / `success` / `status` 按来源契约 | 来源 Adapter |
| 领域 | 转内部结果 / 领域错误 | Wrapper / Behavior |

**统一结果模型，不统一判定函数**

```ts
type TransportResult<T> =
  | { ok: true; data: T; raw: unknown }
  | { ok: false; error: TransportError }

interface SourceAdapter<Raw, T> {
  id: string
  isSuccess(raw: Raw): boolean      // 每个来源自己实现
  unwrap(raw: Raw): T
  toError(raw: Raw): TransportError // 保留 status / code / cause
}
```

- 每个来源一个 adapter：后端 A / B、OSS、上传、GraphQL 各自判定；公共 HTTP 信封可用 helper 生成。
- 不在全局 interceptor 里统一判 code；A4 的收口是「每个来源一处」，不是「全局一个函数」。
- Transport 只做网络 / 超时 / 取消 / 重试，不解释业务 code（A3）。
- 页面 / 组件只看内部结果，不看 `code` / `status` / `errMsg`。

**默认放宽**

| 来源 | 成功判定 |
|---|---|
| HTTP 无明确契约 | 2xx 为协议成功；不猜业务码 |
| OSS / 下载 | 2xx（含 204） |
| `uni.uploadFile` | 成功回调 + `statusCode` 2xx |
| GraphQL | HTTP 200 且 `errors` 为空 |
| 契约未知 | 返回 `raw` + 状态，标 `unknown`，人工确认 |

**错误模型**

- `kind`：`network` / `protocol` / `business` / `unknown`。
- 保留 `status` / `code` / `cause` / `raw` 至少一个原因。
- UI 只按 `kind` 映射文案，不直接展示原始错误。

| 检查 | 要点 | 关联 |
|---|---|---|
| 成功判定 | 按来源契约声明；不全局硬编码 `200` | A19 |
| 凭证 | 服务端签名 / 临时凭证；前端不含长期 AK/SK | A21 |
| 目录与白名单 | 上传目录按用途隔离；路径不直接拼用户输入 | A19 / A21 |
| 错误透出 | `errMsg` / `cause` / status 至少一个进入可展示信息或日志 | A6 |
| 失败清理 | 临时文件 / 已上传对象在失败时回收或标记 | A19 |

## 5. 交付前自检

除 `docs/shared/08-audit-contract.md` 的通用项外：

- [ ] A1–A21 全部出现，或写明 `na`
- [ ] A4 / A8 / A11 / A17 / A21 没有被高估
- [ ] 已写明 `boundaries` 与 `allowedImporters` 的实际放行清单
