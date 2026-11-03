import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { loadConfig, redactSecrets, runGates } from '../src/gates.mjs'

function write(root, rel, text) {
  const file = path.join(root, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, text)
}

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'codecraft-gates-'))
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
        gates: [{ name: 'ok', run: 'node -e "process.exit(0)"' }],
        ignore: [{ rule: 'A17', file: 'src/pages/**', reason: 'legacy', expires: '2026-12-31' }],
        exclude: ['server/.env.local'],
      }),
    )

    const loaded = loadConfig(root)

    assert.equal(loaded.config.pack, 'library')
    assert.equal(loaded.config.gates.length, 1)
    assert.deepEqual(loaded.config.ignore, [
      { rule: 'A17', file: 'src/pages/**', reason: 'legacy', expires: '2026-12-31' },
    ])
    assert.deepEqual(loaded.config.exclude, ['server/.env.local'])
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('loadConfig: rejects invalid JSON and invalid gates', () => {
  const root = tempRoot()
  try {
    write(root, 'codecraft.config.json', '{bad')
    assert.throws(() => loadConfig(root), /invalid config/)

    write(root, 'codecraft.config.json', JSON.stringify({ gates: 'no' }))
    assert.throws(() => loadConfig(root), /gates.*array/)

    write(root, 'codecraft.config.json', JSON.stringify({ gates: [{ name: 'x' }] }))
    assert.throws(() => loadConfig(root), /run.*string/)

    write(root, 'codecraft.config.json', JSON.stringify({ ignore: [{ rule: 'A17', file: 'src/**' }] }))
    assert.throws(() => loadConfig(root), /reason/)

    write(root, 'codecraft.config.json', JSON.stringify({ boundaries: [] }))
    assert.throws(() => loadConfig(root), /boundaries/)

    write(root, 'codecraft.config.json', JSON.stringify({ boundaries: { external: [1] } }))
    assert.throws(() => loadConfig(root), /non-empty/)

    write(root, 'codecraft.config.json', JSON.stringify({ boundaries: { allowedImporters: 'src/**' } }))
    assert.throws(() => loadConfig(root), /allowedImporters/)

    write(root, 'codecraft.config.json', JSON.stringify({ boundaries: { generatedDirs: [1] } }))
    assert.throws(() => loadConfig(root), /non-empty/)

    write(root, 'codecraft.config.json', JSON.stringify({ exclude: 'dist' }))
    assert.throws(() => loadConfig(root), /exclude.*array/)

    write(root, 'codecraft.config.json', JSON.stringify({ exclude: [1] }))
    assert.throws(() => loadConfig(root), /non-empty/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('runGates: captures exit codes and output', () => {
  const root = tempRoot()
  try {
    const gates = runGates(root, [
      { name: 'ok', run: 'node -e "process.exit(0)"' },
      { name: 'fail', run: 'node -e "process.exit(1)"' },
      { name: 'out', run: 'node -e "console.log(\'gate-ok\')"' },
    ])

    assert.equal(gates[0].exitCode, 0)
    assert.equal(gates[1].exitCode, 1)
    assert.match(gates[2].output, /gate-ok/)
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
        { name: 'ok', run: 'node -e "process.exit(0)"' },
        { name: 'fail', run: 'node -e "process.exit(1)"' },
        { name: 'out', run: 'node -e "console.log(\'gate-ok\')"' },
      ],
      { failFast: true },
    )

    assert.equal(gates.length, 2)
    assert.equal(gates[1].exitCode, 1)
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
    const gates = runGates(root, [{ name: 'leak', run: `node -e "${print}"` }])

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
    const gates = runGates(root, [{ name: 'clean', run: 'node -e "console.log(\'tests 12 passed\')"' }])

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
