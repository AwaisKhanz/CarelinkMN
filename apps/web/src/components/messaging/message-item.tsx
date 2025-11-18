"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, Image as ImageIcon, Download } from "lucide-react";
import { Message } from "@carelink/types";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
}

export function MessageItem({ message, isOwnMessage }: MessageItemProps) {
  const senderInitials = message.sender
    ? `${message.sender.firstName?.[0] || ""}${message.sender.lastName?.[0] || ""}`
    : "?";

  return (
    <div
      className={cn(
        "flex gap-3",
        isOwnMessage ? "justify-end" : "justify-start"
      )}
    >
      {!isOwnMessage && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary">
            {senderInitials}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[70%] rounded-lg p-3",
          isOwnMessage
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <p
            className={cn(
              "text-sm font-semibold",
              isOwnMessage ? "text-primary-foreground" : ""
            )}
          >
            {isOwnMessage
              ? "You"
              : message.sender
              ? `${message.sender.firstName} ${message.sender.lastName}`
              : "Unknown"}
          </p>
          <span
            className={cn(
              "text-xs",
              isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {format(new Date(message.createdAt), "MMM d, h:mm a")}
          </span>
        </div>
        <p
          className={cn(
            "text-sm whitespace-pre-wrap",
            isOwnMessage ? "text-primary-foreground" : ""
          )}
        >
          {message.content}
        </p>
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => {
              const isImage = attachment.fileType?.startsWith("image/");
              return (
                <div
                  key={attachment.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded border",
                    isOwnMessage
                      ? "bg-primary/20 border-primary/30"
                      : "bg-muted border-border"
                  )}
                >
                  {isImage ? (
                    <ImageIcon className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-xs font-medium truncate",
                        isOwnMessage ? "text-primary-foreground" : ""
                      )}
                    >
                      {attachment.fileName}
                    </p>
                    <p
                      className={cn(
                        "text-xs",
                        isOwnMessage
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {attachment.fileSize
                        ? `${(attachment.fileSize / 1024).toFixed(1)} KB`
                        : ""}
                    </p>
                  </div>
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "p-1 rounded hover:bg-background/50 transition-colors",
                      isOwnMessage
                        ? "text-primary-foreground hover:text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              );
            })}
          </div>
        )}
        {isOwnMessage && (
          <div className="flex items-center gap-1 mt-2">
            {message.isRead ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-success" />
                <span className="text-xs text-muted-foreground">
                  Read
                  {message.readAt &&
                    ` ${formatDistanceToNow(new Date(message.readAt), {
                      addSuffix: true,
                    })}`}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground/70">Sent</span>
              </>
            )}
          </div>
        )}
      </div>
      {isOwnMessage && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {senderInitials}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

