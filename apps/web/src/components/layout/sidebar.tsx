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
  Search,
  Package,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Building,
  MessageSquare,
  ShieldCheck,
  Briefcase,
  Heart,
  ClipboardList,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { UserRole, SubscriptionTier } from "@carelink/types";
import { getDashboardPath } from "@/lib/routing";
import { useProviderSafe } from "@/contexts/provider-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/ui/user-avatar";
import { usePermissions } from "@/hooks/use-permissions";
import { useProviderId } from "@/hooks/use-provider-data";
import { providerService } from "@/lib/api";

interface SidebarProps {
  className?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  variant?:
    | "default"
    | "healthcareSecondary"
    | "healthcareSuccess"
    | "healthcareWarning"
    | "healthcareError"
    | "healthcareInfo";
  requiresPlan?: SubscriptionTier;
}

interface ProviderNavPermissions {
  canManageSettings: boolean;
  canManageStaff: boolean;
  canManageHomes: boolean;
  canManageOpenings: boolean;
  canManageServices: boolean;
  canManagePlacements: boolean;
  canViewAnalytics: boolean;
  canManageMessages: boolean;
  canManageLicenses: boolean;
  canViewResidents: boolean;
  canViewReferrals: boolean;
}

const getNavItems = (
  role: UserRole,
  providerPerms?: ProviderNavPermissions
): NavItem[] => {
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
          title: "Placements",
          href: "/admin/placements",
          icon: MapPin,
        },
        {
          title: "Onboarding Reviews",
          href: "/admin/onboarding",
          icon: ClipboardList,
        },
        {
          title: "License Verification",
          href: "/admin/licenses",
          icon: ShieldCheck,
        },
        {
          title: "Compliance",
          href: "/admin/compliance",
          icon: CheckCircle,
        },
        {
          title: "Audit Logs",
          href: "/admin/audit-logs",
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
    case UserRole.PROVIDER_STAFF: {
      const perms = providerPerms || {
        canManageSettings: true,
        canManageStaff: true,
        canManageHomes: true,
        canManageOpenings: true,
        canManageServices: true,
        canManagePlacements: true,
        canViewAnalytics: true,
        canManageMessages: true,
        canManageLicenses: true,
        canViewResidents: true,
        canViewReferrals: true,
      };
      const providerItems: NavItem[] = [...baseItems];

      if (perms.canManageHomes) {
        providerItems.push({
          title: "Homes",
          href: "/provider/homes",
          icon: Building,
        });
      }

      if (perms.canManageOpenings) {
        providerItems.push({
          title: "Bed Management",
          href: "/provider/openings",
          icon: Bed,
        });
      }

      if (perms.canManageServices) {
        providerItems.push({
          title: "Services",
          href: "/provider/services",
          icon: Package,
        });
      }

      if (perms.canManagePlacements) {
        providerItems.push({
          title: "Placements",
          href: "/provider/placements",
          icon: CheckCircle,
          requiresPlan: PROVIDER_FEATURE_GATES.placements.requiredPlan,
        });
      }

      if (perms.canViewAnalytics) {
        providerItems.push({
          title: "Analytics",
          href: "/provider/analytics",
          icon: BarChart3,
          requiresPlan: PROVIDER_FEATURE_GATES.analytics.requiredPlan,
        });
      }

      if (perms.canManageMessages) {
        providerItems.push({
          title: "Messages",
          href: "/provider/messages",
          icon: MessageSquare,
          requiresPlan: PROVIDER_FEATURE_GATES.messages.requiredPlan,
        });
      }

      if (perms.canManageLicenses) {
        providerItems.push({
          title: "Licenses",
          href: "/provider/licenses",
          icon: ShieldCheck,
        });
      }

      if (perms.canViewReferrals) {
        providerItems.push({
          title: "Referrals",
          href: "/provider/referrals",
          icon: FileText,
        });
      }

      if (perms.canManageStaff) {
        providerItems.push({
          title: "Staff",
          href: "/provider/staff",
          icon: Users,
        });
      }

      if (perms.canManageSettings) {
        providerItems.push({
          title: "Settings",
          href: "/provider/settings",
          icon: Settings,
        });
      }

      return providerItems;
    }

    case UserRole.CASE_MANAGER:
      return [
        ...baseItems,
        {
          title: "My Cases",
          href: "/case-manager/referrals",
          icon: FileText,
        },
        {
          title: "Search Providers",
          href: "/case-manager/search",
          icon: Search,
        },
        {
          title: "Messages",
          href: "/case-manager/messages",
          icon: MessageSquare,
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
          title: "Providers",
          href: "/hospital-sw/providers",
          icon: Building,
        },
        {
          title: "Messages",
          href: "/hospital-sw/messages",
          icon: MessageSquare,
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
          title: "Clients",
          href: "/vrs/clients",
          icon: Users,
        },
        {
          title: "Employers",
          href: "/vrs/employers",
          icon: Building2,
        },
        {
          title: "Jobs & Placements",
          href: "/vrs/jobs",
          icon: Briefcase,
        },
        {
          title: "Analytics",
          href: "/vrs/analytics",
          icon: BarChart3,
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
          title: "Profile",
          href: "/vendor/profile",
          icon: Package,
        },
        {
          title: "Leads",
          href: "/vendor/leads",
          icon: Users,
        },
        {
          title: "Bookings",
          href: "/vendor/bookings",
          icon: FileText,
        },
        {
          title: "Analytics",
          href: "/vendor/analytics",
          icon: BarChart3,
        },
        {
          title: "Settings",
          href: "/vendor/settings",
          icon: Settings,
        },
      ];

    case UserRole.PUBLIC:
      return [
        ...baseItems,
        {
          title: "Search Providers",
          href: "/public/search",
          icon: Search,
        },
        {
          title: "My Requests",
          href: "/public/requests",
          icon: FileText,
        },
        {
          title: "My Favorites",
          href: "/public/favorites",
          icon: Heart,
        },
        {
          title: "Settings",
          href: "/public/settings",
          icon: Settings,
        },
      ];
    default:
      return [
        ...baseItems,
        {
          title: "Search Providers",
          href: "/public/search",
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
  const {
    canManageSettings,
    canManageStaff,
    canManageHomes,
    canManageOpenings,
    canManageServices,
    canManagePlacements,
    canViewAnalytics,
    canManageMessages,
    canManageLicenses,
    canViewResidents,
    canViewReferrals,
    isOwner,
    isStaff,
  } = usePermissions();
  const providerId = useProviderId();
  const [referralCount, setReferralCount] = useState<number | null>(null);

  // Get provider from context (safe for non-provider users)
  const providerContext = useProviderSafe();
  const providerLogo = providerContext?.provider?.logo;

  // Fetch referral count for provider users
  useEffect(() => {
    if (
      providerId &&
      (user?.role === UserRole.PROVIDER_OWNER ||
        user?.role === UserRole.PROVIDER_STAFF)
    ) {
      const fetchReferralCount = async () => {
        try {
          const response = await providerService.getProviderReferrals(
            providerId,
            { page: 1, limit: 1 }
          );
          if (response.success && response.data) {
            setReferralCount(response.data.pagination.total);
          }
        } catch (error) {
          console.error("Error fetching referral count:", error);
          // Don't show error to user, just don't show badge
        }
      };
      fetchReferralCount();
    }
  }, [providerId, user?.role]);

  if (!user) return null;

  const navItems = getNavItems(user.role, {
    canManageSettings,
    canManageStaff,
    canManageHomes,
    canManageOpenings,
    canManageServices,
    canManagePlacements,
    canViewAnalytics,
    canManageMessages,
    canManageLicenses,
    canViewResidents,
    canViewReferrals,
  });

  // Update referrals nav item with dynamic count
  const updatedNavItems = navItems.map((item) => {
    if (
      item.href === "/provider/referrals" &&
      referralCount !== null &&
      referralCount > 0
    ) {
      return {
        ...item,
        badge: referralCount > 99 ? "99+" : referralCount.toString(),
        variant: "healthcareWarning" as const,
      };
    }
    return item;
  });

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
                <span className="text-primary-foreground font-bold text-sm">
                  CL
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-foreground">CareLinkMN</h2>
                <p className="text-xs text-muted-foreground">
                  Care Coordination
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <UserAvatar
                profileImage={(user as any)?.profileImage}
                organizationLogo={(user?.organization as any)?.logo}
                firstName={user.firstName}
                lastName={user.lastName}
              />
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
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-4">
            <nav className="space-y-2">
              {updatedNavItems.map((item) => {
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
                        <Badge
                          variant={item.variant || "default"}
                          className="text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                      {item.requiresPlan && (
                        <Badge
                          variant="healthcarePrimary"
                          className="text-xs capitalize"
                        >
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
