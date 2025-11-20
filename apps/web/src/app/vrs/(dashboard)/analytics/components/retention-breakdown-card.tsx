"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";

interface RetentionBreakdownItem {
  status: string;
  label: string;
  variant: BadgeProps["variant"];
  count: number;
}

interface RetentionBreakdownCardProps {
  breakdown: RetentionBreakdownItem[];
}

export function RetentionBreakdownCard({
  breakdown,
}: RetentionBreakdownCardProps) {
  const total = breakdown.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle>90-Day Retention Status</CardTitle>
        <CardDescription>
          Breakdown of client retention after 90 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {breakdown.length > 0 ? (
          <div className="space-y-4">
            {breakdown.map((item, index) => {
              const percentage =
                total > 0 ? ((item.count / total) * 100).toFixed(1) : "0";

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.variant}>{item.label}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {item.count} clients
                      </span>
                    </div>
                    <span className="text-sm font-medium">{percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No retention data available yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}

