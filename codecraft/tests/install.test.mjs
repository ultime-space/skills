import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { applyInstallPlan, buildInstallPlan, listAgents, parseAgents } from '../src/install.mjs'

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'codecraft-install-'))
}

void test('install plan: explicit agent maps to the expected directory', () => {
  const root = tempRoot()
  try {
    const plan = buildInstallPlan(root, { agents: ['claude'] })

    assert.equal(plan.length, 1)
    assert.equal(plan[0].agent, 'claude')
    assert.equal(plan[0].target, path.join(root, '.claude', 'skills', 'codecraft'))
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('install plan: explicit trae-cn maps to the Trae CN directory', () => {
  const root = tempRoot()
  try {
    const plan = buildInstallPlan(root, { agents: ['trae-cn'] })

    assert.equal(plan.length, 1)
    assert.equal(plan[0].agent, 'trae-cn')
    assert.equal(plan[0].target, path.join(root, '.trae-cn', 'skills', 'codecraft'))
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('install plan: auto detects trae and always includes generic', () => {
  const root = tempRoot()
  try {
    fs.mkdirSync(path.join(root, '.trae'))

    const agents = buildInstallPlan(root, {})
      .map((entry) => entry.agent)
      .sort()

    assert.deepEqual(agents, ['generic', 'trae'])
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('install plan: explicit dest overrides agent directories', () => {
  const root = tempRoot()
  try {
    const plan = buildInstallPlan(root, { dest: 'custom/skills' })

    assert.equal(plan.length, 1)
    assert.equal(plan[0].agent, 'custom')
    assert.equal(plan[0].target, path.join(root, 'custom', 'skills', 'codecraft'))
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('install plan: project agents file adds a custom agent', () => {
  const root = tempRoot()
  try {
    fs.writeFileSync(
      path.join(root, 'codecraft.agents.json'),
      JSON.stringify({
        agents: { 'my-agent': { project: '.my/skills', global: '.my/skills', markers: ['.my'] } },
      }),
    )

    const plan = buildInstallPlan(root, { agents: ['my-agent'] })

    assert.equal(plan.length, 1)
    assert.equal(plan[0].target, path.join(root, '.my', 'skills', 'codecraft'))
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('install plan: auto detects a custom agent from markers', () => {
  const root = tempRoot()
  try {
    fs.writeFileSync(
      path.join(root, 'codecraft.agents.json'),
      JSON.stringify({ agents: { 'my-agent': { project: '.my/skills', markers: ['.my'] } } }),
    )
    fs.mkdirSync(path.join(root, '.my'))

    const names = buildInstallPlan(root, {})
      .map((entry) => entry.agent)
      .sort()

    assert.deepEqual(names, ['generic', 'my-agent'])
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('install plan: invalid agents file is rejected', () => {
  const root = tempRoot()
  try {
    fs.writeFileSync(
      path.join(root, 'codecraft.agents.json'),
      JSON.stringify({ agents: { 'my-agent': { markers: ['.my'] } } }),
    )

    assert.throws(() => buildInstallPlan(root, {}), /needs a non-empty "project"/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('listAgents: reports source and detection', () => {
  const root = tempRoot()
  try {
    fs.writeFileSync(
      path.join(root, 'codecraft.agents.json'),
      JSON.stringify({ agents: { 'my-agent': { project: '.my/skills', markers: ['.my'] } } }),
    )
    fs.mkdirSync(path.join(root, '.my'))

    const agent = listAgents(root).find((item) => item.name === 'my-agent')

    assert.equal(agent.source, 'project')
    assert.equal(agent.detected.project, true)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('install: copies the skill and its references', () => {
  const root = tempRoot()
  try {
    const plan = buildInstallPlan(root, { agents: ['generic'] })
    const applied = applyInstallPlan(plan)
    const target = path.join(root, '.agents', 'skills', 'codecraft')

    assert.equal(applied.created.length, 1)
    assert.ok(fs.existsSync(path.join(target, 'SKILL.md')))
    assert.ok(fs.existsSync(path.join(target, 'docs', '00-constitution.md')))
    assert.ok(fs.existsSync(path.join(target, 'scenarios', 'new-project.md')))
    assert.ok(fs.existsSync(path.join(target, 'prompts', 'output.md')))
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('install: skips existing targets unless force is set', () => {
  const root = tempRoot()
  try {
    const target = path.join(root, '.agents', 'skills', 'codecraft')
    fs.mkdirSync(target, { recursive: true })
    fs.writeFileSync(path.join(target, 'keep.txt'), 'keep')

    const plan = buildInstallPlan(root, { agents: ['generic'] })
    const skipped = applyInstallPlan(plan)
    assert.equal(skipped.skipped.length, 1)
    assert.ok(fs.existsSync(path.join(target, 'keep.txt')))

    const replaced = applyInstallPlan(plan, { force: true })
    assert.equal(replaced.replaced.length, 1)
    assert.ok(!fs.existsSync(path.join(target, 'keep.txt')))
    assert.ok(fs.existsSync(path.join(target, 'SKILL.md')))
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

void test('install: rejects unknown agents', () => {
  assert.throws(() => parseAgents('claude,nope'), /unknown agent/)
  assert.throws(() => buildInstallPlan(process.cwd(), { agents: ['nope'] }), /unknown agent/)
})
