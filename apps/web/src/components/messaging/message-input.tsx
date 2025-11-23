"use client";

import { RefObject, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Paperclip, Send, X, FileText } from "lucide-react";
import { MessageAttachmentData } from "@carelink/types";

interface MessageInputProps {
  messageContent: string;
  onMessageContentChange: (value: string) => void;
  attachments: MessageAttachmentData[];
  onRemoveAttachment: (index: number) => void;
  isSending: boolean;
  uploadingAttachment: boolean;
  onSendMessage: () => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement>;
  isThreadClosed?: boolean;
  onTypingChange?: (isTyping: boolean) => void; // New prop for typing indicator
}

export function MessageInput({
  messageContent,
  onMessageContentChange,
  attachments,
  onRemoveAttachment,
  isSending,
  uploadingAttachment,
  onSendMessage,
  onFileSelect,
  fileInputRef,
  isThreadClosed = false,
  onTypingChange,
}: MessageInputProps) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing indicator
  useEffect(() => {
    if (!onTypingChange || isThreadClosed) return;

    // User is typing
    if (messageContent.length > 0) {
      onTypingChange(true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTypingChange(false);
      }, 3000);
    } else {
      // No content, stop typing indicator
      onTypingChange(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageContent, onTypingChange, isThreadClosed]);

  return (
    <>
      <Separator className="mb-4" />

      {/* Compose Message */}
      <div className="space-y-2">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="space-y-2 p-2 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Attachments ({attachments.length})
              </span>
            </div>
            <div className="space-y-1">
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded bg-background border border-border"
                >
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {attachment.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attachment.fileSize
                        ? `${(attachment.fileSize / 1024).toFixed(1)} KB`
                        : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onRemoveAttachment(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Textarea
          placeholder={
            isThreadClosed
              ? "This thread is closed. You cannot send messages."
              : "Type your message..."
          }
          value={messageContent}
          onChange={(e) => onMessageContentChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isThreadClosed) {
              e.preventDefault();
              onSendMessage();
            }
          }}
          rows={3}
          className="resize-none"
          disabled={isThreadClosed}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
              onChange={onFileSelect}
              disabled={uploadingAttachment || isThreadClosed}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAttachment || isThreadClosed}
              title="Attach file"
            >
              {uploadingAttachment ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </Button>
            <span className="text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line
            </span>
          </div>
          <Button
            onClick={onSendMessage}
            disabled={
              (!messageContent.trim() && attachments.length === 0) ||
              isSending ||
              uploadingAttachment ||
              isThreadClosed
            }
            variant="healthcare"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

