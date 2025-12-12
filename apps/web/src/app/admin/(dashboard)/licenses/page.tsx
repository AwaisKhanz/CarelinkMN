"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../use-page-metadata";
import { adminService } from "@/lib/api";
import { License, LicenseStatus } from "@carelink/types";
import { toast } from "sonner";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";
import { RequirePermission } from "@/components/auth/require-permission";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";
import { LoadingState, ErrorState, EmptyState, StatsGrid } from "@/components/shared";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Eye,
  ShieldCheck,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getLicenseStatusBadgeConfig } from "@/lib/utils/admin";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";

function AdminLicensesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();

  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || "all"
  );
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Verification dialog state
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<LicenseStatus>(
    LicenseStatus.ACTIVE
  );
  const [verificationNotes, setVerificationNotes] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    setTitle("License Verification");
    setDescription("Verify and manage provider licenses");
  }, [setTitle, setDescription]);

  const fetchLicenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.getLicenses({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        status:
          statusFilter !== "all" ? (statusFilter as LicenseStatus) : undefined,
        verified:
          verifiedFilter !== "all" ? verifiedFilter === "verified" : undefined,
      });

      if (response.success && response.data) {
        setLicenses(response.data.licenses);
        setPagination((prev) => ({
          ...prev,
          total: response.data!.pagination.total,
          pages: response.data!.pagination.pages,
        }));
      } else {
        setError(response.message || "Failed to load licenses");
        toast.error(response.message || "Failed to load licenses");
      }
    } catch (err) {
      console.error("Error fetching licenses:", err);
      setError(err instanceof Error ? err.message : "Failed to load licenses");
      toast.error("Failed to load licenses");
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    debouncedSearch,
    statusFilter,
    verifiedFilter,
  ]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, statusFilter, verifiedFilter]);

  const handleRefresh = useCallback(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleOpenVerifyDialog = useCallback((license: License) => {
    setSelectedLicense(license);
    setVerificationStatus(license.status);
    setVerificationNotes("");
    setVerifyDialogOpen(true);
  }, []);

  const handleVerifyLicense = useCallback(async () => {
    if (!selectedLicense) return;

    setIsVerifying(true);
    try {
      const response = await adminService.verifyLicense(selectedLicense.id, {
        status: verificationStatus,
        verificationNotes: verificationNotes || undefined,
      });

      if (response.success) {
        toast.success("License verified successfully");
        setVerifyDialogOpen(false);
        setSelectedLicense(null);
        fetchLicenses();
      } else {
        toast.error(response.message || "Failed to verify license");
      }
    } catch (err) {
      console.error("Error verifying license:", err);
      toast.error("Failed to verify license");
    } finally {
      setIsVerifying(false);
    }
  }, [selectedLicense, verificationStatus, verificationNotes, fetchLicenses]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalLicenses = pagination.total;
    const activeLicenses = licenses.filter(
      (l) => l.status === LicenseStatus.ACTIVE
    ).length;
    const pendingLicenses = licenses.filter(
      (l) => l.status === LicenseStatus.PENDING
    ).length;
    const expiredLicenses = licenses.filter(
      (l) => l.status === LicenseStatus.EXPIRED
    ).length;

    return [
      {
        label: "Total Licenses",
        value: totalLicenses.toLocaleString(),
        icon: <ShieldCheck className="h-4 w-4 text-muted-foreground" />,
        description: "All licenses",
      },
      {
        label: "Active",
        value: activeLicenses.toLocaleString(),
        icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />,
        description: "Verified and active",
      },
      {
        label: "Pending",
        value: pendingLicenses.toLocaleString(),
        icon: <Clock className="h-4 w-4 text-muted-foreground" />,
        description: "Awaiting verification",
      },
      {
        label: "Expired",
        value: expiredLicenses.toLocaleString(),
        icon: <AlertTriangle className="h-4 w-4 text-muted-foreground" />,
        description: "Expired licenses",
      },
    ];
  }, [licenses, pagination.total]);

  const columns: ColumnDef<License>[] = useMemo(
    () => [
      {
        accessorKey: "licenseNumber",
        header: "License",
        cell: ({ row }: { row: { original: License } }) => {
          const license = row.original;
          return (
            <div>
              <div className="font-medium">{license.licenseNumber}</div>
              <div className="text-sm text-muted-foreground">
                {license.licenseType?.name || 'Unknown'}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "providerId",
        header: "Provider",
        cell: ({ row }: { row: { original: License } }) => {
          const providerId = row.original.providerId;
          return (
            <div className="font-mono text-sm">
              {providerId.slice(0, 8)}...
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: { row: { original: License } }) => {
          const config = getLicenseStatusBadgeConfig(row.original.status);
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        accessorKey: "expirationDate",
        header: "Expiration",
        cell: ({ row }: { row: { original: License } }) => {
          const expirationDate = row.original.expirationDate;
          if (!expirationDate) return "—";
          const date = new Date(expirationDate);
          const isExpired = date < new Date();
          return (
            <div>
              <div className={isExpired ? "text-destructive" : ""}>
                {format(date, "MMM d, yyyy")}
              </div>
              {isExpired && (
                <div className="text-xs text-destructive">Expired</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "verifiedAt",
        header: "Verified",
        cell: ({ row }: { row: { original: License } }) => {
          const verifiedAt = row.original.verifiedAt;
          return verifiedAt ? format(new Date(verifiedAt), "MMM d, yyyy") : "—";
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: { original: License } }) => {
          const license = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleOpenVerifyDialog(license)}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Verify License
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/admin/licenses/${license.id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router, handleOpenVerifyDialog]
  );

  // Remove the full page loading check that hides filters
  // if (isLoading && licenses.length === 0) {
  //   return <LoadingState message="Loading licenses..." fullHeight />;
  // }

  if (error && licenses.length === 0) {
    return (
      <ErrorState
        title="Error Loading Licenses"
        message={error}
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
      {/* Stats */}
      <StatsGrid stats={stats} columns={4} variant="card" />

      {/* Filters and Search */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Licenses</CardTitle>
          <CardDescription>Verify and manage provider licenses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchFilterBar
                searchQuery={searchInput}
                onSearchChange={setSearchInput}
                searchPlaceholder="Search by license number or provider..."
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={LicenseStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={LicenseStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={LicenseStatus.EXPIRED}>Expired</SelectItem>
                  <SelectItem value={LicenseStatus.SUSPENDED}>
                    Suspended
                  </SelectItem>
                  <SelectItem value={LicenseStatus.REVOKED}>Revoked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isLoading && licenses.length === 0 ? (
            <EmptyState
              className=""
              icon={ShieldCheck}
              title="No licenses found"
              description="No licenses match your current filters"
            />
          ) : (
            <DataTable
              columns={columns}
              data={licenses}
              isLoading={isLoading}
              enablePagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              onPageChange={handlePageChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify License</DialogTitle>
            <DialogDescription>
              Review and verify the license status
            </DialogDescription>
          </DialogHeader>
          {selectedLicense && (
            <div className="space-y-4">
              <div>
                <Label>License Number</Label>
                <p className="text-sm font-medium">
                  {selectedLicense.licenseNumber}
                </p>
              </div>
              <div>
                <Label>License Type</Label>
                <p className="text-sm">{selectedLicense.licenseType?.name || 'Unknown'}</p>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={verificationStatus}
                  onValueChange={(value) =>
                    setVerificationStatus(value as LicenseStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LicenseStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={LicenseStatus.SUSPENDED}>
                      Suspended
                    </SelectItem>
                    <SelectItem value={LicenseStatus.REVOKED}>
                      Revoked
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Verification Notes</Label>
                <Textarea
                  id="notes"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add any notes about the verification..."
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerifyDialogOpen(false)}
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button
              variant="healthcare"
              onClick={handleVerifyLicense}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify License
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminLicensesPage() {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.LICENSES_VERIFY}
      title="Access Restricted"
      description="You don't have permission to verify licenses."
    >
      <AdminLicensesPageContent />
    </RequirePermission>
  );
}
