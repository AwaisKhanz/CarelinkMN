"use client";

import { BulkActionsToolbar } from "@/components/ui/bulk-actions-toolbar";
import { Users, MessageSquare, Download } from "lucide-react";

interface ReferralsBulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onAddToShortlist: () => void;
  onMessage: () => void;
  onExport: () => void;
  canAddToShortlist?: boolean;
  canMessage?: boolean;
  canExport?: boolean;
}

export function ReferralsBulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onAddToShortlist,
  onMessage,
  onExport,
  canAddToShortlist = true,
  canMessage = true,
  canExport = true,
}: ReferralsBulkActionsProps) {
  if (selectedCount === 0) {
    return null;
  }

  const actions = [];
  
  if (canAddToShortlist) {
    actions.push({
      label: "Add to Shortlist",
      icon: <Users className="h-4 w-4" />,
      onClick: onAddToShortlist,
      variant: "default" as const,
    });
  }
  
  if (canMessage) {
    actions.push({
      label: "Message Providers",
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: onMessage,
      variant: "default" as const,
    });
  }
  
  if (canExport) {
    actions.push({
      label: "Export CSV",
      icon: <Download className="h-4 w-4" />,
      onClick: onExport,
      variant: "outline" as const,
    });
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <BulkActionsToolbar
      selectedCount={selectedCount}
      totalCount={totalCount}
      onSelectAll={onSelectAll}
      onDeselectAll={onDeselectAll}
      actions={actions}
    />
  );
}

