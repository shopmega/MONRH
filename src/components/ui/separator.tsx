import * as React from "react"

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => {
    const baseClasses = orientation === "horizontal" 
      ? "h-px w-full border-t border-gray-200" 
      : "h-full w-px border-l border-gray-200"
    
    return (
      <div
        ref={ref}
        className={`${baseClasses} ${className || ""}`}
        {...props}
      />
    )
  }
)
Separator.displayName = "Separator"

export { Separator }
