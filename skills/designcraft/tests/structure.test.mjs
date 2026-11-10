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
  'docs/optical-alignment.md',
  'docs/patterns.md',
  'docs/project-types.md',
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

void test('project-types.md declares 8 type cards and 10 role cards with required fields', () => {
  const text = read('docs/project-types.md')
  const blocks = text.split(/^### /m).slice(1)
  const typeBlocks = blocks.filter((block) => /^T\d+\s/.test(block))
  const roleBlocks = blocks.filter((block) => /^R\d+\s/.test(block))

  assert.equal(typeBlocks.length, 8, `expected 8 type cards, got ${typeBlocks.length}`)
  assert.equal(roleBlocks.length, 10, `expected 10 role cards, got ${roleBlocks.length}`)
  assert.ok(text.split('\n').length <= 320, 'project-types.md should stay within the complexity budget')

  const typeFields = ['**目标与阶段**', '**首屏**', '**典型二级页**', '**倾向**', '**常见错误**', '**不适用**']
  const roleFields = [
    '**要回答**',
    '**必需元素**',
    '**常见结构**',
    '**对应条目**',
    '**平台差异**',
    '**常见错误**',
    '**业务可自定**',
  ]

  for (const block of typeBlocks) {
    const name = block.split('\n')[0].trim()
    const body = block.split('\n## ')[0]
    const bullets = body.split('\n').filter((line) => line.startsWith('- '))
    assert.ok(bullets.length <= 6, `${name} exceeds the type card line budget`)
    for (const field of typeFields) {
      assert.ok(body.includes(field), `${name} misses ${field}`)
    }
    for (const term of ['必须', '禁止']) {
      assert.ok(!body.includes(term), `${name} should stay a tendency, not a rule: ${term}`)
    }
  }

  for (const block of roleBlocks) {
    const name = block.split('\n')[0].trim()
    const body = block.split('\n## ')[0]
    const bullets = body.split('\n').filter((line) => line.startsWith('- '))
    assert.ok(bullets.length <= 7, `${name} exceeds the role card line budget`)
    for (const field of roleFields) {
      assert.ok(body.includes(field), `${name} misses ${field}`)
    }
    for (const term of ['必须', '禁止']) {
      assert.ok(!body.includes(term), `${name} should stay a tendency, not a rule: ${term}`)
    }
  }
})

void test('project-types.md supports read-only details and compound types', () => {
  const text = read('docs/project-types.md')
  const r4 = text.split(/^### /m).find((block) => block.startsWith('R4 '))
  const s1 = read('docs/patterns.md')
    .split(/^### /m)
    .find((block) => block.startsWith('S1 '))

  assert.ok(r4?.includes('只读详情'), 'R4 should allow a read-only detail without a main action')
  assert.ok(r4?.includes('明确出口'), 'R4 should ask for an explicit exit when there is no main action')
  assert.ok(s1?.includes('只读详情'), 'S1 should cover read-only details')
  assert.ok(text.includes('类型可复合'), 'project-types.md should explain compound types')
  assert.ok(text.includes('不叠加卡片'), 'compound types should not stack type cards')
})

void test('foundations.md keeps P18 self-description', () => {
  const foundations = read('docs/foundations.md')

  assert.ok(foundations.includes('P18'), 'foundations.md should list P18')
  assert.ok(foundations.includes('自描述'), 'P18 should be named self-description')
  assert.ok(foundations.includes('可访问名称'), 'P18 should keep necessary accessible names')
})

void test('refine.md keeps the diagnosis gate and report boundary', () => {
  const refine = read('scenarios/refine.md')
  const output = read('prompts/output.md')
  const template = read('templates/option-set.md')

  for (const term of ['诊断三证', '默认套路', '没有值得改的结构问题', '交付校验', '不产出 HTML']) {
    assert.ok(refine.includes(term), `refine.md misses ${term}`)
  }
  for (const term of ['诊断三证', '交付校验', '不产出 HTML']) {
    assert.ok(output.includes(term), `prompts/output.md misses ${term}`)
    assert.ok(template.includes(term), `templates/option-set.md misses ${term}`)
  }
})

void test('project-types.md only cites existing structure entries', () => {
  const patterns = read('docs/patterns.md')
  const ids = new Set([...read('docs/project-types.md').matchAll(/S(\d+)/g)].map((match) => `S${match[1]}`))

  assert.ok(ids.size > 0, 'project-types.md should map role cards to structure entries')
  for (const id of ids) {
    assert.match(patterns, new RegExp(`^### ${id} `, 'm'), `project-types.md cites missing entry ${id}`)
  }
})

void test('project-types.md separates platform limits from experience', () => {
  const text = read('docs/project-types.md')

  for (const term of [
    '## 4 平台运行时约束',
    '## 5 规范硬要求',
    '## 6 适老与无障碍：经验与写法',
    '小程序',
    'WCAG',
    '不能互换',
    '业务可自定',
  ]) {
    assert.ok(text.includes(term), `project-types.md misses ${term}`)
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
