"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Referral, ReferralShortlist } from "@/lib/api";

interface QuickActionsCardProps {
  referral: Referral;
  shortlistCount: number;
  onBatchMessage: () => void;
  onCreatePlacement: () => void;
  canManageShortlist?: boolean;
  canBatchMessage?: boolean;
}

export function QuickActionsCard({ 
  referral, 
  shortlistCount, 
  onBatchMessage,
  onCreatePlacement,
  canManageShortlist = true,
  canBatchMessage = true,
}: QuickActionsCardProps) {
  const router = useRouter();

  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {canManageShortlist && (
          <Button
            variant="healthcare"
            className="w-full justify-start"
            onClick={() => router.push(`/case-manager/search?referralId=${referral.id}`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Providers to Shortlist
          </Button>
        )}
        {canBatchMessage && (
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={onBatchMessage}
            disabled={shortlistCount === 0}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Batch Message Providers
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onCreatePlacement}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Create Placement
        </Button>
      </CardContent>
    </Card>
  );
}
