"use client"

import { useEffect, useState } from "react"
import { Check, AlertTriangle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastVariant = "success" | "error" | "info"
interface ToastItem { id: number; title: string; description?: string; variant: ToastVariant }

// Emitter em nível de módulo — qualquer código pode chamar showToast().
type Listener = (t: ToastItem) => void
const listeners = new Set<Listener>()
let seq = 0

export function showToast(title: string, opts?: { description?: string; variant?: ToastVariant }) {
  const t: ToastItem = { id: ++seq, title, description: opts?.description, variant: opts?.variant ?? "info" }
  listeners.forEach(l => l(t))
}

const ICON = { success: Check, error: AlertTriangle, info: Info }
const ACCENT: Record<ToastVariant, string> = {
  success: "text-positivo",
  error: "text-negativo",
  info: "text-acao",
}

/**
 * Toaster — container global. Montar uma vez no layout.
 * Aparece no topo-centro, bg papel-1 + pauta, rounded-[14px], 3s.
 */
export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const onToast = (t: ToastItem) => {
      setToasts(prev => [...prev, t])
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3000)
    }
    listeners.add(onToast)
    return () => { listeners.delete(onToast) }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map(t => {
        const Icon = ICON[t.variant]
        return (
          <div key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 max-w-[90vw] w-fit",
              "bg-papel-1 border border-pauta rounded-[14px] shadow-lg shadow-black/30",
              "px-4 py-3 spring-slide-up",
            )}>
            <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", ACCENT[t.variant])} strokeWidth={2.2} />
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-foreground leading-snug">{t.title}</p>
              {t.description && <p className="text-[13px] text-muted-fg mt-0.5">{t.description}</p>}
            </div>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="text-muted-fg hover:text-foreground flex-shrink-0 -mr-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
