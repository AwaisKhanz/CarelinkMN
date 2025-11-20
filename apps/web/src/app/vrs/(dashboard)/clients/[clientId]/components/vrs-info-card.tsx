"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VRSClient } from "@/lib/api";

interface VRSInfoCardProps {
  client: VRSClient;
}

export function VRSInfoCard({ client }: VRSInfoCardProps) {
  // Parse workHistory if it's a string or object
  let workHistoryDisplay = null;
  if (client.workHistory) {
    try {
      const parsed = typeof client.workHistory === "string" 
        ? JSON.parse(client.workHistory) 
        : client.workHistory;
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        workHistoryDisplay = parsed;
      } else if (typeof parsed === "object" && parsed !== null) {
        workHistoryDisplay = [parsed];
      }
    } catch {
      // If parsing fails, treat as plain text
      workHistoryDisplay = null;
    }
  }

  return (
    <Card variant="healthcare">
      <CardHeader>
        <CardTitle>VRS Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-sm text-muted-foreground">Eligibility Type</div>
          <div className="font-medium">{client.eligibilityType}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Status</div>
          <div className="font-medium">{client.status.replace(/_/g, " ")}</div>
        </div>
        {client.assignedSpecialistId && (
          <div>
            <div className="text-sm text-muted-foreground">Assigned Specialist</div>
            <div className="font-medium text-xs">{client.assignedSpecialistId.slice(0, 8)}...</div>
          </div>
        )}
        <div>
          <div className="text-sm text-muted-foreground">Services Needed</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {client.servicesNeeded.length > 0 ? (
              client.servicesNeeded.map((service, index) => (
                <Badge key={index} variant="outline">
                  {service}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                None specified
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Skills</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {client.skills.length > 0 ? (
              client.skills.map((skill, index) => (
                <Badge key={index} variant="outline">
                  {skill}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                None specified
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Interests</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {client.interests.length > 0 ? (
              client.interests.map((interest, index) => (
                <Badge key={index} variant="outline">
                  {interest}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                None specified
              </span>
            )}
          </div>
        </div>
        {workHistoryDisplay && (
          <div>
            <div className="text-sm text-muted-foreground">Work History</div>
            <div className="mt-1 text-sm space-y-1">
              {Array.isArray(workHistoryDisplay) ? (
                workHistoryDisplay.slice(0, 3).map((entry: any, index: number) => (
                  <div key={index} className="text-xs">
                    {entry.company || entry.position || JSON.stringify(entry)}
                  </div>
                ))
              ) : (
                <div className="text-xs">{String(workHistoryDisplay)}</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

