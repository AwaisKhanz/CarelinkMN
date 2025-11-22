"use client";

import { RefObject } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import {
  MessageThread,
  Message,
  MessageAttachmentData,
  ThreadStatus as ThreadStatusEnum,
} from "@carelink/types";
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
  // Props for starting a new conversation
  providerId?: string;
  referralId?: string;
  dischargeCaseId?: string;
  canCreateThread?: boolean;
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
  providerId,
  referralId,
  dischargeCaseId,
  canCreateThread = false,
}: MessageViewProps) {
  // If providerId is provided but no thread, show "Start Conversation" UI
  if (!thread && canCreateThread && providerId) {
    return (
      <Card variant="healthcare" className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Start a Conversation</CardTitle>
          <CardDescription>
            Send a message to start a new conversation
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4 pt-0">
          {/* Empty message list */}
          <div className="flex-1 flex items-center justify-center mb-4">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No messages yet</p>
            </div>
          </div>

          {/* Message Input - allows creating a thread by sending first message */}
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
            isThreadClosed={false}
          />
        </CardContent>
      </Card>
    );
  }

  // No thread selected and no providerId - show default empty state
  if (!thread) {
    return (
      <Card variant="healthcare" className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold">Select a conversation</p>
            <p className="text-sm">
              Choose a thread from the list to view messages
            </p>
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
