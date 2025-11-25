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
import { Loader2, Send } from "lucide-react";
import { Referral } from "@/lib/api";
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
              onClick={() => onOpenChange(false)}
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
