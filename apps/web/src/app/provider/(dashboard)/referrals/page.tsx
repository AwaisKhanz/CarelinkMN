"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../use-page-metadata";
import {
  providerService,
  messagingService,
  ProviderReferralsResponse,
} from "@/lib/api";
import { useProviderId } from "@/hooks/use-provider-data";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Eye,
  MapPin,
  Loader2,
  FileText,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Referral,
  ReferralStatus,
  ShortlistStatus,
  Urgency,
  Payer,
} from "@carelink/types";
import {
  SHORTLIST_STATUS_CONFIG,
  PAYER_LABELS,
} from "@/lib/constants";
import {
  getUrgencyBadgeConfig,
  getReferralStatusBadgeConfig,
} from "@/lib/utils/provider";

export default function ProviderReferralsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const providerId = useProviderId();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    setTitle("Referrals");
    setDescription("Manage referrals sent to your organization");
  }, [setTitle, setDescription]);

  // Fetch referrals
  useEffect(() => {
    if (providerId) {
      fetchReferrals();
    }
  }, [providerId, statusFilter, urgencyFilter, pagination.page]);

  const fetchReferrals = async () => {
    if (!providerId) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter !== "all" ? statusFilter : undefined,
      };

      const response = await providerService.getProviderReferrals(
        providerId,
        params
      );

      if (response.success && response.data) {
        const data = response.data as ProviderReferralsResponse;
        setReferrals(data?.referrals ?? []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        setError(response.message || "Failed to load referrals");
      }
    } catch (err) {
      console.error("Error fetching referrals:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch referrals"
      );
      toast.error("Failed to load referrals");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchReferrals();
  };

  const handleViewReferral = (referral: Referral) => {
    router.push(`/provider/referrals/${referral.id}`);
  };

  const handleMessageReferral = (referral: Referral) => {
    router.push(`/provider/messages?referralId=${referral.id}`);
  };

  // Filter referrals based on search and filters
  const filteredReferrals = useMemo(() => {
    return referrals.filter((referral) => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          referral.referralNumber.toLowerCase().includes(searchLower) ||
          referral.clientInitials.toLowerCase().includes(searchLower) ||
          referral.preferredCounties.some((c) =>
            c.toLowerCase().includes(searchLower)
          ) ||
          referral.preferredCities.some((c) =>
            c.toLowerCase().includes(searchLower)
          );
        if (!matchesSearch) return false;
      }

      // Urgency filter
      if (urgencyFilter !== "all" && referral.urgency !== urgencyFilter) {
        return false;
      }

      return true;
    });
  }, [referrals, searchQuery, urgencyFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: referrals.length,
      new: referrals.filter((r) => r.status === ReferralStatus.NEW).length,
      inReview: referrals.filter((r) => r.status === ReferralStatus.IN_REVIEW)
        .length,
      urgent: referrals.filter((r) => r.urgency === Urgency.URGENT).length,
      responded: referrals.filter((r) =>
        r.shortlist?.some(
          (s) =>
            s.providerId === providerId &&
            s.status === ShortlistStatus.RESPONDED
        )
      ).length,
    };
  }, [referrals, providerId]);

  // Define table columns
  const columns: ColumnDef<Referral>[] = useMemo(
    () => [
      {
        accessorKey: "referralNumber",
        header: "Referral #",
        cell: ({ row }) => (
          <div className="font-medium whitespace-nowrap">
            {row.original.referralNumber}
          </div>
        ),
      },
      {
        accessorKey: "client",
        header: "Client",
        cell: ({ row }) => {
          const referral = row.original;
          return (
            <div className="whitespace-nowrap">
              <div className="font-medium">{referral.clientInitials}</div>
              <div className="text-sm text-muted-foreground">
                {referral.clientAge} yrs, {referral.clientGender}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => {
          const referral = row.original;
          return (
            <div className="whitespace-nowrap">
              <div className="flex items-center gap-1 text-sm">
                <MapPin className="h-3 w-3" />
                {referral.preferredCounties.length > 0
                  ? referral.preferredCounties[0]
                  : "Any"}
              </div>
              {referral.preferredCities.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {referral.preferredCities[0]}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "payer",
        header: "Payer",
        cell: ({ row }) => {
          const referral = row.original;
          return (
            <div className="whitespace-nowrap">
              <Badge variant="outline">
                {PAYER_LABELS[referral.primaryPayer] || referral.primaryPayer}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "urgency",
        header: "Urgency",
        cell: ({ row }) => {
          const referral = row.original;
          const config = getUrgencyBadgeConfig(referral.urgency);
          const Icon = config.icon;
          return (
            <Badge variant={config.variant} className="whitespace-nowrap">
              {Icon && <Icon className="h-3 w-3 mr-1" />}
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const referral = row.original;
          const config = getReferralStatusBadgeConfig(referral.status);
          return (
            <Badge
              variant={config.variant}
              className="whitespace-nowrap"
            >
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "shortlistStatus",
        header: "Your Status",
        cell: ({ row }) => {
          const referral = row.original;
          // shortlist is an array, find the one for this provider
          const shortlistItem = referral.shortlist?.find(
            (s) => s.providerId === providerId
          );
          if (!shortlistItem) {
            return <span className="text-muted-foreground text-sm">-</span>;
          }
          const config = SHORTLIST_STATUS_CONFIG[shortlistItem.status];
          return (
            <Badge
              variant={config?.color || "outline"}
              className="whitespace-nowrap"
            >
              {config?.label || shortlistItem.status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Received",
        cell: ({ row }) => {
          const referral = row.original;
          return (
            <div className="text-sm whitespace-nowrap">
              {formatDistanceToNow(new Date(referral.createdAt), {
                addSuffix: true,
              })}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const referral = row.original;
          return (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewReferral(referral)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMessageReferral(referral)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Referrals</h1>
          <p className="text-muted-foreground mt-1">
            Manage referrals sent to your organization
          </p>
        </div>
        <Button
          variant="healthcareSecondary"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatsCard title="Total Referrals" value={stats.total} />
        <StatsCard title="New" value={stats.new} valueClassName="text-info" />
        <StatsCard
          title="In Review"
          value={stats.inReview}
          valueClassName="text-warning"
        />
        <StatsCard
          title="Urgent"
          value={stats.urgent}
          valueClassName="text-destructive"
        />
        <StatsCard
          title="Responded"
          value={stats.responded}
          valueClassName="text-success"
        />
      </div>

      {/* Search and Filters */}
      <Card variant="healthcare">
        <CardContent className="pt-6">
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search by referral number, client initials, or location..."
            filterValue={statusFilter}
            onFilterChange={setStatusFilter}
            filterOptions={[
              { value: "all", label: "All Status" },
              { value: ReferralStatus.NEW, label: "New" },
              { value: ReferralStatus.IN_REVIEW, label: "In Review" },
              { value: ReferralStatus.TOURING, label: "Touring" },
              { value: ReferralStatus.OFFER_MADE, label: "Offer Made" },
              { value: ReferralStatus.PLACED, label: "Placed" },
              { value: ReferralStatus.CLOSED, label: "Closed" },
            ]}
            filterPlaceholder="Filter by status"
          />
          <div className="mt-4">
            <SearchFilterBar
              searchQuery=""
              onSearchChange={() => {}}
              searchPlaceholder=""
              showFilter={false}
              filterValue={urgencyFilter}
              onFilterChange={setUrgencyFilter}
              filterOptions={[
                { value: "all", label: "All Urgency" },
                { value: Urgency.URGENT, label: "Urgent" },
                { value: Urgency.HIGH, label: "High" },
                { value: Urgency.ROUTINE, label: "Routine" },
              ]}
              filterPlaceholder="Filter by urgency"
            />
          </div>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Referrals</CardTitle>
          <CardDescription>
            {filteredReferrals.length} referral
            {filteredReferrals.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredReferrals}
            isLoading={isLoading}
            variant="healthcare"
            enablePagination={true}
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            onPageChange={(page) =>
              setPagination((prev) => ({ ...prev, page }))
            }
            emptyMessage="No referrals found. Referrals will appear here when case managers send them to your organization."
          />
        </CardContent>
      </Card>
    </div>
  );
}
