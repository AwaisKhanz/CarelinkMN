"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PROVIDER_FEATURE_GATES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  Users,
  Building2,
  FileText,
  Settings,
  BarChart3,
  Bed,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Package,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Building,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@carelink/types";
import { getDashboardPath } from "@/lib/routing";
import { useProvider } from "@/contexts/provider-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePermissions } from "@/hooks/use-permissions";

interface SidebarProps {
  className?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  variant?: "default" | "healthcareSecondary" | "healthcareSuccess" | "healthcareWarning" | "healthcareError" | "healthcareInfo";
  requiresPlan?: "PRO" | "PREMIUM" | "ENTERPRISE";
}

const getNavItems = (role: UserRole, canManageSettings: boolean = true, canManageStaff: boolean = true): NavItem[] => {
  const baseItems: NavItem[] = [
    {
      title: "Dashboard",
      href: getDashboardPath(role),
      icon: Home,
    },
  ];

  switch (role) {
    case UserRole.SUPER_ADMIN:
    case UserRole.ADMIN:
      return [
        ...baseItems,
        {
          title: "Users",
          href: "/admin/users",
          icon: Users,
        },
        {
          title: "Organizations",
          href: "/admin/organizations",
          icon: Building2,
        },
        {
          title: "Referrals",
          href: "/admin/referrals",
          icon: FileText,
        },
        {
          title: "Analytics",
          href: "/admin/analytics",
          icon: BarChart3,
        },
        {
          title: "Settings",
          href: "/admin/settings",
          icon: Settings,
        },
      ];

    case UserRole.PROVIDER_OWNER:
    case UserRole.PROVIDER_STAFF:
      const providerItems: NavItem[] = [
        ...baseItems,
        {
          title: "Homes",
          href: "/provider/homes",
          icon: Building,
        },
        {
          title: "Bed Management",
          href: "/provider/openings",
          icon: Bed,
        },
        {
          title: "Services",
          href: "/provider/services",
          icon: Package,
        },
        {
          title: "Placements",
          href: "/provider/placements",
          icon: CheckCircle,
          requiresPlan: PROVIDER_FEATURE_GATES.placements.requiredPlan,
        },
        {
          title: "Analytics",
          href: "/provider/analytics",
          icon: BarChart3,
          requiresPlan: PROVIDER_FEATURE_GATES.analytics.requiredPlan,
        },
        {
          title: "Messages",
          href: "/provider/messages",
          icon: MessageSquare,
          requiresPlan: PROVIDER_FEATURE_GATES.messages.requiredPlan,
        },
        {
          title: "Licenses",
          href: "/provider/licenses",
          icon: ShieldCheck,
        },
        {
          title: "Residents",
          href: "/provider/residents",
          icon: Users,
          requiresPlan: PROVIDER_FEATURE_GATES.residents.requiredPlan,
        },
        {
          title: "Referrals",
          href: "/provider/referrals",
          icon: FileText,
          badge: "8",
          variant: "healthcareWarning",
        },
        {
          title: "Availability",
          href: "/provider/availability",
          icon: Clock,
          requiresPlan: PROVIDER_FEATURE_GATES.availability.requiredPlan,
        },
      ];
      
      // Only show Staff and Settings for owners
      if (canManageStaff) {
        providerItems.push({
          title: "Staff",
          href: "/provider/staff",
          icon: Users,
        });
      }
      
      if (canManageSettings) {
        providerItems.push({
          title: "Settings",
          href: "/provider/settings",
          icon: Settings,
        });
      }
      
      return providerItems;

    case UserRole.CASE_MANAGER:
      return [
        ...baseItems,
        {
          title: "My Cases",
          href: "/case-manager/cases",
          icon: FileText,
        },
        {
          title: "Clients",
          href: "/case-manager/clients",
          icon: Users,
        },
        {
          title: "Search Providers",
          href: "/case-manager/search",
          icon: Search,
        },
        {
          title: "Urgent Cases",
          href: "/case-manager/urgent",
          icon: AlertTriangle,
          badge: "4",
          variant: "healthcareError",
        },
        {
          title: "Settings",
          href: "/case-manager/settings",
          icon: Settings,
        },
      ];

    case UserRole.HOSPITAL_SW:
      return [
        ...baseItems,
        {
          title: "Discharges",
          href: "/hospital-sw/discharges",
          icon: FileText,
        },
        {
          title: "Patients",
          href: "/hospital-sw/patients",
          icon: Users,
        },
        {
          title: "Placements",
          href: "/hospital-sw/placements",
          icon: CheckCircle,
        },
        {
          title: "Settings",
          href: "/hospital-sw/settings",
          icon: Settings,
        },
      ];

    case UserRole.VRS_SPECIALIST:
      return [
        ...baseItems,
        {
          title: "Case Reviews",
          href: "/vrs/reviews",
          icon: FileText,
        },
        {
          title: "Clients",
          href: "/vrs/clients",
          icon: Users,
        },
        {
          title: "Pending Reviews",
          href: "/vrs/pending",
          icon: Clock,
          badge: "6",
          variant: "healthcareWarning",
        },
        {
          title: "Settings",
          href: "/vrs/settings",
          icon: Settings,
        },
      ];

    case UserRole.VENDOR:
      return [
        ...baseItems,
        {
          title: "Services",
          href: "/vendor/services",
          icon: Package,
        },
        {
          title: "Orders",
          href: "/vendor/orders",
          icon: FileText,
        },
        {
          title: "Clients",
          href: "/vendor/clients",
          icon: Users,
        },
        {
          title: "Settings",
          href: "/vendor/settings",
          icon: Settings,
        },
      ];

    case UserRole.PUBLIC:
    default:
      return [
        ...baseItems,
        {
          title: "Search Providers",
          href: "/search",
          icon: Search,
        },
        {
          title: "My Referrals",
          href: "/referrals",
          icon: FileText,
        },
        {
          title: "Profile",
          href: "/profile",
          icon: UserIcon,
        },
      ];
  }
};

export function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { canManageSettings, canManageStaff, isOwner, isStaff } = usePermissions();

  // Get provider from context (if available)
  let providerLogo: string | undefined = undefined;
  try {
    const { provider } = useProvider();
    providerLogo = provider?.logo;
  } catch {
    // Provider context not available (user is not a provider)
    // This is fine, providerLogo will remain undefined
  }

  if (!user) return null;

  const navItems = getNavItems(user.role, canManageSettings, canManageStaff);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CL</span>
              </div>
              <div>
                <h2 className="font-semibold text-foreground">CareLinkMN</h2>
                <p className="text-xs text-muted-foreground">Care Coordination</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={providerLogo || undefined}
                  alt={`${user.firstName} ${user.lastName}`}
                />
                <AvatarFallback>
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  {isStaff && (
                    <Badge variant="healthcareSecondary" className="text-xs">
                      Staff
                    </Badge>
                  )}
                  {isOwner && (
                    <Badge variant="healthcareSuccess" className="text-xs">
                      Owner
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-4">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.title}</span>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <Badge variant={item.variant || "default"} className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                      {item.requiresPlan && (
                        <Badge variant="healthcarePrimary" className="text-xs capitalize">
                          {item.requiresPlan}
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
