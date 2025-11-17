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
}: ThreadListProps) {
  const totalUnread = threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);

  return (
    <Card variant="healthcare" className="w-96 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Messages</CardTitle>
          {totalUnread > 0 && (
            <Badge variant="healthcareSecondary">{totalUnread}</Badge>
          )}
        </div>
        <CardDescription>Your conversations</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 p-4 pt-0">
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

        {/* Thread List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Searching...</p>
                </div>
              </div>
            )}
            {threads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No messages found</p>
              </div>
            ) : (
              threads.map((thread) => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isSelected={selectedThread?.id === thread.id}
                  onSelect={() => onThreadSelect(thread)}
                  getThreadContext={getThreadContext}
                  getThreadTitle={getThreadTitle}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
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
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

