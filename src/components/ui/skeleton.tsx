import { cn } from "@/lib/utils"

/**
 * Skeleton — placeholder de carregamento (padrão Control.Deal).
 * bg branco translúcido com shimmer; NÃO usar spinner ou "Carregando...".
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-2xl bg-white/[0.06]", className)}
      {...props}
    />
  )
}
