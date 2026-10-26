import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const BIN = fileURLToPath(new URL('../bin/codecraft.mjs', import.meta.url))
const PACKAGE = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

function run(args, cwd = process.cwd()) {
  return spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: 'utf8' })
}

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'codecraft-cli-'))
}

void test('cli: version prints the package version', () => {
  const result = run(['version'])

  assert.equal(result.status, 0)
  assert.equal(result.stdout.trim(), PACKAGE.version)
})

void test('cli: --help prints usage and exits 0', () => {
  const result = run(['--help'])

  assert.equal(result.status, 0)
  assert.match(result.stdout, /codecraft <command>/)
})

void test('cli: unknown command exits 2', () => {
  const result = run(['nope'])

  assert.equal(result.status, 2)
  assert.match(result.stderr, /unknown command/)
})

void test('cli: --ci turns findings into a failing exit', () => {
  const root = tempRoot()
  try {
    fs.mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src', 'pages', 'home.ts'), "import { User } from '@/external/user'\n")

    const result = run(['check', '--root', root, '--ci', '--format', 'json'])

    assert.equal(result.status, 1)
    const report = JSON.parse(result.stdout)
    assert.equal(report.findings.length, 1)
    assert.equal(report.findings[0].severity, 'error')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('cli: init --apply requires --name', () => {
  const root = tempRoot()
  try {
    const result = run(['init', '--root', root, '--apply'])

    assert.equal(result.status, 2)
    assert.match(result.stderr, /requires --name/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
