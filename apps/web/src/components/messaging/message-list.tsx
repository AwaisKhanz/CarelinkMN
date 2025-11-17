"use client";

import { RefObject } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";
import { Message } from "@carelink/types";
import { MessageItem } from "./message-item";

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  messagesEndRef: RefObject<HTMLDivElement>;
}

export function MessageList({
  messages,
  currentUserId,
  messagesEndRef,
}: MessageListProps) {
  return (
    <ScrollArea className="flex-1 mb-4">
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No messages yet</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                isOwnMessage={message.senderId === currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </ScrollArea>
  );
}

