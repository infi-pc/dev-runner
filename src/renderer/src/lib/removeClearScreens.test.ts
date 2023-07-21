import { removeClearScreens } from "./removeClearScreens"

describe("removeClearScreens", () => {
  test("should remove clear screen characters", () => {
    const textWithClearScreen = "Hello\u001b[2J\u001b[0;0HWorld"
    const result = removeClearScreens(textWithClearScreen)
    expect(result).toBe("HelloWorld")
  })

  test("should handle empty strings", () => {
    const text = ""
    const result = removeClearScreens(text)
    expect(result).toBe("")
  })

  test("should not alter text without clear screen characters", () => {
    const text = "Hello World"
    const result = removeClearScreens(text)
    expect(result).toBe("Hello World")
  })

  test("should remove multiple clear screen characters", () => {
    const textWithMultipleClearScreen = "Hello\u001b[2J\u001b[0;0HWorld\u001b[2J\u001b[0;0H!"
    const result = removeClearScreens(textWithMultipleClearScreen)
    expect(result).toBe("HelloWorld!")
  })

  test("should remove different types of clear screen characters", () => {
    const textWithDifferentClearScreen = "Hello\u001b[2JWorld\u001b[1J!"
    const result = removeClearScreens(textWithDifferentClearScreen)
    expect(result).toBe("HelloWorld!")
  })

  test("should remove home position characters", () => {
    const textWithHomePosition = "Hello\u001b[HWorld"
    const result = removeClearScreens(textWithHomePosition)
    expect(result).toBe("HelloWorld")
  })
})
