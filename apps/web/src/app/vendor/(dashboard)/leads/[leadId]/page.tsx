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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { vendorService } from "@/lib/api";
import { usePageMetadata } from "../../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { VENDOR_CAPABILITIES } from "@/lib/permissions/capabilities";
import { LoadingState, ErrorState } from "@/components/shared";
import { VendorDetailHeader } from "@/components/vendor";
import { VendorLead, LeadStatus } from "@carelink/types";
import { getLeadStatusBadgeConfig } from "@/lib/utils/vendor";
import { formatLeadSource } from "@/lib/utils/vendor";
import { format } from "date-fns";

export default function VendorLeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.leadId as string;
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [lead, setLead] = useState<VendorLead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);

  useEffect(() => {
    setTitle("Lead Details");
    setDescription("View and manage lead information");
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

  const fetchLead = useCallback(async () => {
    if (!vendorId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await vendorService.getVendorLeads(vendorId, {
        limit: 1000, // Get all to find this lead
      });

      if (response.success && response.data) {
        const foundLead = response.data.leads.find((l) => l.id === leadId);
        if (foundLead) {
          setLead(foundLead);
          setTitle(`${foundLead.name} - Lead Details`);
        } else {
          setError("Lead not found");
        }
      } else {
        setError("Failed to load lead");
      }
    } catch (err) {
      console.error("Error fetching lead:", err);
      setError(err instanceof Error ? err.message : "Failed to load lead");
    } finally {
      setIsLoading(false);
    }
  }, [vendorId, leadId, setTitle]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  useEffect(() => {
    if (vendorId) {
      fetchLead();
    }
  }, [vendorId, fetchLead]);

  const handleStatusUpdate = async (newStatus: LeadStatus) => {
    if (!vendorId || !leadId) return;

    setIsUpdating(true);
    try {
      const response = await vendorService.updateLeadStatus(vendorId, leadId, {
        status: newStatus,
      });

      if (response.success && response.data) {
        setLead(response.data);
        toast.success("Lead status updated successfully!");
      } else {
        toast.error(response.message || "Failed to update lead status");
      }
    } catch (err) {
      console.error("Error updating lead status:", err);
      toast.error("Failed to update lead status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading lead details..." />;
  }

  if (error || !lead) {
    return (
      <ErrorState
        title="Error Loading Lead"
        message={error || "Lead not found"}
        action={{
          label: "Back to Leads",
          onClick: () => router.push("/vendor/leads"),
          variant: "healthcare",
        }}
      />
    );
  }

  const statusConfig = getLeadStatusBadgeConfig(lead.status);

  return (
    <RequirePermission
      permission={VENDOR_CAPABILITIES.LEADS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view leads."
    >
      <div className="space-y-6">
        <VendorDetailHeader
          title={lead.name}
          subtitle={`Lead ID: ${lead.id.slice(0, 8)}`}
          backHref="/vendor/leads"
          badge={{
            label: statusConfig.label,
            variant: statusConfig.variant,
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">{lead.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{lead.email}</div>
              </div>
              {lead.phone && (
                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div className="font-medium">{lead.phone}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Lead Details</CardTitle>
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
              <div>
                <div className="text-sm text-muted-foreground">Source</div>
                <div className="font-medium">{formatLeadSource(lead.source)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="font-medium">
                  {format(new Date(lead.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
              {lead.contactedAt && (
                <div>
                  <div className="text-sm text-muted-foreground">Contacted</div>
                  <div className="font-medium">
                    {format(new Date(lead.contactedAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
              )}
              {lead.convertedAt && (
                <div>
                  <div className="text-sm text-muted-foreground">Converted</div>
                  <div className="font-medium">
                    {format(new Date(lead.convertedAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Services Interested</CardTitle>
          </CardHeader>
          <CardContent>
            {lead.servicesInterested.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {lead.servicesInterested.map((service, index) => (
                  <Badge key={index} variant="outline">
                    {service}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No services specified</p>
            )}
          </CardContent>
        </Card>

        {lead.message && (
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{lead.message}</p>
            </CardContent>
          </Card>
        )}

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
            <CardDescription>Change the status of this lead</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={lead.status}
              onValueChange={(value) => handleStatusUpdate(value as LeadStatus)}
              disabled={isUpdating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(LeadStatus).map((status) => {
                  const config = getLeadStatusBadgeConfig(status);
                  return (
                    <SelectItem key={status} value={status}>
                      {config.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {isUpdating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating status...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RequirePermission>
  );
}

