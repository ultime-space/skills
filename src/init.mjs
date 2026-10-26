import fs from 'node:fs'
import path from 'node:path'

const TEMPLATES = new URL('../templates/', import.meta.url)

export function buildInitPlan(root, pack, name = '') {
  const appName = name || '<app>'
  const packageName = name || '<package>'
  const id = toPackageId(name)
  const entries = []

  const add = (rel, type, content) => {
    const abs = path.join(root, rel)
    entries.push({
      path: rel,
      type,
      action: fs.existsSync(abs) ? 'exists' : 'create',
      ...(content == null ? {} : { content }),
    })
  }

  const fill = (target, vars) => render(template(pack, target), vars)

  if (pack === 'library') {
    add('packages', 'dir')
    add(`packages/${packageName}`, 'dir')
    add(`packages/${packageName}/src`, 'dir')
    add(`packages/${packageName}/tests`, 'dir')
    const vars = { name: packageName, id }
    add(`packages/${packageName}/README.md`, 'file', fill('README.md', vars))
    add(`packages/${packageName}/CHANGELOG.md`, 'file', fill('CHANGELOG.md', vars))
    add(`packages/${packageName}/compat.md`, 'file', fill('compat.md', vars))
    add(`packages/${packageName}/package.json`, 'file', fill('package.json', vars))
  } else {
    add('apps', 'dir')
    add(`apps/${appName}`, 'dir')
    add(`apps/${appName}/src`, 'dir')
    add(`apps/${appName}/src/pages`, 'dir')
    add(`apps/${appName}/src/components`, 'dir')
    add(`apps/${appName}/src/behavior`, 'dir')
    add(`apps/${appName}/src/api`, 'dir')
    add(`apps/${appName}/src/adapters`, 'dir')
    add(`apps/${appName}/src/types`, 'dir')
    add(`apps/${appName}/src/external`, 'dir')
    const vars = { name: appName, id }
    add(`apps/${appName}/README.md`, 'file', fill('README.md', vars))
    add(`apps/${appName}/package.json`, 'file', fill('package.json', vars))
  }

  add('docs', 'dir')
  const config = { pack, gates: [] }
  add('codecraft.config.json', 'file', `${JSON.stringify(config, null, 2)}\n`)

  return { pack, name, entries, config }
}

export function applyInitPlan(root, plan) {
  const created = []
  const skipped = []

  for (const entry of plan.entries) {
    const abs = path.join(root, entry.path)
    if (entry.action === 'exists') {
      skipped.push(entry.path)
      continue
    }
    if (entry.type === 'dir') {
      fs.mkdirSync(abs, { recursive: true })
    } else {
      fs.mkdirSync(path.dirname(abs), { recursive: true })
      fs.writeFileSync(abs, entry.content ?? '')
    }
    created.push(entry.path)
  }

  return { created, skipped }
}

function template(pack, rel) {
  try {
    return fs.readFileSync(new URL(`${pack}/${rel}`, TEMPLATES), 'utf8')
  } catch {
    return ''
  }
}

function render(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

function toPackageId(name) {
  if (!name) return '<package>'
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
