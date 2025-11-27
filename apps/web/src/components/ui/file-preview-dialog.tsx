"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Download, FileText, ExternalLink, X } from "lucide-react";
import { useState } from "react";

interface FilePreviewDialogProps {
  url: string;
  fileName: string;
  fileType?: string; // Mime type
  children: React.ReactNode; // Trigger element
}

export function FilePreviewDialog({
  url,
  fileName,
  fileType,
  children,
}: FilePreviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Helper to determine content type category
  const getCategory = (mimeType?: string) => {
    if (!mimeType) return "unknown";
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType === "application/pdf") return "pdf";
    return "other";
  };

  const category = getCategory(fileType);

  const renderContent = () => {
    switch (category) {
      case "image":
        return (
          <div className="relative w-full h-full flex items-center justify-center bg-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={fileName}
              className="max-w-full max-h-[85vh] object-contain rounded-md shadow-sm"
            />
          </div>
        );
      case "video":
        return (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <video
              src={url}
              controls
              className="max-w-full max-h-[85vh] w-full rounded-md"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      case "audio":
        return (
          <div className="flex flex-col items-center justify-center p-12 gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium">{fileName}</h3>
            <audio src={url} controls className="w-full max-w-md" />
          </div>
        );
      case "pdf":
        return (
          <div className="w-full h-[85vh] bg-white rounded-md overflow-hidden">
            <iframe
              src={`${url}#view=FitH`}
              title={fileName}
              className="w-full h-full border-none"
            />
          </div>
        );
      default:
        // Fallback for Excel, Word, etc.
        return (
          <div className="flex flex-col items-center justify-center p-12 gap-6 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Preview not available</h3>
              <p className="text-muted-foreground max-w-sm">
                This file type ({fileType || "unknown"}) cannot be previewed directly.
                Please download the file to view it.
              </p>
            </div>
            <Button asChild size="lg" className="gap-2">
              <a href={url} download={fileName} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
                Download File
              </a>
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-full p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-none shadow-2xl sm:rounded-xl">
        <DialogHeader className="absolute top-0 left-0 right-0 z-50 flex flex-row items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
          <DialogTitle className="text-white drop-shadow-md truncate max-w-[70%] pointer-events-auto pl-2">
            {fileName}
          </DialogTitle>
          <div className="flex items-center gap-2 pointer-events-auto">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 text-white border-none backdrop-blur-md"
              asChild
            >
              <a href={url} download={fileName} target="_blank" rel="noopener noreferrer" title="Download">
                <Download className="h-4 w-4" />
              </a>
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 text-white border-none backdrop-blur-md"
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="min-h-[50vh] max-h-[90vh] flex items-center justify-center bg-background/50">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
