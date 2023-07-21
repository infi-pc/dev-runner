import { useEffect, useRef } from "react"
import { trpcReact } from "./lib/trpc"
import { useNavigate, useParams } from "react-router-dom"
import { Terminal } from "xterm"
import { FitAddon } from "xterm-addon-fit"
import "xterm/css/xterm.css"
import { WebLinksAddon } from "xterm-addon-web-links"
import { WebglAddon } from "xterm-addon-webgl"
import { Play, Power, RefreshCcw, X } from "lucide-react"
import { Button } from "./components/ui/button"
import { useProcesses } from "./lib/processes"

export function Process() {
  const { pid } = useParams()

  const processes = useProcesses()
  const process = processes[Number(pid)]

  const kill = trpcReact.stopProcesses.useMutation()
  const close = trpcReact.closeProcesses.useMutation()

  const restart = trpcReact.restartProcesses.useMutation({
    onSuccess: (newPids) => {
      const first = newPids[0]
      if (first) {
        navigate(`/process/${first}`)
      }
    },
  })

  const navigate = useNavigate()

  if (!process) {
    ;<div>Process not found.</div>
  }
  return (
    <div className="flex flex-col w-full h-full gap-2 drag">
      <div className="flex justify-between shrink-0">
        <div className="flex flex-col no-drag">
          <h1 className="text-xl font-bold leading-none">
            {process.scriptName}{" "}
            <span className="text-slate-500 font-normal">{process.packageName}</span>
          </h1>
          <div className="text-slate-400 text-xs font-mono">{process.script}</div>
        </div>
        <div className="flex no-drag">
          {pid !== "all" && (
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  restart.mutate({ pids: [Number(pid)] })
                }}
              >
                {process.exitCode === null ? (
                  <RefreshCcw className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              {process.exitCode === null ? (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    kill.mutate({ pids: [Number(pid)] })
                  }}
                >
                  <Power className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    navigate("/")
                    close.mutate({ pids: [Number(pid)], force: false })
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <TerminalView pid={pid as string} key={pid} />
    </div>
  )
}

function TerminalView({ pid }: { pid: string }) {
  const terminalRef = useRef<HTMLDivElement | null>(null)
  const terminal = useRef<Terminal | null>(null)
  const fitAddon = useRef<FitAddon | null>(null)

  trpcReact.terminal.useSubscription(
    { pid: pid as string },
    {
      onData: (data) => {
        console.log("data on client", data)
        if (data) {
          terminal.current!.write(data)
        }
      },
    },
  )

  const write = trpcReact.writeTerminal.useMutation()

  const openExternal = trpcReact.openExternal.useMutation()

  useEffect(() => {
    terminal.current = new Terminal({
      cursorStyle: "bar",
      cursorBlink: true,
      fontFamily: '"Menlo", "DejaVu Sans Mono", Consolas, "Lucida Console", monospace',
      fontSize: 12,
      lineHeight: 1.2,
      letterSpacing: 0,
      theme: {
        foreground: "#F8F8F2",
        background: "#282A36",
        cursor: "#F8F8F2",
        cursorAccent: "#282A36",
        // selection: "rgba(248, 248, 242, 0.3)",
        black: "#000000",
        red: "#FF5555",
        brightRed: "#FF6E67",
        green: "#50FA7B",
        brightGreen: "#5AF78E",
        yellow: "#F1FA8C",
        brightYellow: "#F4F99D",
        blue: "#BD93F9",
        brightBlue: "#CAA9FA",
        magenta: "#FF79C6",
        brightMagenta: "#FF92D0",
        cyan: "#8BE9FD",
        brightCyan: "#9AEDFE",
        white: "#BFBFBF",
        brightWhite: "#E6E6E6",
      },
      scrollback: 1000,
      allowTransparency: false,
    })

    fitAddon.current = new FitAddon()
    terminal.current.loadAddon(fitAddon.current)

    terminal.current.loadAddon(
      new WebLinksAddon((_, url) => {
        openExternal.mutate({ url })
      }),
    )

    // const searchAddon = new SearchAddon();
    // terminal.current.loadAddon(searchAddon);

    // Attach the terminal to the DOM
    terminal.current.open(terminalRef.current!)

    // Fit the terminal to its container
    fitAddon.current.fit()

    terminal.current.loadAddon(new WebglAddon())

    terminal.current.onData((data) => {
      write.mutate({ pid: pid as string, data })
    })
    // Optionally handle window resize
    const handleResize = () => fitAddon.current!.fit()
    window.addEventListener("resize", handleResize)

    terminal.current.focus()

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [pid])

  return <div ref={terminalRef} className="grow no-drag"></div>
}
