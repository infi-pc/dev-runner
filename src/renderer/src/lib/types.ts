import { TerminalColor } from "../lib/ansiChars"
import z from "zod"

export const zPackageScripts = z.record(z.string())
export const zPackageJson = z.object({
  name: z.string(),
  scripts: zPackageScripts,
  // don't parse it here, we don't want to fail when loading package.json files
  devRunner: z.unknown().optional(),
})

export const zDevRunnerConfig = z.object({
  expandNestedScripts: z
    .union([
      z.object({
        delimiter: z.string().optional(),
        includeRoots: z.boolean().optional(),
      }),
      z.boolean(),
    ])
    .optional(),
  groups: z.record(
    z.object({
      paths: z.union([z.string(), z.array(z.string())]),
      script: z.union([z.string(), z.array(z.string())]),
    }),
  ),
})

// export const zDevRunnerConfigProcessed = z.object({
//   groups: z.record(
//     z.object({
//       // expandedScript: z.array(z.string()),
//       // expandedFiles: z.array(z.string()),
//       packages: z.array(
//         z.object({ packageName: z.string(), scripts: zPackageScripts })
//       ),
//     })
//   ),
// });

export type Package = z.infer<typeof zPackageJson>
export type Packages = z.infer<typeof zPackageJson>[]
export type PackageInfo = Package & {
  fullPath: string
}
export type PackageInfos = PackageInfo[]

export type ProcessStat = {
  cpu: number
  memory: number
}

type ResultStats = {
  errors: number | undefined
  warnings: number | undefined
  oks: number | undefined
}

export type Process = {
  packageName: string
  scriptName: string
  script: string
  packageFolderPath: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ptyProcess: any
  exitCode: number | null
  closed: boolean
  links: string[]
  color: TerminalColor
  resultStats: ResultStats
}

export type Processes = Record<number, Process>
export type ProcessInfo = {
  packageName: string
  scriptName: string
  script: string
  packageFolderPath: string
  pid: number
  exitCode: number | null
  closed: boolean
  cpu?: number
  memory?: number
  links: string[]
  resultStats: ResultStats
}

export type ProcessInfos = Record<number, ProcessInfo>

export type DevRunnerGroupLine = {
  fullPath: string
  packageName: string
  scripts: Record<string, string>
}

export type DevRunnerGroups = Record<string, DevRunnerGroupLine[]>
