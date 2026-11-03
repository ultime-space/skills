import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { SECRET_PATTERNS } from './check.mjs'
import { validateIgnore } from './ignore.mjs'

/** gate 输出脱敏：私钥整块、A21 密钥模式，外加 Authorization 头与带凭据的连接串。 */
const REDACT_PATTERNS = [
  /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  ...SECRET_PATTERNS.map((pattern) => globalize(pattern.re)),
  /(?:authorization|proxy-authorization)\s*[:=][^\n]*/gi,
  /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp):\/\/[^\s:@/]+:[^\s@]+@[^\s]*/g,
]

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

  if (config.gates != null && !Array.isArray(config.gates)) {
    throw new Error(`invalid config ${file}: "gates" must be an array (each item: { name?, run, timeoutMs? })`)
  }

  for (const gate of config.gates ?? []) {
    if (!gate || typeof gate.run !== 'string' || !gate.run.trim()) {
      throw new Error(`invalid config ${file}: each gate needs a "run" string (e.g. "pnpm test")`)
    }
  }

  return {
    file,
    config: {
      ...config,
      ignore: validateIgnore(config.ignore, file),
      exclude: validateExclude(config.exclude, file),
      ...(config.boundaries ? { boundaries: validateBoundaries(config.boundaries, file) } : {}),
    },
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

export function runGates(root, gates, options = {}) {
  if (!Array.isArray(gates)) throw new Error('gates must be an array')
  const results = []
  for (const gate of gates) {
    const result = runGate(root, gate)
    results.push(result)
    if (options.failFast && result.exitCode !== 0) break
  }
  return results
}

function runGate(root, gate) {
  const name = typeof gate.name === 'string' && gate.name.trim() ? gate.name.trim() : gate.run
  const startedAt = Date.now()
  const result = spawnSync(gate.run, {
    cwd: root,
    shell: true,
    encoding: 'utf8',
    timeout: Number.isFinite(gate.timeoutMs) ? gate.timeoutMs : 120000,
    env: { ...process.env, CI: '1' },
    maxBuffer: 10 * 1024 * 1024,
  })
  const durationMs = Date.now() - startedAt
  const raw = [result.error?.message, result.stdout, result.stderr].filter(Boolean).join('\n').trim()
  const { text: redacted, count } = redactSecrets(tail(raw, 40, 4000))

  return {
    name,
    command: gate.run,
    exitCode: result.status ?? 1,
    durationMs,
    output: redacted,
    ...(count > 0 ? { redacted: count } : {}),
  }
}

function tail(text, maxLines, maxChars) {
  const sliced = text.split('\n').slice(-maxLines).join('\n')
  return sliced.length > maxChars ? sliced.slice(-maxChars) : sliced
}
