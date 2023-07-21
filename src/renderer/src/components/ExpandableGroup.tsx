import { useState } from "react"
import { DevRunnerGroupLine } from "../lib/types"
import { ChevronDown, Play } from "lucide-react"
import { Button } from "../components/ui/button"
import { trpcReact } from "../lib/trpc"

export function ExpandableGroup(props: { name: string; group: DevRunnerGroupLine[] }) {
  const [expanded, setExpanded] = useState(false)
  const runScripts = trpcReact.runScripts.useMutation()

  const scriptCount = props.group.reduce<number>((acc, item) => {
    return acc + Object.keys(item.scripts).length
  }, 0)
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
            <span className="text-bold">{props.name}</span>
            <span className="text-slate-500"> with {scriptCount} scripts</span>
          </div>

          <Button
            variant="ghost"
            size={"sm"}
            onClick={(e) => {
              e.stopPropagation()
              runScripts.mutate(
                props.group.flatMap((line) => {
                  return Object.entries(line.scripts).map(([scriptName, script]) => {
                    return {
                      packagePath: line.fullPath,
                      scriptName: scriptName,
                      packageName: line.packageName,
                      script: script,
                    }
                  })
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
          <div className="flex flex-col px-3 gap-2 py-2">
            {props.group.map((groupLine, i) => {
              return (
                <div key={i}>
                  <div className="text-slate-300 text-sm">{groupLine.packageName}</div>
                  <div className="mb-2">
                    {Object.entries(groupLine.scripts).map(([scriptName, script]) => {
                      return (
                        <div className="flex justify-between gap-2 items-center" key={scriptName}>
                          <div className="truncate shrink">{scriptName}</div>
                          <div className="flex text-slate-400 text-sm shrink items-center gap-2">
                            <span className="truncate">{script}</span>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                runScripts.mutate([
                                  {
                                    packageName: groupLine.packageName,
                                    packagePath: groupLine.fullPath,
                                    scriptName: scriptName,
                                    script: script,
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
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )

  // return (
  //   <div>
  //     <h1 className="text-bold text-slate-300 my-1">{props.name}</h1>
  //     {props.group.map((line) => {
  //       return (
  //         <div>
  //           <div>
  //             {Object.entries(line.scripts).map(([scriptName]) => {
  //               return (
  //                 <div className="flex gap-2">
  //                   {line.packageName} <ChevronRight />
  //                   {scriptName}
  //                 </div>
  //               );
  //             })}
  //           </div>
  //         </div>
  //       );
  //     })}
  //   </div>
  // );
}
