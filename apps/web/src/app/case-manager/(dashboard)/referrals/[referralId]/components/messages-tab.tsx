"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send } from "lucide-react";
import type { MessageThread } from "@carelink/types";
import { MessageThreadItem } from "./message-thread-item";

interface MessagesTabProps {
  referralId: string;
  threads: MessageThread[];
  isLoading: boolean;
  shortlistCount: number;
  onBatchMessage: () => void;
  onViewThread: (threadId: string) => void;
}

export function MessagesTab({
  referralId,
  threads,
  isLoading,
  shortlistCount,
  onBatchMessage,
  onViewThread,
}: MessagesTabProps) {
  return (
    <Card variant="healthcare">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Messages</CardTitle>
            <CardDescription>
              {threads.length} conversation{threads.length !== 1 ? "s" : ""} for this referral
            </CardDescription>
          </div>
          <Button
            variant="healthcare"
            onClick={onBatchMessage}
            disabled={shortlistCount === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            Batch Message
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={`skeleton-${index}`} className="h-16 w-full" />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">
              No messages yet for this referral
            </p>
            <Button
              variant="healthcare"
              onClick={onBatchMessage}
              disabled={shortlistCount === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Batch Message
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <MessageThreadItem
                key={thread.id}
                thread={thread}
                referralId={referralId}
                onView={onViewThread}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


