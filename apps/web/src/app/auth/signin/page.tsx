"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, ArrowLeft, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { getDashboardPath } from "@/lib/routing";
import { authToasts } from "@/lib/toast";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInForm = z.infer<typeof signInSchema>;

function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, user } = useAuth();

  const isVerified = searchParams.get("verified") === "true";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  });

  // Handle redirect after successful login
  useEffect(() => {
    if (user) {
      const dashboardPath = getDashboardPath(user.role);
      router.push(dashboardPath);
    }
  }, [user, router]);

  const onSubmit = async (data: SignInForm) => {
    try {
      const userData = await login(data.email, data.password);

      // Use the user data returned from login for the toast
      const userName =
        userData.firstName && userData.lastName
          ? `${userData.firstName} ${userData.lastName}`.trim()
          : userData.email;

      authToasts.loginSuccess(userName);
    } catch (err) {
      authToasts.loginError(
        err instanceof Error ? err.message : "An error occurred during sign in"
      );
    }
  };

  return (
    <div className="space-y-8">
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
          <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground">
            Sign in to your CareLinkMN account
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {isVerified && (
          <Alert className="mb-6 border-success bg-success/5">
            <Check className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              Email verified successfully! You can now sign in to your account.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              variant="healthcare"
              {...register("email")}
              className={`h-12 text-base ${errors.email ? "border-destructive" : ""}`}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                variant="healthcare"
                {...register("password")}
                className={`h-12 text-base pr-12 ${
                  errors.password ? "border-destructive" : ""
                }`}
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
              <p className="text-sm text-destructive mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
            />
            <Label
              htmlFor="remember"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Remember me
            </Label>
          </div>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-primary hover:underline font-medium"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="healthcare"
          className="w-full h-12 text-base font-medium"
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting || isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
