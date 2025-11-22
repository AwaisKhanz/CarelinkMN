"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ReferralStatus, Urgency, Payer } from "@carelink/types";
import { PAYER_LABELS, PAYER_OPTIONS } from "@/lib/constants";

interface ReferralsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  urgencyFilter: string;
  onUrgencyFilterChange: (value: string) => void;
  payerFilter: string;
  onPayerFilterChange: (value: string) => void;
}

export function ReferralsFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  urgencyFilter,
  onUrgencyFilterChange,
  payerFilter,
  onPayerFilterChange,
}: ReferralsFiltersProps) {
  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search by referral number, client initials, or location..."
          filterValue={statusFilter}
          onFilterChange={onStatusFilterChange}
          filterOptions={[
            { value: "all", label: "All Status" },
            { value: ReferralStatus.NEW, label: "New" },
            { value: ReferralStatus.IN_REVIEW, label: "In Review" },
            { value: ReferralStatus.TOURING, label: "Touring" },
            { value: ReferralStatus.OFFER_MADE, label: "Offer Made" },
            { value: ReferralStatus.PLACED, label: "Placed" },
            { value: ReferralStatus.CLOSED, label: "Closed" },
            { value: ReferralStatus.CANCELLED, label: "Cancelled" },
          ]}
          filterPlaceholder="Filter by status"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Urgency</Label>
            <Select value={urgencyFilter} onValueChange={onUrgencyFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value={Urgency.URGENT}>Urgent</SelectItem>
                <SelectItem value={Urgency.HIGH}>High</SelectItem>
                <SelectItem value={Urgency.ROUTINE}>Routine</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Payer</Label>
            <Select value={payerFilter} onValueChange={onPayerFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Payers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payers</SelectItem>
                {PAYER_OPTIONS.map((payer) => (
                  <SelectItem key={payer.value} value={payer.value}>
                    {payer.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


