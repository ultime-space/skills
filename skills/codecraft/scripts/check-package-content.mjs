#!/usr/bin/env node
/**
 * 发布内容检查（包内自包含，供 release-check 调用）。
 *
 * 为什么要它：npm 的 files 字段只保证「打包哪些文件」，不保证这些文件里没有
 * 内部路径、内部包名或本地绝对路径。开源包的读者会直接看到发布物，所以要在
 * 发布前对**实际打包清单**做一次内容扫描，而不是依赖手写白名单。
 *
 * 规则分两层：
 * 1. 文件层：禁止测试、依赖、编辑器与本地缓存进入包。
 * 2. 内容层：扫描文本文件里的内部仓库路径、内部包名与本地绝对路径。
 *
 * 例外：确实需要出现时，在 ALLOW 里按文件追加并写明理由；不要用注释绕过。
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)))

const TEXT_EXTENSIONS = new Set([
  '.md',
  '.mdx',
  '.txt',
  '.json',
  '.mjs',
  '.js',
  '.cjs',
  '.ts',
  '.tsx',
  '.css',
  '.html',
  '.yml',
  '.yaml',
  '.svg',
])

/** 文件层：这些路径不应出现在发布物里。 */
const FORBIDDEN_FILES = [
  { id: 'tests', pattern: /(^|\/)tests?\//, hint: '测试文件不随包发布' },
  { id: 'node_modules', pattern: /(^|\/)node_modules\//, hint: '依赖目录不随包发布' },
  { id: 'vcs', pattern: /(^|\/)\.git\//, hint: '版本库目录不随包发布' },
  { id: 'editor', pattern: /(^|\/)\.(?:trae|vscode|idea)\//, hint: '编辑器配置不随包发布' },
  { id: 'cache', pattern: /(^|\/)\.(?:cache|DS_Store)\b|\.log$/, hint: '缓存与日志不随包发布' },
  { id: 'secret', pattern: /\.(?:env|pem|key|p12|pfx)$/, hint: '密钥类文件不随包发布' },
]

/** 内容层：这些字符串不应出现在发布物正文里。 */
const CONTENT_RULES = [
  {
    id: 'absolute-path',
    pattern: /\/Users\/[^\s"'`)]+|\/home\/[A-Za-z0-9._-]+\/[^\s"'`)]+|\b[A-Za-z]:\\[^\s"'`)]+|file:\/\/\//g,
    hint: '本地绝对路径',
  },
  {
    id: 'internal-repo-path',
    pattern: /(?:docs\/roadmap|docs\/design-system|docs\/references|packages\/(?:core|kit|viewer|studio|cli)|\.trae\/)/g,
    hint: '内部仓库路径',
  },
  {
    id: 'internal-package',
    pattern: /@ultime\/(?:core|kit|viewer|studio|cli)\b/g,
    hint: '内部包名',
  },
]

/** 按文件放行的内容；每条例外都要写理由。 */
const ALLOW = [
  {
    file: 'evals/fixtures/a21-placeholders/.env',
    rule: 'secret',
    reason: 'A21 的占位夹具，只含空值与变量引用，不含凭据',
  },
]

function packFiles(root) {
  let raw
  try {
    raw = execFileSync(
      process.platform === 'win32' ? 'npm.cmd' : 'npm',
      ['pack', '--dry-run', '--json', '--ignore-scripts'],
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
  } catch (error) {
    const detail = error.stderr ? String(error.stderr).trim() : error.message
    throw new Error(`无法读取打包清单（npm pack --dry-run）：${detail}`)
  }

  const start = raw.indexOf('[')
  if (start === -1) throw new Error('npm pack 未返回 JSON 清单')
  const info = JSON.parse(raw.slice(start))[0]
  if (!info?.files) throw new Error('npm pack 清单缺少 files 字段')
  return info.files.map((file) => file.path)
}

function readText(file) {
  const extension = path.extname(file).toLowerCase()
  if (!TEXT_EXTENSIONS.has(extension)) return null
  const stat = fs.statSync(file)
  if (stat.size > 1024 * 1024) return false
  return fs.readFileSync(file, 'utf8')
}

function isAllowed(allow, relative, ruleId) {
  return allow.some((item) => {
    if (item.rule !== ruleId) return false
    if (item.file === relative) return true
    if (!item.pattern) return false
    item.pattern.lastIndex = 0
    return item.pattern.test(relative)
  })
}

/** 文件层检查；导出给测试使用。 */
export function scanFileName(relative, allow = ALLOW) {
  const findings = []
  for (const rule of FORBIDDEN_FILES) {
    if (!rule.pattern.test(relative)) continue
    if (isAllowed(allow, relative, rule.id)) continue
    findings.push(`文件检查 ${relative} [${rule.id}] ${rule.hint}`)
  }
  return findings
}

/** 内容层检查；导出给测试使用。 */
export function scanText(relative, text, allow = ALLOW) {
  const findings = []
  text.split(/\r?\n/).forEach((line, index) => {
    for (const rule of CONTENT_RULES) {
      const matches = line.match(rule.pattern)
      if (!matches) continue
      if (isAllowed(allow, relative, rule.id)) continue
      findings.push(
        `内容检查 ${relative}:${index + 1} [${rule.id}] ${rule.hint}：${matches[0]}`,
      )
    }
  })
  return findings
}

export function collectPackageFindings(root = ROOT) {
  const base = fs.realpathSync(path.resolve(root))
  const findings = []
  const files = packFiles(base)

  for (const relative of files) {
    const absolute = path.resolve(base, relative)
    let real
    try {
      real = fs.realpathSync(absolute)
    } catch {
      findings.push(`文件检查 ${relative} [unreadable] 无法解析真实路径`)
      continue
    }
    const outside = path.relative(base, real)
    if (outside.startsWith('..') || path.isAbsolute(outside)) {
      findings.push(`文件检查 ${relative} [outside-package] 路径越出包目录`)
      continue
    }

    findings.push(...scanFileName(relative))

    const text = readText(real)
    if (text === false) {
      findings.push(`文件检查 ${relative} [unscanned] 文本超过 1 MB，未扫描`)
    } else if (text !== null) {
      findings.push(...scanText(relative, text))
    }
  }

  return findings
}

function main() {
  const findings = collectPackageFindings()
  if (findings.length) {
    console.error(`package content check failed (${findings.length})`)
    for (const finding of findings) console.error(`- ${finding}`)
    process.exit(1)
  }
  console.log('package content check ok')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
