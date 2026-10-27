import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { check } from './check.mjs'
import { loadConfig, runGates } from './gates.mjs'
import { buildPlan, summarizePlan } from './plan.mjs'
import { applyInitPlan, buildInitPlan } from './init.mjs'
import { applyIgnores } from './ignore.mjs'

const PACKAGE = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const VERSION = PACKAGE.version

export const HELP = `codecraft <command> [options]

Commands:
  check       Scan for boundary violations (default)
  audit       check + configured gates; read-only report
  plan        Read-only upgrade plan from findings
  init        Scaffold an app or package (dry-run unless --apply)
  version     Print version

Options:
  --root <path>            Project root (default: cwd)
  --pack app|library|design-system|auto  Rule pack (default: auto)
  --config <path>          Config file (default: codecraft.config.json)
  --changed                Only report findings in changed / untracked files
  --since <ref>            Only report findings changed since a git ref (e.g. origin/main)
  --exclude <glob>         Skip files when scanning (repeatable; e.g. "evals/fixtures/**")
  --no-gates               Skip gates in audit / plan
  --with-gates             Run configured gates in plan
  --fail-fast              Stop gates after the first failure
  --name <name>            Scaffold name (required with --apply)
  --apply                  Write the scaffold; existing paths are skipped
  --format md|json|sarif   Output format (default: md)
  --severity warn|error    Reported severity (default: warn)
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
  let changed = null
  let scoped = result.findings
  if (args.changed || args.since) {
    try {
      changed = changedFiles(root, args.since)
    } catch (error) {
      console.error(`codecraft: ${error.message}`)
      return 2
    }
    const files = new Set(changed)
    scoped = scoped.filter((finding) => {
      const file = finding.file.replace(/\\/g, '/')
      return files.has(file) || [...files].some((candidate) => candidate.endsWith(`/${file}`))
    })
  }
  const severity = args.ci ? 'error' : args.severity
  const findings = scoped.map((finding) => ({ ...finding, severity }))
  const filtered = applyIgnores(findings, config.config.ignore ?? [])
  const activeFindings = filtered.findings
  const warnings = []
  if (result.files === 0 && result.findings.length === 0) {
    warnings.push(`0 source files scanned under ${root}; pass --pack app|library or check --root`)
    console.error(`codecraft: warning: ${warnings[0]}`)
  }
  const gates = shouldRunGates(command, args)
    ? runGates(root, config.config.gates ?? [], { failFast: args.failFast })
    : []
  const plan = command === 'plan' ? buildPlan(activeFindings) : []
  const meta = {
    version: VERSION,
    mode: command,
    pack,
    root,
    config: config.file,
    severity,
    rules: pack === 'app' ? ['A6', 'A17', 'A21'] : ['A2', 'A6', 'A11', 'A21'],
    files: result.files,
    scope: args.changed || args.since ? 'changed' : 'full',
    changed: changed?.length ?? null,
    exclude,
    findings: activeFindings.length,
    ignored: filtered.ignored.length,
    expired: filtered.expired.length,
    warnings,
    plan: plan.length,
    gates: gates.length,
  }

  if (args.format === 'json') {
    console.log(
      JSON.stringify(
        {
          ...meta,
          findings: activeFindings,
          ignored: filtered.ignored,
          exceptions: filtered.exceptions,
          plan,
          gates,
          summary: {
            files: result.files,
            findings: activeFindings.length,
            ignored: filtered.ignored.length,
            expired: filtered.expired.length,
            plan: plan.length,
            gates: gates.length,
            gateFailures: gates.filter((gate) => gate.exitCode !== 0).length,
          },
        },
        null,
        2,
      ),
    )
  } else if (args.format === 'sarif') {
    console.log(formatSarif(meta, activeFindings))
  } else if (command === 'plan') {
    console.log(formatPlan(meta, activeFindings, plan, gates))
  } else {
    console.log(formatReport(meta, activeFindings, filtered.ignored, filtered.expired, gates))
  }

  const failed =
    activeFindings.some((finding) => finding.severity === 'error') ||
    gates.some((gate) => gate.exitCode !== 0)
  if (warnings.length) return 2
  return failed ? 1 : 0
}

function shouldRunGates(command, args) {
  if (args.noGates) return false
  if (command === 'audit') return true
  if (command === 'plan') return args.withGates
  return false
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
    failFast: false,
    name: '',
    apply: false,
    changed: false,
    since: '',
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
    else if (arg === '--fail-fast') args.failFast = true
    else if (arg === '--apply') args.apply = true
    else if (arg === '--changed') args.changed = true
    else if (arg === '--since') args.since = argv[++i] ?? ''
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
            level: finding.severity === 'error' ? 'error' : 'warning',
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
      '| # | Rule | Severity | File | Line | Action | Verification |',
      '|---|---|---|---|---|---|---|',
    )
    for (const item of plan) {
      lines.push(
        `| ${item.id} | ${item.rule} | ${item.severity} | ${item.file} | ${item.line} | ${escapeCell(item.action)} | \`${item.verification}\` |`,
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
    `- Findings: ${meta.findings}`,
    `- Ignored: ${meta.ignored ?? 0}`,
    `- Expired exceptions: ${meta.expired ?? 0}`,
    `- Warnings: ${meta.warnings?.length ?? 0}`,
    `- Gates: ${meta.gates}`,
    '',
  ]
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
  const lines = ['', '## Gates', '', '| Gate | Exit | Duration | Command |', '|---|---:|---:|---|']
  for (const gate of gates) {
    lines.push(`| ${gate.name} | ${gate.exitCode} | ${gate.durationMs}ms | \`${gate.command}\` |`)
  }
  for (const gate of gates.filter((item) => item.exitCode !== 0)) {
    lines.push('', `### Gate: ${gate.name}（exit ${gate.exitCode}）`, '', '~~~text')
    lines.push(gate.output || '(no output)')
    lines.push('~~~')
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
