import "./index.css"
import { Outlet, useParams } from "react-router-dom"
import { useProcesses } from "./lib/processes"
import { Sidebar } from "./Sidebar"

export function Layout() {
  const processes = useProcesses()

  console.log("processes", processes)
  const { pid } = useParams<{ pid: string }>()

  const packagesSet = new Set<string>()
  Object.values(processes).forEach((process) => {
    if (process.closed) {
      return
    }
    packagesSet.add(process.packageName)
  })

  const scriptNamesMap = new Map<string, number>()
  Object.values(processes).forEach((process) => {
    if (process.closed) {
      return
    }
    if (!scriptNamesMap.has(process.scriptName)) {
      scriptNamesMap.set(process.scriptName, 0)
    }
    scriptNamesMap.set(process.scriptName, scriptNamesMap.get(process.scriptName)! + 1)
  })

  const hasMoreThanOnePackages = packagesSet.size > 1
  const hasMoreThanOneScriptWithTheSameName = Array.from(scriptNamesMap.values()).some(
    (count) => count > 1,
  )

  console.log({
    hasOneOrMorePackages: hasMoreThanOnePackages,
    hasMoreThanOneScriptWithTheSameName,
  })
  return (
    <div className="w-screen h-screen flex">
      {/* {data.text} */}
      {/* <pre
        dangerouslySetInnerHTML={{ __html: consoleQuery.data?.text || "" }}
      ></pre> */}
      <Sidebar
        pid={pid}
        processes={processes}
        defaultView={
          hasMoreThanOnePackages && hasMoreThanOneScriptWithTheSameName ? "scripts" : "packages"
        }
        showScriptsView={hasMoreThanOnePackages}
      />
      <div className="flex-grow overflow-auto m-4 no-drag">
        <Outlet />
      </div>
    </div>
  )
}
