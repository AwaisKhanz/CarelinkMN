import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const breadcrumbVariants = cva(
  "flex flex-wrap items-center gap-1.5 break-words text-sm sm:gap-2.5",
  {
    variants: {
      variant: {
        default: "text-muted-foreground",
        // Healthcare-specific variants
        healthcare: "text-primary",
        healthcareSuccess: "text-success",
        healthcareWarning: "text-warning",
        healthcareError: "text-destructive",
        healthcareInfo: "text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const breadcrumbLinkVariants = cva("transition-colors", {
  variants: {
    variant: {
      default: "hover:text-foreground",
      // Healthcare-specific variants
      healthcare: "hover:text-primary/80",
      healthcareSuccess: "hover:text-success/80",
      healthcareWarning: "hover:text-warning/80",
      healthcareError: "hover:text-destructive/80",
      healthcareInfo: "hover:text-info/80",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode;
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />);
Breadcrumb.displayName = "Breadcrumb";

export interface BreadcrumbListProps
  extends React.ComponentPropsWithoutRef<"ol">,
    VariantProps<typeof breadcrumbVariants> {}

const BreadcrumbList = React.forwardRef<HTMLOListElement, BreadcrumbListProps>(
  ({ className, variant, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn(breadcrumbVariants({ variant }), className)}
      {...props}
    />
  )
);
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
));
BreadcrumbItem.displayName = "BreadcrumbItem";

export interface BreadcrumbLinkProps
  extends React.ComponentPropsWithoutRef<"a">,
    VariantProps<typeof breadcrumbLinkVariants> {
  asChild?: boolean;
}

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ asChild, className, variant, ...props }, ref) => {
    const Comp = asChild ? Slot : "a";

    return (
      <Comp
        ref={ref}
        className={cn(breadcrumbLinkVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-foreground", className)}
    {...props}
  />
));
BreadcrumbPage.displayName = "BreadcrumbPage";

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:w-3.5 [&>svg]:h-3.5", className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
);
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  breadcrumbVariants,
  breadcrumbLinkVariants,
};
