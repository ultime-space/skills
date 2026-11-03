import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const BIN = fileURLToPath(new URL('../bin/codecraft.mjs', import.meta.url))
const PACKAGE = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

function run(args, cwd = process.cwd()) {
  return spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: 'utf8' })
}

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'codecraft-cli-'))
}

void test('cli: version prints the package version', () => {
  const result = run(['version'])

  assert.equal(result.status, 0)
  assert.equal(result.stdout.trim(), PACKAGE.version)
})

void test('cli: --help prints usage and exits 0', () => {
  const result = run(['--help'])

  assert.equal(result.status, 0)
  assert.match(result.stdout, /codecraft <command>/)
})

void test('cli: unknown command exits 2', () => {
  const result = run(['nope'])

  assert.equal(result.status, 2)
  assert.match(result.stderr, /unknown command/)
})

void test('cli: --ci turns findings into a failing exit', () => {
  const root = tempRoot()
  try {
    fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'pages', 'home.ts'), "import { User } from '@/external/user'\n")

    const result = run(['check', '--root', root, '--ci', '--format', 'json'])

    assert.equal(result.status, 1)
    const report = JSON.parse(result.stdout)
    assert.equal(report.findings.length, 1)
    assert.equal(report.findings[0].severity, 'error')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: ignore suppresses findings and keeps them in the report', () => {
  const root = tempRoot()
  try {
    fs.mkdirSync(path.join(root, 'src', 'pages', 'legacy'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'pages', 'legacy', 'home.ts'), "import { User } from '@/external/user'\n")
    fs.writeFileSync(
      path.join(root, 'codecraft.config.json'),
      JSON.stringify({
        ignore: [{ rule: 'A17', file: 'src/pages/legacy/**', reason: 'legacy page; migrate in 2026-Q4' }],
      }),
    )

    const result = run(['check', '--root', root, '--ci', '--format', 'json'])

    assert.equal(result.status, 0)
    const report = JSON.parse(result.stdout)
    assert.equal(report.findings.length, 0)
    assert.equal(report.ignored.length, 1)
    assert.equal(report.summary.ignored, 1)
    assert.match(report.ignored[0].reason, /legacy page/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: expired ignore entries do not suppress findings', () => {
  const root = tempRoot()
  try {
    fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'pages', 'home.ts'), "import { User } from '@/external/user'\n")
    fs.writeFileSync(
      path.join(root, 'codecraft.config.json'),
      JSON.stringify({
        ignore: [{ rule: 'A17', file: 'src/pages/**', reason: 'expired', expires: '2000-01-01' }],
      }),
    )

    const result = run(['check', '--root', root, '--ci', '--format', 'json'])

    assert.equal(result.status, 1)
    const report = JSON.parse(result.stdout)
    assert.equal(report.findings.length, 1)
    assert.equal(report.expired, 1)
    assert.equal(report.exceptions[0].status, 'expired')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: invalid ignore config exits 2 with a reason hint', () => {
  const root = tempRoot()
  try {
    fs.writeFileSync(
      path.join(root, 'codecraft.config.json'),
      JSON.stringify({ ignore: [{ rule: 'A17', file: 'src/**' }] }),
    )

    const result = run(['check', '--root', root])

    assert.equal(result.status, 2)
    assert.match(result.stderr, /reason/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: markdown output lists ignored findings', () => {
  const root = tempRoot()
  try {
    fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'pages', 'home.ts'), "import { User } from '@/external/user'\n")
    fs.writeFileSync(
      path.join(root, 'codecraft.config.json'),
      JSON.stringify({ ignore: [{ rule: 'A17', file: 'src/pages/**', reason: 'legacy' }] }),
    )

    const result = run(['check', '--root', root])

    assert.equal(result.status, 0)
    assert.match(result.stdout, /## Ignored/)
    assert.match(result.stdout, /legacy/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: warns and exits 2 when no source files are scanned', () => {
  const root = tempRoot()
  try {
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'empty' }))

    const result = run(['check', '--root', root, '--format', 'json'])

    assert.equal(result.status, 2)
    assert.match(result.stderr, /0 source files scanned/)
    const report = JSON.parse(result.stdout)
    assert.equal(report.files, 0)
    assert.equal(report.warnings.length, 1)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: sarif output includes rules and locations', () => {
  const root = tempRoot()
  try {
    fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'pages', 'home.ts'), "import { User } from '@/external/user'\n")

    const result = run(['check', '--root', root, '--format', 'sarif'])

    assert.equal(result.status, 0)
    const report = JSON.parse(result.stdout)
    assert.equal(report.version, '2.1.0')
    assert.equal(report.runs[0].tool.driver.name, 'codecraft')
    assert.equal(report.runs[0].results[0].ruleId, 'A17')
    assert.equal(report.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri, 'src/pages/home.ts')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: --changed only reports changed files', () => {
  const root = tempRoot()
  try {
    fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'pages', 'a.ts'), "import { User } from '@/external/user'\n")
    fs.writeFileSync(path.join(root, 'src', 'pages', 'b.ts'), "import { User } from '@/external/user'\n")
    const git = (args) => spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' })
    git(['init'])
    git(['config', 'user.email', 'test@example.com'])
    git(['config', 'user.name', 'test'])
    git(['add', '.'])
    git(['commit', '-m', 'init'])
    fs.writeFileSync(path.join(root, 'src', 'pages', 'a.ts'), "import { User } from '@/external/user'\n// changed\n")

    const result = run(['check', '--root', root, '--changed', '--format', 'json'])

    assert.equal(result.status, 0)
    const report = JSON.parse(result.stdout)
    assert.equal(report.scope, 'changed')
    assert.equal(report.findings.length, 1)
    assert.equal(report.findings[0].file, 'src/pages/a.ts')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: --changed matches by package, not by relative suffix', () => {
  const root = tempRoot()
  try {
    for (const pkg of ['a', 'b']) {
      fs.mkdirSync(path.join(root, 'packages', pkg, 'src'), { recursive: true })
      fs.writeFileSync(
        path.join(root, 'packages', pkg, 'package.json'),
        JSON.stringify({ name: `@x/${pkg}` }),
      )
      fs.writeFileSync(path.join(root, 'packages', pkg, 'src', 'x.ts'), 'try {\n  run()\n} catch {}\n')
    }
    const git = (args) => spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' })
    git(['init'])
    git(['config', 'user.email', 'test@example.com'])
    git(['config', 'user.name', 'test'])
    git(['add', '.'])
    git(['commit', '-m', 'init'])
    fs.writeFileSync(path.join(root, 'packages', 'b', 'src', 'x.ts'), 'try {\n  run()\n} catch {} // changed\n')

    const result = run(['check', '--root', root, '--changed', '--pack', 'library', '--format', 'json'])

    assert.equal(result.status, 0)
    const report = JSON.parse(result.stdout)
    assert.equal(report.findings.length, 1, 'only packages/b/src/x.ts changed; package a must not be reported')
    assert.equal(report.findings[0].file, 'src/x.ts')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: --changed with no changes fails explicitly in CI, not locally', () => {
  const root = tempRoot()
  try {
    fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'pages', 'a.ts'), "import { User } from '@/external/user'\n")
    const git = (args) => spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' })
    git(['init'])
    git(['config', 'user.email', 'test@example.com'])
    git(['config', 'user.name', 'test'])
    git(['add', '.'])
    git(['commit', '-m', 'init'])

    const env = (ci) => ({ ...process.env, CI: ci ? '1' : '' })
    const inCi = spawnSync(process.execPath, [BIN, 'check', '--root', root, '--changed', '--format', 'json'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: env(true),
    })
    assert.equal(inCi.status, 2)
    assert.match(inCi.stderr, /--since/)

    const local = spawnSync(process.execPath, [BIN, 'check', '--root', root, '--changed', '--format', 'json'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: env(false),
    })
    assert.equal(local.status, 0, 'clean local repo must not be punished')
    assert.equal(JSON.parse(local.stdout).findings.length, 0)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: init --apply requires --name', () => {
  const root = tempRoot()
  try {
    const result = run(['init', '--root', root, '--apply'])

    assert.equal(result.status, 2)
    assert.match(result.stderr, /requires --name/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: init rejects traversal names with exit 2 and no writes', () => {
  const root = tempRoot()
  try {
    const result = run(['init', '--root', root, '--name', '../../escape', '--apply'])

    assert.equal(result.status, 2)
    assert.match(result.stderr, /invalid name/)
    assert.equal(fs.existsSync(path.join(root, 'apps')), false)
    assert.equal(fs.existsSync(path.resolve(root, '../escape')), false)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
    fs.rmSync(path.resolve(root, '../escape'), { recursive: true, force: true })
  }
})

void test('cli: audit runs static rules only by default, warns about skipped gates, --run-gates executes and redacts', () => {
  const root = tempRoot()
  try {
    fs.mkdirSync(path.join(root, 'src'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'index.ts'), 'export const ready = true\n')
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'x' }))
    fs.writeFileSync(
      path.join(root, 'codecraft.config.json'),
      JSON.stringify({
        gates: [{ id: 'leak', entry: `node -e "console.log('Authorization: Bearer abc.def.ghi'); process.exit(1)"` }],
      }),
    )

    // 2.0：默认不执行 gates，stderr 告警提示未执行，不改变退出码。
    const skipped = run(['audit', '--root', root, '--format', 'json'])
    assert.equal(skipped.status, 0)
    assert.match(skipped.stderr, /gate\(s\) were NOT run/)
    const skippedReport = JSON.parse(skipped.stdout)
    assert.equal(skippedReport.summary.gates, 0)
    assert.equal(skippedReport.summary.gateFailures, 0)
    assert.equal(skippedReport.warnings.length, 0, 'skipped-gates warning must not change the exit code via warnings')

    // 显式 --no-gates：不重复告警。
    const noGates = run(['audit', '--root', root, '--format', 'json', '--no-gates'])
    assert.equal(noGates.status, 0)
    assert.equal(noGates.stderr, '')

    // --run-gates：显式执行，脱敏与 --no-gate-output 保持 1.14 行为。
    const explicit = run(['audit', '--root', root, '--format', 'json', '--run-gates'])
    assert.equal(explicit.status, 1)
    const report = JSON.parse(explicit.stdout)
    assert.equal(report.summary.gateFailures, 1)
    assert.ok(!/abc\.def\.ghi/.test(report.gates[0].output), 'gate secret must not survive into the report')
    assert.equal(report.gates[0].redacted, 1)
    assert.equal(report.warnings.length, 0)

    const suppressed = run(['audit', '--root', root, '--format', 'json', '--run-gates', '--no-gate-output'])
    const report2 = JSON.parse(suppressed.stdout)
    assert.match(report2.gates[0].output, /suppressed by --no-gate-output/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: --update-baseline snapshots, --baseline suppresses known findings, ratchet refuses growth', () => {
  const root = tempRoot()
  try {
    fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'pages', 'home.ts'), "import { User } from '@/external/user'\n")

    // 首次生成基线。
    const created = run(['check', '--root', root, '--update-baseline'])
    assert.equal(created.status, 0)
    assert.match(created.stdout, /baseline written: .*codecraft-baseline\.json \(1 entries\)/)

    // 基线激活：存量被抑制，退出码归零。
    const clean = run(['check', '--root', root, '--baseline', '--ci', '--format', 'json'])
    assert.equal(clean.status, 0)
    const cleanReport = JSON.parse(clean.stdout)
    assert.equal(cleanReport.findings.length, 0)
    assert.equal(cleanReport.baseline.suppressed, 1)
    assert.equal(cleanReport.baseline.total, 1)
    assert.equal(cleanReport.summary.baselineSuppressed, 1)

    // 新增问题：基线模式下只报新增，--ci 阻断。
    fs.writeFileSync(path.join(root, 'src', 'pages', 'extra.ts'), 'export async function f() {\n  return fetch("/x").catch(() => {})\n}\n')
    const grown = run(['check', '--root', root, '--baseline', '--ci', '--format', 'json'])
    assert.equal(grown.status, 1)
    const grownReport = JSON.parse(grown.stdout)
    assert.equal(grownReport.findings.length, 1)
    assert.equal(grownReport.baseline.suppressed, 1)

    // 棘轮：update 拒绝新增条目。
    const refused = run(['check', '--root', root, '--update-baseline'])
    assert.equal(refused.status, 2)
    assert.match(refused.stderr, /refusing to add 1 new finding/)

    // --force 重建（显式逃逸口）。
    const forced = run(['check', '--root', root, '--update-baseline', '--force'])
    assert.equal(forced.status, 0)
    assert.match(forced.stdout, /\+1 new/)

    // 修复后收缩：棘轮允许减少。
    fs.rmSync(path.join(root, 'src', 'pages', 'extra.ts'))
    const shrunk = run(['check', '--root', root, '--update-baseline'])
    assert.equal(shrunk.status, 0)
    assert.match(shrunk.stdout, /-1 resolved/)

    // --changed / --since / --rules 与 update 互斥（基线必须是整包全量快照）。
    const conflict = run(['check', '--root', root, '--changed', '--update-baseline'])
    assert.equal(conflict.status, 2)
    assert.match(conflict.stderr, /drop --changed/)

    const narrowed = run(['check', '--root', root, '--rules', 'A6', '--update-baseline'])
    assert.equal(narrowed.status, 2)
    assert.match(narrowed.stderr, /drop --rules/)

    // 密钥永不进基线：update 时明确排除并提示轮换，激活基线后仍会被报出。
    fs.writeFileSync(path.join(root, '.env'), 'API_KEY=abcdef123456\n')
    const withSecret = run(['check', '--root', root, '--update-baseline'])
    assert.equal(withSecret.status, 0)
    assert.match(withSecret.stdout, /1 critical secret finding\(s\) excluded/)

    const afterSecret = JSON.parse(run(['check', '--root', root, '--baseline', '--format', 'json']).stdout)
    assert.equal(afterSecret.summary.critical, 1)
    assert.equal(afterSecret.findings.filter((item) => item.rule === 'A21').length, 1, 'secrets stay visible under --baseline')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: missing baseline file warns instead of silently suppressing nothing', () => {
  const root = tempRoot()
  try {
    fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'pages', 'home.ts'), "import { User } from '@/external/user'\n")

    const result = run(['check', '--root', root, '--baseline', '--format', 'json'])
    assert.equal(result.status, 0)
    assert.match(result.stderr, /baseline .* not found; nothing is suppressed/)
    assert.equal(JSON.parse(result.stdout).findings.length, 1)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: config "baseline" activates the baseline file', () => {
  const root = tempRoot()
  try {
    fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'pages', 'home.ts'), "import { User } from '@/external/user'\n")
    fs.writeFileSync(path.join(root, 'codecraft.config.json'), JSON.stringify({ baseline: 'state/baseline.json' }))

    const created = run(['check', '--root', root, '--update-baseline'])
    assert.equal(created.status, 0)
    assert.ok(fs.existsSync(path.join(root, 'state', 'baseline.json')))

    const clean = run(['check', '--root', root, '--ci', '--format', 'json'])
    assert.equal(clean.status, 0)
    assert.equal(JSON.parse(clean.stdout).baseline.suppressed, 1)

    // 无效 baseline 字段：exit 2。
    fs.writeFileSync(path.join(root, 'codecraft.config.json'), JSON.stringify({ baseline: 42 }))
    const invalid = run(['check', '--root', root])
    assert.equal(invalid.status, 2)
    assert.match(invalid.stderr, /"baseline" must be true or a path/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: --rules filters as a pack intersection and warns on unknown rules', () => {
  const root = tempRoot()
  try {
    fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'pages', 'home.ts'), "import { User } from '@/external/user'\nexport function h() {}\n")
    fs.writeFileSync(path.join(root, 'src', 'util.ts'), 'export function g() {\n  try {\n    JSON.parse("{")\n  } catch {}\n}\n')

    // 全量：A17 + A6 各一条。
    const all = JSON.parse(run(['check', '--root', root, '--format', 'json']).stdout)
    assert.equal(all.findings.length, 2)
    assert.equal(all.ruleFilter, null)

    // --rules A6：只留 A6；coverage.rules 同步收窄。
    const onlyA6 = JSON.parse(run(['check', '--root', root, '--rules', 'A6', '--format', 'json']).stdout)
    assert.deepEqual(onlyA6.findings.map((item) => item.rule), ['A6'])
    assert.deepEqual(onlyA6.ruleFilter, ['A6'])
    assert.deepEqual(Object.keys(onlyA6.coverage.rules), ['A6'])

    // 全部规则都不在 pack 内：用法错误，exit 2（否则会 0 findings 静默变绿）。
    const unknown = run(['check', '--root', root, '--rules', 'A2'])
    assert.equal(unknown.status, 2)
    assert.match(unknown.stderr, /none of --rules A2 exist in pack "app"/)

    // 部分不在 pack 内：警告 + 按交集继续。
    const partial = run(['check', '--root', root, '--rules', 'A6,A2', '--format', 'json'])
    assert.equal(partial.status, 0)
    assert.match(partial.stderr, /not in pack "app": A2/)
    assert.deepEqual(JSON.parse(partial.stdout).findings.map((item) => item.rule), ['A6'])

    // 组合 --ci：过滤后无 findings 则通过。
    const ci = run(['check', '--root', root, '--rules', 'A21', '--ci'])
    assert.equal(ci.status, 0)

    // 非法规则 ID：exit 2。
    const invalid = run(['check', '--root', root, '--rules', 'B6'])
    assert.equal(invalid.status, 2)
    assert.match(invalid.stderr, /invalid --rules entry/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: --compare diffs against a previous json report without changing the exit code', () => {
  const root = tempRoot()
  try {
    fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'pages', 'home.ts'), "import { User } from '@/external/user'\n")

    const before = run(['check', '--root', root, '--format', 'json'])
    assert.equal(before.status, 0)
    fs.writeFileSync(path.join(root, 'before.json'), before.stdout)

    // 修复旧问题 + 引入新问题。
    fs.writeFileSync(path.join(root, 'src', 'pages', 'home.ts'), 'export function h() {}\n')
    fs.writeFileSync(path.join(root, 'src', 'pages', 'extra.ts'), 'export function g() {\n  try {\n    JSON.parse("{")\n  } catch {}\n}\n')

    const after = run(['check', '--root', root, '--compare', 'before.json', '--format', 'json'])
    assert.equal(after.status, 0, 'compare is informational; exit code follows findings severity only')
    const report = JSON.parse(after.stdout)
    assert.equal(report.compare.added.length, 1)
    assert.equal(report.compare.added[0].rule, 'A6')
    assert.equal(report.compare.resolved.length, 1)
    assert.equal(report.compare.resolved[0].rule, 'A17')

    // markdown 报告带 Compare 段。
    const markdown = run(['check', '--root', root, '--compare', 'before.json'])
    assert.match(markdown.stdout, /## Compare/)
    assert.match(markdown.stdout, /- Added: 1/)
    assert.match(markdown.stdout, /- Resolved: 1/)

    // 缺文件 / 非报告 JSON：exit 2。
    const missing = run(['check', '--root', root, '--compare', 'nope.json'])
    assert.equal(missing.status, 2)
    assert.match(missing.stderr, /compare report not found/)

    fs.writeFileSync(path.join(root, 'bad.json'), '{"hello":1}')
    const invalid = run(['check', '--root', root, '--compare', 'bad.json'])
    assert.equal(invalid.status, 2)
    assert.match(invalid.stderr, /missing a findings array/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: A21 secrets are marked critical (report callout) without changing severity / exit code', () => {
  const root = tempRoot()
  try {
    fs.mkdirSync(path.join(root, 'src'), { recursive: true })
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'x' }))
    fs.writeFileSync(path.join(root, '.env'), 'API_KEY=abcdef123456\n')

    // 报告模式：A21 标 critical（置顶），severity 仍是 warn，退出码 0。
    const result = run(['check', '--root', root, '--format', 'json'])
    assert.equal(result.status, 0)
    const report = JSON.parse(result.stdout)
    assert.equal(report.findings.length, 1)
    assert.equal(report.findings[0].rule, 'A21')
    assert.equal(report.findings[0].critical, true)
    assert.equal(report.findings[0].severity, 'warn', 'severity stays the enforcement level')
    assert.equal(report.summary.critical, 1)
    assert.equal(report.severity, 'warn')

    // markdown 报告有 Critical 置顶段。
    const markdown = run(['check', '--root', root])
    assert.match(markdown.stdout, /## Critical/)
    assert.match(markdown.stdout, /- Critical \(A21 secrets\): 1/)

    // SARIF：critical 以 error 级别上报（Code Scanning 侧），本工具退出码仍为 0。
    const sarif = run(['check', '--root', root, '--format', 'sarif'])
    assert.equal(sarif.status, 0)
    assert.equal(JSON.parse(sarif.stdout).runs[0].results[0].level, 'error')

    // --ci：所有 findings 视为 error 并阻断。
    const ci = run(['check', '--root', root, '--ci'])
    assert.equal(ci.status, 1)

    // 非密钥类规则不带 critical。
    fs.writeFileSync(path.join(root, 'src', 'index.ts'), 'export function f() {\n  try {\n    JSON.parse("{")\n  } catch {}\n}\n')
    const mixed = JSON.parse(run(['check', '--root', root, '--format', 'json']).stdout)
    const byRule = Object.fromEntries(mixed.findings.map((item) => [item.rule, item]))
    assert.equal(byRule.A21.critical, true)
    assert.equal(byRule.A6.critical, undefined)
    assert.equal(byRule.A6.severity, 'warn')
    assert.equal(mixed.summary.critical, 1, 'only A21 secret findings count as critical')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: --exclude skips files and records the pattern', () => {
  const root = tempRoot()
  try {
    fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
    fs.mkdirSync(path.join(root, 'evals', 'fixtures'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'pages', 'home.ts'), "import { User } from '@/external/user'\n")
    fs.writeFileSync(path.join(root, 'evals', 'fixtures', '.env'), 'APP_SECRET=abcdef123456\n')

    const all = JSON.parse(run(['check', '--root', root, '--format', 'json']).stdout)
    assert.equal(all.findings.length, 2)

    const result = run(['check', '--root', root, '--exclude', 'evals', '--format', 'json'])
    const report = JSON.parse(result.stdout)

    assert.equal(result.status, 0)
    assert.equal(report.findings.length, 1)
    assert.deepEqual(report.exclude, ['evals'])
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: config exclude merges with --exclude', () => {
  const root = tempRoot()
  try {
    fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
    fs.mkdirSync(path.join(root, 'evals', 'fixtures'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'pages', 'home.ts'), "import { User } from '@/external/user'\n")
    fs.writeFileSync(path.join(root, 'evals', 'fixtures', '.env'), 'APP_SECRET=abcdef123456\n')
    fs.writeFileSync(path.join(root, 'codecraft.config.json'), JSON.stringify({ exclude: ['evals'] }))

    const fromConfig = JSON.parse(run(['check', '--root', root, '--format', 'json']).stdout)
    assert.equal(fromConfig.findings.length, 1)
    assert.deepEqual(fromConfig.exclude, ['evals'])

    const merged = JSON.parse(run(['check', '--root', root, '--exclude', 'src/pages', '--format', 'json']).stdout)
    assert.equal(merged.findings.length, 0)
    assert.deepEqual(merged.exclude, ['evals', 'src/pages'])
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: --exclude without a value exits 2', () => {
  const result = run(['check', '--exclude'])

  assert.equal(result.status, 2)
  assert.match(result.stderr, /--exclude needs/)
})
