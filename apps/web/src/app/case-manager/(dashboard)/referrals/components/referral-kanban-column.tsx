"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { ReferralStatus } from "@carelink/types";
import { Referral } from "@/lib/api";
import { getReferralStatusBadgeConfig } from "@/lib/utils/case-manager";
import { ReferralKanbanCard } from "./referral-kanban-card";

interface ReferralKanbanColumnProps {
  status: ReferralStatus;
  referrals: Referral[];
  onReferralClick: (referral: Referral) => void;
}

function SortableReferralCard({
  referral,
  onClick,
}: {
  referral: Referral;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: referral.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ReferralKanbanCard referral={referral} onClick={onClick} />
    </div>
  );
}

export function ReferralKanbanColumn({
  status,
  referrals,
  onReferralClick,
}: ReferralKanbanColumnProps) {
  const config = getReferralStatusBadgeConfig(status);
  const { setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      <div className="mb-4">
        <h3 className="font-semibold text-lg">{config.label}</h3>
        <Badge variant="outline" className="mt-1">
          {referrals.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 bg-muted/30 rounded-lg p-4 space-y-3 overflow-y-auto min-h-[400px]"
      >
        <SortableContext
          items={referrals.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {referrals.map((referral) => (
            <SortableReferralCard
              key={referral.id}
              referral={referral}
              onClick={() => onReferralClick(referral)}
            />
          ))}
        </SortableContext>
        {referrals.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            No referrals
          </div>
        )}
      </div>
    </div>
  );
}


