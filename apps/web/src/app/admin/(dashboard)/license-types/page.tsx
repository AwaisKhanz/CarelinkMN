"use client";

import { useState, useEffect, useCallback } from "react";
import { usePageMetadata } from "../use-page-metadata";
import { licenseTypeService, licenseCategoryService } from "@/lib/api";
import { LicenseType, LicenseCategory } from "@carelink/types";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FileText,
} from "lucide-react";

function LicenseTypesPageContent() {
  const { setTitle, setDescription } = usePageMetadata();
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([]);
  const [categories, setCategories] = useState<LicenseCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingType, setEditingType] = useState<LicenseType | null>(null);
  const [deletingType, setDeletingType] = useState<LicenseType | null>(null);

  const [formData, setFormData] = useState({
    categoryId: "",
    code: "",
    name: "",
    description: "",
    isActive: true,
    order: 0,
  });

  useEffect(() => {
    setTitle("License Types");
    setDescription("Manage license types and subcategories");
  }, [setTitle, setDescription]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [typesResponse, categoriesResponse] = await Promise.all([
        licenseTypeService.getAllLicenseTypes(true),
        licenseCategoryService.getAllCategories(true),
      ]);

      if (typesResponse.success && typesResponse.data) {
        setLicenseTypes(typesResponse.data);
      }

      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      }

      if (!typesResponse.success || !categoriesResponse.success) {
        setError("Failed to load data");
        toast.error("Failed to load data");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTypes =
    selectedCategory === "all"
      ? licenseTypes
      : licenseTypes.filter((type) => type.categoryId === selectedCategory);

  const handleCreate = () => {
    setEditingType(null);
    setFormData({
      categoryId: selectedCategory !== "all" ? selectedCategory : "",
      code: "",
      name: "",
      description: "",
      isActive: true,
      order: filteredTypes.length,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (type: LicenseType) => {
    setEditingType(type);
    setFormData({
      categoryId: type.categoryId,
      code: type.code,
      name: type.name,
      description: type.description || "",
      isActive: type.isActive,
      order: type.order,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (type: LicenseType) => {
    setDeletingType(type);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.categoryId || !formData.code || !formData.name) {
      toast.error("Category, code, and name are required");
      return;
    }

    setIsSaving(true);
    try {
      const response = editingType
        ? await licenseTypeService.updateLicenseType(editingType.id, formData)
        : await licenseTypeService.createLicenseType(formData);

      if (response.success) {
        toast.success(
          editingType
            ? "License type updated successfully"
            : "License type created successfully"
        );
        setIsDialogOpen(false);
        fetchData();
      } else {
        toast.error(response.message || "Failed to save license type");
      }
    } catch (err) {
      console.error("Error saving license type:", err);
      toast.error("Failed to save license type");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingType) return;

    setIsSaving(true);
    try {
      const response = await licenseTypeService.deleteLicenseType(deletingType.id);

      if (response.success) {
        toast.success("License type deleted successfully");
        setIsDeleteDialogOpen(false);
        setDeletingType(null);
        fetchData();
      } else {
        toast.error(response.message || "Failed to delete license type");
      }
    } catch (err: any) {
      console.error("Error deleting license type:", err);
      // Extract error message from response or use generic message
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to delete license type";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Unknown";
  };

  if (isLoading && licenseTypes.length === 0) {
    return <LoadingState message="Loading license types..." fullHeight />;
  }

  if (error && licenseTypes.length === 0) {
    return (
      <ErrorState
        title="Error Loading License Types"
        message={error}
        action={{
          label: "Retry",
          onClick: fetchData,
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
              <CardTitle>License Types</CardTitle>
              <CardDescription>
                Manage license types and assign them to categories
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={fetchData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="healthcare" onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add License Type
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Filter */}
          <div className="flex items-center gap-4">
            <Label htmlFor="category-filter">Filter by Category:</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline">
              {filteredTypes.length} {filteredTypes.length === 1 ? "type" : "types"}
            </Badge>
          </div>

          {/* Table */}
          {filteredTypes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No license types found"
              description={
                selectedCategory === "all"
                  ? "Create your first license type to get started"
                  : "No license types in this category"
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-mono text-sm">{type.code}</TableCell>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryName(type.categoryId)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {type.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={type.isActive ? "default" : "secondary"}>
                        {type.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{type.order}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(type)}
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
              {editingType ? "Edit License Type" : "Create License Type"}
            </DialogTitle>
            <DialogDescription>
              {editingType
                ? "Update the license type details"
                : "Add a new license type"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => c.isActive)
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g., 144D"
                  disabled={!!editingType}
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
                  placeholder="e.g., 144D - Assisted Living"
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
                placeholder="Brief description of this license type"
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
            <DialogTitle>Delete License Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingType?.name}"? This action
              cannot be undone and will fail if the license type is in use.
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

export default function LicenseTypesPage() {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.SYSTEM_MANAGE}
      title="Access Restricted"
      description="You don't have permission to manage license types."
    >
      <LicenseTypesPageContent />
    </RequirePermission>
  );
}
