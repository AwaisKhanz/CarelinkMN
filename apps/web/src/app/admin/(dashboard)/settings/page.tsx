"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../use-page-metadata";
import { toast } from "sonner";
import { RequirePermission } from "@/components/auth/require-permission";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Save, Settings } from "lucide-react";

function AdminSettingsPageContent() {
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTitle("Admin Settings");
    setDescription("Manage system settings and configuration");
  }, [setTitle, setDescription]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Placeholder for future implementation
      // Settings are currently read-only and managed via environment variables
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.info("Settings are currently read-only", {
        description: "System settings are managed via environment variables",
      });
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Configure system-wide settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="systemName">System Name</Label>
              <Input
                id="systemName"
                defaultValue="CareLinkMN"
                placeholder="Enter system name"
              />
            </div>
            <div>
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                defaultValue="support@carelinkmn.com"
                placeholder="Enter support email"
              />
            </div>
            <div>
              <Label htmlFor="maxFileSize">Max File Upload Size (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                defaultValue="10"
                placeholder="Enter max file size"
              />
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button
              variant="healthcare"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Settings className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Your admin account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <p className="text-sm font-medium">
              {user?.firstName} {user?.lastName}
            </p>
          </div>
          <div>
            <Label>Email</Label>
            <p className="text-sm font-medium">{user?.email}</p>
          </div>
          <div>
            <Label>Role</Label>
            <p className="text-sm font-medium capitalize">
              {user?.role?.replace("_", " ").toLowerCase()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.SYSTEM_VIEW}
      title="Access Restricted"
      description="You don't have permission to view settings."
    >
      <AdminSettingsPageContent />
    </RequirePermission>
  );
}

