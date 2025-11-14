"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Users,
  Calendar,
  RefreshCw,
  Eye,
  Edit,
} from "lucide-react";
import { Opening, OpeningStatus, Payer } from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PAYER_LABELS } from "@/lib/api/services/opening.service";

interface KanbanBoardProps {
  openings: Opening[];
  onStatusChange: (openingId: string, newStatus: OpeningStatus) => Promise<void>;
  onRefresh: (openingId: string) => Promise<void>;
  onView: (openingId: string) => void;
  onEdit: (openingId: string) => void;
}

interface KanbanColumnProps {
  id: OpeningStatus;
  title: string;
  openings: Opening[];
  onRefresh: (openingId: string) => Promise<void>;
  onView: (openingId: string) => void;
  onEdit: (openingId: string) => void;
}

interface KanbanCardProps {
  opening: Opening;
  onRefresh: (openingId: string) => Promise<void>;
  onView: (openingId: string) => void;
  onEdit: (openingId: string) => void;
}

const STATUS_CONFIG: Record<
  OpeningStatus,
  { label: string; variant: "default" | "healthcareSuccess" | "healthcareWarning" | "healthcareError" | "healthcareInfo" | "secondary" }
> = {
  [OpeningStatus.OPEN]: {
    label: "Open",
    variant: "healthcareSuccess",
  },
  [OpeningStatus.PENDING]: {
    label: "Pending",
    variant: "healthcareWarning",
  },
  [OpeningStatus.FILLED]: {
    label: "Filled",
    variant: "healthcareInfo",
  },
  [OpeningStatus.EXPIRED]: {
    label: "Expired",
    variant: "secondary",
  },
};

function KanbanCard({ opening, onRefresh, onView, onEdit }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opening.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getHoursUntilExpiry = (freshnessTimestamp: string) => {
    const now = new Date();
    const expiry = new Date(
      new Date(freshnessTimestamp).getTime() + 48 * 60 * 60 * 1000
    );
    const hours = Math.floor(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60)
    );
    return hours;
  };

  const hoursUntilExpiry = getHoursUntilExpiry(opening.freshnessTimestamp);
  const isStale = hoursUntilExpiry < 0;
  const isExpiringSoon = hoursUntilExpiry >= 0 && hoursUntilExpiry <= 12;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-background border border-border rounded-lg p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow",
        isDragging && "shadow-lg"
      )}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">
              {opening.home?.name || "Unknown Home"}
            </h4>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {opening.home?.city}, {opening.home?.state}
            </p>
          </div>
          <Badge variant={STATUS_CONFIG[opening.status].variant} className="text-xs whitespace-nowrap">
            {STATUS_CONFIG[opening.status].label}
          </Badge>
        </div>

        {/* Freshness Warning */}
        {(isStale || isExpiringSoon) && (
          <div
            className={cn(
              "flex items-center gap-2 p-2 rounded text-xs",
              isStale
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-warning/10 text-warning border border-warning/20"
            )}
          >
            <AlertCircle className="h-3 w-3" />
            <span>
              {isStale
                ? "Expired - Refresh to update"
                : `Expires in ${hoursUntilExpiry}h`}
            </span>
          </div>
        )}

        {/* Spots Available */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{opening.spotsAvailable}</span>
          <span className="text-muted-foreground">spots available</span>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {format(new Date(opening.availableFrom), "MMM d, yyyy")}
          </span>
        </div>

        {/* Payers */}
        {opening.acceptedPayers.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {opening.acceptedPayers.slice(0, 2).map((payer) => (
              <Badge
                key={payer}
                variant="outline"
                className="text-xs px-1.5 py-0"
              >
                {PAYER_LABELS[payer as Payer] || payer}
              </Badge>
            ))}
            {opening.acceptedPayers.length > 2 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                +{opening.acceptedPayers.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onView(opening.id);
            }}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(opening.id);
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
          {isStale && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onRefresh(opening.id);
              }}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  id,
  title,
  openings,
  onRefresh,
  onView,
  onEdit,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col h-full min-h-[600px]">
      <div className="mb-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <Badge variant="outline" className="mt-1">
          {openings.length}
        </Badge>
      </div>
      <div className="flex-1 bg-muted/30 rounded-lg p-4 space-y-3 overflow-y-auto">
        <SortableContext
          items={openings.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          {openings.map((opening) => (
            <KanbanCard
              key={opening.id}
              opening={opening}
              onRefresh={onRefresh}
              onView={onView}
              onEdit={onEdit}
            />
          ))}
        </SortableContext>
        {openings.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            No openings
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({
  openings,
  onStatusChange,
  onRefresh,
  onView,
  onEdit,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const openingsByStatus = useMemo(() => {
    const grouped: Record<OpeningStatus, Opening[]> = {
      [OpeningStatus.OPEN]: [],
      [OpeningStatus.PENDING]: [],
      [OpeningStatus.FILLED]: [],
      [OpeningStatus.EXPIRED]: [],
    };

    openings.forEach((opening) => {
      grouped[opening.status].push(opening);
    });

    return grouped;
  }, [openings]);

  const activeOpening = useMemo(() => {
    return openings.find((o) => o.id === activeId);
  }, [activeId, openings]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const openingId = active.id as string;
    const newStatus = over.id as OpeningStatus;

    // Find the opening
    const opening = openings.find((o) => o.id === openingId);
    if (!opening || opening.status === newStatus) {
      return;
    }

    try {
      await onStatusChange(openingId, newStatus);
    } catch (error) {
      console.error("Failed to update opening status:", error);
    }
  };

  const columns: Array<{ id: OpeningStatus; title: string }> = [
    { id: OpeningStatus.OPEN, title: "Open" },
    { id: OpeningStatus.PENDING, title: "Pending" },
    { id: OpeningStatus.FILLED, title: "Filled" },
    { id: OpeningStatus.EXPIRED, title: "Expired" },
  ];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            openings={openingsByStatus[column.id]}
            onRefresh={onRefresh}
            onView={onView}
            onEdit={onEdit}
          />
        ))}
      </div>
      <DragOverlay>
        {activeOpening ? (
          <div className="opacity-90">
            <KanbanCard
              opening={activeOpening}
              onRefresh={onRefresh}
              onView={onView}
              onEdit={onEdit}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

