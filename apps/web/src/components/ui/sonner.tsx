"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          // Base toast styling using global colors
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg",
          description: "",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90 group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:transition-colors",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80 group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:transition-colors",

          // Success variant
          success:
            "group-[.toaster]:bg-success/10 group-[.toaster]:text-success group-[.toaster]:border-success/20 group-[.toaster]:shadow-success/10",

          // Error variant
          error:
            "group-[.toaster]:bg-destructive/10 group-[.toaster]:text-destructive group-[.toaster]:border-destructive/20 group-[.toaster]:shadow-destructive/10",

          // Warning variant
          warning:
            "group-[.toaster]:bg-warning/10 group-[.toaster]:text-warning group-[.toaster]:border-warning/20 group-[.toaster]:shadow-warning/10",

          // Info variant
          info: "group-[.toaster]:bg-info/10 group-[.toast]:text-info group-[.toaster]:border-info/20 group-[.toaster]:shadow-info/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
