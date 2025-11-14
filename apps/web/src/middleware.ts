import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@carelink/types";

// Define protected routes and their required roles
const protectedRoutes = {
  // Admin routes
  "/admin": ["SUPER_ADMIN", "ADMIN"],

  // Provider routes
  "/provider": ["PROVIDER_OWNER", "PROVIDER_STAFF"],

  // Case Manager routes
  "/case-manager": ["CASE_MANAGER"],

  // Hospital Social Worker routes
  "/hospital-sw": ["HOSPITAL_SW"],

  // VRS Specialist routes
  "/vrs": ["VRS_SPECIALIST"],

  // Vendor routes
  "/vendor": ["VENDOR"],

  // Note: Generic /dashboard route removed - each role has its own dashboard
};

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/auth/signin",
  "/auth/signup",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/test-toast", // Remove this in production
];

// Helper function to check if a route is public
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname.startsWith(route));
}

// Helper function to get user role from token
function getUserRoleFromToken(request: NextRequest): UserRole | null {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) return null;

    // Decode JWT token (client-side decoding for middleware)
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role as UserRole;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

// Helper function to check if user has required role
function hasRequiredRole(
  userRole: UserRole | null,
  requiredRoles: UserRole[]
): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

// Helper function to get redirect URL based on role
function getRoleBasedRedirect(role: UserRole): string {
  const roleRedirects: Record<UserRole, string> = {
    SUPER_ADMIN: "/admin/dashboard",
    ADMIN: "/admin/dashboard",
    PROVIDER_OWNER: "/provider/dashboard",
    PROVIDER_STAFF: "/provider/dashboard",
    CASE_MANAGER: "/case-manager/dashboard",
    HOSPITAL_SW: "/hospital-sw/dashboard",
    VRS_SPECIALIST: "/vrs/dashboard",
    VENDOR: "/vendor/dashboard",
    PUBLIC: "/search", // Public users go to search page
  };

  return roleRedirects[role] || "/search";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Get user role from token
  const userRole = getUserRoleFromToken(request);

  // If no token/role, redirect to signin
  if (!userRole) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Check if user is trying to access a role-specific route
  for (const [route, requiredRoles] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      // Check if user has required role
      if (!hasRequiredRole(userRole, requiredRoles as UserRole[])) {
        // Redirect to appropriate dashboard based on user's role
        const redirectUrl = getRoleBasedRedirect(userRole);
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
      break;
    }
  }

  // Allow access if all checks pass
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
