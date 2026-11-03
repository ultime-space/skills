import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { check } from './check.mjs'
import { isGateFailed, loadConfig, runGates } from './gates.mjs'
import { buildPlan, summarizePlan } from './plan.mjs'
import { applyInitPlan, assertValidName, buildInitPlan } from './init.mjs'
import { applyIgnores } from './ignore.mjs'
import {
  applyBaseline,
  buildBaselineData,
  diffBaseline,
  diffFindings,
  loadBaseline,
  resolveBaselinePath,
  writeBaseline,
} from './baseline.mjs'

const PACKAGE = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const VERSION = PACKAGE.version

/** 各 pack 的内置规则集；--rules 只能在此基础上取交集。 */
const PACK_RULES = {
  app: ['A6', 'A17', 'A21'],
  library: ['A2', 'A6', 'A11', 'A21'],
  'design-system': ['A2', 'A6', 'A11', 'A21'],
}

export const HELP = `codecraft <command> [options]

Commands:
  check       Scan for boundary violations (default)
  audit       check + configured gates with --run-gates; static rules only by default
  plan        Read-only upgrade plan from findings
  init        Scaffold an app or package (dry-run unless --apply)
  version     Print version

Options:
  --root <path>            Project root (default: cwd)
  --pack app|library|design-system|auto  Rule pack (default: auto)
  --config <path>          Config file (default: codecraft.config.json)
  --changed                Only report findings in changed / untracked files
  --since <ref>            Only report findings changed since a git ref (e.g. origin/main)
  --rules A6,A21           Only report findings from these rules (intersection with the pack; pack stays the source of truth)
  --baseline [path]        Suppress findings already recorded in the baseline (default path: codecraft-baseline.json; config "baseline" also activates it)
  --update-baseline        Snapshot current findings into the baseline; refuses to ADD entries unless --force (baseline shrinks, never grows)
  --force                  With --update-baseline: rebuild even when it would add entries
  --compare <report.json>  Diff current findings against a previous check --format json report (added / resolved; informational, does not change the exit code)
  --exclude <glob>         Skip files when scanning (repeatable; e.g. "evals/fixtures/**")
  --no-gates               Skip gates in audit / plan
  --with-gates             Run configured gates in plan
  --run-gates              Explicitly run configured gates in audit (2.0: required; off by default)
  --no-gate-output         Omit gate output from the report
  --fail-fast              Stop gates after the first failure
  --name <name>            Scaffold name (required with --apply)
  --apply                  Write the scaffold; existing paths are skipped
  --format md|json|sarif   Output format (default: md)
  --severity warn|error    warn: report only (default); error: same as --ci
  --ci                     Treat findings as errors
  --help, -h
  --version, -v

Packs:
  app            A6 / A17 / A21 — empty catch; pages / components / behavior must not import
                 external or generated; high-confidence secrets are always scanned
  library        A2 / A6 / A11 / A21 — package boundaries, empty catch, generated-file markers, secret scan
  design-system  A2 / A6 / A11 / A21 — library rules + public docs must not reference internal docs
`

