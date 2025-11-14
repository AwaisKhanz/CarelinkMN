"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const accordionItemVariants = cva(
  "border-b",
  {
    variants: {
      variant: {
        default: "",
        // Healthcare-specific variants
        healthcare: "border-primary/20",
        healthcareSuccess: "border-success/20",
        healthcareWarning: "border-warning/20",
        healthcareError: "border-destructive/20",
        healthcareInfo: "border-info/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const accordionTriggerVariants = cva(
  "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",
  {
    variants: {
      variant: {
        default: "",
        // Healthcare-specific variants
        healthcare: "hover:bg-primary/5",
        healthcareSuccess: "hover:bg-success/5",
        healthcareWarning: "hover:bg-warning/5",
        healthcareError: "hover:bg-destructive/5",
        healthcareInfo: "hover:bg-info/5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Accordion = AccordionPrimitive.Root

export interface AccordionItemProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>,
    VariantProps<typeof accordionItemVariants> {}

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, variant, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(accordionItemVariants({ variant }), className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

export interface AccordionTriggerProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>,
    VariantProps<typeof accordionTriggerVariants> {}

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ className, children, variant, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(accordionTriggerVariants({ variant }), className)}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent, accordionItemVariants, accordionTriggerVariants }
