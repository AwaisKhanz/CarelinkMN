"use client";

import { useEffect } from "react";
import { usePageMetadata } from "../use-page-metadata";
import { MessageCenter } from "@/components/messaging";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { ProviderSubscriptionGuard } from "@/components/auth/provider-subscription-guard";
import { PROVIDER_FEATURE_GATES } from "@/lib/constants";
import { MessageThread, SubscriptionTier } from "@carelink/types";
import { useProviderId } from "@/hooks/use-provider-data";

function ProviderMessagesPageContent() {
  const { setTitle, setDescription } = usePageMetadata();
  const providerId = useProviderId(); // Use hook instead of fetching

  const messagesGate = PROVIDER_FEATURE_GATES.messages;

  useEffect(() => {
    setTitle("Messages");
    setDescription("Manage your conversations and inquiries.");
  }, [setTitle, setDescription]);

  const getThreadContext = (thread: MessageThread) => {
    if (thread.referral) {
      return `Referral: ${thread.referral.referralNumber}`;
    }
    if (thread.dischargeCase) {
      return `Discharge: ${thread.dischargeCase.caseNumber}`;
    }
    return "General Inquiry";
  };

  const getThreadTitle = (thread: MessageThread) => {
    if (thread.initiator) {
      return `${thread.initiator.firstName} ${thread.initiator.lastName}`;
    }
    return "Unknown";
  };

  return (
    <FeatureGate
      feature={messagesGate.feature}
      requiredPlan={messagesGate.requiredPlan}
      bannerDescription={messagesGate.description}
    >
      {providerId ? (
        <MessageCenter
          providerId={providerId}
          getThreadContext={getThreadContext}
          getThreadTitle={getThreadTitle}
        />
      ) : (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading provider information...</p>
        </div>
      )}
    </FeatureGate>
  );
}

export default function ProviderMessagesPage() {
  const messagesGate = PROVIDER_FEATURE_GATES.messages;
  
  return (
    <ProviderSubscriptionGuard
      requiredPlan={SubscriptionTier.PRO}
      feature={messagesGate.feature}
      featureDescription={messagesGate.description}
    >
      <ProviderMessagesPageContent />
    </ProviderSubscriptionGuard>
  );
}
