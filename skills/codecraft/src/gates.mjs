import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { validateIgnore } from './ignore.mjs'

export function loadConfig(root, configPath) {
  const file = configPath ? path.resolve(root, configPath) : path.join(root, 'codecraft.config.json')

  if (!fs.existsSync(file)) return { file: null, config: { ignore: [] } }

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

  return { file, config: { ...config, ignore: validateIgnore(config.ignore, file) } }
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
  const output = tail([result.error?.message, result.stdout, result.stderr].filter(Boolean).join('\n').trim(), 40, 4000)

  return {
    name,
    command: gate.run,
    exitCode: result.status ?? 1,
    durationMs,
    output,
  }
}

function tail(text, maxLines, maxChars) {
  const sliced = text.split('\n').slice(-maxLines).join('\n')
  return sliced.length > maxChars ? sliced.slice(-maxChars) : sliced
}