export function main(argv) {
  const args = parseArgs(argv)
  if (args.help) {
    console.log(HELP)
    return 0
  }
  if (args.version || args.command === 'version') {
    console.log(VERSION)
    return 0
  }

  const command = args.command || 'check'
  if (!['check', 'audit', 'plan', 'init'].includes(command)) {
    console.error(`codecraft: unknown command "${command}"\n  next: run codecraft --help`)
    return 2
  }
  if (args.updateBaseline && !['check', 'audit'].includes(command)) {
    console.error(`codecraft: --update-baseline works with check / audit only\n  next: run codecraft check --update-baseline`)
    return 2
  }

  const root = path.resolve(process.cwd(), args.root)
  if (!fs.existsSync(root)) {
    console.error(`codecraft: root not found: ${root}\n  next: pass --root <project> or run from the project directory`)
    return 2
  }

  let config
  try {
    config = loadConfig(root, args.config)
  } catch (error) {
    console.error(`codecraft: ${error.message}`)
    return 2
  }

  const pack = resolvePack(args.pack, config.config.pack, root)
  if (!pack) {
    console.error(
      `codecraft: invalid config pack "${config.config.pack}"\n  next: use app, library, design-system or auto`,
    )
    return 2
  }

  if (command === 'init') {
    if (args.apply && !args.name) {
      console.error('codecraft: init --apply requires --name <name>\n  next: add --name <demo>')
      return 2
    }
    if (args.name) {
      try {
        assertValidName(args.name)
      } catch (error) {
        console.error(`codecraft: ${error.message}`)
        return 2
      }
    }
    const plan = buildInitPlan(root, pack === 'design-system' ? 'library' : pack, args.name)
    const applied = args.apply ? applyInitPlan(root, plan) : null
    const meta = {
      version: VERSION,
      mode: 'init',
      pack,
      root,
      configFile: config.file,
      name: args.name,
      dryRun: !args.apply,
      entries: plan.entries.length,
      created: applied?.created.length ?? 0,
      skipped: applied?.skipped.length ?? 0,
    }
    if (args.format === 'json') {
      console.log(JSON.stringify({ ...meta, entries: plan.entries, config: plan.config, applied }, null, 2))
    } else {
      console.log(formatInit(meta, plan, applied))
    }
    return 0
  }

  const exclude = [...new Set([...(config.config.exclude ?? []), ...args.exclude])]
  const result = check(root, {
    pack,
    boundaries: config.config.boundaries,
    exclude,
  })
  const coverage = result.coverage
  let changed = null
  let scoped = result.findings
  // --rules 是 pack 的过滤器（交集）：config 的 pack 仍是唯一真源，agent 循环只缩小范围、不改变集合来源。
  const packRuleIds = PACK_RULES[pack]
  const activeRules = args.rules?.length ? packRuleIds.filter((id) => args.rules.includes(id)) : packRuleIds
  if (args.rules?.length) {
    // 全部规则都不在当前 pack 里 = 用法错误：照常跑会 0 findings 变绿，静默废掉门禁。
    if (!activeRules.length) {
      console.error(
        `codecraft: none of --rules ${args.rules.join(',')} exist in pack "${pack}" (pack rules: ${packRuleIds.join(' / ')})\n  next: pass --pack library|design-system, or drop --rules`,
      )
      return 2
    }
    scoped = scoped.filter((finding) => activeRules.includes(finding.rule))
    const unknown = args.rules.filter((id) => !packRuleIds.includes(id))
    if (unknown.length) {
      console.error(
        `codecraft: warning: rule(s) not in pack "${pack}": ${unknown.join(', ')} (pack rules: ${packRuleIds.join(' / ')})`,
      )
    }
  }
  if (args.changed || args.since) {
    try {
      changed = changedFiles(root, args.since)
    } catch (error) {
      console.error(`codecraft: ${error.message}`)
      return 2
    }
    // 按包精确匹配：library findings 相对包目录（absBase），不能靠后缀，否则跨包同名路径会误判。
    // macOS 等系统下 root 可能经符号链接（/tmp → /private/tmp），统一换算成相对 realRoot 的路径再比较。
    const realRoot = fs.realpathSync(root)
    const changedRel = new Set(changed)
    const prefixCache = new Map()
    scoped = scoped.filter((finding) => {
      const base = String(finding.absBase ?? root)
      if (!prefixCache.has(base)) {
        let rel = ''
        try {
          rel = path.relative(realRoot, fs.realpathSync(base))
        } catch {
          rel = ''
        }
        prefixCache.set(base, rel && rel !== '.' ? rel.split(path.sep).join('/') : '')
      }
      const prefix = prefixCache.get(base)
      const file = finding.file.replace(/\\/g, '/')
      return changedRel.has(prefix ? `${prefix}/${file}` : file)
    })
    // CI 检出的是干净工作区，--changed 无变更 = 全部 findings 被过滤 = 静默变绿；显式失败并指向 --since。
    if (args.changed && !args.since && changed.length === 0 && process.env.CI) {
      console.error(
        'codecraft: --changed found no changed files (CI checkouts are clean); use --since <base-ref> to compare against a base branch',
      )
      return 2
    }
  }
  // 生效级别：--ci 或 --severity error 时所有 findings 视为 error（阻断）；否则保留规则基础级别
  // （A21 密钥为 error，其余 warn），退出码不随 findings——报告归报告，阻断归 --ci。
  const enforce = args.ci || args.severity === 'error'
  const findings = scoped.map((finding) => (enforce ? { ...finding, severity: 'error' } : { ...finding }))
  const filtered = applyIgnores(findings, config.config.ignore ?? [])
  const warnings = []

  // --update-baseline：快照当前 findings（ignore 之后）到基线文件；只减不增的棘轮在 addBaseline/updateBaseline 里。
  if (args.updateBaseline) {
    return updateBaseline(root, baselineValue(args, config), filtered.findings, args, VERSION)
  }

  // baseline：命中基线的存量 findings 被抑制，退出码只看新增（L2 全量阻断 + 存量消化的组合件）。
  const baselineArgs = baselineValue(args, config)
  let baseline = null
  if (baselineArgs) {
    const baselineFile = resolveBaselinePath(root, baselineArgs)
    try {
      baseline = loadBaseline(baselineFile, VERSION)
    } catch (error) {
      console.error(`codecraft: ${error.message}`)
      return 2
    }
    if (!baseline) {
      console.error(
        `codecraft: warning: baseline ${baselineFile} not found; nothing is suppressed (run check --update-baseline to create it)`,
      )
    }
    for (const message of baseline?.warnings ?? []) console.error(`codecraft: warning: ${message}`)
  }
  const baselineApplied = applyBaseline(filtered.findings, baseline)
  const activeFindings = baselineApplied.active
  const baselineInfo = baseline
    ? { file: baseline.file, suppressed: baselineApplied.suppressed.length, total: baseline.data.count }
    : null

  // --compare：与上次 JSON 报告对比趋势；只影响报告内容，不改退出码（阻断语义归 --ci）。
  let comparison = null
  if (args.compare) {
    try {
      comparison = { file: path.resolve(root, args.compare), ...diffFindings(loadPreviousFindings(root, args.compare), activeFindings) }
    } catch (error) {
      console.error(`codecraft: ${error.message}`)
      return 2
    }
    // 变更范围内对比全量报告：本次 findings 只是子集，resolved 会被系统性放大。
    if (args.changed || args.since) {
      console.error(
        'codecraft: warning: --compare against a full report while this run is scope-limited (--changed / --since); resolved counts are inflated',
      )
    }
  }
  if (result.files === 0 && result.findings.length === 0) {
    warnings.push(`0 source files scanned under ${root}; pass --pack app|library or check --root`)
    console.error(`codecraft: warning: ${warnings[0]}`)
  }
  const gates = shouldRunGates(command, args)
    ? runGates(root, config.config.gates ?? [], {
        failFast: args.failFast,
        // files / exclude 作用域只在 --changed / --since 模式下评估；全量模式所有 gate 都跑。
        changedFiles: args.changed || args.since ? (changed ?? []) : null,
      })
    : []
  const gateOutput = args.noGateOutput
    ? gates.map((gate) => ({ ...gate, output: '(suppressed by --no-gate-output)' }))
    : gates
  // 配置了 gates 但未执行时显式告警（stderr），避免存量 CI 在 2.0 静默失去门禁；不进 warnings、不改退出码。
  if (command === 'audit' && !args.runGates && !args.noGates && config.config.gates?.length) {
    console.error(
      `codecraft: warning: ${config.config.gates.length} configured gate(s) were NOT run; add --run-gates to run them (2.0: audit no longer runs gates by default — see README "Upgrade to 2.0")`,
    )
  }
  const plan = command === 'plan' ? buildPlan(activeFindings) : []
  // --rules 收窄时 coverage.rules 只保留生效规则，避免把没跑的规则读成「已扫无问题」。
  const coverageOut =
    args.rules?.length && coverage
      ? { ...coverage, rules: Object.fromEntries(activeRules.map((id) => [id, coverage.rules[id]]).filter(Boolean)) }
      : coverage
  const meta = {
    version: VERSION,
    mode: command,
    pack,
    root,
    config: config.file,
    severity: enforce ? 'error' : 'warn',
    rules: activeRules,
    ruleFilter: args.rules?.length ? args.rules : null,
    files: result.files,
    scope: args.changed || args.since ? 'changed' : 'full',
    changed: changed?.length ?? null,
    exclude,
    findings: activeFindings.length,
    critical: activeFindings.filter((finding) => finding.critical).length,
    ignored: filtered.ignored.length,
    expired: filtered.expired.length,
    baseline: baselineInfo,
    compare: comparison ? { file: comparison.file, added: comparison.added.length, resolved: comparison.resolved.length } : null,
    warnings,
    plan: plan.length,
    gates: gates.length,
    coverage: coverageOut,
  }

  if (args.format === 'json') {
    console.log(
      JSON.stringify(
        {
          ...meta,
          coverage: coverageOut,
          findings: activeFindings,
          ignored: filtered.ignored,
          exceptions: filtered.exceptions,
          compare: comparison,
          plan,
          gates: gateOutput,
          summary: {
            files: result.files,
            findings: activeFindings.length,
            critical: activeFindings.filter((finding) => finding.critical).length,
            ignored: filtered.ignored.length,
            expired: filtered.expired.length,
            baselineSuppressed: baselineInfo?.suppressed ?? 0,
            plan: plan.length,
            gates: gateOutput.length,
            gateFailures: gateOutput.filter((gate) => isGateFailed(gate)).length,
          },
        },
        null,
        2,
      ),
    )
  } else if (args.format === 'sarif') {
    console.log(formatSarif(meta, activeFindings))
  } else if (command === 'plan') {
    console.log(appendCompare(formatPlan(meta, activeFindings, plan, gateOutput), comparison))
  } else {
    console.log(appendCompare(formatReport(meta, activeFindings, filtered.ignored, filtered.expired, gateOutput), comparison))
  }

  // 阻断语义：只有 enforce（--ci / --severity error）或 gate 失败才 exit 1；报告模式恒 0。
  const failed =
    (enforce && activeFindings.length > 0) ||
    gates.some((gate) => isGateFailed(gate))
  if (warnings.length) return 2
  return failed ? 1 : 0
}

