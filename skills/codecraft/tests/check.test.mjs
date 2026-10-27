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

void test('A17: boundaries config catches custom generated paths', () => {
  const root = tempRoot()
  try {
    write(root, 'src/pages/home.ts', "import type { Project } from '@/types/project'\n")
    write(root, 'src/api/project.ts', "import type { Project } from '@/types/project'\n")

    const result = check(root, { boundaries: { generated: ['@/types/project'] } })

    assert.equal(result.findings.length, 1)
    assert.equal(result.findings[0].rule, 'A17')
    assert.equal(result.findings[0].file, 'src/pages/home.ts')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('A6: empty catch is reported; handled catch is not', () => {
  const root = tempRoot()
  try {
    write(root, 'src/pages/empty.ts', 'try {\n  run()\n} catch {}\n')
    write(root, 'src/pages/handled.ts', 'try {\n  run()\n} catch (error) {\n  report(error)\n}\n')

    const result = check(root)
    const findings = result.findings.filter((finding) => finding.rule === 'A6')

    assert.equal(findings.length, 1)
    assert.equal(findings[0].file, 'src/pages/empty.ts')
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

void test('A21: flags high-confidence secrets', () => {
  const root = tempRoot()
  try {
    const key = ['AKIA', 'Z'.repeat(16)].join('')
    write(root, 'src/config.ts', `const key = '${key}'\n`)

    const result = check(root)
    const findings = result.findings.filter((finding) => finding.rule === 'A21')

    assert.equal(findings.length, 1)
    assert.equal(findings[0].file, 'src/config.ts')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('A6: line numbers survive multi-line comments', () => {
  const root = tempRoot()
  try {
    write(
      root,
      'src/pages/empty.ts',
      '/**\n * one\n * two\n */\n\ntry {\n  run()\n} catch {\n}\n',
    )

    const result = check(root)
    const findings = result.findings.filter((finding) => finding.rule === 'A6')

    assert.equal(findings.length, 1)
    assert.equal(findings[0].line, 8)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('A17: generated files are detected by their header', () => {
  const root = tempRoot()
  try {
    write(
      root,
      'src/types/project.ts',
      '/**\n * 本文件由脚本生成，勿手改。\n */\nexport interface Project { id: string }\n',
    )
    write(root, 'src/pages/home.ts', "import type { Project } from '@/types/project'\n")
    write(root, 'src/api/project.ts', "import type { Project } from '@/types/project'\n")
    write(
      root,
      'src/types/consumer.ts',
      "/** 本文件由脚本生成，勿手改 */\nimport type { Project } from './project'\n",
    )

    const result = check(root)
    const findings = result.findings.filter((finding) => finding.rule === 'A17')

    assert.equal(findings.length, 1)
    assert.equal(findings[0].file, 'src/pages/home.ts')
    assert.match(findings[0].message, /generated type/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('A17: generated assets and header mentions are not treated as contracts', () => {
  const root = tempRoot()
  try {
    write(
      root,
      'src/icons/icons.ts',
      '/* icons.ts — 由脚本生成，勿手改 */\nexport default { search: "<path />" }\n',
    )
    write(
      root,
      'src/icons/solid.ts',
      '/**\n * 手写区，与生成区 icons.ts 并列\n * 生成区红线是勿手改\n */\nexport default { play: "<path />" }\n',
    )
    write(root, 'src/pages/home.ts', "import icons from '@/icons/icons'\nimport solid from '@/icons/solid'\n")

    const result = check(root)
    const findings = result.findings.filter((finding) => finding.rule === 'A17')

    assert.equal(findings.length, 0)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('A21: flags plaintext config secrets and Aliyun keys, skips placeholders', () => {
  const root = tempRoot()
  try {
    write(
      root,
      'server/application.yml',
      [
        'spring:',
        '  datasource:',
        '    password: zb321.A',
        '  redis:',
        '    password: ${REDIS_PASSWORD}',
        'jwt:',
        '    secret: change-me',
      ].join('\n'),
    )
    write(
      root,
      'server/src/Ali.java',
      'class A {\n  private static final String ACCESS_KEY_ID = "LTAI5tAbCdEfGhIjKl";\n}\n',
    )
    write(root, '.env', 'APP_SECRET=abcdef123456\n')

    const result = check(root)
    const findings = result.findings.filter((finding) => finding.rule === 'A21')

    assert.equal(findings.length, 3)
    assert.deepEqual(
      findings.map((finding) => finding.file).sort(),
      ['.env', 'server/application.yml', 'server/src/Ali.java'],
    )
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('A21: shell env prefixes with variables are not plaintext secrets', () => {
  const root = tempRoot()
  try {
    write(
      root,
      'scripts/db.sh',
      'MYSQL_PWD="$DST_PASS" mysql -h "$HOST" -u "$USER"\nMYSQL_PWD=${DST_PASS} mysql -e "select 1"\n',
    )

    const result = check(root, { pack: 'app' })

    assert.equal(result.findings.filter((finding) => finding.rule === 'A21').length, 0)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('A21: installed agent skills are not scanned', () => {
  const root = tempRoot()
  try {
    write(root, '.agents/skills/codecraft/evals/fixtures/.env', 'APP_SECRET=abcdef123456\n')
    write(root, '.trae/skills/codecraft/evals/fixtures/.env', 'APP_SECRET=abcdef123456\n')
    write(root, 'src/pages/home.ts', 'export const ready = true\n')

    const result = check(root)

    assert.equal(result.findings.length, 0)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('design-system A21: package docs must not reference internal docs', () => {
  const root = tempRoot()
  try {
    write(root, 'packages/ui/package.json', JSON.stringify({ name: '@x/ui' }))
    write(root, 'packages/ui/README.md', '见 `docs/开发计划/x.md`\n见 `../docs/guide.md`\n自带文档：`docs/guide.md`\n')

    const designSystem = check(root, { pack: 'design-system' }).findings
    const library = check(root, { pack: 'library' }).findings

    assert.equal(designSystem.filter((finding) => finding.rule === 'A21').length, 2)
    assert.equal(library.filter((finding) => finding.rule === 'A21').length, 0)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('minified bundles skip structural rules but stay in the secret scan', () => {
  const root = tempRoot()
  try {
    const key = ['AKIA', 'Z'.repeat(16)].join('')
    const bundle = `import { User } from '@/external/user';try{run()}catch{};const key='${key}';${'x'.repeat(1200)}`
    write(root, 'src/pages/bundle.js', bundle)

    const result = check(root)

    assert.equal(result.findings.filter((finding) => finding.rule === 'A17').length, 0)
    assert.equal(result.findings.filter((finding) => finding.rule === 'A6').length, 0)
    assert.equal(result.findings.filter((finding) => finding.rule === 'A21').length, 1)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('exclude: skips files before scanning, without hiding other findings', () => {
  const root = tempRoot()
  try {
    write(root, 'src/pages/home.ts', "import { User } from '@/external/user'\n")
    write(root, 'evals/fixtures/a17/src/pages/home.ts', "import { User } from '@/external/user'\n")
    write(root, 'evals/fixtures/a21/.env', 'APP_SECRET=abcdef123456\n')

    const all = check(root)
    assert.equal(all.findings.length, 2)

    for (const pattern of ['evals/fixtures', 'evals/fixtures/**', 'evals/**']) {
      const filtered = check(root, { exclude: [pattern] })
      assert.equal(filtered.findings.length, 1, pattern)
      assert.equal(filtered.findings[0].file, 'src/pages/home.ts', pattern)
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('exclude: library pack skips generated candidates and package docs', () => {
  const root = tempRoot()
  try {
    write(root, 'packages/ui/package.json', JSON.stringify({ name: '@x/ui' }))
    write(root, 'packages/ui/dist/tokens.css', 'body { color: red }\n')
    write(root, 'packages/ui/README.md', '见 `docs/开发计划/x.md`\n')

    const filtered = check(root, {
      pack: 'design-system',
      exclude: ['packages/ui/dist', 'packages/ui/README.md'],
    })

    assert.equal(filtered.findings.length, 0)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
