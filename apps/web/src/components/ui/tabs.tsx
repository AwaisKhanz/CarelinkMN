"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const tabsListVariants = cva(
  "inline-flex h-9 items-center justify-center rounded-lg p-1",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        // Healthcare-specific variants
        healthcare: "bg-primary/10 text-primary",
        healthcareSuccess: "bg-success/10 text-success",
        healthcareWarning: "bg-warning/10 text-warning",
        healthcareError: "bg-destructive/10 text-destructive",
        healthcareInfo: "bg-info/10 text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow",
  {
    variants: {
      variant: {
        default:
          "data-[state=active]:bg-background data-[state=active]:text-foreground",
        // Healthcare-specific variants
        healthcare:
          "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
        healthcareSuccess:
          "data-[state=active]:bg-success data-[state=active]:text-success-foreground",
        healthcareWarning:
          "data-[state=active]:bg-warning data-[state=active]:text-warning-foreground",
        healthcareError:
          "data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground",
        healthcareInfo:
          "data-[state=active]:bg-info data-[state=active]:text-info-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Tabs = TabsPrimitive.Root;

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant }), className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant }), className)}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
  tabsTriggerVariants,
};
