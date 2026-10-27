import assert from 'node:assert/strict'
import { test } from 'node:test'
import { applyIgnores, matchPath, validateIgnore } from '../src/ignore.mjs'

const finding = (overrides = {}) => ({
  rule: 'A17',
  severity: 'warn',
  file: 'src/pages/legacy/home.ts',
  line: 1,
  message: 'imports external',
  ...overrides,
})

void test('validateIgnore: requires rule / file / reason', () => {
  assert.deepEqual(validateIgnore(undefined), [])
  assert.throws(() => validateIgnore([{ file: 'a.ts', reason: 'x' }]), /rule/)
  assert.throws(() => validateIgnore([{ rule: 'A17', reason: 'x' }]), /file/)
  assert.throws(() => validateIgnore([{ rule: 'A17', file: 'a.ts' }]), /reason/)
  assert.throws(() => validateIgnore([{ rule: 'A17', file: 'a.ts', reason: 'x', expires: '2026-02-31' }]), /expires/)
  assert.throws(() => validateIgnore([{ rule: 'A17', file: 'a.ts', reason: 'x', expires: '2026/01/01' }]), /expires/)
  assert.throws(() => validateIgnore([{ rule: 'A21', file: 'a.ts', reason: 'x' }]), /security/)
})

void test('validateIgnore: normalizes entries', () => {
  assert.deepEqual(
    validateIgnore([{ rule: ' A17 ', file: ' src/pages/** ', reason: ' legacy ', expires: '2026-12-31' }]),
    [{ rule: 'A17', file: 'src/pages/**', reason: 'legacy', expires: '2026-12-31' }],
  )
})

void test('matchPath: exact, directory prefix and globs', () => {
  assert.equal(matchPath('src/pages/home.ts', 'src/pages/home.ts'), true)
  assert.equal(matchPath('src/pages/', 'src/pages/home.ts'), true)
  assert.equal(matchPath('src/pages/*.ts', 'src/pages/home.ts'), true)
  assert.equal(matchPath('src/pages/*.ts', 'src/pages/legacy/home.ts'), false)
  assert.equal(matchPath('src/pages/**', 'src/pages/legacy/home.ts'), true)
  assert.equal(matchPath('src/**/home.ts', 'src/home.ts'), true)
  assert.equal(matchPath('src/**/home.ts', 'src/pages/legacy/home.ts'), true)
  assert.equal(matchPath('**/*.ts', 'home.ts'), true)
  assert.equal(matchPath('**/*.ts', 'src/home.ts'), true)
})

void test('applyIgnores: suppresses matching findings and keeps the reason', () => {
  const result = applyIgnores(
    [finding(), finding({ file: 'src/pages/current.ts' })],
    [
      {
        rule: 'A17',
        file: 'src/pages/legacy/**',
        reason: 'legacy page; migrate in 2026-Q4',
        expires: '2099-12-31',
      },
    ],
    { today: '2026-10-27' },
  )

  assert.equal(result.findings.length, 1)
  assert.equal(result.findings[0].file, 'src/pages/current.ts')
  assert.equal(result.ignored.length, 1)
  assert.equal(result.ignored[0].reason, 'legacy page; migrate in 2026-Q4')
  assert.equal(result.exceptions[0].status, 'active')
})

void test('applyIgnores: expired entries do not suppress findings', () => {
  const result = applyIgnores(
    [finding()],
    [{ rule: 'A17', file: 'src/pages/legacy/**', reason: 'expired', expires: '2026-01-01' }],
    { today: '2026-10-27' },
  )

  assert.equal(result.findings.length, 1)
  assert.equal(result.ignored.length, 0)
  assert.equal(result.expired.length, 1)
  assert.equal(result.exceptions[0].status, 'expired')
})

void test('applyIgnores: rule must match', () => {
  const result = applyIgnores(
    [finding({ rule: 'A21' })],
    [{ rule: 'A17', file: 'src/pages/legacy/**', reason: 'only A17', expires: null }],
    { today: '2026-10-27' },
  )

  assert.equal(result.findings.length, 1)
  assert.equal(result.ignored.length, 0)
})
