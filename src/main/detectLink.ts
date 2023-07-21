import { cleanOfAnsiCharacters } from "../renderer/src/lib/ansiChars"

export function detectLinks(terminalChunk: string): string[] {
  const regex = /https?:\/\/[^\s]+/g
  const links = terminalChunk.match(regex)
  return links?.map(cleanOfAnsiCharacters) || []
}
