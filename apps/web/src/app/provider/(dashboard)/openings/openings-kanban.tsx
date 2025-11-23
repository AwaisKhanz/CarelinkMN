"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Opening, OpeningStatus, Payer } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { OPENING_STATUS_CONFIG, PAYER_LABELS } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { calculateHoursUntilExpiry } from "@/lib/utils/provider";

interface OpeningsKanbanProps {
  openings: Opening[];
  onStatusChange: (openingId: string, newStatus: OpeningStatus) => Promise<void>;
  onRefresh: (openingId: string) => Promise<void>;
  onDelete: (openingId: string) => void;
  onView: (openingId: string) => void;
  onEdit: (openingId: string) => void;
  canManageOpenings: boolean;
}

type KanbanColumn = {
  id: OpeningStatus;
  title: string;
  items: Opening[];
};

const COLUMNS: { id: OpeningStatus; title: string }[] = [
  { id: OpeningStatus.OPEN, title: "Open" },
  { id: OpeningStatus.PENDING, title: "Pending" },
  { id: OpeningStatus.FILLED, title: "Filled" },
  { id: OpeningStatus.EXPIRED, title: "Expired" },
];

export function OpeningsKanban({
  openings,
  onStatusChange,
  onRefresh,
  onDelete,
  onView,
  onEdit,
  canManageOpenings,
}: OpeningsKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const columns = useMemo(() => {
    const cols: Record<OpeningStatus, Opening[]> = {
      [OpeningStatus.OPEN]: [],
      [OpeningStatus.PENDING]: [],
      [OpeningStatus.FILLED]: [],
      [OpeningStatus.EXPIRED]: [],
    };

    openings.forEach((opening) => {
      if (cols[opening.status]) {
        cols[opening.status].push(opening);
      }
    });

    return COLUMNS.map((col) => ({
      ...col,
      items: cols[col.id],
    }));
  }, [openings]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the opening and its current status
    const opening = openings.find((o) => o.id === activeId);
    if (!opening) {
      setActiveId(null);
      return;
    }

    // Determine new status based on drop target
    // If dropped on a column container (which has id = status)
    let newStatus: OpeningStatus | null = null;

    if (Object.values(OpeningStatus).includes(overId as OpeningStatus)) {
      newStatus = overId as OpeningStatus;
    } else {
      // If dropped on another item, find that item's status
      const overOpening = openings.find((o) => o.id === overId);
      if (overOpening) {
        newStatus = overOpening.status;
      }
    }

    if (newStatus && newStatus !== opening.status) {
      onStatusChange(opening.id, newStatus);
    }

    setActiveId(null);
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col.id} className="flex h-full w-[350px] min-w-[350px] flex-col rounded-lg bg-muted/50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{col.title}</h3>
              <Badge variant="secondary">{col.items.length}</Badge>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SortableContext
                id={col.id}
                items={col.items.map((o) => o.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-3 min-h-[100px]">
                  {col.items.map((opening) => (
                    <SortableOpeningCard
                      key={opening.id}
                      opening={opening}
                      onRefresh={onRefresh}
                      onDelete={onDelete}
                      onView={onView}
                      onEdit={onEdit}
                      canManageOpenings={canManageOpenings}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          </div>
        ))}
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeId ? (
          <OpeningCard
            opening={openings.find((o) => o.id === activeId)!}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface SortableOpeningCardProps {
  opening: Opening;
  onRefresh: (id: string) => Promise<void>;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  canManageOpenings: boolean;
}

function SortableOpeningCard({ opening, ...props }: SortableOpeningCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: opening.id,
    data: {
      type: "Opening",
      opening,
    },
    disabled: !props.canManageOpenings,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <OpeningCard opening={opening} {...props} />
    </div>
  );
}

interface OpeningCardProps extends Partial<SortableOpeningCardProps> {
  opening: Opening;
  isOverlay?: boolean;
}

function OpeningCard({
  opening,
  onRefresh,
  onDelete,
  onView,
  onEdit,
  canManageOpenings,
  isOverlay,
}: OpeningCardProps) {
  const hoursUntilExpiry = calculateHoursUntilExpiry(opening.freshnessTimestamp);
  const isStale = hoursUntilExpiry < 0;
  const isExpiringSoon = hoursUntilExpiry >= 0 && hoursUntilExpiry <= 12;

  return (
    <Card className={cn("cursor-grab active:cursor-grabbing", isOverlay && "shadow-xl rotate-2")}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h4 className="font-medium text-sm line-clamp-1">
              {opening.home?.name || "Unknown Home"}
            </h4>
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 mr-1" />
              {opening.home?.city}, {opening.home?.state}
            </div>
          </div>
          {canManageOpenings && onView && onEdit && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(opening.id)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(opening.id)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {!opening.isFresh && onRefresh && (
                  <DropdownMenuItem onClick={() => onRefresh(opening.id)}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onDelete(opening.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{opening.spotsAvailable} spots</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {opening.acceptedPayers.slice(0, 2).map((payer) => (
            <Badge key={payer} variant="secondary" className="text-[10px] px-1 h-5">
              {PAYER_LABELS[payer]}
            </Badge>
          ))}
          {opening.acceptedPayers.length > 2 && (
            <Badge variant="outline" className="text-[10px] px-1 h-5">
              +{opening.acceptedPayers.length - 2}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
            {isStale ? (
              <Badge variant="healthcareError" className="text-[10px] px-1 h-5 gap-1">
                <XCircle className="w-3 h-3" />
                Expired
              </Badge>
            ) : isExpiringSoon ? (
              <Badge variant="healthcareWarning" className="text-[10px] px-1 h-5 gap-1">
                <AlertCircle className="w-3 h-3" />
                {hoursUntilExpiry}h left
              </Badge>
            ) : (
              <Badge variant="healthcareSuccess" className="text-[10px] px-1 h-5 gap-1">
                <CheckCircle className="w-3 h-3" />
                Fresh
              </Badge>
            )}
            
            <div className="text-[10px] text-muted-foreground flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {format(new Date(opening.availableFrom), "MMM d")}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
