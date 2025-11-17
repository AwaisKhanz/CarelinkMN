"use client";

import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Service } from "@carelink/types";
import { cn } from "@/lib/utils";

interface ServiceSelectorProps {
  services: Service[];
  selectedServiceIds: string[];
  onToggle: (serviceId: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showCategories?: boolean;
  maxSelected?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Reusable service selector component
 * Provides consistent service selection UI with search and categorization
 */
export function ServiceSelector({
  services,
  selectedServiceIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
  searchPlaceholder = "Search services...",
  showSearch = true,
  showCategories = true,
  maxSelected,
  disabled = false,
  className,
}: ServiceSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredServices = useMemo(() => {
    if (!searchTerm.trim()) return services;
    const query = searchTerm.toLowerCase();
    return services.filter(
      (service) =>
        service.name.toLowerCase().includes(query) ||
        (service.description || "").toLowerCase().includes(query) ||
        service.category.toLowerCase().includes(query)
    );
  }, [services, searchTerm]);

  const categories = useMemo(() => {
    const cats = [...new Set(filteredServices.map((s) => s.category))];
    return cats.sort();
  }, [filteredServices]);

  const isSelected = (serviceId: string) => {
    return selectedServiceIds.includes(serviceId);
  };

  const canSelectMore = maxSelected === undefined || selectedServiceIds.length < maxSelected;

  return (
    <div className={cn("space-y-4", className)}>
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            disabled={disabled}
          />
        </div>
      )}

      {(onSelectAll || onDeselectAll) && filteredServices.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={filteredServices.length > 0 && filteredServices.every((service) => isSelected(service.id))}
            onCheckedChange={(checked) => {
              if (checked && onSelectAll) {
                onSelectAll();
              } else if (!checked && onDeselectAll) {
                onDeselectAll();
              }
            }}
            disabled={disabled}
          />
          <span className="text-sm font-medium">Select All</span>
        </div>
      )}

      {showCategories ? (
        categories.map((category) => {
          const categoryServices = filteredServices.filter((s) => s.category === category);
          if (categoryServices.length === 0) return null;

          return (
            <Card key={category} variant="healthcare">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{category}</span>
                  <Badge variant="outline">
                    {categoryServices.filter((s) => isSelected(s.id)).length} / {categoryServices.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryServices.map((service) => {
                    const selected = isSelected(service.id);
                    const canSelect = !selected && (canSelectMore || disabled);

                    return (
                      <div
                        key={service.id}
                        className={cn(
                          "flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50",
                          disabled && !selected && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => !disabled && onToggle(service.id)}
                      >
                        <Checkbox
                          id={service.id}
                          checked={selected}
                          onCheckedChange={() => !disabled && onToggle(service.id)}
                          disabled={disabled || !canSelect}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={service.id}
                              className="font-medium cursor-pointer"
                            >
                              {service.name}
                            </Label>
                            {service.description && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p className="text-sm">{service.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {service.description}
                            </p>
                          )}
                          {service.licenseTypes && service.licenseTypes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {service.licenseTypes.map((licenseType) => (
                                <Badge key={licenseType} variant="outline" className="text-xs">
                                  {licenseType}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.map((service) => {
            const selected = isSelected(service.id);
            const canSelect = !selected && (canSelectMore || disabled);

            return (
              <div
                key={service.id}
                className={cn(
                  "flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50",
                  disabled && !selected && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !disabled && onToggle(service.id)}
              >
                <Checkbox
                  id={service.id}
                  checked={selected}
                  onCheckedChange={() => !disabled && onToggle(service.id)}
                  disabled={disabled || !canSelect}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <Label htmlFor={service.id} className="font-medium cursor-pointer">
                    {service.name}
                  </Label>
                  {service.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
