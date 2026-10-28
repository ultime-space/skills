# 安全基线：密码、传输与密钥 v1

> 2026-10-28 · v1
> 用途：项目分析 / 审计时给建议与告警口径；覆盖密码存储、传输、数据加密、密钥与令牌。
> 不在范围：XSS / CSRF / SSRF / 越权模型 / 依赖漏洞 / 部署拓扑；这些按 `08-audit-contract.md` 的通用口径单独判定。
> 关系：A3（传输透明）、A20（记录环节）、A21（文档安全）的补充；不新增不变量，不规定必须用哪个库。
> 数值随实践更新：本文只给下限；写进项目时按当前基线复核，不把参数抄成门禁。

## 1. 先定威胁模型

三个问题，答不上来就先别加密：

1. **防谁**：链路旁观者 / 数据库备份泄漏 / 内部运维 / 终端用户本人？
2. **后果**：可重置（会话、缓存）还是不可逆（密码、证件号、密钥）？
3. **密钥归谁**：服务端独有 / 前端也持有 / 第三方托管？能否轮换、多久一次？

判据：**能删就不存，能哈希就不加密，能靠 TLS 就不自造协议。**

## 2. 密码存储

**结论：只哈希，不加密，不存明文。**

| 项 | 推荐 | 可接受（写理由） | 禁止 / 告警 |
|---|---|---|---|
| 算法 | Argon2id：内存 19 MiB、迭代 2、并行 1 起 | scrypt（N=2^17、r=8、p=1）；bcrypt（cost≥10）；PBKDF2-HMAC-SHA-256（≥600,000，合规场景） | 明文；可逆加密；MD5 / SHA-1 / 单次 SHA-256；自研算法 |
| 盐 | 每用户唯一随机，交给库生成 | 旧系统已自带 salt | 全局固定盐；无盐 |
| Pepper | 可选；存 KMS / vault，与哈希分开 | 无 | 写进代码或与哈希同库（等于没有） |
| 参数记录 | 每条哈希存算法 + 参数 + 版本，登录时按需重算 | 迁移脚本统一重算 | 只存哈希串，无法升级 |
| bcrypt 输入 | 超 72 字节先 SHA-256 + Base64 再进 bcrypt，或显式拒绝 | 限制最大长度并提示 | 静默截断（不同口令可碰撞） |

口令策略：

| 项 | 推荐 | 禁止 / 告警 |
|---|---|---|
| 最小长度 | 单因子 ≥15；仅作 MFA 一环时 ≥8 | <8；按字符类型凑复杂度 |
| 最大长度 | ≥64，不截断 | 限制 16 / 20 位 |
| 字符集 | 允许全部可打印 ASCII 与 Unicode，按码点计数 | 强制大小写 / 数字 / 符号组合 |
| 更换 | 不强制定期更换；泄露或疑似泄露才强制 | 90 天强制改密 |
| 泄露口令 | 比对 blocklist，命中则拒绝并说明原因 | 只做复杂度校验 |
| 限速 | 按账号 + IP 限失败次数，指数退避 | 无限制；只在前端限速 |
| 提示 | 注册 / 改密时给强度建议 | 安全问题 / KBA |
| 传输 | 只走 HTTPS；前端不哈希；日志脱敏 | 前端 MD5 后传；密码进 URL 或日志 |
| 重置令牌 | CSPRNG ≥128 bit；存哈希；一次性；短 TTL | 时间戳 / 自增 ID / 可预测 token |

## 3. 传输安全

**结论：默认只靠 TLS；应用层加密是例外，不是默认。**

TLS：

- TLS 1.3 默认，TLS 1.2 兼容；SSLv2/v3、TLS 1.0/1.1 关闭。
- 只留 AEAD 套件（AES-GCM / ChaCha20-Poly1305）；TLS 1.2 也不用 CBC；禁 NULL / anon / EXPORT / 静态 RSA 密钥交换。
- 关压缩（CRIME）；证书 RSA ≥2048 或 ECDSA，签名 SHA-256；HSTS；全站 HTTPS，HTTP 301 跳转。
- Cookie：Secure + HttpOnly + SameSite；跨站场景显式声明。
- 证书校验永远不要关：`rejectUnauthorized: false`、`NODE_TLS_REJECT_UNAUTHORIZED=0`、`--insecure`、`curl -k` 只允许本地临时调试，且不能提交。

