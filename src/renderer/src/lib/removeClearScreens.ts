/* eslint-disable no-control-regex */
export function removeClearScreens(text: string) {
  return text.replace(/(\u001b|\033)\[(0|1|2|3)J|(\u001b|\033)\[H|(\u001b|\033)\[\d*;\d*H/g, "")
}
