import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { SessionUser } from '../types/auth';
import { ApiResponse } from '../types/common';
import { hasPermission, canAccessPHI, canCreateReferrals } from '../lib/rbac';
import { verifyToken } from '../lib/jwt';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // Middleware to require authentication
  requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Access token is required',
      } as ApiResponse);
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const payload = verifyToken(token);
      
      if (!payload) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        } as ApiResponse);
        return;
      }

      // Set user information from JWT payload
      req.user = {
        id: payload.userId,
        email: payload.email,
        firstName: '', // Will be populated from database if needed
        lastName: '',  // Will be populated from database if needed
        role: payload.role,
        emailVerified: false, // Default to false for token-based auth until refreshed
        organizationId: payload.organizationId,
      };

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token',
      } as ApiResponse);
    }
  };

  // Middleware to require specific role
  requireRole = (roles: string | string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const userRole = req.user.role;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions',
        } as ApiResponse);
        return;
      }

      next();
    };
  };

  // Middleware to require specific permission
  requirePermission = (permission: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      if (!hasPermission(req.user.role, permission)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions',
        } as ApiResponse);
        return;
      }

      next();
    };
  };

  // Middleware to require any of multiple permissions
  requireAnyPermission = (permissions: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const hasAnyPermission = permissions.some(permission => 
        hasPermission(req.user!.role, permission)
      );

      if (!hasAnyPermission) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions',
        } as ApiResponse);
        return;
      }

      next();
    };
  };

  // Middleware to require all permissions
  requireAllPermissions = (permissions: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        } as ApiResponse);
        return;
      }

      const hasAllPermissions = permissions.every(permission => 
        hasPermission(req.user!.role, permission)
      );

      if (!hasAllPermissions) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions',
        } as ApiResponse);
        return;
      }

      next();
    };
  };

  // Middleware to require organization access
  requireOrganization = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      } as ApiResponse);
      return;
    }

    // Super admins can access any organization
    if (req.user.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    // Check if user has organization access
    const organizationId = req.params.organizationId || req.body.organizationId;
    
    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Organization ID is required',
      } as ApiResponse);
      return;
    }

    if (req.user.organizationId !== organizationId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Access denied to this organization',
      } as ApiResponse);
      return;
    }

    next();
  };

  // Optional authentication middleware (doesn't fail if no token)
  optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    this.authService.verifyToken(token)
      .then((user) => {
        req.user = user || undefined;
        next();
      })
      .catch(() => {
        // Continue without authentication
        next();
      });
  };

  // Middleware to check if user can view PHI
  canViewPHI = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      } as ApiResponse);
      return;
    }

    if (!canAccessPHI(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Access to PHI not allowed',
      } as ApiResponse);
      return;
    }

    next();
  };

  // Middleware to check if user can create referrals
  canCreateReferrals = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      } as ApiResponse);
      return;
    }

    if (!canCreateReferrals(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Cannot create referrals',
      } as ApiResponse);
      return;
    }

    next();
  };
}