function shouldRunGates(command, args) {
  if (args.noGates) return false
  // 2.0 起 audit 默认只跑静态规则，gates 需显式 --run-gates（1.x 的弃用预告在此兑现）。
  if (command === 'audit') return args.runGates
  if (command === 'plan') return args.withGates
  return false
}

/** baseline 激活值：CLI --baseline > config "baseline"；都没有则未激活。 */
function baselineValue(args, config) {
  return args.baseline ?? config.config.baseline
}

/** --update-baseline：写基线快照；已有基线时拒绝新增条目（只减不增），--force 才允许重建。 */
function updateBaseline(root, baselineValue, findings, args, version) {
  const file = resolveBaselinePath(root, baselineValue ?? true)
  // 密钥永不进基线（与 ignore 禁止豁免 A21 同口径），只能移除并轮换。
  const secrets = findings.filter((finding) => finding.critical).length
  const secretNote = secrets ? `; ${secrets} critical secret finding(s) excluded — remove and rotate them` : ''
  let previous = null
  if (fs.existsSync(file)) {
    try {
      previous = loadBaseline(file, version)
    } catch (error) {
      if (!args.force) {
        console.error(`codecraft: ${error.message}`)
        return 2
      }
      previous = null
    }
  }

  const next = buildBaselineData(findings, version, new Date().toISOString().slice(0, 10))
  if (previous) {
    const { added, removed } = diffBaseline(previous.data, next)
    if (added.length && !args.force) {
      console.error(
        `codecraft: refusing to add ${added.length} new finding(s) to baseline ${file}; fix them or register ignore entries (rerun with --force to rebuild anyway)`,
      )
      for (const item of added.slice(0, 10)) console.error(`  + ${item}`)
      if (added.length > 10) console.error(`  ... and ${added.length - 10} more`)
      return 2
    }
    writeBaseline(file, next)
    console.log(
      `codecraft: baseline updated: ${file} (${next.count} entries; +${added.length} new, -${removed.length} resolved${secretNote})`,
    )
    return 0
  }

  writeBaseline(file, next)
  console.log(`codecraft: baseline written: ${file} (${next.count} entries${secretNote})`)
  return 0
}

