import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Base Apple: pill arredondado, sem borda grossa, cor suave
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:     "bg-primary/10 text-primary border border-primary/20",
        secondary:   "bg-papel-2 text-secondary-foreground",
        destructive: "bg-destructive/10 text-destructive border border-destructive/20",
        outline:     "border border-border text-foreground bg-transparent",
        success:     "bg-acao/10 text-emerald-600 dark:text-positivo/80 border border-emerald-500/15",
        warning:     "bg-atencao/10 text-amber-600 dark:text-atencao border border-amber-500/20",
        info:        "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20",
        purple:      "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
