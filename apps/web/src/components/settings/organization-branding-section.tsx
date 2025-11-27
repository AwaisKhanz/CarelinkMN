"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FileUploader, UploadedFile } from "@/components/ui/file-uploader";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface OrganizationBrandingSectionProps {
  organizationId?: string;
  organizationName?: string;
  currentLogo?: string;
  currentCoverImage?: string;
  canEdit?: boolean; // Permission check - only org admins can edit
  onSave?: (data: { logo?: string; coverImage?: string }) => Promise<void>;
}

export function OrganizationBrandingSection({
  organizationId,
  organizationName,
  currentLogo,
  currentCoverImage,
  canEdit = false,
  onSave,
}: OrganizationBrandingSectionProps) {
  const [logoFiles, setLogoFiles] = useState<UploadedFile[]>([]);
  const [coverImageFiles, setCoverImageFiles] = useState<UploadedFile[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing images
  useEffect(() => {
    if (currentLogo) {
      const logoUrl = currentLogo.toLowerCase();
      let logoMimeType = "image/jpeg";
      if (logoUrl.includes(".png")) logoMimeType = "image/png";
      else if (logoUrl.includes(".gif")) logoMimeType = "image/gif";
      else if (logoUrl.includes(".webp")) logoMimeType = "image/webp";

      setLogoFiles([{
        url: currentLogo,
        fileName: "organization-logo",
        isPrimary: true,
        mimeType: logoMimeType,
      }]);
    }

    if (currentCoverImage) {
      const coverUrl = currentCoverImage.toLowerCase();
      let coverMimeType = "image/jpeg";
      if (coverUrl.includes(".png")) coverMimeType = "image/png";
      else if (coverUrl.includes(".gif")) coverMimeType = "image/gif";
      else if (coverUrl.includes(".webp")) coverMimeType = "image/webp";

      setCoverImageFiles([{
        url: currentCoverImage,
        fileName: "organization-cover",
        isPrimary: true,
        mimeType: coverMimeType,
      }]);
    }
  }, [currentLogo, currentCoverImage]);

  const handleSave = async () => {
    if (!onSave || !canEdit) return;

    setIsSaving(true);
    try {
      const updateData: { logo?: string; coverImage?: string } = {};
      
      if (logoFiles.length > 0 && logoFiles[0].url) {
        updateData.logo = logoFiles[0].url;
      }
      
      if (coverImageFiles.length > 0 && coverImageFiles[0].url) {
        updateData.coverImage = coverImageFiles[0].url;
      }

      await onSave(updateData);
      toast.success("Organization branding updated successfully!");
    } catch (err) {
      console.error("Error updating organization branding:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update organization branding");
    } finally {
      setIsSaving(false);
    }
  };

  if (!organizationId) {
    return null; // Don't show if user doesn't belong to an organization
  }

  return (
    <Card variant="healthcare">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Organization Branding</CardTitle>
          </div>
          {!canEdit && (
            <Badge variant="healthcareWarning" className="text-xs">
              View Only
            </Badge>
          )}
        </div>
        <CardDescription>
          {canEdit 
            ? `Manage branding for ${organizationName || "your organization"}`
            : `Organization branding for ${organizationName || "your organization"}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Organization Logo */}
        <div className="space-y-2">
          <Label>Organization Logo</Label>
          <FileUploader
            documentType="image"
            folder="organizations/logos"
            accept="image/*"
            maxSize={5 * 1024 * 1024} // 5MB
            maxFiles={1}
            multiple={false}
            files={logoFiles}
            onFilesChange={canEdit ? setLogoFiles : () => {}}
            label="Upload Organization Logo"
            description="Upload your organization's logo (JPG, PNG, max 5MB)"
            showPreview={true}
            previewSize="md"
            variant="healthcare"
          />
          {!canEdit && (
            <p className="text-xs text-muted-foreground">
              Only organization administrators can update branding
            </p>
          )}
        </div>

        {/* Organization Cover Image */}
        <div className="space-y-2">
          <Label>Organization Cover Image</Label>
          <FileUploader
            documentType="image"
            folder="organizations/cover-images"
            accept="image/*"
            maxSize={10 * 1024 * 1024} // 10MB
            maxFiles={1}
            multiple={false}
            files={coverImageFiles}
            onFilesChange={canEdit ? setCoverImageFiles : () => {}}
            label="Upload Cover Image"
            description="Upload a cover image for your organization (JPG, PNG, max 10MB)"
            showPreview={true}
            previewSize="lg"
            variant="healthcare"
          />
        </div>

        {/* Save Button - Only show if user can edit */}
        {canEdit && (
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="healthcare"
              className="min-w-32"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Branding
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
