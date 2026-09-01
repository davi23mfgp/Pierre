import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface SectionCardProps {
  children: ReactNode
  className?: string
  title?: string
  action?: ReactNode
}

/**
 * SectionCard — padrão Control.Deal.
 * bg papel-1, border pauta, rounded-3xl (24px), header opcional
 * com título 15px font-semibold + ação à direita em acao.
 */
export function SectionCard({ children, className, title, action }: SectionCardProps) {
  return (
    <div className={cn("rounded-3xl border border-pauta bg-papel-1 overflow-hidden", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          {title && <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>}
          {action && <div className="text-[13px] text-acao">{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
