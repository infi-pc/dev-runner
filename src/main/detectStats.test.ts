import { detectStats } from "./detectStats"
describe("detectStats", () => {
  it("should correctly parse stats when all types are present", () => {
    const terminalChunk = "3 errors, 4 warnings, 5 passed"
    const result = detectStats(terminalChunk)
    expect(result).toEqual({
      errors: 3,
      warnings: 4,
      oks: 5,
    })
  })

  it("should return undefined for missing stats", () => {
    const terminalChunk = "3 errors, 5 passed"
    const result = detectStats(terminalChunk)
    expect(result).toEqual({
      errors: 3,
      warnings: undefined,
      oks: 5,
    })
  })

  it("should be case insensitive", () => {
    const terminalChunk = "3 ERRORS, 5 PASSED"
    const result = detectStats(terminalChunk)
    expect(result).toEqual({
      errors: 3,
      warnings: undefined,
      oks: 5,
    })
  })

  it("should handle singular forms", () => {
    const terminalChunk = "1 error, 1 warning, 1 passed"
    const result = detectStats(terminalChunk)
    expect(result).toEqual({
      errors: 1,
      warnings: 1,
      oks: 1,
    })
  })

  it("should handle empty strings", () => {
    const terminalChunk = ""
    const result = detectStats(terminalChunk)
    expect(result).toEqual({
      errors: undefined,
      warnings: undefined,
      oks: undefined,
    })
  })

  it("should ignore additional text", () => {
    const terminalChunk = "This is some text 2 errors more text 3 warnings even more text 4 passed"
    const result = detectStats(terminalChunk)
    expect(result).toEqual({
      errors: 2,
      warnings: 3,
      oks: 4,
    })
  })

  it("detect last match", () => {
    const terminalChunk = "10 passed, 5 passed"
    const result = detectStats(terminalChunk)
    expect(result).toEqual({
      oks: 5,
    })
  })
})
