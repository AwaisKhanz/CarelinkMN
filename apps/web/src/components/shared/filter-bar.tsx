"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterField {
  key: string;
  label: string;
  type: "select" | "text" | "date" | "dateRange";
  options?: FilterOption[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterField[];
  onClear?: () => void;
  showClearButton?: boolean;
  className?: string;
  compact?: boolean;
}

/**
 * Reusable filter bar component
 * Provides consistent filter UI across all list pages with search and filter options
 */
export function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  onClear,
  showClearButton = true,
  className,
  compact = false,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasFilters = filters.length > 0;
  const hasActiveFilters = filters.some(
    (filter) => filter.value && filter.value !== "all"
  );
  const hasSearchQuery = searchQuery.trim().length > 0;
  const canClear = hasActiveFilters || hasSearchQuery;

  const handleClear = () => {
    onSearchChange("");
    filters.forEach((filter) => {
      if (filter.value !== "all") {
        filter.onChange("all");
      }
    });
    if (onClear) {
      onClear();
    }
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                {filters.filter((f) => f.value && f.value !== "all").length}
              </span>
            )}
          </Button>
        )}
        {canClear && showClearButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card variant="healthcare" className={className}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          {hasFilters && (
            <>
              {(isExpanded || !compact) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filters.map((filter) => (
                    <div key={filter.key}>
                      <Label htmlFor={filter.key} className="text-sm">
                        {filter.label}
                      </Label>
                      {filter.type === "select" ? (
                        <Select
                          value={filter.value}
                          onValueChange={filter.onChange}
                        >
                          <SelectTrigger id={filter.key} className="mt-1">
                            <SelectValue placeholder={filter.placeholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {filter.options?.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : filter.type === "text" ? (
                        <Input
                          id={filter.key}
                          placeholder={filter.placeholder}
                          value={filter.value}
                          onChange={(e) => filter.onChange(e.target.value)}
                          className="mt-1"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              {compact && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {isExpanded ? "Hide" : "Show"} Filters
                  {hasActiveFilters && (
                    <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                      {filters.filter((f) => f.value && f.value !== "all").length}
                    </span>
                  )}
                </Button>
              )}
            </>
          )}

          {/* Clear Button */}
          {canClear && showClearButton && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleClear} className="gap-2">
                <X className="h-4 w-4" />
                Clear All
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

