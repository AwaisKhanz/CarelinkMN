"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Loader2,
  Calendar,
} from "lucide-react";
import { FileUploader, UploadedFile } from "@/components/ui/file-uploader";
import { placementService } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSocket } from "@/hooks/use-socket";

import { PlacementDocument, DocumentCategory } from "@carelink/types";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_COLORS,
} from "@/lib/constants";

interface DocumentsTabProps {
  placementId: string;
}

export function DocumentsTab({ placementId }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<PlacementDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await placementService.getDocuments(placementId);
      if (response.success && response.data) {
        setDocuments(response.data);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [placementId]);

  // Socket integration
  const { socket, joinPlacement, leavePlacement } = useSocket();

  useEffect(() => {
    if (!socket) return;

    joinPlacement(placementId);

    const handleDocumentUploaded = (data: { document: PlacementDocument }) => {
      setDocuments((prev) => [data.document, ...prev]);
      toast.info("New document uploaded");
    };

    const handleDocumentDeleted = (data: { documentId: string }) => {
      setDocuments((prev) => prev.filter((d) => d.id !== data.documentId));
      toast.info("Document deleted");
    };

    socket.on("placement:document:uploaded", handleDocumentUploaded);
    socket.on("placement:document:deleted", handleDocumentDeleted);

    return () => {
      leavePlacement(placementId);
      socket.off("placement:document:uploaded", handleDocumentUploaded);
      socket.off("placement:document:deleted", handleDocumentDeleted);
    };
  }, [socket, placementId, joinPlacement, leavePlacement]);

  const handleUploadComplete = async (file: UploadedFile) => {
    if (!selectedCategory) {
      toast.error("Please select a document category");
      return;
    }

    try {
      setIsUploading(true);
      const response = await placementService.uploadDocument(placementId, {
        fileName: file.fileName,
        fileType: file.mimeType || "application/octet-stream",
        fileSize: file.fileSize || 0,
        category: selectedCategory as DocumentCategory,
        storageUrl: file.url,
        notes: uploadNotes.trim() || undefined,
      });

      if (response.success) {
        toast.success("Document uploaded successfully");
        setUploadDialogOpen(false);
        setSelectedCategory("");
        setUploadNotes("");
        setUploadedFiles([]);
        await fetchDocuments();
      } else {
        toast.error(response.message || "Failed to save document");
      }
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to save document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      const response = await placementService.deleteDocument(documentId);
      if (response.success) {
        toast.success("Document deleted successfully");
        await fetchDocuments();
      } else {
        toast.error(response.message || "Failed to delete document");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const groupedDocuments = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, PlacementDocument[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Placement Documents</h3>
          <p className="text-sm text-muted-foreground">
            Manage documents related to this placement
          </p>
        </div>
        <Button
          variant="healthcare"
          onClick={() => setUploadDialogOpen(true)}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Documents by Category */}
      {Object.keys(groupedDocuments).length === 0 ? (
        <Card variant="healthcare">
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No documents uploaded yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedDocuments).map(([category, docs]) => (
          <Card key={category} variant="healthcare">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {DOCUMENT_CATEGORIES[category as DocumentCategory] || category}
                </CardTitle>
                <Badge variant={(DOCUMENT_CATEGORY_COLORS[category as DocumentCategory] as any) || "outline"}>
                  {docs.length} {docs.length === 1 ? "document" : "documents"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{doc.fileName}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>•</span>
                          <span>
                            Uploaded {format(new Date(doc.uploadedAt), "MMM dd, yyyy")}
                          </span>
                          {doc.expiresAt && (
                            <>
                              <span>•</span>
                              <span className="text-warning flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Expires {format(new Date(doc.expiresAt), "MMM dd, yyyy")}
                              </span>
                            </>
                          )}
                        </div>
                        {doc.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {doc.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.storageUrl, "_blank")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(doc.id, doc.fileName)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add a new document to this placement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this document..."
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Document File <span className="text-destructive">*</span>
              </Label>
              <FileUploader
                documentType="placement-document"
                folder={`placements/${placementId}/documents`}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                maxSize={10 * 1024 * 1024} // 10MB
                maxFiles={1}
                multiple={false}
                files={uploadedFiles}
                onFilesChange={setUploadedFiles}
                label="Upload Document"
                description="Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)"
                showPreview={true}
                variant="healthcare"
                onUploadComplete={handleUploadComplete}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setSelectedCategory("");
                setUploadNotes("");
                setUploadedFiles([]);
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
