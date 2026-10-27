import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { HELP } from '../src/cli.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

function markdownFiles(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
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
  assert.match(frontmatter[1], /^name:\s*codecraft\s*$/m)
  assert.match(frontmatter[1], /^description:\s*\S+/m)
})

void test('VERSION, package.json and CHANGELOG agree', () => {
  const version = read('VERSION').trim()

  assert.match(version, /^\d+\.\d+\.\d+$/)
  assert.equal(JSON.parse(read('package.json')).version, version)
  assert.match(read('CHANGELOG.md'), new RegExp(`^## ${version.replace(/\./g, '\\.')}\\b`, 'm'))
})

void test('relative markdown links resolve', () => {
  for (const dir of ['docs', 'scenarios', 'prompts', 'templates', 'adapters']) {
    const full = path.join(ROOT, dir)
    if (!fs.existsSync(full)) continue

    for (const file of markdownFiles(full)) {
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
  }
})

void test('SKILL.md routing paths exist', () => {
  const refs = new Set()
  for (const match of read('SKILL.md').matchAll(
    /`((?:docs|scenarios|prompts|templates|adapters)\/[A-Za-z0-9._/-]+\.md)`/g,
  )) {
    refs.add(match[1])
  }

  assert.ok(refs.size >= 10, 'routing table should reference both tracks')
  for (const ref of refs) {
    assert.ok(fs.existsSync(path.join(ROOT, ref)), `SKILL.md references missing ${ref}`)
  }
})

void test('config example keeps every documented field', () => {
  const example = JSON.parse(read('codecraft.config.example.json'))

  assert.ok(Array.isArray(example.exclude), 'config example needs exclude')
  assert.ok(example.boundaries, 'config example needs boundaries')
  assert.ok(Array.isArray(example.boundaries.allowedImporters), 'config example needs allowedImporters')
  assert.ok(Array.isArray(example.boundaries.generatedDirs), 'config example needs generatedDirs')
})

void test('every docs file is reachable from SKILL.md', () => {
  const skill = read('SKILL.md')
  const missing = markdownFiles(path.join(ROOT, 'docs'))
    .map((file) => path.relative(ROOT, file).split(path.sep).join('/'))
    .filter((rel) => !skill.includes(rel))

  assert.deepEqual(missing, [], `SKILL.md routing misses: ${missing.join(', ')}`)
})

void test('CLI help pack rules match README', () => {
  const expected = new Map()
  for (const match of read('README.md').matchAll(/^\|\s*`(app|library|design-system)`\s*\|\s*([^|]+)\|/gm)) {
    expected.set(match[1], [...match[2].matchAll(/A\d+/g)].map((item) => item[0]).sort())
  }

  assert.equal(expected.size, 3, 'README pack table should list app / library / design-system')
  const packs = HELP.split('Packs:')[1] ?? ''

  for (const [pack, rules] of expected) {
    const line = packs.split('\n').find((item) => new RegExp(`^\\s*${pack}\\s`).test(item))
    assert.ok(line, `CLI help misses pack ${pack}`)
    const actual = [...line.matchAll(/A\d+/g)].map((item) => item[0]).sort()
    assert.deepEqual(actual, rules, `CLI help pack ${pack} rules drift from README`)
  }
})
