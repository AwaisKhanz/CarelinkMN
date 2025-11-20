"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format as formatDate } from "date-fns";
import type { VRSClient } from "@/lib/api";

interface HistoryTabProps {
  client: VRSClient;
}

export function HistoryTab({ client }: HistoryTabProps) {
  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle>Activity History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Created: {formatDate(new Date(client.createdAt), "PPp")}
          </div>
          <div className="text-sm text-muted-foreground">
            Last Updated: {formatDate(new Date(client.updatedAt), "PPp")}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

