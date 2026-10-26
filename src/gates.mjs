import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

export function loadConfig(root, configPath) {
  const file = configPath ? path.resolve(root, configPath) : path.join(root, 'codecraft.config.json')

  if (!fs.existsSync(file)) return { file: null, config: {} }

  let config
  try {
    config = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    throw new Error(`invalid config ${file}: ${error.message}`)
  }

  if (config.gates != null && !Array.isArray(config.gates)) {
    throw new Error(`invalid config ${file}: "gates" must be an array`)
  }

  for (const gate of config.gates ?? []) {
    if (!gate || typeof gate.run !== 'string' || !gate.run.trim()) {
      throw new Error(`invalid config ${file}: each gate needs a "run" string`)
    }
  }

  return { file, config }
}

export function runGates(root, gates) {
  if (!Array.isArray(gates)) throw new Error('gates must be an array')
  return gates.map((gate) => runGate(root, gate))
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
