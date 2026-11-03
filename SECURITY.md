# Security Policy（安全策略）

本仓包含两个已发布的 skill 包（`@ultime/codecraft` / `@ultime/docscraft`）。漏洞报告口径：

- **不要在公开 Issue 中粘贴密钥、令牌、客户数据或可利用细节。**
- 通过仓库的私有安全通道联系维护者；没有通道时先开一个不含敏感信息的 Issue，说明「需要私下同步」。
- 报告请包含：受影响的包与版本、最小复现、影响面、建议修复方向。

各包的详细策略与处理流程：

- [`skills/codecraft/SECURITY.md`](./skills/codecraft/SECURITY.md)
- [`skills/docscraft/SECURITY.md`](./skills/docscraft/SECURITY.md)

两个包均为静态规则与 CLI，不执行网络请求；主要风险是密钥 / 隐私被写进规则、示例或模板。
