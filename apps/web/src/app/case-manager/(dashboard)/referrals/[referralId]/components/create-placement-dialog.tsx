"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { placementService, providerService, homeService, openingService, OpeningStatus } from "@/lib/api";
import type { ReferralShortlist } from "@/lib/api";

interface CreatePlacementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralId: string;
  shortlist: ReferralShortlist[];
  onSuccess: () => void;
}

export function CreatePlacementDialog({
  open,
  onOpenChange,
  referralId,
  shortlist,
  onSuccess,
}: CreatePlacementDialogProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [selectedHomeId, setSelectedHomeId] = useState<string>("");
  const [selectedOpeningId, setSelectedOpeningId] = useState<string>("");
  const [placementDate, setPlacementDate] = useState<Date>(new Date());
  const [moveInDate, setMoveInDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");

  // Data state
  const [homes, setHomes] = useState<any[]>([]);
  const [openings, setOpenings] = useState<any[]>([]);
  const [isLoadingHomes, setIsLoadingHomes] = useState(false);
  const [isLoadingOpenings, setIsLoadingOpenings] = useState(false);

  // Filter shortlist to only show providers who have RESPONDED
  const respondedProviders = shortlist.filter(
    (s) => s.status === "RESPONDED"
  );

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedProviderId("");
      setSelectedHomeId("");
      setSelectedOpeningId("");
      setPlacementDate(new Date());
      setMoveInDate(undefined);
      setNotes("");
      setHomes([]);
      setOpenings([]);
    }
  }, [open]);

  // Fetch homes when provider is selected
  useEffect(() => {
    if (selectedProviderId) {
      fetchHomes();
    } else {
      setHomes([]);
      setSelectedHomeId("");
    }
  }, [selectedProviderId]);

  // Fetch openings when home is selected
  useEffect(() => {
    if (selectedHomeId) {
      fetchOpenings();
    } else {
      setOpenings([]);
      setSelectedOpeningId("");
    }
  }, [selectedHomeId]);

  const fetchHomes = async () => {
    if (!selectedProviderId) return;

    setIsLoadingHomes(true);
    try {
      const response = await homeService.getProviderHomes(
        selectedProviderId,
        {
          page: 1,
          limit: 100,
        }
      );
      if (response.success && response.data) {
        // Filter to homes with available capacity
        const availableHomes = response.data.homes.filter(
          (home: any) => home.currentOccupancy < home.capacity
        );
        setHomes(availableHomes);
      }
    } catch (error) {
      console.error("Error fetching homes:", error);
      toast.error("Failed to load homes");
    } finally {
      setIsLoadingHomes(false);
    }
  };

  const fetchOpenings = async () => {
    if (!selectedHomeId) return;

    setIsLoadingOpenings(true);
    try {
      const response = await openingService.getOpenings({
        homeId: selectedHomeId,
        status: OpeningStatus.OPEN,
        page: 1,
        limit: 100,
      });
      if (response.success && response.data) {
        // Filter to openings with available spots
        const availableOpenings = response.data.openings.filter(
          (opening: any) => opening.spotsAvailable > 0
        );
        setOpenings(availableOpenings);
      }
    } catch (error) {
      console.error("Error fetching openings:", error);
      toast.error("Failed to load openings");
    } finally {
      setIsLoadingOpenings(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProviderId || !selectedHomeId || !selectedOpeningId) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await placementService.createPlacementFromReferral({
        referralId,
        providerId: selectedProviderId,
        homeId: selectedHomeId,
        openingId: selectedOpeningId,
        placementDate: placementDate.toISOString(),
        moveInDate: moveInDate?.toISOString(),
        notes: notes || undefined,
      });

      if (response.success) {
        toast.success("Placement created successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(response.message || "Failed to create placement");
      }
    } catch (error) {
      console.error("Error creating placement:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create placement"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const canProceedToStep2 = selectedProviderId !== "";
  const canProceedToStep3 = selectedHomeId !== "";
  const canProceedToStep4 = selectedOpeningId !== "";

  const selectedProvider = respondedProviders.find(
    (s) => s.providerId === selectedProviderId
  );
  const selectedHome = homes.find((h) => h.id === selectedHomeId);
  const selectedOpening = openings.find((o) => o.id === selectedOpeningId);

  if (respondedProviders.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Placement</DialogTitle>
            <DialogDescription>
              No providers have responded to this referral yet.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground">
            <p>
              Wait for providers to respond to the referral before creating a
              placement.
            </p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Placement from Referral</DialogTitle>
          <DialogDescription>
            Step {step} of 4: {
              step === 1 ? "Select Provider" :
              step === 2 ? "Select Home" :
              step === 3 ? "Select Opening" :
              "Placement Details"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Provider Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider *</Label>
                <Select
                  value={selectedProviderId}
                  onValueChange={setSelectedProviderId}
                >
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {respondedProviders.map((shortlistItem) => (
                      <SelectItem
                        key={shortlistItem.providerId}
                        value={shortlistItem.providerId}
                      >
                        {shortlistItem.provider?.organization?.name || "Unknown Provider"}
                        {shortlistItem.respondedAt && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (Responded {format(new Date(shortlistItem.respondedAt), "MMM d")})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Only showing providers who have responded to this referral
                </p>

                {/* Selected Provider Details */}
                {selectedProvider && (
                  <div className="mt-4 p-4 border border-border rounded-lg bg-muted/30 space-y-2">
                    <h4 className="font-semibold text-sm">Provider Response</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Organization:</span>
                        <span className="font-medium">
                          {selectedProvider.provider?.organization?.name}
                        </span>
                      </div>
                      {selectedProvider.respondedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Responded:</span>
                          <span className="font-medium">
                            {format(new Date(selectedProvider.respondedAt), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                      )}
                      {selectedProvider.notes && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="text-muted-foreground text-xs mb-1">Response Notes:</p>
                          <p className="text-sm">{selectedProvider.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Home Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="home">Home *</Label>
                {isLoadingHomes ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : homes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No homes with available capacity found for this provider.
                  </p>
                ) : (
                  <>
                    <Select
                      value={selectedHomeId}
                      onValueChange={setSelectedHomeId}
                    >
                      <SelectTrigger id="home">
                        <SelectValue placeholder="Select a home" />
                      </SelectTrigger>
                      <SelectContent>
                        {homes.map((home) => (
                          <SelectItem key={home.id} value={home.id}>
                            {home.name} - {home.city}, {home.state}
                            <span className="text-xs text-muted-foreground ml-2">
                              ({home.currentOccupancy}/{home.capacity} occupied)
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Only showing homes with available capacity
                    </p>

                    {/* Selected Home Details */}
                    {selectedHome && (
                      <div className="mt-4 p-4 border border-border rounded-lg bg-muted/30 space-y-3">
                        <h4 className="font-semibold text-sm">Home Details</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Address</p>
                            <p className="font-medium">
                              {selectedHome.addressLine1}
                              {selectedHome.addressLine2 && `, ${selectedHome.addressLine2}`}
                            </p>
                            <p className="text-muted-foreground">
                              {selectedHome.city}, {selectedHome.state} {selectedHome.zipCode}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Capacity</p>
                            <p className="font-medium">
                              {selectedHome.capacity - selectedHome.currentOccupancy} spots available
                            </p>
                            <p className="text-muted-foreground">
                              {selectedHome.currentOccupancy}/{selectedHome.capacity} occupied
                            </p>
                          </div>
                        </div>
                        {/* Accessibility Features */}
                        {(selectedHome.wheelchairAccessible || selectedHome.singleLevel || 
                          selectedHome.hasElevator || selectedHome.hasRollInShower) && (
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Accessibility</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedHome.wheelchairAccessible && (
                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                                  Wheelchair Accessible
                                </span>
                              )}
                              {selectedHome.singleLevel && (
                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                                  Single Level
                                </span>
                              )}
                              {selectedHome.hasElevator && (
                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                                  Elevator
                                </span>
                              )}
                              {selectedHome.hasRollInShower && (
                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                                  Roll-in Shower
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Opening Selection */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="opening">Opening *</Label>
                {isLoadingOpenings ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : openings.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No open openings with available spots found for this home.
                  </p>
                ) : (
                  <>
                    <Select
                      value={selectedOpeningId}
                      onValueChange={setSelectedOpeningId}
                    >
                      <SelectTrigger id="opening">
                        <SelectValue placeholder="Select an opening" />
                      </SelectTrigger>
                      <SelectContent>
                        {openings.map((opening) => (
                          <SelectItem key={opening.id} value={opening.id}>
                            {opening.careLevels?.join(", ") || "No care level specified"}
                            <span className="text-xs text-muted-foreground ml-2">
                              ({opening.spotsAvailable} spots available)
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Only showing openings with available spots
                    </p>

                    {/* Selected Opening Details */}
                    {selectedOpening && (
                      <div className="mt-4 p-4 border border-border rounded-lg bg-muted/30 space-y-3">
                        <h4 className="font-semibold text-sm">Opening Details</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Care Levels</p>
                            <p className="font-medium">{selectedOpening.careLevels?.join(", ") || "Not specified"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Availability</p>
                            <p className="font-medium">
                              {selectedOpening.spotsAvailable} {selectedOpening.spotsAvailable === 1 ? 'spot' : 'spots'} available
                            </p>
                          </div>
                        </div>
                        {selectedOpening.description && (
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Description</p>
                            <p className="text-sm">{selectedOpening.description}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Placement Details */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Placement Summary</h4>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Provider:</span> {selectedProvider?.provider?.organization?.name}</p>
                  <p><span className="text-muted-foreground">Home:</span> {selectedHome?.name}</p>
                  <p><span className="text-muted-foreground">Opening:</span> {selectedOpening?.careLevels?.join(", ") || "Not specified"}</p>
                </div>
              </div>

              {/* Placement Date */}
              <div className="space-y-2">
                <Label>Placement Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !placementDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {placementDate ? format(placementDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={placementDate}
                      onSelect={(date) => date && setPlacementDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Move-in Date */}
              <div className="space-y-2">
                <Label>Move-in Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !moveInDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {moveInDate ? format(moveInDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={moveInDate}
                      onSelect={setMoveInDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this placement..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {notes.length}/1000
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <div>
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !canProceedToStep2) ||
                  (step === 2 && !canProceedToStep3) ||
                  (step === 3 && !canProceedToStep4)
                }
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                variant="healthcare"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Create Placement
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
