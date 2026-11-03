import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { SECRET_PATTERNS } from './check.mjs'
import { matchPath, validateIgnore } from './ignore.mjs'

/** gate 输出脱敏：私钥整块、A21 密钥模式，外加 Authorization 头与带凭据的连接串。 */
const REDACT_PATTERNS = [
  /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  ...SECRET_PATTERNS.map((pattern) => globalize(pattern.re)),
  /(?:authorization|proxy-authorization)\s*[:=][^\n]*/gi,
  /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp):\/\/[^\s:@/]+:[^\s@]+@[^\s]*/g,
]

/** 结构化输出声明（2.0 gate 契约，依据 R5）；声明后按格式解析 issue 数，供阈值判定。 */
const GATE_OUTPUT_FORMATS = new Set(['sarif', 'junit', 'gitlab'])
/** 阈值三元组 (metric, operator, value)；metric 目前仅 issues（解析出的问题数）。 */
const THRESHOLD_OPERATORS = new Set(['<', '<=', '>', '>=', '=='])

function globalize(re) {
  return new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`)
}

/** 返回脱敏后的文本与替换次数；命中时只显示占位符，不保留原值。 */
export function redactSecrets(text) {
  let count = 0
  let out = text
  for (const re of REDACT_PATTERNS) {
    out = out.replace(re, () => {
      count += 1
      return '[REDACTED]'
    })
  }
  return { text: out, count }
}

/** 2.0 gate 契约：pre-commit 形状 { id, entry, files?, exclude?, args?, output?, threshold?, timeoutMs? }。 */
export function loadConfig(root, configPath) {
  const file = configPath ? path.resolve(root, configPath) : path.join(root, 'codecraft.config.json')

  if (!fs.existsSync(file)) return { file: null, config: { ignore: [], exclude: [] } }

  let config
  try {
    config = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    throw new Error(
      `invalid config ${file}: ${error.message} (fix the JSON syntax, or remove the file to use defaults)`,
    )
  }

  if (config.baseline != null && config.baseline !== true && (typeof config.baseline !== 'string' || !config.baseline.trim())) {
    throw new Error(`invalid config ${file}: "baseline" must be true or a path string (e.g. "codecraft-baseline.json")`)
  }

  return {
    file,
    config: {
      ...config,
      gates: validateGates(config.gates, file),
      ignore: validateIgnore(config.ignore, file),
      exclude: validateExclude(config.exclude, file),
      ...(config.boundaries ? { boundaries: validateBoundaries(config.boundaries, file) } : {}),
    },
  }
}

function toArray(value) {
  return value == null ? [] : Array.isArray(value) ? value : [value]
}

function validateGlobList(value, field, gateId, file) {
  const list = toArray(value)
  if (list.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new Error(`invalid config ${file}: gate "${gateId}" "${field}" must be a glob string or an array of globs`)
  }
  return list
}

function validateThreshold(threshold, gateId, file) {
  const invalid = (reason) => new Error(`invalid config ${file}: gate "${gateId}" threshold ${reason} (shape: { metric: "issues", operator: "<|<=|>|>=|==", value: number })`)
  if (!threshold || typeof threshold !== 'object' || Array.isArray(threshold)) throw invalid('must be an object')
  if (threshold.metric !== 'issues') throw invalid(`metric must be "issues" (got ${JSON.stringify(threshold.metric)})`)
  if (!THRESHOLD_OPERATORS.has(threshold.operator)) throw invalid(`operator must be one of < <= > >= ==`)
  if (typeof threshold.value !== 'number') throw invalid('value must be a number')
  return threshold
}

function validateGates(value, file) {
  if (value == null) return []
  if (!Array.isArray(value)) {
    throw new Error(
      `invalid config ${file}: "gates" must be an array (2.0 gate shape: { id, entry, files?, exclude?, args?, output?, threshold?, timeoutMs? })`,
    )
  }
  return value.map((gate) => {
    if (!gate || (gate.entry == null && gate.run == null)) {
      throw new Error(
        `invalid config ${file}: each gate needs "id" and "entry" (2.0 shape: { "id": "test", "entry": "pnpm test" }); see README "Upgrade to 2.0"`,
      )
    }
    if (gate.run != null) {
      throw new Error(
        `invalid config ${file}: gate "${gate.id ?? gate.name ?? '(unnamed)'}" still uses the removed 1.x "run" field — rewrite { "name": "test", "run": "pnpm test" } as { "id": "test", "entry": "pnpm test" } (2.0 gate contract; see README "Upgrade to 2.0")`,
      )
    }
    if (typeof gate.id !== 'string' || !gate.id.trim()) {
      throw new Error(
        `invalid config ${file}: each gate needs an "id" string (2.0 gate contract) — the old "name" field is gone; use { "id": "test", "entry": "pnpm test" }`,
      )
    }
    if (typeof gate.entry !== 'string' || !gate.entry.trim()) {
      throw new Error(`invalid config ${file}: gate "${gate.id}" needs a non-empty "entry" string (e.g. "pnpm typecheck")`)
    }
    if (gate.args != null && (!Array.isArray(gate.args) || gate.args.some((item) => typeof item !== 'string'))) {
      throw new Error(`invalid config ${file}: gate "${gate.id}" "args" must be an array of strings`)
    }
    if (gate.output != null && !GATE_OUTPUT_FORMATS.has(gate.output)) {
      throw new Error(`invalid config ${file}: gate "${gate.id}" "output" must be one of: sarif, junit, gitlab`)
    }
    // 阈值依赖解析出的 issue 数：没有 output 就无法解析，会变成永久失败，配置期直接拦下。
    if (gate.threshold != null && gate.output == null) {
      throw new Error(
        `invalid config ${file}: gate "${gate.id}" sets "threshold" without "output" — declare output (sarif / junit / gitlab) so issue counts can be parsed`,
      )
    }
    return {
      id: gate.id,
      name: typeof gate.name === 'string' && gate.name.trim() ? gate.name : gate.id,
      entry: gate.entry,
      args: gate.args ?? [],
      files: validateGlobList(gate.files, 'files', gate.id, file),
      exclude: validateGlobList(gate.exclude, 'exclude', gate.id, file),
      output: gate.output ?? null,
      ...(gate.threshold != null ? { threshold: validateThreshold(gate.threshold, gate.id, file) } : {}),
      timeoutMs: gate.timeoutMs,
    }
  })
}

function matchesScope(globs, file) {
  return globs.some((pattern) => matchPath(pattern, file))
}

/** 结构化输出解析：声明 output 后从 stdout 提取 issue 数；解析失败返回 null（配阈值时按 fail-closed 处理）。 */
function parseIssues(gate, raw) {
  if (!gate.output) return null
  try {
    if (gate.output === 'gitlab') {
      const data = JSON.parse(raw)
      return Array.isArray(data) ? data.length : null
    }
    if (gate.output === 'sarif') {
      const data = JSON.parse(raw)
      if (!Array.isArray(data?.runs)) return null
      return data.runs.reduce((count, run) => count + (Array.isArray(run.results) ? run.results.length : 0), 0)
    }
    if (gate.output === 'junit') {
      const matches = raw.match(/<(?:failure|error)[\s>/]/g)
      return matches ? matches.length : 0
    }
  } catch {
    return null
  }
  return null
}

/** 阈值三元组判定：条件以失败口吻陈述（SonarQube 惯例），任一条件为真即失败。 */
function evaluateThreshold(threshold, issues) {
  if (!threshold) return null
  const actual = typeof issues === 'number' ? issues : null
  const compare = {
    '<': (left, right) => left < right,
    '<=': (left, right) => left <= right,
    '>': (left, right) => left > right,
    '>=': (left, right) => left >= right,
    '==': (left, right) => left === right,
  }
  return {
    ...threshold,
    actual,
    // issues 解析不出来时按 fail-closed：阈值无法评估即失败，不做静默放行。
    violated: actual == null ? true : compare[threshold.operator](actual, threshold.value),
  }
}

/** gate 是否失败：skipped 不算失败；退出码非零或阈值条件为真即失败。 */
export function isGateFailed(gate) {
  if (!gate || gate.skipped) return false
  return gate.exitCode !== 0 || gate.threshold?.violated === true
}

export function runGates(root, gates, options = {}) {
  if (!Array.isArray(gates)) throw new Error('gates must be an array')
  const results = []
  for (const gate of gates) {
    const result = runGate(root, gate, options.changedFiles ?? null)
    results.push(result)
    if (options.failFast && isGateFailed(result)) break
  }
  return results
}

function runGate(root, gate, changedFiles) {
  const command = [gate.entry, ...gate.args].join(' ').trim()

  // files / exclude 是 gate 的作用域声明：--changed / --since 模式下，变更文件不落在作用域内的 gate 跳过不跑。
  if (changedFiles && gate.files.length) {
    const inScope = changedFiles.some((file) => matchesScope(gate.files, file) && !matchesScope(gate.exclude, file))
    if (!inScope) {
      return {
        id: gate.id,
        name: gate.name,
        command,
        exitCode: 0,
        durationMs: 0,
        output: '(skipped: no changed files match files/exclude)',
        skipped: true,
      }
    }
  }

  const startedAt = Date.now()
  const result = spawnSync(command, {
    cwd: root,
    shell: true,
    encoding: 'utf8',
    timeout: Number.isFinite(gate.timeoutMs) ? gate.timeoutMs : 120000,
    env: { ...process.env, CI: '1' },
    maxBuffer: 10 * 1024 * 1024,
  })
  const durationMs = Date.now() - startedAt
  // 2.0 起全文捕获（不再截断尾部 40 行），先脱敏再进报告。
  const raw = [result.error?.message, result.stdout, result.stderr].filter(Boolean).join('\n').trim()
  const { text: redacted, count } = redactSecrets(raw)
  const issues = parseIssues(gate, raw)

  return {
    id: gate.id,
    name: gate.name,
    command,
    exitCode: result.status ?? 1,
    durationMs,
    output: redacted,
    ...(gate.output ? { format: gate.output, ...(issues != null ? { issues } : {}) } : {}),
    ...(gate.threshold ? { threshold: evaluateThreshold(gate.threshold, issues) } : {}),
    ...(count > 0 ? { redacted: count } : {}),
  }
}

function validateExclude(value, file) {
  if (value == null) return []
  if (!Array.isArray(value)) {
    throw new Error(`invalid config ${file}: "exclude" must be an array of paths or globs`)
  }
  return value.map((item) => {
    if (typeof item !== 'string' || !item.trim()) {
      throw new Error(`invalid config ${file}: "exclude" entries must be non-empty strings`)
    }
    return item.trim()
  })
}

function validateBoundaries(value, file) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(
      `invalid config ${file}: "boundaries" must be an object with external / generated / allowedImporters / generatedDirs arrays`,
    )
  }
  const boundaries = {}
  for (const key of ['external', 'generated', 'allowedImporters', 'generatedDirs']) {
    if (value[key] == null) continue
    if (!Array.isArray(value[key])) {
      const hint = ['allowedImporters', 'generatedDirs'].includes(key)
        ? 'paths or globs relative to --root'
        : 'import prefixes or globs'
      throw new Error(`invalid config ${file}: boundaries.${key} must be an array of ${hint}`)
    }
    boundaries[key] = value[key].map((item) => {
      if (typeof item !== 'string' || !item.trim()) {
        throw new Error(`invalid config ${file}: boundaries.${key} entries must be non-empty strings`)
      }
      return item.trim()
    })
  }
  return boundaries
}

