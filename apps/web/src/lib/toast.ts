import { toast } from "sonner";

// Toast variant types
export type ToastVariant =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "primary"
  | "secondary"
  | "accent";

// Toast action type
export interface ToastAction {
  label: string;
  onClick: () => void;
}

// Base toast options
export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: ToastAction;
  cancel?: ToastAction;
  className?: string;
}

// Core toast functions with variant support
export const showToast = (
  message: string,
  variant: ToastVariant = "default",
  options: ToastOptions = {}
) => {
  const { description, duration, action, cancel, className } = options;

  const toastOptions = {
    description,
    duration: duration || (variant === "error" ? 5000 : 4000),
    action,
    cancel,
    className: className ? `${variant} ${className}` : variant,
  };

  switch (variant) {
    case "success":
      return toast.success(message, toastOptions);
    case "error":
      return toast.error(message, toastOptions);
    case "warning":
      return toast.warning(message, toastOptions);
    case "info":
      return toast.info(message, toastOptions);
    case "primary":
      return toast(message, {
        ...toastOptions,
        className: `group-[.toaster]:bg-primary/10 group-[.toast]:text-primary group-[.toaster]:border-primary/20 group-[.toaster]:shadow-primary/10 ${className || ""}`,
      });
    case "secondary":
      return toast(message, {
        ...toastOptions,
        className: `group-[.toaster]:bg-secondary/10 group-[.toast]:text-secondary group-[.toaster]:border-secondary/20 group-[.toaster]:shadow-secondary/10 ${className || ""}`,
      });
    case "accent":
      return toast(message, {
        ...toastOptions,
        className: `group-[.toaster]:bg-accent/10 group-[.toast]:text-accent group-[.toaster]:border-accent/20 group-[.toaster]:shadow-accent/10 ${className || ""}`,
      });
    default:
      return toast(message, toastOptions);
  }
};

// Convenience functions for each variant
export const showSuccessToast = (message: string, options?: ToastOptions) =>
  showToast(message, "success", options);

export const showErrorToast = (message: string, options?: ToastOptions) =>
  showToast(message, "error", options);

export const showWarningToast = (message: string, options?: ToastOptions) =>
  showToast(message, "warning", options);

export const showInfoToast = (message: string, options?: ToastOptions) =>
  showToast(message, "info", options);

export const showPrimaryToast = (message: string, options?: ToastOptions) =>
  showToast(message, "primary", options);

export const showSecondaryToast = (message: string, options?: ToastOptions) =>
  showToast(message, "secondary", options);

export const showAccentToast = (message: string, options?: ToastOptions) =>
  showToast(message, "accent", options);

// Auth-specific toast messages with enhanced variants
export const authToasts = {
  loginSuccess: (userName?: string) =>
    showSuccessToast("Welcome back!", {
      description: userName
        ? `Signed in as ${userName}`
        : "You have been successfully signed in",
      duration: 3000,
    }),

  loginError: (message: string) =>
    showErrorToast("Sign in failed", {
      description: message,
      duration: 5000,
    }),

  registerSuccess: (email: string) =>
    showSuccessToast("Registration successful!", {
      description: `Account created for ${email}. Please check your email to verify your account.`,
      duration: 6000,
    }),

  registerError: (message: string) =>
    showErrorToast("Registration failed", {
      description: message,
      duration: 5000,
    }),

  emailVerificationSent: (email: string) =>
    showInfoToast("Verification email sent", {
      description: `A new verification email has been sent to ${email}`,
      duration: 4000,
    }),

  emailVerificationSuccess: () =>
    showSuccessToast("Email verified!", {
      description:
        "Your email has been successfully verified. You can now sign in.",
      duration: 4000,
    }),

  emailVerificationError: (message: string) =>
    showErrorToast("Email verification failed", {
      description: message,
      duration: 5000,
    }),

  passwordResetSent: (email: string) =>
    showInfoToast("Password reset email sent", {
      description: `Instructions to reset your password have been sent to ${email}`,
      duration: 4000,
    }),

  passwordResetSuccess: () =>
    showSuccessToast("Password reset successful", {
      description: "Your password has been successfully updated",
      duration: 4000,
    }),

  passwordResetError: (message: string) =>
    showErrorToast("Password reset failed", {
      description: message,
      duration: 5000,
    }),

  logoutSuccess: () =>
    showInfoToast("Signed out", {
      description: "You have been successfully signed out",
      duration: 3000,
    }),

  sessionExpired: () =>
    showWarningToast("Session expired", {
      description: "Your session has expired. Please sign in again.",
      duration: 5000,
      action: {
        label: "Sign In",
        onClick: () => (window.location.href = "/auth/signin"),
      },
    }),
};

