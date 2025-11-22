"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { vrsService } from "@/lib/api";
import type { CreateJobData, UpdateJobData } from "@/lib/api/services/vrs.service";
import { usePageMetadata } from "../../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { VRS_CAPABILITIES } from "@/lib/permissions/capabilities";
import { VRSJobForm } from "@/components/forms/vrs-job-form";

function CreateJobPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTitle, setDescription } = usePageMetadata();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employers, setEmployers] = useState<
    Array<{ id: string; companyName: string }>
  >([]);
  const [isLoadingEmployers, setIsLoadingEmployers] = useState(true);

  useEffect(() => {
    setTitle("Create Job");
    setDescription("Add a new job posting");
  }, [setTitle, setDescription]);

  useEffect(() => {
    const fetchEmployers = async () => {
      setIsLoadingEmployers(true);
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
      } finally {
        setIsLoadingEmployers(false);
      }
    };
    fetchEmployers();
  }, []);

  const handleSubmit = async (data: CreateJobData | UpdateJobData) => {
    setIsSubmitting(true);

    try {
      const response = await vrsService.createJob(data as CreateJobData);

      if (response.success && response.data) {
        toast.success("Job created successfully");
        router.push(`/vrs/jobs/${response.data.id}`);
      } else {
        toast.error(response.message || "Failed to create job");
      }
    } catch (err) {
      console.error("Error creating job:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create job"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create Job</h1>
          <p className="text-muted-foreground mt-1">Add a new job posting</p>
        </div>
      </div>

      <VRSJobForm
        mode="create"
        employers={employers}
        isLoadingEmployers={isLoadingEmployers}
        initialEmployerId={searchParams.get("employerId") || undefined}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Create Job"
        onCancel={() => router.back()}
      />
    </div>
  );
}

export default function CreateJobPage() {
  return (
    <RequirePermission
      permission={VRS_CAPABILITIES.JOBS_CREATE}
      title="Access Restricted"
      description="You don't have permission to create jobs."
    >
      <CreateJobPageContent />
    </RequirePermission>
  );
}
