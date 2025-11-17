"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../../use-page-metadata";
import { referralService, CreateReferralData, UpdateReferralData } from "@/lib/api";
import { toast } from "sonner";
import { ReferralForm } from "@/components/forms/referral-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaseManagerErrorState } from "@/components/case-manager";
import { RequirePermission } from "@/components/auth/require-permission";
import { CASE_MANAGER_CAPABILITIES } from "@/lib/permissions/capabilities";

function CreateReferralPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle("Create Referral");
    setDescription("Create a new referral for a client");
  }, [setTitle, setDescription]);

  const handleSubmit = async (data: CreateReferralData | UpdateReferralData) => {
    // Type guard: In create mode, data must be CreateReferralData
    if (!("clientAge" in data && data.clientAge !== undefined)) {
      toast.error("Invalid form data");
      return;
    }

    const createData = data as CreateReferralData;
    if (!user?.id) {
      toast.error("You must be logged in to create a referral");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await referralService.createReferral(createData);

      if (response.success && response.data) {
        toast.success("Referral created successfully");
        router.push(`/case-manager/referrals/${response.data.id}`);
      } else {
        const errorMessage = response.message || "Failed to create referral";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Error creating referral:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create referral";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/case-manager/referrals");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/case-manager/referrals")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Referral</h1>
          <p className="text-muted-foreground mt-1">
            Create a new referral for a client
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <CaseManagerErrorState
          title="Error Creating Referral"
          message={error}
          action={{
            label: "Try Again",
            onClick: () => setError(null),
            variant: "healthcare",
          }}
        />
      )}

      {/* Form */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Referral Information</CardTitle>
          <CardDescription>
            Fill in all required fields to create a new referral
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReferralForm
            mode="create"
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel="Create Referral"
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateReferralPage() {
  return (
    <RequirePermission
      permission={CASE_MANAGER_CAPABILITIES.REFERRALS_CREATE}
      title="Access Restricted"
      description="You don't have permission to create referrals."
    >
      <CreateReferralPageContent />
    </RequirePermission>
  );
}