// Profile-specific toast messages with enhanced variants
export const profileToasts = {
  updateSuccess: () =>
    showSuccessToast("Profile updated", {
      description: "Your profile has been successfully updated",
      duration: 3000,
    }),

  updateError: (message: string) =>
    showErrorToast("Profile update failed", {
      description: message,
      duration: 5000,
    }),

  passwordChangeSuccess: () =>
    showSuccessToast("Password changed", {
      description: "Your password has been successfully updated",
      duration: 3000,
    }),

  passwordChangeError: (message: string) =>
    showErrorToast("Password change failed", {
      description: message,
      duration: 5000,
    }),
};

// Form validation toast messages with enhanced variants
export const validationToasts = {
  requiredField: (fieldName: string) =>
    showErrorToast("Validation error", {
      description: `${fieldName} is required`,
      duration: 4000,
    }),

  invalidEmail: () =>
    showErrorToast("Invalid email", {
      description: "Please enter a valid email address",
      duration: 4000,
    }),

  invalidPassword: () =>
    showErrorToast("Invalid password", {
      description:
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
      duration: 5000,
    }),

  passwordMismatch: () =>
    showErrorToast("Passwords don't match", {
      description: "Please make sure both passwords are the same",
      duration: 4000,
    }),

  phoneInvalid: () =>
    showErrorToast("Invalid phone number", {
      description: "Please enter a valid phone number",
      duration: 4000,
    }),

  organizationRequired: () =>
    showErrorToast("Organization required", {
      description: "Please provide organization details for this role",
      duration: 4000,
    }),
};

// Healthcare-specific toast messages
export const healthcareToasts = {
  // Patient-related toasts
  patientCreated: (patientName: string) =>
    showSuccessToast("Patient added", {
      description: `${patientName} has been successfully added to the system`,
      duration: 4000,
    }),

  patientUpdated: (patientName: string) =>
    showSuccessToast("Patient updated", {
      description: `${patientName}'s information has been updated`,
      duration: 3000,
    }),

  patientError: (message: string) =>
    showErrorToast("Patient operation failed", {
      description: message,
      duration: 5000,
    }),

  // Referral-related toasts
  referralCreated: (referralId: string) =>
    showSuccessToast("Referral created", {
      description: `Referral ${referralId} has been successfully created`,
      duration: 4000,
    }),

  referralUpdated: (referralId: string) =>
    showSuccessToast("Referral updated", {
      description: `Referral ${referralId} has been updated`,
      duration: 3000,
    }),

  referralError: (message: string) =>
    showErrorToast("Referral operation failed", {
      description: message,
      duration: 5000,
    }),

  // Appointment-related toasts
  appointmentScheduled: (date: string, time: string) =>
    showSuccessToast("Appointment scheduled", {
      description: `Appointment scheduled for ${date} at ${time}`,
      duration: 4000,
    }),

  appointmentCancelled: (date: string) =>
    showWarningToast("Appointment cancelled", {
      description: `Appointment for ${date} has been cancelled`,
      duration: 4000,
    }),

  appointmentError: (message: string) =>
    showErrorToast("Appointment operation failed", {
      description: message,
      duration: 5000,
    }),

  // System notifications
  systemMaintenance: (startTime: string, endTime: string) =>
    showWarningToast("System maintenance scheduled", {
      description: `System will be under maintenance from ${startTime} to ${endTime}`,
      duration: 8000,
      action: {
        label: "Learn More",
        onClick: () => window.open("/maintenance", "_blank"),
      },
    }),

  dataSyncComplete: () =>
    showInfoToast("Data sync complete", {
      description: "All patient data has been synchronized successfully",
      duration: 3000,
    }),

  dataSyncError: (message: string) =>
    showErrorToast("Data sync failed", {
      description: message,
      duration: 5000,
    }),
};

// Dashboard-specific toast messages
export const dashboardToasts = {
  widgetUpdated: (widgetName: string) =>
    showSuccessToast("Widget updated", {
      description: `${widgetName} has been updated successfully`,
      duration: 3000,
    }),

  widgetError: (widgetName: string, message: string) =>
    showErrorToast("Widget error", {
      description: `${widgetName}: ${message}`,
      duration: 5000,
    }),

  dataRefreshed: () =>
    showInfoToast("Data refreshed", {
      description: "Dashboard data has been updated",
      duration: 2000,
    }),

  exportComplete: (format: string) =>
    showSuccessToast("Export complete", {
      description: `Data exported successfully as ${format}`,
      duration: 3000,
    }),

  exportError: (message: string) =>
    showErrorToast("Export failed", {
      description: message,
      duration: 5000,
    }),
};

// Generic toast messages
export const genericToasts = {
  loading: (message: string) => toast.loading(message),

  dismiss: (toastId: string | number) => toast.dismiss(toastId),

  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) =>
    toast.promise(promise, {
      loading,
      success,
      error,
    }),
};
