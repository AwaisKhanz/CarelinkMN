"use client";

import { ReactNode } from "react";
import { CaseManagerGuard } from "@/components/auth/route-guard";

interface CaseManagerLayoutProps {
  children: ReactNode;
}

export default function CaseManagerLayout({ children }: CaseManagerLayoutProps) {
  // Root layout - just handles role guard
  // Onboarding and Dashboard route groups have their own layouts
  return <CaseManagerGuard>{children}</CaseManagerGuard>;
}

