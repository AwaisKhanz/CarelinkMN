"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, FileText } from "lucide-react";

interface UrgentCasesStatsProps {
  urgent: number;
  high: number;
  overdue: number;
  total: number;
}

export function UrgentCasesStats({
  urgent,
  high,
  overdue,
  total,
}: UrgentCasesStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card variant="healthcare" className="border-warning/50 bg-warning/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Urgent</CardTitle>
          <AlertTriangle className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{urgent}</div>
          <p className="text-xs text-muted-foreground mt-1">
            &lt; 48 hours
          </p>
        </CardContent>
      </Card>

      <Card variant="healthcare" className="border-primary/50 bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          <Clock className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{high}</div>
          <p className="text-xs text-muted-foreground mt-1">
            &lt; 1 week
          </p>
        </CardContent>
      </Card>

      <Card variant="healthcare" className="border-destructive/50 bg-destructive/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overdue}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Past move date
          </p>
        </CardContent>
      </Card>

      <Card variant="healthcare">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Urgent</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-muted-foreground mt-1">
            All urgent cases
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

