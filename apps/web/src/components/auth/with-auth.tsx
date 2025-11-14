"use client";

import { ComponentType } from 'react';
import { RouteGuard } from './route-guard';
import { UserRole } from '@carelink/types';

interface WithAuthOptions {
  requiredRoles?: UserRole[];
  fallbackPath?: string;
  showLoading?: boolean;
  showError?: boolean;
}

export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const {
    requiredRoles = [],
    fallbackPath,
    showLoading = true,
    showError = true,
  } = options;

  const AuthenticatedComponent = (props: P) => {
    return (
      <RouteGuard
        requiredRoles={requiredRoles}
        fallbackPath={fallbackPath}
        showLoading={showLoading}
        showError={showError}
      >
        <WrappedComponent {...props} />
      </RouteGuard>
    );
  };

  // Set display name for debugging
  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return AuthenticatedComponent;
}

// Convenience HOCs for specific roles
export function withAdminAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  return withAuth(WrappedComponent, { requiredRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] });
}

export function withProviderAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  return withAuth(WrappedComponent, { requiredRoles: [UserRole.PROVIDER_OWNER, UserRole.PROVIDER_STAFF] });
}

export function withCaseManagerAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  return withAuth(WrappedComponent, { requiredRoles: [UserRole.CASE_MANAGER] });
}

export function withHospitalSWAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  return withAuth(WrappedComponent, { requiredRoles: [UserRole.HOSPITAL_SW] });
}

export function withVRSAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  return withAuth(WrappedComponent, { requiredRoles: [UserRole.VRS_SPECIALIST] });
}

export function withVendorAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  return withAuth(WrappedComponent, { requiredRoles: [UserRole.VENDOR] });
}
