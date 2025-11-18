"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  messagingService,
  type MessageThread,
  type Message,
  type MessageAttachmentData,
  uploadService,
} from "@/lib/api";
import { ThreadStatus as ThreadStatusEnum } from "@carelink/types";
import { toast } from "sonner";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { ThreadList } from "./thread-list";
import { MessageView } from "./message-view";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface MessageCenterProps {
  // Filter parameters
  providerId?: string;
  referralId?: string;
  dischargeCaseId?: string;
  // Initial selected thread
  initialThreadId?: string;
  // Custom thread context formatter
  getThreadContext?: (thread: MessageThread) => string;
  // Custom thread title formatter
  getThreadTitle?: (thread: MessageThread) => string;
  // Container height
  containerHeight?: string;
  // Callbacks
  onThreadSelect?: (thread: MessageThread) => void;
  onThreadStatusChange?: (threadId: string, status: ThreadStatusEnum) => void;
}

export function MessageCenter({
  providerId,
  referralId,
  dischargeCaseId,
  initialThreadId,
  getThreadContext,
  getThreadTitle,
  containerHeight = "calc(100vh - 8rem)",
  onThreadSelect,
  onThreadStatusChange,
}: MessageCenterProps) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [messageContent, setMessageContent] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [attachments, setAttachments] = useState<MessageAttachmentData[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(new Set());
  const [batchMessageDialogOpen, setBatchMessageDialogOpen] = useState(false);
  const [batchMessageContent, setBatchMessageContent] = useState("");
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery, providerId, referralId, dischargeCaseId]);

  // Auto-select initial thread or first thread
  useEffect(() => {
    if (threads.length > 0 && !selectedThread) {
      const threadToSelect = initialThreadId
        ? threads.find((t) => t.id === initialThreadId) || threads[0]
        : threads[0];
      setSelectedThread(threadToSelect);
      if (onThreadSelect) {
        onThreadSelect(threadToSelect);
      }
    }
  }, [threads, initialThreadId, onThreadSelect]); // Removed selectedThread from deps to avoid infinite loop

  // Fetch messages when thread is selected
  useEffect(() => {
    if (selectedThread?.id) {
      fetchThreadMessages(selectedThread.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThread?.id]);

  const fetchThreads = useCallback(async () => {
    // Only show full loading on initial load (when threads.length === 0)
    // For subsequent searches/filters, use isSearching to show loading in thread list only
    const isInitialLoad = threads.length === 0;
    
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsSearching(true);
    }
    
    try {
      const response = await messagingService.getThreads({
        providerId,
        referralId,
        dischargeCaseId,
        status: statusFilter !== "all" ? (statusFilter as ThreadStatusEnum) : undefined,
        search: searchQuery || undefined,
        page,
        limit: 20,
      });

      if (response.success && response.data) {
        setThreads(response.data.threads);
        setTotalPages(response.data.pagination.pages);
      } else {
        toast.error(response.message || "Failed to load threads.");
      }
    } catch (err) {
      console.error("Error fetching threads:", err);
      toast.error("Failed to load messages.");
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [providerId, referralId, dischargeCaseId, statusFilter, searchQuery, page, threads.length]);

  // Fetch threads on mount and when dependencies change
  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const fetchThreadMessages = async (threadId: string) => {
    try {
      const response = await messagingService.getThreadById(threadId);
      if (response.success && response.data) {
        setMessages(response.data.messages || []);
        
        // Refresh threads to update unread counts
        const threadResponse = await messagingService.getThreads({
          providerId,
          referralId,
          dischargeCaseId,
          status: statusFilter !== "all" ? (statusFilter as ThreadStatusEnum) : undefined,
          search: searchQuery || undefined,
          page,
          limit: 20,
        });
        
        if (threadResponse.success && threadResponse.data) {
          setThreads(threadResponse.data.threads);
          const updatedThread = threadResponse.data.threads.find((t) => t.id === threadId);
          if (updatedThread) {
            setSelectedThread({ ...response.data, unreadCount: updatedThread.unreadCount });
          } else {
            setSelectedThread(response.data);
          }
        } else {
          setSelectedThread(response.data);
        }

        // Mark as read
        await messagingService.markAsRead(threadId);
      } else {
        toast.error(response.message || "Failed to load messages.");
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      toast.error("Failed to load messages.");
    }
  };

  const handleThreadSelect = (thread: MessageThread) => {
    setSelectedThread(thread);
    if (onThreadSelect) {
      onThreadSelect(thread);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingAttachment(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File "${file.name}" exceeds 10MB limit`);
        }

        const result = await uploadService.uploadFile(
          file,
          "message-attachment",
          "messages/attachments"
        );

        return {
          url: result.url,
          fileName: result.fileName || file.name,
          fileType: result.mimeType || file.type,
          fileSize: result.fileSize || file.size,
        } as MessageAttachmentData;
      });

      const uploadedAttachments = await Promise.all(uploadPromises);
      setAttachments((prev) => [...prev, ...uploadedAttachments]);
      toast.success(`${uploadedAttachments.length} file(s) attached`);
    } catch (err) {
      console.error("Error uploading attachment:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to upload attachment"
      );
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!selectedThread || (!messageContent.trim() && attachments.length === 0)) return;

    setIsSending(true);
    try {
      const response = await messagingService.sendMessage({
        threadId: selectedThread.id,
        content: messageContent.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (response.success && response.data) {
        setMessageContent("");
        setAttachments([]);
        await fetchThreadMessages(selectedThread.id);
        toast.success("Message sent successfully");
      } else {
        toast.error(response.message || "Failed to send message.");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  // Handle batch messaging
  const handleThreadToggle = (threadId: string) => {
    setSelectedThreads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedThreads(new Set(threads.map((t) => t.id)));
  };

  const handleDeselectAll = () => {
    setSelectedThreads(new Set());
  };

  const handleBatchMessage = async () => {
    if (selectedThreads.size === 0 || !batchMessageContent.trim()) return;

    setIsSendingBatch(true);
    try {
      const threadIds = Array.from(selectedThreads);
      const results = await Promise.allSettled(
        threadIds.map((threadId) =>
          messagingService.sendMessage({
            threadId,
            content: batchMessageContent.trim(),
          })
        )
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (successful > 0) {
        toast.success(
          `Message sent to ${successful} conversation${successful > 1 ? "s" : ""}`
        );
        setBatchMessageDialogOpen(false);
        setBatchMessageContent("");
        setSelectedThreads(new Set());
        // Refresh threads
        await fetchThreads();
      }
      if (failed > 0) {
        toast.error(
          `Failed to send message to ${failed} conversation${failed > 1 ? "s" : ""}`
        );
      }
    } catch (err) {
      console.error("Error sending batch messages:", err);
      toast.error("Failed to send batch messages");
    } finally {
      setIsSendingBatch(false);
    }
  };

  const handleUpdateStatus = async (threadId: string, status: ThreadStatusEnum) => {
    try {
      const response = await messagingService.updateThreadStatus(threadId, status);
      if (response.success && response.data) {
        toast.success("Thread status updated");
        
        // Refresh threads
        const threadResponse = await messagingService.getThreads({
          providerId,
          referralId,
          dischargeCaseId,
          status: statusFilter !== "all" ? (statusFilter as ThreadStatusEnum) : undefined,
          search: searchQuery || undefined,
          page,
          limit: 20,
        });
        
        if (threadResponse.success && threadResponse.data) {
          setThreads(threadResponse.data.threads);
        }
        
        if (selectedThread?.id === threadId) {
          setSelectedThread(response.data);
        }

        if (onThreadStatusChange) {
          onThreadStatusChange(threadId, status);
        }
      } else {
        toast.error(response.message || "Failed to update status.");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status.");
    }
  };

  if (isLoading && threads.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-4")} style={{ height: containerHeight }}>
      {/* Thread List Sidebar */}
      <ThreadList
        threads={threads}
        selectedThread={selectedThread}
        onThreadSelect={handleThreadSelect}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        getThreadContext={getThreadContext}
        getThreadTitle={getThreadTitle}
        isLoading={isSearching}
        selectedThreads={selectedThreads}
        onThreadToggle={handleThreadToggle}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onBatchMessage={() => setBatchMessageDialogOpen(true)}
      />

      {/* Message View */}
      <MessageView
        thread={selectedThread}
        messages={messages}
        messageContent={messageContent}
        onMessageContentChange={setMessageContent}
        attachments={attachments}
        onRemoveAttachment={handleRemoveAttachment}
        isSending={isSending}
        uploadingAttachment={uploadingAttachment}
        onSendMessage={handleSendMessage}
        onFileSelect={handleFileSelect}
        fileInputRef={fileInputRef}
        messagesEndRef={messagesEndRef}
        currentUserId={user?.id}
        onUpdateStatus={handleUpdateStatus}
        getThreadContext={getThreadContext}
        getThreadTitle={getThreadTitle}
      />

      {/* Batch Message Dialog */}
      <Dialog
        open={batchMessageDialogOpen}
        onOpenChange={setBatchMessageDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Batch Message</DialogTitle>
            <DialogDescription>
              Send a message to {selectedThreads.size} selected conversation
              {selectedThreads.size !== 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="batch-message">Message</Label>
              <Textarea
                id="batch-message"
                placeholder="Enter your message here..."
                value={batchMessageContent}
                onChange={(e) => setBatchMessageContent(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBatchMessageDialogOpen(false);
                  setBatchMessageContent("");
                }}
                disabled={isSendingBatch}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBatchMessage}
                disabled={!batchMessageContent.trim() || isSendingBatch}
                variant="healthcare"
              >
                {isSendingBatch ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to {selectedThreads.size} Conversation
                    {selectedThreads.size !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

