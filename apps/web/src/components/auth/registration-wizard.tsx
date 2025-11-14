"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmailVerificationPrompt } from "./email-verification-prompt";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@carelink/types";
import { authToasts } from "@/lib/toast";

// Simplified registration request - no organization or license data
interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

// Step schemas - only personal info and password
const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: "Please select a role" }),
  }),
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PersonalInfoForm = z.infer<typeof personalInfoSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// Simplified registration data type - only user account info
interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
}

interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
}

const roleOptions: RoleOption[] = [
  {
    value: UserRole.PROVIDER_OWNER,
    label: "Provider Owner",
    description: "Manage care facilities and staff",
  },
  {
    value: UserRole.PROVIDER_STAFF,
    label: "Provider Staff",
    description: "Manage openings and referrals",
  },
  {
    value: UserRole.CASE_MANAGER,
    label: "Case Manager",
    description: "Create and manage referrals",
  },
  {
    value: UserRole.HOSPITAL_SW,
    label: "Hospital Social Worker",
    description: "Coordinate hospital discharges",
  },
  {
    value: UserRole.VRS_SPECIALIST,
    label: "VRS Specialist",
    description: "Vocational rehabilitation services",
  },
  {
    value: UserRole.VENDOR,
    label: "Vendor",
    description: "Provide services to the care community",
  },
  {
    value: UserRole.PUBLIC,
    label: "Family Member",
    description: "Search for care options",
  },
];

export function RegistrationWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    firstName: "",
    lastName: "",
    email: "",
    role: UserRole.PUBLIC,
  });

  const { register: registerUser, isLoading } = useAuth();

  // Form instances - only personal info and password
  const personalForm = useForm<PersonalInfoForm>({
    resolver: zodResolver(personalInfoSchema),
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const handlePersonalInfoNext = async (data: PersonalInfoForm) => {
    setRegistrationData((prev) => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handlePasswordSubmit = async (data: PasswordForm) => {
    try {
      const finalData: RegisterRequest = {
        ...registrationData,
        password: data.password,
      };

      await registerUser(finalData);
      authToasts.registerSuccess(registrationData.email);
      // Navigate to success step
      setCurrentStep(3);
    } catch (err) {
      authToasts.registerError(
        err instanceof Error ? err.message : "An error occurred during registration"
      );
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Success step
  if (currentStep === 3) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4 mb-8">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-success" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-success">Registration Successful!</h2>
            <p className="text-muted-foreground mt-2">
              Your account has been created successfully.
            </p>
          </div>
        </div>

        <EmailVerificationPrompt
          email={registrationData.email}
          onResendSuccess={() => {
            authToasts.emailVerificationSent(registrationData.email);
          }}
        />

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            After verification, you can{" "}
            <a href="/auth/signin" className="text-primary hover:underline font-medium">
              sign in to your account
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="flex justify-center space-x-2">
        {[1, 2].map((step) => (
          <div
            key={step}
            className={`w-3 h-3 rounded-full ${
              step <= currentStep ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Personal Information */}
      {currentStep === 1 && (
        <form
          onSubmit={personalForm.handleSubmit(handlePersonalInfoNext)}
          className="space-y-6"
        >
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-semibold text-foreground">Personal Information</h2>
            <p className="text-sm text-muted-foreground">
              Tell us about yourself and your role
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  variant="healthcare"
                  {...personalForm.register("firstName")}
                  className={
                    personalForm.formState.errors.firstName ? "border-destructive" : ""
                  }
                />
                {personalForm.formState.errors.firstName && (
                  <p className="text-sm text-destructive">
                    {personalForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  variant="healthcare"
                  {...personalForm.register("lastName")}
                  className={
                    personalForm.formState.errors.lastName ? "border-destructive" : ""
                  }
                />
                {personalForm.formState.errors.lastName && (
                  <p className="text-sm text-destructive">
                    {personalForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                variant="healthcare"
                {...personalForm.register("email")}
                className={personalForm.formState.errors.email ? "border-destructive" : ""}
              />
              {personalForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {personalForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                variant="healthcare"
                {...personalForm.register("phone")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={personalForm.watch("role")}
                onValueChange={(value) => personalForm.setValue("role", value as UserRole)}
              >
                <SelectTrigger
                  variant="healthcare"
                  className={personalForm.formState.errors.role ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{role.label}</span>
                        <span className="text-sm text-muted-foreground">{role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {personalForm.formState.errors.role && (
                <p className="text-sm text-destructive">
                  {personalForm.formState.errors.role.message}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            variant="healthcare"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      )}

      {/* Step 2: Password */}
      {currentStep === 2 && (
        <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-semibold text-foreground">Security & Terms</h2>
            <p className="text-sm text-muted-foreground">
              Create a secure password and complete your registration
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  variant="healthcare"
                  {...passwordForm.register("password")}
                  className={
                    passwordForm.formState.errors.password ? "border-destructive" : ""
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
              {passwordForm.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  variant="healthcare"
                  {...passwordForm.register("confirmPassword")}
                  className={
                    passwordForm.formState.errors.confirmPassword ? "border-destructive" : ""
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showConfirmPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button type="submit" variant="healthcare" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}