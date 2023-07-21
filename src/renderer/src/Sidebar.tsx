import { useState } from "react"
import { Button } from "./components/ui/button"
import { HomeIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { ProcessInfos } from "./lib/types"
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Groups, View } from "./Groups"

export function Sidebar({
  pid,
  processes,
  defaultView,
  showScriptsView,
}: {
  pid: string | undefined
  processes: ProcessInfos
  defaultView: View
  showScriptsView: boolean
}) {
  // defaultView currently is only "packages", "scripts" won't appear because Sidebar is loaded always before the conditions happen
  const [view, setView] = useState<View>(defaultView)
  const page = pid ? "process" : "dashboard"

  return (
    <div
      className="flex flex-col px-2 pt-12 pb-2 grow-0 shrink-0 relative"
      style={{
        width: "280px",
        background: "#1a1b24",
      }}
    >
      <div className="text-white flex flex-col min-h-0 overflow-auto pb-14 no-drag">
        <div className="flex flex-col mb-0 gap-1">
          <Link to="/">
            <Button
              variant={page === "dashboard" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <HomeIcon className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          {/* <Link to="/process/all">
          <Button
            variant={pid === "all" ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <Terminal className="mr-2 h-4 w-4" />
            Mixed terminal
          </Button>
        </Link> */}
        </div>
        <Groups pid={pid} processes={processes} view={view}></Groups>
        {/* <h2 className="mb-2 px-4 text-base font-semibold tracking-tight">
          App
        </h2>
        <div className="space-y-1">
          {processes.map((process) => (
            <Link to={`/process/${process.pid}`} key={process.pid}>
              <Button
                variant={pid === String(process.pid) ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                {process.exitCode === null ? (
                  <PlayCircle className="mr-2 h-4 w-4" />
                ) : process.exitCode == 0 ? (
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                )}
                {process.scriptName}
              </Button>
            </Link>
          ))}
        </div> */}
      </div>

      <div className="absolute bottom-4 w-full pr-4 flex justify-center no-drag">
        {showScriptsView ? (
          <Tabs
            value={view}
            onValueChange={(val) => {
              setView(val as View)
            }}
          >
            <TabsList className="h-8">
              <TabsTrigger className="text-xs" value="scripts">
                Scripts
              </TabsTrigger>
              <TabsTrigger className="text-xs" value="packages">
                Packages
              </TabsTrigger>
            </TabsList>
          </Tabs>
        ) : (
          ""
        )}
      </div>
    </div>
  )
}
