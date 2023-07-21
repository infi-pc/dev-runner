import { useState } from "react"
import { trpcReact } from "./lib/trpc"
import { Button } from "./components/ui/button"
import { DevRunnerGroups, PackageInfos } from "./lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Cog, Loader, Play, X } from "lucide-react"
import { ScriptGroupLine } from "./components/ScriptGroupLine"
import { ExpandableGroup } from "./components/ExpandableGroup"
import { SelectFolderCard } from "./components/SelectFolderCard"

function DashboadTabs({
  data,
  setOpenSettings,
}: {
  data: {
    packages: PackageInfos
    groups: DevRunnerGroups
  }
  setOpenSettings: (open: boolean) => void
}) {
  const runScripts = trpcReact.runScripts.useMutation()
  const scripts = data.packages.reduce<{
    [scriptName: string]: {
      packageName: string
      script: string
      packagePath: string
    }[]
  }>((acc, pkg) => {
    Object.entries(pkg.scripts).forEach(([name, script]) => {
      if (!acc[name]) {
        acc[name] = []
      }
      acc[name].push({
        packageName: pkg.name,
        script: script,
        packagePath: pkg.fullPath,
      })
    })
    return acc
  }, {})

  return (
    <Tabs defaultValue={"packages"}>
      <div className="flex justify-between">
        <TabsList className="no-drag">
          {data.groups && Object.keys(data.groups).length ? (
            <TabsTrigger value="groups">Groups</TabsTrigger>
          ) : null}
          {data.packages.length > 1 ? <TabsTrigger value="scripts">Scripts</TabsTrigger> : null}

          <TabsTrigger value="packages">Packages</TabsTrigger>
        </TabsList>
        <Button
          className="no-drag"
          variant="ghost"
          onClick={() => {
            setOpenSettings(true)
          }}
        >
          <Cog />
        </Button>
      </div>

      <TabsContent value="groups" className="no-drag">
        {data.groups && (
          <div>
            {Object.entries(data.groups).map(([name, group]) => {
              return <ExpandableGroup key={name} name={name} group={group}></ExpandableGroup>
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="scripts" className="no-drag">
        {scripts &&
          Object.entries(scripts).map(([scriptName, list]) => {
            return (
              <ScriptGroupLine
                key={scriptName}
                scriptName={scriptName}
                list={list}
              ></ScriptGroupLine>
            )
          })}
      </TabsContent>
      <TabsContent value="packages" className="no-drag">
        <div className="flex flex-col">
          {data.packages.map((pkg, i) => {
            return (
              <div className="flex flex-col mt-2" key={pkg + "-" + i}>
                <h1 className="text-bold text-slate-300 my-1">{pkg.name}</h1>

                <div className="flex flex-col p-4 bg-[#353641] rounded-lg gap-2">
                  {Object.entries(pkg.scripts).map(([scriptName, script]) => {
                    return (
                      <div
                        className="flex justify-between gap-2 items-center text-sm"
                        key={scriptName}
                      >
                        <div className="flex shrink gap-2 items-center">
                          <div className="font-medium">{scriptName}</div>
                          <div className="truncate text-slate-400 ">{script}</div>
                        </div>

                        <div>
                          <Button
                            variant="ghost"
                            size={"icon"}
                            onClick={() => {
                              runScripts.mutate([
                                {
                                  packagePath: pkg.fullPath,
                                  scriptName: scriptName,
                                  packageName: pkg.name,
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
      </TabsContent>
    </Tabs>
  )
}

export function Dashboard() {
  const { mutate } = trpcReact.selectFolder.useMutation()

  const [folder, setFolder] = useState<string | null>(null)
  trpcReact.folder.useSubscription(undefined, {
    onData(data) {
      setFolder(data)
    },
  })

  const [data, setData] = useState<
    | {
        packages: PackageInfos
        groups: DevRunnerGroups
      }
    | undefined
  >(undefined)
  trpcReact.packages.useSubscription(undefined, {
    onData(data) {
      setData(data)
    },
  })

  const [openSettings, setOpenSettings] = useState(false)

  if (!folder) {
    return <SelectFolderCard select={() => mutate({})} folder={folder}></SelectFolderCard>
  }
  if (openSettings) {
    return (
      <div>
        <div className="flex justify-between mb-4 items-center">
          <h1 className="text-lg">Settings</h1>
          <Button
            variant="ghost"
            onClick={() => {
              setOpenSettings(false)
            }}
          >
            <X />
          </Button>
        </div>

        <SelectFolderCard select={() => mutate({})} folder={folder}></SelectFolderCard>
      </div>
    )
  }

  return (
    <div className="drag">
      {data ? (
        <DashboadTabs data={data} setOpenSettings={setOpenSettings}></DashboadTabs>
      ) : (
        <Loader />
      )}

      {/* {JSON.stringify(packages)} */}
    </div>
  )
}
