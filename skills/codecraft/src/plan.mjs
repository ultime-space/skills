const ACTIONS = {
  A2: 'Declare the workspace dependency in package.json, or remove the import; if shared, move it to a lower-layer package.',
  A4: 'Move the external import to a Wrapper/API module; expose an internal type to the caller.',
  A11: "Regenerate the file from source and add a 'do not edit' marker; if it is not generated, move it out of generated paths.",
  A17: 'Move the external import to a Wrapper/API module; expose an internal type to the caller.',
}

const VERIFY = {
  A2: 'codecraft check --pack library',
  A4: 'codecraft check --pack app',
  A11: 'codecraft check --pack library',
  A17: 'codecraft check --pack app',
}

export function buildPlan(findings) {
  return findings.map((finding, index) => ({
    id: `P${index + 1}`,
    rule: finding.rule,
    severity: finding.severity,
    file: finding.file,
    line: finding.line,
    action: ACTIONS[finding.rule] ?? 'Review and fix according to the code constitution.',
    verification: VERIFY[finding.rule] ?? 'codecraft check',
  }))
}

export function summarizePlan(findings) {
  const counts = new Map()
  for (const finding of findings) {
    counts.set(finding.rule, (counts.get(finding.rule) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([rule, count]) => ({ rule, count }))
}