/** --compare 的输入：上次运行的 `check --format json` 报告；只取 findings 数组。 */
function loadPreviousFindings(root, file) {
  const target = path.resolve(root, file)
  if (!fs.existsSync(target)) {
    throw new Error(`compare report not found: ${target} (pass a previous check --format json report)`)
  }
  let data
  try {
    data = JSON.parse(fs.readFileSync(target, 'utf8'))
  } catch (error) {
    throw new Error(`invalid compare report ${target}: ${error.message}`)
  }
  if (!Array.isArray(data.findings)) {
    throw new Error(`invalid compare report ${target}: missing a findings array (run check --format json first)`)
  }
  return data.findings
}

/** markdown 报告尾部的 Compare 段：趋势一眼可读；明细在 JSON 的 compare 字段。 */
function appendCompare(text, comparison) {
  if (!comparison) return text
  const lines = [
    '',
    '## Compare',
    '',
    `- Against: ${comparison.file}`,
    `- Added: ${comparison.added.length}`,
    `- Resolved: ${comparison.resolved.length}`,
  ]
  if (comparison.added.length) {
    lines.push('', '| Rule | File | Line | Message |', '|---|---|---|---|')
    for (const item of comparison.added) {
      lines.push(`| ${item.rule} | ${item.file} | ${item.line} | ${escapeCell(item.message)} |`)
    }
  }
  return `${text}${lines.join('\n')}`
}

function resolvePack(cliPack, configPack, root) {
  if (cliPack !== 'auto') return cliPack
  if (configPack && configPack !== 'auto') {
    return ['app', 'library', 'design-system'].includes(configPack) ? configPack : null
  }
  return detectPack(root)
}

