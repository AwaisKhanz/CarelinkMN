import { AuthRepository } from "../repositories/auth.repository";
import { RegistrationService, OrganizationData, OrganizationSelectionData, RoleSpecificData } from "./registration.service";
import { EmailService } from "./email.service";
import { auditService } from "./audit.service";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  SessionUser,
} from "../types/auth";
import { Prisma } from "@prisma/client";
import { UserStatus, NotificationPreferences } from "@carelink/types";
import { UserRole as SharedUserRole } from "@carelink/types";
import { generateToken, verifyToken, JWTPayload } from "../lib/jwt";
import jwt from "jsonwebtoken";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from "../lib/password";
// Removed TRPC import - using custom error handling

export class AuthService {
  private authRepository: AuthRepository;
  private registrationService: RegistrationService;
  private emailService: EmailService;

  constructor() {
    this.authRepository = new AuthRepository();
    this.registrationService = new RegistrationService();
    this.emailService = new EmailService();
  }

  // Register a new user - simplified version
  async register(
    userData: RegisterRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.authRepository.findUserByEmail(
        userData.email
      );
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Use the registration service for user creation
      const result = await this.registrationService.registerUser(
        userData,
        ipAddress,
        userAgent
      );

      // Generate email verification token and send email
      const verificationToken = await this.authRepository.createEmailVerificationToken(result.user.id);
      await this.emailService.sendVerificationEmail(result.user, verificationToken);

      // Log registration event
      await auditService.logAuth(
        result.user.id,
        "REGISTER",
        {
          email: result.user.email,
          role: result.user.role,
        },
        ipAddress,
        userAgent
      );

      return {
        user: this.formatUserResponse(result.user),
        token: result.token,
      };
    } catch (error) {
      console.error("Registration error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Registration failed"
      );
    }
  }

  // Simple registration for PUBLIC users (current implementation)
  private async simpleRegister(
    userData: RegisterRequest
  ): Promise<AuthResponse> {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(userData.password);
    if (!passwordValidation.isValid) {
      throw new Error(
        `Password validation failed: ${passwordValidation.errors.join(", ")}`
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const user = await this.authRepository.createUser({
      ...userData,
      hashedPassword,
    });

    // Generate token
    const token = this.generateToken(user);

    // Generate email verification token and send email
    const verificationToken = await this.authRepository.createEmailVerificationToken(user.id);
    await this.emailService.sendVerificationEmail(user, verificationToken);

    // Log registration event
    await auditService.logAuth(
      user.id,
      "REGISTER",
      {
        email: user.email,
        role: user.role as SharedUserRole,
      }
    );

    return {
      user: this.formatUserResponse(user),
      token,
    };
  }

  // Helper method to determine if a role needs organization setup
  private needsOrganization(role: SharedUserRole): boolean {
    const rolesNeedingOrganization: SharedUserRole[] = [
      SharedUserRole.PROVIDER_OWNER,
      SharedUserRole.PROVIDER_STAFF,
      SharedUserRole.CASE_MANAGER,
      SharedUserRole.HOSPITAL_SW,
      SharedUserRole.VRS_SPECIALIST,
      SharedUserRole.VENDOR,
    ];
    return rolesNeedingOrganization.includes(role);
  }

  // Login user
  async login(
    loginData: LoginRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await this.authRepository.findUserByEmail(loginData.email);
      if (!user) {
        throw new Error("Invalid credentials");
      }

      // Check if user is active
      if (user.status !== UserStatus.ACTIVE) {
        throw new Error(
          "Account is not active. Please verify your email or contact support."
        );
      }

      // Verify password
      if (!user.password) {
        throw new Error("Invalid credentials");
      }

      const isPasswordValid = await verifyPassword(
        loginData.password,
        user.password
      );
      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      // Generate token
      const token = this.generateToken(user);

      // Update last login
      await this.authRepository.updateUserLastLogin(user.id);

      // Log login event
      await auditService.logAuth(
        user.id,
        "LOGIN",
        {
          email: user.email,
          role: user.role as SharedUserRole,
        },
        ipAddress,
        userAgent
      );

      return {
        user: this.formatUserResponse(user),
        token,
      };
    } catch (error) {
      console.error("Login error:", error);
      throw new Error(error instanceof Error ? error.message : "Login failed");
    }
  }

  // Logout user (no-op since we don't use sessions)
  async logout(): Promise<void> {
    // No session management needed with long-lived tokens
    return;
  }

  // Change password
  async changePassword(
    userId: string,
    passwordData: ChangePasswordRequest
  ): Promise<void> {
    try {
      // Get user
      const user = await this.authRepository.findUserById(userId);
      if (!user || !user.password) {
        throw new Error("User not found");
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(
        passwordData.currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      // Validate new password strength
      const passwordValidation = validatePasswordStrength(
        passwordData.newPassword
      );
      if (!passwordValidation.isValid) {
        throw new Error(
          `Password validation failed: ${passwordValidation.errors.join(", ")}`
        );
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(passwordData.newPassword);

      // Update password
      await this.authRepository.updateUserPassword(userId, hashedNewPassword);

      // Log password change event
      await auditService.logAuth(userId, "PASSWORD_CHANGE");
    } catch (error) {
      console.error("Change password error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Password change failed"
      );
    }
  }

  // Forgot password
  async forgotPassword(forgotData: ForgotPasswordRequest): Promise<void> {
    try {
      const user = await this.authRepository.findUserByEmail(forgotData.email);
      if (!user) {
        // Don't reveal if user exists or not - but still return success
        return;
      }

      // Generate and store reset token
      const resetToken = await this.authRepository.createPasswordResetToken(user.id);

      // Send email with reset link
      await this.emailService.sendPasswordResetEmail(user, resetToken);

      // Log forgot password event
      await auditService.logAuth(
        user.id,
        "PASSWORD_RESET",
        { email: user.email }
      );
    } catch (error) {
      console.error("Forgot password error:", error);
      throw new Error("Password reset request failed");
    }
  }

  // Reset password
  async resetPassword(resetData: ResetPasswordRequest): Promise<void> {
    try {
      // Find user by reset token
      const user = await this.authRepository.findUserByResetToken(resetData.token);
      if (!user) {
        throw new Error("Invalid or expired reset token");
      }

      // Validate new password strength
      const passwordValidation = validatePasswordStrength(
        resetData.newPassword
      );
      if (!passwordValidation.isValid) {
        throw new Error(
          `Password validation failed: ${passwordValidation.errors.join(", ")}`
        );
      }

      // Hash new password
      const hashedPassword = await hashPassword(resetData.newPassword);

      // Update password
      await this.authRepository.updateUserPassword(user.id, hashedPassword);

      // Mark reset token as used
      await this.authRepository.usePasswordResetToken(resetData.token);

      // Note: Session invalidation not needed with long-lived tokens

      // Log password reset event
      await auditService.logAuth(
        user.id,
        "PASSWORD_RESET",
        {
          resetCompleted: true,
          tokenUsed: resetData.token
        }
      );
    } catch (error) {
      console.error("Reset password error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Password reset failed"
      );
    }
  }

  // Verify email by token
  async verifyEmailByToken(token: string): Promise<{ user: SessionUser }> {
    try {
      // Find user by verification token
      const user = await this.authRepository.findUserByVerificationToken(token);
      if (!user) {
        throw new Error("Invalid or expired verification token");
      }

      // Verify user email and activate account
      await this.authRepository.verifyUserEmail(user.id);

      // Mark verification token as used
      await this.authRepository.useEmailVerificationToken(token);

      // Send welcome email
      const userWithOrg = await this.authRepository.findUserById(user.id);
      if (!userWithOrg) {
        throw new Error("User not found after verification");
      }

      await this.emailService.sendWelcomeEmail(userWithOrg, (userWithOrg as any).organization || undefined);

      // Log email verification event
      await auditService.logAuth(
        user.id,
        "EMAIL_VERIFY",
        { verificationToken: token }
      );

      return {
        user: this.formatUserResponse(userWithOrg)
      };
    } catch (error) {
      console.error("Email verification error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Email verification failed"
      );
    }
  }

  // Resend email verification
  async resendEmailVerification(email: string): Promise<void> {
    try {
      const user = await this.authRepository.findUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists - return success anyway
        return;
      }

      if (user.status === UserStatus.ACTIVE) {
        throw new Error("Email is already verified");
      }

      // Generate new verification token
      const verificationToken = await this.authRepository.createEmailVerificationToken(user.id);

      // Send verification email
      await this.emailService.resendVerificationEmail(user, verificationToken);

      // Log resend event
      await auditService.logAuth(
        user.id,
        "EMAIL_VERIFY",
        {
          email: user.email,
          resent: true
        }
      );
    } catch (error) {
      console.error("Resend verification error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to resend verification email"
      );
    }
  }

  // Private helper methods
  private generateToken(
    user: Prisma.UserGetPayload<{ include: { organization: true } }>
  ): string {
    return generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as SharedUserRole,
      organizationId: user.organizationId || undefined,
    });
  }

  private formatUserResponse(user: Prisma.UserGetPayload<{ include: { organization: true } }> | Prisma.UserGetPayload<{}>): SessionUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as SharedUserRole,
      organizationId: user.organizationId || undefined,
      organization: (user as any).organization
        ? {
            id: (user as any).organization.id,
            name: (user as any).organization.name,
            type: (user as any).organization.type,
          }
        : undefined,
    };
  }

  // Verify JWT token
  async verifyToken(token: string): Promise<SessionUser | null> {
    try {
      const payload = verifyToken(token);
      if (!payload) {
        return null;
      }

      // Get fresh user data
      const user = await this.authRepository.findUserById(payload.userId);
      if (!user || user.status !== UserStatus.ACTIVE) {
        return null;
      }

      return this.formatUserResponse(user);
    } catch (error) {
      return null;
    }
  }

  // Update user profile
  async updateProfile(userId: string, profileData: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
  }>): Promise<SessionUser> {
    try {
      const updatedUser = await this.authRepository.updateUser(userId, profileData);
      
      // Get user with organization for proper formatting
      const userWithOrg = await this.authRepository.findUserById(userId);
      if (!userWithOrg) {
        throw new Error("User not found after update");
      }
      
      // Log profile update
      await auditService.logAuth(
        userId,
        "PROFILE_UPDATE",
        { fields: Object.keys(profileData) }
      );

      return this.formatUserResponse(userWithOrg);
    } catch (error) {
      console.error("Update profile error:", error);
      throw new Error("Failed to update profile");
    }
  }

  // Update user status (admin function)
  async updateUserStatus(userId: string, status: UserStatus, reason?: string): Promise<void> {
    try {
      await this.authRepository.updateUserStatus(userId, status);
      
      // Log status change
      await auditService.logAuth(
        userId,
        "STATUS_CHANGE",
        { 
          newStatus: status,
          reason: reason || "No reason provided"
        }
      );
    } catch (error) {
      console.error("Update user status error:", error);
      throw new Error("Failed to update user status");
    }
  }

  // Get notification preferences
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const user = await this.authRepository.findUserById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Return default preferences if none exist
      const defaultPreferences: NotificationPreferences = {
        emailNotifications: true,
        emailNewReferrals: true,
        emailProviderResponses: true,
        emailPlacementUpdates: true,
        emailUrgentCases: true,
        inAppNotifications: true,
        inAppNewReferrals: true,
        inAppProviderResponses: true,
        inAppPlacementUpdates: true,
        inAppUrgentCases: true,
      };

      // Access notificationPreferences from user (Prisma JSON field)
      const prefs = (user as any).notificationPreferences;
      if (prefs) {
        // Parse JSON if it's stored as JSON string
        if (typeof prefs === 'string') {
          return JSON.parse(prefs) as NotificationPreferences;
        }
        return prefs as NotificationPreferences;
      }

      return defaultPreferences;
    } catch (error) {
      console.error("Get notification preferences error:", error);
      throw new Error("Failed to get notification preferences");
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences> {
    try {
      await this.authRepository.updateUser(userId, {
        notificationPreferences: preferences as any, // Prisma JSON type
      });

      // Log preferences update
      await auditService.logAuth(
        userId,
        "NOTIFICATION_PREFERENCES_UPDATE",
        { fields: Object.keys(preferences) }
      );

      return preferences;
    } catch (error) {
      console.error("Update notification preferences error:", error);
      throw new Error("Failed to update notification preferences");
    }
  }
}
