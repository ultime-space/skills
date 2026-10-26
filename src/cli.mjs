import fs from 'node:fs'
import path from 'node:path'
import { check } from './check.mjs'
import { loadConfig, runGates } from './gates.mjs'
import { buildPlan, summarizePlan } from './plan.mjs'
import { applyInitPlan, buildInitPlan } from './init.mjs'

const PACKAGE = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const VERSION = PACKAGE.version

const HELP = `codecraft <command> [options]

Commands:
  check       Scan for boundary violations (default)
  audit       check + configured gates; read-only report
  plan        Read-only upgrade plan from findings
  init        Scaffold an app or package (dry-run unless --apply)
  version     Print version

Options:
  --root <path>            Project root (default: cwd)
  --pack app|library|auto  Rule pack (default: auto)
  --config <path>          Config file (default: codecraft.config.json)
  --no-gates               Skip gates in audit / plan
  --with-gates             Run configured gates in plan
  --name <name>            Scaffold name (required with --apply)
  --apply                  Write the scaffold; existing paths are skipped
  --format md|json         Output format (default: md)
  --severity warn|error    Reported severity (default: warn)
  --ci                     Treat findings as errors
  --help, -h
  --version, -v

Packs:
  app      A4 / A17 — pages / components / behavior must not import external or generated
  library  A2 / A11 — package boundaries and generated-file markers
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
    console.error(`codecraft: unknown command "${command}"`)
    return 2
  }

  const root = path.resolve(process.cwd(), args.root)
  if (!fs.existsSync(root)) {
    console.error(`codecraft: root not found: ${root}`)
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
    console.error('codecraft: invalid config pack; expected app, library or auto')
    return 2
  }

  if (command === 'init') {
    if (args.apply && !args.name) {
      console.error('codecraft: init --apply requires --name <name>')
      return 2
    }
    const plan = buildInitPlan(root, pack, args.name)
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

  const result = check(root, { pack })
  const severity = args.ci ? 'error' : args.severity
  const findings = result.findings.map((finding) => ({ ...finding, severity }))
  const gates = shouldRunGates(command, args) ? runGates(root, config.config.gates ?? []) : []
  const plan = command === 'plan' ? buildPlan(findings) : []
  const meta = {
    version: VERSION,
    mode: command,
    pack,
    root,
    config: config.file,
    severity,
    rules: pack === 'library' ? ['A2', 'A11'] : ['A4', 'A17'],
    files: result.files,
    findings: findings.length,
    plan: plan.length,
    gates: gates.length,
  }

  if (args.format === 'json') {
    console.log(
      JSON.stringify(
        {
          ...meta,
          findings,
          plan,
          gates,
          summary: {
            files: result.files,
            findings: findings.length,
            plan: plan.length,
            gates: gates.length,
            gateFailures: gates.filter((gate) => gate.exitCode !== 0).length,
          },
        },
        null,
        2,
      ),
    )
  } else if (command === 'plan') {
    console.log(formatPlan(meta, findings, plan, gates))
  } else {
    console.log(formatReport(meta, findings, gates))
  }

  const failed = findings.some((finding) => finding.severity === 'error') || gates.some((gate) => gate.exitCode !== 0)
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
    return ['app', 'library'].includes(configPack) ? configPack : null
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
    name: '',
    apply: false,
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
    else if (arg === '--apply') args.apply = true
    else if (arg === '--name') args.name = argv[++i] ?? ''
    else if (arg === '--root') args.root = argv[++i] ?? '.'
    else if (arg === '--pack') args.pack = argv[++i] ?? 'auto'
    else if (arg === '--config') args.config = argv[++i] ?? ''
    else if (arg === '--format') args.format = argv[++i] ?? 'md'
    else if (arg === '--severity') args.severity = argv[++i] ?? 'warn'
    else if (!arg.startsWith('-') && !args.command) args.command = arg
    else fail(`unknown option: ${arg}`)
  }

  if (!['app', 'library', 'auto'].includes(args.pack)) fail(`invalid --pack: ${args.pack}`)
  if (args.format !== 'md' && args.format !== 'json') fail(`invalid --format: ${args.format}`)
  if (args.severity !== 'warn' && args.severity !== 'error') {
    fail(`invalid --severity: ${args.severity}`)
  }

  return args
}

function detectPack(root) {
  if (isDir(path.join(root, 'apps')) || isDir(path.join(root, 'src', 'pages'))) return 'app'
  if (isDir(path.join(root, 'packages'))) return 'library'
  if (fs.existsSync(path.join(root, 'package.json'))) return 'library'
  return 'app'
}

function fail(message) {
  console.error(`codecraft: ${message}\n\n${HELP}`)
  process.exit(2)
}

function formatReport(meta, findings, gates) {
  const lines = header(meta)

  if (!findings.length) {
    lines.push('✓ 未发现边界问题。')
  } else {
    lines.push('## Findings', '', '| Rule | Severity | File | Line | Message |', '|---|---|---|---|---|')
    for (const finding of findings) {
      lines.push(row(finding))
    }
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
    `- Rules: ${meta.rules.join(' / ')}`,
    `- Severity: ${meta.severity}`,
    `- Files: ${meta.files}`,
    `- Findings: ${meta.findings}`,
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
