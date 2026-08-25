import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground hover:bg-primary/90 spring-press",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 spring-press",
        outline:     "border border-border bg-background/60 hover:bg-accent hover:text-accent-foreground transition-all duration-150 active:scale-[0.97]",
        secondary:   "bg-surface-2 text-secondary-foreground hover:bg-surface-2/70 transition-all duration-150 active:scale-[0.97]",
        ghost:       "hover:bg-accent hover:text-accent-foreground transition-colors duration-150",
        link:        "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm:      "h-9 px-3.5 text-[13px]",
        lg:      "h-12 px-7 text-[15px]",
        icon:    "h-9 w-9",
        xs:      "h-7 px-2.5 text-xs",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
