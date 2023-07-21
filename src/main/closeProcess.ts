import { $processes } from "./state"

export async function closeProcess(pid: number, force: boolean) {
  const currentScripts = $processes.getValue()

  const found = currentScripts[Number(pid)]
  if (!found) {
    throw new Error("Could not find script")
  }
  if (found.exitCode === null) {
    if (force) {
      found.ptyProcess.kill()
      // wait for the process to exit
      await new Promise((resolve) => {
        setTimeout(resolve, 0)
      })
    } else {
      // skip
      return
      // throw new Error("Process still running");
    }
  }

  const newScripts = {
    ...currentScripts,
    [pid]: {
      ...found,
      closed: true,
    },
  }

  $processes.next(newScripts)
}
