import pty from "node-pty"
import path from "path"
import Store from "electron-store"
import { type Processes, type ProcessStat } from "../renderer/src/lib/types"
import {
  Observable,
  concatMap,
  BehaviorSubject,
  ReplaySubject,
  distinctUntilChanged,
  shareReplay,
} from "rxjs"

import { detectLinks } from "./detectLink"
import {
  ColorBuilder,
  ansiColors,
  removeProblematicControlChars,
} from "../renderer/src/lib/ansiChars"
import { getStat } from "./getStat"
import { findPackages } from "./findPackages"
import { analyzePackages } from "./analyzePackages"
import { detectStats } from "./detectStats"

export const STORE_FOLDER_KEY = "folder-path"

const colorBuilder = new ColorBuilder()
export const store = new Store()

export const $processes = new BehaviorSubject<Processes>({})

export const $terminalOutputs: Record<number, ReplaySubject<string>> = {}
export const $stats: Record<number, ReplaySubject<ProcessStat>> = {}
export const $latestStats = new BehaviorSubject<Record<number, ProcessStat>>({})
export const $sharedTerminalOutput = new ReplaySubject<string>(5000)

export async function getAllStatsIteration() {
  const processes = $processes.getValue()
  const statsPromises = Object.values(processes).map((process) => {
    return getStat(process.ptyProcess.pid)
  })
  await Promise.allSettled(statsPromises)
    .then((results) => {
      const newLatestsStats = {} as Record<number, ProcessStat>
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          const stat = result.value
          if (!$stats[stat.pid]) {
            const $stat = new ReplaySubject<ProcessStat>(1000)
            $stats[stat.pid] = $stat
          }

          $stats[stat.pid].next(stat)

          newLatestsStats[stat.pid] = stat
        }
      })
      $latestStats.next({ ...$latestStats.getValue(), ...newLatestsStats })
    })
    .catch((err) => {
      console.error(err)
    })

  setTimeout(() => {
    getAllStatsIteration()
  }, 1000)
}
getAllStatsIteration()

export function runScript({
  scriptName,
  fullPath,
  packageName,
  script,
}: {
  scriptName: string
  fullPath: string
  packageName: string
  script: string
}) {
  const folderPath = path.dirname(fullPath)

  const env = {
    ...process.env,
    // PATH: `/usr/local/bin/:${folderPath}/node_modules/.bin:${process.env.PATH}`,
    PATH: `/usr/local/bin/:${process.env.PATH}`,
  }

  const ptyProcess = pty.spawn("npm", ["run", scriptName], {
    name: "xterm-256color",
    cols: 80,
    rows: 30,
    cwd: folderPath,
    env: env,
  })

  const pid = ptyProcess.pid

  const $terminalOutput = new ReplaySubject<string>(1000)

  const processDataSubscription = ptyProcess.onData(function (data) {
    $terminalOutput.next(data)
  })

  $terminalOutputs[pid] = $terminalOutput

  const currentScripts = $processes.getValue()

  const color = colorBuilder.next()
  $processes.next({
    ...currentScripts,
    [pid]: {
      scriptName: scriptName,
      script: script,
      packageName,
      packageFolderPath: folderPath,
      ptyProcess,
      exitCode: null,
      closed: false,
      links: [],
      color,
      resultStats: {
        errors: undefined,
        warnings: undefined,
        oks: undefined,
      },
    },
  })

  const terminalSubscription = $terminalOutput.subscribe((data) => {
    const links = detectLinks(data)
    if (links.length) {
      const processes = $processes.getValue()
      const process = processes[pid]
      if (!process) {
        throw new Error("Could not find process")
      }
      const newProcess = {
        ...process,
        links: [...process.links, ...links],
      }
      const newProcesses = { ...processes, [pid]: newProcess }
      $processes.next(newProcesses)
    }

    const stats = detectStats(data)
    console.log({ stats })
    if (stats.errors != undefined || stats.warnings != undefined || stats.oks != undefined) {
      console.log("ok")
      const processes = $processes.getValue()
      const process = processes[pid]
      if (!process) {
        throw new Error("Could not find process")
      }
      const newProcess = {
        ...process,
        resultStats: {
          ...process.resultStats,
          ...stats,
        },
      }
      console.log({ newProces: newProcess })
      const newProcesses = { ...processes, [pid]: newProcess }
      $processes.next(newProcesses)
    }

    const cleanOutput = removeProblematicControlChars(data)

    $sharedTerminalOutput.next(
      `\r\n${ansiColors[color]}${packageName}${ansiColors.reset} |> ${cleanOutput}`,
    )
  })

  ptyProcess.onExit((res) => {
    processDataSubscription.dispose()

    const currentScripts = $processes.getValue()

    terminalSubscription.unsubscribe()

    const found = currentScripts[pid]
    if (!found) {
      throw new Error("Could not find script")
    }
    const newProcess = {
      ...found,
      exitCode: res.exitCode,
    }

    const newScripts = { ...currentScripts, [pid]: newProcess }
    $processes.next(newScripts)

    console.error(res)
    $terminalOutput.next(`\r\nProcess exited with code ${res.exitCode}\r\n`)
    $terminalOutput.complete()
  })

  return pid
}

export const $folder = new Observable<string | null>((subscriber) => {
  const initialFolderPath = (store.get(STORE_FOLDER_KEY) as string) || null
  store.onDidChange(STORE_FOLDER_KEY, (folderPath) => {
    if (typeof folderPath === "string") {
      subscriber.next(folderPath)
    }
  })

  subscriber.next(initialFolderPath)
}).pipe(distinctUntilChanged())

export const $packageJsons = $folder.pipe(
  concatMap(async (folderPath) => {
    if (!folderPath) {
      return {
        packages: [],
        groups: {},
      }
    }

    const found = await findPackages(folderPath)

    return await analyzePackages(found, folderPath)
  }),
  shareReplay(1),
)
