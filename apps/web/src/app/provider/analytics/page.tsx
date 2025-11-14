"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  Home,
  FileText,
  Loader2,
  Download,
} from "lucide-react";
import { usePageMetadata } from "../use-page-metadata";
import {
  analyticsService,
  providerService,
  type ProviderAnalytics,
} from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { StatsCard } from "@/components/ui/stats-card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { PROVIDER_FEATURE_GATES } from "@/lib/constants";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
];

export default function ProviderAnalyticsPage() {
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [analytics, setAnalytics] = useState<ProviderAnalytics | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "custom">(
    "30d"
  );

  useEffect(() => {
    setTitle("Analytics Dashboard");
    setDescription("Track your performance metrics and insights");
  }, [setTitle, setDescription]);

  // Fetch provider ID
  useEffect(() => {
    const fetchProviderId = async () => {
      if (!user?.organizationId) return;

      try {
        const provider = await providerService.getProviderByOrganizationId(
          user.organizationId
        );
        if (provider?.id) {
          setProviderId(provider.id);
        }
      } catch (err) {
        console.error("Error fetching provider ID:", err);
        toast.error("Failed to load provider information");
      }
    };

    fetchProviderId();
  }, [user?.organizationId]);

  // Fetch analytics
  useEffect(() => {
    if (!providerId) return;

    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const endDate = new Date();
        const startDate = new Date();

        switch (dateRange) {
          case "7d":
            startDate.setDate(endDate.getDate() - 7);
            break;
          case "30d":
            startDate.setDate(endDate.getDate() - 30);
            break;
          case "90d":
            startDate.setDate(endDate.getDate() - 90);
            break;
          default:
            startDate.setDate(endDate.getDate() - 30);
        }

        const response = await analyticsService.getProviderAnalytics({
          providerId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        if (response.success && response.data) {
          setAnalytics(response.data);
        } else {
          toast.error(response.message || "Failed to load analytics");
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
        toast.error("Failed to load analytics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [providerId, dateRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  // Prepare funnel chart data
  const funnelData = [
    { name: "Views", value: analytics.funnel.views },
    { name: "Inquiries", value: analytics.funnel.inquiries },
    { name: "Placements", value: analytics.funnel.placements },
  ];

  // Prepare payer mix chart data
  const payerMixData = analytics.payerMix.map((item) => ({
    name: item.payer,
    value: item.count,
    percentage: item.percentage,
  }));

  const gate = PROVIDER_FEATURE_GATES.analytics;

  return (
    <FeatureGate
      feature={gate.feature}
      requiredPlan={gate.requiredPlan}
      showBanner={true}
      bannerDescription={gate.description}
      compact={false}
    >
      <div className="space-y-6">
        {/* Header with Date Range Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your performance metrics and insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!analytics) return;

                // Prepare CSV data
                const csvRows: string[] = [];

                // Summary section
                csvRows.push("Summary Metrics");
                csvRows.push("Metric,Value");
                csvRows.push(`Total Homes,${analytics.summary.totalHomes}`);
                csvRows.push(
                  `Active Openings,${analytics.summary.activeOpenings}`
                );
                csvRows.push(
                  `Total Placements,${analytics.summary.totalPlacements}`
                );
                csvRows.push(
                  `Completed Placements,${analytics.summary.completedPlacements}`
                );
                csvRows.push("");

                // Response Time section
                csvRows.push("Response Time Metrics");
                csvRows.push("Metric,Value");
                csvRows.push(
                  `Average Response Time (hours),${analytics.responseTime.averageResponseTime.toFixed(2)}`
                );
                csvRows.push(
                  `Response Rate (%),${analytics.responseTime.responseRate.toFixed(2)}`
                );
                csvRows.push(
                  `Total Messages,${analytics.responseTime.totalMessages}`
                );
                csvRows.push(
                  `Responded Messages,${analytics.responseTime.respondedMessages}`
                );
                csvRows.push("");

                // Fill Time section
                csvRows.push("Fill Time Metrics");
                csvRows.push("Metric,Value");
                csvRows.push(
                  `Average Fill Time (hours),${analytics.fillTime.averageFillTime.toFixed(2)}`
                );
                csvRows.push(
                  `Filled Openings,${analytics.fillTime.filledOpenings}`
                );
                csvRows.push("");

                // Funnel section
                csvRows.push("Conversion Funnel");
                csvRows.push("Stage,Count,Conversion Rate");
                csvRows.push(`Views,${analytics.funnel.views},100%`);
                csvRows.push(
                  `Inquiries,${analytics.funnel.inquiries},${analytics.funnel.conversionRate.viewsToInquiries.toFixed(2)}%`
                );
                csvRows.push(
                  `Placements,${analytics.funnel.placements},${analytics.funnel.conversionRate.inquiriesToPlacements.toFixed(2)}%`
                );
                csvRows.push("");

                // Payer Mix section
                csvRows.push("Payer Mix");
                csvRows.push("Payer,Count,Percentage");
                analytics.payerMix.forEach((item) => {
                  csvRows.push(
                    `${item.payer},${item.count},${item.percentage.toFixed(2)}%`
                  );
                });

                // Create and download CSV
                const csvContent = csvRows.join("\n");
                const blob = new Blob([csvContent], {
                  type: "text/csv;charset=utf-8;",
                });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute(
                  "download",
                  `analytics-${dateRange}-${format(new Date(), "yyyy-MM-dd")}.csv`
                );
                link.style.visibility = "hidden";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Analytics data exported successfully");
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Select
              value={dateRange}
              onValueChange={(value: "7d" | "30d" | "90d" | "custom") =>
                setDateRange(value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard title="Total Homes" value={analytics.summary.totalHomes} />
          <StatsCard
            title="Active Openings"
            value={analytics.summary.activeOpenings}
          />
          <StatsCard
            title="Total Placements"
            value={analytics.summary.totalPlacements}
            description={`${analytics.summary.completedPlacements} completed`}
          />
          <StatsCard
            title="Avg Fill Time"
            value={
              analytics.fillTime.averageFillTime > 0
                ? `${Math.round(analytics.fillTime.averageFillTime)}h`
                : "N/A"
            }
            description={`${analytics.fillTime.filledOpenings} filled`}
          />
          <StatsCard
            title="Response Rate"
            value={`${analytics.responseTime.responseRate.toFixed(1)}%`}
            description={`${analytics.responseTime.respondedMessages} of ${analytics.responseTime.totalMessages}`}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funnel Chart */}
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Views → Inquiries → Placements</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  views: { label: "Views", color: "hsl(var(--primary))" },
                  inquiries: {
                    label: "Inquiries",
                    color: "hsl(var(--secondary))",
                  },
                  placements: {
                    label: "Placements",
                    color: "hsl(var(--success))",
                  },
                }}
                className="h-[300px]"
              >
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ChartContainer>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Views to Inquiries:
                  </span>
                  <span className="font-medium">
                    {analytics.funnel.conversionRate.viewsToInquiries.toFixed(
                      1
                    )}
                    %
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Inquiries to Placements:
                  </span>
                  <span className="font-medium">
                    {analytics.funnel.conversionRate.inquiriesToPlacements.toFixed(
                      1
                    )}
                    %
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Overall Conversion:
                  </span>
                  <span className="font-medium">
                    {analytics.funnel.conversionRate.viewsToPlacements.toFixed(
                      1
                    )}
                    %
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payer Mix Chart */}
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Payer Mix Analysis</CardTitle>
              <CardDescription>
                Distribution of placements by payer type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payerMixData.length > 0 ? (
                <>
                  <ChartContainer
                    config={payerMixData.reduce(
                      (acc, item, index) => {
                        acc[item.name.toLowerCase().replace(/\s+/g, "_")] = {
                          label: item.name,
                          color: CHART_COLORS[index % CHART_COLORS.length],
                        };
                        return acc;
                      },
                      {} as Record<string, { label: string; color: string }>
                    )}
                    className="h-[300px]"
                  >
                    <PieChart>
                      <Pie
                        data={payerMixData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) =>
                          `${name}: ${percentage.toFixed(1)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {payerMixData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                  <div className="mt-4 space-y-2">
                    {analytics.payerMix.map((item, index) => (
                      <div
                        key={item.payer}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {item.payer}:
                        </span>
                        <span className="font-medium">
                          {item.count} ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No payer data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Metrics Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fill Time Metrics */}
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Fill Time Metrics</CardTitle>
              <CardDescription>
                Time from opening creation to placement completion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className="text-2xl font-bold">
                    {analytics.fillTime.averageFillTime > 0
                      ? `${Math.round(analytics.fillTime.averageFillTime)}h`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Median</p>
                  <p className="text-2xl font-bold">
                    {analytics.fillTime.medianFillTime > 0
                      ? `${Math.round(analytics.fillTime.medianFillTime)}h`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Min</p>
                  <p className="text-2xl font-bold">
                    {analytics.fillTime.minFillTime > 0
                      ? `${Math.round(analytics.fillTime.minFillTime)}h`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max</p>
                  <p className="text-2xl font-bold">
                    {analytics.fillTime.maxFillTime > 0
                      ? `${Math.round(analytics.fillTime.maxFillTime)}h`
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {analytics.fillTime.filledOpenings} of{" "}
                  {analytics.fillTime.totalOpenings} openings filled
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Response Time Metrics */}
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Response Time Metrics</CardTitle>
              <CardDescription>
                Average time to respond to inquiries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className="text-2xl font-bold">
                    {analytics.responseTime.averageResponseTime > 0
                      ? `${Math.round(analytics.responseTime.averageResponseTime)}h`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Median</p>
                  <p className="text-2xl font-bold">
                    {analytics.responseTime.medianResponseTime > 0
                      ? `${Math.round(analytics.responseTime.medianResponseTime)}h`
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Response Rate:{" "}
                  {analytics.responseTime.responseRate.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {analytics.responseTime.respondedMessages} of{" "}
                  {analytics.responseTime.totalMessages} messages responded to
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FeatureGate>
  );
}
