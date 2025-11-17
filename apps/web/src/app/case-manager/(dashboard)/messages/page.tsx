"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../use-page-metadata";
import { MessageCenter } from "@/components/messaging";
import { referralService } from "@/lib/api";
import { MessageThread } from "@carelink/types";
import { RequirePermission } from "@/components/auth/require-permission";
import { CASE_MANAGER_CAPABILITIES } from "@/lib/permissions/capabilities";

function CaseManagerMessagesPageContent() {
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();

  useEffect(() => {
    setTitle("Messages");
    setDescription("Manage your conversations with providers.");
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
    if (thread.provider?.organization) {
      return thread.provider.organization.name;
    }
    return "Unknown Provider";
  };

  return (
    <MessageCenter
      getThreadContext={getThreadContext}
      getThreadTitle={getThreadTitle}
    />
  );
}

export default function CaseManagerMessagesPage() {
  return (
    <RequirePermission
      permission={CASE_MANAGER_CAPABILITIES.MESSAGES_MANAGE}
      title="Access Restricted"
      description="You don't have permission to manage messages."
    >
      <CaseManagerMessagesPageContent />
    </RequirePermission>
  );
}

