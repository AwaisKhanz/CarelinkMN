"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
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
  Plus,
  Edit,
  Trash2,
  Loader2,
  FileText,
  Copy,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  messageTemplateService,
  MessageTemplate,
  CreateMessageTemplateData,
  UpdateMessageTemplateData,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../../use-page-metadata";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { RequirePermission } from "@/components/auth/require-permission";
import { CASE_MANAGER_CAPABILITIES } from "@/lib/permissions/capabilities";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const templateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Template name must be less than 100 characters"),
  subject: z
    .string()
    .max(200, "Subject must be less than 200 characters")
    .optional(),
  content: z
    .string()
    .min(1, "Template content is required")
    .max(10000, "Content must be less than 10000 characters"),
  category: z
    .string()
    .max(50, "Category must be less than 50 characters")
    .optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

const TEMPLATE_CATEGORIES = [
  "INITIAL_OUTREACH",
  "FOLLOW_UP",
  "URGENT",
  "GENERAL",
] as const;

const TEMPLATE_VARIABLES = [
  { key: "referralNumber", label: "Referral Number", example: "{referralNumber}" },
  { key: "clientInitials", label: "Client Initials", example: "{clientInitials}" },
  { key: "clientAge", label: "Client Age", example: "{clientAge}" },
  { key: "providerName", label: "Provider Name", example: "{providerName}" },
  { key: "caseManagerName", label: "Case Manager Name", example: "{caseManagerName}" },
  { key: "organizationName", label: "Organization Name", example: "{organizationName}" },
] as const;

function MessageTemplatesPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<MessageTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      subject: "",
      content: "",
      category: undefined,
    },
  });

  useEffect(() => {
    setTitle("Message Templates");
    setDescription("Create and manage message templates for batch messaging");
  }, [setTitle, setDescription]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await messageTemplateService.getTemplates(true);
      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        toast.error(response.message || "Failed to load templates");
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    form.reset({
      name: "",
      subject: "",
      content: "",
      category: undefined,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      subject: template.subject || "",
      content: template.content,
      category: template.category || undefined,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (template: MessageTemplate) => {
    setDeletingTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async (data: TemplateFormData) => {
    setIsSaving(true);
    try {
      if (editingTemplate) {
        const updateData: UpdateMessageTemplateData = {
          name: data.name,
          subject: data.subject || undefined,
          content: data.content,
          category: data.category || undefined,
        };
        const response = await messageTemplateService.updateTemplate(
          editingTemplate.id,
          updateData
        );
        if (response.success) {
          toast.success("Template updated successfully");
          setIsDialogOpen(false);
          await fetchTemplates();
        } else {
          toast.error(response.message || "Failed to update template");
        }
      } else {
        const createData: CreateMessageTemplateData = {
          name: data.name,
          subject: data.subject || undefined,
          content: data.content,
          category: data.category || undefined,
        };
        const response = await messageTemplateService.createTemplate(createData);
        if (response.success) {
          toast.success("Template created successfully");
          setIsDialogOpen(false);
          await fetchTemplates();
        } else {
          toast.error(response.message || "Failed to create template");
        }
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTemplate) return;

    setIsDeleting(true);
    try {
      const response = await messageTemplateService.deleteTemplate(
        deletingTemplate.id
      );
      if (response.success) {
        toast.success("Template deleted successfully");
        setIsDeleteDialogOpen(false);
        setDeletingTemplate(null);
        await fetchTemplates();
      } else {
        toast.error(response.message || "Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Template content copied to clipboard");
  };

  const insertVariable = (variable: string) => {
    const currentContent = form.getValues("content");
    const cursorPosition = (document.activeElement as HTMLTextAreaElement)?.selectionStart || currentContent.length;
    const newContent =
      currentContent.slice(0, cursorPosition) +
      `{${variable}}` +
      currentContent.slice(cursorPosition);
    form.setValue("content", newContent);
  };

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Message Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage reusable message templates for batch messaging
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <Card variant="healthcare">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card variant="healthcare">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== "all"
                  ? "No templates match your filters"
                  : "Get started by creating your first message template"}
              </p>
              {!searchQuery && selectedCategory === "all" && (
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} variant="healthcare" className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.category && (
                      <Badge variant="outline" className="mt-2">
                        {template.category.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {template.subject && (
                  <CardDescription className="mt-2">
                    Subject: {template.subject}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {template.content}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Used {template.usageCount} time{template.usageCount !== 1 ? "s" : ""}
                  </span>
                  {template.lastUsedAt && (
                    <span>
                      Last used {format(new Date(template.lastUsedAt), "MMM d, yyyy")}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create Template"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Update your message template"
                : "Create a new reusable message template"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="e.g., Initial Outreach"
                className="mt-1"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.watch("category") || ""}
                onValueChange={(value) => form.setValue("category", value || undefined)}
              >
                <SelectTrigger id="category" className="mt-1">
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Input
                id="subject"
                {...form.register("subject")}
                placeholder="Email subject line"
                className="mt-1"
              />
              {form.formState.errors.subject && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.subject.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="content">Template Content *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Available variables:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {TEMPLATE_VARIABLES.map((variable) => (
                      <Button
                        key={variable.key}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => insertVariable(variable.key)}
                        title={variable.label}
                      >
                        {variable.example}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <Textarea
                id="content"
                {...form.register("content")}
                placeholder="Enter your message template. Use {variableName} for dynamic content."
                rows={10}
                className="mt-1 font-mono text-sm"
              />
              {form.formState.errors.content && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.content.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {form.watch("content")?.length || 0} / 10000 characters
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    {editingTemplate ? "Update Template" : "Create Template"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTemplate?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function MessageTemplatesPage() {
  return (
    <RequirePermission
      permission={CASE_MANAGER_CAPABILITIES.MESSAGES_MANAGE}
      title="Access Restricted"
      description="You don't have permission to manage message templates."
    >
      <MessageTemplatesPageContent />
    </RequirePermission>
  );
}

