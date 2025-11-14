"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      variant: {
        default: "",
        // Healthcare-specific variants
        healthcare: "ring-2 ring-primary/20",
        healthcareSuccess: "ring-2 ring-success/20",
        healthcareWarning: "ring-2 ring-warning/20",
        healthcareError: "ring-2 ring-destructive/20",
        healthcareInfo: "ring-2 ring-info/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const avatarFallbackVariants = cva(
  "flex h-full w-full items-center justify-center rounded-full",
  {
    variants: {
      variant: {
        default: "bg-muted",
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

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, variant, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(avatarVariants({ variant }), className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

export interface AvatarFallbackProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>,
    VariantProps<typeof avatarFallbackVariants> {}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, variant, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(avatarFallbackVariants({ variant }), className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  avatarVariants,
  avatarFallbackVariants,
};
