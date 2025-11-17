"use client";

import { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AccessRestrictedProps {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function AccessRestricted({
  title = "Access Restricted",
  description = "You don’t have permission to view this section. Please contact your organization administrator if you believe this is an error.",
  action,
  className,
}: AccessRestrictedProps) {
  return (
    <Card
      className={className ? className : "max-w-2xl mx-auto"}
      variant="healthcare"
    >
      <CardHeader className="flex flex-row items-start gap-4">
        <div className="rounded-full bg-primary/10 p-3">
          <ShieldAlert className="h-6 w-6 text-primary" />
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      {action && <CardContent>{action}</CardContent>}
    </Card>
  );
}
