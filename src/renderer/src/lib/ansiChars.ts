/* eslint-disable no-control-regex */
export function cleanOfAnsiCharacters(text: string) {
  return text.replace(/\u001b\[[0-9]{1,2}m/g, "")
}

export const ansiColors = {
  black: "\u001b[30m",
  red: "\u001b[31m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  blue: "\u001b[34m",
  magenta: "\u001b[35m",
  cyan: "\u001b[36m",
  white: "\u001b[37m",
  reset: "\u001b[0m", // Reset color
  brightBlack: "\u001b[90m",
  brightRed: "\u001b[91m",
  brightGreen: "\u001b[92m",
  brightYellow: "\u001b[93m",
  brightBlue: "\u001b[94m",
  brightMagenta: "\u001b[95m",
  brightCyan: "\u001b[96m",
  brightWhite: "\u001b[97m",
} as const

export function removeAnsiExceptColorsAndFormatting(text: string) {
  // Keep color codes 30-37 (text color), 90-97 (bright text color), 0 (reset),
  // 1-9 (basic formatting), and remove other ANSI escape codes
  return text.replace(/\u001b\[((?![1-9]|3[0-7]|9[0-7]|0)[^m]*)m/g, "")
}

// export function removeAllAnsiAndInvisibleChars(text: string) {
//   // Remove ANSI escape codes
//   const withoutAnsi = text.replace(/\u001b\[.*?m/g, "");

//   // Remove control characters (ASCII values 0 to 31) except newline (\n) and carriage return (\r)
//   return withoutAnsi.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, "");
// }

export function removeAllAnsiAndInvisibleChars(text: string) {
  // Remove ANSI escape codes and certain CSI sequences
  const withoutAnsi = text.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "")

  // Remove control characters (ASCII values 0 to 31) except newline (\n) and carriage return (\r)
  return withoutAnsi.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, "")
}

export function removeProblematicControlChars(text: string) {
  // Remove known control sequences
  let sanitized = text.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "")

  // Remove all non-printable characters except newlines and carriage returns
  sanitized = sanitized.replace(/[^\x20-\x7E\n\r]/g, "")

  return sanitized
}

const terminalColors = ["red", "green", "yellow", "blue", "magenta", "cyan"] as const
export type TerminalColor = (typeof terminalColors)[number]

export class ColorBuilder {
  index: number = 0
  next(): TerminalColor {
    const color = terminalColors[this.index]
    this.index = (this.index + 1) % terminalColors.length
    return color
  }
}
