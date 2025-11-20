"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { vrsService, type VRSClient } from "@/lib/api";
import { VRSClientStatus } from "@carelink/types";
import { usePageMetadata } from "../../../use-page-metadata";
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
import { VRSLoadingState, VRSErrorState } from "@/components/vrs";
import { getClientDisplayName } from "@/lib/utils/vrs";

const clientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  eligibilityType: z.string().min(1, "Eligibility type is required"),
  servicesNeeded: z.union([z.array(z.string()), z.string()]).default([]),
  workHistory: z.string().optional().or(z.literal("")),
  skills: z.union([z.array(z.string()), z.string()]).default([]),
  interests: z.union([z.array(z.string()), z.string()]).default([]),
  status: z.nativeEnum(VRSClientStatus),
  assignedSpecialistId: z.string().optional().or(z.literal("")),
});

type ClientFormData = z.infer<typeof clientSchema>;

function EditClientPageContent() {
  const params = useParams();
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const clientId = params.clientId as string;
  const [client, setClient] = useState<VRSClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      email: "",
      phone: "",
      eligibilityType: "",
      servicesNeeded: "",
      workHistory: "",
      skills: "",
      interests: "",
      status: VRSClientStatus.INTAKE,
      assignedSpecialistId: "",
    },
  });

  useEffect(() => {
    const fetchClient = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await vrsService.getClientById(clientId);

        if (response.success && response.data) {
          const clientData = response.data;
          setClient(clientData);

          // Format date for input
          const dob = new Date(clientData.dateOfBirth);
          const formattedDob = dob.toISOString().split("T")[0];

          // Format workHistory
          let workHistoryStr = "";
          if (clientData.workHistory) {
            try {
              workHistoryStr = JSON.stringify(clientData.workHistory, null, 2);
            } catch {
              workHistoryStr = String(clientData.workHistory);
            }
          }

          form.reset({
            firstName: clientData.firstName,
            lastName: clientData.lastName,
            dateOfBirth: formattedDob,
            email: clientData.email || "",
            phone: clientData.phone || "",
            eligibilityType: clientData.eligibilityType,
            servicesNeeded: Array.isArray(clientData.servicesNeeded)
              ? clientData.servicesNeeded.join("\n")
              : "",
            workHistory: workHistoryStr,
            skills: Array.isArray(clientData.skills)
              ? clientData.skills.join("\n")
              : "",
            interests: Array.isArray(clientData.interests)
              ? clientData.interests.join("\n")
              : "",
            status: clientData.status,
            assignedSpecialistId: clientData.assignedSpecialistId || "",
          });

          setTitle(
            `Edit Client: ${getClientDisplayName(
              clientData.firstName,
              clientData.lastName
            )}`
          );
          setDescription("Update client information");
        } else {
          setError(response.message || "Failed to load client");
        }
      } catch (err) {
        console.error("Error fetching client:", err);
        setError(err instanceof Error ? err.message : "Failed to load client");
      } finally {
        setIsLoading(false);
      }
    };

    if (clientId) {
      fetchClient();
    }
  }, [clientId, form, setTitle, setDescription]);

  const handleSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);

    try {
      // Parse workHistory JSON if provided
      let workHistoryJson: unknown = [];
      if (data.workHistory && data.workHistory.trim()) {
        try {
          workHistoryJson = JSON.parse(data.workHistory);
        } catch {
          // If not valid JSON, wrap in array
          workHistoryJson = [data.workHistory];
        }
      }

      const clientData = {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        email: data.email || undefined,
        phone: data.phone || undefined,
        eligibilityType: data.eligibilityType,
        servicesNeeded: Array.isArray(data.servicesNeeded)
          ? data.servicesNeeded
          : typeof data.servicesNeeded === "string"
            ? data.servicesNeeded
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        workHistory: workHistoryJson,
        skills: Array.isArray(data.skills)
          ? data.skills
          : typeof data.skills === "string"
            ? data.skills
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        interests: Array.isArray(data.interests)
          ? data.interests
          : typeof data.interests === "string"
            ? data.interests
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        status: data.status,
        assignedSpecialistId: data.assignedSpecialistId || undefined,
      };

      const response = await vrsService.updateClient(clientId, clientData);

      if (response.success) {
        toast.success("Client updated successfully");
        router.push(`/vrs/clients/${clientId}`);
      } else {
        toast.error(response.message || "Failed to update client");
      }
    } catch (err) {
      console.error("Error updating client:", err);
      toast.error("Failed to update client");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <VRSLoadingState message="Loading client..." />;
  }

  if (error || !client) {
    return (
      <VRSErrorState
        message={error || "Client not found"}
        action={{
          label: "Back to Clients",
          onClick: () => router.push("/vrs/clients"),
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
          <h1 className="text-3xl font-bold text-foreground">Edit Client</h1>
          <p className="text-muted-foreground mt-1">
            Update client information
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Demographics</CardTitle>
            <CardDescription>Basic client information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input id="firstName" {...form.register("firstName")} />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input id="lastName" {...form.register("lastName")} />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">
                Date of Birth <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...form.register("dateOfBirth")}
              />
              {form.formState.errors.dateOfBirth && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.dateOfBirth.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" {...form.register("phone")} />
                {form.formState.errors.phone && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>VRS Information</CardTitle>
            <CardDescription>VRS-specific client details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eligibilityType">
                Eligibility Type <span className="text-destructive">*</span>
              </Label>
              <Input
                id="eligibilityType"
                placeholder="e.g., DISABILITY, VETERAN"
                {...form.register("eligibilityType")}
              />
              {form.formState.errors.eligibilityType && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.eligibilityType.message}
                </p>
              )}
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
                      {Object.values(VRSClientStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedSpecialistId">
                Assigned Specialist ID
              </Label>
              <Input
                id="assignedSpecialistId"
                placeholder="Specialist user ID"
                {...form.register("assignedSpecialistId")}
              />
              {form.formState.errors.assignedSpecialistId && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.assignedSpecialistId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="servicesNeeded">
                Services Needed (one per line)
              </Label>
              <Textarea
                id="servicesNeeded"
                rows={3}
                placeholder="Job coaching&#10;Skills training&#10;Assistive technology"
                {...form.register("servicesNeeded", {
                  setValueAs: (value: string) => {
                    if (!value || !value.trim()) return [];
                    return value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean);
                  },
                })}
              />
              {form.formState.errors.servicesNeeded && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.servicesNeeded.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter one service per line
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills (one per line)</Label>
              <Textarea
                id="skills"
                rows={3}
                placeholder="Customer service&#10;Data entry&#10;Microsoft Office"
                {...form.register("skills", {
                  setValueAs: (value: string) => {
                    if (!value || !value.trim()) return [];
                    return value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean);
                  },
                })}
              />
              {form.formState.errors.skills && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.skills.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter one skill per line
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interests">Interests (one per line)</Label>
              <Textarea
                id="interests"
                rows={3}
                placeholder="Technology&#10;Healthcare&#10;Education"
                {...form.register("interests", {
                  setValueAs: (value: string) => {
                    if (!value || !value.trim()) return [];
                    return value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean);
                  },
                })}
              />
              {form.formState.errors.interests && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.interests.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter one interest per line
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workHistory">Work History (JSON)</Label>
              <Textarea
                id="workHistory"
                placeholder='[{"company": "ABC Corp", "position": "Assistant", "duration": "2 years"}]'
                {...form.register("workHistory")}
                rows={4}
              />
              {form.formState.errors.workHistory && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.workHistory.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter work history as JSON array or plain text
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
                Updating...
              </>
            ) : (
              "Update Client"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function EditClientPage() {
  return (
    <RequirePermission
      permission={VRS_CAPABILITIES.CLIENTS_UPDATE}
      title="Access Restricted"
      description="You don't have permission to update clients."
    >
      <EditClientPageContent />
    </RequirePermission>
  );
}
