import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const BIN = fileURLToPath(new URL('../bin/codecraft.mjs', import.meta.url))
const CASES = JSON.parse(fs.readFileSync(new URL('./cases.json', import.meta.url), 'utf8'))

let failed = 0

for (const testCase of CASES) {
  const root = fileURLToPath(new URL(`./fixtures/${testCase.root}/`, import.meta.url))
  const args = ['check', '--root', root, ...(testCase.args ?? [])]
  const result = spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8' })
  const problems = []

  if (result.status !== testCase.expect.exit) {
    problems.push(`exit ${result.status}, expected ${testCase.expect.exit}`)
  }

  if (testCase.expect.sarif) {
    try {
      const report = JSON.parse(result.stdout)
      if (report.version !== testCase.expect.sarif.version) {
        problems.push(`sarif version ${report.version}, expected ${testCase.expect.sarif.version}`)
      }
      if (report.runs?.[0]?.results?.[0]?.ruleId !== testCase.expect.sarif.rule) {
        problems.push(`sarif result ${report.runs?.[0]?.results?.[0]?.ruleId}, expected ${testCase.expect.sarif.rule}`)
      }
    } catch (error) {
      problems.push(`invalid sarif: ${error.message}`)
    }
  } else {
    let report
    try {
      report = JSON.parse(result.stdout)
    } catch (error) {
      problems.push(`invalid json: ${error.message}`)
    }
    if (report) {
      const expected = testCase.expect.findings ?? {}
      const total = Object.values(expected).reduce((sum, count) => sum + count, 0)
      if (report.findings.length !== total) {
        problems.push(`findings ${report.findings.length}, expected ${total}`)
      }
      const counts = {}
      for (const finding of report.findings) counts[finding.rule] = (counts[finding.rule] ?? 0) + 1
      for (const [rule, count] of Object.entries(expected)) {
        if ((counts[rule] ?? 0) !== count) problems.push(`${rule} ${counts[rule] ?? 0}, expected ${count}`)
      }
      for (const key of ['ignored', 'expired']) {
        const actual = Array.isArray(report[key]) ? report[key].length : report[key]
        if (testCase.expect[key] != null && actual !== testCase.expect[key]) {
          problems.push(`${key} ${actual}, expected ${testCase.expect[key]}`)
        }
      }
      if (testCase.expect.warnings != null && report.warnings?.length !== testCase.expect.warnings) {
        problems.push(`warnings ${report.warnings?.length ?? 0}, expected ${testCase.expect.warnings}`)
      }
    }
  }

  if (problems.length) {
    failed += 1
    console.error(`✗ ${testCase.name}: ${problems.join('; ')}`)
    if (result.stderr.trim()) console.error(result.stderr.trim().split('\n').slice(0, 4).join('\n'))
  } else {
    console.log(`✓ ${testCase.name}`)
  }
}

if (failed) {
  console.error(`\n${failed}/${CASES.length} eval cases failed`)
  process.exit(1)
}
console.log(`\n${CASES.length}/${CASES.length} eval cases passed`)
