"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

const STEPS = [
  { id: "department", title: "Department Information", description: "Verify your department and role" },
  { id: "review", title: "Review & Submit", description: "Review and submit your application" },
];

export default function HospitalSWOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [onboardingData, setOnboardingData] = useState({
    department: "",
    title: "",
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
    setIsSubmitting(true);
    
    try {
      // Update hospital staff profile with department info
      const response = await fetch(`/api/hospital-staff/by-user/${user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          department: onboardingData.department,
          title: onboardingData.title,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update hospital staff profile");
      }

      // Redirect to dashboard
      router.push("/hospital-sw/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      // Handle error
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
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="Social Services"
                value={onboardingData.department}
                onChange={(e) => setOnboardingData(prev => ({ ...prev, department: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                placeholder="Social Worker"
                value={onboardingData.title}
                onChange={(e) => setOnboardingData(prev => ({ ...prev, title: e.target.value }))}
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
                <p><strong>Department:</strong> {onboardingData.department}</p>
                <p><strong>Job Title:</strong> {onboardingData.title}</p>
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
            <h1 className="text-3xl font-bold">Hospital Social Work Onboarding</h1>
            <p className="text-muted-foreground mt-2">
              Complete your profile to start managing hospital discharges
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
