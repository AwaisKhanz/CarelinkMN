"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { apiService } from "@/lib/api/config";
import { toast } from "sonner";
import { OnboardingReviewStatus } from "@carelink/types";
import { usePageMetadata } from "../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";

interface OnboardingSubmission {
  id: string;
  providerId: string;
  currentStep: number;
  isComplete: boolean;
  submittedAt: string;
  adminReviewStatus: OnboardingReviewStatus;
  provider: {
    organization: {
      name: string;
      email: string;
      phone: string;
      type: string;
    };
  };
}

function OnboardingListPageContent() {
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const [data, setData] = useState<OnboardingSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    setTitle("Onboarding Reviews");
    setDescription("Review and approve provider onboarding submissions");
    fetchSubmissions();
  }, [setTitle, setDescription]);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.get<{
        submissions: OnboardingSubmission[];
        pagination: any;
      }>("/api/admin/onboarding", {
        params: {
          limit: 100, // Fetch all for now, implement server-side pagination later if needed
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      });

      if (response.success && response.data) {
        setData(response.data.submissions);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to load onboarding submissions");
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch when status filter changes
  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const getStatusBadge = (status: OnboardingReviewStatus) => {
    switch (status) {
      case OnboardingReviewStatus.APPROVED:
        return (
          <Badge variant="success" className="flex items-center gap-1 w-fit">
            <CheckCircle className="w-3 h-3" /> Approved
          </Badge>
        );
      case OnboardingReviewStatus.REJECTED:
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" /> Rejected
          </Badge>
        );
      case OnboardingReviewStatus.NEEDS_CHANGES:
        return (
          <Badge variant="warning" className="flex items-center gap-1 w-fit">
            <AlertCircle className="w-3 h-3" /> Needs Changes
          </Badge>
        );
      case OnboardingReviewStatus.IN_REVIEW:
        return (
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <Eye className="w-3 h-3" /> In Review
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        );
    }
  };

  const columns: ColumnDef<OnboardingSubmission>[] = [
    {
      accessorKey: "provider.organization.name",
      header: "Organization",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.original.provider?.organization?.name || "N/A"}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.original.provider?.organization?.type || "Provider"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "provider.organization.email",
      header: "Contact",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm">
            {row.original.provider?.organization?.email || "N/A"}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.original.provider?.organization?.phone || "N/A"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted",
      cell: ({ row }) => {
        const date = row.getValue("submittedAt") as string;
        return date ? format(new Date(date), "MMM d, yyyy") : "N/A";
      },
    },
    {
      accessorKey: "adminReviewStatus",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("adminReviewStatus")),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const submission = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push(`/admin/onboarding/${submission.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Review Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(submission.id);
                  toast.success("ID copied to clipboard");
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Copy ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={OnboardingReviewStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={OnboardingReviewStatus.IN_REVIEW}>In Review</SelectItem>
              <SelectItem value={OnboardingReviewStatus.APPROVED}>Approved</SelectItem>
              <SelectItem value={OnboardingReviewStatus.NEEDS_CHANGES}>Needs Changes</SelectItem>
              <SelectItem value={OnboardingReviewStatus.REJECTED}>Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="p-0">
          {/* Header content if needed */}
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      {isLoading ? "Loading..." : "No submissions found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4 px-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OnboardingListPage() {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.SYSTEM_MANAGE}
      title="Access Restricted"
      description="You don't have permission to view onboarding submissions."
    >
      <OnboardingListPageContent />
    </RequirePermission>
  );
}
