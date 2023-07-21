import { useState } from "react"

import { ipcLink } from "electron-trpc/renderer"
import superjson from "superjson"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import setupLocatorUI from "@locator/runtime"
import { createHashRouter, RouterProvider } from "react-router-dom"
import { trpcReact } from "./lib/trpc"
import { Dashboard } from "./Dashboard"
import { Layout } from "./Layout"
import { Process } from "./Process"
import { ProcessProvider } from "./lib/processes"

if (process.env.NODE_ENV === "development") {
  setupLocatorUI()
}

const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Dashboard />,
      },
      {
        path: "/process/:pid",
        element: <Process />,
      },
    ],
  },
])

export function App() {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpcReact.createClient({
      links: [ipcLink()],
      transformer: superjson,
    }),
  )

  return (
    <trpcReact.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ProcessProvider>
          <RouterProvider router={router} />
        </ProcessProvider>
      </QueryClientProvider>
    </trpcReact.Provider>
  )
}
