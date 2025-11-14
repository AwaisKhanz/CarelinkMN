"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { caseManagerService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { id: "license", title: "License Information", description: "Verify your professional license" },
  { id: "review", title: "Review & Submit", description: "Review and submit your application" },
];

export default function CaseManagerOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [onboardingData, setOnboardingData] = useState({
    licenseNumber: "",
    licenseExpiry: "",
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("User not found");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Update case manager profile with license info
      const response = await caseManagerService.updateCaseManager(user.id, {
        licenseNumber: onboardingData.licenseNumber,
        licenseExpiry: onboardingData.licenseExpiry,
      });
      
      if (response.success) {
        toast.success("Profile updated successfully");
        // Redirect to dashboard
        router.push("/case-manager/dashboard");
      } else {
        toast.error(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                placeholder="SW123456"
                value={onboardingData.licenseNumber}
                onChange={(e) => setOnboardingData(prev => ({ ...prev, licenseNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseExpiry">License Expiry Date</Label>
              <Input
                id="licenseExpiry"
                type="date"
                value={onboardingData.licenseExpiry}
                onChange={(e) => setOnboardingData(prev => ({ ...prev, licenseExpiry: e.target.value }))}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review Your Information</h3>
              <div className="space-y-2">
                <p><strong>License Number:</strong> {onboardingData.licenseNumber}</p>
                <p><strong>License Expiry:</strong> {onboardingData.licenseExpiry}</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Case Manager Onboarding</h1>
            <p className="text-muted-foreground mt-2">
              Complete your profile to start managing referrals
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Step {currentStep + 1} of {STEPS.length}</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[currentStep].title}</CardTitle>
              <CardDescription>{STEPS[currentStep].description}</CardDescription>
            </CardHeader>
            <CardContent>
              {renderStep()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            {currentStep === STEPS.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