function parseArgs(argv) {
  const args = {
    command: '',
    root: '.',
    pack: 'auto',
    config: '',
    noGates: false,
    withGates: false,
    runGates: false,
    noGateOutput: false,
    failFast: false,
    name: '',
    apply: false,
    changed: false,
    since: '',
    rules: null,
    baseline: undefined,
    updateBaseline: false,
    force: false,
    compare: '',
    exclude: [],
    format: 'md',
    severity: 'warn',
    ci: false,
    help: false,
    version: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') args.help = true
    else if (arg === '--version' || arg === '-v') args.version = true
    else if (arg === '--ci') args.ci = true
    else if (arg === '--no-gates') args.noGates = true
    else if (arg === '--with-gates') args.withGates = true
    // 2.0 起 --run-gates 是 audit 执行 gates 的唯一入口。
    else if (arg === '--run-gates') args.runGates = true
    else if (arg === '--no-gate-output') args.noGateOutput = true
    else if (arg === '--fail-fast') args.failFast = true
    else if (arg === '--apply') args.apply = true
    else if (arg === '--changed') args.changed = true
    else if (arg === '--since') args.since = argv[++i] ?? ''
    else if (arg === '--rules') {
      const value = argv[++i] ?? ''
      args.rules = value
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
      if (!args.rules.length) fail('--rules needs a comma-separated list (e.g. "A6,A21")')
      const bad = args.rules.filter((id) => !/^A\d+$/.test(id))
      if (bad.length) fail(`invalid --rules entry: ${bad.join(', ')} (expected rule IDs like A6, A21)`)
    }
    // --baseline 后跟非 flag 时取作路径；裸 --baseline 用默认文件名。
    else if (arg === '--baseline') {
      const next = argv[i + 1]
      if (next != null && !next.startsWith('-')) {
        args.baseline = next
        i += 1
      } else {
        args.baseline = true
      }
    }
    else if (arg === '--update-baseline') args.updateBaseline = true
    else if (arg === '--force') args.force = true
    else if (arg === '--compare') args.compare = argv[++i] ?? ''
    else if (arg === '--exclude') {
      const pattern = argv[++i] ?? ''
      if (!pattern) fail('--exclude needs a path or glob (e.g. "evals/fixtures/**")')
      args.exclude.push(pattern)
    }
    else if (arg === '--name') args.name = argv[++i] ?? ''
    else if (arg === '--root') args.root = argv[++i] ?? '.'
    else if (arg === '--pack') args.pack = argv[++i] ?? 'auto'
    else if (arg === '--config') args.config = argv[++i] ?? ''
    else if (arg === '--format') args.format = argv[++i] ?? 'md'
    else if (arg === '--severity') args.severity = argv[++i] ?? 'warn'
    else if (!arg.startsWith('-') && !args.command) args.command = arg
    else fail(`unknown option: ${arg}`)
  }

  if (!['app', 'library', 'design-system', 'auto'].includes(args.pack)) fail(`invalid --pack: ${args.pack}`)
  if (args.updateBaseline && (args.changed || args.since)) {
    fail('--update-baseline snapshots the full scan; drop --changed / --since')
  }
  // 基线必须是整包快照：用 --rules 收窄会把其它规则排除在基线外，之后全部被误报为新增。
  if (args.updateBaseline && args.rules) {
    fail('--update-baseline snapshots every rule in the pack; drop --rules')
  }
  if (args.format !== 'md' && args.format !== 'json' && args.format !== 'sarif') {
    fail(`invalid --format: ${args.format}`)
  }
  if (args.severity !== 'warn' && args.severity !== 'error') {
    fail(`invalid --severity: ${args.severity}`)
  }

  return args
}

function changedFiles(root, since) {
  const top = git(root, ['rev-parse', '--show-toplevel'])
  if (top == null) {
    throw new Error('not a git repository; --changed / --since need git (run inside a git repo or drop the flag)')
  }

  const lists = [git(root, ['diff', '--name-only', '--diff-filter=ACMRT', 'HEAD'])]
  if (since) lists.push(git(root, ['diff', '--name-only', '--diff-filter=ACMRT', `${since}...HEAD`]))
  lists.push(git(root, ['ls-files', '--others', '--exclude-standard']))

  const realRoot = fs.realpathSync(root)
  const files = new Set()
  for (const list of lists) {
    if (!list) continue
    for (const line of list.split('\n')) {
      const file = line.trim()
      if (!file) continue
      const relative = path.relative(realRoot, path.resolve(top, file)).split(path.sep).join('/')
      if (relative && !relative.startsWith('..')) files.add(relative)
    }
  }
  return [...files]
}

function git(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' })
  if (result.status !== 0) {
    const message = (result.stderr || '').trim()
    throw new Error(`git ${args.join(' ')} failed${message ? `: ${message}` : ''}`)
  }
  return result.stdout.trim()
}

