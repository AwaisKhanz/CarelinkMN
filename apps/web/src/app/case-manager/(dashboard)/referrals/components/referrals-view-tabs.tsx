"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, LayoutGrid, Download, Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface ReferralsViewTabsProps {
  viewMode: "table" | "kanban";
  onViewModeChange: (mode: "table" | "kanban") => void;
  totalReferrals: number;
  onExportCSV: () => void;
  canExport: boolean;
  isExporting?: boolean;
  tableView: ReactNode;
  kanbanView: ReactNode;
  hasExportPermission?: boolean;
}

export function ReferralsViewTabs({
  viewMode,
  onViewModeChange,
  totalReferrals,
  onExportCSV,
  canExport,
  isExporting = false,
  tableView,
  kanbanView,
  hasExportPermission = true,
}: ReferralsViewTabsProps) {
  return (
    <Card variant="healthcare">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Referrals</CardTitle>
            <CardDescription>
              {totalReferrals} referral{totalReferrals !== 1 ? "s" : ""} found
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as "table" | "kanban")}>
              <TabsList>
                <TabsTrigger value="table">
                  <Table className="h-4 w-4 mr-2" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="kanban">
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Pipeline
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {hasExportPermission && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportCSV}
                disabled={!canExport || isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as "table" | "kanban")}>
          <TabsContent value="table" className="mt-0">
            {tableView}
          </TabsContent>
          <TabsContent value="kanban" className="mt-0">
            {kanbanView}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


