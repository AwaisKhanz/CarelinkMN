"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  FileText,
  ExternalLink,
  Building,
  Shield,
  Calendar,
  Clock,
  User,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { apiService } from "@/lib/api/config";
import { toast } from "sonner";
import { License, LicenseStatus } from "@carelink/types";
import { usePageMetadata } from "../../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";
import { getLicenseStatusBadgeConfig } from "@/lib/utils/admin";

interface LicenseDetail extends License {
  provider: {
    id: string;
    organization: {
      id: string;
      name: string;
      email: string;
      phone: string;
      type: string;
      city: string;
      state: string;
    };
  };
}

function LicenseDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const [license, setLicense] = useState<LicenseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Verification state
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<LicenseStatus>(
    LicenseStatus.ACTIVE
  );
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    setTitle("License Details");
    setDescription("Review and verify license information");
    if (params.id) {
      fetchLicense(params.id as string);
    }
  }, [params.id, setTitle, setDescription]);

  const fetchLicense = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.get<LicenseDetail>(
        `/api/admin/licenses/${id}`
      );

      if (response.success && response.data) {
        setLicense(response.data);
        setVerificationStatus(response.data.status);
      } else {
        toast.error("Failed to load license details");
      }
    } catch (error) {
      console.error("Error fetching license:", error);
      toast.error("Failed to load license details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async () => {
    if (!license) return;

    setIsVerifying(true);
    try {
      const response = await apiService.put(
        `/api/admin/licenses/${license.id}/verify`,
        {
          status: verificationStatus,
          verificationNotes: verificationNotes || undefined,
        }
      );

      if (response.success) {
        toast.success("License verification updated successfully");
        setVerifyDialogOpen(false);
        fetchLicense(license.id); // Refresh data
      } else {
        toast.error(response.message || "Failed to update verification");
      }
    } catch (error) {
      console.error("Error updating verification:", error);
      toast.error("Failed to update verification");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading license details...</div>;
  }

  if (!license) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium">License not found</h3>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/admin/licenses")}
        >
          Back to List
        </Button>
      </div>
    );
  }

  const statusConfig = getLicenseStatusBadgeConfig(license.status);
  const isExpired = license.expirationDate 
    ? new Date(license.expirationDate) < new Date() 
    : false;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/licenses")}
          className="pl-0 hover:bg-transparent"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Licenses
        </Button>
        <div className="flex items-center gap-3">
          <Badge variant={statusConfig.variant} className="text-sm px-3 py-1">
            {statusConfig.label}
          </Badge>
          <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="healthcare">Update Verification</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Update License Verification</DialogTitle>
                <DialogDescription>
                  Change the status and add verification notes.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={verificationStatus}
                    onValueChange={(value) =>
                      setVerificationStatus(value as LicenseStatus)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LicenseStatus.ACTIVE}>Active (Verified)</SelectItem>
                      <SelectItem value={LicenseStatus.PENDING}>Pending Review</SelectItem>
                      <SelectItem value={LicenseStatus.SUSPENDED}>Suspended</SelectItem>
                      <SelectItem value={LicenseStatus.REVOKED}>Revoked</SelectItem>
                      <SelectItem value={LicenseStatus.EXPIRED}>Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Verification Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes about this verification action..."
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setVerifyDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="healthcare"
                  onClick={handleVerifySubmit}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Status"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content - License Info & Document */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>License Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-muted-foreground">License Type</Label>
                <p className="font-medium text-lg">{license.licenseType?.name || 'Unknown'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">License Number</Label>
                <p className="font-mono font-medium text-lg">{license.licenseNumber}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Issue Date</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">
                    {license.issueDate
                      ? format(new Date(license.issueDate), "MMMM d, yyyy")
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Expiration Date</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className={`font-medium ${isExpired ? "text-destructive" : ""}`}>
                    {license.expirationDate
                      ? format(new Date(license.expirationDate), "MMMM d, yyyy")
                      : "N/A"}
                  </p>
                  {isExpired && (
                    <Badge variant="destructive" className="ml-2 text-xs">Expired</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Viewer */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>License Document</CardTitle>
                </div>
                {license.documentUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={license.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in New Tab
                    </a>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 bg-muted/20 relative overflow-hidden">
              {license.documentUrl ? (
                <iframe
                  src={license.documentUrl}
                  className="w-full h-full border-0"
                  title="License Document"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FileText className="h-12 w-12 mb-4 opacity-20" />
                  <p>No document uploaded for this license</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Provider Info & History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <CardTitle>Provider Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Organization</Label>
                <p className="font-medium text-lg">
                  {license.provider.organization.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {license.provider.organization.type}
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{license.provider.organization.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {license.provider.organization.city}, {license.provider.organization.state}
                  </span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push(`/admin/organizations/${license.provider.organization.id}`)}
              >
                View Organization
              </Button>
            </CardContent>
          </Card>

          {/* Verification History */}
          {(license.verifiedBy || license.verifiedAt) && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <CardTitle>Verification Info</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {license.verifiedAt && (
                  <div>
                    <Label className="text-muted-foreground">Verified Date</Label>
                    <p className="font-medium">
                      {format(new Date(license.verifiedAt), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                )}
                {license.verifiedBy && (
                  <div>
                    <Label className="text-muted-foreground">Verified By</Label>
                    <p className="font-medium text-sm">Admin ID: {license.verifiedBy}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LicenseDetailPage() {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.LICENSES_VERIFY}
      title="Access Restricted"
      description="You don't have permission to view license details."
    >
      <LicenseDetailPageContent />
    </RequirePermission>
  );
}
