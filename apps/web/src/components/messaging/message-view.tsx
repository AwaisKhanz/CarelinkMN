"use client";

import { RefObject } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { MessageThread, Message, MessageAttachmentData, ThreadStatus as ThreadStatusEnum } from "@carelink/types";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ThreadHeader } from "./thread-header";

interface MessageViewProps {
  thread: MessageThread | null;
  messages: Message[];
  messageContent: string;
  onMessageContentChange: (value: string) => void;
  attachments: MessageAttachmentData[];
  onRemoveAttachment: (index: number) => void;
  isSending: boolean;
  uploadingAttachment: boolean;
  onSendMessage: () => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement>;
  messagesEndRef: RefObject<HTMLDivElement>;
  currentUserId?: string;
  onUpdateStatus?: (threadId: string, status: ThreadStatusEnum) => void;
  getThreadContext?: (thread: MessageThread) => string;
  getThreadTitle?: (thread: MessageThread) => string;
}

export function MessageView({
  thread,
  messages,
  messageContent,
  onMessageContentChange,
  attachments,
  onRemoveAttachment,
  isSending,
  uploadingAttachment,
  onSendMessage,
  onFileSelect,
  fileInputRef,
  messagesEndRef,
  currentUserId,
  onUpdateStatus,
  getThreadContext,
  getThreadTitle,
}: MessageViewProps) {
  if (!thread) {
    return (
      <Card variant="healthcare" className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold">Select a conversation</p>
            <p className="text-sm">Choose a thread from the list to view messages</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="healthcare" className="flex-1 flex flex-col">
      <ThreadHeader
        thread={thread}
        onUpdateStatus={onUpdateStatus}
        getThreadContext={getThreadContext}
        getThreadTitle={getThreadTitle}
      />
      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        {/* Messages */}
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          messagesEndRef={messagesEndRef}
        />

        {/* Message Input */}
        <MessageInput
          messageContent={messageContent}
          onMessageContentChange={onMessageContentChange}
          attachments={attachments}
          onRemoveAttachment={onRemoveAttachment}
          isSending={isSending}
          uploadingAttachment={uploadingAttachment}
          onSendMessage={onSendMessage}
          onFileSelect={onFileSelect}
          fileInputRef={fileInputRef}
          isThreadClosed={thread.status === ThreadStatusEnum.CLOSED}
        />
      </CardContent>
    </Card>
  );
}

