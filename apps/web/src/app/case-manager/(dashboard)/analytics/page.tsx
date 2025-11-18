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
  FileText,
  Loader2,
  Download,
  CheckCircle,
  AlertCircle,
  Users,
} from "lucide-react";
import { usePageMetadata } from "../use-page-metadata";
import { caseManagerService, type CaseManagerStats } from "@/lib/api";
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
import { RequirePermission } from "@/components/auth/require-permission";
import { CASE_MANAGER_CAPABILITIES } from "@/lib/permissions/capabilities";
import { ReferralStatus, Urgency, Payer } from "@carelink/types";
import { AccessRestricted } from "@/components/provider/access-restricted";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
];

const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  NEW: "New",
  IN_REVIEW: "In Review",
  TOURING: "Touring",
  OFFER_MADE: "Offer Made",
  PLACED: "Placed",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

const URGENCY_LABELS: Record<Urgency, string> = {
  URGENT: "Urgent",
  HIGH: "High",
  ROUTINE: "Routine",
};

const PAYER_LABELS: Record<Payer, string> = {
  MA: "Medical Assistance",
  MEDICARE: "Medicare",
  PRIVATE: "Private Pay",
  CADI: "CADI",
  "BI_TBI": "BI/TBI",
  EW: "Elderly Waiver",
  DD: "Developmental Disabilities",
};

function CaseManagerAnalyticsPageContent() {
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [stats, setStats] = useState<CaseManagerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "custom">(
    "30d"
  );

  useEffect(() => {
    setTitle("Analytics Dashboard");
    setDescription("Track your referral performance and insights");
  }, [setTitle, setDescription]);

  // Fetch analytics
  useEffect(() => {
    if (!user?.id) return;

    const fetchStats = async () => {
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
          case "custom":
            // For now, use 30 days as default for custom
            startDate.setDate(endDate.getDate() - 30);
            break;
        }

        const response = await caseManagerService.getStats(user.id, {
          startDate,
          endDate,
        });

        if (response.success && response.data) {
          setStats(response.data);
        } else {
          toast.error(response.message || "Failed to load analytics");
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast.error("Failed to load analytics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user?.id, dateRange]);

  // Prepare chart data
  const statusChartData = stats
    ? Object.entries(stats.referralsByStatus).map(([status, count]) => ({
        name: REFERRAL_STATUS_LABELS[status as ReferralStatus] || status,
        value: count,
      }))
    : [];

  const urgencyChartData = stats
    ? Object.entries(stats.referralsByUrgency).map(([urgency, count]) => ({
        name: URGENCY_LABELS[urgency as Urgency] || urgency,
        value: count,
      }))
    : [];

  const payerChartData = stats
    ? Object.entries(stats.referralsByPayer)
        .filter(([_, count]) => count > 0)
        .map(([payer, count]) => ({
          name: PAYER_LABELS[payer as Payer] || payer,
          value: count,
        }))
    : [];

  const handleExportCSV = () => {
    if (!stats) return;

    const csvRows: string[] = [];

    // Header
    csvRows.push("Case Manager Analytics Report");
    csvRows.push(`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`);
    csvRows.push(`Date Range: ${dateRange}`);
    csvRows.push("");

    // Summary section
    csvRows.push("Summary Statistics");
    csvRows.push("Metric,Value");
    csvRows.push(`Total Referrals,${stats.totalReferrals}`);
    csvRows.push(`Active Referrals,${stats.activeReferrals}`);
    csvRows.push(`Completed Referrals,${stats.completedReferrals}`);
    csvRows.push(`Pending Placements,${stats.pendingPlacements}`);
    csvRows.push(`Completed Placements,${stats.completedPlacements}`);
    csvRows.push(
      `Average Placement Time (days),${stats.averagePlacementTime.toFixed(2)}`
    );
    csvRows.push(`Response Rate (%),${stats.responseRate.toFixed(2)}`);
    csvRows.push("");

    // Referrals by Status
    csvRows.push("Referrals by Status");
    csvRows.push("Status,Count");
    Object.entries(stats.referralsByStatus).forEach(([status, count]) => {
      csvRows.push(
        `${REFERRAL_STATUS_LABELS[status as ReferralStatus] || status},${count}`
      );
    });
    csvRows.push("");

    // Referrals by Urgency
    csvRows.push("Referrals by Urgency");
    csvRows.push("Urgency,Count");
    Object.entries(stats.referralsByUrgency).forEach(([urgency, count]) => {
      csvRows.push(
        `${URGENCY_LABELS[urgency as Urgency] || urgency},${count}`
      );
    });
    csvRows.push("");

    // Referrals by Payer
    csvRows.push("Referrals by Payer");
    csvRows.push("Payer,Count");
    Object.entries(stats.referralsByPayer).forEach(([payer, count]) => {
      if (count > 0) {
        csvRows.push(`${PAYER_LABELS[payer as Payer] || payer},${count}`);
      }
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
      `case-manager-analytics-${dateRange}-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Analytics data exported successfully");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card variant="healthcare" className="max-w-md">
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>
              No analytics data available for the selected date range.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your referral performance and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={!stats}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Referrals"
          value={stats.totalReferrals}
          description="All referrals in period"
        />
        <StatsCard
          title="Active Referrals"
          value={stats.activeReferrals}
          description="Currently active"
          variant="healthcare"
        />
        <StatsCard
          title="Completed Placements"
          value={stats.completedPlacements}
          description="Successfully placed"
          variant="healthcare"
        />
        <StatsCard
          title="Response Rate"
          value={`${stats.responseRate.toFixed(1)}%`}
          description="Provider response rate"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle className="text-lg">Pending Placements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingPlacements}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Awaiting placement
            </p>
          </CardContent>
        </Card>
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle className="text-lg">Average Placement Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.averagePlacementTime.toFixed(1)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Days</p>
          </CardContent>
        </Card>
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle className="text-lg">Completed Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.completedReferrals}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Closed or placed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referrals by Status */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Referrals by Status</CardTitle>
            <CardDescription>
              Distribution of referrals across different statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusChartData.length > 0 ? (
              <ChartContainer
                config={{
                  value: {
                    label: "Count",
                  },
                }}
                className="h-[300px]"
              >
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referrals by Urgency */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Referrals by Urgency</CardTitle>
            <CardDescription>
              Distribution of referrals by urgency level
            </CardDescription>
          </CardHeader>
          <CardContent>
            {urgencyChartData.length > 0 ? (
              <ChartContainer
                config={{
                  value: {
                    label: "Count",
                  },
                }}
                className="h-[300px]"
              >
                <PieChart>
                  <Pie
                    data={urgencyChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {urgencyChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referrals by Payer */}
        {payerChartData.length > 0 && (
          <Card variant="healthcare" className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Referrals by Payer</CardTitle>
              <CardDescription>
                Distribution of referrals by primary payer type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: {
                    label: "Count",
                  },
                }}
                className="h-[300px]"
              >
                <BarChart data={payerChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function CaseManagerAnalyticsPage() {
  return (
    <RequirePermission
      permission={CASE_MANAGER_CAPABILITIES.ANALYTICS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view analytics. Please contact your organization administrator if you need access."
    >
      <CaseManagerAnalyticsPageContent />
    </RequirePermission>
  );
}

