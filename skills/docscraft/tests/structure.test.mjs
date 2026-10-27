import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

const REQUIRED = [
  'SKILL.md',
  'README.md',
  'VERSION',
  'CHANGELOG.md',
  'LICENSE',
  'docs/00-principles.md',
  'docs/01-layers.md',
  'docs/02-doc-types.md',
  'docs/03-ai-context.md',
  'docs/04-drift-guards.md',
  'docs/05-rule-types.md',
  'docs/06-adr.md',
  'scenarios/audit-docs.md',
  'scenarios/reorganize-docs.md',
  'scenarios/write-adr.md',
  'scenarios/review-rules.md',
  'prompts/output.md',
  'templates/AGENTS.md',
  'templates/rules.md',
  'templates/adr.md',
  'evals/golden-tasks.md',
]

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

function markdownFiles(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...markdownFiles(full))
    else if (entry.name.endsWith('.md')) files.push(full)
  }
  return files
}

void test('SKILL.md has the expected frontmatter', () => {
  const text = read('SKILL.md')
  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(text)

  assert.ok(frontmatter, 'SKILL.md must start with YAML frontmatter')
  assert.match(frontmatter[1], /^name:\s*docscraft\s*$/m)
  assert.match(frontmatter[1], /^description:\s*\S+/m)
})

void test('VERSION, package.json and CHANGELOG agree', () => {
  const version = read('VERSION').trim()

  assert.match(version, /^\d+\.\d+\.\d+$/)
  assert.equal(JSON.parse(read('package.json')).version, version)
  assert.match(read('CHANGELOG.md'), new RegExp(`^## ${version.replace(/\./g, '\\.')}\\b`, 'm'))
})

void test('required files exist', () => {
  for (const rel of REQUIRED) {
    assert.ok(fs.existsSync(path.join(ROOT, rel)), `missing ${rel}`)
  }
})

void test('relative markdown links resolve', () => {
  for (const file of markdownFiles(ROOT)) {
    const text = fs.readFileSync(file, 'utf8')
    for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1].trim()
      if (/^(https?:|mailto:|#)/.test(target)) continue
      const clean = target.split('#')[0]
      if (!clean) continue
      const resolved = path.resolve(path.dirname(file), clean)
      assert.ok(fs.existsSync(resolved), `${path.relative(ROOT, file)}: missing ${target}`)
    }
  }
})

void test('SKILL.md routing paths exist', () => {
  const refs = new Set()
  for (const match of read('SKILL.md').matchAll(
    /`((?:docs|scenarios|prompts|templates|evals)\/[A-Za-z0-9._/-]+\.md)`/g,
  )) {
    refs.add(match[1])
  }

  assert.ok(refs.size >= 7, 'routing table should reference the docs set')
  for (const ref of refs) {
    assert.ok(fs.existsSync(path.join(ROOT, ref)), `SKILL.md references missing ${ref}`)
  }
})
