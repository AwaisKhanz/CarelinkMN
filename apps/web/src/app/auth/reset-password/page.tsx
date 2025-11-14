"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;
    
    try {
      setError(null);
      await resetPassword(token, data.password);
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/auth/signin");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while resetting your password");
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </div>

        <Card variant="healthcareSuccess" className="shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-success">Password Reset Successful!</h2>
                <p className="text-muted-foreground mt-2">
                  Your password has been successfully reset. Redirecting to sign in...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </div>

        <Card variant="healthcareError" className="shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-destructive">Invalid Reset Link</h2>
                <p className="text-muted-foreground mt-2">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
              </div>
              <div className="pt-4">
                <Button variant="outline" asChild className="w-full h-12 text-base font-medium">
                  <Link href="/auth/forgot-password">Request new reset link</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <Link href="/auth/signin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to sign in
        </Link>
        
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Reset your password</h1>
          <p className="text-muted-foreground">
            Enter your new password below
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
                variant="healthcare"
                {...register("password")}
                className={`h-12 text-base pr-12 ${errors.password ? "border-destructive" : ""}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                variant="healthcare"
                {...register("confirmPassword")}
                className={`h-12 text-base pr-12 ${errors.confirmPassword ? "border-destructive" : ""}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          variant="healthcare"
          className="w-full h-12 text-base font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Resetting password...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/auth/signin" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </div>

        <Card variant="healthcare" className="shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}