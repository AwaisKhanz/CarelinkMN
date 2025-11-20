"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminLoadingStateProps {
  message?: string;
  fullHeight?: boolean;
}

export function AdminLoadingState({
  message = "Loading...",
  fullHeight = false,
}: AdminLoadingStateProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullHeight ? "min-h-[60vh]" : "py-12"
      )}
    >
      <Card variant="healthcare" className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

