"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { vrsService } from "@/lib/api";
import { JobStatus } from "@carelink/types";
import { usePageMetadata } from "../../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { VRS_CAPABILITIES } from "@/lib/permissions/capabilities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";

const jobSchema = z.object({
  employerId: z.string().min(1, "Employer is required"),
  title: z.string().min(1, "Job title is required"),
  description: z.string().min(1, "Description is required"),
  employmentType: z.string().min(1, "Employment type is required"),
  schedule: z.array(z.string()).default([]),
  wage: z.string().min(1, "Wage is required"),
  wageType: z.string().min(1, "Wage type is required"),
  requirements: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  isRemote: z.boolean().default(false),
  location: z.string().optional().or(z.literal("")),
  status: z.nativeEnum(JobStatus).default(JobStatus.DRAFT),
  expiresAt: z.string().optional().or(z.literal("")),
});

type JobFormData = z.infer<typeof jobSchema>;

function CreateJobPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTitle, setDescription } = usePageMetadata();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employers, setEmployers] = useState<
    Array<{ id: string; companyName: string }>
  >([]);
  const [isLoadingEmployers, setIsLoadingEmployers] = useState(true);

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      employerId: searchParams.get("employerId") || "",
      title: "",
      description: "",
      employmentType: "",
      schedule: [],
      wage: "",
      wageType: "HOURLY",
      requirements: [],
      preferredSkills: [],
      isRemote: false,
      location: "",
      status: JobStatus.DRAFT,
      expiresAt: "",
    },
  });

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

  const handleSubmit = async (data: JobFormData) => {
    setIsSubmitting(true);

    try {
      const jobData = {
        employerId: data.employerId,
        title: data.title,
        description: data.description,
        employmentType: data.employmentType,
        schedule: data.schedule,
        wage: parseFloat(data.wage) || 0,
        wageType: data.wageType,
        requirements: data.requirements,
        preferredSkills: data.preferredSkills,
        isRemote: data.isRemote,
        location: data.location || undefined,
        status: data.status,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      };

      const response = await vrsService.createJob(jobData);

      if (response.success) {
        toast.success("Job created successfully");
        router.push(`/vrs/jobs/${response.data?.id}`);
      } else {
        toast.error(response.message || "Failed to create job");
      }
    } catch (err) {
      console.error("Error creating job:", err);
      toast.error("Failed to create job");
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

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Job Information</CardTitle>
            <CardDescription>Basic job details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employerId">
                Employer <span className="text-destructive">*</span>
              </Label>
              {isLoadingEmployers ? (
                <div className="text-sm text-muted-foreground">
                  Loading employers...
                </div>
              ) : (
                <Controller
                  name="employerId"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employer" />
                      </SelectTrigger>
                      <SelectContent>
                        {employers.map((employer) => (
                          <SelectItem key={employer.id} value={employer.id}>
                            {employer.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {form.formState.errors.employerId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.employerId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                Job Title <span className="text-destructive">*</span>
              </Label>
              <Input id="title" {...form.register("title")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                rows={6}
                {...form.register("description")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employmentType">
                  Employment Type <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="employmentType"
                  placeholder="e.g., FULL_TIME, PART_TIME, CONTRACT"
                  {...form.register("employmentType")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(JobStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Compensation & Location</CardTitle>
            <CardDescription>Wage and location details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wage">
                  Wage <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="wage"
                  type="number"
                  step="0.01"
                  {...form.register("wage")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wageType">
                  Wage Type <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="wageType"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HOURLY">Hourly</SelectItem>
                        <SelectItem value="SALARY">Salary</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="isRemote"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    id="isRemote"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="isRemote" className="cursor-pointer">
                Remote Position
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City, State or specific address"
                {...form.register("location")}
                disabled={form.watch("isRemote")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expiry Date (Optional)</Label>
              <Input
                id="expiresAt"
                type="date"
                {...form.register("expiresAt")}
              />
            </div>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Schedule & Requirements</CardTitle>
            <CardDescription>
              Work schedule, requirements, and preferred skills
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule (one per line)</Label>
              <Textarea
                id="schedule"
                rows={3}
                placeholder="WEEKDAYS&#10;EVENINGS&#10;WEEKENDS"
                {...form.register("schedule", {
                  setValueAs: (value: string) => {
                    if (!value || !value.trim()) return [];
                    return value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean);
                  },
                })}
              />
              <p className="text-xs text-muted-foreground">
                Enter one schedule option per line (e.g., WEEKDAYS, EVENINGS)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements (one per line)</Label>
              <Textarea
                id="requirements"
                rows={4}
                placeholder="High school diploma&#10;2 years experience&#10;Valid driver's license"
                {...form.register("requirements", {
                  setValueAs: (value: string) => {
                    if (!value || !value.trim()) return [];
                    return value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean);
                  },
                })}
              />
              <p className="text-xs text-muted-foreground">
                Enter one requirement per line
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredSkills">
                Preferred Skills (one per line)
              </Label>
              <Textarea
                id="preferredSkills"
                rows={4}
                placeholder="Customer service&#10;Data entry&#10;Microsoft Office"
                {...form.register("preferredSkills", {
                  setValueAs: (value: string) => {
                    if (!value || !value.trim()) return [];
                    return value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean);
                  },
                })}
              />
              <p className="text-xs text-muted-foreground">
                Enter one skill per line
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="healthcare" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Job"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CreateJobPage() {
  return (
    <RequirePermission
      permission={VRS_CAPABILITIES.JOB_MATCHING_USE}
      title="Access Restricted"
      description="You don't have permission to create jobs."
    >
      <CreateJobPageContent />
    </RequirePermission>
  );
}
