"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Building2,
  AlertCircle,
} from "lucide-react";
import {
  HospitalSWOnboardingOrganizationData,
} from "@carelink/types";

interface ReviewAndSubmitProps {
  organizationData?: HospitalSWOnboardingOrganizationData;
  onSubmit: () => void;
  isSubmitting: boolean;
  onAcknowledgmentChange?: (allChecked: boolean) => void;
}

export function ReviewAndSubmit({ 
  organizationData, 
  onSubmit, 
  isSubmitting,
  onAcknowledgmentChange
}: ReviewAndSubmitProps) {
  const [acknowledgments, setAcknowledgments] = useState({
    termsAccepted: false,
    privacyAccepted: false,
    accuracyConfirmed: false,
  });

  const allAcknowledgmentsChecked = Object.values(acknowledgments).every(value => value);

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
              <span className="font-medium">Hospital Name:</span>
              <p className="text-muted-foreground">{organizationData?.organizationName || 'Not provided'}</p>
            </div>
            <div>
              <span className="font-medium">Phone:</span>
              <p className="text-muted-foreground">{organizationData?.phone || 'Not provided'}</p>
            </div>
            <div>
              <span className="font-medium">Email:</span>
              <p className="text-muted-foreground">{organizationData?.email || 'Not provided'}</p>
            </div>
            {organizationData?.website && (
              <div>
                <span className="font-medium">Website:</span>
                <p className="text-muted-foreground">{organizationData.website}</p>
              </div>
            )}
            <div className="md:col-span-2">
              <span className="font-medium">Address:</span>
              <p className="text-muted-foreground">
                {[
                  organizationData?.addressLine1,
                  organizationData?.addressLine2,
                  organizationData?.city,
                  organizationData?.state,
                  organizationData?.zipCode
                ].filter(Boolean).join(', ') || 'Not provided'}
              </p>
            </div>
            <div>
              <span className="font-medium">County:</span>
              <p className="text-muted-foreground">{organizationData?.county || 'Not provided'}</p>
            </div>
            {organizationData?.ein && (
              <div>
                <span className="font-medium">EIN:</span>
                <p className="text-muted-foreground">{organizationData.ein}</p>
              </div>
            )}
            {organizationData?.description && (
              <div className="md:col-span-2">
                <span className="font-medium">Description:</span>
                <p className="text-muted-foreground">{organizationData.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Acknowledgments */}
      <Card>
        <CardHeader>
          <CardTitle>Review & Acknowledgments</CardTitle>
          <CardDescription>
            Please review all information and confirm the following
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={acknowledgments.termsAccepted}
                onCheckedChange={() => handleAcknowledgmentChange('termsAccepted')}
              />
              <label
                htmlFor="terms"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I accept the Terms of Service and agree to comply with all platform policies
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="privacy"
                checked={acknowledgments.privacyAccepted}
                onCheckedChange={() => handleAcknowledgmentChange('privacyAccepted')}
              />
              <label
                htmlFor="privacy"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I have read and agree to the Privacy Policy
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="accuracy"
                checked={acknowledgments.accuracyConfirmed}
                onCheckedChange={() => handleAcknowledgmentChange('accuracyConfirmed')}
              />
              <label
                htmlFor="accuracy"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I confirm that all information provided is accurate and up-to-date
              </label>
            </div>
          </div>

          <Separator />

          <div className="p-3 bg-info/10 border border-info/20 rounded-lg">
            <p className="text-sm text-info flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Your application will be reviewed by our admin team. You'll receive an email notification once your application has been reviewed and approved.
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

