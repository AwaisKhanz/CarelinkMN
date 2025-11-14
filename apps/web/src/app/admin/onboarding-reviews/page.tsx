"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@carelink/types";
import { onboardingService, OnboardingState, OnboardingReviewStatus } from "@/lib/api/services/onboarding.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Building2,
  FileText,
  User,
  Calendar,
  Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ReviewFormData {
  status: OnboardingReviewStatus | '';
  notes: string;
}

export default function OnboardingReviewsPage() {
  const { user } = useAuth();
  const [pendingReviews, setPendingReviews] = useState<OnboardingState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<OnboardingState | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({ status: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check admin permissions
  useEffect(() => {
    if (user && ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role as UserRole)) {
      toast.error("Access denied. Admin permissions required.");
      window.location.href = "/";
    }
  }, [user]);

  // Load pending reviews
  useEffect(() => {
    const loadPendingReviews = async () => {
      try {
        setIsLoading(true);
        const reviews = await onboardingService.getPendingReviews();
        setPendingReviews(reviews);
      } catch (error) {
        console.error("Failed to load pending reviews:", error);
        toast.error("Failed to load pending reviews");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadPendingReviews();
    }
  }, [user]);

  const handleReviewSubmit = async (application: OnboardingState) => {
    if (!reviewForm.status) {
      toast.error("Please select a review status");
      return;
    }

    try {
      setIsSubmitting(true);
      await onboardingService.reviewOnboarding(
        application.providerId,
        reviewForm.status as OnboardingReviewStatus,
        reviewForm.notes
      );

      toast.success("Review submitted successfully");

      // Remove from pending list
      setPendingReviews(prev => prev.filter(app => app.id !== application.id));

      // Reset form
      setReviewForm({ status: '', notes: '' });
      setSelectedApplication(null);
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: OnboardingReviewStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'IN_REVIEW':
        return <Eye className="h-4 w-4 text-info" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'NEEDS_CHANGES':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: OnboardingReviewStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'IN_REVIEW':
        return <Badge variant="healthcarePrimary">In Review</Badge>;
      case 'APPROVED':
        return <Badge variant="healthcareSuccess">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'NEEDS_CHANGES':
        return <Badge variant="healthcareWarning">Needs Changes</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const renderApplicationDetails = (application: OnboardingState) => {
    const orgData = application.organizationData || {};
    const licenseData = application.licenseData || {};
    const serviceData = application.serviceData || {};
    const subscriptionData = application.subscriptionData || {};

    return (
      <div className="space-y-6">
        {/* Organization Information */}
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Information
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Name:</span>
              <p className="text-muted-foreground">{orgData.organizationName || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium">Type:</span>
              <p className="text-muted-foreground">{orgData.organizationType || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium">Phone:</span>
              <p className="text-muted-foreground">{orgData.phone || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium">Email:</span>
              <p className="text-muted-foreground">{orgData.email || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <span className="font-medium">Address:</span>
              <p className="text-muted-foreground">
                {[orgData.addressLine1, orgData.city, orgData.state, orgData.zipCode]
                  .filter(Boolean)
                  .join(', ') || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* License Information */}
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            License Information
          </h4>
          {licenseData.licenses && licenseData.licenses.length > 0 ? (
            <div className="space-y-3">
              {licenseData.licenses.map((license: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Type:</span>
                      <p className="text-muted-foreground">{license.licenseType}</p>
                    </div>
                    <div>
                      <span className="font-medium">Number:</span>
                      <p className="text-muted-foreground">{license.licenseNumber}</p>
                    </div>
                    <div>
                      <span className="font-medium">State:</span>
                      <p className="text-muted-foreground">{license.issuingState}</p>
                    </div>
                    <div>
                      <span className="font-medium">Expires:</span>
                      <p className="text-muted-foreground">
                        {license.expirationDate ? new Date(license.expirationDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    {license.documentUrl && (
                      <div className="col-span-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(license.documentUrl, '_blank')}
                        >
                          View Document
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No licenses uploaded</p>
          )}
        </div>

        <Separator />

        {/* Services */}
        <div>
          <h4 className="text-lg font-semibold mb-3">Services</h4>
          {serviceData.selectedServices && serviceData.selectedServices.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {serviceData.selectedServices.map((service: string, index: number) => (
                <Badge key={index} variant="outline">{service}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No services selected</p>
          )}
        </div>

        <Separator />

        {/* Subscription */}
        <div>
          <h4 className="text-lg font-semibold mb-3">Subscription</h4>
          <p className="text-muted-foreground">
            {subscriptionData.subscriptionTier || 'No subscription selected'}
          </p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading pending reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="healthcare-container py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold healthcare-heading">
            Provider Onboarding Reviews
          </h1>
          <p className="text-muted-foreground">
            Review and approve provider onboarding applications
          </p>
        </div>

        {pendingReviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Reviews</h3>
              <p className="text-muted-foreground">
                All provider applications have been reviewed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {pendingReviews.map((application) => (
              <Card key={application.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {application.organizationData?.organizationName || 'Unknown Organization'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Submitted {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : 'Recently'}
                        </span>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(application.adminReviewStatus)}
                          {getStatusBadge(application.adminReviewStatus)}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Application Details</DialogTitle>
                            <DialogDescription>
                              Review the complete provider application
                            </DialogDescription>
                          </DialogHeader>
                          {renderApplicationDetails(application)}
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        onClick={() => setSelectedApplication(application)}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Organization Type:</span>
                      <p className="text-muted-foreground">
                        {application.organizationData?.organizationType || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Primary License:</span>
                      <p className="text-muted-foreground">
                        {application.licenseData?.primaryLicenseType || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Services:</span>
                      <p className="text-muted-foreground">
                        {application.serviceData?.selectedServices?.length || 0} selected
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Subscription:</span>
                      <p className="text-muted-foreground">
                        {application.subscriptionData?.subscriptionTier || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Review Dialog */}
        {selectedApplication && (
          <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Review Application</DialogTitle>
                <DialogDescription>
                  Provide your review decision and notes for{' '}
                  {selectedApplication.organizationData?.organizationName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Review Decision</label>
                  <Select
                    value={reviewForm.status}
                    onValueChange={(value) => setReviewForm(prev => ({ ...prev, status: value as OnboardingReviewStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select review decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN_REVIEW">Mark as In Review</SelectItem>
                      <SelectItem value="APPROVED">Approve Application</SelectItem>
                      <SelectItem value="REJECTED">Reject Application</SelectItem>
                      <SelectItem value="NEEDS_CHANGES">Request Changes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Review Notes</label>
                  <Textarea
                    placeholder="Provide feedback or notes about this application..."
                    value={reviewForm.notes}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedApplication(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleReviewSubmit(selectedApplication)}
                    disabled={isSubmitting || !reviewForm.status}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}