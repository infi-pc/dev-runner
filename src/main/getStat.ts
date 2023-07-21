import type { ProcessStat } from "../renderer/src/lib/types"
import pidusage from "pidusage"
import pidtree from "pidtree"

export async function getStat(pid: number): Promise<ProcessStat & { pid: number }> {
  const tree = await pidtree(pid)
  const stats = await pidusage(tree)

  const combinedStats = Object.values(stats).reduce<ProcessStat>(
    (acc, stat) => {
      return {
        cpu: acc.cpu + stat.cpu,
        memory: acc.memory + stat.memory,
      }
    },
    {
      cpu: 0,
      memory: 0,
    },
  )
  return {
    pid: pid,
    ...combinedStats,
  }
}
