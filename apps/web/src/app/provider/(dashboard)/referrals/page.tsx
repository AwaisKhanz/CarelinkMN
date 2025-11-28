"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { useSocket } from "@/contexts/socket-context";
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
  Send,
  Download,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionsToolbar } from "@/components/ui/bulk-actions-toolbar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Referral,
  ReferralStatus,
  ShortlistStatus,
  Urgency,
  Payer,
  NotificationType,
} from "@carelink/types";
import { SHORTLIST_STATUS_CONFIG, PAYER_LABELS } from "@/lib/constants";
import { RequirePermission } from "@/components/auth/require-permission";
import { PROVIDER_CAPABILITIES } from "@/lib/permissions/provider-capabilities";
import { usePermissions } from "@/hooks/use-permissions";
import {
  getUrgencyBadgeConfig,
  getReferralStatusBadgeConfig,
} from "@/lib/utils/provider";

function ProviderReferralsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const providerId = useProviderId();
  const { canRespondToReferrals, canViewReferrals } = usePermissions();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedReferrals, setSelectedReferrals] = useState<Set<string>>(
    new Set()
  );
  const [batchMessageDialogOpen, setBatchMessageDialogOpen] = useState(false);
  const [batchMessageContent, setBatchMessageContent] = useState("");
  const [isSendingBatch, setIsSendingBatch] = useState(false);

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



  const fetchReferrals = useCallback(async () => {
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
  }, [providerId, pagination.page, pagination.limit, statusFilter]);

  // Listen for real-time updates
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: any) => {
      // Refresh list on relevant notifications
      if (
        notification.type === NotificationType.NEW_REFERRAL ||
        notification.type === NotificationType.REFERRAL_UPDATE ||
        notification.type === NotificationType.URGENT_CASE_ALERT
      ) {
        fetchReferrals();
      }
    };

    const handleReferralReceived = (data: any) => {
      console.log("Socket event: referral received", data);
      fetchReferrals();
      toast.info("New referral received");
    };

    socket.on("notification:new", handleNotification);
    socket.on("referral:received", handleReferralReceived);

    return () => {
      socket.off("notification:new", handleNotification);
      socket.off("referral:received", handleReferralReceived);
    };
  }, [socket, fetchReferrals]);

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

  const handleExportCSV = () => {
    if (filteredReferrals.length === 0) return;

    // Define CSV headers
    const headers = [
      "Referral #",
      "Client Initials",
      "Age",
      "Gender",
      "Payer",
      "Urgency",
      "Status",
      "Received Date",
      "Location",
    ];

    // Map data to rows
    const rows = filteredReferrals.map((r) => [
      r.referralNumber,
      r.clientInitials,
      r.clientAge,
      r.clientGender,
      r.primaryPayer,
      r.urgency,
      r.status,
      format(new Date(r.createdAt), "yyyy-MM-dd"),
      r.preferredCounties.join(", "),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `referrals-${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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

  // Handle selection
  const handleToggleSelection = (referralId: string) => {
    setSelectedReferrals((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(referralId)) {
        newSet.delete(referralId);
      } else {
        newSet.add(referralId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedReferrals(new Set(filteredReferrals.map((r) => r.id)));
  };

  const handleDeselectAll = () => {
    setSelectedReferrals(new Set());
  };

  // Handle batch messaging
  const handleBatchMessage = async () => {
    if (selectedReferrals.size === 0 || !batchMessageContent.trim()) return;

    setIsSendingBatch(true);
    try {
      const referralIds = Array.from(selectedReferrals);
      const results = await Promise.allSettled(
        referralIds.map(async (referralId) => {
          // Find or create message thread for each referral
          const referral = referrals.find((r) => r.id === referralId);
          if (!referral || !providerId) return;

          // Get or create thread
          const threadsResponse = await messagingService.getThreads({
            providerId,
            referralId,
          });

          let threadId: string;
          if (
            threadsResponse.success &&
            threadsResponse.data &&
            threadsResponse.data.threads &&
            threadsResponse.data.threads.length > 0
          ) {
            threadId = threadsResponse.data.threads[0].id;
          } else {
            // Create new thread
            const createResponse = await messagingService.createThread({
              providerId,
              referralId,
              initialMessage: "Initial message",
            });
            if (!createResponse.success || !createResponse.data) {
              throw new Error("Failed to create thread");
            }
            threadId = createResponse.data.id;
          }

          // Send message
          const sendResponse = await messagingService.sendMessage({
            threadId,
            content: batchMessageContent.trim(),
          });

          if (!sendResponse.success) {
            throw new Error(sendResponse.message || "Failed to send message");
          }
        })
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (successful > 0) {
        toast.success(
          `Message sent to ${successful} referral${successful > 1 ? "s" : ""}`
        );
        setBatchMessageDialogOpen(false);
        setBatchMessageContent("");
        setSelectedReferrals(new Set());
        await fetchReferrals();
      }
      if (failed > 0) {
        toast.error(
          `Failed to send message to ${failed} referral${failed > 1 ? "s" : ""}`
        );
      }
    } catch (err) {
      console.error("Error sending batch messages:", err);
      toast.error("Failed to send batch messages");
    } finally {
      setIsSendingBatch(false);
    }
  };

  // Define table columns
  const columns: ColumnDef<Referral>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              filteredReferrals.length > 0 &&
              filteredReferrals.every((r) => selectedReferrals.has(r.id))
            }
            onCheckedChange={(checked) => {
              if (checked) {
                handleSelectAll();
              } else {
                handleDeselectAll();
              }
            }}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedReferrals.has(row.original.id)}
            onCheckedChange={() => handleToggleSelection(row.original.id)}
            aria-label={`Select ${row.original.referralNumber}`}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
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
                {referral.preferredCounties?.length > 0
                  ? referral.preferredCounties[0]
                  : "Any"}
              </div>
              {referral.preferredCities?.length > 0 && (
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
            <Badge variant={config.variant} className="whitespace-nowrap">
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "shortlistStatus",
        header: "Your Status",
        cell: ({ row }) => {
          const referral = row.original as any; // Provider referral includes shortlistStatus
          const status = referral.shortlistStatus as ShortlistStatus;
          if (!status) {
            return <span className="text-muted-foreground text-sm">-</span>;
          }
          const config = SHORTLIST_STATUS_CONFIG[status];
          return (
            <Badge
              variant={config?.color || "outline"}
              className="whitespace-nowrap"
            >
              {config?.label || status}
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
              {canViewReferrals && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewReferral(referral)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {canRespondToReferrals && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMessageReferral(referral)}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [
      canRespondToReferrals,
      canViewReferrals,
      selectedReferrals,
      filteredReferrals,
    ]
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={filteredReferrals.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
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
          <div className="space-y-4">
            {/* Bulk Actions Toolbar */}
            {canRespondToReferrals &&
              selectedReferrals.size > 0 && (
                <BulkActionsToolbar
                  selectedCount={selectedReferrals.size}
                  totalCount={filteredReferrals.length}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  actions={[
                    {
                      label: "Send Message",
                      icon: <Send className="h-4 w-4" />,
                      onClick: () => setBatchMessageDialogOpen(true),
                      variant: "default",
                    },
                  ]}
                />
              )}

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
          </div>
        </CardContent>
      </Card>

      {/* Batch Message Dialog */}
      <Dialog
        open={batchMessageDialogOpen}
        onOpenChange={setBatchMessageDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Batch Message</DialogTitle>
            <DialogDescription>
              Send a message to {selectedReferrals.size} selected referral
              {selectedReferrals.size !== 1 ? "s" : ""}. The message will be
              sent to each referral's message thread.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="batch-message">Message</Label>
              <Textarea
                id="batch-message"
                placeholder="Enter your message here..."
                value={batchMessageContent}
                onChange={(e) => setBatchMessageContent(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBatchMessageDialogOpen(false);
                  setBatchMessageContent("");
                }}
                disabled={isSendingBatch}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBatchMessage}
                disabled={!batchMessageContent.trim() || isSendingBatch}
                variant="healthcare"
              >
                {isSendingBatch ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to {selectedReferrals.size} Referral
                    {selectedReferrals.size !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProviderReferralsPage() {
  return (
    <RequirePermission
      permission={PROVIDER_CAPABILITIES.REFERRALS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view referrals. Please contact your organization administrator if you need access."
    >
      <ProviderReferralsPageContent />
    </RequirePermission>
  );
}
