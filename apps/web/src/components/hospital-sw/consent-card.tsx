"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Consent,
  CreateConsentData,
  UpdateConsentData,
  ConsentType,
  CaptureMethod,
} from "@carelink/types";
import { consentService } from "@/lib/api/services/consent.service";
import { toast } from "sonner";
import { Loader2, Plus, Edit, FileText, Calendar, User, CheckCircle2, XCircle } from "lucide-react";
import { format as formatDate } from "date-fns";
import { useAuth } from "@/contexts/auth-context";

const CONSENT_TYPES = [
  { value: ConsentType.REFERRAL, label: "Referral Consent" },
  { value: ConsentType.DISCHARGE, label: "Discharge Consent" },
  { value: ConsentType.PHI_RELEASE, label: "PHI Release" },
  { value: ConsentType.MARKETING, label: "Marketing Consent" },
];

const CAPTURE_METHODS = [
  { value: CaptureMethod.ELECTRONIC_SIGNATURE, label: "Electronic Signature" },
  { value: CaptureMethod.VERBAL_WITH_WITNESS, label: "Verbal with Witness" },
  { value: CaptureMethod.WRITTEN_SCAN, label: "Written Scan" },
];

interface ConsentCardProps {
  caseId: string;
  canManage: boolean;
}

export function ConsentCard({ caseId, canManage }: ConsentCardProps) {
  const { user } = useAuth();
  const [consent, setConsent] = useState<Consent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [consentType, setConsentType] = useState<ConsentType | "">("");
  const [consentVersion, setConsentVersion] = useState("1.0");
  const [captureMethod, setCaptureMethod] = useState<CaptureMethod | "">("");
  const [witnessName, setWitnessName] = useState("");
  const [witnessTitle, setWitnessTitle] = useState("");
  const [signatureData, setSignatureData] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    fetchConsent();
  }, [caseId]);

  const fetchConsent = async () => {
    try {
      setIsLoading(true);
      const response = await consentService.getConsentByCaseId(caseId);
      if (response.success && response.data) {
        setConsent(response.data);
        populateForm(response.data);
      }
    } catch (err) {
      console.error("Error fetching consent:", err);
      toast.error("Failed to load consent");
    } finally {
      setIsLoading(false);
    }
  };

  const populateForm = (data: Consent) => {
    setConsentType(data.consentType);
    setConsentVersion(data.consentVersion);
    setCaptureMethod(data.captureMethod);
    setWitnessName(data.witnessName || "");
    setWitnessTitle(data.witnessTitle || "");
    setSignatureData(data.signatureData || "");
    setExpiresAt(
      data.expiresAt
        ? typeof data.expiresAt === "string"
          ? new Date(data.expiresAt).toISOString().slice(0, 16)
          : new Date(data.expiresAt).toISOString().slice(0, 16)
        : ""
    );
  };

  const handleSubmit = async () => {
    if (!consentType || !captureMethod || !user) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const consentData: CreateConsentData | UpdateConsentData = {
        userId: user.id,
        dischargeCaseId: caseId,
        consentType,
        consentVersion,
        captureMethod,
        witnessName: witnessName || undefined,
        witnessTitle: witnessTitle || undefined,
        signatureData: signatureData || undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      };

      let response;
      if (consent) {
        response = await consentService.updateConsent(
          consent.id,
          consentData as UpdateConsentData
        );
      } else {
        response = await consentService.createConsent(consentData as CreateConsentData);
      }

      if (response.success) {
        toast.success(
          consent ? "Consent updated successfully" : "Consent created successfully"
        );
        setIsDialogOpen(false);
        await fetchConsent();
      } else {
        toast.error(response.message || "Failed to save consent");
      }
    } catch (err) {
      console.error("Error saving consent:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to save consent"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!consent) return;

    const reason = prompt("Please provide a reason for revoking consent:");
    if (reason === null) return; // User cancelled

    setIsSubmitting(true);
    try {
      const response = await consentService.revokeConsent(consent.id, reason);
      if (response.success) {
        toast.success("Consent revoked successfully");
        await fetchConsent();
      } else {
        toast.error(response.message || "Failed to revoke consent");
      }
    } catch (err) {
      console.error("Error revoking consent:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to revoke consent"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConsentTypeLabel = (type: ConsentType) => {
    return CONSENT_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getCaptureMethodLabel = (method: CaptureMethod) => {
    return CAPTURE_METHODS.find((m) => m.value === method)?.label || method;
  };

  if (isLoading) {
    return (
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Consent Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="healthcare">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Consent Management</CardTitle>
            <CardDescription>
              Capture and manage patient consent for discharge and PHI release
            </CardDescription>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant={consent ? "outline" : "healthcare"} size="sm">
                    {consent ? (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Consent
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {consent ? "Edit Consent" : "Create Consent"}
                    </DialogTitle>
                    <DialogDescription>
                      {consent
                        ? "Update consent details"
                        : "Create a new consent record for this discharge case"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Consent Type */}
                    <div>
                      <Label htmlFor="consentType">Consent Type *</Label>
                      <Select
                        value={consentType}
                        onValueChange={(value) => setConsentType(value as ConsentType)}
                        required
                      >
                        <SelectTrigger id="consentType">
                          <SelectValue placeholder="Select consent type" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONSENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Consent Version */}
                    <div>
                      <Label htmlFor="consentVersion">Consent Version *</Label>
                      <Input
                        id="consentVersion"
                        value={consentVersion}
                        onChange={(e) => setConsentVersion(e.target.value)}
                        placeholder="e.g., 1.0"
                        required
                      />
                    </div>

                    {/* Capture Method */}
                    <div>
                      <Label htmlFor="captureMethod">Capture Method *</Label>
                      <Select
                        value={captureMethod}
                        onValueChange={(value) => setCaptureMethod(value as CaptureMethod)}
                        required
                      >
                        <SelectTrigger id="captureMethod">
                          <SelectValue placeholder="Select capture method" />
                        </SelectTrigger>
                        <SelectContent>
                          {CAPTURE_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Witness Name */}
                    {captureMethod === CaptureMethod.VERBAL_WITH_WITNESS && (
                      <>
                        <div>
                          <Label htmlFor="witnessName">Witness Name</Label>
                          <Input
                            id="witnessName"
                            value={witnessName}
                            onChange={(e) => setWitnessName(e.target.value)}
                            placeholder="Enter witness name"
                          />
                        </div>

                        <div>
                          <Label htmlFor="witnessTitle">Witness Title</Label>
                          <Input
                            id="witnessTitle"
                            value={witnessTitle}
                            onChange={(e) => setWitnessTitle(e.target.value)}
                            placeholder="Enter witness title"
                          />
                        </div>
                      </>
                    )}

                    {/* Signature Data */}
                    {captureMethod === CaptureMethod.ELECTRONIC_SIGNATURE && (
                      <div>
                        <Label htmlFor="signatureData">Signature Data</Label>
                        <Textarea
                          id="signatureData"
                          value={signatureData}
                          onChange={(e) => setSignatureData(e.target.value)}
                          placeholder="Base64 encoded signature data"
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Base64 encoded signature image or data
                        </p>
                      </div>
                    )}

                    {/* Expires At */}
                    <div>
                      <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
                      <Input
                        id="expiresAt"
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="healthcare"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        consent ? "Update" : "Create"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {consent && consent.isActive && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRevoke}
                  disabled={isSubmitting}
                >
                  Revoke
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!consent ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No consent record yet</p>
            {canManage && (
              <p className="text-sm mt-2">Create a consent record to capture patient consent</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={consent.isActive ? "healthcareSuccess" : "destructive"}>
                {consent.isActive ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Revoked
                  </>
                )}
              </Badge>
              {consent.user && (
                <p className="text-sm text-muted-foreground">
                  User: {consent.user.firstName} {consent.user.lastName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <FileText className="h-4 w-4" />
                  <span>Consent Type</span>
                </div>
                <p className="font-medium">{getConsentTypeLabel(consent.consentType)}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <FileText className="h-4 w-4" />
                  <span>Version</span>
                </div>
                <p className="font-medium">{consent.consentVersion}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <FileText className="h-4 w-4" />
                  <span>Capture Method</span>
                </div>
                <p className="font-medium">{getCaptureMethodLabel(consent.captureMethod)}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Consented At</span>
                </div>
                <p className="font-medium">
                  {formatDate(
                    typeof consent.consentedAt === "string"
                      ? new Date(consent.consentedAt)
                      : consent.consentedAt,
                    "MMM d, yyyy 'at' h:mm a"
                  )}
                </p>
              </div>

              {consent.expiresAt && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Expires At</span>
                  </div>
                  <p className="font-medium">
                    {formatDate(
                      typeof consent.expiresAt === "string"
                        ? new Date(consent.expiresAt)
                        : consent.expiresAt,
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                </div>
              )}

              {consent.witnessName && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <User className="h-4 w-4" />
                    <span>Witness</span>
                  </div>
                  <p className="font-medium">
                    {consent.witnessName}
                    {consent.witnessTitle && ` - ${consent.witnessTitle}`}
                  </p>
                </div>
              )}

              {consent.revokedAt && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <XCircle className="h-4 w-4" />
                    <span>Revoked At</span>
                  </div>
                  <p className="font-medium">
                    {formatDate(
                      typeof consent.revokedAt === "string"
                        ? new Date(consent.revokedAt)
                        : consent.revokedAt,
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                  {consent.revokedReason && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Reason: {consent.revokedReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

