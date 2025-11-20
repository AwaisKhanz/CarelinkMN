"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit } from "lucide-react";
import { usePageMetadata } from "../../use-page-metadata";
import { vrsService, type VRSEmployer } from "@/lib/api";
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

function EmployerDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const employerId = params.employerId as string;
  const { hasCapability } = useRolePermissions();
  const canUpdateEmployers = hasCapability(VRS_CAPABILITIES.EMPLOYERS_MANAGE);

  const [employer, setEmployer] = useState<VRSEmployer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prepare header actions - MUST be before conditional returns
  const headerActions = useMemo(() => {
    const actions = [];
    if (canUpdateEmployers) {
      actions.push({
        label: "Edit",
        onClick: () => router.push(`/vrs/employers/${employerId}/edit`),
        variant: "outline" as const,
        icon: <Edit className="h-4 w-4 mr-2" />,
      });
    }
    return actions;
  }, [canUpdateEmployers, employerId, router]);

  useEffect(() => {
    const fetchEmployer = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await vrsService.getEmployerById(employerId);

        if (response.success && response.data) {
          setEmployer(response.data);
          setTitle(`Employer: ${response.data.companyName}`);
          setDescription("View employer details and job postings");
        } else {
          setError(response.message || "Failed to load employer");
          toast.error(response.message || "Failed to load employer");
        }
      } catch (err) {
        console.error("Error fetching employer:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load employer"
        );
        toast.error("Failed to load employer");
      } finally {
        setIsLoading(false);
      }
    };

    if (employerId) {
      fetchEmployer();
    }
  }, [employerId, setTitle, setDescription]);

  if (isLoading) {
    return <VRSLoadingState message="Loading employer details..." />;
  }

  if (error || !employer) {
    return (
      <VRSErrorState
        message={error || "Employer not found"}
        action={{
          label: "Back to Employers",
          onClick: () => router.push("/vrs/employers"),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <VRSDetailHeader
        title={employer.companyName}
        subtitle={`Industry: ${employer.industry}`}
        backHref="/vrs/employers"
        actions={headerActions}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card variant="healthcare">
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Industry</div>
                  <div className="font-medium">{employer.industry}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Company Size
                  </div>
                  <div className="font-medium">{employer.size}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Features</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {employer.isInclusive && (
                      <Badge variant="outline">Inclusive</Badge>
                    )}
                    {employer.hasAccessibility && (
                      <Badge variant="outline">Accessible</Badge>
                    )}
                    {employer.isSponsoredListing && (
                      <Badge variant="outline">Sponsored</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="healthcare">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Contact Name
                  </div>
                  <div className="font-medium">{employer.contactName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{employer.contactEmail}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div className="font-medium">{employer.contactPhone}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div>{employer.addressLine1}</div>
                {employer.addressLine2 && <div>{employer.addressLine2}</div>}
                <div>
                  {employer.city}, {employer.state} {employer.zipCode}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          {employer.jobs && employer.jobs.length > 0 ? (
            <div className="space-y-2">
              {employer.jobs.map((job) => (
                <Card key={job.id} variant="healthcare">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{job.title}</CardTitle>
                      <Badge variant="outline">{job.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/vrs/jobs/${job.id}`)}
                    >
                      View Job
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card variant="healthcare">
              <CardContent className="py-8 text-center text-muted-foreground">
                No jobs posted yet
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function EmployerDetailPage() {
  return (
    <RequirePermission
      permission={VRS_CAPABILITIES.EMPLOYERS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view employers."
    >
      <EmployerDetailPageContent />
    </RequirePermission>
  );
}
