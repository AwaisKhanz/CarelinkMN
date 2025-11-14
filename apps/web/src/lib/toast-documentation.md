# Toast Notification System Documentation

## Overview

The CareLinkMN toast notification system provides a comprehensive, accessible, and customizable notification system using Sonner with global color integration. All toasts use the healthcare design system colors and support multiple variants.

## Features

- ✅ **Global Color Integration**: Uses CSS custom properties from the design system
- ✅ **Multiple Variants**: Success, Error, Warning, Info, Primary, Secondary, Accent
- ✅ **Healthcare-Specific**: Pre-built toasts for healthcare workflows
- ✅ **TypeScript Support**: Full type safety and IntelliSense
- ✅ **Accessibility**: Screen reader support and keyboard navigation
- ✅ **Customizable**: Duration, actions, descriptions, and styling
- ✅ **Promise Support**: Built-in async operation handling

## Basic Usage

### Core Toast Functions

```typescript
import { 
  showToast, 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast, 
  showInfoToast,
  showPrimaryToast,
  showSecondaryToast,
  showAccentToast
} from "@/lib/toast";

// Basic usage
showSuccessToast("Operation completed successfully!");

// With description
showErrorToast("Something went wrong", {
  description: "Please try again or contact support",
  duration: 5000,
});

// With action button
showWarningToast("Session expiring", {
  description: "Your session will expire in 5 minutes",
  action: {
    label: "Extend Session",
    onClick: () => extendSession(),
  },
});
```

### Toast Options

```typescript
interface ToastOptions {
  description?: string;        // Additional description text
  duration?: number;          // Auto-dismiss duration (ms)
  action?: ToastAction;       // Action button
  cancel?: ToastAction;       // Cancel button
  className?: string;         // Additional CSS classes
}

interface ToastAction {
  label: string;              // Button text
  onClick: () => void;        // Click handler
}
```

## Variants

### 1. Basic Variants

```typescript
// Success (Green)
showSuccessToast("Success message", options);

// Error (Red)
showErrorToast("Error message", options);

// Warning (Yellow)
showWarningToast("Warning message", options);

// Info (Blue)
showInfoToast("Info message", options);
```

### 2. Color Variants (Using Global Colors)

```typescript
// Primary (Healthcare Blue)
showPrimaryToast("Primary message", options);

// Secondary (Healthcare Green)
showSecondaryToast("Secondary message", options);

// Accent (Healthcare Orange)
showAccentToast("Accent message", options);
```

## Specialized Toast Collections

### Authentication Toasts

```typescript
import { authToasts } from "@/lib/toast";

// Login/Logout
authToasts.loginSuccess("John Doe");
authToasts.loginError("Invalid credentials");
authToasts.logoutSuccess();

// Registration
authToasts.registerSuccess("user@example.com");
authToasts.registerError("Email already exists");

// Email Verification
authToasts.emailVerificationSent("user@example.com");
authToasts.emailVerificationSuccess();
authToasts.emailVerificationError("Invalid token");

// Password Reset
authToasts.passwordResetSent("user@example.com");
authToasts.passwordResetSuccess();
authToasts.passwordResetError("Token expired");

// Session Management
authToasts.sessionExpired(); // Includes "Sign In" action button
```

### Profile Management Toasts

```typescript
import { profileToasts } from "@/lib/toast";

profileToasts.updateSuccess();
profileToasts.updateError("Failed to update profile");
profileToasts.passwordChangeSuccess();
profileToasts.passwordChangeError("Current password incorrect");
```

### Form Validation Toasts

```typescript
import { validationToasts } from "@/lib/toast";

validationToasts.requiredField("Email address");
validationToasts.invalidEmail();
validationToasts.invalidPassword();
validationToasts.passwordMismatch();
validationToasts.phoneInvalid();
validationToasts.organizationRequired();
```

### Healthcare-Specific Toasts

```typescript
import { healthcareToasts } from "@/lib/toast";

// Patient Management
healthcareToasts.patientCreated("Jane Smith");
healthcareToasts.patientUpdated("Jane Smith");
healthcareToasts.patientError("Failed to save patient data");

// Referral Management
healthcareToasts.referralCreated("REF-2024-001");
healthcareToasts.referralUpdated("REF-2024-001");
healthcareToasts.referralError("Failed to create referral");

// Appointment Management
healthcareToasts.appointmentScheduled("Dec 15, 2024", "2:00 PM");
healthcareToasts.appointmentCancelled("Dec 15, 2024");
healthcareToasts.appointmentError("Time slot not available");

// System Notifications
healthcareToasts.systemMaintenance("Dec 20, 2024 2:00 AM", "Dec 20, 2024 4:00 AM");
healthcareToasts.dataSyncComplete();
healthcareToasts.dataSyncError("Database connection failed");
```

