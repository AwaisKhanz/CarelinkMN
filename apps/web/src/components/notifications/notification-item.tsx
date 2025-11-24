import { formatDistanceToNow } from "date-fns";
import { Notification, NotificationType, NotificationResponse } from "@carelink/types";
import { cn } from "@/lib/utils";
import { 
  Bell, 
  MessageSquare, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  User,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationItemProps {
  notification: NotificationResponse | Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: NotificationResponse | Notification) => void;
}

export function NotificationItem({ 
  notification, 
  onRead, 
  onDelete,
  onClick 
}: NotificationItemProps) {
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.MESSAGE_RECEIVED:
      case NotificationType.PROVIDER_RESPONSE:
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      
      case NotificationType.NEW_REFERRAL:
      case NotificationType.NEW_REFERRAL_REQUEST:
        return <FileText className="h-4 w-4 text-green-500" />;
        
      case NotificationType.PLACEMENT_CONFIRMED:
      case NotificationType.PLACEMENT_SUCCESS:
      case NotificationType.BOOKING_CONFIRMED:
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
        
      case NotificationType.URGENT_CASE_ALERT:
      case NotificationType.OPENING_EXPIRING:
      case NotificationType.LICENSE_EXPIRING:
      case NotificationType.RETENTION_ALERT:
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
        
      case NotificationType.BOOKING_COMPLETED:
      case NotificationType.DISCHARGE_PLACEMENT:
        return <Calendar className="h-4 w-4 text-purple-500" />;
        
      case NotificationType.REQUEST_ASSIGNED:
      case NotificationType.CLIENT_UPDATE:
        return <User className="h-4 w-4 text-indigo-500" />;
        
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.id);
    }
    if (onClick) {
      onClick(notification);
    }
  };

  return (
    <div 
      className={cn(
        "relative flex gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer group border-b last:border-0",
        !notification.isRead && "bg-blue-50/50 dark:bg-blue-900/10"
      )}
      onClick={handleClick}
    >
      <div className="mt-1 flex-shrink-0">
        {getIcon(notification.type)}
      </div>
      
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-medium leading-none", !notification.isRead && "text-primary")}>
            {notification.title}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        
        {notification.actionUrl && (
          <div className="pt-1">
            <Button 
              variant="link" 
              className="h-auto p-0 text-xs font-medium"
              onClick={(e) => {
                e.stopPropagation();
                // Navigation handled by parent or Link component
                if (onClick) onClick(notification);
              }}
            >
              {notification.actionLabel || "View Details"}
            </Button>
          </div>
        )}
      </div>
      
      {!notification.isRead && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onRead(notification.id);
            }}
            title="Mark as read"
          >
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="sr-only">Mark as read</span>
          </Button>
        </div>
      )}
    </div>
  );
}
