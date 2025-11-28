"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, User, MapPin, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared";
import { publicReferralRequestService } from "@/lib/api";
import { toast } from "sonner";

export default function PublicRequestsQueuePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  useEffect(() => {
    fetchQueue();
  }, [page]);

  const fetchQueue = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await publicReferralRequestService.getQueue({
        page,
        limit,
      });

      if (response.success && response.data) {
        setRequests(response.data.requests || []);
        setTotal(response.data.total || 0);
      } else {
        setError(response.message || "Failed to load requests");
        toast.error(response.message || "Failed to load requests");
      }
    } catch (err) {
      console.error("Error fetching queue:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load requests";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimRequest = async (id: string) => {
    try {
      const response = await publicReferralRequestService.claimRequest(id);

      if (response.success && response.data) {
        toast.success("Request claimed and converted to referral!");
        
        // Redirect to the new referral
        const referralId = (response.data as any).referralId;
        if (referralId) {
          router.push(`/case-manager/referrals/${referralId}`);
        } else {
          // Fallback: refresh the queue
          fetchQueue();
        }
      } else {
        toast.error(response.message || "Failed to claim request");
      }
    } catch (err) {
      console.error("Error claiming request:", err);
      toast.error("Failed to claim request");
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "URGENT":
        return "destructive";
      case "HIGH":
        return "healthcareWarning";
      default:
        return "default";
    }
  };

  if (isLoading && requests.length === 0) {
    return <LoadingState message="Loading requests..." />;
  }

  if (error && requests.length === 0) {
    return (
      <ErrorState
        title="Error Loading Requests"
        message={error}
        action={{
          label: "Retry",
          onClick: fetchQueue,
          variant: "healthcare",
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Public Requests Queue
        </h1>
        <p className="text-muted-foreground mt-1">
          Review and claim referral requests from families
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No Pending Requests"
          description="There are no pending referral requests at this time"
        />
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} variant="healthcare">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        Request #{request.requestNumber}
                      </h3>
                      <Badge variant={getUrgencyColor(request.urgency)}>
                        {request.urgency}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>
                          {request.contactName} ({request.recipientInitials})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {request.preferredCounties?.length > 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{request.preferredCounties.join(", ")}</span>
                        </div>
                      )}
                    </div>

                    {/* Care Needs */}
                    <div>
                      <p className="text-sm font-medium mb-1">Care Needs:</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {request.careNeeds}
                      </p>
                    </div>

                    {/* Payers */}
                    {(request.primaryPayer || request.secondaryPayer) && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Payers:</span>
                        <div className="flex gap-2">
                          {request.primaryPayer && (
                            <Badge variant="outline">
                              {request.primaryPayer}
                            </Badge>
                          )}
                          {request.secondaryPayer && (
                            <Badge variant="outline">
                              {request.secondaryPayer}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="healthcare"
                      onClick={() => handleClaimRequest(request.id)}
                    >
                      Claim Request
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to{" "}
            {Math.min(page * limit, total)} of {total} requests
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * limit >= total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