export function detectPack(root) {
  if (isDir(path.join(root, 'apps'))) return 'app'
  if (hasAppMarkers(root)) return 'app'
  if (isDir(path.join(root, 'packages'))) return 'library'
  if (hasNestedApp(root)) return 'app'
  if (isDir(path.join(root, 'src'))) return 'library'
  if (fs.existsSync(path.join(root, 'package.json'))) return 'library'
  return 'app'
}

const APP_DIR_MARKERS = ['src/pages', 'pages', 'app', 'src/app']
const APP_FILE_MARKERS = [
  'nuxt.config.js',
  'nuxt.config.ts',
  'nuxt.config.mjs',
  'app.config.js',
  'app.config.ts',
  'src/app.config.js',
  'src/app.config.ts',
  'taro.config.js',
  'taro.config.ts',
  'vue.config.js',
  'vue.config.ts',
]
const APP_DEPS = ['nuxt', '@tarojs/taro', '@dcloudio/uni-app', 'uni-app', 'next']
/** 单页 Web 应用入口；库的 demo 页通常不具备「框架依赖 + 入口 + html」三件套。 */
const WEB_ENTRIES = [
  'src/main.ts',
  'src/main.js',
  'src/main.tsx',
  'src/main.jsx',
  'src/index.ts',
  'src/index.js',
  'src/index.tsx',
  'src/index.jsx',
]
const WEB_DEPS = ['vue', 'react', 'react-dom', 'react-scripts', 'svelte', 'solid-js', 'preact', '@angular/core']

function hasAppMarkers(root) {
  if (APP_DIR_MARKERS.some((dir) => isDir(path.join(root, dir)))) return true
  if (APP_FILE_MARKERS.some((file) => isFile(path.join(root, file)))) return true
  if (hasUniAppFiles(root)) return true
  if (hasWebEntry(root)) return true
  return hasAppDependency(root)
}

function hasNestedApp(root) {
  let entries
  try {
    entries = fs.readdirSync(root, { withFileTypes: true })
  } catch {
    return false
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (['node_modules', 'dist', 'build', 'target', '.git', '.nuxt', '.output', 'coverage'].includes(entry.name)) {
      continue
    }
    const child = path.join(root, entry.name)
    if (APP_DIR_MARKERS.some((dir) => isDir(path.join(child, dir)))) return true
    if (APP_FILE_MARKERS.some((file) => isFile(path.join(child, file)))) return true
    if (hasUniAppFiles(child)) return true
    if (hasWebEntry(child)) return true
    if (hasAppDependency(child)) return true
  }
  return false
}

function hasUniAppFiles(root) {
  const atRoot = isFile(path.join(root, 'manifest.json')) && isFile(path.join(root, 'pages.json'))
  const atSrc = isFile(path.join(root, 'src', 'manifest.json')) && isFile(path.join(root, 'src', 'pages.json'))
  return atRoot || atSrc
}

function hasAppDependency(root) {
  return dependencyNames(root).some((dep) => APP_DEPS.includes(dep))
}

/** 框架依赖 + html + 入口；三者齐全才按单页应用处理，避免把带 demo 的库判成 app。 */
function hasWebEntry(root) {
  const html = isFile(path.join(root, 'index.html')) || isFile(path.join(root, 'public', 'index.html'))
  if (!html) return false
  if (!dependencyNames(root).some((dep) => WEB_DEPS.includes(dep))) return false
  return WEB_ENTRIES.some((file) => isFile(path.join(root, file)))
}

function dependencyNames(root) {
  let manifest
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  } catch {
    return []
  }
  return Object.keys({ ...(manifest.dependencies ?? {}), ...(manifest.devDependencies ?? {}) })
}

function isFile(target) {
  try {
    return fs.statSync(target).isFile()
  } catch {
    return false
  }
}

function fail(message) {
  console.error(`codecraft: ${message}\n\n${HELP}`)
  process.exit(2)
}

function formatSarif(meta, findings) {
  const rules = meta.rules.map((id) => ({
    id,
    name: SARIF_RULES[id]?.name ?? id,
    shortDescription: { text: SARIF_RULES[id]?.short ?? id },
  }))
  return JSON.stringify(
    {
      $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'codecraft',
              informationUri: 'https://github.com/ultime-space/skills',
              version: meta.version,
              rules,
            },
          },
          results: findings.map((finding) => ({
            ruleId: finding.rule,
            // SARIF 的 level 是消费方（Code Scanning）的告警级别，不参与本工具退出码：
            // critical（A21 密钥）按 error 上报，阻断策略仍由 --ci 决定。
            level: finding.critical || finding.severity === 'error' ? 'error' : 'warning',
            message: { text: finding.message },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri: finding.file.replace(/\\/g, '/') },
                  region: { startLine: finding.line },
                },
              },
            ],
          })),
        },
      ],
    },
    null,
    2,
  )
}

