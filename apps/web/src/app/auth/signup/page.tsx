"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RegistrationWizard } from "@/components/auth/registration-wizard";

export default function SignUpPage() {
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
          <p className="text-muted-foreground">
            Join CareLinkMN to connect with Minnesota's care community
          </p>
        </div>
      </div>

      {/* Registration Wizard */}
      <RegistrationWizard />

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
