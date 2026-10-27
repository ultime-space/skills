import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url))
const SKILL_FILES = ['SKILL.md']
const SKILL_DIRS = ['docs', 'scenarios', 'prompts']

const USER_AGENTS_FILE = path.join(os.homedir(), '.codecraft', 'agents.json')
const PROJECT_AGENTS_FILE = 'codecraft.agents.json'

const BUILTIN_AGENTS = {
  generic: { project: '.agents/skills', global: '.agents/skills', markers: ['.agents'] },
  claude: { project: '.claude/skills', global: '.claude/skills', markers: ['.claude', 'CLAUDE.md'] },
  cursor: { project: '.cursor/skills', global: '.cursor/skills', markers: ['.cursor'] },
  trae: { project: '.trae/skills', global: '.trae/skills', markers: ['.trae'] },
  'trae-cn': { project: '.trae-cn/skills', global: '.trae-cn/skills', markers: ['.trae-cn'] },
}

export const AGENTS = Object.keys(BUILTIN_AGENTS)

export function loadAgents(root, options = {}) {
  const registry = new Map(
    Object.entries(BUILTIN_AGENTS).map(([name, definition]) => [name, { ...definition, source: 'builtin' }]),
  )
  mergeAgentFile(registry, options.userFile ?? USER_AGENTS_FILE, 'user')
  mergeAgentFile(registry, options.projectFile ?? path.join(root, PROJECT_AGENTS_FILE), 'project')
  return registry
}

export function listAgents(root, options = {}) {
  const registry = loadAgents(root, options)
  return [...registry.entries()].map(([name, definition]) => ({
    name,
    project: definition.project,
    global: definition.global,
    source: definition.source,
    detected: {
      project: isDetected(root, definition.markers),
      global: isDetected(os.homedir(), definition.markers),
    },
  }))
}

export function parseAgents(value, names = AGENTS) {
  if (!value || value === 'auto') return []
  const agents = [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))]
  const invalid = agents.filter((agent) => !names.includes(agent))
  if (invalid.length) {
    throw new Error(`unknown agent: ${invalid.join(', ')}（可选：${names.join(', ')}；用 --list-agents 查看）`)
  }
  return agents
}

export function buildInstallPlan(root, options = {}) {
  const registry = options.registry ?? loadAgents(root, options)
  const base = options.global ? os.homedir() : path.resolve(root)
  const names = [...registry.keys()]
  const explicit = options.agents ?? []
  const invalid = explicit.filter((agent) => !registry.has(agent))
  if (invalid.length) {
    throw new Error(`unknown agent: ${invalid.join(', ')}（可选：${names.join(', ')}；用 --list-agents 查看）`)
  }

  const agents = explicit.length ? explicit : detectAgents(base, registry, options.global)
  const destinations = options.dest
    ? [{ agent: 'custom', dir: path.resolve(base, options.dest) }]
    : agents.map((agent) => {
        const definition = registry.get(agent)
        return { agent, dir: path.join(base, options.global ? definition.global : definition.project) }
      })

  assertSource()

  const byTarget = new Map()
  for (const { agent, dir } of destinations) {
    const target = path.join(dir, 'codecraft')
    if (!byTarget.has(target)) byTarget.set(target, { target, agents: [] })
    byTarget.get(target).agents.push(agent)
  }

  return [...byTarget.values()].map(({ target, agents: targetAgents }) => {
    const exists = fs.existsSync(target)
    return {
      agent: targetAgents.join(','),
      agents: targetAgents,
      target,
      exists,
      action: exists ? 'exists' : 'create',
    }
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

function mergeAgentFile(registry, file, source) {
  if (!fs.existsSync(file)) return

  let parsed
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    throw new Error(`invalid agents file ${file}: ${error.message} (fix the JSON syntax or remove the file)`)
  }

  const agents = parsed?.agents
  if (!agents || typeof agents !== 'object' || Array.isArray(agents)) {
    throw new Error(`invalid agents file ${file}: expected { "agents": { "<name>": { project, global, markers } } }`)
  }

  for (const [name, definition] of Object.entries(agents)) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
      throw new Error(`invalid agents file ${file}: agent name "${name}" must be lowercase kebab-case`)
    }
    const project = typeof definition?.project === 'string' ? definition.project.trim() : ''
    if (!project) {
      throw new Error(`invalid agents file ${file}: agent "${name}" needs a non-empty "project" path`)
    }
    const global = typeof definition?.global === 'string' && definition.global.trim() ? definition.global.trim() : project
    const markers = Array.isArray(definition?.markers)
      ? definition.markers.filter((marker) => typeof marker === 'string' && marker.trim())
      : []
    registry.set(name, { project, global, markers, source })
  }
}

function detectAgents(base, registry, global) {
  const found = [...registry.entries()]
    .filter(([, definition]) => isDetected(base, definition.markers))
    .map(([name]) => name)
  if (global) return found.length ? found : ['generic']
  return [...new Set([...found, 'generic'])]
}

function isDetected(base, markers) {
  return markers.some((marker) => fs.existsSync(path.join(base, marker)))
}

function assertSource() {
  for (const file of SKILL_FILES) {
    if (!fs.existsSync(path.join(PACKAGE_ROOT, file))) {
      throw new Error(`skill source is incomplete: missing ${file}`)
    }
  }
}
