import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { isGateFailed, loadConfig, redactSecrets, runGates } from '../src/gates.mjs'

function write(root, rel, text) {
  const file = path.join(root, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, text)
}

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'codecraft-gates-'))
}

function gate(overrides = {}) {
  return {
    id: 'g',
    entry: 'node -e "process.exit(0)"',
    args: [],
    files: [],
    exclude: [],
    output: null,
    ...overrides,
  }
}

void test('loadConfig: missing file returns empty config', () => {
  const root = tempRoot()
  try {
    const loaded = loadConfig(root)
    assert.equal(loaded.file, null)
    assert.deepEqual(loaded.config, { ignore: [], exclude: [] })
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('loadConfig: reads pack, gates, ignore and exclude', () => {
  const root = tempRoot()
  try {
    write(
      root,
      'codecraft.config.json',
      JSON.stringify({
        pack: 'library',
        gates: [{ id: 'ok', entry: 'node -e "process.exit(0)"' }],
        ignore: [{ rule: 'A17', file: 'src/pages/**', reason: 'legacy', expires: '2026-12-31' }],
        exclude: ['server/.env.local'],
      }),
    )

    const loaded = loadConfig(root)

    assert.equal(loaded.config.pack, 'library')
    assert.equal(loaded.config.gates.length, 1)
    assert.deepEqual(loaded.config.gates[0], {
      id: 'ok',
      name: 'ok',
      entry: 'node -e "process.exit(0)"',
      args: [],
      files: [],
      exclude: [],
      output: null,
      timeoutMs: undefined,
    })
    assert.deepEqual(loaded.config.ignore, [
      { rule: 'A17', file: 'src/pages/**', reason: 'legacy', expires: '2026-12-31' },
    ])
    assert.deepEqual(loaded.config.exclude, ['server/.env.local'])
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('loadConfig: 2.0 gate contract rejects the removed 1.x run/name shape with a migration hint', () => {
  const root = tempRoot()
  try {
    write(root, 'codecraft.config.json', JSON.stringify({ gates: [{ id: 'x', run: 'pnpm test' }] }))
    assert.throws(() => loadConfig(root), /rewrite \{ "name": "test", "run": "pnpm test" \} as \{ "id": "test", "entry": "pnpm test" \}/)

    write(root, 'codecraft.config.json', JSON.stringify({ gates: [{ name: 'x', entry: 'pnpm test' }] }))
    assert.throws(() => loadConfig(root), /needs an "id" string/)

    write(root, 'codecraft.config.json', JSON.stringify({ gates: [{ id: 'x' }] }))
    assert.throws(() => loadConfig(root), /needs "id" and "entry"/)

    write(root, 'codecraft.config.json', JSON.stringify({ gates: 'no' }))
    assert.throws(() => loadConfig(root), /gates.*array/)

    write(root, 'codecraft.config.json', JSON.stringify({ gates: [{ id: 'x', entry: 'ok', args: 'no' }] }))
    assert.throws(() => loadConfig(root), /args.*array of strings/)

    write(root, 'codecraft.config.json', JSON.stringify({ gates: [{ id: 'x', entry: 'ok', output: 'checkstyle' }] }))
    assert.throws(() => loadConfig(root), /output.*sarif, junit, gitlab/)

    write(root, 'codecraft.config.json', JSON.stringify({ gates: [{ id: 'x', entry: 'ok', files: [1] }] }))
    assert.throws(() => loadConfig(root), /"files".*glob/)

    write(root, 'codecraft.config.json', JSON.stringify({ gates: [{ id: 'x', entry: 'ok', output: 'gitlab', threshold: { metric: 'errors', operator: '>', value: 0 } }] }))
    assert.throws(() => loadConfig(root), /metric must be "issues"/)

    write(root, 'codecraft.config.json', JSON.stringify({ gates: [{ id: 'x', entry: 'ok', output: 'gitlab', threshold: { metric: 'issues', operator: '~', value: 0 } }] }))
    assert.throws(() => loadConfig(root), /operator must be one of/)

    write(root, 'codecraft.config.json', JSON.stringify({ gates: [{ id: 'x', entry: 'ok', output: 'gitlab', threshold: { metric: 'issues', operator: '>', value: 'many' } }] }))
    assert.throws(() => loadConfig(root), /value must be a number/)

    // 阈值依赖 issue 数：没声明 output 会永久失败，配置期直接拒绝（而不是等到运行时）。
    write(
      root,
      'codecraft.config.json',
      JSON.stringify({ gates: [{ id: 'x', entry: 'ok', threshold: { metric: 'issues', operator: '>', value: 0 } }] }),
    )
    assert.throws(() => loadConfig(root), /sets "threshold" without "output"/)

    write(root, 'codecraft.config.json', JSON.stringify({ ignore: [{ rule: 'A17', file: 'src/**' }] }))
    assert.throws(() => loadConfig(root), /reason/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('loadConfig: accepts the 2.0 shape with args, output, threshold and scope globs', () => {
  const root = tempRoot()
  try {
    write(
      root,
      'codecraft.config.json',
      JSON.stringify({
        gates: [
          {
            id: 'lint',
            name: 'ESLint',
            entry: 'npx eslint',
            args: ['--format', 'sarif', '.'],
            output: 'sarif',
            threshold: { metric: 'issues', operator: '==', value: 0 },
            files: ['src/**'],
            exclude: ['src/generated/**'],
          },
        ],
      }),
    )

    const { gates } = loadConfig(root).config
    assert.equal(gates.length, 1)
    assert.equal(gates[0].name, 'ESLint')
    assert.deepEqual(gates[0].args, ['--format', 'sarif', '.'])
    assert.deepEqual(gates[0].files, ['src/**'])
    assert.deepEqual(gates[0].exclude, ['src/generated/**'])
    assert.equal(gates[0].threshold.value, 0)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('runGates: captures exit codes and output', () => {
  const root = tempRoot()
  try {
    const gates = runGates(root, [
      gate({ id: 'ok', entry: 'node -e "process.exit(0)"' }),
      gate({ id: 'fail', entry: 'node -e "process.exit(1)"' }),
      gate({ id: 'out', entry: 'node -e "console.log(\'gate-ok\')"' }),
    ])

    assert.equal(gates[0].exitCode, 0)
    assert.equal(gates[1].exitCode, 1)
    assert.match(gates[2].output, /gate-ok/)
    assert.equal(isGateFailed(gates[0]), false)
    assert.equal(isGateFailed(gates[1]), true)
    assert.equal(isGateFailed(gates[2]), false)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('runGates: failFast stops after the first failure', () => {
  const root = tempRoot()
  try {
    const gates = runGates(
      root,
      [
        gate({ id: 'ok', entry: 'node -e "process.exit(0)"' }),
        gate({ id: 'fail', entry: 'node -e "process.exit(1)"' }),
        gate({ id: 'out', entry: 'node -e "console.log(\'gate-ok\')"' }),
      ],
      { failFast: true },
    )

    assert.equal(gates.length, 2)
    assert.equal(gates[1].exitCode, 1)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('runGates: full capture (no 40-line truncation), redaction reports the count', () => {
  const root = tempRoot()
  try {
    const lines = []
    for (let i = 1; i <= 80; i += 1) lines.push(`line-${i}`)
    lines.push('Authorization: Bearer abc.def.ghi')
    const print = lines.map((line) => `console.log('${line.replace(/'/g, "\\'")}')`).join('; ')
    const gates = runGates(root, [gate({ id: 'verbose', entry: `node -e "${print}"` })])

    assert.match(gates[0].output, /line-1\b/, 'head of the output must survive (full capture)')
    assert.ok(!/ghp_|abc\.def\.ghi/.test(gates[0].output), 'original secrets must not survive')
    assert.match(gates[0].output, /\[REDACTED\]/)
    assert.equal(gates[0].redacted, 1)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('runGates: parses declared structured outputs (gitlab / sarif / junit)', () => {
  const root = tempRoot()
  try {
    const gitlab = JSON.stringify([
      { description: 'a', check_name: 'r', fingerprint: 'f1', severity: 'major', location: { path: 'a.ts', lines: { begin: 1 } } },
      { description: 'b', check_name: 'r', fingerprint: 'f2', severity: 'minor', location: { path: 'b.ts', lines: { begin: 2 } } },
    ])
    const sarif = JSON.stringify({ runs: [{ results: [{}, {}] }, { results: [{}] }] })
    const junit = ['<testsuite>', '  <testcase name="a"/>', '  <failure message="x"/>', '  <error type="y"/>', '</testsuite>'].join('\n')

    // entry 直接输出样例输出（用临时脚本文件，避免 shell 转义）。
    const script = (text) => {
      const file = path.join(root, `emit-${Math.random().toString(36).slice(2)}.js`)
      fs.writeFileSync(file, `process.stdout.write(${JSON.stringify(text)})`)
      return `node ${JSON.stringify(file)}`
    }
    const parsed = runGates(root, [
      gate({ id: 'gl', entry: script(gitlab), output: 'gitlab' }),
      gate({ id: 'sf', entry: script(sarif), output: 'sarif' }),
      gate({ id: 'ju', entry: script(junit), output: 'junit' }),
    ])

    assert.equal(parsed[0].format, 'gitlab')
    assert.equal(parsed[0].issues, 2)
    assert.equal(parsed[1].format, 'sarif')
    assert.equal(parsed[1].issues, 3)
    assert.equal(parsed[2].format, 'junit')
    assert.equal(parsed[2].issues, 2)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('runGates: threshold triple evaluates parsed issues and fails closed when unparseable', () => {
  const root = tempRoot()
  try {
    const script = (text) => {
      const file = path.join(root, `emit-${Math.random().toString(36).slice(2)}.js`)
      fs.writeFileSync(file, `process.stdout.write(${JSON.stringify(text)})`)
      return `node ${JSON.stringify(file)}`
    }
    const three = JSON.stringify([{},{},{}])

    // 3 > 2 → violated（条件以失败口吻陈述）。
    const [violated] = runGates(root, [
      gate({ id: 't', entry: script(three), output: 'gitlab', threshold: { metric: 'issues', operator: '>', value: 2 } }),
    ])
    assert.equal(violated.threshold.actual, 3)
    assert.equal(violated.threshold.violated, true)
    assert.equal(isGateFailed(violated), true, 'exit 0 but threshold violated → gate fails')

    // 条件以失败口吻陈述：issues > 5 才失败，3 个 → ok。
    const [ok] = runGates(root, [
      gate({ id: 't', entry: script(three), output: 'gitlab', threshold: { metric: 'issues', operator: '>', value: 5 } }),
    ])
    assert.equal(ok.threshold.violated, false)
    assert.equal(isGateFailed(ok), false)

    // 输出声明了但解析不出 → fail-closed。
    const [opaque] = runGates(root, [
      gate({ id: 't', entry: 'node -e "console.log(42)"', output: 'gitlab', threshold: { metric: 'issues', operator: '<', value: 99 } }),
    ])
    assert.equal(opaque.threshold.actual, null)
    assert.equal(opaque.threshold.violated, true)
    assert.equal(isGateFailed(opaque), true)

    // 无阈值时解析失败不影响退出码判定。
    const [plain] = runGates(root, [
      gate({ id: 't', entry: 'node -e "console.log(42)"', output: 'gitlab' }),
    ])
    assert.equal(plain.issues, undefined)
    assert.equal(isGateFailed(plain), false)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('runGates: files/exclude scope skips gates outside changed files', () => {
  const root = tempRoot()
  try {
    const scoped = gate({ id: 'scoped', entry: 'node -e "process.exit(1)"', files: ['src/**'], exclude: ['src/generated/**'] })
    const global = gate({ id: 'global', entry: 'node -e "process.exit(1)"' })

    // 变更文件命中 src/ 但被 exclude 排除 → scoped 跳过，global 照跑。
    const [skipped, ran] = runGates(root, [scoped, global], { changedFiles: ['src/generated/tokens.ts'] })
    assert.equal(skipped.skipped, true)
    assert.equal(skipped.exitCode, 0)
    assert.equal(isGateFailed(skipped), false, 'skipped gates must not fail the run')
    assert.equal(ran.exitCode, 1)

    // 命中 src/app.ts → scoped 照跑并失败。
    const [hit] = runGates(root, [scoped], { changedFiles: ['src/app.ts'] })
    assert.equal(hit.skipped, undefined)
    assert.equal(hit.exitCode, 1)

    // 非 changed 模式（changedFiles=null）：作用域不评估，gate 照跑。
    const [full] = runGates(root, [scoped])
    assert.equal(full.exitCode, 1)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('runGates: redacts secrets in gate output and reports the count', () => {
  const root = tempRoot()
  try {
    const print = [
      "const token = 'ghp_' + 'A'.repeat(30)",
      "console.log('token=' + token)",
      "console.log('Authorization: Bearer abc.def.ghi')",
      "console.log('postgres://user:s3cret@db.internal:5432/app')",
      "console.log('all done')",
    ].join('; ')
    const gates = runGates(root, [gate({ id: 'leak', entry: `node -e "${print}"` })])

    assert.equal(gates.length, 1)
    assert.ok(!/ghp_|s3cret|abc\.def\.ghi/.test(gates[0].output), 'original secrets must not survive')
    assert.match(gates[0].output, /\[REDACTED\]/)
    assert.equal(gates[0].redacted, 3)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('runGates: clean output is untouched and has no redacted field', () => {
  const root = tempRoot()
  try {
    const gates = runGates(root, [gate({ id: 'clean', entry: 'node -e "console.log(\'tests 12 passed\')"' })])

    assert.equal(gates[0].output, 'tests 12 passed')
    assert.equal(gates[0].redacted, undefined)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('redactSecrets hides private keys end to end', () => {
  const text = ['-----BEGIN RSA PRIVATE KEY-----', 'abcdef', '-----END RSA PRIVATE KEY-----'].join('\n')
  const { text: out, count } = redactSecrets(text)

  assert.equal(count, 1)
  assert.ok(!out.includes('abcdef'))
  assert.match(out, /\[REDACTED\]/)
})
