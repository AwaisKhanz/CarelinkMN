"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, FileText, Sparkles } from "lucide-react";
import { messageTemplateService, MessageTemplate, Referral } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

interface BatchMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  isSending: boolean;
  recipientCount: number;
  referral?: Referral;
}

const TEMPLATE_VARIABLES = [
  { key: "referralNumber", label: "Referral Number" },
  { key: "clientInitials", label: "Client Initials" },
  { key: "clientAge", label: "Client Age" },
  { key: "providerName", label: "Provider Name" },
  { key: "caseManagerName", label: "Case Manager Name" },
  { key: "organizationName", label: "Organization Name" },
] as const;

export function BatchMessageDialog({
  open,
  onOpenChange,
  message,
  onMessageChange,
  onSend,
  isSending,
  recipientCount,
  referral,
}: BatchMessageDialogProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTemplates();
      // Reset selection when dialog opens
      setSelectedTemplateId("");
    } else {
      // Reset selection when dialog closes
      setSelectedTemplateId("");
    }
  }, [open]);

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const response = await messageTemplateService.getTemplates(true);
      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      // Replace variables in template content
      const variables: Record<string, string | number | undefined> = {
        referralNumber: referral?.referralNumber || "",
        clientInitials: referral?.clientInitials || "",
        clientAge: referral?.clientAge || "",
        caseManagerName: user
          ? `${user.firstName} ${user.lastName}`
          : "",
        organizationName: "", // Organization name not available in referral object
      };

      const processedContent = messageTemplateService.replaceVariables(
        template.content,
        variables
      );
      onMessageChange(processedContent);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Batch Message Providers</DialogTitle>
          <DialogDescription>
            Send a message to all {recipientCount} provider{recipientCount !== 1 ? "s" : ""} in the shortlist
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Template Selector */}
          <div>
            <Label htmlFor="template">Use Template (Optional)</Label>
            <Select
              value={selectedTemplateId}
              onValueChange={handleTemplateSelect}
              disabled={isLoadingTemplates || templates.length === 0}
            >
              <SelectTrigger id="template" className="mt-1">
                <SelectValue 
                  placeholder={
                    isLoadingTemplates 
                      ? "Loading templates..." 
                      : templates.length === 0 
                      ? "No templates available"
                      : "Select a template..."
                  } 
                />
              </SelectTrigger>
              <SelectContent>
                {templates.length === 0 ? null : (
                  templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{template.name}</span>
                        {template.category && (
                          <span className="text-xs text-muted-foreground">
                            ({template.category.replace(/_/g, " ")})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedTemplateId && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Template loaded. Variables will be replaced automatically.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="batch-message">Message</Label>
            <Textarea
              id="batch-message"
              placeholder="Enter your message... You can use variables like {referralNumber}, {clientInitials}, etc."
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              rows={8}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Available variables: {TEMPLATE_VARIABLES.map((v) => `{${v.key}}`).join(", ")}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setSelectedTemplateId("");
              }}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={onSend}
              disabled={isSending || !message.trim()}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
