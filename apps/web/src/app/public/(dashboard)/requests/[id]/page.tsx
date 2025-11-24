"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Calendar, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState } from "@/components/shared";
import {
  publicReferralRequestService,
  type ReferralRequest,
} from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  CONVERTED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<ReferralRequest | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRequest();
    }
  }, [id]);

  const fetchRequest = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await publicReferralRequestService.getRequest(id);

      if (response.success && response.data) {
        setRequest(response.data);
      } else {
        setError(response.message || "Failed to load request");
        toast.error(response.message || "Failed to load request");
      }
    } catch (err) {
      console.error("Error fetching request:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load request";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!request) return;

    if (!confirm("Are you sure you want to cancel this request?")) {
      return;
    }

    setIsCancelling(true);

    try {
      const response = await publicReferralRequestService.cancelRequest(id);

      if (response.success) {
        toast.success("Request cancelled successfully");
        router.push("/public/requests");
      } else {
        toast.error(response.message || "Failed to cancel request");
      }
    } catch (err) {
      console.error("Error cancelling request:", err);
      toast.error(err instanceof Error ? err.message : "Failed to cancel request");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading request..." />;
  }

  if (error || !request) {
    return (
      <ErrorState
        title="Error Loading Request"
        message={error || "Request not found"}
        action={{
          label: "Back to Requests",
          onClick: () => router.push("/public/requests"),
          variant: "healthcare",
        }}
      />
    );
  }

  const canCancel = ["PENDING", "ASSIGNED"].includes(request.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/public/requests">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requests
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Request #{request.requestNumber}
            </h1>
            <p className="text-muted-foreground mt-1">
              Created {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[request.status] || "bg-gray-100 text-gray-800"}`}
          >
            {request.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Status Timeline */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Request Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Request Submitted</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(request.createdAt), "PPpp")}
                </p>
              </div>
            </div>

            {request.assignedCaseManager && (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Assigned to Case Manager</p>
                  <p className="text-sm text-muted-foreground">
                    {request.assignedCaseManager.firstName}{" "}
                    {request.assignedCaseManager.lastName}
                  </p>
                  {request.assignedAt && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(request.assignedAt), "PPpp")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {request.convertedToReferral && (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Converted to Formal Referral</p>
                  <p className="text-sm text-muted-foreground">
                    Referral #{request.convertedToReferral.referralNumber}
                  </p>
                  {request.convertedAt && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(request.convertedAt), "PPpp")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{request.contactName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{request.contactEmail}</p>
          </div>
          {request.contactPhone && (
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{request.contactPhone}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Care Recipient */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Care Recipient</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Initials</p>
              <p className="font-medium">{request.recipientInitials}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Age</p>
              <p className="font-medium">{request.recipientAge}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              <p className="font-medium">{request.recipientGender}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Care Needs */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Care Needs & Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Care Needs Description</p>
            <p className="font-medium whitespace-pre-wrap">{request.careNeeds}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Urgency</p>
            <p className="font-medium">{request.urgency}</p>
          </div>
          {request.preferredCounties && request.preferredCounties.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">Preferred Counties</p>
              <p className="font-medium">{request.preferredCounties.join(", ")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payer Information */}
      {(request.primaryPayer || request.secondaryPayer) && (
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Payer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {request.primaryPayer && (
              <div>
                <p className="text-sm text-muted-foreground">Primary Payer</p>
                <p className="font-medium">{request.primaryPayer}</p>
              </div>
            )}
            {request.secondaryPayer && (
              <div>
                <p className="text-sm text-muted-foreground">Secondary Payer</p>
                <p className="font-medium">{request.secondaryPayer}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Case Manager Info */}
      {request.assignedCaseManager && (
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Assigned Case Manager</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">
                {request.assignedCaseManager.firstName}{" "}
                {request.assignedCaseManager.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{request.assignedCaseManager.email}</p>
            </div>
            {request.assignedCaseManager.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{request.assignedCaseManager.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {canCancel && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? "Cancelling..." : "Cancel Request"}
          </Button>
        </div>
      )}
    </div>
  );
}
