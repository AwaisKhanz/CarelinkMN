"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Heart, Clock, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";
import { LoadingState, ErrorState } from "@/components/shared";
import { usePageMetadata } from "../use-page-metadata";
import { useAuth } from "@/contexts/auth-context";
import { publicService } from "@/lib/api";
import { Favorite, ProviderPublicProfile } from "@carelink/types";
import { toast } from "sonner";
import Link from "next/link";

export default function PublicDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setTitle("Dashboard");
    setDescription("Your care search dashboard");
  }, [setTitle, setDescription]);

  useEffect(() => {
    const init = async () => {
      if (user?.id) {
        await fetchFavorites();
        loadRecentSearches();
      }
      setIsLoading(false);
    };
    init();
  }, [user?.id]);

  const fetchFavorites = useCallback(async () => {
    try {
      const response = await publicService.getFavorites();
      if (response.success && response.data) {
        setFavorites(response.data.favorites || []);
      }
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  }, []);

  const loadRecentSearches = () => {
    // Load from localStorage
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        setRecentSearches([]);
      }
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error Loading Dashboard"
        message={error}
        action={{
          label: "Retry",
          onClick: () => {
            setError(null);
            setIsLoading(true);
            if (user?.id) {
              fetchFavorites();
            }
            loadRecentSearches();
          },
          variant: "healthcare",
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome{user?.firstName ? `, ${user.firstName}` : ""}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Find the perfect care provider for your needs
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Saved Favorites"
          value={favorites.length.toString()}
          description="Providers you've saved"
        />
        <StatsCard
          title="Recent Searches"
          value={recentSearches.length.toString()}
          description="Your search history"
        />
        <StatsCard
          title="Quick Search"
          value="Ready"
          description="Start searching now"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search Providers */}
        <Card variant="healthcare">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              <CardTitle>Search Providers</CardTitle>
            </div>
            <CardDescription>
              Find care providers that match your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/public/search">
              <Button variant="healthcare" className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Start Searching
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Favorites */}
        <Card variant="healthcare">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              <CardTitle>My Favorites</CardTitle>
            </div>
            <CardDescription>
              {favorites.length > 0
                ? `You have ${favorites.length} saved provider${favorites.length !== 1 ? "s" : ""}`
                : "Save providers you're interested in"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/public/favorites">
              <Button variant="outline" className="w-full">
                <Heart className="w-4 h-4 mr-2" />
                View Favorites
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Favorites */}
      {favorites.length > 0 && (
        <Card variant="healthcare">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Favorites</CardTitle>
                <CardDescription>Your recently saved providers</CardDescription>
              </div>
              <Link href="/public/favorites">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {favorites.slice(0, 3).map((favorite) => (
                <div
                  key={favorite.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {favorite.provider.organizationName}
                    </h4>
                    {favorite.provider.homes[0] && (
                      <p className="text-sm text-muted-foreground">
                        {favorite.provider.homes[0].address.city},{" "}
                        {favorite.provider.homes[0].address.state}
                      </p>
                    )}
                  </div>
                  <Link href={`/public/providers/${favorite.providerId}`}>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Learn how to use CareLinkMN to find the best care
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              • Use the search page to find providers by location, services, and
              payer acceptance (MA, Medicare, Private, CADI, BI/TBI, EW, DD)
            </p>
            <p>• Save providers to your favorites for easy access later</p>
            <p>
              • View provider profiles with photos and comprehensive facility
              information
            </p>
            <p>
              • Use AI-powered search to describe what you're looking for in
              natural language
            </p>
            <p>
              • Contact providers directly or hand off to a case manager for
              formal referral
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
