import * as React from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert } from "@/components/ui/alert"

function InlineError({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Alert>) {
  return (
    <Alert
      variant="nd-error"
      className={cn("mb-6 flex items-center gap-3 p-4", className)}
      {...props}
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{children}</span>
    </Alert>
  )
}

export { InlineError }
