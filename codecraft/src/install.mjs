import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url))
const SKILL_FILES = ['SKILL.md']
const SKILL_DIRS = ['docs', 'scenarios', 'prompts']

const AGENT_DIRS = {
  generic: '.agents/skills',
  claude: '.claude/skills',
  cursor: '.cursor/skills',
  trae: '.trae/skills',
  'trae-cn': '.trae-cn/skills',
}

const AGENT_MARKERS = {
  generic: ['.agents'],
  claude: ['.claude', 'CLAUDE.md'],
  cursor: ['.cursor'],
  trae: ['.trae'],
  'trae-cn': ['.trae-cn'],
}

export const AGENTS = Object.keys(AGENT_DIRS)

export function parseAgents(value) {
  if (!value || value === 'auto') return []
  const agents = [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))]
  const invalid = agents.filter((agent) => !AGENTS.includes(agent))
  if (invalid.length) {
    throw new Error(`unknown agent: ${invalid.join(', ')}（可选：auto, ${AGENTS.join(', ')}）`)
  }
  return agents
}

export function buildInstallPlan(root, options = {}) {
  const base = options.global ? os.homedir() : path.resolve(root)
  const explicit = options.agents ?? []
  const invalid = explicit.filter((agent) => !AGENTS.includes(agent))
  if (invalid.length) {
    throw new Error(`unknown agent: ${invalid.join(', ')}（可选：${AGENTS.join(', ')}）`)
  }

  const agents = explicit.length ? explicit : detectAgents(base, options.global)
  const destinations = options.dest
    ? [{ agent: 'custom', dir: path.resolve(base, options.dest) }]
    : agents.map((agent) => ({ agent, dir: path.join(base, AGENT_DIRS[agent]) }))

  assertSource()

  return destinations.map(({ agent, dir }) => {
    const target = path.join(dir, 'codecraft')
    const exists = fs.existsSync(target)
    return { agent, target, exists, action: exists ? 'exists' : 'create' }
  })
}

export function applyInstallPlan(plan, options = {}) {
  const created = []
  const skipped = []
  const replaced = []

  for (const entry of plan) {
    if (entry.exists && !options.force) {
      skipped.push(entry.target)
      continue
    }
    if (entry.exists) {
      fs.rmSync(entry.target, { recursive: true, force: true })
      replaced.push(entry.target)
    }

    fs.mkdirSync(entry.target, { recursive: true })
    for (const file of SKILL_FILES) {
      fs.copyFileSync(path.join(PACKAGE_ROOT, file), path.join(entry.target, file))
    }
    for (const dir of SKILL_DIRS) {
      fs.cpSync(path.join(PACKAGE_ROOT, dir), path.join(entry.target, dir), { recursive: true })
    }
    created.push(entry.target)
  }

  return { created, skipped, replaced }
}

function detectAgents(base, global) {
  const found = AGENTS.filter((agent) =>
    AGENT_MARKERS[agent].some((marker) => fs.existsSync(path.join(base, marker))),
  )
  if (global) return found.length ? found : ['generic']
  return [...new Set([...found, 'generic'])]
}

function assertSource() {
  for (const file of SKILL_FILES) {
    if (!fs.existsSync(path.join(PACKAGE_ROOT, file))) {
      throw new Error(`skill source is incomplete: missing ${file}`)
    }
  }
}
