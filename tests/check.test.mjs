import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { check } from '../src/check.mjs'

function write(root, rel, text) {
  const file = path.join(root, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, text)
}

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'codecraft-'))
}

void test('A17: pages / components / behavior cannot import external or generated', () => {
  const root = tempRoot()
  try {
    write(root, 'src/pages/home.ts', "import { User } from '@/external/user'\n")
    write(root, 'src/components/card.ts', "import type { Row } from '@/generated/types'\n")
    write(root, 'src/behavior/use.ts', "import { User } from '@/external/user'\n")
    write(root, 'src/api/user.ts', "import { User } from '@/external/user'\n")

    const result = check(root)

    assert.equal(result.findings.length, 3)
    assert.deepEqual(result.findings.map((finding) => finding.file).sort(), [
      'src/behavior/use.ts',
      'src/components/card.ts',
      'src/pages/home.ts',
    ])
    assert.ok(result.findings.every((finding) => finding.rule === 'A17'))
    assert.ok(result.findings.every((finding) => finding.severity === 'warn'))
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('ignores comments, test files, adapters and package names', () => {
  const root = tempRoot()
  try {
    write(
      root,
      'src/pages/a.ts',
      "// import { User } from '@/external/user'\n/* import { Row } from '@/generated/types' */\n",
    )
    write(root, 'src/pages/a.test.ts', "import { User } from '@/external/user'\n")
    write(root, 'src/adapters/x.ts', "import { User } from '@/external/user'\n")
    write(root, 'src/pages/b.ts', "import { x } from 'my-external-lib'\n")

    const result = check(root)

    assert.equal(result.findings.length, 0)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('scans apps/*/src and packages/*/src in a monorepo', () => {
  const root = tempRoot()
  try {
    write(root, 'apps/mp/src/pages/home.ts', "import { User } from '@/external/user'\n")
    write(root, 'packages/ui/src/components/card.ts', "import { Row } from '@/generated/types'\n")
    write(root, 'packages/ui/src/adapters/source.ts', "import { User } from '@/external/user'\n")

    const result = check(root)

    assert.equal(result.findings.length, 2)
    assert.deepEqual(result.findings.map((finding) => finding.file).sort(), [
      'apps/mp/src/pages/home.ts',
      'packages/ui/src/components/card.ts',
    ])
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('library A2: undeclared workspace dependency and app import', () => {
  const root = tempRoot()
  try {
    write(root, 'packages/core/package.json', JSON.stringify({ name: '@x/core' }))
    write(root, 'packages/kit/package.json', JSON.stringify({ name: '@x/kit' }))
    write(root, 'packages/core/src/a.ts', "import { x } from '@x/kit'\n")
    write(root, 'packages/core/src/b.ts', "import { y } from '../../../apps/web/src/y'\n")

    const result = check(root, { pack: 'library' })
    const findings = result.findings.filter((finding) => finding.rule === 'A2')

    assert.equal(findings.length, 2)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('library A2: declared workspace dependency is allowed', () => {
  const root = tempRoot()
  try {
    write(
      root,
      'packages/core/package.json',
      JSON.stringify({ name: '@x/core', dependencies: { '@x/kit': 'workspace:*' } }),
    )
    write(root, 'packages/kit/package.json', JSON.stringify({ name: '@x/kit' }))
    write(root, 'packages/core/src/a.ts', "import { x } from '@x/kit'\n")

    const result = check(root, { pack: 'library' })
    const findings = result.findings.filter((finding) => finding.rule === 'A2')

    assert.equal(findings.length, 0)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('library A11: generated files need a marker', () => {
  const root = tempRoot()
  try {
    write(root, 'packages/core/package.json', JSON.stringify({ name: '@x/core' }))
    write(root, 'packages/core/dist/tokens.css', 'body { color: red }\n')
    write(root, 'packages/core/dist/tokens.dtcg.json', '{"color":"red"}\n')

    const result = check(root, { pack: 'library' })
    const findings = result.findings.filter((finding) => finding.rule === 'A11')

    assert.equal(findings.length, 2)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('library A11: marker passes', () => {
  const root = tempRoot()
  try {
    write(root, 'packages/core/package.json', JSON.stringify({ name: '@x/core' }))
    write(root, 'packages/core/dist/tokens.css', '/* 生成物 · 勿手改 */\nbody { color: red }\n')
    write(root, 'packages/core/tokens.json', '{"seed":true}\n')

    const result = check(root, { pack: 'library' })
    const findings = result.findings.filter((finding) => finding.rule === 'A11')

    assert.equal(findings.length, 0)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
