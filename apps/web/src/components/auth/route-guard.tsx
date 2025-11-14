"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@carelink/types';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallbackPath?: string;
  showLoading?: boolean;
  showError?: boolean;
}

export function RouteGuard({
  children,
  requiredRoles = [],
  fallbackPath,
  showLoading = true,
  showError = true,
}: RouteGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      // Wait for auth to initialize
      if (isLoading) return;

      // If not authenticated, redirect to signin
      if (!isAuthenticated || !user) {
        const currentPath = window.location.pathname;
        router.push(`/auth/signin?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      // If no specific roles required, allow access
      if (requiredRoles.length === 0) {
        setIsChecking(false);
        return;
      }

      // Check if user has required role
      if (!requiredRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on user's role
        const roleRedirects: Record<UserRole, string> = {
          SUPER_ADMIN: '/admin/dashboard',
          ADMIN: '/admin/dashboard',
          PROVIDER_OWNER: '/provider/dashboard',
          PROVIDER_STAFF: '/provider/dashboard',
          CASE_MANAGER: '/case-manager/dashboard',
          HOSPITAL_SW: '/hospital-sw/dashboard',
          VRS_SPECIALIST: '/vrs/dashboard',
          VENDOR: '/vendor/dashboard',
          PUBLIC: '/search', // Public users go to search page
        };

        const redirectPath = fallbackPath || roleRedirects[user.role] || '/search';
        router.push(redirectPath);
        return;
      }

      // Access granted
      setIsChecking(false);
    };

    checkAccess();
  }, [user, isLoading, isAuthenticated, requiredRoles, fallbackPath, router]);

  // Show loading state
  if (isLoading || isChecking) {
    if (!showLoading) return null;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  // Show error state if access denied
  if (!isAuthenticated || !user) {
    if (!showError) return null;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be signed in to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => router.push('/auth/signin')}
              className="w-full"
            >
              Sign In
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role-based access
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    if (!showError) return null;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page. 
              Required roles: {requiredRoles.join(', ')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => {
                const roleRedirects: Record<UserRole, string> = {
                  SUPER_ADMIN: '/admin/dashboard',
                  ADMIN: '/admin/dashboard',
                  PROVIDER_OWNER: '/provider/dashboard',
                  PROVIDER_STAFF: '/provider/dashboard',
                  CASE_MANAGER: '/case-manager/dashboard',
                  HOSPITAL_SW: '/hospital-sw/dashboard',
                  VRS_SPECIALIST: '/vrs/dashboard',
                  VENDOR: '/vendor/dashboard',
                  PUBLIC: '/search', // Public users go to search page
                };
                router.push(roleRedirects[user.role] || '/search');
              }}
              className="w-full"
            >
              Go to Your Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access granted, render children
  return <>{children}</>;
}

// Convenience components for specific roles
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]}>
      {children}
    </RouteGuard>
  );
}

export function ProviderGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRoles={[UserRole.PROVIDER_OWNER, UserRole.PROVIDER_STAFF]}>
      {children}
    </RouteGuard>
  );
}

export function CaseManagerGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRoles={[UserRole.CASE_MANAGER]}>
      {children}
    </RouteGuard>
  );
}

export function HospitalSWGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRoles={[UserRole.HOSPITAL_SW]}>
      {children}
    </RouteGuard>
  );
}

export function VRSGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRoles={[UserRole.VRS_SPECIALIST]}>
      {children}
    </RouteGuard>
  );
}

export function VendorGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRoles={[UserRole.VENDOR]}>
      {children}
    </RouteGuard>
  );
}
