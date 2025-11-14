# Authentication & Authorization Guide

## Overview

This guide explains the comprehensive authentication and authorization system implemented in CareLinkMN. The system provides multiple layers of protection to ensure users can only access resources appropriate to their role.

## Architecture

### 1. Middleware Layer (`middleware.ts`)
- **Purpose**: First line of defense, runs before page loads
- **Features**:
  - Token validation from cookies
  - Role-based route protection
  - Automatic redirects for unauthorized access
  - Public route handling

### 2. Component Layer (`components/auth/`)
- **RouteGuard**: Reusable component for protecting individual pages
- **withAuth HOC**: Higher-order component for wrapping pages
- **Role-specific guards**: Convenience components for each role

### 3. Context Layer (`contexts/auth-context.tsx`)
- **Purpose**: Global authentication state management
- **Features**:
  - User session management
  - Token handling
  - Login/logout functionality
  - Profile management

## User Roles & Permissions

### Role Hierarchy
```
SUPER_ADMIN
├── Full system access
├── User management
└── System configuration

ADMIN
├── Organization management
├── User oversight
└── Reporting

PROVIDER_OWNER
├── Provider organization management
├── Staff management
└── Service delivery

PROVIDER_STAFF
├── Patient care
├── Referral management
└── Documentation

CASE_MANAGER
├── Client case management
├── Service coordination
└── Progress tracking

HOSPITAL_SW
├── Discharge planning
├── Patient advocacy
└── Resource coordination

VRS_SPECIALIST
├── Vocational rehabilitation
├── Eligibility assessment
└── Service planning

VENDOR
├── Service delivery
├── Order management
└── Performance tracking

PUBLIC
├── Basic dashboard access
├── Profile management
└── Limited features
```

## Protected Routes

### Admin Routes (`/admin/*`)
- **Required Roles**: `SUPER_ADMIN`, `ADMIN`
- **Protection**: AdminGuard component
- **Features**: System administration, user management

### Provider Routes (`/provider/*`)
- **Required Roles**: `PROVIDER_OWNER`, `PROVIDER_STAFF`
- **Protection**: ProviderGuard component
- **Features**: Patient management, service delivery

### Case Manager Routes (`/case-manager/*`)
- **Required Roles**: `CASE_MANAGER`
- **Protection**: CaseManagerGuard component
- **Features**: Client case management

### Hospital SW Routes (`/hospital-sw/*`)
- **Required Roles**: `HOSPITAL_SW`
- **Protection**: HospitalSWGuard component
- **Features**: Discharge planning, patient advocacy

### VRS Routes (`/vrs/*`)
- **Required Roles**: `VRS_SPECIALIST`
- **Protection**: VRSGuard component
- **Features**: Vocational rehabilitation services

### Vendor Routes (`/vendor/*`)
- **Required Roles**: `VENDOR`
- **Protection**: VendorGuard component
- **Features**: Service delivery, order management

### Public Routes (`/dashboard`)
- **Required Roles**: All roles
- **Protection**: RouteGuard component
- **Features**: Basic dashboard, profile management

## Implementation Examples

### 1. Protecting a Page with RouteGuard

```tsx
import { RouteGuard } from '@/components/auth/route-guard';
import { UserRole } from '@carelink/types';

export default function ProtectedPage() {
  return (
    <RouteGuard requiredRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <div>Admin-only content</div>
    </RouteGuard>
  );
}
```

### 2. Using Role-Specific Guards

```tsx
import { AdminGuard } from '@/components/auth/route-guard';

export default function AdminPage() {
  return (
    <AdminGuard>
      <div>Admin content</div>
    </AdminGuard>
  );
}
```

### 3. Using HOC Pattern

```tsx
import { withAdminAuth } from '@/components/auth/with-auth';

function AdminPage() {
  return <div>Admin content</div>;
}

export default withAdminAuth(AdminPage);
```

### 4. Custom Route Protection

```tsx
import { RouteGuard } from '@/components/auth/route-guard';

export default function CustomPage() {
  return (
    <RouteGuard 
      requiredRoles={[UserRole.PROVIDER_OWNER]}
      fallbackPath="/unauthorized"
      showLoading={true}
      showError={true}
    >
      <div>Provider owner content</div>
    </RouteGuard>
  );
}
```

## Security Features

### 1. Token-Based Authentication
- JWT tokens stored in HTTP-only cookies
- Automatic token validation on each request
- Token expiration handling

### 2. Role-Based Access Control (RBAC)
- Granular permission system
- Role hierarchy enforcement
- Dynamic route protection

### 3. Automatic Redirects
- Unauthenticated users → Sign-in page
- Wrong role → Appropriate dashboard
- Preserved redirect URLs

### 4. Loading States
- Smooth user experience during auth checks
- Loading indicators for async operations
- Error handling with user-friendly messages

## Error Handling

### 1. Authentication Errors
- Invalid/expired tokens
- Missing authentication
- Network errors

### 2. Authorization Errors
- Insufficient permissions
- Role mismatch
- Access denied scenarios

### 3. User Experience
- Clear error messages
- Helpful redirect suggestions
- Graceful fallbacks

## Best Practices

### 1. Always Use Guards
- Never rely solely on UI hiding
- Implement guards at the component level
- Use middleware for additional protection

### 2. Role Validation
- Validate roles on both client and server
- Use TypeScript for type safety
- Implement proper error boundaries

### 3. User Experience
- Show loading states during auth checks
- Provide clear error messages
- Maintain user context during redirects

### 4. Security
- Never expose sensitive data in client-side code
- Validate all user inputs
- Implement proper session management

## Testing

### 1. Unit Tests
- Test guard components
- Test role validation logic
- Test error scenarios

### 2. Integration Tests
- Test complete auth flows
- Test role-based redirects
- Test middleware functionality

### 3. E2E Tests
- Test user journeys
- Test unauthorized access attempts
- Test role switching scenarios

## Troubleshooting

### Common Issues

1. **"Access Denied" for valid users**
   - Check role assignment in database
   - Verify token payload
   - Check middleware configuration

2. **Infinite redirect loops**
   - Check redirect logic
   - Verify public route configuration
   - Check token validation

3. **Loading states not showing**
   - Check component mounting
   - Verify auth context state
   - Check error boundaries

### Debug Tools

1. **Browser DevTools**
   - Check cookies for auth tokens
   - Monitor network requests
   - Inspect component state

2. **Console Logging**
   - Enable debug mode
   - Check auth context logs
   - Monitor middleware execution

## Migration Guide

### From Old System
1. Replace old `ProtectedRoute` with new guards
2. Update role checks to use new system
3. Test all protected routes
4. Update error handling

### Adding New Roles
1. Update `UserRole` enum
2. Add role to middleware configuration
3. Create role-specific guard component
4. Update route protection rules
5. Test new role functionality

## Performance Considerations

### 1. Middleware Optimization
- Minimal processing in middleware
- Efficient token validation
- Cached role lookups

### 2. Component Optimization
- Lazy loading of protected components
- Memoization of auth checks
- Efficient re-renders

### 3. Network Optimization
- Minimize auth API calls
- Cache user data
- Optimize token refresh

This authentication and authorization system provides a robust, scalable, and secure foundation for the CareLinkMN application, ensuring that users can only access the resources and features appropriate to their role and permissions.
