import z from "zod"
import { initTRPC } from "@trpc/server"
import { observable } from "@trpc/server/observable"
import superjson from "superjson"
import { dialog } from "electron"
import type { DevRunnerGroups, PackageInfos, ProcessInfos } from "../renderer/src/lib/types"
import { map, tap, interval, throttle, combineLatest } from "rxjs"

import { shell } from "electron"
import {
  $folder,
  $latestStats,
  $packageJsons,
  $processes,
  $sharedTerminalOutput,
  $terminalOutputs,
  STORE_FOLDER_KEY,
  runScript,
  store,
} from "./state"
import { closeProcess } from "./closeProcess"
import path from "path"

const t = initTRPC.create({ isServer: true, transformer: superjson })

export const router = t.router({
  terminal: t.procedure
    .input(
      z.object({
        pid: z.string(),
      }),
    )
    .subscription(({ input }) => {
      const { pid } = input

      if (pid === "all") {
        return observable<string>((emit) => {
          const subscription = $sharedTerminalOutput.subscribe((output) => {
            emit.next(output)
          })

          return () => {
            subscription.unsubscribe()
          }
        })
      }
      const output = $terminalOutputs[Number(pid)]

      if (!output) {
        console.error(`Process not found with pid ${pid}`)
        throw new Error(`Process not found with pid ${pid}`)
      }

      return observable<string>((emit) => {
        const subscription = output.subscribe((output) => {
          emit.next(output)
        })

        return () => {
          subscription.unsubscribe()
        }
      })
    }),
  writeTerminal: t.procedure
    .input(
      z.object({
        pid: z.string(),
        data: z.string(),
      }),
    )
    .mutation(({ input }) => {
      const { pid, data } = input

      const process = $processes.getValue()[Number(pid)]
      process.ptyProcess.write(data)
    }),
  stopProcesses: t.procedure
    .input(z.object({ pids: z.array(z.number()) }))
    .mutation(({ input }) => {
      const currentScripts = $processes.getValue()
      input.pids.forEach((pid) => {
        const found = currentScripts[Number(pid)]
        if (!found) {
          throw new Error("Could not find script")
        }
        found.ptyProcess.kill()
      })
    }),
  closeProcesses: t.procedure
    .input(z.object({ pids: z.array(z.number()), force: z.boolean() }))
    .mutation(async ({ input }) => {
      await Promise.all(
        input.pids.map(async (pid) => {
          return closeProcess(pid, input.force)
        }),
      )
    }),
  restartProcesses: t.procedure
    .input(z.object({ pids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      return await Promise.all(
        input.pids.map(async (pid): Promise<number> => {
          const process = $processes.getValue()[Number(pid)]
          if (!process) {
            throw new Error("Could not find script")
          }

          const { packageName, packageFolderPath, scriptName, script } = process

          const newPid = runScript({
            scriptName,
            fullPath: path.join(packageFolderPath, "package.json"),
            packageName,
            script,
          })

          closeProcess(pid, true)

          return newPid
        }),
      )
    }),
  runScripts: t.procedure
    .input(
      z.array(
        z.object({
          scriptName: z.string(),
          script: z.string(),
          packagePath: z.string(),
          packageName: z.string(),
        }),
      ),
    )
    .mutation(({ input }) => {
      input.forEach(({ scriptName, packagePath, packageName, script }) => {
        runScript({ scriptName, fullPath: packagePath, packageName, script })
      })
    }),
  openExternal: t.procedure
    .input(
      z.object({
        url: z.string(),
      }),
    )
    .mutation(({ input }) => {
      shell.openExternal(input.url)
    }),

  processes: t.procedure.input(z.object({})).subscription(() => {
    return observable<ProcessInfos>((emit) => {
      const $throttledProcesses = $processes
        .pipe(
          tap((processes) => {
            console.log(">>>> processes A:", Object.keys(processes).length)
          }),
        )
        .pipe(
          throttle(() => interval(200), {
            leading: true,
            trailing: true,
          }),
        )

      const subscription = combineLatest([$throttledProcesses, $latestStats])
        .pipe(
          map(([processes, latestStats]): ProcessInfos => {
            return Object.fromEntries(
              Object.values(processes).map((process) => {
                const pid = Number(process.ptyProcess.pid)
                return [
                  pid,
                  {
                    packageName: process.packageName,
                    scriptName: process.scriptName,
                    script: process.script,
                    packageFolderPath: process.packageFolderPath,
                    pid,
                    exitCode: process.exitCode,
                    closed: process.closed,
                    cpu: latestStats[pid]?.cpu,
                    memory: latestStats[pid]?.memory,
                    links: process.links,
                    resultStats: process.resultStats,
                  },
                ]
              }),
            )
          }),
        )
        .subscribe((processes) => {
          console.log(">>>> processes!", Object.keys(processes).length)
          emit.next(processes)
        })

      return () => {
        subscription.unsubscribe()
      }
    })
  }),
  folder: t.procedure.subscription(() => {
    return observable<string | null>((emit) => {
      const subscription = $folder.subscribe((folder) => {
        emit.next(folder)
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }),
  packages: t.procedure.subscription(() => {
    return observable<{
      packages: PackageInfos
      groups: DevRunnerGroups
    }>((emit) => {
      const subscription = $packageJsons.subscribe((packageJsons) => {
        emit.next(packageJsons)
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }),
  selectFolder: t.procedure.input(z.object({})).mutation(() => {
    return (
      dialog
        .showOpenDialog({
          properties: ["openDirectory"],
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((result: any) => {
          const folderPath = result?.filePaths[0]
          if (typeof folderPath === "string") {
            store.set(STORE_FOLDER_KEY, folderPath)
          } else {
            throw new Error("No folder selected")
          }
        })
    )
  }),
})

export type AppRouter = typeof router
