"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  showSearch?: boolean;
  className?: string;
}

export function DashboardLayout({ 
  children, 
  title, 
  description, 
  showSearch = true,
  className 
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar className={cn(sidebarOpen && "translate-x-0")} />
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <Header
          title={title}
          description={description}
          showSearch={showSearch}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        {/* Page content */}
        <main className={cn("flex-1", className)}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
