"use client";

import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface VendorErrorStateProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function VendorErrorState({
  message,
  action,
}: VendorErrorStateProps) {
  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Error
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{message}</p>
        {action && (
          <Button variant="healthcare" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