应用层加密（仅在 `00-constitution.md` §3「应用层加密」判据成立时）：

- 只包 body；URL / query / header 仍明文；OSS 直传、大文件不加密。
- AES-GCM 或 ChaCha20-Poly1305；**禁 ECB**；96-bit 随机 IV，每条消息唯一，不复用。
- 信封 `{ v, iv, data }`，`v` 对应 key 版本，支持灰度轮换。
- 防重放：timestamp + nonce，服务端留窗口；只加密不签名 = 可被篡改后重放。
- 顺序：先签名后加密；不自己拼协议。
- key 不进 bundle、不进 git；前端持有的 key 视为公开。

## 4. 数据加密与密钥

- 能不存就不存；确实要存用 AES-256-GCM（至少 128），密钥与密文分离。
- 密钥来自 KMS / HSM / secret manager 或部署时注入；不硬编码、不进 git、不进前端。
- 分层：数据密钥（DEK）+ 密钥加密密钥（KEK）；按记录 / 租户分 DEK 时记录 key id。
- 轮换：先有预案再谈加密；旧 key 保留到备份过期，避免历史数据不可解。
- 删除要覆盖备份、日志、缓存、导出文件；只删主表不算删除。
- 常见错：Base64 当加密；AES-ECB；固定 IV；key 与密文同库；日志打印明文；把加密当访问控制。

## 5. 令牌与会话

- 随机：`crypto.randomBytes` / `randomInt` / `randomUUID`（Node）、`crypto.getRandomValues`（浏览器）；禁 `Math.random()`。
- 比较：`timingSafeEqual`；不要用 `===` 比 HMAC、签名或 token。
- JWT：必须 verify 且给算法白名单；拒绝 `none`；校验 `exp` / `nbf` / `aud` / `iss`；`decode` 只能读 payload，不能当鉴权。
- 会话：浏览器优先 HttpOnly + Secure + SameSite cookie；`localStorage` 存 token 会被 XSS 直接读走——不是绝对禁止，但必须写清威胁模型，判定降为 `warn`。
- 生命周期：access 短、refresh 可撤销；登出 / 改密 / 改权限要能失效旧令牌。
- 日志与监控：不打印 Authorization / Cookie / 密码 / 验证码 / 完整手机号。

## 6. 后端落点

安全要求不落在「前端多写一层」，而落在服务端的固定位置：

| 环节 | 落点 | 要求 | 反例 |
|---|---|---|---|
| 口令 | Service / `auth/` | 统一 `hashPassword` / `verifyPassword`；参数与版本入库；比较用库函数 | Controller 里散写 `bcrypt.hash`；自己拼 salt |
| 登录 | Controller → Auth service | 统一失败文案与耗时；账号 + IP 限速；成功后重建会话 | 区分「用户不存在 / 密码错误」；只在前端限速 |
| 会话 / 令牌 | Auth service + 中间件 | 签发与校验一处；算法白名单；`kid` 轮换；短 access + 可撤销 refresh | `secret` 默认值；`verify` 不传算法；无撤销 |
| 传输 | 反代 / 入口 | 边缘终止 TLS；只信任白名单代理头；HSTS 在边缘下发；内网调用也鉴权 | 因「内网」走 HTTP；无条件信任 `X-Forwarded-Proto` |
| 字段加密 | Service / Repository | 加解密在域边界；密文带 key id；加密字段不参与查询与排序 | Controller 里加解密；加密字段做 `LIKE`；把加密当鉴权 |
| 密钥 | Config | 启动校验，缺失即失败；只从 secret manager / 环境注入；不进错误响应 | 默认密钥兜底；key 打进镜像；错误里带配置 |
| 审计 | 日志 / 审计表 | 登录、改密、权限变更单独记事件；脱敏；防日志注入 | 打印 `req.body`；只记业务日志不记安全事件 |
| 重置 / 验证码 | Auth service | 一次性、短 TTL、存哈希、限速、防账号枚举 | 重置 token 存明文；验证码不过期；返回「该邮箱未注册」 |