### Dashboard Toasts

```typescript
import { dashboardToasts } from "@/lib/toast";

dashboardToasts.widgetUpdated("Patient Statistics");
dashboardToasts.widgetError("Patient Statistics", "Data unavailable");
dashboardToasts.dataRefreshed();
dashboardToasts.exportComplete("PDF");
dashboardToasts.exportError("Failed to generate PDF");
```

## Advanced Usage

### Promise Toasts

```typescript
import { genericToasts } from "@/lib/toast";

const saveData = async () => {
  // Your async operation
  return await api.saveData();
};

genericToasts.promise(saveData(), {
  loading: "Saving data...",
  success: "Data saved successfully!",
  error: "Failed to save data",
});
```

### Custom Toast with Actions

```typescript
showErrorToast("Connection lost", {
  description: "Please check your internet connection",
  action: {
    label: "Retry",
    onClick: () => retryConnection(),
  },
  cancel: {
    label: "Dismiss",
    onClick: () => console.log("Dismissed"),
  },
});
```

### Loading Toasts

```typescript
import { genericToasts } from "@/lib/toast";

// Show loading toast
const loadingId = genericToasts.loading("Processing...");

// Dismiss after completion
setTimeout(() => {
  genericToasts.dismiss(loadingId);
  showSuccessToast("Processing complete!");
}, 3000);
```

## Color System Integration

All toast variants automatically use the global color system defined in `globals.css`:

- **Success**: `--success` (Healthcare Green)
- **Error**: `--destructive` (Red)
- **Warning**: `--warning` (Healthcare Yellow)
- **Info**: `--info` (Healthcare Blue)
- **Primary**: `--primary` (Healthcare Blue)
- **Secondary**: `--secondary` (Healthcare Green)
- **Accent**: `--accent` (Healthcare Orange)

## Accessibility Features

- **Screen Reader Support**: All toasts are announced to screen readers
- **Keyboard Navigation**: Action buttons are keyboard accessible
- **High Contrast**: Colors meet WCAG contrast requirements
- **Focus Management**: Proper focus handling for interactive elements

## Best Practices

### 1. Use Appropriate Variants

```typescript
// ✅ Good - Clear success indication
showSuccessToast("Patient record saved");

// ❌ Avoid - Using error for non-critical issues
showErrorToast("Profile picture updated");
```

### 2. Provide Context

```typescript
// ✅ Good - Descriptive with context
showErrorToast("Failed to save patient data", {
  description: "Please check your internet connection and try again",
});

// ❌ Avoid - Vague messages
showErrorToast("Error");
```

### 3. Use Actions Wisely

```typescript
// ✅ Good - Actionable error with retry
showErrorToast("Upload failed", {
  action: {
    label: "Retry Upload",
    onClick: () => retryUpload(),
  },
});

// ❌ Avoid - Actions for informational messages
showInfoToast("Data synced", {
  action: { label: "OK", onClick: () => {} }, // Unnecessary
});
```

### 4. Appropriate Duration

```typescript
// ✅ Good - Longer duration for important messages
showErrorToast("Critical error", { duration: 8000 });

// ✅ Good - Shorter duration for quick confirmations
showSuccessToast("Saved", { duration: 2000 });
```

## Demo Component

Use the `SonnerDemo` component to test all toast variants:

```typescript
import { SonnerDemo } from "@/components/demo/sonner-demo";

// In your page or component
<SonnerDemo />
```

## Migration from Alert Components

Replace existing Alert components with appropriate toast notifications:

```typescript
// Before (Alert component)
{error && (
  <Alert variant="destructive">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}

// After (Toast notification)
useEffect(() => {
  if (error) {
    showErrorToast("Operation failed", { description: error });
  }
}, [error]);
```

## TypeScript Support

The toast system provides full TypeScript support with:

- **Type-safe options**: All options are properly typed
- **IntelliSense**: Auto-completion for all functions and options
- **Error prevention**: Compile-time checks for function signatures
- **Generic support**: Type-safe promise toasts

```typescript
// Type-safe promise toast
genericToasts.promise<ApiResponse>(
  fetchData(),
  {
    loading: "Loading...",
    success: (data) => `Loaded ${data.count} items`,
    error: (error) => `Failed: ${error.message}`,
  }
);
```

This comprehensive toast system ensures consistent, accessible, and maintainable notifications throughout the CareLinkMN application.
