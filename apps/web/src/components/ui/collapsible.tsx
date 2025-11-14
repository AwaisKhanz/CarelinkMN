"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const collapsibleContentVariants = cva(
  "overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
  {
    variants: {
      variant: {
        default: "",
        // Healthcare-specific variants
        healthcare: "bg-primary/5 border border-primary/20 rounded-md",
        healthcareSuccess: "bg-success/5 border border-success/20 rounded-md",
        healthcareWarning: "bg-warning/5 border border-warning/20 rounded-md",
        healthcareError: "bg-destructive/5 border border-destructive/20 rounded-md",
        healthcareInfo: "bg-info/5 border border-info/20 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

export interface CollapsibleContentProps
  extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>,
    VariantProps<typeof collapsibleContentVariants> {}

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
  CollapsibleContentProps
>(({ className, variant, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleContent
    ref={ref}
    className={cn(collapsibleContentVariants({ variant }), className)}
    {...props}
  />
))
CollapsibleContent.displayName = CollapsiblePrimitive.CollapsibleContent.displayName

export { Collapsible, CollapsibleTrigger, CollapsibleContent, collapsibleContentVariants }
