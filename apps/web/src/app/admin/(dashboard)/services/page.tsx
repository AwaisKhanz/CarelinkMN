"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, Filter, Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { serviceService, licenseTypeService } from "@/lib/api";
import type { Service, LicenseType } from "@carelink/types";
import { RequirePermission } from "@/components/auth/require-permission";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";
import { cn } from "@/lib/utils";

interface ServiceFormData {
  code: string;
  name: string;
  description: string;
  category: string;
  licenseTypeIds: string[];
  isActive: boolean;
}

interface LicenseTypeSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  groupedOptions: Record<string, LicenseType[]>;
}

function LicenseTypeSelector({
  value,
  onChange,
  groupedOptions,
}: LicenseTypeSelectorProps) {
  const [open, setOpen] = useState(false);

  const toggleValue = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const selectedCount = value.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10 py-2"
        >
          {selectedCount > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedCount} selected
            </div>
          ) : (
            <span className="text-muted-foreground">Select license types...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search license types..." />
          <CommandList>
            <CommandEmpty>No license type found.</CommandEmpty>
            {Object.entries(groupedOptions).map(([category, types]) => (
              <CommandGroup key={category} heading={category}>
                {types.map((type) => (
                  <CommandItem
                    key={type.id}
                    value={`${category}: ${type.name} (${type.code || ""})`} // Improve searchability including category, name, code
                    onSelect={() => toggleValue(type.id)}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        value.includes(type.id)
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className={cn("h-4 w-4")} />
                    </div>
                    <span>{type.name}</span>
                    {type.code && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {type.code}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState<ServiceFormData>({
    code: "",
    name: "",
    description: "",
    category: "",
    licenseTypeIds: [],
    isActive: true,
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [showInactive, selectedCategory]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [servicesRes, licenseTypesRes, categoriesRes] = await Promise.all([
        serviceService.getAllServices({
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          includeInactive: showInactive,
        }),
        licenseTypeService.getAllLicenseTypes(),
        serviceService.getServiceCategories(),
      ]);

      if (servicesRes.success && servicesRes.data) {
        setServices(servicesRes.data);
      }
      if (licenseTypesRes.success && licenseTypesRes.data) {
        setLicenseTypes(licenseTypesRes.data);
      }
      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load services");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter services
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Create service
  const handleCreate = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      category: "",
      licenseTypeIds: [],
      isActive: true,
    });
    setIsCreateDialogOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!formData.code || !formData.name || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      const response = await serviceService.createService(formData);
      if (response.success) {
        toast.success("Service created successfully");
        setIsCreateDialogOpen(false);
        fetchData();
      }
    } catch (error: any) {
      console.error("Error creating service:", error);
      toast.error(error?.response?.data?.message || "Failed to create service");
    } finally {
      setIsSaving(false);
    }
  };

  // Edit service
  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setFormData({
      code: service.code,
      name: service.name,
      description: service.description || "",
      category: service.category,
      licenseTypeIds:
        service.serviceLicenseTypes?.map((slt) => slt.licenseTypeId) || [],
      isActive: service.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedService) return;
    if (!formData.name || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      const response = await serviceService.updateService(selectedService.id, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        licenseTypeIds: formData.licenseTypeIds,
        isActive: formData.isActive,
      });
      if (response.success) {
        toast.success("Service updated successfully");
        setIsEditDialogOpen(false);
        fetchData();
      }
    } catch (error: any) {
      console.error("Error updating service:", error);
      toast.error(error?.response?.data?.message || "Failed to update service");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete service
  const handleDelete = (service: Service) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedService) return;

    setIsSaving(true);
    try {
      const response = await serviceService.deleteService(selectedService.id);
      if (response.success) {
        toast.success("Service deleted successfully");
        setIsDeleteDialogOpen(false);
        fetchData();
      }
    } catch (error: any) {
      console.error("Error deleting service:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to delete service. It may be in use by providers or homes."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Group license types by category
  const groupedLicenseTypes = licenseTypes.reduce((acc, lt) => {
    const categoryName = lt.category?.name || "Uncategorized";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(lt);
    return acc;
  }, {} as Record<string, LicenseType[]>);

  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.SERVICES_MANAGE}
      title="Access Restricted"
      description="You don't have permission to manage services."
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Service Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage services and their license type associations
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-inactive"
                    checked={showInactive}
                    onCheckedChange={setShowInactive}
                  />
                  <Label htmlFor="show-inactive">Show Inactive</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Table */}
        <Card>
          <CardHeader>
            <CardTitle>Services ({filteredServices.length})</CardTitle>
            <CardDescription>
              {showInactive
                ? "Showing all services including inactive"
                : "Showing active services only"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No services found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>License Types</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-mono">{service.code}</TableCell>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>{service.category}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {service.serviceLicenseTypes?.length ? (
                            service.serviceLicenseTypes.map((slt) => (
                              <Badge key={slt.id} variant="outline" className="text-xs">
                                {slt.licenseType?.name || "Unknown"}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No license types
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={service.isActive ? "default" : "secondary"}>
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(service)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(service)}
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

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Service</DialogTitle>
              <DialogDescription>
                Add a new service and assign license types
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="code">
                  Service Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g., ADL_ASSIST"
                />
              </div>
              <div>
                <Label htmlFor="name">
                  Service Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Activities of Daily Living Assistance"
                />
              </div>
              <div>
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="e.g., Daily Living"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Service description..."
                  rows={3}
                />
              </div>
              <div>
                <Label className="mb-2 block">License Types</Label>
                <LicenseTypeSelector
                  value={formData.licenseTypeIds}
                  onChange={(ids) =>
                    setFormData((prev) => ({ ...prev, licenseTypeIds: ids }))
                  }
                  groupedOptions={groupedLicenseTypes}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {formData.licenseTypeIds.length} license type(s) selected
                </p>
              </div>
              <div className="flex items-center space-x-2">
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
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateSubmit} disabled={isSaving}>
                {isSaving ? "Creating..." : "Create Service"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
              <DialogDescription>
                Update service details and license types
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Service Code</Label>
                <Input value={formData.code} disabled className="bg-muted" />
              </div>
              <div>
                <Label htmlFor="edit-name">
                  Service Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label className="mb-2 block">License Types</Label>
                <LicenseTypeSelector
                  value={formData.licenseTypeIds}
                  onChange={(ids) =>
                    setFormData((prev) => ({ ...prev, licenseTypeIds: ids }))
                  }
                  groupedOptions={groupedLicenseTypes}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {formData.licenseTypeIds.length} license type(s) selected
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleEditSubmit} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Service</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this service? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            {selectedService && (
              <div className="py-4">
                <p className="font-medium">{selectedService.name}</p>
                <p className="text-sm text-muted-foreground">
                  Code: {selectedService.code}
                </p>
              </div>
            )}
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
                onClick={handleDeleteConfirm}
                disabled={isSaving}
              >
                {isSaving ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RequirePermission>
  );
}
