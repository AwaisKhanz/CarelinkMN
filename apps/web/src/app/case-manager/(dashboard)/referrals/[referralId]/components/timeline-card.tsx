"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format, formatDistanceToNow } from "date-fns";
import { Referral, referralService } from "@/lib/api";
import { Loader2, User, MessageSquare, UserPlus, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineCardProps {
  referral: Referral;
}

interface TimelineEvent {
  id: string;
  eventType: string;
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  eventData?: any;
}

const getEventIcon = (eventType: string) => {
  if (eventType.includes("CREATED")) return FileText;
  if (eventType.includes("ASSIGNED") || eventType.includes("assigned")) return UserPlus;
  if (eventType.includes("STATUS") || eventType.includes("UPDATE")) return Clock;
  if (eventType.includes("SHORTLIST")) return User;
  if (eventType.includes("MESSAGE")) return MessageSquare;
  if (eventType.includes("RESPONDED")) return CheckCircle;
  if (eventType.includes("CONTACTED")) return MessageSquare;
  return AlertCircle;
};

const getEventColor = (eventType: string) => {
  if (eventType.includes("CREATED")) return "text-primary";
  if (eventType.includes("ASSIGNED") || eventType.includes("assigned")) return "text-primary";
  if (eventType.includes("STATUS") || eventType.includes("UPDATE")) return "text-primary";
  if (eventType.includes("SHORTLIST")) return "text-primary";
  if (eventType.includes("MESSAGE")) return "text-primary";
  if (eventType.includes("RESPONDED")) return "text-success";
  if (eventType.includes("CONTACTED")) return "text-primary";
  return "text-muted-foreground";
};

export function TimelineCard({ referral }: TimelineCardProps) {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimeline();
  }, [referral.id]);

  const fetchTimeline = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await referralService.getReferralTimeline(referral.id);
      if (response.success && response.data) {
        setTimelineEvents(response.data);
      } else {
        setError(response.message || "Failed to load timeline");
      }
    } catch (err) {
      console.error("Error fetching timeline:", err);
      setError(err instanceof Error ? err.message : "Failed to load timeline");
    } finally {
      setIsLoading(false);
    }
  };

  // Combine timeline events with basic referral timestamps
  const allEvents: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    userName?: string;
    eventType?: string;
  }> = [];

  // Note: "Referral Created" event comes from analytics, no need to add it manually

  if (referral.placedAt) {
    allEvents.push({
      id: "placed",
      title: "Referral Placed",
      description: "Client was successfully placed",
      timestamp: referral.placedAt,
    });
  }

  if (referral.closedAt) {
    allEvents.push({
      id: "closed",
      title: "Referral Closed",
      description: "Referral was closed",
      timestamp: referral.closedAt,
    });
  }

  // Add timeline events
  timelineEvents.forEach((event) => {
    allEvents.push({
      id: event.id,
      title: event.title,
      description: event.description,
      timestamp: event.timestamp,
      userName: event.userName,
      eventType: event.eventType,
    });
  });

  // Sort by timestamp (newest first)
  allEvents.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
        <CardDescription>
          Complete history of events and activities for this referral
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-sm text-destructive py-4">{error}</div>
        ) : allEvents.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4">
            No timeline events recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-l-2 border-primary/20 pl-6 space-y-6">
              {allEvents.map((event, index) => {
                const EventIcon = event.eventType 
                  ? getEventIcon(event.eventType)
                  : getEventIcon(event.id);
                const iconColor = event.eventType
                  ? getEventColor(event.eventType)
                  : getEventColor(event.id);

                return (
                  <div key={event.id || index} className="relative">
                    <div className="absolute -left-[1.45rem] top-1">
                      <div className="h-3 w-3 rounded-full bg-primary border-2 border-background" />
                    </div>
                    <div className="bg-muted/40 border border-border rounded-lg p-4 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <EventIcon className={cn("h-4 w-4 mt-0.5 shrink-0", iconColor)} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-foreground break-words">
                              {event.title}
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed mt-1 break-words">
                              {event.description}
                            </p>
                            {event.userName && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                <User className="h-3 w-3 shrink-0" />
                                <span className="break-words">{event.userName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-xs text-muted-foreground block whitespace-nowrap">
                            {format(new Date(event.timestamp), "MMM d, yyyy")}
                          </span>
                          <span className="text-xs text-muted-foreground block whitespace-nowrap">
                            {format(new Date(event.timestamp), "h:mm a")}
                          </span>
                          <span className="text-xs text-muted-foreground block mt-1 whitespace-nowrap">
                            {formatDistanceToNow(new Date(event.timestamp), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
