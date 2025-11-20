"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building2,
  FileText,
  Settings,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { RequirePermission } from "@/components/auth/require-permission";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";
import { usePageMetadata } from "../use-page-metadata";
import { AdminStatsGrid } from "@/components/admin";

function AdminDashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();

  useEffect(() => {
    setTitle("Admin Dashboard");
    setDescription(`Welcome back, ${user?.firstName} ${user?.lastName}`);
  }, [setTitle, setDescription, user]);

  // TODO: Replace with actual data fetching
  const stats = useMemo(
    () => [
      {
        label: "Total Users",
        value: "1,234",
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
        description: "+12% from last month",
        trend: { value: "+12%", isPositive: true },
      },
      {
        label: "Organizations",
        value: "89",
        icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
        description: "+3 new this week",
        trend: { value: "+3", isPositive: true },
      },
      {
        label: "Pending Verifications",
        value: "12",
        icon: <Clock className="h-4 w-4 text-muted-foreground" />,
        description: "Requires attention",
      },
      {
        label: "Active Licenses",
        value: "456",
        icon: <ShieldCheck className="h-4 w-4 text-muted-foreground" />,
        description: "94% compliance rate",
      },
    ],
    []
  );

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <AdminStatsGrid stats={stats} columns={4} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="healthcare"
              className="w-full justify-start"
              onClick={() => router.push("/admin/users")}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/admin/organizations")}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Manage Organizations
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/admin/licenses")}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Verify Licenses
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/admin/compliance")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Compliance Monitoring
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/admin/audit-logs")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Audit Logs
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/admin/analytics")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Platform Analytics
            </Button>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Pending Reviews</CardTitle>
            <CardDescription>
              Items requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    12 License Verifications
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pending review
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/admin/licenses?status=PENDING")}
                >
                  Review
                </Button>
              </div>
              <div className="flex items-center space-x-4 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">5 Provider Approvals</p>
                  <p className="text-xs text-muted-foreground">
                    Awaiting verification
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/admin/onboarding-reviews")}
                >
                  Review
                </Button>
              </div>
              <div className="flex items-center space-x-4 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">3 Compliance Issues</p>
                  <p className="text-xs text-muted-foreground">
                    Requires attention
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/admin/compliance")}
                >
                  View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.SYSTEM_VIEW}
      title="Access Restricted"
      description="You don't have permission to view the admin dashboard."
    >
      <AdminDashboardContent />
    </RequirePermission>
  );
}
