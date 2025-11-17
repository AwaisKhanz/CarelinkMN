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
}

export function ReferralsBulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onAddToShortlist,
  onMessage,
  onExport,
}: ReferralsBulkActionsProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <BulkActionsToolbar
      selectedCount={selectedCount}
      totalCount={totalCount}
      onSelectAll={onSelectAll}
      onDeselectAll={onDeselectAll}
      actions={[
        {
          label: "Add to Shortlist",
          icon: <Users className="h-4 w-4" />,
          onClick: onAddToShortlist,
          variant: "default",
        },
        {
          label: "Message Providers",
          icon: <MessageSquare className="h-4 w-4" />,
          onClick: onMessage,
          variant: "default",
        },
        {
          label: "Export CSV",
          icon: <Download className="h-4 w-4" />,
          onClick: onExport,
          variant: "outline",
        },
      ]}
    />
  );
}

