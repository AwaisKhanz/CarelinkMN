"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useCaseManagerId } from "@/hooks/use-case-manager-data";
import { usePageMetadata } from "../use-page-metadata";
import { referralService, Referral } from "@/lib/api";
import { toast } from "sonner";
import {
  Users,
  FileText,
  Search,
  Calendar,
  MapPin,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CaseManagerLoadingState, CaseManagerErrorState } from "@/components/case-manager";
import { getUrgencyBadgeConfig, getReferralStatusBadgeConfig } from "@/lib/utils/case-manager";
import { Urgency, ReferralStatus, CaseManagerClientSummary } from "@carelink/types";
import { RequirePermission } from "@/components/auth/require-permission";
import { CASE_MANAGER_CAPABILITIES } from "@/lib/permissions/capabilities";

function ClientsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const caseManagerId = useCaseManagerId();
  const { setTitle, setDescription } = usePageMetadata();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setTitle("Clients");
    setDescription("View all clients from your referrals");
  }, [setTitle, setDescription]);

  useEffect(() => {
    if (caseManagerId || user?.id) {
      fetchReferrals();
    }
  }, [caseManagerId, user?.id]);

  const fetchReferrals = async () => {
    if (!caseManagerId && !user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all referrals to extract unique clients
      const response = await referralService.getReferrals({
        page: 1,
        limit: 1000, // Get all referrals to find unique clients
      });

      if (response.success && response.data) {
        setReferrals(response.data.referrals || []);
      } else {
        setError(response.message || "Failed to load referrals");
      }
    } catch (err) {
      console.error("Error fetching referrals:", err);
      setError(err instanceof Error ? err.message : "Failed to load referrals");
      toast.error("Failed to load clients");
    } finally {
      setIsLoading(false);
    }
  };

  // Group referrals by client (initials + age + gender)
  const clients = useMemo(() => {
    const clientMap = new Map<string, CaseManagerClientSummary>();

    referrals.forEach((referral) => {
      const key = `${referral.clientInitials}-${referral.clientAge}-${referral.clientGender}`;
      
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          initials: referral.clientInitials,
          age: referral.clientAge,
          gender: referral.clientGender,
          referralCount: 1,
          latestReferral: referral,
          status: referral.status,
          urgency: referral.urgency,
        });
      } else {
        const existing = clientMap.get(key)!;
        existing.referralCount += 1;
        // Update if this referral is newer
        if (new Date(referral.createdAt) > new Date(existing.latestReferral.createdAt)) {
          existing.latestReferral = referral;
          existing.status = referral.status;
          existing.urgency = referral.urgency;
        }
      }
    });

    return Array.from(clientMap.values());
  }, [referrals]);

  // Filter clients by search query
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;

    const query = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.initials.toLowerCase().includes(query) ||
        client.age.toString().includes(query) ||
        client.gender.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  if (isLoading) {
    return <CaseManagerLoadingState message="Loading clients..." fullHeight />;
  }

  if (error) {
    return (
      <CaseManagerErrorState
        title="Error Loading Clients"
        message={error}
        action={{
          label: "Retry",
          onClick: fetchReferrals,
          variant: "healthcare",
        }}
      />
    );
  }

  const urgencyConfig = getUrgencyBadgeConfig(Urgency.URGENT);
  const statusConfig = getReferralStatusBadgeConfig(ReferralStatus.NEW);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">
            View all clients from your referrals
          </p>
        </div>
        <Button
          variant="healthcare"
          onClick={() => router.push("/case-manager/referrals/create")}
        >
          <FileText className="h-4 w-4 mr-2" />
          Create New Referral
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">
              Unique clients across all referrals
            </p>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referrals.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all clients
            </p>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter(
                (c) =>
                  c.status !== ReferralStatus.CLOSED &&
                  c.status !== ReferralStatus.CANCELLED &&
                  c.status !== ReferralStatus.PLACED
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Clients with active referrals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card variant="healthcare">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by client initials, age, or gender..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      {filteredClients.length === 0 ? (
        <Card variant="healthcare">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No clients found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No clients match your search criteria"
                  : "You haven't created any referrals yet"}
              </p>
              {!searchQuery && (
                <Button
                  variant="healthcare"
                  onClick={() => router.push("/case-manager/referrals/create")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Your First Referral
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const urgencyBadge = getUrgencyBadgeConfig(client.urgency);
            const statusBadge = getReferralStatusBadgeConfig(client.status);

            return (
              <Card
                key={`${client.initials}-${client.age}-${client.gender}`}
                variant="healthcare"
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() =>
                  router.push(
                    `/case-manager/referrals/${client.latestReferral.id}`
                  )
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {client.initials}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Age {client.age} • {client.gender}
                      </CardDescription>
                    </div>
                    <Badge variant={urgencyBadge.variant}>
                      {urgencyBadge.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Referrals:</span>
                    <span className="font-medium">{client.referralCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={statusBadge.variant}>
                      {statusBadge.label}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Latest Referral:</span>
                    <span className="font-medium">
                      {client.latestReferral.referralNumber}
                    </span>
                  </div>

                  {client.latestReferral.preferredCounties.length > 0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-muted-foreground">Preferred: </span>
                        <span className="font-medium">
                          {client.latestReferral.preferredCounties.slice(0, 2).join(", ")}
                          {client.latestReferral.preferredCounties.length > 2 && "..."}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-medium">
                      {format(
                        new Date(client.latestReferral.updatedAt),
                        "MMM d, yyyy"
                      )}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(
                        `/case-manager/referrals/${client.latestReferral.id}`
                      );
                    }}
                  >
                    View Referrals
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ClientsPage() {
  return (
    <RequirePermission
      permission={CASE_MANAGER_CAPABILITIES.REFERRALS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view clients."
    >
      <ClientsPageContent />
    </RequirePermission>
  );
}

