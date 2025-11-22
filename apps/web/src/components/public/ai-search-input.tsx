"use client";

import { Search, Sparkles, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { publicService } from "@/lib/api";
import { PublicSearchFilters } from "@carelink/types";
import { useState, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import {
  AI_SEARCH_MIN_QUERY_LENGTH,
  isQueryLongEnough,
} from "@/lib/utils/public";

interface AISearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onFiltersApplied?: (filters: Partial<PublicSearchFilters>) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function AISearchInput({
  value,
  onChange,
  onFiltersApplied,
  placeholder = "Search with natural language...",
  disabled = false,
}: AISearchInputProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const debouncedQuery = useDebounce(value, 500);

  const handleAISearch = useCallback(async () => {
    if (!isQueryLongEnough(value)) {
      toast.error(
        `Please enter at least ${AI_SEARCH_MIN_QUERY_LENGTH} characters for AI search`
      );
      return;
    }

    setIsParsing(true);
    setAiExplanation(null);

    try {
      const response = await publicService.parseQuery(value);

      if (response.success && response.data) {
        const { filters, explanation } = response.data;

        if (filters && Object.keys(filters).length > 0) {
          setAiExplanation(explanation || "Filters applied successfully");
          setShowExplanation(true);
          onFiltersApplied?.(filters);
          toast.success("AI search filters applied");
        } else {
          toast.info("No specific filters found in your query");
        }
      } else {
        toast.error(response.message || "Failed to parse query");
      }
    } catch (error) {
      console.error("AI search error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to parse query"
      );
    } finally {
      setIsParsing(false);
    }
  }, [value, onFiltersApplied]);

  const canUseAI = isQueryLongEnough(value);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isParsing}
          className="pl-10 pr-24"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isParsing && (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
          {canUseAI && !isParsing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAISearch}
              className="h-7 px-2"
              title="Use AI to parse your search query"
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </Button>
          )}
        </div>
      </div>

      {aiExplanation && showExplanation && (
        <div className="mt-2 flex items-center gap-2">
          <Popover open={showExplanation} onOpenChange={setShowExplanation}>
            <PopoverTrigger asChild>
              <Badge
                variant="healthcareInfo"
                className="cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                AI Filters Applied
              </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">AI Search Results</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowExplanation(false);
                      setAiExplanation(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {aiExplanation}
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {!canUseAI && value.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          Type at least {AI_SEARCH_MIN_QUERY_LENGTH} characters to use AI search
        </p>
      )}
    </div>
  );
}

