import fs from 'node:fs'
import path from 'node:path'

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  '.local',
  'coverage',
  '.next',
  '.nuxt',
  '.output',
  '.turbo',
  '.cache',
])

const GENERATED_SKIP_DIRS = new Set(['node_modules', '.git', 'coverage', '.turbo', '.cache'])
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.svelte'])
const GENERATED_EXTENSIONS = new Set(['.ts', '.js', '.css', '.json', '.md'])
const ALLOWED_SEGMENTS = new Set(['external', 'generated', 'api', 'adapters'])
const GENERATED_MARKER = /生成物|generated|do not edit|勿手改|auto-generated|派生/i

const IMPORT_PATTERNS = [
  /\bfrom\s+['"]([^'"]+)['"]/g,
  /\b(?:require|import)\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /^\s*import\s+['"]([^'"]+)['"]/gm,
]

export function check(root, options = {}) {
  const absRoot = path.resolve(root)
  const pack = options.pack ?? 'app'
  if (pack === 'library') return checkLibrary(absRoot)
  return checkApp(absRoot)
}

function checkApp(root) {
  const files = collectAppFiles(root)
  const findings = []
  for (const file of files) findings.push(...scanAppFile(file, root))
  return { root, files: files.length, findings }
}

function checkLibrary(root) {
  const packages = findPackages(root)
  const manifests = packages.map((pkg) => readJson(path.join(pkg, 'package.json')))
  const workspaceNames = new Set(manifests.map((manifest) => manifest?.name).filter(Boolean))
  const findings = []
  let files = 0

  for (let i = 0; i < packages.length; i += 1) {
    const result = checkPackage(packages[i], manifests[i], workspaceNames)
    files += result.files
    findings.push(...result.findings)
  }

  return { root, files, findings }
}

function findPackages(root) {
  const packagesDir = path.join(root, 'packages')
  if (isDir(packagesDir)) {
    return fs
      .readdirSync(packagesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(packagesDir, entry.name))
      .filter((dir) => fs.existsSync(path.join(dir, 'package.json')))
  }
  if (fs.existsSync(path.join(root, 'package.json'))) return [root]
  return []
}

function checkPackage(pkg, manifest, workspaceNames) {
  const name = manifest?.name ?? ''
  const deps = new Set([
    ...Object.keys(manifest?.dependencies ?? {}),
    ...Object.keys(manifest?.peerDependencies ?? {}),
    ...Object.keys(manifest?.devDependencies ?? {}),
  ])
  const src = path.join(pkg, 'src')
  const sourceFiles = isDir(src) ? walkFiles(src) : []
  const findings = []

  for (const file of sourceFiles) {
    const text = read(file)
    if (text == null) continue
    for (const { spec, line } of collectImports(stripComments(text))) {
      const message = libraryImportIssue(spec, file, pkg, name, deps, workspaceNames)
      if (!message) continue
      findings.push({
        rule: 'A2',
        severity: 'warn',
        file: path.relative(pkg, file),
        line,
        message,
      })
    }
  }

  for (const file of collectGeneratedCandidates(pkg)) {
    const text = read(file)
    if (text == null || hasGeneratedMarker(text)) continue
    findings.push({
      rule: 'A11',
      severity: 'warn',
      file: path.relative(pkg, file),
      line: 1,
      message: 'generated file lacks a "do not edit" marker; regenerate from source (A11)',
    })
  }

  return { files: sourceFiles.length, findings }
}

function libraryImportIssue(spec, file, pkg, name, deps, workspaceNames) {
  if (/(^|[/])apps([/]|$)/.test(spec)) {
    return `imports app code "${spec}"; libraries must not depend on apps (A2)`
  }

  if (spec.startsWith('.')) {
    const target = path.resolve(path.dirname(file), spec)
    const rel = path.relative(pkg, target)
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      return `relative import escapes package: "${spec}" (A2)`
    }
    return null
  }

  const dep = [...workspaceNames].find((candidate) => spec === candidate || spec.startsWith(`${candidate}/`))
  if (!dep || dep === name || deps.has(dep)) return null
  return `imports workspace package "${dep}" without declaring it in package.json (A2)`
}

