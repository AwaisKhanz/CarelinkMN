"use client";

import { useEffect } from "react";
import { usePageMetadata } from "../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { PROVIDER_CAPABILITIES } from "@/lib/permissions/provider-capabilities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileTab } from "./components/profile-tab";
import { SubscriptionTab } from "./components/subscription-tab";
import { usePermissions } from "@/hooks/use-permissions";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

function ProviderSettingsPageContent() {
  const { setTitle, setDescription } = usePageMetadata();
  const { canManageSubscription } = usePermissions();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = searchParams.get("tab") || "profile";

  useEffect(() => {
    setTitle("Provider Settings");
    setDescription("Manage your provider profile and settings");
  }, [setTitle, setDescription]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Provider Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your provider profile and preferences
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {canManageSubscription && (
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileTab />
        </TabsContent>

        {canManageSubscription && (
          <TabsContent value="subscription" className="space-y-6">
            <SubscriptionTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default function ProviderSettingsPage() {
  return (
    <RequirePermission
      permission={PROVIDER_CAPABILITIES.SETTINGS_MANAGE}
      title="Access Restricted"
      description="You don't have permission to access settings. Only provider owners can manage settings."
    >
      <ProviderSettingsPageContent />
    </RequirePermission>
  );
}
