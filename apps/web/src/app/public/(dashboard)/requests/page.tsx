"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared";
import { usePageMetadata } from "../use-page-metadata";
import {
  publicReferralRequestService,
  type ReferralRequest,
} from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const STATUS_OPTIONS = [
  { value: "all", label: "All Requests" },
  { value: "PENDING", label: "Pending" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "CONVERTED", label: "Converted" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  CONVERTED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function RequestsPage() {
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<ReferralRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setTitle("My Requests");
    setDescription("Manage your case manager assistance requests");
  }, [setTitle, setDescription]);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await publicReferralRequestService.getRequests({
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      if (response.success && response.data) {
        setRequests(response.data.requests || []);
        setTotal(response.data.total || 0);
      } else {
        setError(response.message || "Failed to load requests");
        toast.error(response.message || "Failed to load requests");
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load requests";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
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
          onClick: fetchRequests,
          variant: "healthcare",
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Requests</h1>
          <p className="text-muted-foreground mt-1">
            {total} {total === 1 ? "request" : "requests"} total
          </p>
        </div>
        <Link href="/public/requests/new">
          <Button variant="healthcare">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card variant="healthcare" className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Requests List */}
      {requests.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No requests found"
          description={
            statusFilter === "all"
              ? "Create your first request to get help from a case manager"
              : `No ${statusFilter.toLowerCase()} requests found`
          }
          action={{
            label: "Create Request",
            onClick: () => router.push("/public/requests/new"),
            variant: "healthcare",
          }}
        />
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card
              key={request.id}
              variant="healthcare"
              className="p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/public/requests/${request.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      Request #{request.requestNumber}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[request.status] || "bg-gray-100 text-gray-800"}`}
                    >
                      {request.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium">Care for:</span>{" "}
                      {request.recipientInitials}, Age {request.recipientAge}
                    </p>
                    <p>
                      <span className="font-medium">Urgency:</span>{" "}
                      {request.urgency}
                    </p>
                    {request.assignedCaseManager && (
                      <p>
                        <span className="font-medium">Case Manager:</span>{" "}
                        {request.assignedCaseManager.firstName}{" "}
                        {request.assignedCaseManager.lastName}
                      </p>
                    )}
                    <p className="text-xs">
                      Created{" "}
                      {formatDistanceToNow(new Date(request.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>

                <Button variant="ghost" size="sm">
                  View Details →
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
