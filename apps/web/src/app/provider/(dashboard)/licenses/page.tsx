"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FileText,
  Calendar,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Upload,
  X,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { providerService, licenseTypeService } from "@/lib/api";
import { License, LicenseStatus, UpdateLicenseData, LicenseType } from "@carelink/types";
import { usePageMetadata } from "../use-page-metadata";
import { usePermissions } from "@/hooks/use-permissions";
import { useProviderId } from "@/hooks/use-provider-data";
import { format } from "date-fns";
import {
  STATES_MAP,
  US_STATES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { LicenseStatusBadge } from "@/components/ui/license-status-badge";
import { StatsCard } from "@/components/ui/stats-card";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { getExpirationStatus as calculateExpirationStatus } from "@/lib/utils/expiration-status";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { RequirePermission } from "@/components/auth/require-permission";
import { PROVIDER_CAPABILITIES } from "@/lib/permissions/provider-capabilities";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { uploadService } from "@/lib/api";
import { CreateLicenseData } from "@carelink/types";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionsToolbar } from "@/components/ui/bulk-actions-toolbar";

function ProviderLicensesPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const { canManageLicenses } = usePermissions();

  // Use provider ID from context hook directly
  const providerId = useProviderId();

  const [licenses, setLicenses] = useState<License[]>([]);
  const [allLicenses, setAllLicenses] = useState<License[]>([]); // Store all licenses from API
  const [isLoading, setIsLoading] = useState(true); // Initial load only
  const [isSearching, setIsSearching] = useState(false); // Search/filter loading
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [licenseToDelete, setLicenseToDelete] = useState<License | null>(null);
  const [licenseToRenew, setLicenseToRenew] = useState<License | null>(null);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [newExpirationDate, setNewExpirationDate] = useState("");
  const [isRenewing, setIsRenewing] = useState(false);
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);
  const [bulkUploadFiles, setBulkUploadFiles] = useState<
    Array<{
      file: File;
      id: string;
      licenseTypeId: string;
      licenseNumber: string;
      issueDate: string;
      expirationDate: string;
      documentUrl?: string;
      isUploading?: boolean;
      error?: string;
    }>
  >([]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [selectedLicenses, setSelectedLicenses] = useState<Set<string>>(
    new Set()
  );
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState<LicenseStatus | "">(
    ""
  );
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([]);
  const [isUpdatingBulkStatus, setIsUpdatingBulkStatus] = useState(false);

  useEffect(() => {
    setTitle("License Management");
    setDescription("Manage your provider licenses and track expiration dates.");
  }, [setTitle, setDescription]);

  // Initial load and when status filter changes
  useEffect(() => {
    if (providerId) {
      fetchLicenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, statusFilter]);

  // Apply search filter when debounced search query changes
  useEffect(() => {
    if (providerId && allLicenses.length > 0) {
      applyFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery]);

  // Fetch license types on mount
  useEffect(() => {
    const fetchLicenseTypes = async () => {
      try {
        const response = await licenseTypeService.getAllLicenseTypes();
        if (response.success && response.data) {
          setLicenseTypes(response.data);
        }
      } catch (error) {
        console.error('Error fetching license types:', error);
      }
    };
    fetchLicenseTypes();
  }, []);

  const fetchLicenses = async () => {
    if (!providerId) return;

    setIsLoading(true);
    try {
      const response = await providerService.getProviderLicenses(
        providerId,
        statusFilter !== "all" ? (statusFilter as LicenseStatus) : undefined
      );

      if (response.success && response.data) {
        setAllLicenses(response.data);
        // Apply filters after fetching
        applyFilters(response.data);
      } else {
        toast.error(response.message || "Failed to load licenses.");
      }
    } catch (err) {
      console.error("Error fetching licenses:", err);
      toast.error("Failed to load licenses.");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (licensesToFilter: License[] = allLicenses) => {
    setIsSearching(true);

    // Small delay to show loading state for better UX
    setTimeout(() => {
      let filteredLicenses = licensesToFilter;

      // Apply status filter (already applied in API call, but reapply for consistency)
      if (statusFilter !== "all") {
        filteredLicenses = filteredLicenses.filter(
          (license) => license.status === statusFilter
        );
      }

      // Apply search filter
      if (debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.toLowerCase();
        filteredLicenses = filteredLicenses.filter(
          (license) =>
            license.licenseNumber?.toLowerCase().includes(query) ||
            license.licenseType?.name?.toLowerCase().includes(query)
        );
      }

      setLicenses(filteredLicenses);
      setIsSearching(false);
    }, 100);
  };

  const handleDelete = async () => {
    if (!licenseToDelete || !providerId) return;

    try {
      const response = await providerService.deleteProviderLicense(
        providerId,
        licenseToDelete.id
      );

      if (response.success) {
        toast.success("License deleted successfully");
        setDeleteDialogOpen(false);
        setLicenseToDelete(null);
        await fetchLicenses();
      } else {
        toast.error(response.message || "Failed to delete license.");
      }
    } catch (err) {
      console.error("Error deleting license:", err);
      toast.error("Failed to delete license.");
    }
  };

  const handleRenew = async () => {
    if (!licenseToRenew || !providerId || !newExpirationDate) return;

    setIsRenewing(true);
    try {
      const updateData: UpdateLicenseData = {
        expirationDate: newExpirationDate,
      };

      const response = await providerService.updateProviderLicense(
        providerId,
        licenseToRenew.id,
        updateData
      );

      if (response.success) {
        toast.success("License renewed successfully");
        setRenewDialogOpen(false);
        setLicenseToRenew(null);
        setNewExpirationDate("");
        await fetchLicenses();
      } else {
        toast.error(response.message || "Failed to renew license.");
      }
    } catch (err) {
      console.error("Error renewing license:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to renew license"
      );
    } finally {
      setIsRenewing(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!providerId || bulkUploadFiles.length === 0) return;

    setIsBulkUploading(true);

    try {
      // Upload files and create licenses
      const results = await Promise.allSettled(
        bulkUploadFiles.map(async (item) => {
          // Upload file first
          const uploadResponse = await uploadService.uploadFile(
            item.file,
            "license",
            "licenses"
          );

          // Create license with uploaded document URL
          const licenseData: CreateLicenseData = {
            licenseTypeId: item.licenseTypeId,
            licenseNumber: item.licenseNumber,
            issueDate: item.issueDate,
            expirationDate: item.expirationDate,
            documentUrl: uploadResponse.url,
          };

          return await providerService.createProviderLicense(
            providerId,
            licenseData
          );
        })
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (successful > 0) {
        toast.success(
          `Successfully uploaded ${successful} license${successful > 1 ? "s" : ""}`
        );
      }
      if (failed > 0) {
        toast.error(
          `Failed to upload ${failed} license${failed > 1 ? "s" : ""}`
        );
      }

      // Reset and close dialog
      setBulkUploadFiles([]);
      setBulkUploadDialogOpen(false);
      await fetchLicenses();
    } catch (err) {
      console.error("Error uploading licenses:", err);
      toast.error("Failed to upload licenses");
    } finally {
      setIsBulkUploading(false);
    }
  };

  const getStatusBadge = (status: LicenseStatus) => {
    return <LicenseStatusBadge status={status} className="whitespace-nowrap" />;
  };

  const getExpirationStatus = (expirationDate: string) => {
    return calculateExpirationStatus(expirationDate, 30);
  };

  const getStats = () => {
    // Use allLicenses for stats (not filtered licenses) so stats are always accurate
    const licensesForStats = allLicenses.length > 0 ? allLicenses : licenses;
    const active = licensesForStats.filter(
      (l) => l.status === LicenseStatus.ACTIVE
    ).length;
    const pending = licensesForStats.filter(
      (l) => l.status === LicenseStatus.PENDING
    ).length;
    const expired = licensesForStats.filter(
      (l) => l.status === LicenseStatus.EXPIRED
    ).length;
    const expiringSoon = licensesForStats.filter((l) => {
      if (l.status !== LicenseStatus.ACTIVE) return false;
      const expirationStatus = calculateExpirationStatus(l.expirationDate, 30);
      return expirationStatus.status === "expiring";
    }).length;

    return {
      active,
      pending,
      expired,
      expiringSoon,
      total: licensesForStats.length,
    };
  };

  const stats = getStats();

  // Handle selection
  const handleToggleSelection = (licenseId: string) => {
    setSelectedLicenses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(licenseId)) {
        newSet.delete(licenseId);
      } else {
        newSet.add(licenseId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedLicenses(new Set(licenses.map((l) => l.id)));
  };

  const handleDeselectAll = () => {
    setSelectedLicenses(new Set());
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async () => {
    if (selectedLicenses.size === 0 || !bulkStatusValue || !providerId) return;

    setIsUpdatingBulkStatus(true);
    try {
      const licenseIds = Array.from(selectedLicenses);
      const results = await Promise.allSettled(
        licenseIds.map((licenseId) =>
          providerService.updateProviderLicense(providerId, licenseId, {
            status: bulkStatusValue,
          } as UpdateLicenseData & { status: LicenseStatus })
        )
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (successful > 0) {
        toast.success(
          `Updated status for ${successful} license${successful > 1 ? "s" : ""}`
        );
        setBulkStatusDialogOpen(false);
        setBulkStatusValue("");
        setSelectedLicenses(new Set());
        await fetchLicenses();
      }
      if (failed > 0) {
        toast.error(
          `Failed to update ${failed} license${failed > 1 ? "s" : ""}`
        );
      }
    } catch (err) {
      console.error("Error updating bulk status:", err);
      toast.error("Failed to update license statuses");
    } finally {
      setIsUpdatingBulkStatus(false);
    }
  };

  if (isLoading && licenses.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading licenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">License Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your provider licenses and track expiration dates
          </p>
        </div>
        {canManageLicenses && (
          <div className="flex gap-2">
            <Dialog
              open={bulkUploadDialogOpen}
              onOpenChange={setBulkUploadDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Bulk License Upload</DialogTitle>
                  <DialogDescription>
                    Upload multiple license documents at once. Select files and
                    fill in the details for each license.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                  <div className="space-y-4">
                    {/* File Selector */}
                    {bulkUploadFiles.length === 0 && (
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <Label
                          htmlFor="bulk-upload-input"
                          className="cursor-pointer"
                        >
                          <span className="text-primary hover:underline">
                            Click to select files
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            or drag and drop
                          </span>
                        </Label>
                        <Input
                          id="bulk-upload-input"
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setBulkUploadFiles(
                              files.map((file) => ({
                                file,
                                id: Math.random().toString(36).substring(7),
                                licenseTypeId: "",
                                licenseNumber: "",
                                issueDate: "",
                                expirationDate: "",
                              }))
                            );
                          }}
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          PDF, JPG, PNG up to 10MB each
                        </p>
                      </div>
                    )}

                    {/* License Forms */}
                    {bulkUploadFiles.map((item, index) => (
                      <Card key={item.id} variant="healthcare" className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium">
                                {item.file.name}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                ({(item.file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setBulkUploadFiles((prev) =>
                                  prev.filter((f) => f.id !== item.id)
                                );
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>License Type *</Label>
                              <Select
                                value={item.licenseTypeId}
                                onValueChange={(value) => {
                                  setBulkUploadFiles((prev) =>
                                    prev.map((f) =>
                                      f.id === item.id
                                        ? { ...f, licenseTypeId: value }
                                        : f
                                    )
                                  );
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select license type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {licenseTypes.map((type) => (
                                    <SelectItem
                                      key={type.id}
                                      value={type.id}
                                    >
                                      {type.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>License Number *</Label>
                              <Input
                                value={item.licenseNumber}
                                onChange={(e) => {
                                  setBulkUploadFiles((prev) =>
                                    prev.map((f) =>
                                      f.id === item.id
                                        ? {
                                            ...f,
                                            licenseNumber: e.target.value,
                                          }
                                        : f
                                    )
                                  );
                                }}
                                placeholder="Enter license number"
                              />
                            </div>

                            <div>
                              <Label>Issue Date *</Label>
                              <Input
                                type="date"
                                value={item.issueDate}
                                onChange={(e) => {
                                  setBulkUploadFiles((prev) =>
                                    prev.map((f) =>
                                      f.id === item.id
                                        ? { ...f, issueDate: e.target.value }
                                        : f
                                    )
                                  );
                                }}
                              />
                            </div>

                            <div>
                              <Label>Expiration Date *</Label>
                              <Input
                                type="date"
                                value={item.expirationDate}
                                onChange={(e) => {
                                  setBulkUploadFiles((prev) =>
                                    prev.map((f) =>
                                      f.id === item.id
                                        ? {
                                            ...f,
                                            expirationDate: e.target.value,
                                          }
                                        : f
                                    )
                                  );
                                }}
                              />
                            </div>
                          </div>

                          {item.error && (
                            <p className="text-sm text-destructive">
                              {item.error}
                            </p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBulkUploadDialogOpen(false);
                      setBulkUploadFiles([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkUpload}
                    disabled={
                      isBulkUploading ||
                      bulkUploadFiles.length === 0 ||
                      bulkUploadFiles.some(
                        (f) =>
                          !f.licenseTypeId ||
                          !f.licenseNumber ||
                          !f.issueDate ||
                          !f.expirationDate
                      )
                    }
                  >
                    {isBulkUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload {bulkUploadFiles.length} License
                        {bulkUploadFiles.length !== 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {canManageLicenses && (
              <Button onClick={() => router.push("/provider/licenses/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Add License
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard title="Total Licenses" value={stats.total} />
        <StatsCard
          title="Active"
          value={stats.active}
          valueClassName="text-success"
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          valueClassName="text-warning"
        />
        <StatsCard
          title="Expired"
          value={stats.expired}
          valueClassName="text-destructive"
        />
        <StatsCard
          title="Expiring Soon"
          value={stats.expiringSoon}
          valueClassName="text-warning"
        />
      </div>

      {/* Filters */}
      <Card variant="healthcare">
        <CardContent className="pt-6">
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search by license number, type, or state..."
            filterValue={statusFilter}
            onFilterChange={setStatusFilter}
            filterOptions={[
              { value: "all", label: "All Status" },
              { value: LicenseStatus.ACTIVE, label: "Active" },
              { value: LicenseStatus.PENDING, label: "Pending" },
              { value: LicenseStatus.EXPIRED, label: "Expired" },
              { value: LicenseStatus.SUSPENDED, label: "Suspended" },
              { value: LicenseStatus.REVOKED, label: "Revoked" },
            ]}
            filterPlaceholder="Filter by status"
          />
        </CardContent>
      </Card>

      {/* Licenses List */}
      {isSearching ? (
        <Card variant="healthcare">
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <p className="text-muted-foreground">Searching licenses...</p>
            </div>
          </CardContent>
        </Card>
      ) : licenses.length === 0 ? (
        <Card variant="healthcare">
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No licenses found</h3>
              <p className="text-muted-foreground mb-4">
                {debouncedSearchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by adding your first license"}
              </p>
              {!debouncedSearchQuery &&
                statusFilter === "all" &&
                canManageLicenses && (
                  <Button
                    onClick={() => router.push("/provider/licenses/create")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add License
                  </Button>
                )}
              {!debouncedSearchQuery &&
                statusFilter === "all" &&
                !canManageLicenses && (
                  <p className="text-sm text-muted-foreground">
                    Only provider owners can add licenses. Contact your provider
                    owner to add a new license.
                  </p>
                )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Bulk Actions Toolbar */}
          {canManageLicenses && selectedLicenses.size > 0 && (
            <BulkActionsToolbar
              selectedCount={selectedLicenses.size}
              totalCount={licenses.length}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              actions={[
                {
                  label: "Update Status",
                  icon: <RefreshCw className="h-4 w-4" />,
                  onClick: () => setBulkStatusDialogOpen(true),
                  variant: "outline",
                },
              ]}
            />
          )}

          <div className="grid gap-4">
            {licenses.map((license) => {
              const expirationStatus = getExpirationStatus(
                license.expirationDate
              );
              const isExpiringSoon = expirationStatus.status === "expiring";

              return (
                <Card
                  key={license.id}
                  variant="healthcare"
                  className={cn(
                    "transition-all",
                    isExpiringSoon && "border-warning",
                    license.status === LicenseStatus.EXPIRED &&
                      "border-destructive",
                    selectedLicenses.has(license.id) && "ring-2 ring-primary"
                  )}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {canManageLicenses && (
                        <div className="flex items-center">
                          <Checkbox
                            checked={selectedLicenses.has(license.id)}
                            onCheckedChange={() =>
                              handleToggleSelection(license.id)
                            }
                            aria-label={`Select ${license.licenseNumber}`}
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="text-sm text-muted-foreground">
                            {license.licenseType?.name || "Unknown"}
                          </div>
                          <LicenseStatusBadge
                            status={license.status}
                            className="whitespace-nowrap"
                          />
                          {license.status === LicenseStatus.PENDING && (
                            <Badge variant="outline" className="text-xs">
                              Awaiting Admin Review
                            </Badge>
                          )}
                          {license.status === LicenseStatus.ACTIVE &&
                            license.verifiedAt && (
                              <Badge
                                variant="outline"
                                className="text-xs text-success"
                              >
                                Approved
                              </Badge>
                            )}
                          {(license.status === LicenseStatus.SUSPENDED ||
                            license.status === LicenseStatus.REVOKED) && (
                            <Badge
                              variant="outline"
                              className="text-xs text-destructive"
                            >
                              Review Required
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">License #:</span>
                            <span>{license.licenseNumber}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">Issue Date:</span>
                            <span>
                              {format(
                                new Date(license.issueDate),
                                "MMM d, yyyy"
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">Expires:</span>
                            <span
                              className={cn(
                                "font-semibold",
                                expirationStatus.color
                              )}
                            >
                              {format(
                                new Date(license.expirationDate),
                                "MMM d, yyyy"
                              )}
                              {expirationStatus.status === "expiring" && (
                                <span className="ml-1">
                                  ({expirationStatus.days} days)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        {license.verifiedAt && (
                          <div className="text-xs text-muted-foreground">
                            Verified on{" "}
                            {format(
                              new Date(license.verifiedAt),
                              "MMM d, yyyy"
                            )}
                            {license.verifiedBy && " by admin"}
                          </div>
                        )}
                        {license.status === LicenseStatus.PENDING &&
                          !license.verifiedAt && (
                            <div className="text-xs text-warning">
                              ⏳ Awaiting admin review and verification
                            </div>
                          )}
                      </div>
                      <div className="flex items-center gap-2">
                        {license.documentUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(license.documentUrl, "_blank")
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Document
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canManageLicenses && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/provider/licenses/${license.id}/edit`
                                    )
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit License
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setLicenseToRenew(license);
                                    // Set default new expiration date to 1 year from current expiration
                                    const currentExpiration = new Date(
                                      license.expirationDate
                                    );
                                    const newExpiration = new Date(
                                      currentExpiration
                                    );
                                    newExpiration.setFullYear(
                                      newExpiration.getFullYear() + 1
                                    );
                                    setNewExpirationDate(
                                      newExpiration.toISOString().split("T")[0]
                                    );
                                    setRenewDialogOpen(true);
                                  }}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Renew License
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setLicenseToDelete(license);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete License
                                </DropdownMenuItem>
                              </>
                            )}
                            {!canManageLicenses && (
                              <DropdownMenuItem disabled>
                                <Eye className="h-4 w-4 mr-2" />
                                View Only (Owner Only)
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete License"
        description="Are you sure you want to delete this license? This action cannot be undone."
        itemDetails={
          licenseToDelete ? (
            <>
              <strong>
                {licenseToDelete.licenseType?.name || "Unknown"}
              </strong>
              <br />
              License #: {licenseToDelete.licenseNumber}
            </>
          ) : undefined
        }
        onConfirm={handleDelete}
        confirmLabel="Delete"
        variant="destructive"
      />

      {/* Bulk Status Update Dialog */}
      <Dialog
        open={bulkStatusDialogOpen}
        onOpenChange={setBulkStatusDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update License Status</DialogTitle>
            <DialogDescription>
              Update the status for {selectedLicenses.size} selected license
              {selectedLicenses.size !== 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-status">New Status</Label>
              <Select
                value={bulkStatusValue}
                onValueChange={(value) =>
                  setBulkStatusValue(value as LicenseStatus)
                }
              >
                <SelectTrigger id="bulk-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LicenseStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={LicenseStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={LicenseStatus.EXPIRED}>Expired</SelectItem>
                  <SelectItem value={LicenseStatus.SUSPENDED}>
                    Suspended
                  </SelectItem>
                  <SelectItem value={LicenseStatus.REVOKED}>Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBulkStatusDialogOpen(false);
                  setBulkStatusValue("");
                }}
                disabled={isUpdatingBulkStatus}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkStatusUpdate}
                disabled={!bulkStatusValue || isUpdatingBulkStatus}
                variant="healthcare"
              >
                {isUpdatingBulkStatus ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update {selectedLicenses.size} License
                    {selectedLicenses.size !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Renew License Dialog */}
      <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew License</DialogTitle>
            <DialogDescription>
              Extend the expiration date for this license
            </DialogDescription>
          </DialogHeader>
          {licenseToRenew && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  License Type:{" "}
                  <span className="font-medium text-foreground">
                    {licenseToRenew.licenseType?.name || "Unknown"}
                  </span>
                </p>
              </div>
              <div>
                <Label>Current Expiration Date</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(
                    new Date(licenseToRenew.expirationDate),
                    "MMM d, yyyy"
                  )}
                </p>
              </div>
              <div>
                <Label htmlFor="new-expiration-date">
                  New Expiration Date *
                </Label>
                <Input
                  id="new-expiration-date"
                  type="date"
                  value={newExpirationDate}
                  onChange={(e) => setNewExpirationDate(e.target.value)}
                  min={
                    new Date(licenseToRenew.expirationDate)
                      .toISOString()
                      .split("T")[0]
                  }
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The new expiration date must be after the current expiration
                  date
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRenewDialogOpen(false);
                    setLicenseToRenew(null);
                    setNewExpirationDate("");
                  }}
                  disabled={isRenewing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRenew}
                  disabled={
                    isRenewing ||
                    !newExpirationDate ||
                    new Date(newExpirationDate) <=
                      new Date(licenseToRenew.expirationDate)
                  }
                >
                  {isRenewing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Renewing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Renew License
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProviderLicensesPage() {
  return (
    <RequirePermission
      permission={PROVIDER_CAPABILITIES.LICENSES_MANAGE}
      title="Access Restricted"
      description="You don't have permission to view licenses. Please contact your organization administrator if you need access."
    >
      <ProviderLicensesPageContent />
    </RequirePermission>
  );
}