const SARIF_RULES = {
  A2: { name: 'DependencyDirection', short: 'Dependencies must point inward' },
  A6: { name: 'EmptyCatch', short: 'Empty catch swallows failures' },
  A11: { name: 'GeneratedReadOnly', short: 'Generated files must be read-only and marked' },
  A17: { name: 'ExternalBoundary', short: 'Internal layers must not import external or generated types' },
  A21: { name: 'SecretScan', short: 'No secrets or internal paths in repository' },
}

function formatReport(meta, findings, ignored, expired, gates) {
  const lines = header(meta)
  const critical = findings.filter((finding) => finding.critical)

  if (critical.length) {
    lines.push(
      '## Critical',
      '',
      '密钥即红线：先移除并轮换凭据，再处理其它 findings；此项不可用 `ignore` 豁免。',
      '',
      '| Rule | File | Line | Message |',
      '|---|---|---|---|',
    )
    for (const finding of critical) {
      lines.push(`| ${finding.rule} | ${finding.file} | ${finding.line} | ${escapeCell(finding.message)} |`)
    }
    lines.push('')
  }

  if (!findings.length) {
    lines.push('✓ 未发现边界问题。')
  } else {
    lines.push('## Findings', '', '| Rule | Severity | File | Line | Message |', '|---|---|---|---|---|')
    for (const finding of findings) {
      lines.push(row(finding))
    }
  }

  if (ignored.length) {
    lines.push(
      '',
      '## Ignored',
      '',
      '| Rule | File | Line | Reason | Expires |',
      '|---|---|---|---|---|',
    )
    for (const finding of ignored) {
      lines.push(
        `| ${finding.rule} | ${finding.file} | ${finding.line} | ${escapeCell(finding.reason)} | ${finding.expires ?? '—'} |`,
      )
    }
  }

  if (expired.length) {
    lines.push(
      '',
      '## Expired Exceptions',
      '',
      '| Rule | File | Expires | Reason |',
      '|---|---|---|---|',
    )
    for (const exception of expired) {
      lines.push(`| ${exception.rule} | ${exception.file} | ${exception.expires} | ${escapeCell(exception.reason)} |`)
    }
    lines.push('', '- Expired exceptions no longer suppress findings; renew the date or remove the entry.')
  }

  lines.push(...gateLines(gates))
  return lines.join('\n')
}

function formatPlan(meta, findings, plan, gates) {
  const lines = header(meta)
  lines.pop()
  lines.push(`- Plan Items: ${plan.length}`, '')

  if (!plan.length) {
    lines.push('✓ 没有需要处理的问题；无需计划。')
  } else {
    lines.push('## Summary', '', '| Rule | Count |', '|---|---:|')
    for (const item of summarizePlan(findings)) lines.push(`| ${item.rule} | ${item.count} |`)

    lines.push(
      '',
      '## Plan',
      '',
      '| # | Rule | Severity | File | Line | Action | Verification | Constitution |',
      '|---|---|---|---|---|---|---|---|',
    )
    for (const item of plan) {
      const severity = item.critical ? `${item.severity} (critical)` : item.severity
      lines.push(
        `| ${item.id} | ${item.rule} | ${severity} | ${item.file} | ${item.line} | ${escapeCell(item.action)} | \`${item.verification}\` | ${item.constitution} |`,
      )
    }
    lines.push('', '## Next', '', '- Apply in small batches; run `codecraft check` after each.')
    lines.push('- No files were changed by this command.')
  }

  lines.push(...gateLines(gates))
  return lines.join('\n')
}

