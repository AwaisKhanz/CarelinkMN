"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/contexts/socket-context";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, FileText } from "lucide-react";
import { RequirePermission } from "@/components/auth/require-permission";
import { VENDOR_CAPABILITIES } from "@/lib/permissions/capabilities";
import { usePageMetadata } from "../use-page-metadata";
import { vendorService } from "@/lib/api";
import { toast } from "sonner";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared";
import { ColumnDef } from "@tanstack/react-table";
import { VendorLead, LeadStatus, NotificationType } from "@carelink/types";
import { getLeadStatusBadgeConfig } from "@/lib/utils/vendor";
import { formatLeadSource } from "@/lib/utils/vendor";
import { format } from "date-fns";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadStatus as LeadStatusEnum } from "@carelink/types";
import { LEAD_SOURCES } from "@/lib/constants/vendor";

export default function VendorLeadsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<VendorLead[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 20,
  });
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");

  useEffect(() => {
    setTitle("Leads");
    setDescription("Manage and track your vendor leads");
  }, [setTitle, setDescription]);

  const fetchVendor = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await vendorService.getVendorByUserId(user.id);
      if (response.success && response.data) {
        setVendorId(response.data.id);
      }
    } catch (err) {
      console.error("Error fetching vendor:", err);
    }
  }, [user?.id]);

  const fetchLeads = useCallback(async () => {
    if (!vendorId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await vendorService.getVendorLeads(vendorId, {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        source: sourceFilter !== "ALL" ? sourceFilter : undefined,
        search: searchTerm || undefined,
      });

      if (response.success && response.data) {
        setLeads(response.data.leads);
        setPagination(response.data.pagination);
      } else {
        setError("Failed to load leads");
      }
    } catch (err) {
      console.error("Error fetching leads:", err);
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setIsLoading(false);
    }
  }, [
    vendorId,
    pagination.page,
    pagination.limit,
    statusFilter,
    sourceFilter,
    searchTerm,
  ]);

  // Listen for real-time updates
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: any) => {
      // Refresh list on relevant notifications
      if (notification.type === NotificationType.NEW_LEAD) {
        fetchLeads();
      }
    };

    socket.on("notification:new", handleNotification);

    return () => {
      socket.off("notification:new", handleNotification);
    };
  }, [socket, fetchLeads]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  useEffect(() => {
    if (vendorId) {
      fetchLeads();
    }
  }, [vendorId, fetchLeads]);

  const columns: ColumnDef<VendorLead>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const lead = row.original;
          return (
            <div>
              <div className="font-medium">{lead.name}</div>
              <div className="text-sm text-muted-foreground">{lead.email}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => {
          const lead = row.original;
          return lead.phone || <span className="text-muted-foreground">—</span>;
        },
      },
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => {
          const lead = row.original;
          return formatLeadSource(lead.source);
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const lead = row.original;
          const statusConfig = getLeadStatusBadgeConfig(lead.status);
          return (
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          );
        },
      },
      {
        accessorKey: "servicesInterested",
        header: "Services",
        cell: ({ row }) => {
          const lead = row.original;
          return (
            <div className="text-sm">
              {lead.servicesInterested.length > 0
                ? lead.servicesInterested.slice(0, 2).join(", ") +
                  (lead.servicesInterested.length > 2 ? "..." : "")
                : "—"}
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => {
          const lead = row.original;
          return format(new Date(lead.createdAt), "MMM d, yyyy");
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const lead = row.original;
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/vendor/leads/${lead.id}`)}
            >
              View
            </Button>
          );
        },
      },
    ],
    [router]
  );

  // Remove the full page loading check that hides filters
  // if (isLoading && !vendorId) {
  //   return <LoadingState message="Loading leads..." />;
  // }

  if (error && !vendorId) {
    return (
      <ErrorState
        title="Error Loading Leads"
        message={error}
        action={{
          label: "Retry",
          onClick: fetchVendor,
          variant: "healthcare",
        }}
      />
    );
  }

  return (
    <RequirePermission
      permission={VENDOR_CAPABILITIES.LEADS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view leads."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Leads</h1>
            <p className="text-sm text-muted-foreground">
              Manage and track your vendor leads
            </p>
          </div>
          <Button
            variant="healthcare"
            onClick={() => fetchLeads()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchFilterBar
              searchQuery={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search leads by name, email, or phone..."
              showFilter={false}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as LeadStatus | "ALL");
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {Object.values(LeadStatusEnum).map((status) => (
                <SelectItem key={status} value={status}>
                  {getLeadStatusBadgeConfig(status).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sourceFilter}
            onValueChange={(value) => {
              setSourceFilter(value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Sources</SelectItem>
              {LEAD_SOURCES.map((source) => (
                <SelectItem key={source.value} value={source.value}>
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <ErrorState
            title="Error Loading Leads"
            message={error}
            action={{
              label: "Retry",
              onClick: fetchLeads,
              variant: "healthcare",
            }}
          />
        ) : leads.length === 0 && !isLoading ? (
          <EmptyState
            icon={FileText}
            title="No leads found"
            description="You don't have any leads yet. Leads will appear here when customers express interest in your services."
          />
        ) : (
          <DataTable
            columns={columns}
            data={leads}
            isLoading={isLoading}
            currentPage={pagination.page}
            pageSize={pagination.limit}
            totalItems={pagination.total}
            totalPages={pagination.pages}
            onPageChange={(page) =>
              setPagination((prev) => ({ ...prev, page }))
            }
          />
        )}
      </div>
    </RequirePermission>
  );
}
