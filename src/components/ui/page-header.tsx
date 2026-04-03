import * as React from "react"
import { cn } from "@/lib/utils"

function PageHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="page-header"
      className={cn("mb-8 border-b-2 border-nd-ink pb-6", className)}
      {...props}
    >
      {children}
    </header>
  )
}

function PageHeaderLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header-label"
      className={cn(
        "flex items-center gap-2 text-nd-accent mb-2",
        className
      )}
      {...props}
    />
  )
}

function PageHeaderTitle({
  className,
  ...props
}: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="page-header-title"
      className={cn(
        "text-3xl font-bold font-serif text-nd-ink uppercase tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function PageHeaderDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="page-header-description"
      className={cn("text-nd-ink-muted mt-2", className)}
      {...props}
    />
  )
}

export { PageHeader, PageHeaderLabel, PageHeaderTitle, PageHeaderDescription }
