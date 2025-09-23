import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Enhanced base styles with mobile-first touch accessibility
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 touch-manipulation select-none",
  {
    variants: {
      variant: {
        // Enhanced with better touch feedback
        default: "bg-soccer-green text-white hover:bg-soccer-dark shadow-md hover:shadow-lg active:shadow-sm",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300 shadow-sm hover:shadow-md active:shadow-none",
        outline: "border border-soccer-green text-soccer-green hover:bg-soccer-green hover:text-white shadow-sm hover:shadow-md",
        ghost: "text-soccer-green hover:bg-soccer-green/10 active:bg-soccer-green/20",
        destructive: "bg-red-card text-white hover:bg-red-card/90 shadow-md hover:shadow-lg active:shadow-sm",
      },
      size: {
        // Mobile-optimized minimum 44px touch targets
        default: "h-11 px-4 py-2 min-h-[44px]",
        sm: "h-10 rounded-md px-3 min-h-[40px]",
        lg: "h-12 rounded-md px-8 min-h-[48px]",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px]",
        mobile: "h-12 px-6 py-3 min-h-[48px] text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? "span" : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }