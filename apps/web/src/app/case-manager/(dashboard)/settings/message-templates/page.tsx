"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MessageTemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Message Templates</h3>
        <p className="text-sm text-muted-foreground">
          Manage templates for automated messages and notifications.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>
            Create and edit message templates here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Message templates functionality coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
