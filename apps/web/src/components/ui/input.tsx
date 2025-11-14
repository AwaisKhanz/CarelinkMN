import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex h-9 w-full rounded-md border px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "border-input bg-transparent",
        // Healthcare-specific variants
        healthcare: "border-primary/20 bg-primary/5 focus-visible:ring-primary",
        healthcareSuccess:
          "border-success/20 bg-success/5 focus-visible:ring-success",
        healthcareWarning:
          "border-warning/20 bg-warning/5 focus-visible:ring-warning",
        healthcareError:
          "border-destructive/20 bg-destructive/5 focus-visible:ring-destructive",
        healthcareInfo: "border-info/20 bg-info/5 focus-visible:ring-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
