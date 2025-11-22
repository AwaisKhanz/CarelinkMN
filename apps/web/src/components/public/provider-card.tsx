"use client";

import { MapPin, Star, Clock, Heart } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProviderPublicProfile } from "@carelink/types";
import {
  formatDistance,
  formatRating,
  formatAvailability,
} from "@/lib/utils/public";
import { getProviderBadges } from "@/lib/utils/public";
import { VIEW_MODES, ViewMode } from "@/lib/constants/public";
import { FavoriteButton } from "./favorite-button";
import Link from "next/link";

interface ProviderCardProps {
  provider: ProviderPublicProfile;
  isFavorite?: boolean;
  onFavoriteToggle?: (providerId: string, isFavorite: boolean) => void;
  viewMode?: ViewMode;
}

export function ProviderCard({
  provider,
  isFavorite = false,
  onFavoriteToggle,
  viewMode = VIEW_MODES.GRID,
}: ProviderCardProps) {
  const badges = getProviderBadges(provider);
  const primaryHome = provider.homes[0];
  const primaryPhoto =
    primaryHome?.photos.find((p) => p.isPrimary) || primaryHome?.photos[0];
  const totalOpenings = provider.homes.reduce(
    (sum, home) =>
      sum + home.openings.reduce((s, o) => s + o.spotsAvailable, 0),
    0
  );

  if (viewMode === VIEW_MODES.LIST) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-lg">
                  {provider.organizationName}
                </CardTitle>
                {badges.map((badge, idx) => (
                  <Badge key={idx} variant={badge.variant as any}>
                    {badge.label}
                  </Badge>
                ))}
              </div>
              <CardDescription className="flex items-center gap-4">
                {primaryHome && (
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {primaryHome.address.city}, {primaryHome.address.state}
                  </span>
                )}
                {provider.distance !== undefined && (
                  <span>{formatDistance(provider.distance)}</span>
                )}
                {provider.averageRating !== undefined && (
                  <span className="flex items-center">
                    <Star className="w-4 h-4 mr-1 fill-warning text-warning" />
                    {formatRating(provider.averageRating)}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {onFavoriteToggle && (
                <FavoriteButton
                  providerId={provider.id}
                  isFavorite={isFavorite}
                  onToggle={onFavoriteToggle}
                />
              )}
              <Link href={`/public/providers/${provider.id}`}>
                <Button size="sm" variant="healthcare">
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {provider.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {provider.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {totalOpenings > 0 && (
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {formatAvailability(totalOpenings)}
              </span>
            )}
            <span>
              {provider.homes.length} location
              {provider.homes.length !== 1 ? "s" : ""}
            </span>
            {provider.primaryLicenseType && (
              <span>License: {provider.primaryLicenseType}</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      {primaryPhoto && (
        <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
          <img
            src={primaryPhoto.url}
            alt={primaryPhoto.caption || provider.organizationName}
            className="w-full h-full object-cover"
          />
          {onFavoriteToggle && (
            <div className="absolute top-2 right-2">
              <FavoriteButton
                providerId={provider.id}
                isFavorite={isFavorite}
                onToggle={onFavoriteToggle}
              />
            </div>
          )}
          {badges.length > 0 && (
            <div className="absolute top-2 left-2 flex gap-1">
              {badges.map((badge, idx) => (
                <Badge key={idx} variant={badge.variant as any}>
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
      <CardHeader className="flex-1">
        <CardTitle className="text-lg">{provider.organizationName}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          {primaryHome && (
            <span className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {primaryHome.address.city}, {primaryHome.address.county}
            </span>
          )}
          {provider.distance !== undefined && (
            <span>• {formatDistance(provider.distance)}</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {provider.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
            {provider.description}
          </p>
        )}
        <div className="space-y-2">
          {provider.averageRating !== undefined && (
            <div className="flex items-center text-sm">
              <Star className="w-4 h-4 mr-1 fill-warning text-warning" />
              <span className="font-medium">
                {formatRating(provider.averageRating)}
              </span>
              {provider.reviewCount > 0 && (
                <span className="text-muted-foreground ml-1">
                  ({provider.reviewCount} review
                  {provider.reviewCount !== 1 ? "s" : ""})
                </span>
              )}
            </div>
          )}
          {totalOpenings > 0 && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-1" />
              {formatAvailability(totalOpenings)}
            </div>
          )}
        </div>
        <Link href={`/public/providers/${provider.id}`} className="mt-4">
          <Button variant="healthcare" className="w-full">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
