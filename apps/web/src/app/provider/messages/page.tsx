"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Loader2,
  Paperclip,
  MoreVertical,
  X,
  FileText,
  Image as ImageIcon,
  Download,
} from "lucide-react";
import { usePageMetadata } from "../use-page-metadata";
import {
  messagingService,
  providerService,
  uploadService,
  type MessageThread,
  type Message,
  type ThreadStatus,
  type MessageAttachmentData,
} from "@/lib/api";
import { ThreadStatus as ThreadStatusEnum } from "@carelink/types";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { PROVIDER_FEATURE_GATES } from "@/lib/constants";
import { SLABadge, calculateHoursSince, minutesToHours } from "@/components/ui/sla-badge";

export default function ProviderMessagesPage() {
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [messageContent, setMessageContent] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [attachments, setAttachments] = useState<MessageAttachmentData[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesGate = PROVIDER_FEATURE_GATES.messages;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    setTitle("Messages");
    setDescription("Manage your conversations and inquiries.");
  }, [setTitle, setDescription]);

  useEffect(() => {
    const fetchProviderId = async () => {
      if (!user?.organizationId) return;
      try {
        const provider = await providerService.getProviderByOrganizationId(
          user.organizationId
        );
        if (provider?.id) {
          setProviderId(provider.id);
        }
      } catch (err) {
        console.error("Error fetching provider ID:", err);
        toast.error("Failed to load provider data.");
      }
    };
    fetchProviderId();
  }, [user?.organizationId]);

  // Reset page to 1 when filters change
  useEffect(() => {
    if (providerId) {
      setPage(1);
    }
  }, [providerId, statusFilter, searchQuery]);

  useEffect(() => {
    if (providerId) {
      fetchThreads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, page, statusFilter, searchQuery]);

  useEffect(() => {
    if (selectedThread?.id) {
      fetchThreadMessages(selectedThread.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThread?.id]); // Only depend on thread ID to avoid infinite loops

  const fetchThreads = async () => {
    if (!providerId) return;

    setIsLoading(true);
    try {
      const response = await messagingService.getThreads({
        providerId,
        status: statusFilter !== "all" ? (statusFilter as ThreadStatusEnum) : undefined,
        search: searchQuery || undefined,
        page,
        limit: 20,
      });

      if (response.success && response.data) {
        setThreads(response.data.threads);
        setTotalPages(response.data.pagination.pages);

        // Auto-select first thread if none selected and we have threads
        // Use functional update to avoid stale closure issues
        if (response.data) {
          setSelectedThread((currentSelected) => {
            if (!currentSelected && response.data!.threads.length > 0) {
              return response.data!.threads[0];
            } else if (currentSelected) {
              // Update selected thread with refreshed data if it still exists in list
              const updatedThread = response.data!.threads.find(t => t.id === currentSelected.id);
              if (updatedThread) {
                return { ...currentSelected, ...updatedThread };
              }
            }
            return currentSelected;
          });
        }
      } else {
        toast.error(response.message || "Failed to load threads.");
      }
    } catch (err) {
      console.error("Error fetching threads:", err);
      toast.error("Failed to load messages.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchThreadMessages = async (threadId: string) => {
    try {
      const response = await messagingService.getThreadById(threadId);
      if (response.success && response.data) {
        setMessages(response.data.messages || []);
        // Refresh threads list to update unread counts, then update selected thread with merged data
        if (providerId) {
          const threadResponse = await messagingService.getThreads({
            providerId,
            status: statusFilter !== "all" ? (statusFilter as ThreadStatusEnum) : undefined,
            search: searchQuery || undefined,
            page,
            limit: 20,
          });
          if (threadResponse.success && threadResponse.data) {
            setThreads(threadResponse.data.threads);
            setTotalPages(threadResponse.data.pagination.pages);
            // Update selected thread with full data from getThreadById + refreshed unread count from list
            const updatedThread = threadResponse.data.threads.find(t => t.id === threadId);
            if (updatedThread) {
              setSelectedThread({ ...response.data, unreadCount: updatedThread.unreadCount });
            } else {
              // Thread not in list anymore (maybe filtered out), just use response data
              setSelectedThread(response.data);
            }
          } else {
            // If thread list refresh fails, still update with thread data
            setSelectedThread(response.data);
          }
        } else {
          setSelectedThread(response.data);
        }
      } else {
        toast.error(response.message || "Failed to load messages.");
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      toast.error("Failed to load messages.");
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingAttachment(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File "${file.name}" exceeds 10MB limit`);
        }

        // Upload file using existing upload API
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
      // Reset file input
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
        // Refresh messages
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

  const handleUpdateStatus = async (threadId: string, status: ThreadStatusEnum) => {
    try {
      const response = await messagingService.updateThreadStatus(threadId, status);
      if (response.success && response.data) {
        toast.success("Thread status updated");
        // Refresh threads list to update status in sidebar
        if (providerId) {
          const threadResponse = await messagingService.getThreads({
            providerId,
            status: statusFilter !== "all" ? (statusFilter as ThreadStatusEnum) : undefined,
            search: searchQuery || undefined,
            page,
            limit: 20,
          });
          if (threadResponse.success && threadResponse.data) {
            setThreads(threadResponse.data.threads);
            setTotalPages(threadResponse.data.pagination.pages);
          }
        }
        // Update selected thread if it's the one being updated
        if (selectedThread?.id === threadId) {
          setSelectedThread(response.data);
        }
      } else {
        toast.error(response.message || "Failed to update status.");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status.");
    }
  };

  const getStatusBadge = (status: ThreadStatusEnum) => {
    switch (status) {
      case ThreadStatusEnum.OPEN:
        return (
          <Badge variant="healthcareSuccess" className="whitespace-nowrap">
            Open
          </Badge>
        );
      case ThreadStatusEnum.AWAITING_RESPONSE:
        return (
          <Badge variant="healthcareWarning" className="whitespace-nowrap">
            Awaiting Response
          </Badge>
        );
      case ThreadStatusEnum.RESOLVED:
        return (
          <Badge variant="healthcareSecondary" className="whitespace-nowrap">
            Resolved
          </Badge>
        );
      case ThreadStatusEnum.CLOSED:
        return (
          <Badge variant="healthcareError" className="whitespace-nowrap">
            Closed
          </Badge>
        );
      default:
        return null;
    }
  };

  const getSLABadge = (thread: MessageThread) => {
    const responseTimeHours = minutesToHours(thread.avgResponseTime);
    const hoursSinceCreation = !thread.firstResponseAt 
      ? calculateHoursSince(thread.createdAt)
      : undefined;

    return (
      <SLABadge
        responseTimeHours={responseTimeHours ?? undefined}
        hoursSinceCreation={hoursSinceCreation}
        isClosed={thread.status === ThreadStatusEnum.CLOSED}
        showTime={true}
        size="sm"
      />
    );
  };

  const getThreadContext = (thread: MessageThread) => {
    if (thread.referral) {
      return `Referral: ${thread.referral.referralNumber}`;
    }
    if (thread.dischargeCase) {
      return `Discharge: ${thread.dischargeCase.caseNumber}`;
    }
    return "General Inquiry";
  };

  const content =
    isLoading && threads.length === 0 ? (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    ) : (
      <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Thread List Sidebar */}
      <Card variant="healthcare" className="w-96 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Messages</CardTitle>
            <Badge variant="healthcareSecondary">
              {threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0)}
            </Badge>
          </div>
          <CardDescription>Your conversations</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-3 p-4 pt-0">
          {/* Search and Filter */}
          <div className="space-y-2">
            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search messages..."
              filterValue={statusFilter}
              onFilterChange={setStatusFilter}
              filterOptions={[
                { value: "all", label: "All Status" },
                { value: ThreadStatusEnum.OPEN, label: "Open" },
                { value: ThreadStatusEnum.AWAITING_RESPONSE, label: "Awaiting Response" },
                { value: ThreadStatusEnum.RESOLVED, label: "Resolved" },
                { value: ThreadStatusEnum.CLOSED, label: "Closed" },
              ]}
              filterPlaceholder="Filter by status"
            />
          </div>

          {/* Thread List */}
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {threads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No messages found</p>
                </div>
              ) : (
                threads.map((thread) => {
                  const lastMessage = thread.messages?.[0];
                  const isSelected = selectedThread?.id === thread.id;
                  const isUnread = (thread.unreadCount || 0) > 0;

                  return (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedThread(thread)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "bg-background border-border hover:bg-muted/50",
                        isUnread && "border-l-4 border-l-primary"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm truncate">
                              {thread.initiator
                                ? `${thread.initiator.firstName} ${thread.initiator.lastName}`
                                : "Unknown"}
                            </p>
                            {isUnread && (
                              <Badge variant="healthcareError" className="h-5 px-1.5 text-xs">
                                {thread.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {getThreadContext(thread)}
                          </p>
                          {lastMessage && (
                            <p className="text-xs text-muted-foreground truncate">
                              {lastMessage.content}
                            </p>
                          )}
                          {thread.lastMessageAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(thread.lastMessageAt), {
                                addSuffix: true,
                              })}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(thread.status)}
                          {getSLABadge(thread)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message View */}
      <Card variant="healthcare" className="flex-1 flex flex-col">
        {selectedThread ? (
          <>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle>
                      {selectedThread.initiator
                        ? `${selectedThread.initiator.firstName} ${selectedThread.initiator.lastName}`
                        : "Unknown"}
                    </CardTitle>
                    {getStatusBadge(selectedThread.status)}
                    {getSLABadge(selectedThread)}
                  </div>
                  <CardDescription>{getThreadContext(selectedThread)}</CardDescription>
                  {selectedThread.initiator && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedThread.initiator.email} • {selectedThread.initiator.role}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {selectedThread.status !== ThreadStatusEnum.OPEN && (
                      <DropdownMenuItem
                        onClick={() => handleUpdateStatus(selectedThread.id, ThreadStatusEnum.OPEN)}
                      >
                        Mark as Open
                      </DropdownMenuItem>
                    )}
                    {selectedThread.status !== ThreadStatusEnum.RESOLVED && (
                      <DropdownMenuItem
                        onClick={() => handleUpdateStatus(selectedThread.id, ThreadStatusEnum.RESOLVED)}
                      >
                        Mark as Resolved
                      </DropdownMenuItem>
                    )}
                    {selectedThread.status !== ThreadStatusEnum.CLOSED && (
                      <DropdownMenuItem
                        onClick={() => handleUpdateStatus(selectedThread.id, ThreadStatusEnum.CLOSED)}
                      >
                        Close Thread
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4 pt-0">
              {/* Messages */}
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => {
                        const isOwnMessage = message.senderId === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex gap-3",
                              isOwnMessage ? "justify-end" : "justify-start"
                            )}
                          >
                            {!isOwnMessage && (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-primary">
                                  {message.sender?.firstName?.[0] || "?"}
                                </span>
                              </div>
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
                                              isOwnMessage
                                                ? "text-primary-foreground"
                                                : ""
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
                              {isOwnMessage && message.isRead && (
                                <div className="flex items-center gap-1 mt-2">
                                  <CheckCircle2 className="h-3 w-3 text-primary-foreground/70" />
                                  <span className="text-xs text-primary-foreground/70">Read</span>
                                </div>
                              )}
                            </div>
                            {isOwnMessage && (
                              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-primary-foreground">
                                  {user?.firstName?.[0] || "?"}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </ScrollArea>

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
                            onClick={() => handleRemoveAttachment(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Textarea
                  placeholder="Type your message..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      disabled={uploadingAttachment || selectedThread.status === ThreadStatusEnum.CLOSED}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAttachment || selectedThread.status === ThreadStatusEnum.CLOSED}
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
                    onClick={handleSendMessage}
                    disabled={
                      (!messageContent.trim() && attachments.length === 0) ||
                      isSending ||
                      uploadingAttachment ||
                      selectedThread.status === ThreadStatusEnum.CLOSED
                    }
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
            </CardContent>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold">Select a conversation</p>
              <p className="text-sm">Choose a thread from the list to view messages</p>
            </div>
          </div>
        )}
      </Card>
      </div>
    );

  return (
    <FeatureGate
      feature={messagesGate.feature}
      requiredPlan={messagesGate.requiredPlan}
      bannerDescription={messagesGate.description}
    >
      {content}
    </FeatureGate>
  );
}

