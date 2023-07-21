import { Button } from "./components/ui/button"
import { AlertCircle, CheckCircle, Circle, ExternalLink, Power, X } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { trpcReact } from "./lib/trpc"
import { nonNullable } from "./lib/nonNullable"
import { ProcessInfo, ProcessInfos } from "./lib/types"

export type View = "scripts" | "packages"

export function Groups({
  pid,
  processes,
  view,
}: {
  pid: string | undefined
  processes: ProcessInfos
  view: View
}) {
  const kill = trpcReact.stopProcesses.useMutation()
  // const rerun = trpcReact.rerunProcesses.useMutation()
  const close = trpcReact.closeProcesses.useMutation()
  // const restart = trpcReact.restartProcesses.useMutation()
  const openExternal = trpcReact.openExternal.useMutation()

  const grouped: {
    [categoryTitle: string]: {
      [itemTitle: string]: ProcessInfo[]
    }
  } = {}

  if (view === "packages") {
    Object.values(processes).forEach((process) => {
      if (process.closed) {
        return
      }
      if (!grouped[process.packageName]) {
        grouped[process.packageName] = {}
      }
      if (!grouped[process.packageName][process.scriptName]) {
        grouped[process.packageName][process.scriptName] = []
      }
      grouped[process.packageName][process.scriptName].push(process)
    })
  } else {
    Object.values(processes).forEach((process) => {
      if (process.closed) {
        return
      }
      if (!grouped[process.scriptName]) {
        grouped[process.scriptName] = {}
      }
      if (!grouped[process.scriptName][process.packageName]) {
        grouped[process.scriptName][process.packageName] = []
      }
      grouped[process.scriptName][process.packageName].push(process)
    })
  }

  const navigate = useNavigate()

  return (
    <div className="divide-y divide-slate-800">
      {Object.entries(grouped).map(([title, category]) => {
        return (
          <div key={title} className="pb-1 pt-1">
            <div className="mb-1 mt-1.5  flex justify-between items-center">
              <h2 className="px-3 text-xs font-semibold truncate text-slate-400">{title}</h2>
              <div className="shrink-0">
                {/* <Button
                     variant="ghost"
                     size="small-icon"
                     className="hover:text-green-500 text-slate-300"
                     onClick={() => {
                       rerun.mutate({
                         pids: Object.values(category).map((p) => p.pid),
                       });
                     }}
                    >
                     <RefreshCcw className="h-3 w-3 " />
                    </Button> */}
                <Button
                  variant="ghost"
                  size="small-icon"
                  className="hover:text-red-500 text-slate-300"
                  onClick={() => {
                    kill.mutate({
                      pids: Object.values(category).flatMap((p) => {
                        return p.map((p) => p.pid)
                      }),
                    })
                  }}
                >
                  <Power className="h-3 w-3 " />
                </Button>
                <Button
                  variant="ghost"
                  size="small-icon"
                  className="hover:text-red-500 text-slate-300"
                  onClick={() => {
                    navigate("/")
                    close.mutate({
                      pids: Object.values(category).flatMap((p) => {
                        return p.map((p) => p.pid)
                      }),
                      force: false,
                    })
                  }}
                >
                  <X className="h-3 w-3 " />
                </Button>
              </div>
            </div>
            {Object.entries(category).map(([title, processes]) => {
              return (
                <div className={processes.length > 1 ? "" : ""} key={title}>
                  {processes
                    .map((process) => {
                      return (
                        <Link to={`/process/${process.pid}`} key={process.pid}>
                          <Button
                            variant={pid === String(process.pid) ? "secondary" : "ghost"}
                            size={"sm"}
                            className="w-full justify-between gap-1"
                          >
                            <div className="flex gap-4 shrink min-w-0">
                              <div className="shrink-0">
                                {process.exitCode === null ? (
                                  process.links.length > 0 ? (
                                    <div
                                      className="text-sky-200 hover:text-sky-500"
                                      role="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        e.preventDefault()

                                        openExternal.mutate({
                                          url: process.links[0],
                                        })
                                      }}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </div>
                                  ) : (
                                    <Circle className="h-4 w-4" />
                                  )
                                ) : process.exitCode == 0 ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                )}
                              </div>

                              <span className="truncate">{title}</span>
                            </div>

                            <div className="flex gap-1 items-end text-xs text-slate-400">
                              {process.cpu != undefined &&
                              process.exitCode === null &&
                              process.cpu ? (
                                <div>{Math.round(process.cpu * 10) / 10}%</div>
                              ) : (
                                ""
                              )}

                              {process.resultStats.errors ? (
                                <div className="text-red-500">{process.resultStats.errors}</div>
                              ) : (
                                ""
                              )}
                              {process.resultStats.warnings ? (
                                <div className="text-yellow-500">
                                  {process.resultStats.warnings}
                                </div>
                              ) : (
                                ""
                              )}
                              {process.resultStats.oks ? (
                                <div className="text-green-500">{process.resultStats.oks}</div>
                              ) : (
                                ""
                              )}

                              {/* {process.memory != undefined ? (
                                      <div>{humanFileSize(process.memory)}</div>
                                      ) : (
                                      ""
                                      )} */}
                              {/* {process.exitCode !== null && (
                                      <div
                                       className="text-slate-200 hover:text-slate-500"
                                       role="button"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         e.preventDefault();
                                          navigate("/");
                                          restart.mutate({
                                           pids: [process.pid],
                                         });
                                       }}
                                      >
                                       <RefreshCcw className="h-4 w-4" />
                                      </div>
                                      )} */}
                              {process.exitCode !== null && (
                                <div
                                  className="text-slate-200 hover:text-slate-500"
                                  role="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    navigate("/")
                                    close.mutate({
                                      pids: [process.pid],
                                      force: false,
                                    })
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          </Button>
                        </Link>
                      )
                    })
                    .filter(nonNullable)}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
