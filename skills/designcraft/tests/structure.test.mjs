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
  'CONTRIBUTING.md',
  'SECURITY.md',
  'docs/README.md',
  'docs/typography.md',
  'docs/color.md',
  'scenarios/review-typography.md',
  'scenarios/review-color.md',
  'scenarios/configure-brand-color.md',
  'scenarios/check-contrast-audit.md',
  'prompts/output.md',
  'templates/review-report.md',
  'templates/brand-color-check.md',
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
  assert.match(frontmatter[1], /^name:\s*designcraft\s*$/m)
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

void test('every docs file is reachable from SKILL.md', () => {
  const skill = read('SKILL.md')
  const missing = markdownFiles(path.join(ROOT, 'docs'))
    .map((file) => path.relative(ROOT, file).split(path.sep).join('/'))
    .filter((rel) => !skill.includes(rel))

  assert.deepEqual(missing, [], `SKILL.md routing misses: ${missing.join(', ')}`)
})

void test('color.md keeps the current targets and drops stale claims', () => {
  const color = read('docs/color.md')

  for (const target of ['7.2', '6.0', '5.0', '2.0', '4.5']) {
    assert.ok(color.includes(target), `color.md misses target ${target}`)
  }
  for (const stale of ['0.65', '0.55', '离极', '镜像对称', '步长 0.10', '透明度是值位']) {
    assert.ok(!color.includes(stale), `color.md still contains stale claim: ${stale}`)
  }
  assert.ok(color.includes('tone.{族}.on'), 'color.md must name the independent on dimension')
  assert.ok(color.includes('独立'), 'color.md must state that on is independent')
})
