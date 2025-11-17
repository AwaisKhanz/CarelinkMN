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
import { Package, Users, Clock, CheckCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { VendorGuard } from "@/components/auth/route-guard";
import { VendorOnboardingGuard } from "@/components/auth/role-onboarding-guard";
import { RequirePermission } from "@/components/auth/require-permission";
import { VENDOR_CAPABILITIES } from "@/lib/permissions/capabilities";

function VendorDashboardContent() {
  const { user } = useAuth();

  return (
    <DashboardLayout
      title="Vendor Dashboard"
      description={`Welcome back, ${user?.firstName} ${user?.lastName}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Services
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+1 this week</p>
          </CardContent>
        </Card>
        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">Active partnerships</p>
          </CardContent>
        </Card>
        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Orders
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              3 urgent, 5 standard
            </p>
          </CardContent>
        </Card>
        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Completed orders</p>
          </CardContent>
        </Card>
      </div>

      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common vendor tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="healthcare" className="w-full justify-start">
            <Package className="mr-2 h-4 w-4" />
            Manage Services
          </Button>
          <Button
            variant="healthcareSecondary"
            className="w-full justify-start"
          >
            <Users className="mr-2 h-4 w-4" />
            View Client Orders
          </Button>
          <Button
            variant="healthcareSecondary"
            className="w-full justify-start"
          >
            <Clock className="mr-2 h-4 w-4" />
            Process Pending Orders
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

export default function VendorDashboard() {
  return (
    <VendorGuard>
      <VendorOnboardingGuard>
        <RequirePermission
          permission={VENDOR_CAPABILITIES.DASHBOARD_VIEW}
          title="Access Restricted"
          description="You don't have permission to view the vendor dashboard."
        >
          <VendorDashboardContent />
        </RequirePermission>
      </VendorOnboardingGuard>
    </VendorGuard>
  );
}
