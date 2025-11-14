"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Mail, Loader2, RefreshCw, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { authToasts } from "@/lib/toast";

function VerifyEmailForm() {
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [isResending, setIsResending] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setVerificationStatus('error');
      authToasts.emailVerificationError('No verification token provided');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      setVerificationStatus('verifying');

      const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 400 && result.message?.includes('expired')) {
          setVerificationStatus('expired');
        } else {
          setVerificationStatus('error');
          authToasts.emailVerificationError(result.message || 'Email verification failed');
        }
        return;
      }

      setVerificationStatus('success');
      authToasts.emailVerificationSuccess();

      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/signin?verified=true');
      }, 3000);

    } catch (err) {
      setVerificationStatus('error');
      authToasts.emailVerificationError('An error occurred during verification');
    }
  };

  const handleResendVerification = async () => {
    const email = searchParams.get('email');
    if (!email) {
      authToasts.emailVerificationError('Email address not found. Please try registering again.');
      return;
    }

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

    } catch (err) {
      authToasts.emailVerificationError('An error occurred while resending verification email');
    } finally {
      setIsResending(false);
    }
  };

  const renderVerificationStatus = () => {
    switch (verificationStatus) {
      case 'verifying':
        return (
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Verifying Your Email
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    Please wait while we verify your email address...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'success':
        return (
          <Card variant="healthcareSuccess" className="shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-success" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-success">
                    Email Verified Successfully!
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    Welcome to CareLinkMN! Your account is now active.
                  </p>
                  <div className="mt-4">
                    <Badge variant="healthcareSuccess">
                      Redirecting to sign in...
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={() => router.push('/auth/signin?verified=true')}
                  variant="healthcare"
                  className="mt-4"
                >
                  Continue to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'expired':
        return (
          <Card variant="healthcareError" className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <X className="w-5 h-5" />
                Verification Link Expired
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                This verification link has expired. Verification links are valid for 24 hours for security reasons.
              </p>


              <div className="space-y-3">
                <Button
                  onClick={handleResendVerification}
                  variant="healthcare"
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

                <Button
                  onClick={() => router.push('/auth/signup')}
                  variant="outline"
                  className="w-full"
                >
                  Register Again
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'error':
        return (
          <Card variant="healthcareError" className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <X className="w-5 h-5" />
                Verification Failed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We encountered an error while verifying your email address.
              </p>


              <div className="space-y-3">
                <Button
                  onClick={handleResendVerification}
                  variant="healthcare"
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

                <Button
                  onClick={() => router.push('/auth/signup')}
                  variant="outline"
                  className="w-full"
                >
                  Register Again
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto max-w-md py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            Email Verification
          </h1>
          <p className="text-muted-foreground">
            Confirming your CareLinkMN account
          </p>
        </div>
      </div>

      {/* Verification Status */}
      {renderVerificationStatus()}

      {/* Additional Help */}
      {verificationStatus !== 'success' && (
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Having trouble?{" "}
            <Link
              href="/support"
              className="text-primary hover:underline font-medium"
            >
              Contact Support
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}