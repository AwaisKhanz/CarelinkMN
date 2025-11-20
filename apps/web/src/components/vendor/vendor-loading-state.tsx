"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface VendorLoadingStateProps {
  message?: string;
}

export function VendorLoadingState({
  message = "Loading...",
}: VendorLoadingStateProps) {
  return (
    <Card variant="healthcare">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

