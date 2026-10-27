#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const problems = []

function compare(a, b) {
  const left = a.split('.').map(Number)
  const right = b.split('.').map(Number)
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index]
  }
  return 0
}

const version = read('VERSION').trim()
const pkg = JSON.parse(read('package.json'))
const changelog = read('CHANGELOG.md')

if (!/^\d+\.\d+\.\d+$/.test(version)) problems.push(`VERSION is not semver: ${version}`)
if (pkg.version !== version) problems.push(`package.json ${pkg.version} != VERSION ${version}`)
if (!new RegExp(`^## ${version.replace(/\./g, '\\.')}\\b`, 'm').test(changelog)) {
  problems.push(`CHANGELOG.md has no section for ${version}`)
}

const headings = [...changelog.matchAll(/^## (\d+\.\d+\.\d+)/gm)].map((match) => match[1])
if (new Set(headings).size !== headings.length) problems.push('CHANGELOG.md has duplicate version sections')
for (const heading of headings) {
  if (compare(heading, version) > 0) problems.push(`CHANGELOG.md has a future version ${heading}`)
}

const requiredFiles = ['SKILL.md', 'README.md', 'VERSION', 'CHANGELOG.md']
const requiredDirs = ['docs', 'scenarios', 'prompts', 'templates']

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(ROOT, file))) problems.push(`missing ${file}`)
}
for (const dir of requiredDirs) {
  if (!fs.existsSync(path.join(ROOT, dir))) problems.push(`missing ${dir}/`)
  if (!pkg.files.includes(dir)) problems.push(`package.json files[] misses ${dir}`)
}
for (const file of requiredFiles) {
  if (!pkg.files.includes(file)) problems.push(`package.json files[] misses ${file}`)
}

if (problems.length) {
  console.error(`release-check failed: ${pkg.name}@${version}`)
  for (const problem of problems) console.error(`- ${problem}`)
  process.exit(1)
}

console.log(`release-check ok: ${pkg.name}@${version}`)
