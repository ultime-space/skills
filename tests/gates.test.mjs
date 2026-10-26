import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { loadConfig, runGates } from '../src/gates.mjs'

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
    assert.deepEqual(loaded.config, {})
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('loadConfig: reads pack and gates', () => {
  const root = tempRoot()
  try {
    write(
      root,
      'codecraft.config.json',
      JSON.stringify({ pack: 'library', gates: [{ name: 'ok', run: 'node -e "process.exit(0)"' }] }),
    )

    const loaded = loadConfig(root)

    assert.equal(loaded.config.pack, 'library')
    assert.equal(loaded.config.gates.length, 1)
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
