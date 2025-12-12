"use client";

import { useState, useEffect, useCallback } from "react";
import { usePageMetadata } from "../use-page-metadata";
import { licenseCategoryService } from "@/lib/api";
import { LicenseCategory } from "@carelink/types";
import { toast } from "sonner";
import { format } from "date-fns";
import { RequirePermission } from "@/components/auth/require-permission";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  FolderOpen,
} from "lucide-react";

function LicenseCategoriesPageContent() {
  const { setTitle, setDescription } = usePageMetadata();
  const [categories, setCategories] = useState<LicenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<LicenseCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<LicenseCategory | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    isActive: true,
    order: 0,
  });

  useEffect(() => {
    setTitle("License Categories");
    setDescription("Manage license categories and types");
  }, [setTitle, setDescription]);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await licenseCategoryService.getAllCategories(true);
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        setError(response.message || "Failed to load categories");
        toast.error(response.message || "Failed to load categories");
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories");
      toast.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      isActive: true,
      order: categories.length,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (category: LicenseCategory) => {
    setEditingCategory(category);
    setFormData({
      code: category.code,
      name: category.name,
      description: category.description || "",
      isActive: category.isActive,
      order: category.order,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (category: LicenseCategory) => {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      toast.error("Code and name are required");
      return;
    }

    setIsSaving(true);
    try {
      const response = editingCategory
        ? await licenseCategoryService.updateCategory(editingCategory.id, formData)
        : await licenseCategoryService.createCategory(formData);

      if (response.success) {
        toast.success(
          editingCategory
            ? "Category updated successfully"
            : "Category created successfully"
        );
        setIsDialogOpen(false);
        fetchCategories();
      } else {
        toast.error(response.message || "Failed to save category");
      }
    } catch (err) {
      console.error("Error saving category:", err);
      toast.error("Failed to save category");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;

    setIsSaving(true);
    try {
      const response = await licenseCategoryService.deleteCategory(
        deletingCategory.id
      );

      if (response.success) {
        toast.success("Category deleted successfully");
        setIsDeleteDialogOpen(false);
        setDeletingCategory(null);
        fetchCategories();
      } else {
        toast.error(response.message || "Failed to delete category");
      }
    } catch (err: any) {
      console.error("Error deleting category:", err);
      // Extract error message from response or use generic message
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to delete category";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && categories.length === 0) {
    return <LoadingState message="Loading categories..." fullHeight />;
  }

  if (error && categories.length === 0) {
    return (
      <ErrorState
        title="Error Loading Categories"
        message={error}
        action={{
          label: "Retry",
          onClick: fetchCategories,
          variant: "healthcare",
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="healthcare">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>License Categories</CardTitle>
              <CardDescription>
                Manage main license categories and their subcategories
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={fetchCategories}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="healthcare" onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No categories found"
              description="Create your first license category to get started"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Types</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-mono text-sm">
                      {category.code}
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {category.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {category.licenseTypes?.length || 0} types
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{category.order}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Create Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the license category details"
                : "Add a new license category"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g., ASSISTED_LIVING"
                  disabled={!!editingCategory}
                />
              </div>
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Assisted Living"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this category"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button variant="healthcare" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LicenseCategoriesPage() {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.SYSTEM_MANAGE}
      title="Access Restricted"
      description="You don't have permission to manage license categories."
    >
      <LicenseCategoriesPageContent />
    </RequirePermission>
  );
}
