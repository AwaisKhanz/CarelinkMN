"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonProps } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  label: string;
  value: string;
}

export interface MultiSelectProps
  extends Omit<ButtonProps, "value" | "onChange" | "variant"> {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxCount?: number;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "healthcare";
  /**
   * Number of badges to display before switching to "+n more".
   * Set to Infinity to show all badges.
   */
  badgeDisplayLimit?: number;
  /**
   * Optional name attribute for form submissions.
   */
  name?: string;
  /**
   * Helper text displayed below the input.
   */
  helperText?: string;
  /**
   * Error message – when provided the component renders in error state.
   */
  error?: string;
}

export const MultiSelect = React.forwardRef<
  HTMLButtonElement,
  MultiSelectProps
>(
  (
    {
      options,
      selected,
      onChange,
      placeholder = "Select items...",
      searchPlaceholder = "Search...",
      emptyMessage = "No results found.",
      maxCount,
      disabled = false,
      className,
      variant = "default",
      badgeDisplayLimit = 4,
      name,
      helperText,
      error,
      onBlur,
      ...buttonProps
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const triggerRef = React.useRef<HTMLButtonElement | null>(null);
    const [popoverWidth, setPopoverWidth] = React.useState<number | undefined>(
      undefined
    );

    // Filter options based on search query
    const filteredOptions = React.useMemo(() => {
      if (!searchQuery.trim()) return options;
      const query = searchQuery.toLowerCase();
      return options.filter((option) =>
        option.label.toLowerCase().includes(query)
      );
    }, [options, searchQuery]);

    // Get selected options for display
    const selectedOptions = React.useMemo(() => {
      return options.filter((option) => selected.includes(option.value));
    }, [options, selected]);

    // Handle toggle selection
    const handleToggle = (value: string) => {
      if (disabled) return;

      if (selected.includes(value)) {
        onChange(selected.filter((item) => item !== value));
      } else {
        if (maxCount && selected.length >= maxCount) {
          return;
        }
        onChange([...selected, value]);
      }
    };

    // Handle select all (visible items)
    const handleSelectAll = () => {
      if (disabled) return;
      const visibleValues = filteredOptions.map((opt) => opt.value);
      const newSelected = [...new Set([...selected, ...visibleValues])];
      onChange(maxCount ? newSelected.slice(0, maxCount) : newSelected);
    };

    // Handle deselect all (visible items)
    const handleDeselectAll = () => {
      if (disabled) return;
      const visibleValues = filteredOptions.map((opt) => opt.value);
      onChange(selected.filter((val) => !visibleValues.includes(val)));
    };

    const allVisibleSelected =
      filteredOptions.length > 0 &&
      filteredOptions.every((opt) => selected.includes(opt.value));

    const someVisibleSelected = filteredOptions.some((opt) =>
      selected.includes(opt.value)
    );

    // Handle remove badge
    const handleRemove = (
      value: string,
      e?: React.MouseEvent | React.KeyboardEvent
    ) => {
      e?.stopPropagation();
      onChange(selected.filter((item) => item !== value));
    };

    const displayLimit =
      badgeDisplayLimit === Infinity
        ? selectedOptions.length
        : badgeDisplayLimit;
    const visibleBadges = selectedOptions.slice(0, displayLimit);
    const hiddenCount =
      selectedOptions.length > displayLimit
        ? selectedOptions.length - displayLimit
        : 0;

    // Update popover width to match trigger button
    React.useEffect(() => {
      if (open && triggerRef.current) {
        const width = triggerRef.current.offsetWidth;
        setPopoverWidth(width);
      }
    }, [open]);

    return (
      <div className="space-y-1.5 !w-full">
        {name && <input type="hidden" name={name} value={selected.join(",")} />}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={(node) => {
                // Store in our ref for width measurement
                triggerRef.current = node;
                // Also forward to parent ref if provided
                if (typeof ref === "function") {
                  ref(node);
                } else if (ref) {
                  (
                    ref as React.MutableRefObject<HTMLButtonElement | null>
                  ).current = node;
                }
              }}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                "w-full justify-between min-h-11 h-auto rounded-lg border bg-background text-left font-normal",
                "focus-visible:ring-2 focus-visible:ring-primary/30",
                error && "border-destructive focus-visible:ring-destructive/40",
                disabled && "cursor-not-allowed opacity-50",
                className
              )}
              onBlur={onBlur}
              {...buttonProps}
            >
              <div className="flex flex-wrap gap-1 flex-1">
                {selectedOptions.length === 0 ? (
                  <span className="text-muted-foreground">{placeholder}</span>
                ) : (
                  <>
                    {visibleBadges.map((option) => (
                      <Badge
                        key={option.value}
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                      >
                        <span>{option.label}</span>
                        <button
                          type="button"
                          className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleRemove(option.value, e);
                            }
                          }}
                          onClick={(e) => handleRemove(option.value, e)}
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </Badge>
                    ))}
                    {hiddenCount > 0 && (
                      <Badge variant="secondary" className="px-2 py-1 text-xs">
                        +{hiddenCount} more
                      </Badge>
                    )}
                  </>
                )}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0"
            style={popoverWidth ? { width: `${popoverWidth}px` } : undefined}
            align="start"
            variant={variant === "healthcare" ? "healthcare" : "default"}
          >
            <Command variant={variant} className="rounded-lg border shadow-md">
              <CommandInput
                placeholder={searchPlaceholder}
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                {filteredOptions.length > 0 && (
                  <CommandGroup>
                    <div className="px-2 py-1.5 border-b border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          {filteredOptions.length} option
                          {filteredOptions.length !== 1 ? "s" : ""}
                        </span>
                        <div className="flex items-center gap-2">
                          {someVisibleSelected && (
                            <button
                              type="button"
                              onClick={handleDeselectAll}
                              className="text-xs text-primary hover:underline"
                            >
                              Deselect all
                            </button>
                          )}
                          {!allVisibleSelected && (
                            <button
                              type="button"
                              onClick={handleSelectAll}
                              className="text-xs text-primary hover:underline"
                            >
                              Select all
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {filteredOptions.map((option) => {
                      const isSelected = selected.includes(option.value);
                      return (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={() => handleToggle(option.value)}
                          variant={variant}
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )}
                          >
                            <Check className="h-4 w-4" />
                          </div>
                          <span>{option.label}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {(helperText || error) && (
          <p
            className={cn(
              "text-xs",
              error ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

MultiSelect.displayName = "MultiSelect";
