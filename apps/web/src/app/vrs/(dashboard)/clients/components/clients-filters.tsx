"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { VRSClientStatus } from "@carelink/types";
import { VRS_CLIENT_STATUS_CONFIG } from "@/lib/constants/vrs";

interface ClientsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function ClientsFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: ClientsFiltersProps) {
  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search clients by name, email, or phone..."
          filterValue={statusFilter}
          onFilterChange={onStatusFilterChange}
          filterOptions={[
            { value: "all", label: "All Statuses" },
            ...Object.entries(VRS_CLIENT_STATUS_CONFIG).map(
              ([value, config]) => ({
                value,
                label: config.label,
              })
            ),
          ]}
          filterPlaceholder="Filter by status"
        />
      </CardContent>
    </Card>
  );
}

