"use client";

import { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { licenseTypeService, licenseCategoryService } from "@/lib/api";
import { LicenseCategory, LicenseType } from "@carelink/types";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LicenseTypeSelectorProps {
  value?: string; // Selected license type ID
  onChange: (licenseTypeId: string) => void;
  disabled?: boolean;
  className?: string;
  error?: string;
  required?: boolean;
  showCategoryFilter?: boolean; // Show category dropdown for filtering
}

/**
 * Reusable license type selector component
 * Fetches license categories and types from the API
 * Provides cascading selection: category -> type
 */
export function LicenseTypeSelector({
  value,
  onChange,
  disabled = false,
  className,
  error,
  required = false,
  showCategoryFilter = true,
}: LicenseTypeSelectorProps) {
  const [categories, setCategories] = useState<LicenseCategory[]>([]);
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories and types on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [categoriesResponse, typesResponse] = await Promise.all([
          licenseCategoryService.getAllCategories(false), // Only active
          licenseTypeService.getAllLicenseTypes(false), // Only active
        ]);

        if (categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data);
        }

        if (typesResponse.success && typesResponse.data) {
          setLicenseTypes(typesResponse.data);
        }
      } catch (error) {
        console.error("Error fetching license data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auto-select category when a license type is selected
  useEffect(() => {
    if (value && licenseTypes.length > 0) {
      const selectedType = licenseTypes.find((t) => t.id === value);
      if (selectedType && selectedType.categoryId !== selectedCategory) {
        setSelectedCategory(selectedType.categoryId);
      }
    }
  }, [value, licenseTypes, selectedCategory]);

  // Filter types by selected category
  const filteredTypes = useMemo(() => {
    if (!selectedCategory) return licenseTypes;
    return licenseTypes.filter((type) => type.categoryId === selectedCategory);
  }, [licenseTypes, selectedCategory]);

  // Get category for a license type
  const getCategoryForType = (typeId: string) => {
    const type = licenseTypes.find((t) => t.id === typeId);
    if (!type) return null;
    return categories.find((c) => c.id === type.categoryId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading license types...</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showCategoryFilter && (
        <div className="space-y-2">
          <Label htmlFor="license-category">
            License Category{required && <span className="text-destructive"> *</span>}
          </Label>
          <Select
            value={selectedCategory}
            onValueChange={(categoryId) => {
              setSelectedCategory(categoryId);
              // Clear license type selection when category changes
              onChange("");
            }}
            disabled={disabled}
          >
            <SelectTrigger
              id="license-category"
              className={cn(error && "border-destructive")}
            >
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="license-type">
          License Type{required && <span className="text-destructive"> *</span>}
        </Label>
        <Select
          value={value || ""}
          onValueChange={onChange}
          disabled={disabled || (showCategoryFilter && !selectedCategory)}
        >
          <SelectTrigger
            id="license-type"
            className={cn(error && "border-destructive")}
          >
            <SelectValue placeholder={
              showCategoryFilter && !selectedCategory
                ? "Select a category first"
                : "Select a license type"
            } />
          </SelectTrigger>
          <SelectContent>
            {filteredTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}

/**
 * Simple license type selector without category filter
 * Useful for forms where category is not needed
 */
export function SimpleLicenseTypeSelector({
  value,
  onChange,
  disabled = false,
  className,
  error,
  required = false,
}: Omit<LicenseTypeSelectorProps, "showCategoryFilter">) {
  return (
    <LicenseTypeSelector
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={className}
      error={error}
      required={required}
      showCategoryFilter={false}
    />
  );
}
