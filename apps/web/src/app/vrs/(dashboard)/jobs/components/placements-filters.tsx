"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { RETENTION_STATUS_CONFIG } from "@/lib/constants/vrs";

interface PlacementsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function PlacementsFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: PlacementsFiltersProps) {
  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search placements..."
          filterValue={statusFilter}
          onFilterChange={onStatusFilterChange}
          filterOptions={[
            { value: "all", label: "All Statuses" },
            ...Object.entries(RETENTION_STATUS_CONFIG).map(
              ([value, config]) => ({
                value,
                label: config.label,
              })
            ),
          ]}
          filterPlaceholder="Filter by retention status"
        />
      </CardContent>
    </Card>
  );
}

