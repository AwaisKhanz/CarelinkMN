"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const separatorVariants = cva("shrink-0", {
  variants: {
    variant: {
      default: "bg-border",
      // Healthcare-specific variants
      healthcare: "bg-primary/20",
      healthcareSuccess: "bg-success/20",
      healthcareWarning: "bg-warning/20",
      healthcareError: "bg-destructive/20",
      healthcareInfo: "bg-info/20",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>,
    VariantProps<typeof separatorVariants> {}

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(
  (
    {
      className,
      orientation = "horizontal",
      decorative = true,
      variant,
      ...props
    },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        separatorVariants({ variant }),
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator, separatorVariants };
