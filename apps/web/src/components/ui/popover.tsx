"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const popoverContentVariants = cva(
  "z-50 w-72 rounded-md border p-4 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
  {
    variants: {
      variant: {
        default: "bg-popover text-popover-foreground",
        // Healthcare-specific variants
        healthcare: "bg-background text-foreground border-primary/20",
        healthcareSuccess: "bg-background text-foreground border-success/20",
        healthcareWarning: "bg-background text-foreground border-warning/20",
        healthcareError: "bg-background text-foreground border-destructive/20",
        healthcareInfo: "bg-background text-foreground border-info/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

export interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>,
    VariantProps<typeof popoverContentVariants> {}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ className, align = "center", sideOffset = 4, variant, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(popoverContentVariants({ variant }), className)}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  popoverContentVariants,
};
