import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const themedBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[rgba(139,92,246,0.15)] text-[#A78BFA] hover:bg-[rgba(139,92,246,0.25)]",
        success:
          "border-transparent bg-[rgba(16,185,129,0.15)] text-[#34D399] hover:bg-[rgba(16,185,129,0.25)] shadow-[0_0_10px_rgba(16,185,129,0.15)]",
        warning:
          "border-transparent bg-[rgba(245,158,11,0.15)] text-[#FBBF24] hover:bg-[rgba(245,158,11,0.25)] shadow-[0_0_10px_rgba(245,158,11,0.15)]",
        danger:
          "border-transparent bg-[rgba(239,68,68,0.15)] text-[#F87171] hover:bg-[rgba(239,68,68,0.25)] shadow-[0_0_10px_rgba(239,68,68,0.15)]",
        outline: "text-text-main border-border-color",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ThemedBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof themedBadgeVariants> {}

function ThemedBadge({ className, variant, ...props }: ThemedBadgeProps) {
  return (
    <div className={cn(themedBadgeVariants({ variant }), className)} {...props} />
  )
}

export { ThemedBadge, themedBadgeVariants }
