export function load(): string {
  try {
    return read()
  } catch (error) {
    report(error)
    return ''
  }
}
