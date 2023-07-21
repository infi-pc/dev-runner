type Res = {
  errors?: number
  warnings?: number
  oks?: number
}

export function detectStats(terminalChunk: string): Res {
  const errors = /\d+\s*(error)s?/gi
  const warnings = /\d+\s*(warning)s?/gi
  const oks = /\d+\s*(passed|pass)/gi

  const obj: Res = {}
  const foundErrors = match(terminalChunk, errors)
  if (foundErrors) {
    obj["errors"] = foundErrors
  }

  const foundWarnings = match(terminalChunk, warnings)
  if (foundWarnings) {
    obj["warnings"] = foundWarnings
  }

  const foundOks = match(terminalChunk, oks)
  if (foundOks) {
    obj["oks"] = foundOks
  }

  return obj
}

function match(terminalChunk: string, regex: RegExp): number | undefined {
  const matches = terminalChunk.match(regex)
  if (!matches || matches.length === 0) {
    return undefined
  }
  const match = matches[matches.length - 1]
  const number = parseInt(match.split(" ")[0])
  return number
}
