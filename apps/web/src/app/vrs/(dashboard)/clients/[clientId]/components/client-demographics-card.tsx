"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Mail, Phone, User } from "lucide-react";
import { format as formatDate } from "date-fns";
import type { VRSClient } from "@/lib/api";

interface ClientDemographicsCardProps {
  client: VRSClient;
}

export function ClientDemographicsCard({
  client,
}: ClientDemographicsCardProps) {
  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle>Demographics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm text-muted-foreground">Name</div>
            <div className="font-medium">
              {client.firstName} {client.lastName}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm text-muted-foreground">Date of Birth</div>
            <div className="font-medium">
              {formatDate(new Date(client.dateOfBirth), "MMM d, yyyy")}
            </div>
          </div>
        </div>
        {client.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{client.email}</div>
            </div>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm text-muted-foreground">Phone</div>
              <div className="font-medium">{client.phone}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

