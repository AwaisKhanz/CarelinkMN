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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { providerService } from "@/lib/api";
import { LicenseStatus } from "@carelink/types";
import { useProviderId } from "@/hooks/use-provider-data";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const licenseSchema = z.object({
  licenseNumber: z.string().min(1, "License number is required"),
  type: z.string().min(1, "License type is required"),
  issuingAuthority: z.string().min(1, "Issuing authority is required"),
  expirationDate: z.string().min(1, "Expiration date is required"),
});

type LicenseFormData = z.infer<typeof licenseSchema>;

export function LicensesTab() {
  const providerId = useProviderId();
  const [isLoading, setIsLoading] = useState(true);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<LicenseFormData>({
    resolver: zodResolver(licenseSchema),
    defaultValues: {
      licenseNumber: "",
      type: "",
      issuingAuthority: "",
      expirationDate: "",
    },
  });

  useEffect(() => {
    if (providerId) {
      fetchLicenses();
    }
  }, [providerId]);

  const fetchLicenses = async () => {
    setIsLoading(true);
    try {
      const response = await providerService.getProviderLicenses(providerId!);
      if (response.success && response.data) {
        setLicenses(response.data);
      }
    } catch (err) {
      console.error("Error fetching licenses:", err);
      toast.error("Failed to load licenses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (license?: any) => {
    if (license) {
      setEditingLicense(license);
      form.reset({
        licenseNumber: license.licenseNumber,
        type: license.type,
        issuingAuthority: license.issuingAuthority,
        expirationDate: new Date(license.expirationDate).toISOString().split("T")[0],
      });
    } else {
      setEditingLicense(null);
      form.reset({
        licenseNumber: "",
        type: "",
        issuingAuthority: "",
        expirationDate: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: LicenseFormData) => {
    if (!providerId) return;

    setIsSaving(true);
    try {
      const licenseData = {
        licenseType: data.type,
        licenseNumber: data.licenseNumber,
        issuingState: data.issuingAuthority, // Mapping authority to state for now as per UI
        issueDate: new Date().toISOString(), // Defaulting as form doesn't have this field
        expirationDate: new Date(data.expirationDate).toISOString(),
        documentUrl: "", // Defaulting as form doesn't have file upload
      };

      if (editingLicense) {
        await providerService.updateProviderLicense(providerId, editingLicense.id, licenseData);
        toast.success("License updated successfully");
      } else {
        await providerService.createProviderLicense(providerId, licenseData);
        toast.success("License added successfully");
      }
      setIsDialogOpen(false);
      fetchLicenses();
    } catch (err) {
      console.error("Error saving license:", err);
      toast.error("Failed to save license");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this license?")) return;

    try {
      await providerService.deleteProviderLicense(providerId!, id);
      toast.success("License deleted successfully");
      fetchLicenses();
    } catch (err) {
      console.error("Error deleting license:", err);
      toast.error("Failed to delete license");
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Licenses & Certifications
            </CardTitle>
            <CardDescription>
              Manage your organization's licenses and certifications
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add License
          </Button>
        </CardHeader>
        <CardContent>
          {licenses.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No licenses found</h3>
              <p className="text-muted-foreground mb-4">
                Add your licenses to verify your organization
              </p>
              <Button onClick={() => handleOpenDialog()} variant="outline">
                Add License
              </Button>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>License Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Issuing Authority</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((license) => (
                    <TableRow key={license.id}>
                      <TableCell className="font-medium">
                        {license.licenseNumber}
                      </TableCell>
                      <TableCell>{license.type}</TableCell>
                      <TableCell>{license.issuingAuthority}</TableCell>
                      <TableCell>
                        {format(new Date(license.expirationDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            license.status === LicenseStatus.ACTIVE
                              ? "healthcareSuccess"
                              : license.status === LicenseStatus.EXPIRED
                                ? "healthcareError"
                                : "healthcareWarning"
                          }
                        >
                          {license.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(license)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(license.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLicense ? "Edit License" : "Add License"}
            </DialogTitle>
            <DialogDescription>
              Enter the details of your license or certification.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">License Type</Label>
              <Input
                id="type"
                {...form.register("type")}
                placeholder="e.g., Assisted Living Facility"
              />
              {form.formState.errors.type && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.type.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                {...form.register("licenseNumber")}
                placeholder="e.g., 12345-ABC"
              />
              {form.formState.errors.licenseNumber && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.licenseNumber.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="issuingAuthority">Issuing Authority</Label>
              <Input
                id="issuingAuthority"
                {...form.register("issuingAuthority")}
                placeholder="e.g., Dept of Health"
              />
              {form.formState.errors.issuingAuthority && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.issuingAuthority.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input
                id="expirationDate"
                type="date"
                {...form.register("expirationDate")}
              />
              {form.formState.errors.expirationDate && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.expirationDate.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save License"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