function collectAppFiles(root) {
  const files = []
  const seen = new Set()
  for (const dir of collectAppRoots(root)) walk(dir, files, seen)
  return files
}

function collectAppRoots(root) {
  const roots = []
  const apps = path.join(root, 'apps')
  const packages = path.join(root, 'packages')

  if (isDir(apps)) {
    for (const entry of fs.readdirSync(apps, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const dir = path.join(apps, entry.name)
      roots.push(isDir(path.join(dir, 'src')) ? path.join(dir, 'src') : dir)
    }
  }

  if (isDir(packages)) {
    for (const entry of fs.readdirSync(packages, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const src = path.join(packages, entry.name, 'src')
      if (isDir(src)) roots.push(src)
    }
  }

  const src = path.join(root, 'src')
  if (isDir(src)) roots.push(src)
  if (!roots.length) roots.push(root)
  return roots
}

function walkFiles(dir) {
  const files = []
  walk(dir, files, new Set())
  return files
}

function walk(dir, files, seen) {
  if (seen.has(dir)) return
  seen.add(dir)

  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, files, seen)
      continue
    }
    if (!entry.isFile()) continue
    if (!EXTENSIONS.has(path.extname(entry.name))) continue
    if (isTestFile(full)) continue
    files.push(full)
  }
}

function collectGeneratedCandidates(pkg) {
  const files = []
  walkGenerated(pkg, files, new Set())
  return files.filter(isGeneratedCandidate)
}

function walkGenerated(dir, files, seen) {
  if (seen.has(dir)) return
  seen.add(dir)

  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!GENERATED_SKIP_DIRS.has(entry.name)) walkGenerated(full, files, seen)
      continue
    }
    if (entry.isFile()) files.push(full)
  }
}

function scanAppFile(file, root) {
  if (isAllowedImporter(file, root)) return []

  const text = read(file)
  if (text == null) return []

  const findings = []
  for (const { spec, line } of collectImports(stripComments(text))) {
    if (!isExternalSpec(spec)) continue
    findings.push({
      rule: 'A17',
      severity: 'warn',
      file: path.relative(root, file),
      line,
      message: `imports external type "${spec}"; only Wrapper/API may import external/generated (A4/A17)`,
    })
  }
  return findings
}

function collectImports(text) {
  const imports = []
  const seen = new Set()

  for (const pattern of IMPORT_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const spec = match[1]
      const line = lineAt(text, match.index ?? 0)
      const key = `${line}:${spec}`
      if (seen.has(key)) continue
      seen.add(key)
      imports.push({ spec, line })
    }
  }

  return imports
}

function isGeneratedCandidate(file) {
  const base = path.basename(file)
  if (/\.generated\.[^.]+$/.test(base)) return true
  if (['tokens.css', 'tokens.dtcg.json', 'tokens.js', 'tokens.d.ts'].includes(base)) {
    return true
  }
  return file.split(path.sep).includes('generated') && GENERATED_EXTENSIONS.has(path.extname(base))
}

function hasGeneratedMarker(text) {
  return GENERATED_MARKER.test(text.split('\n').slice(0, 20).join('\n'))
}

function isAllowedImporter(file, root) {
  const segments = path.relative(root, file).split(path.sep)
  return segments.some((segment) => ALLOWED_SEGMENTS.has(segment))
}

function isExternalSpec(spec) {
  return /(^|[/@])(external|generated)([/]|$)/.test(spec)
}

function isTestFile(file) {
  return /(^|[/\\])(__tests__|tests?)[/\\]/.test(file) || /\.(test|spec)\.[^.]+$/.test(file)
}

function stripComments(text) {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
}

function lineAt(text, index) {
  let line = 1
  for (let i = 0; i < index; i += 1) {
    if (text.charCodeAt(i) === 10) line += 1
  }
  return line
}

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8')
  } catch {
    return null
  }
}

function readJson(file) {
  const text = read(file)
  if (text == null) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function isDir(target) {
  try {
    return fs.statSync(target).isDirectory()
  } catch {
    return false
  }
}
