"use client";

import { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface AdminDetailHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  actions?: ReactNode;
  className?: string;
}

export function AdminDetailHeader({
  title,
  description,
  backHref,
  actions,
  className,
}: AdminDetailHeaderProps) {
  const router = useRouter();

  return (
    <Card variant="healthcare" className={cn("mb-6", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4 flex-1">
            {backHref && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(backHref)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1">
              <CardTitle>{title}</CardTitle>
              {description && (
                <CardDescription className="mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </CardHeader>
    </Card>
  );
}
