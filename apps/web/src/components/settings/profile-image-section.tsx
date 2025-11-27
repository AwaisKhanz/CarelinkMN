"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FileUploader, UploadedFile } from "@/components/ui/file-uploader";
import { Button } from "@/components/ui/button";
import { Save, Loader2, User } from "lucide-react";
import { toast } from "sonner";

interface ProfileImageSectionProps {
  currentProfileImage?: string;
  onSave?: (profileImageUrl: string) => Promise<void>;
}

export function ProfileImageSection({ currentProfileImage, onSave }: ProfileImageSectionProps) {
  const [profileImageFiles, setProfileImageFiles] = useState<UploadedFile[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentProfileImage) {
      const imageUrl = currentProfileImage.toLowerCase();
      let imageMimeType = "image/jpeg";
      if (imageUrl.includes(".png")) imageMimeType = "image/png";
      else if (imageUrl.includes(".gif")) imageMimeType = "image/gif";
      else if (imageUrl.includes(".webp")) imageMimeType = "image/webp";

      setProfileImageFiles([{
        url: currentProfileImage,
        fileName: "profile-image",
        isPrimary: true,
        mimeType: imageMimeType,
      }]);
    }
  }, [currentProfileImage]);

  const handleSave = async () => {
    if (!onSave || !profileImageFiles[0]?.url) return;

    setIsSaving(true);
    try {
      await onSave(profileImageFiles[0].url);
      toast.success("Profile picture updated successfully!");
    } catch (err) {
      console.error("Error updating profile picture:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update profile picture");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card variant="healthcare">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <CardTitle>Profile Picture</CardTitle>
        </div>
        <CardDescription>
          Upload your personal profile picture
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Profile Picture</Label>
          <FileUploader
            documentType="image"
            folder="users/profile-images"
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            maxFiles={1}
            multiple={false}
            files={profileImageFiles}
            onFilesChange={setProfileImageFiles}
            label="Upload Profile Picture"
            description="Upload your profile picture (JPG, PNG, max 5MB)"
            showPreview={true}
            previewSize="md"
            variant="healthcare"
          />
          <p className="text-xs text-muted-foreground">
            This image will be displayed in the sidebar and messages
          </p>
        </div>

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
                Save Picture
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
