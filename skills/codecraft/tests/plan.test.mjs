import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildPlan, summarizePlan } from '../src/plan.mjs'

void test('buildPlan maps rules to actions and verification', () => {
  const plan = buildPlan([
    { rule: 'A17', severity: 'warn', file: 'src/pages/a.ts', line: 1 },
    { rule: 'A2', severity: 'warn', file: 'src/a.ts', line: 2 },
    { rule: 'A11', severity: 'warn', file: 'dist/tokens.css', line: 1 },
  ])

  assert.equal(plan.length, 3)
  assert.equal(plan[0].id, 'P1')
  assert.match(plan[0].action, /Wrapper/)
  assert.equal(plan[0].verification, 'codecraft check --pack app')
  assert.match(plan[0].constitution, /00-constitution\.md §2 A17/)
  assert.match(plan[1].action, /package\.json/)
  assert.equal(plan[1].verification, 'codecraft check --pack library')
  assert.match(plan[2].action, /Regenerate/)
})

void test('buildPlan maps A21 secrets to rotate advice and flags them critical', () => {
  const [item] = buildPlan([
    { rule: 'A21', severity: 'warn', critical: true, file: '.env', line: 1 },
  ])

  assert.match(item.action, /rotate the credential/)
  assert.equal(item.verification, 'codecraft check')
  assert.equal(item.critical, true)
  assert.match(item.constitution, /A21/)
})

void test('summarizePlan counts by rule', () => {
  const summary = summarizePlan([{ rule: 'A17' }, { rule: 'A17' }, { rule: 'A2' }, { rule: 'A11' }])

  assert.deepEqual(summary, [
    { rule: 'A11', count: 1 },
    { rule: 'A17', count: 2 },
    { rule: 'A2', count: 1 },
  ])
})
