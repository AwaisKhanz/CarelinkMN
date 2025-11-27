"use client";

import { RefObject } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  // Real-time features
  typingUsers?: string[];
  onTypingChange?: (isTyping: boolean) => void;
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
  typingUsers = [],
  onTypingChange,
  onBack,
}: MessageViewProps & { onBack?: () => void }) {
  // If providerId is provided but no thread, show "Start Conversation" UI
  if (!thread && canCreateThread && providerId) {
    return (
      <div className="flex-1 flex flex-col h-full bg-background">
        <div className="border-b p-4 flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h2 className="text-lg font-semibold">Start a Conversation</h2>
            <p className="text-sm text-muted-foreground">
              Send a message to start a new conversation
            </p>
          </div>
        </div>
        <div className="flex-1 flex flex-col p-4">
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
            onTypingChange={onTypingChange}
          />
        </div>
      </div>
    );
  }

  // No thread selected and no providerId - show default empty state
  if (!thread) {
    return (
      <div className="flex-1 flex flex-col h-full items-center justify-center bg-muted/5">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">Select a conversation</p>
          <p className="text-sm">
            Choose a thread from the list to view messages
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <ThreadHeader
        thread={thread}
        onUpdateStatus={onUpdateStatus}
        getThreadContext={getThreadContext}
        getThreadTitle={getThreadTitle}
        onBack={onBack}
      />
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages */}
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          messagesEndRef={messagesEndRef}
          typingUsers={typingUsers}
          providerLogo={(thread?.provider as any)?.logo}
        />

        {/* Message Input */}
        <div className="p-4 border-t bg-background">
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
            onTypingChange={onTypingChange}
          />
        </div>
      </div>
    </div>
  );
}
