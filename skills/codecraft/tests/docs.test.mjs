import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const GLOSSARY = path.join(ROOT, 'docs', 'shared', 'glossary.md')

function parseGlossary() {
  const terms = []
  for (const line of fs.readFileSync(GLOSSARY, 'utf8').split('\n')) {
    const match = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/.exec(line)
    if (!match) continue
    const en = match[1].trim()
    const zh = match[2].trim()
    if (!en || /^-+$/.test(en) || en === 'English') continue
    terms.push({ en, zh })
  }
  return terms
}

function bodyLines(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  const body = []
  let fenced = false
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      fenced = !fenced
      continue
    }
    if (fenced || /^\s*#/.test(line)) continue
    body.push(line)
  }
  return body
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

function aiFiles() {
  const files = [path.join(ROOT, 'SKILL.md')]
  for (const dir of ['docs', 'scenarios', 'prompts', 'templates']) {
    const full = path.join(ROOT, dir)
    if (!fs.existsSync(full)) continue
    for (const file of markdownFiles(full)) {
      if (file === GLOSSARY) continue
      files.push(file)
    }
  }
  const golden = path.join(ROOT, 'evals', 'golden-tasks.md')
  if (fs.existsSync(golden)) files.push(golden)
  return files
}

function escapePattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function termPattern(en) {
  return new RegExp(`(^|[^A-Za-z])${escapePattern(en)}(?=$|[^A-Za-z])`)
}

void test('glossary terms are unique and translated', () => {
  const terms = parseGlossary()
  const seen = new Set()
  for (const { en, zh } of terms) {
    assert.ok(en && zh, `empty glossary row: ${en}`)
    assert.ok(!seen.has(en), `duplicate glossary term: ${en}`)
    seen.add(en)
  }
})

void test('README annotates the first body occurrence of glossary terms', () => {
  const terms = parseGlossary()
  const lines = bodyLines(path.join(ROOT, 'README.md'))
  const problems = []

  for (const { en, zh } of terms) {
    const pattern = termPattern(en)
    const lineIndex = lines.findIndex((line) => pattern.test(line.replace(/`[^`]*`/g, (s) => ' '.repeat(s.length))))
    if (lineIndex === -1) continue

    const line = lines[lineIndex]
    const masked = line.replace(/`[^`]*`/g, (s) => ' '.repeat(s.length))
    const match = pattern.exec(masked)
    const after = masked.slice((match.index ?? 0) + match[1].length + en.length)
    if (new RegExp(`^\\s*（${escapePattern(zh)}）`).test(after) || new RegExp(`^\\s*\\(${escapePattern(zh)}\\)`).test(after)) {
      continue
    }

    problems.push(`README.md: "${en}" first occurrence should be "${en}（${zh}）"`)
  }

  assert.deepEqual(problems, [])
})

void test('AI-facing docs keep glossary terms bare', () => {
  const terms = parseGlossary()
  const problems = []

  for (const file of aiFiles()) {
    const lines = bodyLines(file)
    for (const { en, zh } of terms) {
      const annotated = new RegExp(`${escapePattern(en)}（${escapePattern(zh)}）|${escapePattern(en)}\\(${escapePattern(zh)}\\)`)
      if (lines.some((line) => annotated.test(line.replace(/`[^`]*`/g, (s) => ' '.repeat(s.length))))) {
        problems.push(`${path.relative(ROOT, file)}: keep "${en}" bare in AI-facing docs`)
      }
    }
  }

  assert.deepEqual(problems, [])
})
