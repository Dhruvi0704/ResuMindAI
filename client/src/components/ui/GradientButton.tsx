import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const gradientButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[16px] text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        default:
          "bg-primary-gradient text-white shadow-[0_0_15px_rgba(140,92,246,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border border-primary-solid bg-transparent text-primary-solid hover:bg-primary-solid hover:text-white hover:shadow-[0_0_15px_rgba(140,92,246,0.4)]",
        ghost:
          "bg-transparent text-text-main hover:text-accent-pink hover:bg-glass-bg",
      },
      size: {
        default: "min-h-10 px-6 py-2.5",
        sm: "min-h-8 px-4 text-xs",
        lg: "min-h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(gradientButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
GradientButton.displayName = "GradientButton"

export { GradientButton, gradientButtonVariants }
