"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../use-page-metadata";
import { dischargeCaseService, DischargeCase } from "@/lib/api";
import { toast } from "sonner";
import { format as formatDate } from "date-fns";
import { DischargeStatus, Payer } from "@carelink/types";
import { useDebounce } from "@/hooks/use-debounce";
import { RequirePermission } from "@/components/auth/require-permission";
import { HOSPITAL_SW_CAPABILITIES } from "@/lib/permissions/capabilities";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  RefreshCw, 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical,
  Calendar,
  MapPin,
  FileText,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYER_LABELS } from "@/lib/constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function DischargesPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const { hasCapability } = useRolePermissions();
  const canViewDischarges = hasCapability(HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_VIEW);
  const canCreateDischarges = hasCapability(HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_CREATE);
  const canUpdateDischarges = hasCapability(HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_UPDATE);
  const canDeleteDischarges = hasCapability(HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_DELETE);

  const [dischargeCases, setDischargeCases] = useState<DischargeCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [caseToDelete, setCaseToDelete] = useState<DischargeCase | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setTitle("Discharge Cases");
    setDescription("Manage hospital discharge cases and placements");
  }, [setTitle, setDescription]);

  const fetchDischargeCases = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter !== "all" ? (statusFilter as DischargeStatus) : undefined,
        search: debouncedSearch || undefined,
      };

      const response = await dischargeCaseService.getDischargeCases(params);

      if (response.success && response.data) {
        setDischargeCases(response.data.cases || []);
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
        setError(response.message || "Failed to load discharge cases");
      }
    } catch (err) {
      console.error("Error fetching discharge cases:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch discharge cases"
      );
      toast.error("Failed to load discharge cases");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [
    user?.id,
    statusFilter,
    debouncedSearch,
    pagination.page,
    pagination.limit,
  ]);

  // Fetch discharge cases when filters change
  useEffect(() => {
    if (user?.id) {
      fetchDischargeCases();
    }
  }, [user?.id, fetchDischargeCases]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchDischargeCases();
  }, [fetchDischargeCases]);

  const handleViewCase = useCallback(
    (dischargeCase: DischargeCase) => {
      router.push(`/hospital-sw/discharges/${dischargeCase.id}`);
    },
    [router]
  );

  const handleEditCase = useCallback(
    (dischargeCase: DischargeCase) => {
      router.push(`/hospital-sw/discharges/${dischargeCase.id}/edit`);
    },
    [router]
  );

  const handleDeleteCase = useCallback((dischargeCase: DischargeCase) => {
    setCaseToDelete(dischargeCase);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDeleteCase = async () => {
    if (!caseToDelete) return;

    setIsDeleting(true);
    try {
      const response = await dischargeCaseService.deleteDischargeCase(
        caseToDelete.id
      );
      if (response.success) {
        toast.success("Discharge case deleted successfully");
        setDeleteDialogOpen(false);
        setCaseToDelete(null);
        await fetchDischargeCases();
      } else {
        toast.error(response.message || "Failed to delete discharge case");
      }
    } catch (err) {
      console.error("Error deleting discharge case:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete discharge case"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadgeVariant = (status: DischargeStatus) => {
    switch (status) {
      case DischargeStatus.INTAKE:
        return "default";
      case DischargeStatus.MATCHING:
        return "healthcareInfo";
      case DischargeStatus.INVITES_SENT:
        return "healthcareWarning";
      case DischargeStatus.RESPONSES_PENDING:
        return "healthcareWarning";
      case DischargeStatus.PLACEMENT_CONFIRMED:
        return "healthcareSuccess";
      case DischargeStatus.DISCHARGED:
        return "healthcareSuccess";
      case DischargeStatus.FOLLOW_UP:
        return "default";
      case DischargeStatus.COMPLETED:
        return "healthcareSuccess";
      case DischargeStatus.CANCELLED:
        return "destructive";
      default:
        return "default";
    }
  };

  const columns: ColumnDef<DischargeCase>[] = [
    {
      accessorKey: "caseNumber",
      header: "Case #",
      cell: ({ row }) => (
        <div className="font-medium whitespace-nowrap">
          {row.original.caseNumber}
        </div>
      ),
    },
    {
      accessorKey: "patient",
      header: "Patient",
      cell: ({ row }) => {
        const dischargeCase = row.original;
        return (
          <div className="whitespace-nowrap">
            <div className="font-medium">{dischargeCase.patientInitials}</div>
            <div className="text-sm text-muted-foreground">
              {dischargeCase.patientAge} yrs, {dischargeCase.patientGender}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const dischargeCase = row.original;
        return (
          <Badge
            variant={getStatusBadgeVariant(dischargeCase.status)}
            className="whitespace-nowrap"
          >
            {dischargeCase.status.replace(/_/g, " ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "targetDischargeDate",
      header: "Target Discharge",
      cell: ({ row }) => {
        const date = row.original.targetDischargeDate;
        if (!date) return "-";
        const dateObj = typeof date === "string" ? new Date(date) : date;
        return (
          <div className="whitespace-nowrap">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span>{formatDate(dateObj, "MMM d, yyyy")}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => {
        const dischargeCase = row.original;
        return (
          <div className="whitespace-nowrap">
            <div className="flex items-center gap-1 text-sm">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>{dischargeCase.currentLocation}</span>
            </div>
            {dischargeCase.preferredCounties.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {dischargeCase.preferredCounties.slice(0, 2).join(", ")}
                {dischargeCase.preferredCounties.length > 2 && "..."}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "primaryInsurance",
      header: "Insurance",
      cell: ({ row }) => {
        const dischargeCase = row.original;
        return (
          <Badge variant="outline" className="whitespace-nowrap">
            {PAYER_LABELS[dischargeCase.primaryInsurance] || dischargeCase.primaryInsurance}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const dischargeCase = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewCase(dischargeCase)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {canUpdateDischarges && (
                <DropdownMenuItem onClick={() => handleEditCase(dischargeCase)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDeleteDischarges && (
                <DropdownMenuItem
                  onClick={() => handleDeleteCase(dischargeCase)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading && dischargeCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading discharge cases...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discharge Cases</h1>
          <p className="text-muted-foreground mt-1">
            Manage hospital discharge cases and placements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {canCreateDischarges && (
            <Button
              variant="healthcare"
              onClick={() => router.push("/hospital-sw/discharges/create")}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Discharge Case
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter discharge cases by status or search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by case number or patient initials..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(DischargeStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card variant="healthcare">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p className="font-medium">Error Loading Discharge Cases</p>
              <p className="text-sm mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      {!error && (
        <DataTable
          columns={columns}
          data={dischargeCases}
          isLoading={isLoading}
          variant="healthcare"
          enablePagination={true}
          pageSize={pagination.limit}
          currentPage={pagination.page}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onRowClick={handleViewCase}
          emptyMessage="No discharge cases found. Create a new case to get started."
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Discharge Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete case {caseToDelete?.caseNumber}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCase}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function DischargesPage() {
  return (
    <RequirePermission
      permission={HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_VIEW}
      title="Access Restricted"
      description="You don't have permission to view discharge cases."
    >
      <DischargesPageContent />
    </RequirePermission>
  );
}

