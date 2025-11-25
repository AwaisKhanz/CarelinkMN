"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Building,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { apiService } from "@/lib/api/config";
import { toast } from "sonner";
import { usePageMetadata } from "../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";
import { StatsGrid } from "@/components/shared";

interface ComplianceStats {
  totalLicenses: number;
  expiredLicenses: number;
  expiringLicenses: number;
  pendingVerifications: number;
  providersWithoutLicenses: number;
  totalIssues: number;
  complianceRate: number;
}

interface ComplianceIssue {
  id: string;
  type: "EXPIRED_LICENSE" | "EXPIRING_LICENSE" | "PENDING_VERIFICATION" | "MISSING_LICENSE";
  severity: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  organizationId?: string;
  organizationName?: string;
  dueDate?: string;
  createdAt: string;
}

function CompliancePageContent() {
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [issues, setIssues] = useState<ComplianceIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTitle("Compliance Monitoring");
    setDescription("Monitor license compliance and identify issues");
    fetchData();
  }, [setTitle, setDescription]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsResponse, issuesResponse] = await Promise.all([
        apiService.get<ComplianceStats>("/api/admin/compliance/stats"),
        apiService.get<ComplianceIssue[]>("/api/admin/compliance/issues"),
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (issuesResponse.success && issuesResponse.data) {
        setIssues(issuesResponse.data);
      }
    } catch (error) {
      console.error("Error fetching compliance data:", error);
      toast.error("Failed to load compliance data");
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const config = {
      HIGH: { variant: "destructive" as const, icon: XCircle },
      MEDIUM: { variant: "secondary" as const, icon: AlertTriangle },
      LOW: { variant: "outline" as const, icon: Clock },
    };
    return config[severity as keyof typeof config] || config.LOW;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      EXPIRED_LICENSE: "Expired License",
      EXPIRING_LICENSE: "Expiring Soon",
      PENDING_VERIFICATION: "Pending Verification",
      MISSING_LICENSE: "Missing License",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const handleViewResource = (issue: ComplianceIssue) => {
    if (issue.resourceType === "License") {
      router.push(`/admin/licenses/${issue.resourceId}`);
    } else if (issue.resourceType === "Organization") {
      router.push(`/admin/organizations/${issue.resourceId}`);
    } else if (issue.resourceType === "Provider" && issue.organizationId) {
      router.push(`/admin/organizations/${issue.organizationId}`);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading compliance data...</div>;
  }

  const statsData = stats
    ? [
        {
          label: "Compliance Rate",
          value: `${stats.complianceRate}%`,
          icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
          description: "Overall compliance",
        },
        {
          label: "Total Issues",
          value: stats.totalIssues.toString(),
          icon: <AlertTriangle className="h-4 w-4 text-muted-foreground" />,
          description: "Requiring attention",
        },
        {
          label: "Expired Licenses",
          value: stats.expiredLicenses.toString(),
          icon: <XCircle className="h-4 w-4 text-muted-foreground" />,
          description: "Need immediate action",
        },
        {
          label: "Expiring Soon",
          value: stats.expiringLicenses.toString(),
          icon: <Clock className="h-4 w-4 text-muted-foreground" />,
          description: "Within 30 days",
        },
      ]
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Compliance Monitoring
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor license compliance and identify issues
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && <StatsGrid stats={statsData} columns={4} variant="card" />}

      {/* Compliance Issues */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Compliance Issues</CardTitle>
              <CardDescription>
                {issues.length} issue{issues.length !== 1 ? "s" : ""} requiring attention
              </CardDescription>
            </div>
            <Button variant="outline" onClick={fetchData}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {issues.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue) => {
                  const severityConfig = getSeverityBadge(issue.severity);
                  const SeverityIcon = severityConfig.icon;

                  return (
                    <TableRow key={issue.id}>
                      <TableCell>
                        <Badge variant={severityConfig.variant}>
                          <SeverityIcon className="mr-1 h-3 w-3" />
                          {issue.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTypeLabel(issue.type)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{issue.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {issue.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {issue.organizationName || "—"}
                      </TableCell>
                      <TableCell>
                        {issue.dueDate
                          ? format(new Date(issue.dueDate), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewResource(issue)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium">All Clear!</h3>
              <p className="text-muted-foreground">
                No compliance issues found
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompliancePage() {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.COMPLIANCE_VIEW}
      title="Access Restricted"
      description="You don't have permission to view compliance monitoring."
    >
      <CompliancePageContent />
    </RequirePermission>
  );
}
