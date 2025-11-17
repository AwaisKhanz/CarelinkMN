"use client";

import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { ReferralStatus } from "@carelink/types";
import { Referral } from "@/lib/api";
import { ReferralKanbanColumn } from "./referral-kanban-column";
import { ReferralKanbanCard } from "./referral-kanban-card";
import { toast } from "sonner";

interface ReferralsKanbanProps {
  referrals: Referral[];
  isLoading: boolean;
  onReferralClick: (referral: Referral) => void;
  onStatusChange?: (referralId: string, newStatus: ReferralStatus) => Promise<void>;
}

const KANBAN_COLUMNS: ReferralStatus[] = [
  ReferralStatus.NEW,
  ReferralStatus.IN_REVIEW,
  ReferralStatus.TOURING,
  ReferralStatus.OFFER_MADE,
  ReferralStatus.PLACED,
  ReferralStatus.CLOSED,
  ReferralStatus.CANCELLED,
];

export function ReferralsKanban({
  referrals,
  isLoading,
  onReferralClick,
  onStatusChange,
}: ReferralsKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const referralsByStatus = useMemo(() => {
    const grouped: Record<ReferralStatus, Referral[]> = {
      [ReferralStatus.NEW]: [],
      [ReferralStatus.IN_REVIEW]: [],
      [ReferralStatus.TOURING]: [],
      [ReferralStatus.OFFER_MADE]: [],
      [ReferralStatus.PLACED]: [],
      [ReferralStatus.CLOSED]: [],
      [ReferralStatus.CANCELLED]: [],
    };

    referrals.forEach((referral) => {
      grouped[referral.status].push(referral);
    });

    return grouped;
  }, [referrals]);

  const activeReferral = useMemo(() => {
    return referrals.find((r) => r.id === activeId);
  }, [activeId, referrals]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const referralId = active.id as string;
    const newStatus = over.id as ReferralStatus;

    // Find the referral
    const referral = referrals.find((r) => r.id === referralId);
    if (!referral || referral.status === newStatus) {
      return;
    }

    if (onStatusChange) {
      try {
        await onStatusChange(referralId, newStatus);
        toast.success("Referral status updated");
      } catch (error) {
        console.error("Failed to update referral status:", error);
        toast.error("Failed to update referral status");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading referrals...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {KANBAN_COLUMNS.map((status) => {
          return (
            <ReferralKanbanColumn
              key={status}
              status={status}
              referrals={referralsByStatus[status]}
              onReferralClick={onReferralClick}
            />
          );
        })}
      </div>
      <DragOverlay>
        {activeReferral ? (
          <div className="opacity-90">
            <ReferralKanbanCard
              referral={activeReferral}
              onClick={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}


