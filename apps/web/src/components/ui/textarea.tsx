import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex min-h-[60px] w-full rounded-md border px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "border-input bg-transparent",
        // Healthcare-specific variants
        healthcare: "border-primary/20 bg-primary/5 focus-visible:ring-primary",
        healthcareSuccess: "border-success/20 bg-success/5 focus-visible:ring-success",
        healthcareWarning: "border-warning/20 bg-warning/5 focus-visible:ring-warning",
        healthcareError: "border-destructive/20 bg-destructive/5 focus-visible:ring-destructive",
        healthcareInfo: "border-info/20 bg-info/5 focus-visible:ring-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TextareaProps
  extends React.ComponentProps<"textarea">,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
