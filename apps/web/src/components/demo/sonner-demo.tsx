"use client";

import { Button } from "@/components/ui/button";
import { 
  showToast, 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast, 
  showInfoToast,
  showPrimaryToast,
  showSecondaryToast,
  showAccentToast,
  authToasts, 
  profileToasts, 
  validationToasts, 
  healthcareToasts,
  dashboardToasts,
  genericToasts 
} from "@/lib/toast";

export function SonnerDemo() {
  // Basic variant toasts
  const handleSuccessToast = () => {
    showSuccessToast("Event has been created", {
      description: "Sunday, December 03, 2023 at 9:00 AM",
      action: {
        label: "Undo",
        onClick: () => console.log("Undo"),
      },
    });
  };

  const handleErrorToast = () => {
    showErrorToast("Something went wrong", {
      description: "Please try again or contact support if the problem persists.",
    });
  };

  const handleWarningToast = () => {
    showWarningToast("Session expiring soon", {
      description: "Your session will expire in 5 minutes. Please save your work.",
    });
  };

  const handleInfoToast = () => {
    showInfoToast("New feature available", {
      description: "Check out our new dashboard analytics feature.",
    });
  };

  // Color variant toasts
  const handlePrimaryToast = () => {
    showPrimaryToast("Primary notification", {
      description: "This uses the primary color from your design system",
    });
  };

  const handleSecondaryToast = () => {
    showSecondaryToast("Secondary notification", {
      description: "This uses the secondary color from your design system",
    });
  };

  const handleAccentToast = () => {
    showAccentToast("Accent notification", {
      description: "This uses the accent color from your design system",
    });
  };

  // Auth toasts
  const handleAuthSuccess = () => {
    authToasts.loginSuccess("John Doe");
  };

  const handleAuthError = () => {
    authToasts.loginError("Invalid email or password");
  };

  const handleSessionExpired = () => {
    authToasts.sessionExpired();
  };

  // Profile toasts
  const handleProfileSuccess = () => {
    profileToasts.updateSuccess();
  };

  const handleProfileError = () => {
    profileToasts.updateError("Failed to update profile information");
  };

  // Validation toasts
  const handleValidationError = () => {
    validationToasts.invalidEmail();
  };

  const handlePasswordMismatch = () => {
    validationToasts.passwordMismatch();
  };

  // Healthcare toasts
  const handlePatientCreated = () => {
    healthcareToasts.patientCreated("Jane Smith");
  };

  const handleReferralCreated = () => {
    healthcareToasts.referralCreated("REF-2024-001");
  };

  const handleAppointmentScheduled = () => {
    healthcareToasts.appointmentScheduled("Dec 15, 2024", "2:00 PM");
  };

  const handleSystemMaintenance = () => {
    healthcareToasts.systemMaintenance("Dec 20, 2024 2:00 AM", "Dec 20, 2024 4:00 AM");
  };

  // Dashboard toasts
  const handleWidgetUpdated = () => {
    dashboardToasts.widgetUpdated("Patient Statistics");
  };

  const handleDataRefreshed = () => {
    dashboardToasts.dataRefreshed();
  };

  const handleExportComplete = () => {
    dashboardToasts.exportComplete("PDF");
  };

  // Promise toast
  const handlePromiseToast = () => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve("Success!") : reject("Failed!");
      }, 2000);
    });

    genericToasts.promise(promise, {
      loading: "Loading...",
      success: "Data loaded successfully!",
      error: "Failed to load data",
    });
  };

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold">Toast Notification System Demo</h2>
        <p className="text-muted-foreground text-lg">
          Comprehensive toast notification system using global colors and variants
        </p>
      </div>

      {/* Basic Variants */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Basic Variants</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" onClick={handleSuccessToast}>
            Success Toast
          </Button>
          <Button variant="outline" onClick={handleErrorToast}>
            Error Toast
          </Button>
          <Button variant="outline" onClick={handleWarningToast}>
            Warning Toast
          </Button>
          <Button variant="outline" onClick={handleInfoToast}>
            Info Toast
          </Button>
        </div>
      </div>

      {/* Color Variants */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Color Variants (Using Global Colors)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="healthcare" onClick={handlePrimaryToast}>
            Primary Toast
          </Button>
          <Button variant="outline" onClick={handleSecondaryToast}>
            Secondary Toast
          </Button>
          <Button variant="outline" onClick={handleAccentToast}>
            Accent Toast
          </Button>
        </div>
      </div>

      {/* Auth Toasts */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Authentication Toasts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="healthcare" onClick={handleAuthSuccess}>
            Login Success
          </Button>
          <Button variant="destructive" onClick={handleAuthError}>
            Login Error
          </Button>
          <Button variant="outline" onClick={handleSessionExpired}>
            Session Expired
          </Button>
        </div>
      </div>

      {/* Profile Toasts */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Profile Management Toasts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline" onClick={handleProfileSuccess}>
            Profile Update Success
          </Button>
          <Button variant="outline" onClick={handleProfileError}>
            Profile Update Error
          </Button>
        </div>
      </div>

      {/* Validation Toasts */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Form Validation Toasts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline" onClick={handleValidationError}>
            Invalid Email
          </Button>
          <Button variant="outline" onClick={handlePasswordMismatch}>
            Password Mismatch
          </Button>
        </div>
      </div>

      {/* Healthcare Toasts */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Healthcare-Specific Toasts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" onClick={handlePatientCreated}>
            Patient Created
          </Button>
          <Button variant="outline" onClick={handleReferralCreated}>
            Referral Created
          </Button>
          <Button variant="outline" onClick={handleAppointmentScheduled}>
            Appointment Scheduled
          </Button>
          <Button variant="outline" onClick={handleSystemMaintenance}>
            System Maintenance
          </Button>
        </div>
      </div>

      {/* Dashboard Toasts */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Dashboard Toasts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" onClick={handleWidgetUpdated}>
            Widget Updated
          </Button>
          <Button variant="outline" onClick={handleDataRefreshed}>
            Data Refreshed
          </Button>
          <Button variant="outline" onClick={handleExportComplete}>
            Export Complete
          </Button>
        </div>
      </div>

      {/* Promise Toast */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Promise Toast (Async Operations)</h3>
        <Button variant="outline" onClick={handlePromiseToast}>
          Show Promise Toast
        </Button>
      </div>

      {/* Usage Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Usage Examples</h3>
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">Basic Usage:</p>
          <code className="text-xs bg-background p-2 rounded block">
            {`showSuccessToast("Success!", { description: "Operation completed" })`}
          </code>
          
          <p className="text-sm font-medium mt-4">With Actions:</p>
          <code className="text-xs bg-background p-2 rounded block">
            {`showErrorToast("Error!", { 
  action: { label: "Retry", onClick: () => retry() }
})`}
          </code>
          
          <p className="text-sm font-medium mt-4">Healthcare Specific:</p>
          <code className="text-xs bg-background p-2 rounded block">
            {`healthcareToasts.patientCreated("John Doe")`}
          </code>
        </div>
      </div>
    </div>
  );
}
