"use client";

import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageThread, ThreadStatus as ThreadStatusEnum } from "@carelink/types";
import { SLABadge, calculateHoursSince, minutesToHours } from "@/components/ui/sla-badge";

interface ThreadHeaderProps {
  thread: MessageThread;
  onUpdateStatus?: (threadId: string, status: ThreadStatusEnum) => void;
  getThreadContext?: (thread: MessageThread) => string;
  getThreadTitle?: (thread: MessageThread) => string;
}

export function ThreadHeader({
  thread,
  onUpdateStatus,
  getThreadContext,
  getThreadTitle,
}: ThreadHeaderProps) {
  const getStatusBadge = (status: ThreadStatusEnum) => {
    switch (status) {
      case ThreadStatusEnum.OPEN:
        return (
          <Badge variant="healthcareSuccess" className="whitespace-nowrap">
            Open
          </Badge>
        );
      case ThreadStatusEnum.AWAITING_RESPONSE:
        return (
          <Badge variant="healthcareWarning" className="whitespace-nowrap">
            Awaiting Response
          </Badge>
        );
      case ThreadStatusEnum.RESOLVED:
        return (
          <Badge variant="healthcareSecondary" className="whitespace-nowrap">
            Resolved
          </Badge>
        );
      case ThreadStatusEnum.CLOSED:
        return (
          <Badge variant="healthcareError" className="whitespace-nowrap">
            Closed
          </Badge>
        );
      default:
        return null;
    }
  };

  const getSLABadgeForThread = (thread: MessageThread) => {
    const responseTimeHours = minutesToHours(thread.avgResponseTime);
    const hoursSinceCreation = !thread.firstResponseAt
      ? calculateHoursSince(thread.createdAt)
      : undefined;

    return (
      <SLABadge
        responseTimeHours={responseTimeHours ?? undefined}
        hoursSinceCreation={hoursSinceCreation}
        isClosed={thread.status === ThreadStatusEnum.CLOSED}
        showTime={true}
        size="sm"
      />
    );
  };

  const defaultGetThreadContext = (thread: MessageThread) => {
    if (thread.referral) {
      return `Referral: ${thread.referral.referralNumber}`;
    }
    if (thread.dischargeCase) {
      return `Discharge: ${thread.dischargeCase.caseNumber}`;
    }
    return "General Inquiry";
  };

  const defaultGetThreadTitle = (thread: MessageThread) => {
    if (thread.initiator) {
      return `${thread.initiator.firstName} ${thread.initiator.lastName}`;
    }
    if (thread.provider?.organization) {
      return thread.provider.organization.name;
    }
    return "Unknown";
  };

  const context = getThreadContext
    ? getThreadContext(thread)
    : defaultGetThreadContext(thread);
  const title = getThreadTitle ? getThreadTitle(thread) : defaultGetThreadTitle(thread);

  return (
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <CardTitle>{title}</CardTitle>
            {getStatusBadge(thread.status)}
            {getSLABadgeForThread(thread)}
          </div>
          <CardDescription>{context}</CardDescription>
          {thread.initiator && (
            <p className="text-sm text-muted-foreground mt-1">
              {thread.initiator.email} • {thread.initiator.role}
            </p>
          )}
        </div>
        {onUpdateStatus && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {thread.status !== ThreadStatusEnum.OPEN && (
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(thread.id, ThreadStatusEnum.OPEN)}
                >
                  Mark as Open
                </DropdownMenuItem>
              )}
              {thread.status !== ThreadStatusEnum.RESOLVED && (
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(thread.id, ThreadStatusEnum.RESOLVED)}
                >
                  Mark as Resolved
                </DropdownMenuItem>
              )}
              {thread.status !== ThreadStatusEnum.CLOSED && (
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(thread.id, ThreadStatusEnum.CLOSED)}
                >
                  Close Thread
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </CardHeader>
  );
}

