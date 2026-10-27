const DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * 校验并规范化 ignore 条目。
 * 每条必须有 rule / file / reason；expires 可选（YYYY-MM-DD）。
 */
export function validateIgnore(entries, configFile = 'config') {
  if (entries == null) return []
  if (!Array.isArray(entries)) {
    throw new Error(
      `invalid config ${configFile}: "ignore" must be an array (each item: { rule, file, reason, expires? })`,
    )
  }

  return entries.map((entry, index) => {
    const at = `ignore[${index}]`
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`invalid config ${configFile}: ${at} must be an object`)
    }

    const rule = typeof entry.rule === 'string' ? entry.rule.trim() : ''
    if (!/^A\d+$/.test(rule)) {
      throw new Error(`invalid config ${configFile}: ${at}.rule must be a rule id like "A17"`)
    }
    if (rule === 'A21') {
      throw new Error(
        `invalid config ${configFile}: ${at}.rule A21 is a security rule and cannot be ignored (safety red line)`,
      )
    }

    const file = typeof entry.file === 'string' ? entry.file.trim() : ''
    if (!file) {
      throw new Error(`invalid config ${configFile}: ${at}.file is required (path or glob, e.g. "src/pages/legacy/**")`)
    }

    const reason = typeof entry.reason === 'string' ? entry.reason.trim() : ''
    if (!reason) {
      throw new Error(`invalid config ${configFile}: ${at}.reason is required (A12: every exception needs a reason)`)
    }

    const expires = entry.expires == null || entry.expires === '' ? null : String(entry.expires).trim()
    if (expires && !isDate(expires)) {
      throw new Error(`invalid config ${configFile}: ${at}.expires must be YYYY-MM-DD`)
    }

    return { rule, file, reason, expires }
  })
}

/**
 * 把 ignore 应用到 findings 上。
 * 过期条目不生效，单独返回，供报告提示续期或删除。
 */
export function applyIgnores(findings, exceptions, options = {}) {
  const today = options.today ?? localDate()
  const active = []
  const expired = []

  for (const exception of exceptions) {
    if (exception.expires && exception.expires < today) expired.push(exception)
    else active.push(exception)
  }

  const kept = []
  const ignored = []

  for (const finding of findings) {
    const matched = active.find(
      (exception) => exception.rule === finding.rule && matchPath(exception.file, finding.file),
    )
    if (matched) ignored.push({ ...finding, reason: matched.reason, expires: matched.expires })
    else kept.push(finding)
  }

  return {
    findings: kept,
    ignored,
    exceptions: [
      ...active.map((exception) => ({ ...exception, status: 'active' })),
      ...expired.map((exception) => ({ ...exception, status: 'expired' })),
    ],
    expired,
  }
}

/** 支持 * / ** / ? 的路径匹配；不含通配符时按精确路径或目录前缀匹配。 */
export function matchPath(pattern, file) {
  const normalizedPattern = normalize(pattern)
  const normalizedFile = normalize(file)

  if (!/[*?]/.test(normalizedPattern)) {
    return (
      normalizedFile === normalizedPattern ||
      (normalizedPattern.endsWith('/') && normalizedFile.startsWith(normalizedPattern))
    )
  }

  return globToRegExp(normalizedPattern).test(normalizedFile)
}

function normalize(value) {
  return String(value)
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
}

function globToRegExp(pattern) {
  let source = '^'
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index]
    if (char === '*') {
      if (pattern[index + 1] === '*') {
        index += 1
        if (pattern[index + 1] === '/') {
          source += '(?:.*/)?'
          index += 1
        } else {
          source += '.*'
        }
      } else {
        source += '[^/]*'
      }
    } else if (char === '?') {
      source += '[^/]'
    } else if ('\\^$+?.()|{}[]'.includes(char)) {
      source += `\\${char}`
    } else {
      source += char
    }
  }
  return new RegExp(`${source}$`)
}

function isDate(value) {
  if (!DATE.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function localDate() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}
