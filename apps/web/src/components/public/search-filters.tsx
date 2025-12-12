"use client";

import { Filter, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PublicSearchFilters } from "@carelink/types";
import {
  LOCATION_TYPE_OPTIONS,
  RADIUS_OPTIONS,
  AVAILABILITY_FILTER_OPTIONS,
  LocationType,
  AvailabilityFilter,
} from "@/lib/constants/public";
import {
  MINNESOTA_COUNTIES,
  PAYER_OPTIONS,
} from "@/lib/constants";
import { useState, useEffect } from "react";
import { licenseTypeService } from "@/lib/api";
import { LicenseType } from "@carelink/types";

interface SearchFiltersProps {
  filters: PublicSearchFilters;
  onFiltersChange: (filters: PublicSearchFilters) => void;
  onClear: () => void;
}

export function SearchFilters({
  filters,
  onFiltersChange,
  onClear,
}: SearchFiltersProps) {
  const [locationType, setLocationType] = useState<LocationType>(
    filters.location?.type || LOCATION_TYPE_OPTIONS[0].value
  );
  const [locationValue, setLocationValue] = useState(
    filters.location?.value || ""
  );
  const [radius, setRadius] = useState<number | undefined>(
    filters.location?.radius
  );
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([]);

  // Fetch license types on mount
  useEffect(() => {
    const fetchLicenseTypes = async () => {
      try {
        const response = await licenseTypeService.getAllLicenseTypes(false);
        if (response.success && response.data) {
          setLicenseTypes(response.data);
        }
      } catch (error) {
        console.error("Error fetching license types:", error);
      }
    };
    fetchLicenseTypes();
  }, []);

  const updateLocation = (
    type?: LocationType,
    value?: string,
    radiusValue?: number
  ) => {
    const newType = type ?? locationType;
    const newValue = value ?? locationValue;
    const newRadius = radiusValue ?? radius;

    if (newValue) {
      onFiltersChange({
        ...filters,
        location: {
          type: newType,
          value: newValue,
          radius: newRadius,
        },
      });
    } else {
      const { location, ...rest } = filters;
      onFiltersChange(rest);
    }
  };

  const handleLocationTypeChange = (type: LocationType) => {
    setLocationType(type);
    setLocationValue("");
    updateLocation(type, "", radius);
  };

  const handleLocationValueChange = (value: string) => {
    setLocationValue(value);
    updateLocation(locationType, value, radius);
  };

  const handleRadiusChange = (value: string) => {
    const radiusNum = value ? parseInt(value, 10) : undefined;
    setRadius(radiusNum);
    updateLocation(locationType, locationValue, radiusNum);
  };

  const hasActiveFilters =
    filters.search ||
    filters.location ||
    (filters.licenseTypes && filters.licenseTypes.length > 0) ||
    (filters.serviceTypes && filters.serviceTypes.length > 0) ||
    (filters.payers && filters.payers.length > 0) ||
    filters.accessibility ||
    filters.availability === AVAILABILITY_FILTER_OPTIONS[1].value ||
    filters.verified !== undefined;

  return (
    <Card variant="healthcare">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <CardTitle>Filters</CardTitle>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <CardDescription>Refine your search results</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Filter */}
        <div className="space-y-3">
          <Label>Location</Label>
          <Select value={locationType} onValueChange={handleLocationTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCATION_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {locationType === "county" && (
            <Select
              value={locationValue}
              onValueChange={handleLocationValueChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select county" />
              </SelectTrigger>
              <SelectContent>
                {MINNESOTA_COUNTIES.map((county) => (
                  <SelectItem key={county} value={county}>
                    {county}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {locationType === "city" && (
            <Input
              placeholder="Enter city name"
              value={locationValue}
              onChange={(e) => handleLocationValueChange(e.target.value)}
            />
          )}

          {locationType === "zip" && (
            <Input
              placeholder="Enter ZIP code"
              value={locationValue}
              onChange={(e) => handleLocationValueChange(e.target.value)}
              maxLength={5}
            />
          )}

          {locationValue && (
            <div className="space-y-2">
              <Label>Search Radius (miles)</Label>
              <Select
                value={radius?.toString() || ""}
                onValueChange={handleRadiusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select radius" />
                </SelectTrigger>
                <SelectContent>
                  {RADIUS_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* License Types Filter */}
        <div className="space-y-3">
          <Label>License Types</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {licenseTypes.map((license) => (
              <div key={license.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`license-${license.id}`}
                  checked={
                    filters.licenseTypes?.includes(license.id) || false
                  }
                  onCheckedChange={(checked) => {
                    const current = filters.licenseTypes || [];
                    const updated = checked
                      ? [...current, license.id]
                      : current.filter((l) => l !== license.id);
                    onFiltersChange({
                      ...filters,
                      licenseTypes: updated.length > 0 ? updated : undefined,
                    });
                  }}
                />
                <Label
                  htmlFor={`license-${license.id}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {license.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Payer Filter */}
        <div className="space-y-3">
          <Label>Accepted Payers</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {PAYER_OPTIONS.map((payer) => (
              <div key={payer.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`payer-${payer.value}`}
                  checked={filters.payers?.includes(payer.value) || false}
                  onCheckedChange={(checked) => {
                    const current = filters.payers || [];
                    const updated = checked
                      ? [...current, payer.value]
                      : current.filter((p) => p !== payer.value);
                    onFiltersChange({
                      ...filters,
                      payers: updated.length > 0 ? updated : undefined,
                    });
                  }}
                />
                <Label
                  htmlFor={`payer-${payer.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {payer.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Availability Filter */}
        <div className="space-y-3">
          <Label>Availability</Label>
          <Select
            value={filters.availability || AVAILABILITY_FILTER_OPTIONS[0].value}
            onValueChange={(value) => {
              onFiltersChange({
                ...filters,
                availability:
                  value === AVAILABILITY_FILTER_OPTIONS[0].value
                    ? undefined
                    : (value as AvailabilityFilter),
              });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABILITY_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Accessibility Features */}
        <div className="space-y-3">
          <Label>Accessibility Features</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wheelchair-accessible"
                checked={filters.accessibility?.wheelchairAccessible || false}
                onCheckedChange={(checked) => {
                  onFiltersChange({
                    ...filters,
                    accessibility: {
                      ...filters.accessibility,
                      wheelchairAccessible: checked ? true : undefined,
                    },
                  });
                }}
              />
              <Label
                htmlFor="wheelchair-accessible"
                className="text-sm font-normal cursor-pointer"
              >
                Wheelchair Accessible
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="single-level"
                checked={filters.accessibility?.singleLevel || false}
                onCheckedChange={(checked) => {
                  onFiltersChange({
                    ...filters,
                    accessibility: {
                      ...filters.accessibility,
                      singleLevel: checked ? true : undefined,
                    },
                  });
                }}
              />
              <Label
                htmlFor="single-level"
                className="text-sm font-normal cursor-pointer"
              >
                Single Level
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-elevator"
                checked={filters.accessibility?.hasElevator || false}
                onCheckedChange={(checked) => {
                  onFiltersChange({
                    ...filters,
                    accessibility: {
                      ...filters.accessibility,
                      hasElevator: checked ? true : undefined,
                    },
                  });
                }}
              />
              <Label
                htmlFor="has-elevator"
                className="text-sm font-normal cursor-pointer"
              >
                Has Elevator
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-roll-in-shower"
                checked={filters.accessibility?.hasRollInShower || false}
                onCheckedChange={(checked) => {
                  onFiltersChange({
                    ...filters,
                    accessibility: {
                      ...filters.accessibility,
                      hasRollInShower: checked ? true : undefined,
                    },
                  });
                }}
              />
              <Label
                htmlFor="has-roll-in-shower"
                className="text-sm font-normal cursor-pointer"
              >
                Roll-in Shower
              </Label>
            </div>
          </div>
        </div>

        {/* Verified Filter */}
        <div className="space-y-3">
          <Label>Provider Status</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="verified-only"
              checked={filters.verified === true}
              onCheckedChange={(checked) => {
                onFiltersChange({
                  ...filters,
                  verified: checked ? true : undefined,
                });
              }}
            />
            <Label
              htmlFor="verified-only"
              className="text-sm font-normal cursor-pointer"
            >
              Verified Providers Only
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
