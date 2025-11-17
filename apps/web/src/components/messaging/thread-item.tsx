"use client";

import { Badge } from "@/components/ui/badge";
import { MessageThread, ThreadStatus as ThreadStatusEnum } from "@carelink/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { SLABadge, calculateHoursSince, minutesToHours } from "@/components/ui/sla-badge";

interface ThreadItemProps {
  thread: MessageThread;
  isSelected: boolean;
  onSelect: () => void;
  getThreadContext?: (thread: MessageThread) => string;
  getThreadTitle?: (thread: MessageThread) => string;
}

export function ThreadItem({
  thread,
  isSelected,
  onSelect,
  getThreadContext,
  getThreadTitle,
}: ThreadItemProps) {
  const lastMessage = thread.messages?.[0];
  const isUnread = (thread.unreadCount || 0) > 0;

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
    <div
      onClick={onSelect}
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-colors",
        isSelected
          ? "bg-primary/10 border-primary"
          : "bg-background border-border hover:bg-muted/50",
        isUnread && "border-l-4 border-l-primary"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm truncate">{title}</p>
            {isUnread && (
              <Badge variant="healthcareError" className="h-5 px-1.5 text-xs">
                {thread.unreadCount}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-1">{context}</p>
          {lastMessage && (
            <p className="text-xs text-muted-foreground truncate">
              {lastMessage.content}
            </p>
          )}
          {thread.lastMessageAt && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(thread.lastMessageAt), {
                addSuffix: true,
              })}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {getStatusBadge(thread.status)}
          {getSLABadgeForThread(thread)}
        </div>
      </div>
    </div>
  );
}

