"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building, MoreVertical, MessageSquare, Clock, CheckCircle, Eye, XCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ReferralShortlist } from "@/lib/api";
import { SHORTLIST_STATUS_CONFIG } from "@/lib/constants";
import { ShortlistStatus } from "@carelink/types";

interface ShortlistItemProps {
  item: ReferralShortlist;
  referralId: string;
  onUpdateStatus: (shortlistId: string, status: ShortlistStatus) => void;
  onRemove: (shortlistId: string) => void;
  onMessage: (providerId: string) => void;
}

export function ShortlistItem({
  item,
  referralId,
  onUpdateStatus,
  onRemove,
  onMessage,
}: ShortlistItemProps) {
  const statusConfig = SHORTLIST_STATUS_CONFIG[item.status];

  return (
    <Card variant="healthcare" className="border-border">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-semibold">
                {item.provider?.organization?.name || "Unknown Provider"}
              </h4>
              <Badge variant={statusConfig?.color || "outline"}>
                {statusConfig?.label || item.status}
              </Badge>
            </div>
            {item.provider?.homes && item.provider.homes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {item.provider.homes.slice(0, 3).map((home) => (
                  <Badge key={home.id} variant="outline" className="text-xs">
                    <Building className="h-3 w-3 mr-1 inline" />
                    {home.name} - {home.city}, {home.state}
                  </Badge>
                ))}
                {item.provider.homes.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{item.provider.homes.length - 3} more
                  </Badge>
                )}
              </div>
            )}
            {item.notes && (
              <p className="text-sm text-muted-foreground mt-2">
                {item.notes}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span>
                Added: {format(new Date(item.addedAt), "MMM d, yyyy")}
              </span>
              {item.contactedAt && (
                <span>
                  Contacted: {format(new Date(item.contactedAt), "MMM d, yyyy")}
                </span>
              )}
              {item.respondedAt && (
                <span>
                  Responded: {format(new Date(item.respondedAt), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onMessage(item.providerId)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(item.id, ShortlistStatus.CONTACTED)}
                  disabled={item.status === ShortlistStatus.CONTACTED}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Mark as Contacted
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(item.id, ShortlistStatus.RESPONDED)}
                  disabled={item.status === ShortlistStatus.RESPONDED}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Responded
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(item.id, ShortlistStatus.TOURING)}
                  disabled={item.status === ShortlistStatus.TOURING}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Mark as Touring
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(item.id, ShortlistStatus.DECLINED)}
                  disabled={item.status === ShortlistStatus.DECLINED}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark as Declined
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onRemove(item.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove from Shortlist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


