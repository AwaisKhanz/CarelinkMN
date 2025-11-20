"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../use-page-metadata";
import {
  adminService,
  type AdminComplianceIssue,
  type AdminComplianceSummary,
} from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";
import { RequirePermission } from "@/components/auth/require-permission";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";
import {
  AdminLoadingState,
  AdminErrorState,
  AdminEmptyState,
  AdminStatsGrid,
} from "@/components/admin";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
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
import { SearchFilterBar } from "@/components/ui/search-filter-bar";

function AdminCompliancePageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();

  const [issues, setIssues] = useState<AdminComplianceIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [summary, setSummary] = useState<AdminComplianceSummary | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    setTitle("Compliance Monitoring");
    setDescription("Monitor and manage compliance issues");
  }, [setTitle, setDescription]);

  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.getComplianceIssues({
        page: pagination.page,
        limit: pagination.limit,
        severity: severityFilter !== "all" ? severityFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: debouncedSearch || undefined,
      });

      if (!response.success || !response.data) {
        const message = response.message || "Failed to load compliance issues";
        setError(message);
        toast.error(message);
        setIssues([]);
        setSummary(null);
        setPagination((prev) => ({ ...prev, total: 0, pages: 0 }));
        return;
      }

      const { issues: fetchedIssues, pagination: meta, summary: summaryData } =
        response.data;

      setIssues(fetchedIssues || []);
      setSummary(summaryData ?? null);
      setPagination((prev) => ({
        ...prev,
        total: meta?.total || 0,
        pages: meta?.pages || 0,
      }));
    } catch (err) {
      console.error("Error fetching compliance issues:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load compliance issues"
      );
      toast.error("Failed to load compliance issues");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, severityFilter, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, severityFilter, statusFilter]);

  const handleRefresh = useCallback(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const fallbackSeverity = {
      critical: issues.filter((i) => i.severity === "critical").length,
      high: issues.filter((i) => i.severity === "high").length,
      medium: issues.filter((i) => i.severity === "medium").length,
      low: issues.filter((i) => i.severity === "low").length,
    };

    const fallbackStatus = {
      open: issues.filter((i) => i.status === "open").length,
      resolved: issues.filter((i) => i.status === "resolved").length,
      acknowledged: issues.filter((i) => i.status === "acknowledged").length,
    };

    const totalIssues = summary?.total ?? pagination.total;
    const severityCounts = summary?.bySeverity ?? fallbackSeverity;
    const statusCounts = summary?.byStatus ?? fallbackStatus;

    return [
      {
        label: "Total Issues",
        value: totalIssues.toLocaleString(),
        icon: <AlertTriangle className="h-4 w-4 text-muted-foreground" />,
        description: "All compliance issues",
      },
      {
        label: "Critical",
        value: severityCounts.critical.toLocaleString(),
        icon: <XCircle className="h-4 w-4 text-muted-foreground" />,
        description: "Requires immediate attention",
      },
      {
        label: "Open",
        value: statusCounts.open.toLocaleString(),
        icon: <Clock className="h-4 w-4 text-muted-foreground" />,
        description: "Unresolved issues",
      },
      {
        label: "Resolved",
        value: statusCounts.resolved.toLocaleString(),
        icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />,
        description: "Resolved incidents",
      },
    ];
  }, [issues, pagination.total, summary]);

  const getSeverityBadge = (severity: string) => {
    const configs: Record<
      string,
      {
        label: string;
        variant: "default" | "destructive" | "secondary" | "outline";
      }
    > = {
      critical: { label: "Critical", variant: "destructive" },
      high: { label: "High", variant: "destructive" },
      medium: { label: "Medium", variant: "default" },
      low: { label: "Low", variant: "outline" },
    };
    const config = configs[severity] || { label: severity, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<
      string,
      {
        label: string;
        variant: "default" | "destructive" | "secondary" | "outline";
      }
    > = {
      open: { label: "Open", variant: "destructive" },
      resolved: { label: "Resolved", variant: "default" },
      acknowledged: { label: "Acknowledged", variant: "secondary" },
    };
    const config = configs[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns: ColumnDef<AdminComplianceIssue>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Issue",
        cell: ({ row }: { row: { original: AdminComplianceIssue } }) => {
          const issue = row.original;
          return (
            <div>
              <div className="font-medium">{issue.title}</div>
              <div className="text-sm text-muted-foreground">
                {issue.description}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }: { row: { original: AdminComplianceIssue } }) => {
          return (
            <Badge variant="outline" className="capitalize">
              {row.original.type.replace("_", " ")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "severity",
        header: "Severity",
        cell: ({ row }: { row: { original: AdminComplianceIssue } }) => {
          return getSeverityBadge(row.original.severity);
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: { row: { original: AdminComplianceIssue } }) => {
          return getStatusBadge(row.original.status);
        },
      },
      {
        accessorKey: "createdAt",
        header: "Reported",
        cell: ({ row }: { row: { original: AdminComplianceIssue } }) => {
          return format(new Date(row.original.createdAt), "MMM d, yyyy");
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: { original: AdminComplianceIssue } }) => {
          return (
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                router.push(`/admin/compliance/${row.original.id}`)
              }
            >
              <Eye className="h-4 w-4" />
            </Button>
          );
        },
      },
    ],
    [router]
  );

  if (isLoading && issues.length === 0) {
    return (
      <AdminLoadingState message="Loading compliance issues..." fullHeight />
    );
  }

  if (error && issues.length === 0) {
    return (
      <AdminErrorState
        title="Error Loading Compliance Issues"
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
      <AdminStatsGrid stats={stats} columns={4} />

      {/* Filters and Search */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Compliance Issues</CardTitle>
          <CardDescription>
            Monitor and manage system compliance issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchFilterBar
                searchQuery={searchInput}
                onSearchChange={setSearchInput}
                searchPlaceholder="Search compliance issues..."
              />
            </div>
            <div className="flex gap-2">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {issues.length === 0 ? (
            <AdminEmptyState
              icon={ShieldCheck}
              title="No compliance issues found"
              description="No compliance issues match your current filters"
            />
          ) : (
            <DataTable
              columns={columns}
              data={issues}
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
    </div>
  );
}

export default function AdminCompliancePage() {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.COMPLIANCE_MANAGE}
      title="Access Restricted"
      description="You don't have permission to view compliance issues."
    >
      <AdminCompliancePageContent />
    </RequirePermission>
  );
}
