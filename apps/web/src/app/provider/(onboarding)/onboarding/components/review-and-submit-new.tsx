"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle,
  Building2,
  FileText,
  Users,
  Crown,
  AlertCircle,
  Loader2,
  Eye
} from "lucide-react";
import { OnboardingState } from "@/lib/api/services/onboarding.service";
import {
  LICENSE_TYPES_MAP,
  SUBSCRIPTION_PLANS_MAP,
} from "@/lib/constants";
import { homeService, Service } from "@/lib/api";

interface ReviewAndSubmitProps {
  onboardingState: OnboardingState;
  onSubmit: () => void;
  isSubmitting: boolean;
  onAcknowledgmentChange?: (allChecked: boolean) => void;
}

export function ReviewAndSubmit({ onboardingState, onSubmit, isSubmitting, onAcknowledgmentChange }: ReviewAndSubmitProps) {
  const [acknowledgments, setAcknowledgments] = useState({
    termsAccepted: false,
    privacyAccepted: false,
    accuracyConfirmed: false,
    licenseValidityConfirmed: false,
  });
  const [services, setServices] = useState<Service[]>([]);

  const orgData = onboardingState.organizationData || {};
  const licenseData = onboardingState.licenseData || {};
  const serviceData = onboardingState.serviceData || {};
  const subscriptionData = onboardingState.subscriptionData || {};

  const allAcknowledgmentsChecked = Object.values(acknowledgments).every(value => value);

  // Fetch services to display names in review
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await homeService.getAvailableServices();
        if (response.success && response.data) {
          setServices(response.data);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };
    fetchServices();
  }, []);

  const getServiceName = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    return service ? service.name : serviceId;
  };

  const handleAcknowledgmentChange = (key: keyof typeof acknowledgments) => {
    setAcknowledgments(prev => {
      const updated = {
        ...prev,
        [key]: !prev[key]
      };
      const allChecked = Object.values(updated).every(value => value);
      if (onAcknowledgmentChange) {
        onAcknowledgmentChange(allChecked);
      }
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* Organization Information Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Organization Name:</span>
              <p className="text-muted-foreground">{orgData.organizationName || 'Not provided'}</p>
            </div>
            {/* Organization Type is not shown - it's set during registration and not editable */}
            <div>
              <span className="font-medium">Phone:</span>
              <p className="text-muted-foreground">{orgData.phone || 'Not provided'}</p>
            </div>
            <div>
              <span className="font-medium">Email:</span>
              <p className="text-muted-foreground">{orgData.email || 'Not provided'}</p>
            </div>
            <div className="md:col-span-2">
              <span className="font-medium">Address:</span>
              <p className="text-muted-foreground">
                {[
                  orgData.addressLine1,
                  orgData.addressLine2,
                  orgData.city,
                  orgData.state,
                  orgData.zipCode
                ].filter(Boolean).join(', ') || 'Not provided'}
              </p>
            </div>
            <div>
              <span className="font-medium">County:</span>
              <p className="text-muted-foreground">{orgData.county || 'Not provided'}</p>
            </div>
            {/* Primary License Type is shown in License Information section below */}
          </div>
        </CardContent>
      </Card>

      {/* License Information Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            License Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Primary License Type */}
            {licenseData.primaryLicenseType && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">Primary License Type:</span>
                    <p className="text-muted-foreground mt-1">
                      {LICENSE_TYPES_MAP[licenseData.primaryLicenseType] || licenseData.primaryLicenseType}
                    </p>
                  </div>
                  <Badge variant="healthcarePrimary">Primary</Badge>
                </div>
              </div>
            )}

            {/* Individual Licenses */}
            {licenseData.licenses && licenseData.licenses.length > 0 ? (
              <div className="space-y-4">
                {licenseData.licenses.map((license: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">License Type:</span>
                      <p className="text-muted-foreground">
                        {LICENSE_TYPES_MAP[license.licenseType] || license.licenseType}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">License Number:</span>
                      <p className="text-muted-foreground">{license.licenseNumber}</p>
                    </div>
                    <div>
                      <span className="font-medium">Expiration Date:</span>
                      <p className="text-muted-foreground">
                        {license.expirationDate ? new Date(license.expirationDate).toLocaleDateString() : 'Not provided'}
                      </p>
                    </div>
                    {license.documentUrl && (
                      <div className="md:col-span-2">
                        <span className="font-medium">Document:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="healthcareSuccess">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Uploaded
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(license.documentUrl, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Document
                          </Button>
                        </div>
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
        </CardContent>
      </Card>

      {/* Services Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Services Offered
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serviceData.selectedServices && serviceData.selectedServices.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {serviceData.selectedServices.map((serviceId: string, index: number) => (
                <Badge key={index} variant="outline">
                  {getServiceName(serviceId)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No services selected</p>
          )}
        </CardContent>
      </Card>

      {/* Subscription Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Subscription Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="healthcarePrimary">
              {SUBSCRIPTION_PLANS_MAP[subscriptionData.subscriptionTier] || subscriptionData.subscriptionTier || 'No plan selected'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Terms and Agreements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Terms and Agreements
          </CardTitle>
          <CardDescription>
            Please review and accept the following terms before submitting your application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={acknowledgments.termsAccepted}
                onCheckedChange={() => handleAcknowledgmentChange('termsAccepted')}
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed">
                I have read and accept the{' '}
                <a href="/terms" target="_blank" className="text-primary underline">
                  Terms of Service
                </a>{' '}
                and understand the provider responsibilities and obligations.
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="privacy"
                checked={acknowledgments.privacyAccepted}
                onCheckedChange={() => handleAcknowledgmentChange('privacyAccepted')}
                className="mt-1"
              />
              <Label htmlFor="privacy" className="text-sm leading-relaxed">
                I have read and accept the{' '}
                <a href="/privacy" target="_blank" className="text-primary underline">
                  Privacy Policy
                </a>{' '}
                and consent to the processing of my organization's data as described.
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="accuracy"
                checked={acknowledgments.accuracyConfirmed}
                onCheckedChange={() => handleAcknowledgmentChange('accuracyConfirmed')}
                className="mt-1"
              />
              <Label htmlFor="accuracy" className="text-sm leading-relaxed">
                I confirm that all information provided in this application is accurate and complete
                to the best of my knowledge. I understand that providing false information may result
                in application rejection or account termination.
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="licenses"
                checked={acknowledgments.licenseValidityConfirmed}
                onCheckedChange={() => handleAcknowledgmentChange('licenseValidityConfirmed')}
                className="mt-1"
              />
              <Label htmlFor="licenses" className="text-sm leading-relaxed">
                I confirm that all licenses and certifications provided are current, valid, and
                in good standing. I understand that CareLinkMN will verify all licenses and
                may request additional documentation.
              </Label>
            </div>
          </div>

          <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
            <h4 className="font-medium text-info mb-2">What happens next?</h4>
            <ul className="text-sm text-info space-y-1">
              <li>• Your application will be reviewed by our admin team</li>
              <li>• We'll verify your licenses and credentials</li>
              <li>• You'll receive an email notification about your application status</li>
              <li>• Review typically takes 2-3 business days</li>
              <li>• Once approved, you can start receiving referrals</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {!allAcknowledgmentsChecked && (
        <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
          <p className="text-sm text-warning text-center">
            Please accept all terms and agreements to submit your application.
          </p>
        </div>
      )}
    </div>
  );
}

// Label component if not imported
function Label({ htmlFor, className, children }: { htmlFor: string; className?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  );
}