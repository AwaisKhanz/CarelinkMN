"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../use-page-metadata";
import { adminService, type AdminAuditLogEntry } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { RequirePermission } from "@/components/auth/require-permission";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Eye,
  FileText,
  Download,
  Calendar,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuditLogEntry = AdminAuditLogEntry;

function AdminAuditLogsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    setTitle("Audit Logs");
    setDescription("View system audit logs and activity");
  }, [setTitle, setDescription]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.getAuditLogs({
        page: pagination.page,
        limit: pagination.limit,
        action: actionFilter !== "all" ? actionFilter : undefined,
        resourceType: resourceTypeFilter !== "all" ? resourceTypeFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (!response.success || !response.data) {
        const message = response.message || "Failed to load audit logs";
        setError(message);
        toast.error(message);
        setLogs([]);
        setPagination((prev) => ({ ...prev, total: 0, pages: 0 }));
        return;
      }

      const { logs: fetchedLogs, pagination: meta } = response.data;
      setLogs(fetchedLogs || []);
      setPagination((prev) => ({
        ...prev,
        page: meta?.page ?? prev.page,
        limit: meta?.limit ?? prev.limit,
        total: meta?.total ?? 0,
        pages: meta?.pages ?? 0,
      }));
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
      toast.error("Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, actionFilter, resourceTypeFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [actionFilter, resourceTypeFilter, startDate, endDate]);

  const handleRefresh = useCallback(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const columns: ColumnDef<AuditLogEntry>[] = useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: "Timestamp",
        cell: ({ row }: { row: { original: AuditLogEntry } }) => {
          return (
            <div>
              <div>{format(new Date(row.original.createdAt), "MMM d, yyyy")}</div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(row.original.createdAt), "h:mm:ss a")}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "user",
        header: "User",
        cell: ({ row }: { row: { original: AuditLogEntry } }) => {
          const log = row.original;
          if (log.user) {
            return (
              <div>
                <div className="font-medium">
                  {log.user.firstName} {log.user.lastName}
                </div>
                <div className="text-sm text-muted-foreground">{log.user.email}</div>
              </div>
            );
          }
          return log.userId ? `User ${log.userId.slice(0, 8)}...` : "System";
        },
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }: { row: { original: AuditLogEntry } }) => {
          return (
            <Badge variant="outline" className="capitalize">
              {row.original.action.replace(".", " ")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "resourceType",
        header: "Resource",
        cell: ({ row }: { row: { original: AuditLogEntry } }) => {
          return (
            <div>
              <div className="font-medium">{row.original.resourceType}</div>
              <div className="text-sm text-muted-foreground">
                {row.original.resourceId
                  ? `${row.original.resourceId.slice(0, 8)}...`
                  : "N/A"}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "result",
        header: "Result",
        cell: ({ row }: { row: { original: AuditLogEntry } }) => {
          const result = row.original.result;
          return (
            <Badge
              variant={
                result?.toLowerCase() === "success" ? "default" : "destructive"
              }
            >
              {result?.toLowerCase()}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: { original: AuditLogEntry } }) => {
          return (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/admin/audit-logs/${row.original.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          );
        },
      },
    ],
    [router]
  );

  if (isLoading && logs.length === 0) {
    return <LoadingState message="Loading audit logs..." fullHeight />;
  }

  if (error && logs.length === 0) {
    return (
      <ErrorState
        title="Error Loading Audit Logs"
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
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>View system audit logs and activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                </SelectContent>
              </Select>
              <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Organization">Organization</SelectItem>
                  <SelectItem value="License">License</SelectItem>
                  <SelectItem value="Provider">Provider</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {logs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No audit logs found"
              description="No audit logs match your current filters"
            />
          ) : (
            <DataTable
              columns={columns}
              data={logs}
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

export default function AdminAuditLogsPage() {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.AUDIT_VIEW}
      title="Access Restricted"
      description="You don't have permission to view audit logs."
    >
      <AdminAuditLogsPageContent />
    </RequirePermission>
  );
}

