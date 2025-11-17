"use client";

import { ReactNode } from "react";
import { ProviderGuard } from "@/components/auth/route-guard";

interface ProviderLayoutProps {
  children: ReactNode;
}

export default function ProviderLayout({ children }: ProviderLayoutProps) {
  // Root layout - just handles role guard
  // Onboarding and Dashboard route groups have their own layouts
  return <ProviderGuard>{children}</ProviderGuard>;
}
