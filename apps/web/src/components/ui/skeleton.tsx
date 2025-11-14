import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const skeletonVariants = cva(
  "animate-pulse rounded-md",
  {
    variants: {
      variant: {
        default: "bg-muted",
        // Healthcare-specific variants
        healthcare: "bg-primary/10",
        healthcareSuccess: "bg-success/10",
        healthcareWarning: "bg-warning/10",
        healthcareError: "bg-destructive/10",
        healthcareInfo: "bg-info/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({
  className,
  variant,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Skeleton, skeletonVariants }
