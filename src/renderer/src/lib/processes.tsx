import React, { createContext, useContext, useState, ReactNode } from "react"
import { trpcReact } from "../lib/trpc"
import { ProcessInfos } from "../lib/types"

const ProcessContext = createContext<ProcessInfos>({})

interface ProcessProviderProps {
  children: ReactNode
}

export const ProcessProvider: React.FC<ProcessProviderProps> = ({ children }) => {
  const [processes, setProcesses] = useState<ProcessInfos>({})

  trpcReact.processes.useSubscription(
    {},
    {
      onData: (data) => {
        setProcesses(data)
      },
    },
  )

  return <ProcessContext.Provider value={processes}>{children}</ProcessContext.Provider>
}

export const useProcesses = (): ProcessInfos => {
  const context = useContext(ProcessContext)
  if (!context) {
    throw new Error("useProcesses must be used within a ProcessProvider")
  }
  return context
}
