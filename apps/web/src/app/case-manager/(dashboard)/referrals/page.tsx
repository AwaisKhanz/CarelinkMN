"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useCaseManagerId } from "@/hooks/use-case-manager-data";
import { usePageMetadata } from "../use-page-metadata";
import { referralService, Referral } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { ReferralStatus, Urgency, Payer } from "@carelink/types";
import { useDebounce } from "@/hooks/use-debounce";
import {
  ReferralsHeader,
  ReferralsStats,
  ReferralsFilters,
  ReferralsKanban,
  ReferralsTable,
  ReferralsViewTabs,
  ReferralsBulkActions,
  DeleteReferralDialog,
  BatchAddToShortlistDialog,
  BatchMessageDialogList,
} from "./components";
import { CaseManagerLoadingState, CaseManagerErrorState } from "@/components/case-manager";
import {
  useReferralsColumns,
  useReferralsStats,
  useReferralsSelection,
} from "./hooks";

export default function CaseManagerReferralsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const caseManagerId = useCaseManagerId();
  const { setTitle, setDescription } = usePageMetadata();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [payerFilter, setPayerFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [referralToDelete, setReferralToDelete] = useState<Referral | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Batch operations state
  const [batchAddToShortlistDialogOpen, setBatchAddToShortlistDialogOpen] =
    useState(false);
  const [batchMessageDialogOpen, setBatchMessageDialogOpen] = useState(false);
  const [isAddingToShortlist, setIsAddingToShortlist] = useState(false);
  const [isSendingBatchMessage, setIsSendingBatchMessage] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setTitle("My Cases");
    setDescription("Manage your referrals and placements");
  }, [setTitle, setDescription]);

  const fetchReferrals = useCallback(async () => {
    if (!caseManagerId && !user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status:
          statusFilter !== "all" ? (statusFilter as ReferralStatus) : undefined,
        urgency:
          urgencyFilter !== "all" ? (urgencyFilter as Urgency) : undefined,
        primaryPayer:
          payerFilter !== "all" ? (payerFilter as Payer) : undefined,
        search: debouncedSearch || undefined,
      };

      const response = await referralService.getReferrals(params);

      if (response.success && response.data) {
        setReferrals(response.data.referrals || []);
        if (response.data?.pagination) {
          setPagination((prev) => ({
            ...prev,
            page: response.data?.pagination?.page || prev.page,
            limit: response.data?.pagination?.limit || prev.limit,
            total: response.data?.pagination?.total || 0,
            pages: response.data?.pagination?.pages || 0,
          }));
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
  }, [
    caseManagerId,
    user?.id,
    statusFilter,
    urgencyFilter,
    payerFilter,
    debouncedSearch,
    pagination.page,
    pagination.limit,
  ]);

  // Fetch referrals when filters change
  useEffect(() => {
    if (caseManagerId || user?.id) {
      fetchReferrals();
    }
  }, [caseManagerId, user?.id, fetchReferrals]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchReferrals();
  }, [fetchReferrals]);

  const handleViewReferral = useCallback(
    (referral: Referral) => {
      router.push(`/case-manager/referrals/${referral.id}`);
    },
    [router]
  );

  const handleEditReferral = useCallback(
    (referral: Referral) => {
      router.push(`/case-manager/referrals/${referral.id}/edit`);
    },
    [router]
  );

  const handleDeleteReferral = useCallback((referral: Referral) => {
    setReferralToDelete(referral);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDeleteReferral = async () => {
    if (!referralToDelete) return;

    setIsDeleting(true);
    try {
      const response = await referralService.deleteReferral(
        referralToDelete.id
      );
      if (response.success) {
        toast.success("Referral deleted successfully");
        setDeleteDialogOpen(false);
        setReferralToDelete(null);
        await fetchReferrals();
        // Clear selection if deleted referral was selected
        setSelectedReferrals((prev) =>
          prev.filter((id) => id !== referralToDelete.id)
        );
      } else {
        toast.error(response.message || "Failed to delete referral");
      }
    } catch (err) {
      console.error("Error deleting referral:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete referral"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkAddToShortlist = () => {
    if (selectedReferrals.length === 0) {
      toast.error("Please select referrals to add to shortlist");
      return;
    }
    setBatchAddToShortlistDialogOpen(true);
  };

  const handleConfirmBatchAddToShortlist = async (
    providerIds: string[],
    notes?: string
  ) => {
    if (selectedReferrals.length === 0 || providerIds.length === 0) {
      return;
    }

    setIsAddingToShortlist(true);
    try {
      // Add providers to each selected referral
      const promises = selectedReferrals.map((referralId) => {
        const referral = referrals.find((r) => r.id === referralId);
        return referralService.batchAddToShortlist(referralId, providerIds, notes).then(
          (response) => {
            if (!response.success) {
              throw new Error(
                `Failed to add to shortlist for ${referral?.referralNumber || referralId}: ${response.message}`
              );
            }
            return response;
          }
        );
      });

      await Promise.all(promises);

      toast.success(
        `Successfully added ${providerIds.length} provider${providerIds.length !== 1 ? "s" : ""} to ${selectedReferrals.length} referral${selectedReferrals.length !== 1 ? "s" : ""} shortlist${selectedReferrals.length !== 1 ? "s" : ""}`
      );

      setBatchAddToShortlistDialogOpen(false);
      setSelectedReferrals([]);
      await fetchReferrals(); // Refresh referrals list
    } catch (err) {
      console.error("Error in batch add to shortlist:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to add providers to shortlist"
      );
    } finally {
      setIsAddingToShortlist(false);
    }
  };

  const handleBulkMessage = () => {
    if (selectedReferrals.length === 0) {
      toast.error("Please select referrals to message");
      return;
    }
    setBatchMessageDialogOpen(true);
  };

  const handleConfirmBatchMessage = async (
    providerIds: string[],
    message: string
  ) => {
    if (selectedReferrals.length === 0 || providerIds.length === 0) {
      return;
    }

    setIsSendingBatchMessage(true);
    try {
      const response = await referralService.batchMessageProviders({
        referralIds: selectedReferrals,
        providerIds,
        message,
      });

      if (response.success) {
        const totalMessages = selectedReferrals.length * providerIds.length;
        toast.success(
          `Successfully sent ${totalMessages} message${totalMessages !== 1 ? "s" : ""} to ${providerIds.length} provider${providerIds.length !== 1 ? "s" : ""} for ${selectedReferrals.length} referral${selectedReferrals.length !== 1 ? "s" : ""}`
        );
        setBatchMessageDialogOpen(false);
        setSelectedReferrals([]);
      } else {
        toast.error(response.message || "Failed to send batch messages");
      }
    } catch (err) {
      console.error("Error sending batch messages:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to send batch messages"
      );
    } finally {
      setIsSendingBatchMessage(false);
    }
  };

  const handleExportCSV = async () => {
    if (!caseManagerId && !user?.id) {
      toast.error("Unable to export: User not found");
      return;
    }

    setIsExporting(true);
    try {
      // Fetch ALL referrals matching current filters (not just current page)
      const params = {
        page: 1,
        limit: 10000, // Large limit to get all referrals
        status:
          statusFilter !== "all" ? (statusFilter as ReferralStatus) : undefined,
        urgency:
          urgencyFilter !== "all" ? (urgencyFilter as Urgency) : undefined,
        primaryPayer:
          payerFilter !== "all" ? (payerFilter as Payer) : undefined,
        search: debouncedSearch || undefined,
      };

      const response = await referralService.getReferrals(params);

      if (!response.success || !response.data) {
        toast.error(response.message || "Failed to fetch referrals for export");
        return;
      }

      const allReferrals = response.data.referrals || [];
      
      if (allReferrals.length === 0) {
        toast.info("No referrals to export");
        return;
      }

      const csvRows: string[] = [];

      // Header
      csvRows.push(
        "Referral #,Client,Age,Gender,Status,Urgency,Payer,Target Move Date,Shortlisted Providers,Created Date,Updated Date"
      );

      // Data rows
      allReferrals.forEach((referral) => {
        const shortlistCount = referral.shortlist?.length || 0;
        const targetMoveDate = referral.targetMoveDate
          ? format(new Date(referral.targetMoveDate), "MMM d, yyyy")
          : "N/A";
        const createdDate = format(new Date(referral.createdAt), "MMM d, yyyy");
        const updatedDate = format(new Date(referral.updatedAt), "MMM d, yyyy");

        csvRows.push(
          `${referral.referralNumber},"${referral.clientInitials}",${referral.clientAge},${referral.clientGender},${referral.status},${referral.urgency},${referral.primaryPayer},"${targetMoveDate}",${shortlistCount},"${createdDate}","${updatedDate}"`
        );
      });

      // Create and download CSV
      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
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
      URL.revokeObjectURL(url);
      
      toast.success(
        `Successfully exported ${allReferrals.length} referral${allReferrals.length !== 1 ? "s" : ""} to CSV`
      );
    } catch (err) {
      console.error("Error exporting CSV:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to export referrals"
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Use hooks for columns, stats, and selection
  const baseColumns = useReferralsColumns({
    onView: handleViewReferral,
    onEdit: handleEditReferral,
    onDelete: handleDeleteReferral,
  });

  const stats = useReferralsStats({
    referrals,
    totalCount: pagination.total,
  });

  const {
    selectedReferrals,
    setSelectedReferrals,
    handleSelectAll,
    handleDeselectAll,
    handlePageChange,
    columnsWithSelection,
  } = useReferralsSelection({
    referrals,
    baseColumns,
  });

  // Handle page change
  const handlePageChangeWithSelection = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    handlePageChange();
  };

  if (isLoading && referrals.length === 0) {
    return <CaseManagerLoadingState message="Loading referrals..." fullHeight />;
  }

  return (
    <div className="space-y-6">
      <ReferralsHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      <ReferralsStats stats={stats} />

      <ReferralsFilters
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        urgencyFilter={urgencyFilter}
        onUrgencyFilterChange={setUrgencyFilter}
        payerFilter={payerFilter}
        onPayerFilterChange={setPayerFilter}
      />

      {error && (
        <CaseManagerErrorState
          title="Error Loading Referrals"
          message={error}
          action={{
            label: "Retry",
            onClick: handleRefresh,
            variant: "healthcare",
          }}
        />
      )}

      <ReferralsBulkActions
        selectedCount={selectedReferrals.length}
        totalCount={referrals.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onAddToShortlist={handleBulkAddToShortlist}
        onMessage={handleBulkMessage}
        onExport={handleExportCSV}
      />

      <ReferralsViewTabs
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalReferrals={pagination.total}
        onExportCSV={handleExportCSV}
        canExport={pagination.total > 0}
        isExporting={isExporting}
        tableView={
          <ReferralsTable
            columns={columnsWithSelection}
            referrals={referrals}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={handlePageChangeWithSelection}
            onRowClick={handleViewReferral}
          />
        }
        kanbanView={
          <ReferralsKanban
            referrals={referrals}
            isLoading={isLoading}
            onReferralClick={handleViewReferral}
            onStatusChange={async (referralId, newStatus) => {
              try {
                const response = await referralService.updateReferral(referralId, {
                  status: newStatus,
                });
                if (response.success) {
                  await fetchReferrals();
                } else {
                  throw new Error(response.message || "Failed to update status");
                }
              } catch (err) {
                throw err;
              }
            }}
          />
        }
      />

      <DeleteReferralDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        referral={referralToDelete}
        onConfirm={confirmDeleteReferral}
        isDeleting={isDeleting}
      />

      {/* Batch Add to Shortlist Dialog */}
      <BatchAddToShortlistDialog
        open={batchAddToShortlistDialogOpen}
        onOpenChange={setBatchAddToShortlistDialogOpen}
        referralIds={selectedReferrals}
        referralNumbers={selectedReferrals.map((id) => referrals.find((r) => r.id === id)?.referralNumber || id)}
        onConfirm={handleConfirmBatchAddToShortlist}
        isAdding={isAddingToShortlist}
      />

      {/* Batch Message Dialog */}
      <BatchMessageDialogList
        open={batchMessageDialogOpen}
        onOpenChange={setBatchMessageDialogOpen}
        referralIds={selectedReferrals}
        referralNumbers={selectedReferrals.map((id) => referrals.find((r) => r.id === id)?.referralNumber || id)}
        onConfirm={handleConfirmBatchMessage}
        isSending={isSendingBatchMessage}
      />
    </div>
  );
}
