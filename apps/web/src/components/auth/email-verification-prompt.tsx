"use client";

import { useState } from "react";
import { Mail, RefreshCw, Loader2, Check, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { authToasts } from "@/lib/toast";

interface EmailVerificationPromptProps {
  email: string;
  onResendSuccess?: () => void;
}

export function EmailVerificationPrompt({ email, onResendSuccess }: EmailVerificationPromptProps) {
  const [isResending, setIsResending] = useState(false);

  const handleResendVerification = async () => {
    try {
      setIsResending(true);

      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        authToasts.emailVerificationError(result.message || 'Failed to resend verification email');
        return;
      }

      authToasts.emailVerificationSent(email);
      onResendSuccess?.();

    } catch (err) {
      authToasts.emailVerificationError('An error occurred while resending verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Mail className="w-5 h-5" />
          Check Your Email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-foreground">
            We've sent a verification email to:
          </p>
          <Badge variant="secondary" className="text-sm font-mono">
            {email}
          </Badge>
        </div>

        <p className="text-muted-foreground text-sm">
          Please check your email and click the verification link to activate your account.
          The link will expire in 24 hours for security.
        </p>


        <div className="space-y-3 pt-2">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm text-foreground">What to do next:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Check your email inbox for a message from CareLinkMN</li>
              <li>• Look in your spam or junk folder if you don't see it</li>
              <li>• Click the "Verify Email" button in the email</li>
              <li>• Return to sign in once verified</li>
            </ul>
          </div>

          <Button
            onClick={handleResendVerification}
            variant="outline"
            disabled={isResending}
            className="w-full"
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend Verification Email
              </>
            )}
          </Button>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Having trouble?{" "}
            <a
              href="/support"
              className="text-primary hover:underline font-medium"
            >
              Contact Support
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}