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
  typingUsers?: string[]; // New prop for typing indicators
}

export function MessageList({
  messages,
  currentUserId,
  messagesEndRef,
  typingUsers = [],
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
            
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span>
                  {typingUsers.length === 1
                    ? "Someone is typing..."
                    : `${typingUsers.length} people are typing...`}
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </ScrollArea>
  );
}
