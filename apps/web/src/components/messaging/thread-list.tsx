"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Loader2 } from "lucide-react";
import { MessageThread, ThreadStatus as ThreadStatusEnum } from "@carelink/types";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { ThreadItem } from "./thread-item";
import { SLABadge, calculateHoursSince, minutesToHours } from "@/components/ui/sla-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionsToolbar } from "@/components/ui/bulk-actions-toolbar";

interface ThreadListProps {
  threads: MessageThread[];
  selectedThread: MessageThread | null;
  onThreadSelect: (thread: MessageThread) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  getThreadContext?: (thread: MessageThread) => string;
  getThreadTitle?: (thread: MessageThread) => string;
  isLoading?: boolean;
  selectedThreads?: Set<string>;
  onThreadToggle?: (threadId: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onBatchMessage?: () => void;
}

export function ThreadList({
  threads,
  selectedThread,
  onThreadSelect,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  page,
  totalPages,
  onPageChange,
  getThreadContext,
  getThreadTitle,
  isLoading = false,
  selectedThreads = new Set(),
  onThreadToggle,
  onSelectAll,
  onDeselectAll,
  onBatchMessage,
}: ThreadListProps) {
  const totalUnread = threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
  const isBatchMode = !!onThreadToggle;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Messages</h2>
            {totalUnread > 0 && (
              <Badge variant="healthcareSecondary" className="rounded-full px-2 py-0.5 text-xs">
                {totalUnread}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="space-y-2">
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search messages..."
            filterValue={statusFilter}
            onFilterChange={onStatusFilterChange}
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

        {/* Bulk Actions Toolbar */}
        {isBatchMode && selectedThreads.size > 0 && (
          <div className="mt-2">
            <BulkActionsToolbar
              selectedCount={selectedThreads.size}
              totalCount={threads.length}
              onSelectAll={onSelectAll || (() => {})}
              onDeselectAll={onDeselectAll || (() => {})}
              actions={[
                {
                  label: "Send Message",
                  icon: <MessageSquare className="h-4 w-4" />,
                  onClick: onBatchMessage || (() => {}),
                  variant: "default",
                },
              ]}
              showSelectAll={false}
            />
          </div>
        )}
      </div>

      {/* Thread List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Searching...</p>
              </div>
            </div>
          )}
          {threads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No messages found</p>
            </div>
          ) : (
            threads.map((thread) => (
              <div key={thread.id} className="flex items-start gap-2 group">
                {isBatchMode && onThreadToggle && (
                  <div className="pt-3 pl-1">
                    <Checkbox
                      checked={selectedThreads.has(thread.id)}
                      onCheckedChange={() => onThreadToggle(thread.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <ThreadItem
                    thread={thread}
                    isSelected={selectedThread?.id === thread.id}
                    onSelect={() => onThreadSelect(thread)}
                    getThreadContext={getThreadContext}
                    getThreadTitle={getThreadTitle}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 border-t bg-background/50 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="h-8 px-2"
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="h-8 px-2"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

