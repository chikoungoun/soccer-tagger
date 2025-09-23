import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  mobileOptimized?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, mobileOptimized = false, ...props }, ref) => {
    // Enhanced mobile keyboard handling
    const getMobileInputProps = () => {
      if (!mobileOptimized) return {};

      const baseProps = {
        autoComplete: 'off',
        autoCorrect: 'off',
        autoCapitalize: 'off',
        spellCheck: false,
      };

      switch (type) {
        case 'email':
          return {
            ...baseProps,
            inputMode: 'email' as const,
            autoComplete: 'email',
          };
        case 'tel':
          return {
            ...baseProps,
            inputMode: 'tel' as const,
            autoComplete: 'tel',
          };
        case 'number':
          return {
            ...baseProps,
            inputMode: 'numeric' as const,
            pattern: '[0-9]*',
          };
        case 'search':
          return {
            ...baseProps,
            inputMode: 'search' as const,
            autoComplete: 'off',
          };
        case 'url':
          return {
            ...baseProps,
            inputMode: 'url' as const,
            autoComplete: 'url',
          };
        case 'password':
          return {
            autoComplete: 'current-password',
            autoCorrect: 'off',
            autoCapitalize: 'off',
            spellCheck: false,
          };
        default:
          return baseProps;
      }
    };

    return (
      <input
        type={type}
        className={cn(
          // Enhanced base styles for mobile
          "flex w-full rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm ring-offset-white dark:ring-offset-gray-800 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soccer-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          // Mobile-specific enhancements
          mobileOptimized ? "h-12 min-h-[48px] text-base sm:text-sm touch-manipulation" : "h-10",
          className
        )}
        ref={ref}
        {...getMobileInputProps()}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }