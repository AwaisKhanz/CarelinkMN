"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Search, CheckCircle2, Users } from "lucide-react";
import { providerService, Provider } from "@/lib/api";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface BatchMessageDialogListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralIds: string[];
  referralNumbers: string[];
  onConfirm: (providerIds: string[], message: string) => Promise<void>;
  isSending: boolean;
}

export function BatchMessageDialogList({
  open,
  onOpenChange,
  referralIds,
  referralNumbers,
  onConfirm,
  isSending,
}: BatchMessageDialogListProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch providers when dialog opens
  useEffect(() => {
    if (open) {
      fetchProviders();
    } else {
      // Reset state when dialog closes
      setSelectedProviders([]);
      setSearchQuery("");
      setMessage("");
    }
  }, [open]);

  const fetchProviders = async () => {
    setIsLoadingProviders(true);
    try {
      const response = await providerService.getProviders({
        page: 1,
        limit: 100, // Get more providers for selection
      });

      if (response.success && response.data) {
        setProviders(response.data.providers || []);
      } else {
        toast.error(response.message || "Failed to load providers");
      }
    } catch (err) {
      console.error("Error fetching providers:", err);
      toast.error("Failed to load providers");
    } finally {
      setIsLoadingProviders(false);
    }
  };

  const filteredProviders = providers.filter((provider) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      provider.organization?.name?.toLowerCase().includes(query) ||
      provider.organization?.city?.toLowerCase().includes(query) ||
      provider.organization?.county?.toLowerCase().includes(query)
    );
  });

  const handleToggleProvider = (providerId: string) => {
    setSelectedProviders((prev) =>
      prev.includes(providerId)
        ? prev.filter((id) => id !== providerId)
        : [...prev, providerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProviders.length === filteredProviders.length) {
      setSelectedProviders([]);
    } else {
      setSelectedProviders(filteredProviders.map((p) => p.id));
    }
  };

  const handleConfirm = async () => {
    if (selectedProviders.length === 0) {
      toast.error("Please select at least one provider");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    await onConfirm(selectedProviders, message);
  };

  // Calculate total message count (referrals × providers)
  const totalMessages = referralIds.length * selectedProviders.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Batch Message Providers</DialogTitle>
          <DialogDescription>
            Select providers and compose a message to send for {referralIds.length}{" "}
            referral{referralIds.length !== 1 ? "s" : ""}:{" "}
            {referralNumbers.join(", ")}
            {selectedProviders.length > 0 && (
              <span className="block mt-1 font-medium text-foreground">
                {totalMessages} message{totalMessages !== 1 ? "s" : ""} will be
                sent
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search providers by name, city, or county..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Provider List */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <Label>
                Select Providers ({selectedProviders.length} selected)
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredProviders.length === 0}
              >
                {selectedProviders.length === filteredProviders.length &&
                filteredProviders.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              {isLoadingProviders ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredProviders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No providers found</p>
                  {searchQuery && (
                    <p className="text-sm mt-2">
                      Try adjusting your search query
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredProviders.map((provider) => {
                    const isSelected = selectedProviders.includes(provider.id);
                    return (
                      <div
                        key={provider.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => handleToggleProvider(provider.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            handleToggleProvider(provider.id)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">
                              {provider.organization?.name || "Unknown Provider"}
                            </p>
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {provider.organization?.city && (
                              <span>{provider.organization.city}</span>
                            )}
                            {provider.organization?.county && (
                              <span>• {provider.organization.county}</span>
                            )}
                            {provider.organization?.state && (
                              <span>• {provider.organization.state}</span>
                            )}
                          </div>
                          {provider.acceptsReferrals && (
                            <Badge
                              variant="healthcareSuccess"
                              className="mt-2 text-xs"
                            >
                              Accepting Referrals
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="batch-message">Message</Label>
            <Textarea
              id="batch-message"
              placeholder="Enter your message to send to all selected providers..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This message will be sent to {selectedProviders.length} provider
              {selectedProviders.length !== 1 ? "s" : ""} for{" "}
              {referralIds.length} referral{referralIds.length !== 1 ? "s" : ""}
              .
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSending || selectedProviders.length === 0 || !message.trim()}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send {totalMessages > 0 ? `${totalMessages} ` : ""}Message
                  {totalMessages !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

