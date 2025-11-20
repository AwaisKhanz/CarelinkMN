"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit } from "lucide-react";
import { usePageMetadata } from "../../use-page-metadata";
import { vrsService, type VRSJob } from "@/lib/api";
import { toast } from "sonner";
import { RequirePermission } from "@/components/auth/require-permission";
import { VRS_CAPABILITIES } from "@/lib/permissions/capabilities";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import {
  VRSLoadingState,
  VRSErrorState,
  VRSDetailHeader,
} from "@/components/vrs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getVRSJobStatusBadgeConfig } from "@/lib/utils/vrs";

function JobDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const jobId = params.jobId as string;
  const { hasCapability } = useRolePermissions();
  const canUpdateJobs = hasCapability(VRS_CAPABILITIES.JOB_MATCHING_USE);

  const [job, setJob] = useState<VRSJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prepare header actions - MUST be before conditional returns
  const headerActions = useMemo(() => {
    const actions = [];
    if (canUpdateJobs) {
      actions.push({
        label: "Edit",
        onClick: () => router.push(`/vrs/jobs/${jobId}/edit`),
        variant: "outline" as const,
        icon: <Edit className="h-4 w-4 mr-2" />,
      });
    }
    return actions;
  }, [canUpdateJobs, jobId, router]);

  // Get status badge config - MUST be before conditional returns
  const statusBadgeConfig = useMemo(() => {
    if (!job) return null;
    return getVRSJobStatusBadgeConfig(job.status);
  }, [job]);

  useEffect(() => {
    const fetchJob = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await vrsService.getJobById(jobId);

        if (response.success && response.data) {
          setJob(response.data);
          setTitle(`Job: ${response.data.title}`);
          setDescription("View job details and placements");
        } else {
          setError(response.message || "Failed to load job");
          toast.error(response.message || "Failed to load job");
        }
      } catch (err) {
        console.error("Error fetching job:", err);
        setError(err instanceof Error ? err.message : "Failed to load job");
        toast.error("Failed to load job");
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId, setTitle, setDescription]);

  if (isLoading) {
    return <VRSLoadingState message="Loading job details..." />;
  }

  if (error || !job) {
    return (
      <VRSErrorState
        message={error || "Job not found"}
        action={{
          label: "Back to Jobs",
          onClick: () => router.push("/vrs/jobs"),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <VRSDetailHeader
        title={job.title}
        subtitle={job.employer?.companyName || "Unknown Employer"}
        badge={
          statusBadgeConfig
            ? {
                label: statusBadgeConfig.label,
                variant: statusBadgeConfig.variant || "outline",
              }
            : undefined
        }
        backHref="/vrs/jobs"
        actions={headerActions}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="placements">Placements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card variant="healthcare">
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Description</div>
                  <div className="mt-1">{job.description}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Employment Type</div>
                  <div className="font-medium">{job.employmentType}</div>
                </div>
                {job.schedule && job.schedule.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground">Schedule</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {job.schedule.map((s, i) => (
                        <Badge key={i} variant="outline">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted-foreground">Wage</div>
                  <div className="font-medium">
                    ${typeof job.wage === "string" ? parseFloat(job.wage).toFixed(2) : job.wage.toFixed(2)} {job.wageType}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div className="font-medium">
                    {job.isRemote ? "Remote" : job.location || "Not specified"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="healthcare">
              <CardHeader>
                <CardTitle>Requirements & Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {job.requirements && job.requirements.length > 0 ? (
                  <div>
                    <div className="text-sm text-muted-foreground">Requirements</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {job.requirements.map((req, i) => (
                        <Badge key={i} variant="outline">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-muted-foreground">Requirements</div>
                    <div className="text-sm text-muted-foreground">None specified</div>
                  </div>
                )}
                {job.preferredSkills && job.preferredSkills.length > 0 ? (
                  <div>
                    <div className="text-sm text-muted-foreground">Preferred Skills</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {job.preferredSkills.map((skill, i) => (
                        <Badge key={i} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-muted-foreground">Preferred Skills</div>
                    <div className="text-sm text-muted-foreground">None specified</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Posted</div>
                  <div className="font-medium">
                    {format(new Date(job.postedAt), "MMM d, yyyy")}
                  </div>
                </div>
                {job.expiresAt && (
                  <div>
                    <div className="text-sm text-muted-foreground">Expires</div>
                    <div className="font-medium">
                      {format(new Date(job.expiresAt), "MMM d, yyyy")}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="placements" className="space-y-4">
          {job.placements && job.placements.length > 0 ? (
            <div className="space-y-2">
              {job.placements.map((placement) => (
                <Card key={placement.id} variant="healthcare">
                  <CardHeader>
                    <CardTitle>
                      {placement.client?.firstName} {placement.client?.lastName}
                    </CardTitle>
                    <CardDescription>
                      Placed on {format(new Date(placement.placementDate), "MMM d, yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/vrs/clients/${placement.clientId}`)}
                    >
                      View Client
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card variant="healthcare">
              <CardContent className="py-8 text-center text-muted-foreground">
                No placements yet
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function JobDetailPage() {
  return (
    <RequirePermission
      permission={VRS_CAPABILITIES.JOB_MATCHING_USE}
      title="Access Restricted"
      description="You don't have permission to view jobs."
    >
      <JobDetailPageContent />
    </RequirePermission>
  );
}

