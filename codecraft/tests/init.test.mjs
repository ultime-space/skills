import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { applyInitPlan, buildInitPlan } from '../src/init.mjs'

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
