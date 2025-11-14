"use client";

import { useState, useEffect } from "react";
import { Search, Building, MapPin, Users, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { OrganizationType } from "@carelink/types";
import { organizationService, Organization } from "@/lib/api";


interface OrganizationSearchProps {
  onSelect: (organization: Organization | null) => void;
  selectedOrganization?: Organization | null;
  organizationType: OrganizationType;
  error?: string;
}

export function OrganizationSearch({
  onSelect,
  selectedOrganization,
  organizationType,
  error,
}: OrganizationSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Search organizations
  const searchOrganizations = async (query: string) => {
    if (!query.trim()) {
      setOrganizations([]);
      return;
    }

    setIsLoading(true);
    setSearchError(null);

    try {
      const organizations = await organizationService.searchOrganizations({
        query,
        type: organizationType,
        limit: 10,
      });
      setOrganizations(organizations);
    } catch (err) {
      console.error("Search organizations error:", err);
      setSearchError(err instanceof Error ? err.message : "Network error occurred while searching");
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchOrganizations(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, organizationType]);

  const handleSelect = (organization: Organization) => {
    onSelect(organization);
    setSearchQuery(organization.name);
    setOrganizations([]);
  };

  const handleClear = () => {
    onSelect(null);
    setSearchQuery("");
    setOrganizations([]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="organizationSearch">Search for Organization</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="organizationSearch"
            placeholder={`Search for ${organizationType.toLowerCase()} organizations...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {selectedOrganization && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              ×
            </Button>
          )}
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Selected Organization */}
      {selectedOrganization && (
        <Card className="border-success/20 bg-success/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-success" />
                <CardTitle className="text-sm">Selected Organization</CardTitle>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedOrganization.name}</span>
                <Badge variant="outline" className="text-xs">
                  {selectedOrganization.type.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{selectedOrganization.city}, {selectedOrganization.state}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{selectedOrganization.users} members</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchQuery && !selectedOrganization && (
        <div className="space-y-2">
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Searching...</span>
            </div>
          )}

          {searchError && (
            <Alert variant="destructive">
              <AlertDescription>{searchError}</AlertDescription>
            </Alert>
          )}

          {!isLoading && !searchError && organizations.length === 0 && searchQuery && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                No organizations found matching "{searchQuery}"
              </p>
            </div>
          )}

          {!isLoading && !searchError && organizations.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {organizations.map((org) => (
                <Card
                  key={org.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSelect(org)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{org.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {org.type.replace("_", " ")}
                          </Badge>
                        </div>
                        <Badge
                          variant={org.status === "ACTIVE" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {org.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{org.city}, {org.state}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{org.users} members</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="text-sm text-muted-foreground">
        <p>
          Search for an existing {organizationType.toLowerCase()} organization to join.
          If you don't see your organization, contact your administrator to add it to the system.
        </p>
      </div>
    </div>
  );
}
