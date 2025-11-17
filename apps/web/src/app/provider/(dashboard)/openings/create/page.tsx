"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  openingService,
  homeService,
  CreateOpeningData,
  Home,
} from "@/lib/api";
import { useProviderId } from "@/hooks/use-provider-data";
import { useProviderHomes } from "@/hooks/use-provider-homes";
import { usePageMetadata } from "../../use-page-metadata";
import {
  OpeningForm,
  OpeningFormFields,
} from "@/components/forms/opening-form";
import { useOpeningTemplates } from "@/hooks/use-opening-templates";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2 } from "lucide-react";
import { RequirePermission } from "@/components/auth/require-permission";
import { PROVIDER_CAPABILITIES } from "@/lib/permissions/provider-capabilities";

function CreateOpeningPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const providerId = useProviderId();
  const { homes, isLoading: isLoadingHomes } = useProviderHomes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<OpeningFormFields | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const { templates, deleteTemplate, getTemplate } = useOpeningTemplates();

  // Set page metadata
  useEffect(() => {
    setTitle("Create Opening");
    setDescription("Add a new bed opening for a home");
  }, [setTitle, setDescription]);

  const handleSubmit = async (data: OpeningFormFields) => {
    if (!providerId) {
      toast.error("Provider not found");
      return;
    }

    setIsSubmitting(true);

    try {
      const openingData: CreateOpeningData = {
        homeId: data.homeId,
        spotsAvailable: data.spotsAvailable,
        availableFrom: data.availableFrom.toISOString(),
        availableUntil: data.availableUntil?.toISOString(),
        ageMin: data.ageMin || undefined,
        ageMax: data.ageMax || undefined,
        genderPreference: data.genderPreference || undefined,
        careLevels: data.careLevels || [],
        supportedNeeds: data.supportedNeeds || [],
        acceptedPayers: data.acceptedPayers || [],
        privatePayRate: data.privatePayRate || undefined,
      };

      await openingService.createOpening(data.homeId, openingData);
      toast.success("Opening created successfully");
      router.push("/provider/openings");
    } catch (err) {
      console.error("Error creating opening:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create opening"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = getTemplate(templateId);
    if (template) {
      // Set today as availableFrom and 30 days from now as availableUntil
      const today = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(today.getDate() + 30);

      setSelectedTemplate({
        ...template.data,
        availableFrom: today,
        availableUntil: thirtyDaysLater,
      } as OpeningFormFields);
      setTemplateDialogOpen(false);
      toast.success(`Template "${template.name}" loaded`);
    }
  };

  const handleDeleteTemplate = (templateId: string, templateName: string) => {
    if (
      confirm(`Are you sure you want to delete the template "${templateName}"?`)
    ) {
      deleteTemplate(templateId);
      toast.success("Template deleted");
    }
  };

  if (isLoadingHomes) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading homes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create Opening</h1>
          <p className="text-muted-foreground mt-1">
            Add a new bed opening for a home
          </p>
        </div>
      </div>

      {/* Template Selection */}
      {templates.length > 0 && (
        <Card variant="healthcare">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Opening Templates</CardTitle>
                <CardDescription>
                  Use a saved template to quickly create a new opening
                </CardDescription>
              </div>
              <Dialog
                open={templateDialogOpen}
                onOpenChange={setTemplateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Select Template</DialogTitle>
                    <DialogDescription>
                      Choose a template to pre-fill the opening form
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {templates.map((template) => (
                      <Card
                        key={template.id}
                        variant="healthcare"
                        className="p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{template.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Created{" "}
                              {format(
                                new Date(template.createdAt),
                                "MMM d, yyyy"
                              )}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span>
                                {template.data.spotsAvailable} spot
                                {template.data.spotsAvailable !== 1 ? "s" : ""}
                              </span>
                              {template.data.careLevels.length > 0 && (
                                <span>
                                  • {template.data.careLevels.length} care level
                                  {template.data.careLevels.length !== 1
                                    ? "s"
                                    : ""}
                                </span>
                              )}
                              {template.data.acceptedPayers.length > 0 && (
                                <span>
                                  • {template.data.acceptedPayers.length} payer
                                  {template.data.acceptedPayers.length !== 1
                                    ? "s"
                                    : ""}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleLoadTemplate(template.id)}
                            >
                              Use
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDeleteTemplate(
                                      template.id,
                                      template.name
                                    )
                                  }
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
        </Card>
      )}

      <OpeningForm
        mode="create"
        homes={homes}
        initialData={selectedTemplate || undefined}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onCancel={() => router.back()}
      />
    </div>
  );
}

export default function CreateOpeningPage() {
  return (
    <RequirePermission
      permission={PROVIDER_CAPABILITIES.OPENINGS_MANAGE}
      title="Access Restricted"
      description="You don't have permission to create openings. Please contact your organization administrator if you need access."
    >
      <CreateOpeningPageContent />
    </RequirePermission>
  );
}
