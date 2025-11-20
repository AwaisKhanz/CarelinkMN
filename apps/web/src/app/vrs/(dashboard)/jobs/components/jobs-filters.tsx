"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { VRS_JOB_STATUS_CONFIG } from "@/lib/constants/vrs";

interface JobsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function JobsFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: JobsFiltersProps) {
  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search jobs by title or description..."
          filterValue={statusFilter}
          onFilterChange={onStatusFilterChange}
          filterOptions={[
            { value: "all", label: "All Statuses" },
            ...Object.entries(VRS_JOB_STATUS_CONFIG).map(
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

