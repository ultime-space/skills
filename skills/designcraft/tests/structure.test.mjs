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
  'docs/foundations.md',
  'docs/color.md',
  'docs/typography.md',
  'docs/space-shape.md',
  'docs/layout.md',
  'docs/depth.md',
  'docs/motion.md',
  'docs/states.md',
  'docs/data-graphics-content.md',
  'docs/composition.md',
  'docs/patterns.md',
  'docs/review.md',
  'docs/style.md',
  'scenarios/review-typography.md',
  'scenarios/review-color.md',
  'scenarios/review-structure.md',
  'scenarios/review-depth.md',
  'scenarios/review-motion.md',
  'scenarios/review-states.md',
  'scenarios/review-content.md',
  'scenarios/review-critique.md',
  'scenarios/compose-page.md',
  'scenarios/compose-component.md',
  'scenarios/build-style.md',
  'scenarios/configure-brand-color.md',
  'scenarios/check-contrast-audit.md',
  'scenarios/refine.md',
  'prompts/output.md',
  'templates/review-report.md',
  'templates/brand-color-check.md',
  'templates/design-spec.md',
  'templates/critique-report.md',
  'templates/style-brief.md',
  'templates/option-set.md',
  'evals/golden-tasks.md',
]

const PURE_KNOWLEDGE_DIRS = ['docs', 'scenarios', 'prompts', 'templates']
const FORBIDDEN_TERMS = [
  'core',
  'kit',
  'viewer',
  'token',
  'seed',
  'manifest',
  'pnpm',
  'configurator',
  '门禁',
  'Ultime',
  '@ultime',
  'packages/',
  '设计规范',
  'spec/',
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

void test('README and docs index mention the current version family', () => {
  const version = read('VERSION').trim()
  const family = version.split('.').slice(0, 2).join('.')

  assert.ok(read('README.md').includes(version), `README.md misses current version ${version}`)
  assert.ok(read('docs/README.md').includes(`${family}.x`), `docs/README.md should use the ${family}.x family`)
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

void test('every docs page except the index declares its scope', () => {
  for (const file of markdownFiles(path.join(ROOT, 'docs'))) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/')
    if (rel === 'docs/README.md') continue
    assert.match(fs.readFileSync(file, 'utf8'), /^> 适用：/m, `${rel} must declare its scope`)
  }
})

void test('docs, scenarios, prompts and templates stay pure knowledge', () => {
  for (const dir of PURE_KNOWLEDGE_DIRS) {
    for (const file of markdownFiles(path.join(ROOT, dir))) {
      const text = fs.readFileSync(file, 'utf8')
      for (const term of FORBIDDEN_TERMS) {
        assert.ok(
          !text.includes(term),
          `${path.relative(ROOT, file)} must not contain product/implementation term: ${term}`,
        )
      }
    }
  }
})

void test('docs, scenarios, prompts and templates avoid CSS property names', () => {
  const CSS_TERMS = [
    '`opacity`',
    '`transform`',
    '`overflow`',
    '`box-shadow`',
    '`line-height`',
    '`font-size`',
    '`font-weight`',
    '`letter-spacing`',
    '`margin`',
    '`padding`',
    '`inset`',
    '`gap`',
    '`clip-path`',
    '`transition: all`',
    '`100vw`',
    '`100dvh`',
    '`:focus-visible`',
    '`oklch()`',
    '`inline-flex`',
    '`solid`',
    '`dashed`',
    '`dotted`',
    '`infinite`',
  ]
  for (const dir of PURE_KNOWLEDGE_DIRS) {
    for (const file of markdownFiles(path.join(ROOT, dir))) {
      const text = fs.readFileSync(file, 'utf8')
      for (const term of CSS_TERMS) {
        assert.ok(
          !text.includes(term),
          `${path.relative(ROOT, file)} must use design language instead of CSS term: ${term}`,
        )
      }
    }
  }
})

void test('pattern entries keep the five required fields', () => {
  const blocks = read('docs/patterns.md')
    .split(/^### /m)
    .slice(1)
    .filter((block) => /^S\d+/.test(block))

  assert.ok(blocks.length >= 10, `patterns.md should declare at least 10 entries, got ${blocks.length}`)

  for (const field of ['**适用**', '**结构**', '**代价**', '**反例**', '**窄屏**']) {
    for (const block of blocks) {
      const name = block.split('\n')[0].trim()
      assert.ok(block.includes(field), `${name} misses ${field}`)
    }
  }
})

void test('color.md keeps the current targets and drops stale claims', () => {
  const color = read('docs/color.md')

  for (const target of ['7.2', '6.0', '5.0', '2.0', '4.5']) {
    assert.ok(color.includes(target), `color.md misses target ${target}`)
  }
  for (const stale of ['0.65', '0.55', '离极', '镜像对称', '步长 0.10', '透明度是值位']) {
    assert.ok(!color.includes(stale), `color.md still contains stale claim: ${stale}`)
  }
  assert.ok(color.includes('配对前景'), 'color.md must name the paired foreground')
  assert.ok(color.includes('不是独立维度'), 'color.md must state that the paired foreground is a slot')
})
