"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { notificationService, Notification } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await notificationService.getNotifications({
        page,
        limit: 20,
        isRead: filter === "all" ? undefined : filter === "unread" ? false : true,
        type: typeFilter === "all" ? undefined : typeFilter,
      });

      if (response.success && response.data) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
        setTotalPages(response.data.pagination.pages);
        setTotal(response.data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, [user, page, filter, typeFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAllRead(true);
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
        toast.success("All notifications marked as read");
        fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all notifications as read");
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const getNotificationTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; variant: "healthcareSuccess" | "healthcareWarning" | "healthcareError" | "default" }> = {
      REFERRAL_NEW: { label: "New Referral", variant: "healthcareSuccess" },
      REFERRAL_UPDATE: { label: "Referral Update", variant: "default" },
      MESSAGE_NEW: { label: "New Message", variant: "healthcareWarning" },
      PLACEMENT_CONFIRMED: { label: "Placement", variant: "healthcareSuccess" },
      LICENSE_EXPIRING: { label: "License", variant: "healthcareWarning" },
      OPENING_EXPIRING: { label: "Opening", variant: "healthcareWarning" },
      INVITE_RECEIVED: { label: "Invitation", variant: "healthcareSuccess" },
      INVITE_EXPIRING: { label: "Invitation", variant: "healthcareWarning" },
    };
    return typeMap[type] || { label: type, variant: "default" as const };
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {total} total notification{total !== 1 ? "s" : ""}
            {unreadCount > 0 && ` • ${unreadCount} unread`}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllRead}
          >
            {isMarkingAllRead ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4 mr-2" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Notifications</CardTitle>
              <CardDescription>
                Stay updated with your latest activities and updates
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="REFERRAL_NEW">New Referrals</SelectItem>
                  <SelectItem value="REFERRAL_UPDATE">Referral Updates</SelectItem>
                  <SelectItem value="MESSAGE_NEW">Messages</SelectItem>
                  <SelectItem value="PLACEMENT_CONFIRMED">Placements</SelectItem>
                  <SelectItem value="LICENSE_EXPIRING">License Expiry</SelectItem>
                  <SelectItem value="OPENING_EXPIRING">Opening Expiry</SelectItem>
                  <SelectItem value="INVITE_RECEIVED">Invitations</SelectItem>
                  <SelectItem value="INVITE_EXPIRING">Invitation Expiry</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread" | "read")}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
            </TabsList>
            <TabsContent value={filter} className="mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {filter === "unread"
                      ? "No unread notifications"
                      : filter === "read"
                        ? "No read notifications"
                        : "No notifications yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => {
                    const typeBadge = getNotificationTypeBadge(notification.type);
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          !notification.isRead
                            ? "bg-muted/50 border-primary/20 hover:bg-muted"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={typeBadge.variant} className="text-xs">
                                {typeBadge.label}
                              </Badge>
                              {!notification.isRead && (
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              )}
                              <h3
                                className={`text-sm font-medium ${
                                  !notification.isRead ? "font-semibold" : ""
                                }`}
                              >
                                {notification.title}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                              {notification.channels.includes("EMAIL") && (
                                <span>• Email sent</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

