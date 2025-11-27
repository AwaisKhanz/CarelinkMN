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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Send,
  Trash2,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { placementService } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { FileUploader, UploadedFile } from "@/components/ui/file-uploader";

import { PlacementUpdate, UpdateCategory } from "@carelink/types";
import {
  UPDATE_CATEGORIES,
  UPDATE_CATEGORY_COLORS,
} from "@/lib/constants/placement";

interface UpdatesTabProps {
  placementId: string;
  readOnly?: boolean;
}

export function UpdatesTab({ placementId, readOnly = false }: UpdatesTabProps) {
  const [updates, setUpdates] = useState<PlacementUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteUpdateDialogOpen, setDeleteUpdateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<PlacementUpdate | null>(null);

  // Update form state
  const [updateForm, setUpdateForm] = useState({
    title: "",
    message: "",
    category: "",
  });
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedFile[]>([]);

  const fetchUpdates = async () => {
    try {
      setIsLoading(true);
      const response = await placementService.getUpdates(placementId);
      if (response.success && response.data) {
        setUpdates(response.data);
      }
    } catch (error) {
      console.error("Error fetching updates:", error);
      toast.error("Failed to load updates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [placementId]);

  const handleSendUpdate = async () => {
    if (!updateForm.title || !updateForm.message || !updateForm.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await placementService.createUpdate(placementId, {
        ...updateForm,
        category: updateForm.category as UpdateCategory,
        photos: uploadedPhotos.map((f) => f.url),
      });

      if (response.success) {
        toast.success("Update sent successfully");
        setUpdateDialogOpen(false);
        setUpdateForm({
          title: "",
          message: "",
          category: "",
        });
        setUploadedPhotos([]);
        await fetchUpdates();
      } else {
        toast.error(response.message || "Failed to send update");
      }
    } catch (error) {
      console.error("Error sending update:", error);
      toast.error("Failed to send update");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUpdate = (update: PlacementUpdate) => {
    setSelectedUpdate(update);
    setDeleteUpdateDialogOpen(true);
  };

  const confirmDeleteUpdate = async () => {
    if (!selectedUpdate) return;

    try {
      const response = await placementService.deleteUpdate(selectedUpdate.id);
      if (response.success) {
        toast.success("Update deleted successfully");
        setDeleteUpdateDialogOpen(false);
        setSelectedUpdate(null);
        await fetchUpdates();
      } else {
        toast.error(response.message || "Failed to delete update");
      }
    } catch (error) {
      console.error("Error deleting update:", error);
      toast.error("Failed to delete update");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="healthcare">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Placement Updates</CardTitle>
              <CardDescription>
                Send updates to family members and case managers
              </CardDescription>
            </div>
            {!readOnly && (
              <Button
                variant="healthcare"
                size="sm"
                onClick={() => setUpdateDialogOpen(true)}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Update
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No updates sent yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {updates.map((update) => (
                <div
                  key={update.id}
                  className="p-4 border border-border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{update.title}</h4>
                        <Badge variant={(UPDATE_CATEGORY_COLORS[update.category] as any) || "secondary"}>
                          {UPDATE_CATEGORIES[update.category] || update.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {update.message}
                      </p>
                      
                      {/* Photos Grid */}
                      {update.photos && update.photos.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {update.photos.map((photo, index) => (
                            <div 
                              key={index} 
                              className="relative aspect-square rounded-md overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(photo, "_blank")}
                            >
                              <img 
                                src={photo} 
                                alt={`Update photo ${index + 1}`} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        Sent {format(new Date(update.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    {!readOnly && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUpdate(update)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Update</DialogTitle>
            <DialogDescription>
              Share an update with family members and case managers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={updateForm.category}
                onValueChange={(value) => setUpdateForm({ ...updateForm, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(UPDATE_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={updateForm.title}
                onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                placeholder="Enter update title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">
                Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="message"
                value={updateForm.message}
                onChange={(e) => setUpdateForm({ ...updateForm, message: e.target.value })}
                placeholder="Enter your message..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Photos (Optional)</Label>
              <FileUploader
                documentType="placement-update"
                folder={`placements/${placementId}/updates`}
                accept="image/*"
                maxSize={5 * 1024 * 1024} // 5MB
                maxFiles={5}
                multiple={true}
                files={uploadedPhotos}
                onFilesChange={setUploadedPhotos}
                label="Upload Photos"
                description="Share photos of activities or milestones"
                variant="healthcare"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="healthcare"
              onClick={handleSendUpdate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Update
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Update Confirmation Dialog */}
      <Dialog open={deleteUpdateDialogOpen} onOpenChange={setDeleteUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Delete Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the update "{selectedUpdate?.title}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteUpdateDialogOpen(false);
                setSelectedUpdate(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUpdate}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
