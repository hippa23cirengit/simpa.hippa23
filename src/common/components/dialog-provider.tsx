"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"

interface DialogOptions {
  title?: string
  message: string
  type?: "info" | "warning" | "danger" | "success"
  defaultValue?: string
  rawLog?: string
}

interface DialogContextType {
  showAlert: (message: string, title?: string, type?: DialogOptions["type"], rawLog?: string) => Promise<void>
  showConfirm: (message: string, title?: string, type?: DialogOptions["type"]) => Promise<boolean>
  showPrompt: (message: string, title?: string, defaultValue?: string) => Promise<string | null>
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

export const useDialog = () => {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider")
  }
  return context
}

type DialogState = {
  isOpen: boolean
  mode: "alert" | "confirm" | "prompt"
  title: string
  message: string
  type: DialogOptions["type"]
  defaultValue: string
  rawLog?: string
  onResolve: ((value: any) => void) | null
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>({
    isOpen: false,
    mode: "alert",
    title: "",
    message: "",
    type: "info",
    defaultValue: "",
    rawLog: undefined,
    onResolve: null,
  })

  const [promptInput, setPromptInput] = useState("")
  const [showLog, setShowLog] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.isOpen && state.mode === "prompt" && inputRef.current) {
      inputRef.current.focus()
    }
  }, [state.isOpen, state.mode])

  const showAlert = useCallback((message: string, title = "Perhatian", type: DialogOptions["type"] = "info", rawLog?: string) => {
    return new Promise<void>((resolve) => {
      setShowLog(false)
      setState({
        isOpen: true,
        mode: "alert",
        title,
        message,
        type,
        defaultValue: "",
        rawLog,
        onResolve: resolve as any,
      })
    })
  }, [])

  const showConfirm = useCallback((message: string, title = "Konfirmasi", type: DialogOptions["type"] = "warning") => {
    return new Promise<boolean>((resolve) => {
      setState({
        isOpen: true,
        mode: "confirm",
        title,
        message,
        type,
        defaultValue: "",
        onResolve: resolve as any,
      })
    })
  }, [])

  const showPrompt = useCallback((message: string, title = "Masukkan Data", defaultValue = "") => {
    return new Promise<string | null>((resolve) => {
      setPromptInput(defaultValue)
      setState({
        isOpen: true,
        mode: "prompt",
        title,
        message,
        type: "info",
        defaultValue,
        onResolve: resolve as any,
      })
    })
  }, [])

  const handleClose = useCallback((value: any = null) => {
    setState((prev) => {
      if (prev.onResolve) prev.onResolve(value)
      return { ...prev, isOpen: false }
    })
  }, [])

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}

      {state.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transform scale-100 transition-transform duration-200">
            {/* Header */}
            <div className={`px-5 py-4 border-b border-slate-100 flex items-center gap-3 ${
              state.type === 'danger' ? 'bg-rose-50' : 
              state.type === 'warning' ? 'bg-amber-50' : 
              state.type === 'success' ? 'bg-emerald-50' : 'bg-slate-50'
            }`}>
              {state.type === 'danger' && <span className="material-symbols-outlined text-rose-500">error</span>}
              {state.type === 'warning' && <span className="material-symbols-outlined text-amber-500">warning</span>}
              {state.type === 'success' && <span className="material-symbols-outlined text-emerald-500">check_circle</span>}
              {(!state.type || state.type === 'info') && <span className="material-symbols-outlined text-blue-500">info</span>}
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{state.title}</h2>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col gap-4">
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{state.message}</p>
              
              {state.mode === "prompt" && (
                <input
                  ref={inputRef}
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleClose(promptInput)
                    if (e.key === "Escape") handleClose(null)
                  }}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              )}

              {state.rawLog && (
                <div className="mt-2 flex flex-col items-start">
                  <button 
                    onClick={() => setShowLog(!showLog)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 underline decoration-slate-300 underline-offset-2 transition flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {showLog ? "visibility_off" : "visibility"}
                    </span>
                    {showLog ? "Sembunyikan Log Error" : "Tampilkan Log Error"}
                  </button>
                  
                  {showLog && (
                    <div className="mt-3 relative w-full group">
                      <pre className="w-full p-3 bg-slate-800 text-slate-200 rounded-lg text-[10px] font-mono leading-relaxed overflow-x-auto max-h-[150px] overflow-y-auto shadow-inner">
                        {state.rawLog}
                      </pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(state.rawLog || "")
                        }}
                        title="Salin log"
                        className="absolute top-2 right-2 p-1.5 bg-slate-700/80 hover:bg-slate-600 text-slate-300 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer / Actions */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              {state.mode !== "alert" && (
                <button
                  onClick={() => handleClose(state.mode === "prompt" ? null : false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition"
                >
                  Batal
                </button>
              )}
              
              <button
                onClick={() => handleClose(state.mode === "prompt" ? promptInput : true)}
                className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition shadow-sm ${
                  state.type === 'danger' ? 'bg-rose-500 hover:bg-rose-600' :
                  state.type === 'warning' ? 'bg-[#F7A440] hover:bg-[#e09132]' :
                  state.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {state.mode === "alert" ? "OK, Mengerti" : "Lanjutkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}