- **服务端是唯一授权点**：前端隐藏按钮、路由守卫只影响体验，不构成授权。
- **错误不泄露内部**：对外统一错误码与文案；堆栈、SQL、key 名只进内部日志。
- **时钟**：`exp` / `nbf` 校验留小偏移（如 60s），不要放宽到分钟级。
- **轮换**：`kid` 与信封 `v` 同时可读，旧 key 保留到历史数据与令牌全部过期。
- **加密字段**：需要等值查询时用盲索引（HMAC），不要为了查询把明文落库。

## 7. 项目分析怎么用

### 7.1 检索清单

```bash
# 密码哈希
rg -n "md5|sha1|createHash|bcrypt|argon2|scrypt|pbkdf2" --glob '!**/node_modules/**'
# 随机
rg -n "Math\.random|randomUUID|randomBytes|randomInt|getRandomValues"
# 传输与证书校验
rg -n "http://|rejectUnauthorized|NODE_TLS_REJECT_UNAUTHORIZED|insecure"
# 加密
rg -n "AES|ECB|createCipheriv|subtle\.encrypt|CryptoJS"
# 令牌
rg -n "jwt\.decode|jwt\.verify|algorithms|localStorage\.setItem\(['\"]token"
```

### 7.2 判定

| 命中 | 判定 | 动作 |
|---|---|---|
| 密码可逆 / MD5 / SHA-1；关闭证书校验；ECB | `fail`（P0） | 改方案；报告写清影响面与轮换要求 |
| bcrypt cost 未知或无参数记录；JWT 未校验 `exp`；localStorage 存 token；内网走 HTTP 明文 | `warn`（P1） | 给替代方案与验证命令 |
| 全部符合且能给出参数 | `pass` | 写扫描范围与参数值 |

`0 findings` ≠ `pass`；必须写「扫描范围 + 未覆盖项」。

### 7.3 报告句式

> `src/auth/password.ts:12` 用 `createHash('md5')` 存密码：碰撞成本极低，属 `fail`（P0）。建议改 Argon2id（内存 19 MiB、迭代 2、并行 1）并加每用户盐；验证：同一口令两次哈希不同，旧哈希登录时重算。

### 7.4 常见误判

- 有 HTTPS 就判传输 `pass`：未查 HSTS、证书校验、混合内容。
- 用了 bcrypt 就判密码 `pass`：未看 cost、是否先 MD5、是否静默截断。
- 有 JWT 就判认证 `pass`：未查 verify、过期、撤销。
- 有加密就判数据 `pass`：未查密钥归属、IV 复用、访问控制。
- 把「前端加密了」当安全：key 在 bundle 里。

## 8. 反例

口令：

```ts
createHash('md5').update(password).digest('hex') // 快哈希 → 离线爆破成本极低
aesEncrypt(password, KEY)                        // 可逆 → 等于存明文
btoa(password)                                   // 编码不是加密
```

随机与比较：

```ts
Math.random().toString(36).slice(2) // 重置令牌 / 验证码可被预测
token === storedToken               // 计时攻击；改用 timingSafeEqual
```

传输：

```ts
new https.Agent({ rejectUnauthorized: false }) // 生产环境等同于开放中间人通道
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0' // 同上，且影响进程内所有请求
const baseURL = 'http://api.example.com'       // 明文传输，token 直接暴露
```

JWT 与会话：

```ts
jwt.decode(token)                              // 只解码不验签，不能当鉴权
jwt.verify(token, key, { algorithms: ['none'] }) // 算法白名单含 none
localStorage.setItem('token', token)            // XSS 可直接读走
```

对称加密：

```ts
createCipheriv('aes-128-ecb', key, null)              // ECB 泄露明文结构
createCipheriv('aes-256-cbc', key, Buffer.alloc(16))   // 固定 IV，相同明文相同密文
CryptoJS.AES.encrypt(data, '1234567890abcdef')        // 前端硬编码 key，等于公开
```

口令策略：

```ts
/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password) // 复杂度规则不等于强度；长度与 blocklist 更有效
```
