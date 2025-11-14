"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FileText, Clock, CheckCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { HospitalSWGuard } from "@/components/auth/route-guard";
import { HospitalSWOnboardingGuard } from "@/components/auth/role-onboarding-guard";

function HospitalSWDashboardContent() {
  const { user } = useAuth();

  return (
    <DashboardLayout
      title="Hospital Social Work Dashboard"
      description={`Welcome back, ${user?.firstName} ${user?.lastName}`}
    >

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card variant="healthcare">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Discharges</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">
                +5 this week
              </p>
            </CardContent>
          </Card>

          <Card variant="healthcare">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">
                Under your care
              </p>
            </CardContent>
          </Card>

          <Card variant="healthcare">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Placements</CardTitle>
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
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-muted-foreground">
                Successful discharges
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common social work tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="healthcare" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Create Discharge Plan
            </Button>
            <Button variant="healthcareSecondary" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Manage Patient Cases
            </Button>
            <Button variant="healthcareSecondary" className="w-full justify-start">
              <Clock className="mr-2 h-4 w-4" />
              Review Pending Discharges
            </Button>
          </CardContent>
        </Card>
    </DashboardLayout>
  );
}

export default function HospitalSWDashboard() {
  return (
    <HospitalSWGuard>
      <HospitalSWOnboardingGuard>
        <HospitalSWDashboardContent />
      </HospitalSWOnboardingGuard>
    </HospitalSWGuard>
  );
}
