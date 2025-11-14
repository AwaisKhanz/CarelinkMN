"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { forgotPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setError(null);
      await forgotPassword(data.email);
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <Link href="/auth/signin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to sign in
          </Link>
        </div>

        <Card variant="healthcareSuccess" className="shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-success">Check your email</h2>
                <p className="text-muted-foreground mt-2">
                  We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
                </p>
              </div>
              <div className="pt-4">
                <Button variant="outline" asChild className="w-full h-12 text-base font-medium">
                  <Link href="/auth/signin">Return to sign in</Link>
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
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Forgot your password?</h1>
          <p className="text-muted-foreground">
            No worries! Enter your email address and we'll send you a link to reset your password.
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
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              variant="healthcare"
              {...register("email")}
              className={`h-12 text-base ${errors.email ? "border-destructive" : ""}`}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
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
              Sending reset link...
            </>
          ) : (
            "Send reset link"
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