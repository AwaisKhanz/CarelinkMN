"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  TransportBooking,
  CreateTransportBookingData,
  UpdateTransportBookingData,
  BookingStatus,
  Payer,
} from "@carelink/types";
import { transportBookingService } from "@/lib/api/services/transport-booking.service";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Truck,
  DollarSign,
  Phone,
  User,
  Search,
} from "lucide-react";
import { format as formatDate } from "date-fns";
import {
  PAYER_LABELS,
  VEHICLE_TYPES,
  EQUIPMENT_OPTIONS,
  BOOKING_STATUS_LABELS,
} from "@/lib/constants/index";
import { organizationService } from "@/lib/api/services/organization.service";
import { vendorService } from "@/lib/api/services/vendor.service";
import { OrganizationType } from "@carelink/types";

interface TransportBookingCardProps {
  caseId: string;
  canManage: boolean;
}

export function TransportBookingCard({ caseId, canManage }: TransportBookingCardProps) {
  const [booking, setBooking] = useState<TransportBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [vendorId, setVendorId] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [equipmentNeeded, setEquipmentNeeded] = useState<string[]>([]);
  const [attendantRequired, setAttendantRequired] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState("");
  const [payerType, setPayerType] = useState<Payer | "">("");
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [status, setStatus] = useState<BookingStatus>(BookingStatus.PENDING);
  const [vendorSearchOpen, setVendorSearchOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [searchingVendors, setSearchingVendors] = useState(false);
  const [availableVendors, setAvailableVendors] = useState<
    Array<{
      id: string;
      name: string;
      type?: string;
    }>
  >([]);
  const [selectedVendor, setSelectedVendor] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    fetchBooking();
  }, [caseId]);

  const fetchBooking = async () => {
    try {
      setIsLoading(true);
      const response = await transportBookingService.getTransportBookingByCaseId(caseId);
      if (response.success && response.data) {
        setBooking(response.data);
        populateForm(response.data);
      }
    } catch (err) {
      console.error("Error fetching transport booking:", err);
      toast.error("Failed to load transport booking");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchVendors = async (search: string) => {
    if (!search || search.length < 2) {
      setAvailableVendors([]);
      return;
    }

    setSearchingVendors(true);
    try {
      // Search for organizations with type VENDOR (transport vendors)
      const orgs = await organizationService.searchOrganizations({
        query: search,
        type: OrganizationType.VENDOR,
        limit: 20,
      });
      
      // For each organization, find the corresponding vendor record
      const vendorPromises = orgs.map(async (org) => {
        try {
          // Fetch vendor by organization ID using vendorService
          const response = await vendorService.searchVendors({
            organizationId: org.id,
          });
          
          if (response.success && response.data && response.data.length > 0) {
            const vendor = response.data[0];
            return {
              id: vendor.id, // Use vendor ID, not organization ID
              name: org.name,
              type: org.type,
            };
          }
        } catch (err) {
          console.error(`Error fetching vendor for org ${org.id}:`, err);
        }
        return null;
      });
      
      const vendors = (await Promise.all(vendorPromises)).filter((v) => v !== null);
      setAvailableVendors(vendors as Array<{ id: string; name: string; type?: string }>);
    } catch (err) {
      console.error("Error searching vendors:", err);
      toast.error("Failed to search vendors");
      setAvailableVendors([]);
    } finally {
      setSearchingVendors(false);
    }
  };

  const handleSelectVendor = (vendor: { id: string; name: string }) => {
    setVendorId(vendor.id);
    setSelectedVendor(vendor);
    setVendorSearchOpen(false);
    setVendorSearch("");
    setAvailableVendors([]);
  };

  const populateForm = (data: TransportBooking) => {
    setVendorId(data.vendorId);
    // Set selected vendor if vendor data is available
    if (data.vendor?.organization) {
      setSelectedVendor({
        id: data.vendor.id,
        name: data.vendor.organization.name,
      });
    }
    setPickupAddress(data.pickupAddress);
    setPickupTime(
      typeof data.pickupTime === "string"
        ? new Date(data.pickupTime).toISOString().slice(0, 16)
        : new Date(data.pickupTime).toISOString().slice(0, 16)
    );
    setDropoffAddress(data.dropoffAddress);
    setVehicleType(data.vehicleType);
    setEquipmentNeeded(data.equipmentNeeded || []);
    setAttendantRequired(data.attendantRequired);
    setEstimatedCost(data.estimatedCost?.toString() || "");
    setPayerType(data.payerType);
    setConfirmationNumber(data.confirmationNumber || "");
    setDriverName(data.driverName || "");
    setDriverPhone(data.driverPhone || "");
    setStatus(data.status);
  };

  const handleSubmit = async () => {
    if (!pickupAddress || !dropoffAddress || !vehicleType || !payerType || !vendorId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingData: CreateTransportBookingData | UpdateTransportBookingData = {
        vendorId,
        pickupAddress,
        pickupTime: new Date(pickupTime),
        dropoffAddress,
        vehicleType,
        equipmentNeeded: equipmentNeeded.length > 0 ? equipmentNeeded : undefined,
        attendantRequired,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        payerType: payerType as Payer,
        ...(booking && {
          status,
          confirmationNumber: confirmationNumber || undefined,
          driverName: driverName || undefined,
          driverPhone: driverPhone || undefined,
        }),
      };

      let response;
      if (booking) {
        response = await transportBookingService.updateTransportBooking(
          caseId,
          booking.id,
          bookingData as UpdateTransportBookingData
        );
      } else {
        response = await transportBookingService.createTransportBooking(
          caseId,
          bookingData as CreateTransportBookingData
        );
      }

      if (response.success) {
        toast.success(
          booking ? "Transport booking updated successfully" : "Transport booking created successfully"
        );
        setIsDialogOpen(false);
        await fetchBooking();
      } else {
        toast.error(response.message || "Failed to save transport booking");
      }
    } catch (err) {
      console.error("Error saving transport booking:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to save transport booking"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!booking) return;

    setIsDeleting(true);
    try {
      const response = await transportBookingService.deleteTransportBooking(caseId, booking.id);
      if (response.success) {
        toast.success("Transport booking deleted successfully");
        setBooking(null);
        setIsDeleteDialogOpen(false);
      } else {
        toast.error(response.message || "Failed to delete transport booking");
      }
    } catch (err) {
      console.error("Error deleting transport booking:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete transport booking"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleEquipment = (equipment: string) => {
    setEquipmentNeeded((prev) =>
      prev.includes(equipment)
        ? prev.filter((e) => e !== equipment)
        : [...prev, equipment]
    );
  };

  const getStatusBadgeVariant = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING:
        return "default";
      case BookingStatus.CONFIRMED:
        return "healthcareInfo";
      case BookingStatus.IN_TRANSIT:
        return "healthcareWarning";
      case BookingStatus.COMPLETED:
        return "healthcareSuccess";
      case BookingStatus.CANCELLED:
        return "destructive";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Transport Booking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card variant="healthcare">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transport Booking</CardTitle>
              <CardDescription>NEMT (Non-Emergency Medical Transport) booking details</CardDescription>
            </div>
            {canManage && (
              <div className="flex items-center gap-2">
                {booking && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    {!booking && (
                      <Button variant="healthcare" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Booking
                      </Button>
                    )}
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {booking ? "Edit Transport Booking" : "Create Transport Booking"}
                      </DialogTitle>
                      <DialogDescription>
                        {booking
                          ? "Update transport booking details"
                          : "Create a new transport booking for this discharge case"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Vendor */}
                      <div>
                        <Label htmlFor="vendorId">Vendor *</Label>
                        <div className="flex gap-2">
                          <Input
                            id="vendorId"
                            value={selectedVendor?.name || vendorId}
                            placeholder={
                              selectedVendor
                                ? selectedVendor.name
                                : "Select a transport vendor"
                            }
                            readOnly
                            required
                            className="flex-1"
                          />
                          <Dialog
                            open={vendorSearchOpen}
                            onOpenChange={setVendorSearchOpen}
                          >
                            <DialogTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setVendorSearchOpen(true)}
                              >
                                <Search className="h-4 w-4 mr-2" />
                                Search
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Search Transport Vendors</DialogTitle>
                                <DialogDescription>
                                  Search for NEMT (Non-Emergency Medical Transport)
                                  vendors
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      placeholder="Search vendors by name..."
                                      value={vendorSearch}
                                      onChange={(e) => {
                                        setVendorSearch(e.target.value);
                                        handleSearchVendors(e.target.value);
                                      }}
                                      className="pl-10"
                                    />
                                  </div>
                                </div>
                                {searchingVendors && (
                                  <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                  </div>
                                )}
                                {!searchingVendors &&
                                  availableVendors.length > 0 && (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-md p-4">
                                      {availableVendors.map((vendor) => (
                                        <div
                                          key={vendor.id}
                                          className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md cursor-pointer border"
                                          onClick={() => handleSelectVendor(vendor)}
                                        >
                                          <div>
                                            <p className="font-medium">
                                              {vendor.name}
                                            </p>
                                            {vendor.type && (
                                              <p className="text-sm text-muted-foreground">
                                                {vendor.type}
                                              </p>
                                            )}
                                          </div>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleSelectVendor(vendor);
                                            }}
                                          >
                                            Select
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                {!searchingVendors &&
                                  vendorSearch.length >= 2 &&
                                  availableVendors.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                      <p>No vendors found</p>
                                    </div>
                                  )}
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setVendorSearchOpen(false);
                                    setVendorSearch("");
                                    setAvailableVendors([]);
                                  }}
                                >
                                  Cancel
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          {selectedVendor && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedVendor(null);
                                setVendorId("");
                              }}
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedVendor
                            ? "Vendor selected"
                            : "Search and select a transport vendor"}
                        </p>
                      </div>

                      {/* Pickup Address */}
                      <div>
                        <Label htmlFor="pickupAddress">Pickup Address *</Label>
                        <Textarea
                          id="pickupAddress"
                          value={pickupAddress}
                          onChange={(e) => setPickupAddress(e.target.value)}
                          placeholder="Enter pickup address"
                          required
                          rows={2}
                        />
                      </div>

                      {/* Pickup Time */}
                      <div>
                        <Label htmlFor="pickupTime">Pickup Date & Time *</Label>
                        <Input
                          id="pickupTime"
                          type="datetime-local"
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          required
                        />
                      </div>

                      {/* Dropoff Address */}
                      <div>
                        <Label htmlFor="dropoffAddress">Dropoff Address *</Label>
                        <Textarea
                          id="dropoffAddress"
                          value={dropoffAddress}
                          onChange={(e) => setDropoffAddress(e.target.value)}
                          placeholder="Enter dropoff address"
                          required
                          rows={2}
                        />
                      </div>

                      {/* Vehicle Type */}
                      <div>
                        <Label htmlFor="vehicleType">Vehicle Type *</Label>
                        <Select value={vehicleType} onValueChange={setVehicleType} required>
                          <SelectTrigger id="vehicleType">
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                          <SelectContent>
                            {VEHICLE_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Equipment Needed */}
                      <div>
                        <Label>Equipment Needed</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {EQUIPMENT_OPTIONS.map((equipment) => (
                            <div key={equipment} className="flex items-center space-x-2">
                              <Checkbox
                                id={`equipment-${equipment}`}
                                checked={equipmentNeeded.includes(equipment)}
                                onCheckedChange={() => toggleEquipment(equipment)}
                              />
                              <Label
                                htmlFor={`equipment-${equipment}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {equipment}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Attendant Required */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="attendantRequired"
                          checked={attendantRequired}
                          onCheckedChange={(checked) => setAttendantRequired(checked === true)}
                        />
                        <Label htmlFor="attendantRequired" className="cursor-pointer">
                          Attendant Required
                        </Label>
                      </div>

                      {/* Payer Type */}
                      <div>
                        <Label htmlFor="payerType">Payer Type *</Label>
                        <Select
                          value={payerType}
                          onValueChange={(value) => setPayerType(value as Payer)}
                          required
                        >
                          <SelectTrigger id="payerType">
                            <SelectValue placeholder="Select payer type" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PAYER_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Estimated Cost */}
                      <div>
                        <Label htmlFor="estimatedCost">Estimated Cost</Label>
                        <Input
                          id="estimatedCost"
                          type="number"
                          step="0.01"
                          value={estimatedCost}
                          onChange={(e) => setEstimatedCost(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>

                      {/* Additional fields for existing bookings */}
                      {booking && (
                        <>
                          <div>
                            <Label htmlFor="status">Status</Label>
                            <Select
                              value={status}
                              onValueChange={(value) => setStatus(value as BookingStatus)}
                            >
                              <SelectTrigger id="status">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="confirmationNumber">Confirmation Number</Label>
                            <Input
                              id="confirmationNumber"
                              value={confirmationNumber}
                              onChange={(e) => setConfirmationNumber(e.target.value)}
                              placeholder="Enter confirmation number"
                            />
                          </div>

                          <div>
                            <Label htmlFor="driverName">Driver Name</Label>
                            <Input
                              id="driverName"
                              value={driverName}
                              onChange={(e) => setDriverName(e.target.value)}
                              placeholder="Enter driver name"
                            />
                          </div>

                          <div>
                            <Label htmlFor="driverPhone">Driver Phone</Label>
                            <Input
                              id="driverPhone"
                              type="tel"
                              value={driverPhone}
                              onChange={(e) => setDriverPhone(e.target.value)}
                              placeholder="Enter driver phone"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="healthcare"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          booking ? "Update" : "Create"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {booking && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!booking ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transport booking yet</p>
              {canManage && (
                <p className="text-sm mt-2">Create a booking to arrange transport</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={getStatusBadgeVariant(booking.status)}>
                  {BOOKING_STATUS_LABELS[booking.status]}
                </Badge>
                {booking.vendor?.organization && (
                  <p className="text-sm text-muted-foreground">
                    Vendor: {booking.vendor.organization.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <MapPin className="h-4 w-4" />
                    <span>Pickup</span>
                  </div>
                  <p className="font-medium">{booking.pickupAddress}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(
                      typeof booking.pickupTime === "string"
                        ? new Date(booking.pickupTime)
                        : booking.pickupTime,
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <MapPin className="h-4 w-4" />
                    <span>Dropoff</span>
                  </div>
                  <p className="font-medium">{booking.dropoffAddress}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Truck className="h-4 w-4" />
                    <span>Vehicle Type</span>
                  </div>
                  <p className="font-medium">{booking.vehicleType}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Payer</span>
                  </div>
                  <Badge variant="outline">
                    {PAYER_LABELS[booking.payerType] || booking.payerType}
                  </Badge>
                </div>

                {booking.estimatedCost && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span>Estimated Cost</span>
                    </div>
                    <p className="font-medium">${booking.estimatedCost.toFixed(2)}</p>
                  </div>
                )}

                {booking.actualCost && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span>Actual Cost</span>
                    </div>
                    <p className="font-medium">${booking.actualCost.toFixed(2)}</p>
                  </div>
                )}

                {booking.confirmationNumber && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      <span>Confirmation Number</span>
                    </div>
                    <p className="font-medium">{booking.confirmationNumber}</p>
                  </div>
                )}

                {booking.driverName && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <User className="h-4 w-4" />
                      <span>Driver</span>
                    </div>
                    <p className="font-medium">{booking.driverName}</p>
                    {booking.driverPhone && (
                      <div className="flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{booking.driverPhone}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {booking.equipmentNeeded && booking.equipmentNeeded.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Equipment Needed</p>
                  <div className="flex flex-wrap gap-2">
                    {booking.equipmentNeeded.map((equipment, idx) => (
                      <Badge key={idx} variant="outline">
                        {equipment}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {booking.attendantRequired && (
                <Badge variant="outline">Attendant Required</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transport Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transport booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
    </>
  );
}

