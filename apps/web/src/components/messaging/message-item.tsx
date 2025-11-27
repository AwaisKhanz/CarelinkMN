"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, Image as ImageIcon, Download } from "lucide-react";
import { Message } from "@carelink/types";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/ui/user-avatar";
import { FilePreviewDialog } from "@/components/ui/file-preview-dialog";

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
  providerLogo?: string;
}

export function MessageItem({ message, isOwnMessage, providerLogo }: MessageItemProps) {
  // Generate initials with better fallback handling
  const senderInitials = React.useMemo(() => {
    if (!message.sender) return "?";
    
    const firstName = message.sender.firstName || "";
    const lastName = message.sender.lastName || "";
    
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    
    if (firstInitial && lastInitial) {
      return `${firstInitial}${lastInitial}`;
    } else if (firstInitial) {
      return firstInitial;
    } else if (lastInitial) {
      return lastInitial;
    }
    
    return "?";
  }, [message.sender]);

  // Determine which image to show
  // Show provider logo for all users in this conversation if available
  const avatarImageUrl = providerLogo || ((message.sender as any)?.profileImage || (message.sender as any)?.avatar);

  return (
    <div
      className={cn(
        "flex gap-1.5 max-w-[75%]",
        isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      <UserAvatar
        profileImage={message.sender?.profileImage}
        firstName={message.sender?.firstName}
        lastName={message.sender?.lastName}
        className="h-8 w-8 flex-shrink-0 mt-1"
        fallbackClassName={cn(
          "text-xs font-medium",
          isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      />

      <div className={cn("flex flex-col gap-0.5 min-w-0", isOwnMessage ? "items-end" : "items-start")}>
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-xs font-medium text-muted-foreground">
            {isOwnMessage
              ? "You"
              : message.sender
              ? `${message.sender.firstName} ${message.sender.lastName}`
              : "Unknown"}
          </span>
          <span className="text-[10px] text-muted-foreground/70">
            {format(new Date(message.createdAt), "h:mm a")}
          </span>
        </div>

        {/* Message content - only show if there's actual content (not just placeholder or whitespace) */}
        {message.content && 
         message.content.trim() && 
         message.content.trim() !== "📎 Attachment" &&
         message.content.trim() !== "Attachment" && (
          <div
            className={cn(
              "rounded-2xl px-4 py-2 shadow-sm text-sm whitespace-pre-wrap break-words",
              isOwnMessage
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-card border border-border/50 text-card-foreground rounded-tl-sm"
            )}
          >
            {message.content}
          </div>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className={cn("mt-2 flex flex-wrap gap-2", isOwnMessage ? "justify-end" : "justify-start")}>
            {message.attachments.map((attachment) => {
              const isImage = attachment.fileType?.startsWith("image/");
              const isPdf = attachment.fileType === "application/pdf";
              const isVideo = attachment.fileType?.startsWith("video/");
              const isAudio = attachment.fileType?.startsWith("audio/");
              
              const canPreview = isImage || isPdf || isVideo || isAudio;

              // For images and videos, show thumbnail
              if (isImage || isVideo) {
                return (
                  <FilePreviewDialog
                    key={attachment.id}
                    url={attachment.url}
                    fileName={attachment.fileName}
                    fileType={attachment.fileType}
                  >
                    <div
                      className={cn(
                        "relative rounded-lg overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 group",
                        "w-32 h-32"
                      )}
                    >
                      {isImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={attachment.url}
                          alt={attachment.fileName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <video
                            src={attachment.url}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                              <svg className="w-6 h-6 text-primary ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                        </>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-[10px] truncate font-medium">
                          {attachment.fileName}
                        </p>
                      </div>
                    </div>
                  </FilePreviewDialog>
                );
              }

              // For other files, show card with icon
              const AttachmentCard = (
                <div
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border text-xs max-w-xs bg-background/50 backdrop-blur-sm transition-colors group",
                    isOwnMessage ? "border-primary/20" : "border-border",
                    canPreview && "cursor-pointer hover:bg-muted/50"
                  )}
                >
                  {isPdf ? (
                    <div className="h-8 w-8 rounded bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-red-600" />
                    </div>
                  ) : isAudio ? (
                    <div className="h-8 w-8 rounded bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate max-w-[150px]">
                      {attachment.fileName}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-muted-foreground">
                        {attachment.fileSize
                          ? `${(attachment.fileSize / 1024).toFixed(1)} KB`
                          : ""}
                      </p>
                      {attachment.fileType && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1">
                          {attachment.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground z-10"
                    title="Download"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              );

              return (
                <FilePreviewDialog
                  key={attachment.id}
                  url={attachment.url}
                  fileName={attachment.fileName}
                  fileType={attachment.fileType}
                >
                  {AttachmentCard}
                </FilePreviewDialog>
              );
            })}
          </div>
        )}

        {isOwnMessage && (
          <div className="flex items-center gap-1 mt-1 px-1">
            {message.isRead ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-primary" />
                <span className="text-[10px] text-muted-foreground">
                  Read {message.readAt && formatDistanceToNow(new Date(message.readAt), { addSuffix: true })}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3 text-muted-foreground/40" />
                <span className="text-[10px] text-muted-foreground/60">Sent</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

