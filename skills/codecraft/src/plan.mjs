const ACTIONS = {
  A2: 'Declare the workspace dependency in package.json, or remove the import; if shared, move it to a lower-layer package.',
  A4: 'Move the external import to a Wrapper/API module; expose an internal type to the caller.',
  A6: 'Return a Result or handle the error; never swallow it in an empty catch.',
  A11: "Regenerate the file from source and add a 'do not edit' marker; if it is not generated, move it out of generated paths.",
  A17: 'Move the external import to a Wrapper/API module; expose an internal type to the caller.',
  A21: 'Remove the secret, rotate the credential, and load it from env / secret manager; never commit it.',
}

const VERIFY = {
  A2: 'codecraft check --pack library',
  A4: 'codecraft check --pack app',
  A6: 'codecraft check',
  A11: 'codecraft check --pack library',
  A17: 'codecraft check --pack app',
  A21: 'codecraft check',
}

/** 规则出处：agent 消费契约要求每条计划可反解到宪法条款（02-ai-contract 的证据要求）。 */
const CONSTITUTION = {
  A2: 'docs/shared/00-constitution.md §2 A2 Dependencies Point Inward',
  A4: 'docs/shared/00-constitution.md §2 A4 Single Funnel',
  A6: 'docs/shared/00-constitution.md §2 A6 Expected Failure as Value',
  A11: 'docs/shared/00-constitution.md §2 A11 Generated Code Is Read-Only',
  A17: 'docs/shared/00-constitution.md §2 A17 Inside/Outside Separation',
  A21: 'docs/shared/00-constitution.md §2 A21 Document Security Boundaries',
}

export function buildPlan(findings) {
  return findings.map((finding, index) => ({
    id: `P${index + 1}`,
    rule: finding.rule,
    severity: finding.severity,
    critical: finding.critical === true,
    file: finding.file,
    line: finding.line,
    action: ACTIONS[finding.rule] ?? 'Review and fix according to the code constitution.',
    verification: VERIFY[finding.rule] ?? 'codecraft check',
    constitution: CONSTITUTION[finding.rule] ?? 'docs/shared/00-constitution.md §2',
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
