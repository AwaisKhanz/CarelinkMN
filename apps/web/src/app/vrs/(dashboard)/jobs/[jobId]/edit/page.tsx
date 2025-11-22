"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { vrsService, type VRSJob } from "@/lib/api";
import type { CreateJobData, UpdateJobData } from "@/lib/api/services/vrs.service";
import { usePageMetadata } from "../../../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { VRS_CAPABILITIES } from "@/lib/permissions/capabilities";
import { LoadingState, ErrorState } from "@/components/shared";
import { VRSJobForm } from "@/components/forms/vrs-job-form";

function EditJobPageContent() {
  const params = useParams();
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const jobId = params.jobId as string;
  const [job, setJob] = useState<VRSJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employers, setEmployers] = useState<
    Array<{ id: string; companyName: string }>
  >([]);

  useEffect(() => {
    const fetchJob = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await vrsService.getJobById(jobId);

        if (response.success && response.data) {
          const jobData = response.data;
          setJob(jobData);

          setTitle(`Edit Job: ${jobData.title}`);
          setDescription("Update job information");
        } else {
          setError(response.message || "Failed to load job");
        }
      } catch (err) {
        console.error("Error fetching job:", err);
        setError(err instanceof Error ? err.message : "Failed to load job");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchEmployers = async () => {
      try {
        const response = await vrsService.getEmployers({ limit: 1000 });
        if (response.success && response.data) {
          setEmployers(
            response.data.employers.map((e) => ({
              id: e.id,
              companyName: e.companyName,
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching employers:", err);
      }
    };

    if (jobId) {
      fetchJob();
      fetchEmployers();
    }
  }, [jobId, setTitle, setDescription]);

  const handleSubmit = async (data: CreateJobData | UpdateJobData) => {
    setIsSubmitting(true);

    try {
      const response = await vrsService.updateJob(
        jobId,
        data as UpdateJobData
      );

      if (response.success) {
        toast.success("Job updated successfully");
        router.push(`/vrs/jobs/${jobId}`);
      } else {
        toast.error(response.message || "Failed to update job");
      }
    } catch (err) {
      console.error("Error updating job:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update job"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading job..." />;
  }

  if (error || !job) {
    return (
      <ErrorState
        title="Error Loading Job"
        message={error || "Job not found"}
        action={{
          label: "Back to Jobs",
          onClick: () => router.push("/vrs/jobs"),
          variant: "healthcare",
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Job</h1>
          <p className="text-muted-foreground mt-1">Update job information</p>
        </div>
      </div>

      <VRSJobForm
        mode="edit"
        employers={employers}
        initialData={job}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Update Job"
        onCancel={() => router.push(`/vrs/jobs/${jobId}`)}
      />
    </div>
  );
}

export default function EditJobPage() {
  return (
    <RequirePermission
      permission={VRS_CAPABILITIES.JOBS_UPDATE}
      title="Access Restricted"
      description="You don't have permission to update jobs."
    >
      <EditJobPageContent />
    </RequirePermission>
  );
}
