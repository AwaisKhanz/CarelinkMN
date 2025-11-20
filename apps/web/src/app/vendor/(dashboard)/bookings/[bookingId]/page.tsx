"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { vendorService } from "@/lib/api";
import { usePageMetadata } from "../../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { VENDOR_CAPABILITIES } from "@/lib/permissions/capabilities";
import {
  VendorLoadingState,
  VendorErrorState,
  VendorDetailHeader,
} from "@/components/vendor";
import { TransportBooking, BookingStatus } from "@carelink/types";
import { getBookingStatusBadgeConfig } from "@/lib/utils/vendor";
import { formatVehicleType } from "@/lib/utils/vendor";
import { format } from "date-fns";

export default function VendorBookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId as string;
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [booking, setBooking] = useState<TransportBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [updateData, setUpdateData] = useState({
    status: "" as BookingStatus | "",
    confirmationNumber: "",
    driverName: "",
    driverPhone: "",
    actualCost: "",
  });

  useEffect(() => {
    setTitle("Booking Details");
    setDescription("View and manage booking information");
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

  const fetchBooking = useCallback(async () => {
    if (!vendorId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await vendorService.getVendorBookings(vendorId, {
        limit: 1000, // Get all to find this booking
      });

      if (response.success && response.data) {
        const foundBooking = response.data.bookings.find((b) => b.id === bookingId);
        if (foundBooking) {
          setBooking(foundBooking);
          setUpdateData({
            status: foundBooking.status,
            confirmationNumber: foundBooking.confirmationNumber || "",
            driverName: foundBooking.driverName || "",
            driverPhone: foundBooking.driverPhone || "",
            actualCost: foundBooking.actualCost?.toString() || "",
          });
          setTitle(`Booking ${foundBooking.confirmationNumber || foundBooking.id.slice(0, 8)}`);
        } else {
          setError("Booking not found");
        }
      } else {
        setError("Failed to load booking");
      }
    } catch (err) {
      console.error("Error fetching booking:", err);
      setError(err instanceof Error ? err.message : "Failed to load booking");
    } finally {
      setIsLoading(false);
    }
  }, [vendorId, bookingId, setTitle]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  useEffect(() => {
    if (vendorId) {
      fetchBooking();
    }
  }, [vendorId, fetchBooking]);

  const handleUpdate = async () => {
    if (!vendorId || !bookingId || !updateData.status) return;

    setIsUpdating(true);
    try {
      const response = await vendorService.updateBookingStatus(
        vendorId,
        bookingId,
        {
          status: updateData.status as BookingStatus,
          confirmationNumber: updateData.confirmationNumber || undefined,
          driverName: updateData.driverName || undefined,
          driverPhone: updateData.driverPhone || undefined,
          actualCost: updateData.actualCost ? parseFloat(updateData.actualCost) : undefined,
        }
      );

      if (response.success && response.data) {
        setBooking(response.data);
        toast.success("Booking updated successfully!");
      } else {
        toast.error(response.message || "Failed to update booking");
      }
    } catch (err) {
      console.error("Error updating booking:", err);
      toast.error("Failed to update booking");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <VendorLoadingState message="Loading booking details..." />;
  }

  if (error || !booking) {
    return (
      <VendorErrorState
        message={error || "Booking not found"}
        action={{
          label: "Back to Bookings",
          onClick: () => router.push("/vendor/bookings"),
        }}
      />
    );
  }

  const statusConfig = getBookingStatusBadgeConfig(booking.status);

  return (
    <RequirePermission
      permission={VENDOR_CAPABILITIES.BOOKINGS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view bookings."
    >
      <div className="space-y-6">
        <VendorDetailHeader
          title={`Booking ${booking.confirmationNumber || booking.id.slice(0, 8)}`}
          subtitle={`Booking ID: ${booking.id.slice(0, 8)}`}
          backHref="/vendor/bookings"
          badge={{
            label: statusConfig.label,
            variant: statusConfig.variant,
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Trip Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Pickup Address</div>
                <div className="font-medium">{booking.pickupAddress}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pickup Time</div>
                <div className="font-medium">
                  {format(new Date(booking.pickupTime), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Dropoff Address</div>
                <div className="font-medium">{booking.dropoffAddress}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Vehicle Type</div>
                <div className="font-medium">{formatVehicleType(booking.vehicleType)}</div>
              </div>
              {booking.attendantRequired && (
                <div>
                  <div className="text-sm text-muted-foreground">Attendant Required</div>
                  <div className="font-medium">Yes</div>
                </div>
              )}
              {booking.dischargeCaseId && (
                <div>
                  <div className="text-sm text-muted-foreground">Discharge Case ID</div>
                  <div className="font-medium">{booking.dischargeCaseId.slice(0, 8)}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Booking Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="mt-1">
                  <Badge variant={statusConfig.variant}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
              {booking.confirmationNumber && (
                <div>
                  <div className="text-sm text-muted-foreground">Confirmation Number</div>
                  <div className="font-medium">{booking.confirmationNumber}</div>
                </div>
              )}
              {booking.driverName && (
                <div>
                  <div className="text-sm text-muted-foreground">Driver Name</div>
                  <div className="font-medium">{booking.driverName}</div>
                </div>
              )}
              {booking.driverPhone && (
                <div>
                  <div className="text-sm text-muted-foreground">Driver Phone</div>
                  <div className="font-medium">{booking.driverPhone}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">Payer Type</div>
                <div className="font-medium">{booking.payerType}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Cost Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {booking.estimatedCost && (
              <div>
                <div className="text-sm text-muted-foreground">Estimated Cost</div>
                <div className="font-medium">${booking.estimatedCost.toFixed(2)}</div>
              </div>
            )}
            {booking.actualCost && (
              <div>
                <div className="text-sm text-muted-foreground">Actual Cost</div>
                <div className="font-medium">${booking.actualCost.toFixed(2)}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {booking.equipmentNeeded && booking.equipmentNeeded.length > 0 && (
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Equipment Needed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {booking.equipmentNeeded.map((equipment, index) => (
                  <Badge key={index} variant="outline">
                    {equipment}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Update Booking</CardTitle>
            <CardDescription>Update booking status and details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={updateData.status}
                onValueChange={(value) =>
                  setUpdateData((prev) => ({ ...prev, status: value as BookingStatus }))
                }
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(BookingStatus).map((status) => {
                    const config = getBookingStatusBadgeConfig(status);
                    return (
                      <SelectItem key={status} value={status}>
                        {config.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmationNumber">Confirmation Number</Label>
              <Input
                id="confirmationNumber"
                value={updateData.confirmationNumber}
                onChange={(e) =>
                  setUpdateData((prev) => ({
                    ...prev,
                    confirmationNumber: e.target.value,
                  }))
                }
                disabled={isUpdating}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driverName">Driver Name</Label>
                <Input
                  id="driverName"
                  value={updateData.driverName}
                  onChange={(e) =>
                    setUpdateData((prev) => ({
                      ...prev,
                      driverName: e.target.value,
                    }))
                  }
                  disabled={isUpdating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driverPhone">Driver Phone</Label>
                <Input
                  id="driverPhone"
                  value={updateData.driverPhone}
                  onChange={(e) =>
                    setUpdateData((prev) => ({
                      ...prev,
                      driverPhone: e.target.value,
                    }))
                  }
                  disabled={isUpdating}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="actualCost">Actual Cost</Label>
              <Input
                id="actualCost"
                type="number"
                step="0.01"
                value={updateData.actualCost}
                onChange={(e) =>
                  setUpdateData((prev) => ({
                    ...prev,
                    actualCost: e.target.value,
                  }))
                }
                disabled={isUpdating}
              />
            </div>

            <Button
              variant="healthcare"
              onClick={handleUpdate}
              disabled={isUpdating || !updateData.status}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Booking"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </RequirePermission>
  );
}

