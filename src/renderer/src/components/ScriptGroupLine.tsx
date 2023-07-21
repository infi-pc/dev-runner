import { useState } from "react"
import { trpcReact } from "../lib/trpc"
import { Button } from "../components/ui/button"
import { ChevronDown, Play } from "lucide-react"

export function ScriptGroupLine(props: {
  scriptName: string
  list: {
    packageName: string
    script: string
    packagePath: string
  }[]
}) {
  const runScripts = trpcReact.runScripts.useMutation()

  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`${expanded ? `bg-[#353641]` : "hover:bg-[#353641]"} rounded-lg p-1`}>
      <div
        className="flex items-center cursor-pointer gap-2"
        onClick={() => {
          setExpanded(!expanded)
        }}
      >
        <ChevronDown className="h-4 w-4 ml-2" />
        <div className="flex justify-between items-center grow">
          <div>
            <span className="text-bold">{props.scriptName}</span>
            <span className="text-slate-500"> in {props.list.length} packages</span>
          </div>

          <Button
            variant="ghost"
            size={"sm"}
            onClick={(e) => {
              e.stopPropagation()
              runScripts.mutate(
                props.list.map((item) => {
                  return {
                    packagePath: item.packagePath,
                    scriptName: props.scriptName,
                    packageName: item.packageName,
                    script: item.script,
                  }
                }),
              )
            }}
          >
            <Play className="mr-2 h-4 w-4" /> Run All
          </Button>
        </div>
      </div>
      {expanded ? (
        <div>
          <div className="flex flex-col px-3 gap-0.5">
            {props.list.map((script, i) => {
              return (
                <div key={i} className="flex justify-between gap-2 items-center">
                  <div className="truncate shrink">{script.packageName} </div>
                  <div className="flex text-slate-400 text-sm shrink items-center gap-2">
                    <span className="truncate">{script.script}</span>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        runScripts.mutate([
                          {
                            packageName: script.packageName,
                            packagePath: script.packagePath,
                            scriptName: props.scriptName,
                            script: script.script,
                          },
                        ])
                      }}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
