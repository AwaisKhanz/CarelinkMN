"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../use-page-metadata";
import { dischargeCaseService, DischargeCase } from "@/lib/api";
import { toast } from "sonner";
import { format as formatDate } from "date-fns";
import { DischargeStatus } from "@carelink/types";
import { useDebounce } from "@/hooks/use-debounce";
import { RequirePermission } from "@/components/auth/require-permission";
import { HOSPITAL_SW_CAPABILITIES } from "@/lib/permissions/capabilities";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared";
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
  Loader2,
  FileText,
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
import {
  PAYER_LABELS,
  DISCHARGE_STATUS_CONFIG,
  getDischargeStatusLabel,
  getGenderLabel,
  getHospitalLocationLabel,
} from "@/lib/constants";
import {
  getDischargeStatusBadgeConfig,
  formatCaseNumber,
  getPatientDisplayName,
} from "@/lib/utils/hospital-sw";
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
import { useDischargeCases } from "@/hooks/use-hospital-sw-data";

function DischargesPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const { hasCapability } = useRolePermissions();
  const canViewDischarges = hasCapability(
    HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_VIEW
  );
  const canCreateDischarges = hasCapability(
    HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_CREATE
  );
  const canUpdateDischarges = hasCapability(
    HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_UPDATE
  );
  const canDeleteDischarges = hasCapability(
    HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_DELETE
  );

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [caseToDelete, setCaseToDelete] = useState<DischargeCase | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setTitle("Discharge Cases");
    setDescription("Manage hospital discharge cases and placements");
  }, [setTitle, setDescription]);

  // Use shared hook for fetching discharge cases
  const filters = useMemo(
    () => ({
      page,
      limit,
      status:
        statusFilter !== "all" ? (statusFilter as DischargeStatus) : undefined,
      search: debouncedSearch || undefined,
    }),
    [page, limit, statusFilter, debouncedSearch]
  );

  const {
    cases: dischargeCases,
    isLoading,
    error: fetchError,
    pagination,
    refetch,
  } = useDischargeCases(canViewDischarges ? filters : undefined);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

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
        await refetch();
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

  // Use shared constants and utilities for columns
  const columns: ColumnDef<DischargeCase>[] = useMemo(
    () => [
      {
        accessorKey: "caseNumber",
        header: "Case #",
        cell: ({ row }) => (
          <div className="font-medium whitespace-nowrap">
            {formatCaseNumber(row.original.caseNumber)}
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
              <div className="font-medium">
                {getPatientDisplayName(dischargeCase.patientInitials)}
              </div>
              <div className="text-sm text-muted-foreground">
                {dischargeCase.patientAge} yrs,{" "}
                {getGenderLabel(dischargeCase.patientGender)}
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
          const statusConfig = getDischargeStatusBadgeConfig(
            dischargeCase.status
          );
          return (
            <Badge variant={statusConfig.variant} className="whitespace-nowrap">
              {statusConfig.label}
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
                <span>
                  {getHospitalLocationLabel(dischargeCase.currentLocation)}
                </span>
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
              {PAYER_LABELS[dischargeCase.primaryInsurance] ||
                dischargeCase.primaryInsurance}
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
                  <DropdownMenuItem
                    onClick={() => handleEditCase(dischargeCase)}
                  >
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
    ],
    [
      canUpdateDischarges,
      canDeleteDischarges,
      handleViewCase,
      handleEditCase,
      handleDeleteCase,
    ]
  );

  if (isLoading && dischargeCases.length === 0) {
    return (
      <LoadingState message="Loading discharge cases..." fullHeight />
    );
  }

  if (fetchError && dischargeCases.length === 0) {
    return (
      <ErrorState
        title="Error Loading Discharge Cases"
        message={fetchError.message || "Failed to load discharge cases"}
        action={{
          label: "Retry",
          onClick: handleRefresh,
          variant: "healthcare",
        }}
      />
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
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
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
          <CardDescription>
            Filter discharge cases by status or search
          </CardDescription>
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
                    {getDischargeStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      {dischargeCases.length === 0 && !isLoading ? (
        <EmptyState
          icon={FileText}
          title="No Discharge Cases"
          description="Get started by creating your first discharge case."
          action={
            canCreateDischarges
              ? {
                  label: "Create Discharge Case",
                  onClick: () => router.push("/hospital-sw/discharges/create"),
                  variant: "healthcare",
                  icon: FileText,
                }
              : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={dischargeCases}
          isLoading={isLoading}
          variant="healthcare"
          enablePagination={true}
          pageSize={limit}
          currentPage={page}
          totalPages={pagination?.pages || 0}
          totalItems={pagination?.total || 0}
          onPageChange={setPage}
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
              Are you sure you want to delete case {caseToDelete?.caseNumber}?
              This action cannot be undone.
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
