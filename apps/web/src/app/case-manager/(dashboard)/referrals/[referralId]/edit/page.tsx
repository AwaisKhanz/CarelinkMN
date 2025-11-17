"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../../../use-page-metadata";
import { referralService, Referral, UpdateReferralData } from "@/lib/api";
import { toast } from "sonner";
import { ReferralForm } from "@/components/forms/referral-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaseManagerLoadingState, CaseManagerErrorState } from "@/components/case-manager";
import { RequirePermission } from "@/components/auth/require-permission";
import { CASE_MANAGER_CAPABILITIES } from "@/lib/permissions/capabilities";

function EditReferralPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const referralId = params.referralId as string;

  const [referral, setReferral] = useState<Referral | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (referral) {
      setTitle(`Edit Referral ${referral.referralNumber}`);
      setDescription(`Edit referral for client ${referral.clientInitials}`);
    } else {
      setTitle("Edit Referral");
      setDescription("Edit referral information");
    }
  }, [referral, setTitle, setDescription]);

  useEffect(() => {
    if (referralId) {
      fetchReferral();
    }
  }, [referralId]);

  const fetchReferral = async () => {
    if (!referralId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await referralService.getReferralById(referralId);

      if (response.success && response.data) {
        setReferral(response.data);
      } else {
        const errorMessage = response.message || "Failed to load referral";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Error fetching referral:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load referral";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateReferralData) => {
    if (!user?.id || !referralId) {
      toast.error("You must be logged in to update a referral");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await referralService.updateReferral(referralId, data);

      if (response.success && response.data) {
        toast.success("Referral updated successfully");
        router.push(`/case-manager/referrals/${referralId}`);
      } else {
        const errorMessage = response.message || "Failed to update referral";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Error updating referral:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update referral";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/case-manager/referrals/${referralId}`);
  };

  if (isLoading) {
    return <CaseManagerLoadingState message="Loading referral..." fullHeight />;
  }

  if (error && !referral) {
    return (
      <CaseManagerErrorState
        title="Error Loading Referral"
        message={error}
        action={{
          label: "Retry",
          onClick: () => {
            setError(null);
            fetchReferral();
          },
          variant: "healthcare",
        }}
        secondaryAction={{
          label: "Back to Referrals",
          onClick: () => router.push("/case-manager/referrals"),
          variant: "outline",
        }}
      />
    );
  }

  if (!referral) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/case-manager/referrals/${referralId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Referral</h1>
          <p className="text-muted-foreground mt-1">
            Edit referral {referral.referralNumber}
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <CaseManagerErrorState
          title="Error Updating Referral"
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
            Update referral information and save changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReferralForm
            mode="edit"
            initialData={referral}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel="Update Referral"
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditReferralPage() {
  return (
    <RequirePermission
      permission={CASE_MANAGER_CAPABILITIES.REFERRALS_UPDATE}
      title="Access Restricted"
      description="You don't have permission to edit referrals."
    >
      <EditReferralPageContent />
    </RequirePermission>
  );
}

