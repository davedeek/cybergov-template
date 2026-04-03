import * as React from "react"
import { cn } from "@/lib/utils"

const sizeClasses = {
  sm: "max-w-3xl",
  default: "max-w-4xl",
  lg: "max-w-6xl",
  full: "max-w-none",
} as const

function PageContainer({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: keyof typeof sizeClasses }) {
  return (
    <div
      data-slot="page-container"
      className={cn(
        "p-6 lg:p-8 mx-auto font-sans",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
}

export { PageContainer }
