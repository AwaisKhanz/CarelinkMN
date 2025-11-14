"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, CheckCircle, Eye, X, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  uploadService,
  FileUploadResponse,
} from "@/lib/api/services/upload.service";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  url: string;
  fileName: string;
  fileSize?: number;
  caption?: string;
  isPrimary?: boolean;
  order?: number;
  mimeType?: string;
}

interface FileUploaderProps {
  // Upload configuration
  documentType?: string;
  folder?: string;
  accept?: string; // e.g., "image/*", ".pdf,.jpg,.jpeg,.png"
  maxSize?: number; // in bytes, default 10MB
  maxFiles?: number; // maximum number of files allowed
  multiple?: boolean; // allow multiple file selection

  // File management
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;

  // Display options
  label?: string;
  description?: string;
  showPreview?: boolean;
  showPrimaryToggle?: boolean; // Allow marking first file as primary
  previewSize?: "sm" | "md" | "lg"; // Preview thumbnail size

  // Styling
  className?: string;
  variant?: "default" | "healthcare";

  // Callbacks
  onUploadStart?: () => void;
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: Error) => void;
}

export function FileUploader({
  documentType = "document",
  folder = "general",
  accept = "image/*",
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles,
  multiple = false,
  files = [],
  onFilesChange,
  label = "Upload Files",
  description,
  showPreview = true,
  showPrimaryToggle = false,
  previewSize = "md",
  className,
  variant = "default",
  onUploadStart,
  onUploadComplete,
  onUploadError,
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    // Check max files limit
    if (maxFiles && files.length + selectedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} file(s) allowed`);
      return;
    }

    // Validate and upload files
    const filesToUpload = Array.from(selectedFiles);
    setUploading(true);
    setUploadProgress(0);

    if (onUploadStart) {
      onUploadStart();
    }

    try {
      const uploadPromises = filesToUpload.map(async (file, index) => {
        // Validate file size
        if (file.size > maxSize) {
          throw new Error(
            `File "${file.name}" exceeds maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`
          );
        }

        // Validate file type
        if (accept && accept !== "*" && accept !== "*/*") {
          const acceptedTypes = accept.split(",").map((t) => t.trim());
          const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
          const fileType = file.type;

          const isAccepted = acceptedTypes.some((accepted) => {
            if (accepted.startsWith(".")) {
              return fileExtension === accepted.toLowerCase();
            }
            if (accepted.includes("*")) {
              const baseType = accepted.split("/")[0];
              return fileType.startsWith(baseType + "/");
            }
            return fileType === accepted;
          });

          if (!isAccepted) {
            throw new Error(
              `File "${file.name}" is not an accepted type. Accepted: ${accept}`
            );
          }
        }

        // Upload file
        const result: FileUploadResponse = await uploadService.uploadFile(
          file,
          documentType,
          folder
        );

        const uploadedFile: UploadedFile = {
          url: result.url,
          fileName: result.fileName,
          fileSize: result.fileSize,
          caption: "",
          isPrimary: files.length === 0 && index === 0 && showPrimaryToggle,
          order: files.length + index,
          mimeType: result.mimeType,
        };

        return uploadedFile;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const newFiles = [...files, ...uploadedFiles];
      onFilesChange(newFiles);

      // Call completion callback for each file
      uploadedFiles.forEach((file) => {
        if (onUploadComplete) {
          onUploadComplete(file);
        }
      });

      toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload file(s)";
      toast.error(errorMessage);

      if (onUploadError) {
        onUploadError(error instanceof Error ? error : new Error(errorMessage));
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    // Reorder files and update primary
    const reorderedFiles = newFiles.map((file, i) => ({
      ...file,
      order: i,
      isPrimary: showPrimaryToggle && i === 0 ? true : file.isPrimary,
    }));
    onFilesChange(reorderedFiles);
  };

  const togglePrimary = (index: number) => {
    if (!showPrimaryToggle) return;
    const newFiles = files.map((file, i) => ({
      ...file,
      isPrimary: i === index,
    }));
    onFilesChange(newFiles);
  };

  const openFile = (url: string) => {
    window.open(url, "_blank");
  };

  const getPreviewSizeClass = () => {
    switch (previewSize) {
      case "sm":
        return "h-16";
      case "lg":
        return "h-32";
      default:
        return "h-24";
    }
  };

  const isImage = (mimeType?: string, url?: string) => {
    // Check mimeType first (most reliable)
    if (mimeType?.startsWith("image/")) {
      return true;
    }
    // Fallback: check file extension in URL if mimeType is not available
    if (url) {
      const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"];
      const lowerUrl = url.toLowerCase();
      return imageExtensions.some((ext) => lowerUrl.includes(ext));
    }
    return false;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors",
          variant === "healthcare"
            ? "border-primary/20 hover:border-primary/40"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          uploading && "opacity-50 pointer-events-none"
        )}
      >
        <div className="text-center">
          {uploading ? (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          ) : (
            <>
              <Upload
                className={cn(
                  "h-8 w-8 mx-auto mb-2",
                  variant === "healthcare"
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              />
              <p className="text-sm text-muted-foreground mb-1">{label}</p>
              {description && (
                <p className="text-xs text-muted-foreground mb-2">
                  {description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mb-4">
                Maximum file size: {Math.round(maxSize / 1024 / 1024)}MB
                {maxFiles && ` • Maximum ${maxFiles} file(s)`}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept={accept}
                onChange={handleFileSelect}
                className="hidden"
                id={`file-upload-${documentType}`}
                disabled={
                  uploading || (maxFiles ? files.length >= maxFiles : false)
                }
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={
                  uploading || (maxFiles ? files.length >= maxFiles : false)
                }
              >
                Choose File{multiple ? "s" : ""}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* File Preview List */}
      {showPreview && files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Uploaded Files ({files.length}
              {maxFiles && `/${maxFiles}`})
            </p>
          </div>
          <div
            className={cn(
              "grid gap-4",
              previewSize === "sm"
                ? "grid-cols-4"
                : previewSize === "lg"
                  ? "grid-cols-2"
                  : "grid-cols-2 md:grid-cols-4"
            )}
          >
            {files.map((file, index) => (
              <div key={index} className="relative group">
                <div
                  className={cn(
                    "relative rounded-lg overflow-hidden border-2 transition-all",
                    file.isPrimary
                      ? "border-primary"
                      : "border-muted-foreground/25",
                    showPrimaryToggle &&
                      "cursor-pointer hover:border-primary/50"
                  )}
                  onClick={() => showPrimaryToggle && togglePrimary(index)}
                >
                  {isImage(file.mimeType, file.url) ? (
                    <img
                      src={file.url}
                      alt={file.caption || file.fileName}
                      className={cn(
                        "w-full object-cover",
                        getPreviewSizeClass()
                      )}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className={cn(
                        "w-full flex items-center justify-center bg-muted",
                        getPreviewSizeClass()
                      )}
                    >
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  {file.isPrimary && (
                    <Badge
                      className="absolute top-2 left-2 text-xs"
                      variant="healthcareSuccess"
                    >
                      Primary
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openFile(file.url);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {file.caption && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {file.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
