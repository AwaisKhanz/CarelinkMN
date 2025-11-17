"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReferralShortlist } from "@/lib/api";
import { ShortlistItem } from "./shortlist-item";
import { ShortlistStatus } from "@carelink/types";

interface ShortlistTabProps {
  referralId: string;
  shortlist: ReferralShortlist[];
  isLoading: boolean;
  onUpdateStatus: (shortlistId: string, status: ShortlistStatus) => void;
  onRemove: (shortlistId: string) => void;
}

export function ShortlistTab({
  referralId,
  shortlist,
  isLoading,
  onUpdateStatus,
  onRemove,
}: ShortlistTabProps) {
  const router = useRouter();

  const handleMessage = (providerId: string) => {
    router.push(`/case-manager/messages?referralId=${referralId}&providerId=${providerId}`);
  };

  return (
    <Card variant="healthcare">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Shortlisted Providers</CardTitle>
            <CardDescription>
              {shortlist.length} provider{shortlist.length !== 1 ? "s" : ""} in shortlist
            </CardDescription>
          </div>
          <Button
            variant="healthcare"
            onClick={() => router.push(`/case-manager/search?referralId=${referralId}`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Providers
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={`skeleton-${index}`} className="h-20 w-full" />
            ))}
          </div>
        ) : shortlist.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">
              No providers in shortlist yet
            </p>
            <Button
              variant="healthcare"
              onClick={() => router.push(`/case-manager/search?referralId=${referralId}`)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Providers to Shortlist
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {shortlist.map((item) => (
              <ShortlistItem
                key={item.id}
                item={item}
                referralId={referralId}
                onUpdateStatus={onUpdateStatus}
                onRemove={onRemove}
                onMessage={handleMessage}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


