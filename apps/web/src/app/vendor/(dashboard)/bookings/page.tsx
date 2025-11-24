"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Calendar } from "lucide-react";
import { RequirePermission } from "@/components/auth/require-permission";
import { VENDOR_CAPABILITIES } from "@/lib/permissions/capabilities";
import { usePageMetadata } from "../use-page-metadata";
import { vendorService } from "@/lib/api";
import { toast } from "sonner";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared";
import { ColumnDef } from "@tanstack/react-table";
import { TransportBooking, BookingStatus } from "@carelink/types";
import { getBookingStatusBadgeConfig } from "@/lib/utils/vendor";
import { formatVehicleType } from "@/lib/utils/vendor";
import { format } from "date-fns";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookingStatus as BookingStatusEnum } from "@carelink/types";

export default function VendorBookingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<TransportBooking[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 20,
  });
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">(
    "ALL"
  );

  useEffect(() => {
    setTitle("Bookings");
    setDescription("Manage your transport bookings");
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

  const fetchBookings = useCallback(async () => {
    if (!vendorId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await vendorService.getVendorBookings(vendorId, {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        search: searchTerm || undefined,
      });

      if (response.success && response.data) {
        setBookings(response.data.bookings);
        setPagination(response.data.pagination);
      } else {
        setError("Failed to load bookings");
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  }, [vendorId, pagination.page, pagination.limit, statusFilter, searchTerm]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  useEffect(() => {
    if (vendorId) {
      fetchBookings();
    }
  }, [vendorId, fetchBookings]);

  const columns: ColumnDef<TransportBooking>[] = useMemo(
    () => [
      {
        accessorKey: "pickupAddress",
        header: "Pickup",
        cell: ({ row }) => {
          const booking = row.original;
          return (
            <div>
              <div className="font-medium">{booking.pickupAddress}</div>
              <div className="text-sm text-muted-foreground">
                {format(
                  new Date(booking.pickupTime),
                  "MMM d, yyyy 'at' h:mm a"
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "dropoffAddress",
        header: "Dropoff",
        cell: ({ row }) => {
          const booking = row.original;
          return <div className="text-sm">{booking.dropoffAddress}</div>;
        },
      },
      {
        accessorKey: "vehicleType",
        header: "Vehicle",
        cell: ({ row }) => {
          const booking = row.original;
          return formatVehicleType(booking.vehicleType);
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const booking = row.original;
          const statusConfig = getBookingStatusBadgeConfig(booking.status);
          return (
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          );
        },
      },
      {
        accessorKey: "estimatedCost",
        header: "Cost",
        cell: ({ row }) => {
          const booking = row.original;
          const cost = booking.actualCost || booking.estimatedCost;
          return cost ? `$${cost.toFixed(2)}` : "—";
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const booking = row.original;
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/vendor/bookings/${booking.id}`)}
            >
              View
            </Button>
          );
        },
      },
    ],
    [router]
  );

  if (isLoading && !vendorId) {
    return <LoadingState message="Loading bookings..." />;
  }

  if (error && !vendorId) {
    return (
      <ErrorState
        title="Error Loading Bookings"
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
      permission={VENDOR_CAPABILITIES.BOOKINGS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view bookings."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bookings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your transport bookings
            </p>
          </div>
          <Button
            variant="healthcare"
            onClick={() => fetchBookings()}
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
              searchPlaceholder="Search bookings by address, confirmation number, or driver..."
              showFilter={false}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as BookingStatus | "ALL");
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {Object.values(BookingStatusEnum).map((status) => (
                <SelectItem key={status} value={status}>
                  {getBookingStatusBadgeConfig(status).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <LoadingState message="Loading bookings..." />
        ) : error ? (
          <ErrorState
            title="Error Loading Bookings"
            message={error}
            action={{
              label: "Retry",
              onClick: fetchBookings,
              variant: "healthcare",
            }}
          />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No bookings found"
            description="You don't have any bookings yet. Bookings will appear here when transport requests are assigned to you."
          />
        ) : (
          <DataTable
            columns={columns}
            data={bookings}
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