function formatInit(meta, plan, applied) {
  const lines = [
    '# Codecraft Init',
    '',
    `- Version: ${meta.version}`,
    `- Mode: init`,
    `- Pack: ${meta.pack}`,
    `- Root: ${meta.root}`,
    `- Name: ${meta.name || '（placeholder）'}`,
    `- Dry run: ${meta.dryRun}`,
    `- Entries: ${meta.entries}`,
  ]

  if (applied) {
    lines.push(`- Created: ${meta.created}`, `- Skipped: ${meta.skipped}`)
  }

  lines.push('', '## Directories', '', '| Path | Action |', '|---|---|')

  for (const entry of plan.entries.filter((item) => item.type === 'dir')) {
    lines.push(`| ${entry.path} | ${entry.action} |`)
  }

  lines.push('', '## Files', '', '| Path | Action |', '|---|---|')
  for (const entry of plan.entries.filter((item) => item.type === 'file')) {
    lines.push(`| ${entry.path} | ${entry.action} |`)
  }

  lines.push('', '## Config', '', '```json', JSON.stringify(plan.config, null, 2), '```')

  if (applied) {
    lines.push('', '## Appended', '', '- Existing paths are skipped; nothing was overwritten.')
    if (applied.created.length) {
      lines.push('', 'Created:', '')
      for (const item of applied.created) lines.push(`- ${item}`)
    }
    if (applied.skipped.length) {
      lines.push('', 'Skipped:', '')
      for (const item of applied.skipped) lines.push(`- ${item}`)
    }
  }

  lines.push(
    '',
    '## Next',
    '',
    meta.dryRun
      ? '- Review the plan; nothing was written.'
      : '- Run `codecraft check --pack <pack>` to confirm the boundary rules.',
    meta.dryRun ? '- Re-run with `--apply --name <name>` to write the scaffold.' : '',
  )

  return lines.filter((line, index) => !(line === '' && lines[index - 1] === '')).join('\n')
}

function header(meta) {
  return [
    `# Codecraft ${title(meta.mode)}`,
    '',
    `- Version: ${meta.version}`,
    `- Mode: ${meta.mode}`,
    `- Pack: ${meta.pack}`,
    `- Root: ${meta.root}`,
    `- Config: ${meta.config ?? '（none）'}`,
    `- Exclude: ${meta.exclude?.length ? meta.exclude.join(', ') : '（none）'}`,
    `- Rules: ${meta.rules.join(' / ')}`,
    `- Severity: ${meta.severity}`,
    `- Files: ${meta.files}`,
    coverageLine(meta.coverage),
    `- Findings: ${meta.findings}`,
    `- Critical (A21 secrets): ${meta.critical ?? 0}`,
    `- Ignored: ${meta.ignored ?? 0}`,
    `- Baseline: ${meta.baseline ? `${meta.baseline.suppressed} suppressed / ${meta.baseline.total} known (${meta.baseline.file})` : '（none）'}`,
    `- Expired exceptions: ${meta.expired ?? 0}`,
    `- Warnings: ${meta.warnings?.length ?? 0}`,
    `- Gates: ${meta.gates}`,
    '',
  ]
}

/** coverage 精简版：跳过与未支持扩展名一眼可查，避免把 0 findings 误读成全量通过。 */
function coverageLine(coverage) {
  if (!coverage) return `- Coverage: （unavailable）`
  const parts = [
    `scanned ${coverage.scanned}`,
    `tests skipped ${coverage.skippedTests}`,
    `minified skipped ${coverage.skippedMinified}`,
    `excluded ${coverage.skippedByExclude}`,
  ]
  const unsupported = coverage.unsupportedExtensions?.length
    ? `, unsupported: ${coverage.unsupportedExtensions.join(' ')}`
    : ''
  return `- Coverage: ${parts.join(', ')}${unsupported}`
}

function title(mode) {
  if (mode === 'audit') return 'Audit'
  if (mode === 'plan') return 'Plan'
  return 'Check'
}

function row(finding) {
  return `| ${finding.rule} | ${finding.severity} | ${finding.file} | ${finding.line} | ${escapeCell(finding.message)} |`
}

function gateLines(gates) {
  if (!gates.length) return []
  const lines = ['', '## Gates', '', '| Gate | Status | Duration | Command |', '|---|---|---:|---|']
  for (const gate of gates) {
    const status = gate.skipped ? 'skip' : isGateFailed(gate) ? 'fail' : 'ok'
    lines.push(`| ${gate.id} | ${status} | ${gate.durationMs}ms | \`${gate.command}\` |`)
  }
  for (const gate of gates.filter((item) => isGateFailed(item))) {
    lines.push('', `### Gate: ${gate.id}（exit ${gate.exitCode}）`, '', '~~~text')
    lines.push(gate.output || '(no output)')
    lines.push('~~~')
    if (gate.threshold) {
      lines.push(
        '',
        `- Threshold: issues ${gate.threshold.operator} ${gate.threshold.value}, actual ${gate.threshold.actual ?? '(unparsed)'} → ${gate.threshold.violated ? 'violated' : 'ok'}`,
      )
    }
    if (gate.redacted) {
      lines.push('', `- ${gate.redacted} suspected secret(s) redacted from this output.`)
    }
  }
  return lines
}

function escapeCell(value) {
  return value.replace(/\|/g, '\\|')
}

function isDir(target) {
  try {
    return fs.statSync(target).isDirectory()
  } catch {
    return false
  }
}
