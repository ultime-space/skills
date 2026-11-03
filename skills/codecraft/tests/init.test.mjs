import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { applyInitPlan, buildInitPlan, isValidName } from '../src/init.mjs'

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'codecraft-init-'))
}

function find(entries, entryPath) {
  return entries.find((entry) => entry.path === entryPath)
}

void test('app init plan contains the app skeleton', () => {
  const root = tempRoot()
  try {
    const plan = buildInitPlan(root, 'app', 'demo')

    assert.ok(find(plan.entries, 'apps/demo/src/pages'))
    assert.ok(find(plan.entries, 'apps/demo/src/components'))
    assert.ok(find(plan.entries, 'apps/demo/src/behavior'))
    assert.ok(find(plan.entries, 'apps/demo/src/api'))
    assert.ok(find(plan.entries, 'apps/demo/src/external'))
    assert.ok(find(plan.entries, 'codecraft.config.json'))
    assert.equal(plan.config.pack, 'app')
    assert.equal(fs.existsSync(path.join(root, 'apps')), false)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('library init plan contains package skeleton', () => {
  const root = tempRoot()
  try {
    const plan = buildInitPlan(root, 'library', 'pkg')

    assert.ok(find(plan.entries, 'packages/pkg/src'))
    assert.ok(find(plan.entries, 'packages/pkg/tests'))
    assert.ok(find(plan.entries, 'packages/pkg/compat.md'))
    assert.equal(plan.config.pack, 'library')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('init plan marks existing paths', () => {
  const root = tempRoot()
  try {
    fs.mkdirSync(path.join(root, 'docs'))

    const plan = buildInitPlan(root, 'app', 'demo')

    assert.equal(find(plan.entries, 'docs')?.action, 'exists')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('apply writes the app skeleton and renders templates', () => {
  const root = tempRoot()
  try {
    const applied = applyInitPlan(root, buildInitPlan(root, 'app', 'demo'))

    assert.ok(applied.created.includes('apps/demo/src/pages'))
    assert.deepEqual(applied.skipped, [])
    assert.match(fs.readFileSync(path.join(root, 'apps/demo/README.md'), 'utf8'), /# demo/)
    assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'apps/demo/package.json'), 'utf8')).name, 'demo')
    assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'codecraft.config.json'), 'utf8')).pack, 'app')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('apply is idempotent: existing paths are skipped, not overwritten', () => {
  const root = tempRoot()
  try {
    applyInitPlan(root, buildInitPlan(root, 'library', 'my-pkg'))
    const readme = path.join(root, 'packages/my-pkg/README.md')
    fs.writeFileSync(readme, 'edited\n')

    const applied = applyInitPlan(root, buildInitPlan(root, 'library', 'my-pkg'))

    assert.equal(applied.created.length, 0)
    assert.ok(applied.skipped.includes('packages/my-pkg'))
    assert.equal(fs.readFileSync(readme, 'utf8'), 'edited\n')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('name validation rejects traversal, separators, dots and overlong names', () => {
  const badNames = [
    '../escape',
    '../../escape',
    '/tmp/escape',
    'a/b',
    'a\\b',
    '.',
    '..',
    '.hidden',
    'a'.repeat(65),
    'C:\\escape',
  ]
  for (const bad of badNames) {
    assert.equal(isValidName(bad), false, bad)
    assert.throws(() => buildInitPlan('/nonexistent-codecraft-root', 'app', bad), /invalid name/, bad)
  }
  // 空名在 dry-run 是合法占位（<app>），不走校验；isValidName 仍判定为无效。
  assert.equal(isValidName(''), false)
  assert.doesNotThrow(() => buildInitPlan('/nonexistent-codecraft-root', 'app', ''))
})

void test('name validation accepts ordinary names', () => {
  for (const good of ['demo', 'my-pkg', 'app.v2', 'Pkg_1', 'a'.repeat(64)]) {
    assert.equal(isValidName(good), true, good)
  }
})

void test('applyInitPlan refuses entries outside root (defense in depth)', () => {
  const root = tempRoot()
  try {
    const plan = buildInitPlan(root, 'app', 'demo')
    plan.entries.push({ path: '../escaped', type: 'dir' })

    assert.throws(() => applyInitPlan(root, plan), /escapes root/)
    assert.equal(fs.existsSync(path.resolve(root, '../escaped')), false)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
    fs.rmSync(path.resolve(root, '../escaped'), { recursive: true, force: true })
  }
})
