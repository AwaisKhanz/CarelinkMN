"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";

interface EmployersFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function EmployersFilters({
  searchQuery,
  onSearchChange,
}: EmployersFiltersProps) {
  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search employers by name, industry, or contact..."
          showFilter={false}
        />
      </CardContent>
    </Card>
  );
}

