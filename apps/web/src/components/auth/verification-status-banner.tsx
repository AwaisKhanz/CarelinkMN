"use client";

import { useState } from "react";
import { AlertTriangle, X, Mail, RefreshCw, Loader2, Check } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export function VerificationStatusBanner() {
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Don't show banner if user is verified, not logged in, or banner is dismissed
  if (!user || (user as any).emailVerified || isDismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    try {
      setIsResending(true);

      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      if (response.ok) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Failed to resend verification email:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Alert variant="healthcareWarning" className="border-warning bg-warning/5">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex-1">
          <span className="font-medium">Email verification required</span>
          <span className="ml-2 text-sm">
            Please check your email ({user.email}) and click the verification link to access all features.
          </span>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Button
            onClick={handleResendVerification}
            variant="outline"
            size="sm"
            disabled={isResending || resendSuccess}
            className="text-xs h-8"
          >
            {isResending ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Sending...
              </>
            ) : resendSuccess ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Sent!
              </>
            ) : (
              <>
                <Mail className="w-3 h-3 mr-1" />
                Resend
              </>
            )}
          </Button>

          <Button
            onClick={() => setIsDismissed(true)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}