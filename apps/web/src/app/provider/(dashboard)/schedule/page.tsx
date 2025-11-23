"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { providerService } from "@/lib/api";
import { usePageMetadata } from "../use-page-metadata";
import { useProviderId } from "@/hooks/use-provider-data";
import { format } from "date-fns";
import { Referral, ReferralStatus } from "@carelink/types";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { ProviderSubscriptionGuard } from "@/components/auth/provider-subscription-guard";
import { PROVIDER_FEATURE_GATES } from "@/lib/constants";
import { SubscriptionTier } from "@carelink/types";

function SchedulePageContent() {
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const [tours, setTours] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const providerId = useProviderId();

  useEffect(() => {
    setTitle("Schedule");
    setDescription("Manage upcoming tours and appointments");
  }, [setTitle, setDescription]);

  useEffect(() => {
    if (providerId) {
      fetchTours();
    }
  }, [providerId]);

  const fetchTours = async () => {
    if (!providerId) return;

    setIsLoading(true);
    try {
      // Fetch referrals with status TOURING
      // Note: In a real implementation, we might want to fetch referrals where the *shortlist* status is TOURING for this provider
      // But for now, we'll assume providerService.getProviderReferrals returns relevant referrals
      const response = await providerService.getProviderReferrals(providerId, {
        status: ReferralStatus.TOURING,
        limit: 50,
      });

      if (response.success && response.data) {
        setTours(response.data.referrals);
      } else {
        toast.error("Failed to load tours");
      }
    } catch (err) {
      console.error("Error fetching tours:", err);
      toast.error("Failed to load tours");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Schedule</h1>
          <p className="text-muted-foreground mt-1">
            Upcoming tours and appointments
          </p>
        </div>
        <Button variant="outline" onClick={fetchTours}>
          <Calendar className="w-4 h-4 mr-2" />
          Sync Calendar
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tours</CardTitle>
            <CardDescription>
              Referrals currently in "Touring" status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : tours.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No upcoming tours scheduled.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tours.map((tour) => (
                  <div
                    key={tour.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/provider/referrals/${tour.id}`)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          Referral #{tour.referralNumber}
                        </span>
                        <Badge variant="outline">Touring</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {tour.clientInitials} ({tour.clientAge}yo {tour.clientGender})
                        </div>
                        {tour.targetMoveDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Target: {format(new Date(tour.targetMoveDate), "MMM d, yyyy")}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0">
                      <Button variant="ghost" size="sm">
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SchedulePageWrapper() {
  return (
    <ProviderSubscriptionGuard
      requiredPlan={SubscriptionTier.FREE}
      feature="Schedule"
      featureDescription="View your upcoming tours and appointments"
    >
      <SchedulePageContent />
    </ProviderSubscriptionGuard>
  );
}

export default function SchedulePage() {
  return <SchedulePageWrapper />;
}
