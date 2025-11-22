"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Heart, Search, Grid3x3, List } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared";
import { ProviderCard } from "@/components/public";
import { usePageMetadata } from "../use-page-metadata";
import { useAuth } from "@/contexts/auth-context";
import { publicService } from "@/lib/api";
import { Favorite, ProviderPublicProfile } from "@carelink/types";
import { toast } from "sonner";
import { VIEW_MODES, ViewMode } from "@/lib/constants/public";
import Link from "next/link";

export default function FavoritesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODES.GRID);

  useEffect(() => {
    setTitle("My Favorites");
    setDescription("Your saved care providers");
  }, [setTitle, setDescription]);

  const fetchFavorites = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await publicService.getFavorites();
      if (response.success && response.data) {
        setFavorites(response.data.favorites || []);
      } else {
        setError(response.message || "Failed to load favorites");
        toast.error("Failed to load favorites");
      }
    } catch (err) {
      console.error("Error fetching favorites:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load favorites";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleFavoriteToggle = async (
    providerId: string,
    isFavorite: boolean
  ) => {
    if (!user?.id) {
      toast.error("Please sign in to manage favorites");
      return;
    }

    try {
      if (isFavorite) {
        await publicService.addFavorite({ providerId });
        // Refresh favorites list
        fetchFavorites();
        toast.success("Added to favorites");
      } else {
        const favorite = favorites.find((f) => f.providerId === providerId);
        if (favorite) {
          await publicService.removeFavorite(favorite.id);
          // Refresh favorites list
          fetchFavorites();
          toast.success("Removed from favorites");
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      toast.error("Failed to update favorite");
    }
  };

  if (!user?.id) {
    return (
      <ErrorState
        title="Sign In Required"
        message="Please sign in to view your favorites"
        action={{
          label: "Sign In",
          onClick: () => router.push("/auth/signin"),
          variant: "healthcare",
        }}
      />
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading favorites..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error Loading Favorites"
        message={error}
        action={{
          label: "Retry",
          onClick: fetchFavorites,
          variant: "healthcare",
        }}
      />
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Favorites</h1>
            <p className="text-muted-foreground mt-1">
              Your saved care providers
            </p>
          </div>
        </div>
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Start searching for providers and save your favorites to view them here"
          action={{
            label: "Search Providers",
            onClick: () => router.push("/public/search"),
            variant: "healthcare",
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Favorites</h1>
          <p className="text-muted-foreground mt-1">
            {favorites.length} saved provider{favorites.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md">
            <Button
              variant={viewMode === VIEW_MODES.GRID ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode(VIEW_MODES.GRID)}
              className="rounded-r-none"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === VIEW_MODES.LIST ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode(VIEW_MODES.LIST)}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Link href="/public/search">
            <Button variant="healthcare">
              <Search className="w-4 h-4 mr-2" />
              Search More
            </Button>
          </Link>
        </div>
      </div>

      {/* Favorites Grid/List */}
      <div
        className={
          viewMode === VIEW_MODES.GRID
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-4"
        }
      >
        {favorites.map((favorite) => (
          <ProviderCard
            key={favorite.id}
            provider={favorite.provider}
            viewMode={viewMode}
            isFavorite={true}
            onFavoriteToggle={handleFavoriteToggle}
          />
        ))}
      </div>
    </div>
  );
}
