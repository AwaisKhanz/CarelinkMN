"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const radioGroupVariants = cva(
  "grid gap-2"
)

const radioGroupItemVariants = cva(
  "aspect-square h-4 w-4 rounded-full border shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-primary text-primary",
        // Healthcare-specific variants
        healthcare: "border-primary text-primary",
        healthcareSuccess: "border-success text-success",
        healthcareWarning: "border-warning text-warning",
        healthcareError: "border-destructive text-destructive",
        healthcareInfo: "border-info text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface RadioGroupProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
    VariantProps<typeof radioGroupVariants> {}

export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
    VariantProps<typeof radioGroupItemVariants> {}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn(radioGroupVariants(), className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, variant, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(radioGroupItemVariants({ variant }), className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className={cn(
          "h-3.5 w-3.5",
          variant === "healthcareSuccess" && "fill-success",
          variant === "healthcareWarning" && "fill-warning",
          variant === "healthcareError" && "fill-destructive",
          variant === "healthcareInfo" && "fill-info",
          (variant === "default" || variant === "healthcare" || !variant) && "fill-primary"
        )} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem, radioGroupVariants, radioGroupItemVariants }
