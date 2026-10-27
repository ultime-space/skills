import fs from 'node:fs'
import path from 'node:path'
import { check } from './check.mjs'
import { loadConfig, runGates } from './gates.mjs'
import { buildPlan, summarizePlan } from './plan.mjs'
import { applyInitPlan, buildInitPlan } from './init.mjs'
import { applyIgnores } from './ignore.mjs'
import { applyInstallPlan, buildInstallPlan, parseAgents } from './install.mjs'

const PACKAGE = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const VERSION = PACKAGE.version

const HELP = `codecraft <command> [options]

Commands:
  check       Scan for boundary violations (default)
  audit       check + configured gates; read-only report
  plan        Read-only upgrade plan from findings
  init        Scaffold an app or package (dry-run unless --apply)
  install     Install the skill into agent skills directories
  version     Print version

Options:
  --root <path>            Project root (default: cwd)
  --pack app|library|design-system|auto  Rule pack (default: auto)
  --config <path>          Config file (default: codecraft.config.json)
  --agent auto|claude|trae|cursor|generic  Install target, comma-separated (default: auto)
  --global                 Install into the home directory
  --dest <path>            Explicit destination (relative to root / home)
  --force                  Replace an existing codecraft skill directory
  --dry-run                Show the install plan without writing
  --no-gates               Skip gates in audit / plan
  --with-gates             Run configured gates in plan
  --fail-fast              Stop gates after the first failure
  --name <name>            Scaffold name (required with --apply)
  --apply                  Write the scaffold; existing paths are skipped
  --format md|json         Output format (default: md)
  --severity warn|error    Reported severity (default: warn)
  --ci                     Treat findings as errors
  --help, -h
  --version, -v

Packs:
  app            A17 / A21 — pages / components / behavior must not import external or generated;
                 high-confidence secrets are always scanned
  library        A2 / A11 / A21 — package boundaries, generated-file markers, secret scan
  design-system  A2 / A11 / A21 — library rules + public docs must not reference internal docs
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
  if (!['check', 'audit', 'plan', 'init', 'install'].includes(command)) {
    console.error(`codecraft: unknown command "${command}"\n  next: run codecraft --help`)
    return 2
  }

  const root = path.resolve(process.cwd(), args.root)
  if (!fs.existsSync(root)) {
    console.error(`codecraft: root not found: ${root}\n  next: pass --root <project> or run from the project directory`)
    return 2
  }

  if (command === 'install') {
    let agents
    try {
      agents = parseAgents(args.agent)
    } catch (error) {
      console.error(`codecraft: ${error.message}`)
      return 2
    }
    try {
      const plan = buildInstallPlan(root, { agents, global: args.global, dest: args.dest })
      const applied = args.dryRun ? null : applyInstallPlan(plan, { force: args.force })
      const meta = {
        version: VERSION,
        mode: 'install',
        root,
        scope: args.global ? 'global' : 'project',
        agent: args.agent,
        dest: args.dest || null,
        dryRun: args.dryRun,
        targets: plan.length,
        created: applied?.created.length ?? 0,
        replaced: applied?.replaced.length ?? 0,
        skipped: applied?.skipped.length ?? 0,
      }
      if (args.format === 'json') {
        console.log(JSON.stringify({ ...meta, plan, applied }, null, 2))
      } else {
        console.log(formatInstall(meta, plan, applied))
      }
      return plan.length ? 0 : 1
    } catch (error) {
      console.error(`codecraft: ${error.message}`)
      return 1
    }
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

  const result = check(root, { pack })
  const severity = args.ci ? 'error' : args.severity
  const findings = result.findings.map((finding) => ({ ...finding, severity }))
  const filtered = applyIgnores(findings, config.config.ignore ?? [])
  const activeFindings = filtered.findings
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
    rules: pack === 'app' ? ['A17', 'A21'] : ['A2', 'A11', 'A21'],
    files: result.files,
    findings: activeFindings.length,
    ignored: filtered.ignored.length,
    expired: filtered.expired.length,
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
  } else if (command === 'plan') {
    console.log(formatPlan(meta, activeFindings, plan, gates))
  } else {
    console.log(formatReport(meta, activeFindings, filtered.ignored, filtered.expired, gates))
  }

  const failed =
    activeFindings.some((finding) => finding.severity === 'error') ||
    gates.some((gate) => gate.exitCode !== 0)
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
    agent: 'auto',
    global: false,
    dest: '',
    force: false,
    dryRun: false,
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
    else if (arg === '--global') args.global = true
    else if (arg === '--force') args.force = true
    else if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--name') args.name = argv[++i] ?? ''
    else if (arg === '--agent') args.agent = argv[++i] ?? 'auto'
    else if (arg === '--dest') args.dest = argv[++i] ?? ''
    else if (arg === '--root') args.root = argv[++i] ?? '.'
    else if (arg === '--pack') args.pack = argv[++i] ?? 'auto'
    else if (arg === '--config') args.config = argv[++i] ?? ''
    else if (arg === '--format') args.format = argv[++i] ?? 'md'
    else if (arg === '--severity') args.severity = argv[++i] ?? 'warn'
    else if (!arg.startsWith('-') && !args.command) args.command = arg
    else fail(`unknown option: ${arg}`)
  }

  if (!['app', 'library', 'design-system', 'auto'].includes(args.pack)) fail(`invalid --pack: ${args.pack}`)
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

function formatInstall(meta, plan, applied) {
  const lines = [
    '# Codecraft Install',
    '',
    `- Version: ${meta.version}`,
    `- Mode: install`,
    `- Scope: ${meta.scope}`,
    `- Agent: ${meta.agent}`,
    `- Root: ${meta.root}`,
    `- Dest: ${meta.dest ?? '（auto）'}`,
    `- Dry run: ${meta.dryRun}`,
    `- Targets: ${meta.targets}`,
  ]

  if (applied) {
    lines.push(
      `- Created: ${meta.created}`,
      `- Replaced: ${meta.replaced}`,
      `- Skipped: ${meta.skipped}`,
    )
  }

  if (!plan.length) {
    lines.push('', '未找到可安装的目标；请用 `--agent` 指定，或先创建 agent 配置目录。')
  } else {
    lines.push('', '## Plan', '', '| Agent | Target | Action |', '|---|---|---|')
    for (const entry of plan) {
      lines.push(`| ${entry.agent} | ${entry.target} | ${entry.action} |`)
    }
  }

  lines.push(
    '',
    '## Next',
    '',
    meta.dryRun
      ? '- Re-run without `--dry-run` to write the skill.'
      : '- Restart the agent or reload skills；然后说：`用 Codecraft 审计本项目，只读，不改文件。`',
  )

  return lines.join('\n')
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
    `- Ignored: ${meta.ignored ?? 0}`,
    `- Expired exceptions: ${meta.expired ?? 0}`,
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
