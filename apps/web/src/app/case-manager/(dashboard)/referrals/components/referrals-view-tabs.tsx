"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, LayoutGrid, List } from "lucide-react";
import { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReferralsViewTabsProps {
  totalReferrals: number;
  onExportCSV: () => void;
  canExport: boolean;
  isExporting?: boolean;
  tableView: ReactNode;
  kanbanView: ReactNode;
  hasExportPermission?: boolean;
}

export function ReferralsViewTabs({
  totalReferrals,
  onExportCSV,
  canExport,
  isExporting = false,
  tableView,
  kanbanView,
  hasExportPermission = true,
}: ReferralsViewTabsProps) {
  return (
    <Tabs defaultValue="table" className="space-y-4">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="table">
            <List className="h-4 w-4 mr-2" />
            List View
          </TabsTrigger>
          <TabsTrigger value="kanban">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Kanban Board
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
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

      <TabsContent value="table" className="space-y-4">
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Referrals List</CardTitle>
            <CardDescription>
              {totalReferrals} referral{totalReferrals !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tableView}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="kanban" className="space-y-4">
        {kanbanView}
      </TabsContent>
    </Tabs>
  );
}
