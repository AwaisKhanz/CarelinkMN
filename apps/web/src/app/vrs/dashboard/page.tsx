"use client";

import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FileText, Clock, CheckCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { VRSGuard } from "@/components/auth/route-guard";
import { RequirePermission } from "@/components/auth/require-permission";
import { VRS_CAPABILITIES } from "@/lib/permissions/capabilities";

function VRSDashboardContent() {
  const { user } = useAuth();

  return (
    <DashboardLayout
      title="VRS Specialist Dashboard"
      description={`Welcome back, ${user?.firstName} ${user?.lastName}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34</div>
            <p className="text-xs text-muted-foreground">+2 this week</p>
          </CardContent>
        </Card>
        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67</div>
            <p className="text-xs text-muted-foreground">Under your care</p>
          </CardContent>
        </Card>
        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Reviews
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">
              2 urgent, 4 standard
            </p>
          </CardContent>
        </Card>
        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">Completed reviews</p>
          </CardContent>
        </Card>
      </div>

      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common VRS specialist tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="healthcare" className="w-full justify-start">
            <FileText className="mr-2 h-4 w-4" />
            Review New Cases
          </Button>
          <Button
            variant="healthcareSecondary"
            className="w-full justify-start"
          >
            <Users className="mr-2 h-4 w-4" />
            Manage Client Cases
          </Button>
          <Button
            variant="healthcareSecondary"
            className="w-full justify-start"
          >
            <Clock className="mr-2 h-4 w-4" />
            Schedule Reviews
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

export default function VRSDashboard() {
  return (
    <VRSGuard>
      <RequirePermission
        permission={VRS_CAPABILITIES.DASHBOARD_VIEW}
        title="Access Restricted"
        description="You don't have permission to view the VRS dashboard."
      >
        <VRSDashboardContent />
      </RequirePermission>
    </VRSGuard>
  );
}
