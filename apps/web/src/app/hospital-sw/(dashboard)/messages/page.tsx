"use client";

import { useEffect, useCallback } from "react";
import { usePageMetadata } from "../use-page-metadata";
import { MessageCenter } from "@/components/messaging";
import { MessageThread } from "@carelink/types";
import { RequirePermission } from "@/components/auth/require-permission";
import { HOSPITAL_SW_CAPABILITIES } from "@/lib/permissions/capabilities";
import { formatCaseNumber } from "@/lib/utils/hospital-sw";

function HospitalSWMessagesPageContent() {
  const { setTitle, setDescription } = usePageMetadata();

  useEffect(() => {
    setTitle("Messages");
    setDescription("Manage your conversations with providers about discharge cases.");
  }, [setTitle, setDescription]);

  const getThreadContext = useCallback((thread: MessageThread) => {
    if (thread.dischargeCase) {
      return `Discharge Case: ${formatCaseNumber(thread.dischargeCase.caseNumber)}`;
    }
    if (thread.referral) {
      return `Referral: ${thread.referral.referralNumber}`;
    }
    return "General Inquiry";
  }, []);

  const getThreadTitle = useCallback((thread: MessageThread) => {
    if (thread.provider?.organization) {
      return thread.provider.organization.name;
    }
    if (thread.initiator) {
      return `${thread.initiator.firstName} ${thread.initiator.lastName}`;
    }
    return "Unknown Provider";
  }, []);

  return (
    <MessageCenter
      getThreadContext={getThreadContext}
      getThreadTitle={getThreadTitle}
    />
  );
}

export default function HospitalSWMessagesPage() {
  return (
    <RequirePermission
      permission={HOSPITAL_SW_CAPABILITIES.MESSAGES_MANAGE}
      title="Access Restricted"
      description="You don't have permission to manage messages. Please contact your organization administrator if you need access."
    >
      <HospitalSWMessagesPageContent />
    </RequirePermission>
  );
}

