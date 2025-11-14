"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  FileText,
  Check,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Shield,
  Users,
  Loader2,
} from "lucide-react";
import { homeService, Service } from "@/lib/api";
import { toast } from "sonner";
import {
  LICENSE_TYPES,
  SUBSCRIPTION_PLANS_SIMPLE,
  getLicenseTypeLabel,
  getSubscriptionPlanLabel,
} from "@/lib/constants";

interface ReviewAndSubmitProps {
  data: {
    // Organization data
    organizationName: string;
    organizationType: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    county: string;
    phone: string;
    email: string;
    website?: string;

    // Provider data
    primaryLicenseType: string;
    description: string;
    acceptsReferrals: boolean;
    responseTimeHours: number;

    // License data
    licenses: Array<{
      licenseType: string;
      licenseNumber: string;
      issuingState: string;
      issueDate: string;
      expirationDate: string;
      documentUrl: string;
    }>;

    // Services
    selectedServices: string[];

    // Subscription
    subscriptionTier: string;
  };
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ReviewAndSubmit({
  data,
  onSubmit,
  isSubmitting,
}: ReviewAndSubmitProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoadingServices(true);
        const response = await homeService.getAvailableServices();
        if (response.success && response.data) {
          setServices(response.data);
        } else {
          toast.error("Failed to load services");
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        toast.error("Failed to load services");
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  const getServiceName = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    return service ? service.name : serviceId;
  };

  // Group selected services by category
  const servicesByCategory = data.selectedServices.reduce(
    (acc: Record<string, string[]>, serviceId: string) => {
      const service = services.find((s) => s.id === serviceId);
      if (service) {
        const category = service.category || "Other";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(serviceId);
      }
      return acc;
    },
    {}
  );

  const getLicenseTypeName = (licenseType: string) => {
    return getLicenseTypeLabel(licenseType);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Review Your Application
          </CardTitle>
          <CardDescription>
            Please review all information before submitting your provider
            application
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Organization Information */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Organization Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Organization Name</h4>
              <p className="text-muted-foreground">{data.organizationName}</p>
            </div>
            <div>
              <h4 className="font-medium">Organization Type</h4>
              <p className="text-muted-foreground">{data.organizationType}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium">Address</h4>
            <p className="text-muted-foreground">
              {data.addressLine1}
              {data.addressLine2 && (
                <>
                  <br />
                  {data.addressLine2}
                </>
              )}
              <br />
              {data.city}, {data.state} {data.zipCode}
              <br />
              {data.county} County
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{data.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{data.email}</span>
            </div>
            {data.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{data.website}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Provider Details */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Provider Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Primary License Type</h4>
            <p className="text-muted-foreground">
              {getLicenseTypeName(data.primaryLicenseType)}
            </p>
          </div>

          <div>
            <h4 className="font-medium">Description</h4>
            <p className="text-muted-foreground">{data.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Response Time</h4>
              <p className="text-muted-foreground">
                {data.responseTimeHours} hours
              </p>
            </div>
            <div>
              <h4 className="font-medium">Accepting Referrals</h4>
              <Badge
                variant={
                  data.acceptsReferrals
                    ? "healthcareSuccess"
                    : "healthcareWarning"
                }
              >
                {data.acceptsReferrals ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Licenses */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            License Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.licenses.map((license, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">
                    {getLicenseTypeName(license.licenseType)}
                  </h4>
                  <Badge variant="healthcareSuccess" className="text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Uploaded
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">License Number:</span>{" "}
                    {license.licenseNumber}
                  </div>
                  <div>
                    <span className="font-medium">Issuing State:</span>{" "}
                    {license.issuingState}
                  </div>
                  <div>
                    <span className="font-medium">Issue Date:</span>{" "}
                    {formatDate(license.issueDate)}
                  </div>
                  <div>
                    <span className="font-medium">Expiration Date:</span>{" "}
                    {formatDate(license.expirationDate)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            Selected Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingServices ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">
                Loading services...
              </span>
            </div>
          ) : Object.keys(servicesByCategory).length === 0 ? (
            <p className="text-muted-foreground">No services selected</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(servicesByCategory).map(
                ([categoryName, serviceIds]) => (
                  <div key={categoryName}>
                    <h4 className="font-medium mb-2">{categoryName}</h4>
                    <div className="flex flex-wrap gap-2">
                      {serviceIds.map((serviceId) => (
                        <Badge
                          key={serviceId}
                          variant="healthcarePrimary"
                          className="text-xs"
                        >
                          {getServiceName(serviceId)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Plan */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Subscription Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">
                {getSubscriptionPlanLabel(data.subscriptionTier)}
              </h4>
              <p className="text-sm text-muted-foreground">
                {data.subscriptionTier === "FREE" &&
                  "Perfect for getting started"}
                {data.subscriptionTier === "BASIC" &&
                  "Great for small providers"}
                {data.subscriptionTier === "PREMIUM" && "For growing providers"}
                {data.subscriptionTier === "ENTERPRISE" &&
                  "For large organizations"}
              </p>
            </div>
            <Badge variant="healthcarePrimary" className="text-sm">
              {data.subscriptionTier === "FREE" && "Free"}
              {data.subscriptionTier === "BASIC" && "$99/month"}
              {data.subscriptionTier === "PREMIUM" && "$299/month"}
              {data.subscriptionTier === "ENTERPRISE" && "Custom Pricing"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Terms and Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>By submitting this application, you agree to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Provide accurate and up-to-date information</li>
              <li>Maintain valid licenses and certifications</li>
              <li>Respond to referrals within your stated response time</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Maintain the confidentiality of client information</li>
              <li>Participate in quality assurance and monitoring programs</li>
            </ul>
          </div>

          <Separator />

          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Note:</strong> Your application will be reviewed by our
              team within 2-3 business days. You will receive an email
              notification once your application is approved and your provider
              profile is live on the platform.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          onClick={onSubmit}
          variant="healthcare"
          size="lg"
          disabled={isSubmitting}
          className="px-8"
        >
          {isSubmitting ? "Submitting Application..." : "Submit Application"}
        </Button>
      </div>
    </div>
  );
}
