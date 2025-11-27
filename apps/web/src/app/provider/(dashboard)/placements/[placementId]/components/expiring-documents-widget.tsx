"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileText, Loader2 } from "lucide-react";
import { placementService } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { PlacementDocument } from "@carelink/types";

interface ExpiringDocumentsWidgetProps {
  placementId: string;
  days?: number;
}

export function ExpiringDocumentsWidget({ placementId, days = 30 }: ExpiringDocumentsWidgetProps) {
  const [documents, setDocuments] = useState<PlacementDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExpiringDocuments = async () => {
      try {
        setIsLoading(true);
        const response = await placementService.getExpiringDocuments(placementId, days);
        if (response.success && response.data) {
          setDocuments(response.data);
        }
      } catch (error) {
        console.error("Error fetching expiring documents:", error);
        toast.error("Failed to load expiring documents");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpiringDocuments();
  }, [placementId, days]);

  const getUrgencyColor = (expiresAt: string) => {
    const daysUntilExpiry = Math.ceil(
      (new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) return "destructive"; // Expired
    if (daysUntilExpiry <= 7) return "destructive"; // Critical (< 7 days)
    if (daysUntilExpiry <= 14) return "warning"; // Warning (< 14 days)
    return "secondary"; // Normal (< 30 days)
  };

  const getUrgencyLabel = (expiresAt: string) => {
    const daysUntilExpiry = Math.ceil(
      (new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) return "Expired";
    if (daysUntilExpiry === 0) return "Expires Today";
    if (daysUntilExpiry === 1) return "Expires Tomorrow";
    return `${daysUntilExpiry} days`;
  };

  if (isLoading) {
    return (
      <Card variant="healthcare">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return null; // Don't show widget if no expiring documents
  }

  return (
    <Card variant="healthcare" className="border-warning/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-warning" />
          <div>
            <CardTitle className="text-base">Expiring Documents</CardTitle>
            <CardDescription>
              {documents.length} document{documents.length !== 1 ? "s" : ""} expiring in the next {days} days
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-3 flex-1">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{doc.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires: {format(new Date(doc.expiresAt!), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
              <Badge variant={getUrgencyColor(doc.expiresAt!) as any} className="text-xs">
                {getUrgencyLabel(doc.expiresAt!)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
