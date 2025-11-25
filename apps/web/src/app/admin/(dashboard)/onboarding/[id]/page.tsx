"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
  ExternalLink,
  Building,
  Shield,
  Stethoscope,
  CreditCard,
  User,
  Clock,
  Calendar,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { apiService } from "@/lib/api/config";
import { toast } from "sonner";
import { OnboardingReviewStatus } from "@carelink/types";
import { usePageMetadata } from "../../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";
import { cn } from "@/lib/utils";

interface OnboardingDetail {
  id: string;
  providerId: string;
  currentStep: number;
  isComplete: boolean;
  submittedAt: string;
  adminReviewStatus: OnboardingReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  organizationData: any;
  licenseData: any;
  serviceData: any;
  subscriptionData: any;
  provider: {
    organization: {
      name: string;
      email: string;
      phone: string;
      type: string;
      ein?: string;
      npi?: string;
      website?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
  };
}

function OnboardingDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const [data, setData] = useState<OnboardingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<OnboardingReviewStatus>(
    OnboardingReviewStatus.APPROVED
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle("Review Submission");
    setDescription("Review provider onboarding details");
    if (params.id) {
      fetchSubmission(params.id as string);
    }
  }, [params.id, setTitle, setDescription]);

  const fetchSubmission = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.get<OnboardingDetail>(
        `/api/admin/onboarding/${id}`
      );

      if (response.success && response.data) {
        setData(response.data);
      } else {
        toast.error("Failed to load submission details");
      }
    } catch (error) {
      console.error("Error fetching submission:", error);
      toast.error("Failed to load submission details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!data) return;

    setIsSubmitting(true);
    try {
      const response = await apiService.put(
        `/api/admin/onboarding/${data.id}/review`,
        {
          status: reviewStatus,
          notes: reviewNotes,
        }
      );

      if (response.success) {
        toast.success("Review submitted successfully");
        setReviewDialogOpen(false);
        fetchSubmission(data.id); // Refresh data
      } else {
        toast.error(response.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: OnboardingReviewStatus) => {
    switch (status) {
      case OnboardingReviewStatus.APPROVED:
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Approved
          </Badge>
        );
      case OnboardingReviewStatus.REJECTED:
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Rejected
          </Badge>
        );
      case OnboardingReviewStatus.NEEDS_CHANGES:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Needs Changes
          </Badge>
        );
      case OnboardingReviewStatus.IN_REVIEW:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> In Review
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        );
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading submission details...</div>;
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium">Submission not found</h3>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/admin/onboarding")}
        >
          Back to List
        </Button>
      </div>
    );
  }

  const orgData = data.organizationData || {};
  const licenseData = data.licenseData || {};
  const serviceData = data.serviceData || {};
  const subData = data.subscriptionData || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/onboarding")}
          className="pl-0 hover:bg-transparent"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Queue
        </Button>
        <div className="flex items-center gap-3">
          {getStatusBadge(data.adminReviewStatus)}
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="healthcare">Review Submission</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Review Onboarding Submission</DialogTitle>
                <DialogDescription>
                  Update the status of this provider's onboarding application.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={reviewStatus}
                    onValueChange={(value) =>
                      setReviewStatus(value as OnboardingReviewStatus)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={OnboardingReviewStatus.APPROVED}>
                        Approve Application
                      </SelectItem>
                      <SelectItem value={OnboardingReviewStatus.NEEDS_CHANGES}>
                        Request Changes
                      </SelectItem>
                      <SelectItem value={OnboardingReviewStatus.REJECTED}>
                        Reject Application
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Review Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add internal notes or feedback for the provider..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="healthcare"
                  onClick={handleReviewSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Organization Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <CardTitle>Organization Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Organization Name</Label>
              <p className="font-medium text-lg">{orgData.organizationName || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Type</Label>
              <p className="font-medium">{orgData.organizationType || "Provider"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Website</Label>
              {orgData.website ? (
                <a
                  href={orgData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 break-all"
                  title={orgData.website}
                >
                  <span className="truncate max-w-[250px]">{orgData.website}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              ) : (
                <p className="font-medium">N/A</p>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Contact Email</Label>
              <p className="font-medium">{orgData.email || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <p className="font-medium">{orgData.phone || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Address</Label>
              <p className="font-medium">
                {orgData.addressLine1}
                {orgData.addressLine2 && `, ${orgData.addressLine2}`}
                <br />
                {orgData.city}, {orgData.state} {orgData.zipCode}
              </p>
            </div>
          </div>
          <Separator className="md:col-span-2" />
          <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
            <div>
              <Label className="text-muted-foreground">EIN (Tax ID)</Label>
              <p className="font-mono font-medium">{orgData.ein || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">NPI Number</Label>
              <p className="font-mono font-medium">{orgData.npi || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Licenses */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Licenses & Certifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Primary License Type</Label>
              <p className="font-medium text-lg">
                {licenseData.primaryLicenseType || "N/A"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              Uploaded Licenses
            </h4>
            {licenseData.licenses && licenseData.licenses.length > 0 ? (
              <div className="grid gap-4">
                {licenseData.licenses.map((license: any, index: number) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center bg-muted/30"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">
                          {license.licenseType}
                        </span>
                        <Badge variant="outline">{license.licenseNumber}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Issued:{" "}
                          {license.issueDate
                            ? format(new Date(license.issueDate), "MMM d, yyyy")
                            : "N/A"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Expires:{" "}
                          {license.expirationDate
                            ? format(new Date(license.expirationDate), "MMM d, yyyy")
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                    {license.documentUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={license.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Document
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">No licenses uploaded</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Services & Subscription */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <CardTitle>Services</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {serviceData.selectedServices &&
            serviceData.selectedServices.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {serviceData.selectedServices.map(
                  (serviceId: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      Service ID: {serviceId.substring(0, 8)}...
                    </Badge>
                  )
                )}
                <p className="text-xs text-muted-foreground w-full mt-2">
                  * Service names will be resolved in future update
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground italic">No services selected</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Subscription</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Selected Plan</Label>
              <p className="font-medium text-lg capitalize">
                {subData.subscriptionTier?.toLowerCase() || "Free"}
              </p>
            </div>
            {subData.billingCycle && (
              <div>
                <Label className="text-muted-foreground">Billing Cycle</Label>
                <p className="font-medium capitalize">
                  {subData.billingCycle.toLowerCase()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review History */}
      {data.reviewedBy && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Review History</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Reviewed by:</span>
              <span className="font-medium">Admin ID: {data.reviewedBy}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Reviewed at:</span>
              <span className="font-medium">
                {data.reviewedAt
                  ? format(new Date(data.reviewedAt), "MMM d, yyyy h:mm a")
                  : "N/A"}
              </span>
            </div>
            {data.reviewNotes && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <Label className="text-muted-foreground mb-2 block">Notes</Label>
                <p className="text-sm whitespace-pre-wrap">{data.reviewNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function OnboardingDetailPage() {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.SYSTEM_MANAGE}
      title="Access Restricted"
      description="You don't have permission to view onboarding details."
    >
      <OnboardingDetailPageContent />
    </RequirePermission>
  );
}
