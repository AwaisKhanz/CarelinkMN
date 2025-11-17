"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { Urgency, ReferralStatus } from "@carelink/types";
import { REFERRAL_STATUS_CONFIG } from "@/lib/constants";
import { getUrgencyBadgeConfig } from "@/lib/utils/case-manager";

interface UrgentCasesFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  urgencyFilter: string;
  onUrgencyFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function UrgentCasesFilters({
  searchQuery,
  onSearchChange,
  urgencyFilter,
  onUrgencyFilterChange,
  statusFilter,
  onStatusFilterChange,
}: UrgentCasesFiltersProps) {
  return (
    <Card variant="healthcare">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by referral number, client initials..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Urgency Level
              </Label>
              <Select value={urgencyFilter} onValueChange={onUrgencyFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  <SelectItem value={Urgency.URGENT}>
                    {getUrgencyBadgeConfig(Urgency.URGENT).label}
                  </SelectItem>
                  <SelectItem value={Urgency.HIGH}>
                    {getUrgencyBadgeConfig(Urgency.HIGH).label}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Status</Label>
              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(REFERRAL_STATUS_CONFIG).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

