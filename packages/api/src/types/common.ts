// Common API types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Request with user context
export interface AuthenticatedRequestCommon extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    organizationId?: string;
  };
}

// Middleware types
export interface AuthMiddlewareOptions {
  requiredRole?: string;
  requiredRoles?: string[];
  requiredPermission?: string;
  requiredPermissions?: string[];
  allowPublic?: boolean;
}

// Validation error
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationErrorResponse extends ErrorResponse {
  errors: ValidationError[];
}
