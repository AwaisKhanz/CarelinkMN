"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { MessageThread } from "@carelink/types";

interface MessageThreadItemProps {
  thread: MessageThread;
  referralId: string;
  onView: (threadId: string) => void;
}

export function MessageThreadItem({ thread, referralId, onView }: MessageThreadItemProps) {
  const lastMessage = thread.messages && thread.messages.length > 0
    ? thread.messages[thread.messages.length - 1]
    : null;

  return (
    <Card
      variant="healthcare"
      className="border-border cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onView(thread.id)}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-semibold">
                {thread.provider?.organization?.name || "Unknown Provider"}
              </h4>
              <Badge variant="outline">{thread.status}</Badge>
            </div>
            {lastMessage && (
              <>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {lastMessage.content}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(lastMessage.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </>
            )}
            {!lastMessage && (
              <p className="text-xs text-muted-foreground mt-2">No messages yet</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onView(thread.id);
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


