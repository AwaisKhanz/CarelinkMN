"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { authService } from "@/lib/api";
import { Loader2, Mail, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authToasts } from "@/lib/toast";

// Constants
const RESEND_SUCCESS_TIMEOUT = 5000; // 5 seconds
const DEFAULT_EXCLUDED_PATHS = ["/auth", "/public", "/search"];

interface EmailVerificationGuardProps {
  children: React.ReactNode;
  /**
   * Whether to redirect to verification page if email is not verified
   * @default false - Shows verification prompt instead of redirecting
   */
  redirectOnFail?: boolean;
  /**
   * Custom redirect path (defaults to /auth/verify-email)
   */
  redirectPath?: string;
  /**
   * Whether to show loading state
   * @default true
   */
  showLoading?: boolean;
  /**
   * Paths that should be excluded from email verification requirement
   * @default ['/auth', '/public', '/search']
   */
  excludedPaths?: readonly string[] | string[];
}

/**
 * Guard component that ensures user's email is verified before allowing access
 *
 * Excludes certain paths by default (auth pages, public pages, search)
 * Redirects unverified users to verification page or shows verification prompt
 */
export function EmailVerificationGuard({
  children,
  redirectOnFail = false,
  redirectPath,
  showLoading = true,
  excludedPaths = DEFAULT_EXCLUDED_PATHS,
}: EmailVerificationGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize excluded path check to avoid recalculating on every render
  const isExcludedPath = useMemo(
    () => excludedPaths.some((path) => pathname?.startsWith(path)),
    [excludedPaths, pathname]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Memoize resend verification handler to prevent unnecessary re-renders
  const handleResendVerification = useCallback(async () => {
    if (!user?.email) {
      authToasts.emailVerificationError("Email address not found");
      return;
    }

    try {
      setIsResending(true);

      const response = await authService.resendVerificationEmail(user.email);

      if (!response.success) {
        authToasts.emailVerificationError(
          response.message || "Failed to resend verification email"
        );
        return;
      }

      setResendSuccess(true);
      authToasts.emailVerificationSent(user.email);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout with cleanup
      timeoutRef.current = setTimeout(() => {
        setResendSuccess(false);
        timeoutRef.current = null;
      }, RESEND_SUCCESS_TIMEOUT);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while resending verification email";
      authToasts.emailVerificationError(errorMessage);
    } finally {
      setIsResending(false);
    }
  }, [user?.email]);

  // Memoize sign out handler
  const handleSignOut = useCallback(async () => {
    try {
      await authService.logout();
      // Clear localStorage (authService already does this, but ensure it's cleared)
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
      }
      router.push("/auth/signin");
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect even if logout fails
      router.push("/auth/signin");
    }
  }, [router]);

  useEffect(() => {
    const checkVerification = async () => {
      // Wait for auth to initialize
      if (authLoading) return;

      // Allow access if:
      // 1. Not authenticated (let other guards handle this)
      // 2. Path is excluded from verification requirement
      // 3. User email is verified
      if (!isAuthenticated || !user || isExcludedPath) {
        setIsChecking(false);
        return;
      }

      // If email is verified, allow access
      // Use explicit boolean check to handle undefined/null cases
      if (user.emailVerified === true) {
        setIsChecking(false);
        return;
      }

      // Email not verified - handle based on redirectOnFail
      if (redirectOnFail) {
        const path =
          redirectPath ||
          `/auth/verify-email?email=${encodeURIComponent(user.email)}`;
        router.push(path);
        return;
      }

      // Don't redirect, just mark as checked (will show verification prompt)
      setIsChecking(false);
    };

    checkVerification();
  }, [
    user,
    authLoading,
    isAuthenticated,
    isExcludedPath,
    redirectOnFail,
    redirectPath,
    router,
  ]);

  // Show loading state
  if (authLoading || isChecking) {
    if (!showLoading) return null;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access if not authenticated or path is excluded (let other guards handle)
  if (!isAuthenticated || !user || isExcludedPath) {
    return <>{children}</>;
  }

  // If email is verified, allow access
  // Use explicit boolean check to handle undefined/null cases
  if (user.emailVerified === true) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-warning" />
          </div>
          <CardTitle>Email Verification Required</CardTitle>
          <CardDescription>
            Please verify your email address to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="healthcareWarning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              We've sent a verification link to <strong>{user.email}</strong>.
              Please check your email and click the verification link to
              continue.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button
              onClick={handleResendVerification}
              disabled={isResending || resendSuccess}
              variant="healthcare"
              className="w-full"
              aria-label={
                isResending
                  ? "Sending verification email"
                  : resendSuccess
                    ? "Verification email sent"
                    : "Resend verification email"
              }
            >
              {isResending ? (
                <>
                  <Loader2
                    className="w-4 h-4 mr-2 animate-spin"
                    aria-hidden="true"
                  />
                  Sending...
                </>
              ) : resendSuccess ? (
                <>
                  <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                  Email Sent!
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" aria-hidden="true" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full"
              aria-label="Sign out"
            >
              Sign Out
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Didn't receive the email? Check your spam folder or{" "}
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending || resendSuccess}
                className="text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                aria-label="Resend verification email"
              >
                resend it
              </button>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
