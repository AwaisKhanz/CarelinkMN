"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useCaseManager } from "@/contexts/case-manager-context";
import { usePageMetadata } from "../use-page-metadata";
import { caseManagerService, Referral } from "@/lib/api";
import { URGENCY_CONFIG } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Users, Clock, CheckCircle, AlertTriangle, Search, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

function CaseManagerDashboardContent() {
  const { user } = useAuth();
  const { caseManager } = useCaseManager();
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  
  const [dashboard, setDashboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle("Case Manager Dashboard");
    setDescription(`Welcome back, ${user?.firstName} ${user?.lastName}`);
  }, [user, setTitle, setDescription]);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        setError(null);
        const response = await caseManagerService.getDashboard(user.id);
        if (response.success && response.data) {
          setDashboard(response.data);
        } else {
          setError(response.message || "Failed to load dashboard");
        }
      } catch (err) {
        console.error("Error fetching dashboard:", err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={`skeleton-${index}`} variant="healthcare">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="healthcare">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={`skeleton-item-${index}`} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card variant="healthcare">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={`skeleton-action-${index}`} className="h-10 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="healthcare" className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1">Error Loading Dashboard</p>
              <p className="text-sm text-muted-foreground mb-3">{error}</p>
              <Button
                size="sm"
                onClick={() => {
                  window.location.reload();
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = dashboard?.stats || {
    totalReferrals: 0,
    activeReferrals: 0,
    pendingPlacements: 0,
    completedPlacements: 0,
    averagePlacementTime: 0,
    responseRate: 0,
  };

  const urgentReferrals = dashboard?.urgentReferrals || [];
  const recentReferrals = dashboard?.recentReferrals || [];
  const recentPlacements = dashboard?.recentPlacements || [];

  return (
    <>
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeReferrals} active
            </p>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeReferrals}</div>
            <p className="text-xs text-muted-foreground">
              {urgentReferrals.length} urgent
            </p>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Placements</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPlacements}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedPlacements} completed
            </p>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responseRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average {stats.averagePlacementTime.toFixed(1)} days to placement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Urgent Referrals</CardTitle>
            <CardDescription>
              Cases requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {urgentReferrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No urgent referrals at this time</p>
              </div>
            ) : (
              <div className="space-y-4">
                {urgentReferrals.slice(0, 5).map((referral: Referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg bg-warning/5 cursor-pointer hover:bg-warning/10 transition-colors"
                    onClick={() => router.push(`/case-manager/referrals/${referral.id}`)}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {referral.clientInitials} • Age {referral.clientAge}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {referral.referralNumber}
                          {referral.targetMoveDate && ` • Move date: ${format(new Date(referral.targetMoveDate), "MMM d, yyyy")}`}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={URGENCY_CONFIG[referral.urgency]?.color || "outline"}
                    >
                      {URGENCY_CONFIG[referral.urgency]?.label || referral.urgency}
                    </Badge>
                  </div>
                ))}
                {urgentReferrals.length > 5 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/case-manager/referrals?urgency=URGENT")}
                  >
                    View All Urgent Referrals ({urgentReferrals.length})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Recent Referrals</CardTitle>
            <CardDescription>
              Latest referral activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentReferrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent referrals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReferrals.slice(0, 5).map((referral: Referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/case-manager/referrals/${referral.id}`)}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {referral.referralNumber}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {referral.clientInitials} • {referral.status}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={URGENCY_CONFIG[referral.urgency]?.color || "outline"}
                      className="shrink-0"
                    >
                      {URGENCY_CONFIG[referral.urgency]?.label || referral.urgency}
                    </Badge>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/case-manager/referrals")}
                >
                  View All Referrals
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common case management tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="healthcare"
              className="w-full justify-start"
              onClick={() => router.push("/case-manager/search")}
            >
              <Search className="mr-2 h-4 w-4" />
              Search Available Providers
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/case-manager/referrals/create")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Create New Referral
            </Button>
            <Button
              variant="healthcareSecondary"
              className="w-full justify-start"
              onClick={() => router.push("/case-manager/referrals")}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Referrals
            </Button>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Recent Placements</CardTitle>
            <CardDescription>
              Latest placement activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentPlacements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent placements</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPlacements.slice(0, 5).map((placement: any) => (
                  <div
                    key={placement.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/case-manager/placements/${placement.id}`)}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <CheckCircle className="h-5 w-5 text-success shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {placement.referral?.referralNumber || "Placement"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {format(new Date(placement.placementDate), "MMM d, yyyy")} • {placement.status}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {placement.status}
                    </Badge>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/case-manager/placements")}
                >
                  View All Placements
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function CaseManagerDashboard() {
  return <CaseManagerDashboardContent />;
}
