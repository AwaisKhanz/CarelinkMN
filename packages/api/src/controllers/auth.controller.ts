import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { RegistrationService } from "../services/registration.service";
import { PhoneVerificationService } from "../services/phone-verification.service";
import {
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  LoginSchema,
  RegisterSchema,
  ChangePasswordSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  AuthenticatedRequest,
} from "../types/auth";
import { ApiResponse } from "../types/common";
import { validationResult } from "express-validator";
import { UserRole } from "@carelink/types";

export class AuthController {
  private authService: AuthService;
  private registrationService: RegistrationService;
  private phoneVerificationService: PhoneVerificationService;

  constructor() {
    this.authService = new AuthService();
    this.registrationService = new RegistrationService();
    this.phoneVerificationService = new PhoneVerificationService();

    // Bind methods to preserve 'this' context
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.verifyEmail = this.verifyEmail.bind(this);
    this.resendVerification = this.resendVerification.bind(this);
    this.getProfile = this.getProfile.bind(this);
    this.me = this.me.bind(this);
  }

  // Register new user (handles all roles intelligently)
  async register(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Please check your input data",
          details: errors.array(),
        } as ApiResponse);
        return;
      }

      const userData: RegisterRequest = req.body;

      const ipAddress = req.ip;
      const userAgent = req.get("User-Agent");

      const result = await this.authService.register(
        userData,
        ipAddress,
        userAgent
      );

      res.status(201).json({
        success: true,
        data: result,
        message: "User registered successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({
        success: false,
        error: "Registration failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred during registration",
      } as ApiResponse);
    }
  }

  // Login user
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Please check your input data",
          details: errors.array(),
        } as ApiResponse);
        return;
      }

      const loginData: LoginRequest = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get("User-Agent");

      const result = await this.authService.login(
        loginData,
        ipAddress,
        userAgent
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Login successful",
      } as ApiResponse);
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({
        success: false,
        error: "Login failed",
        message: error instanceof Error ? error.message : "Invalid credentials",
      } as ApiResponse);
    }
  }

  // Logout user
  async logout(req: Request, res: Response): Promise<void> {
    try {
      await this.authService.logout();

      res.status(200).json({
        success: true,
        message: "Logout successful",
      } as ApiResponse);
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        error: "Logout failed",
        message: "An error occurred during logout",
      } as ApiResponse);
    }
  }

  // Change password
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Please check your input data",
          details: errors.array(),
        } as ApiResponse);
        return;
      }

      const userId = (req as unknown as AuthenticatedRequest).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const passwordData = req.body as unknown as ChangePasswordRequest;
      await this.authService.changePassword(userId, passwordData);

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Change password error:", error);
      res.status(400).json({
        success: false,
        error: "Password change failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while changing password",
      } as ApiResponse);
    }
  }

  // Forgot password
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Please check your input data",
          details: errors.array(),
        } as ApiResponse);
        return;
      }

      const forgotData: ForgotPasswordRequest = req.body;
      await this.authService.forgotPassword(forgotData);

      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent",
      } as ApiResponse);
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        success: false,
        error: "Request failed",
        message: "An error occurred while processing your request",
      } as ApiResponse);
    }
  }

  // Reset password
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: "Please check your input data",
          details: errors.array(),
        } as ApiResponse);
        return;
      }

      const resetData: ResetPasswordRequest = req.body;
      await this.authService.resetPassword(resetData);

      res.status(200).json({
        success: true,
        message: "Password reset successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(400).json({
        success: false,
        error: "Password reset failed",
        message:
          error instanceof Error
            ? error.message
            : "Invalid or expired reset token",
      } as ApiResponse);
    }
  }

  // Verify email by token
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        res.status(400).json({
          success: false,
          error: "Missing verification token",
          message: "Verification token is required",
        } as ApiResponse);
        return;
      }

      const result = await this.authService.verifyEmailByToken(token);

      res.status(200).json({
        success: true,
        data: result,
        message: "Email verified successfully! Welcome to CareLinkMN.",
      } as ApiResponse);
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(400).json({
        success: false,
        error: "Email verification failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred during email verification",
      } as ApiResponse);
    }
  }

  // Resend verification email
  async resendVerification(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: "Missing email",
          message: "Email address is required",
        } as ApiResponse);
        return;
      }

      await this.authService.resendEmailVerification(email);

      res.status(200).json({
        success: true,
        message:
          "If an account with that email exists and is not yet verified, a new verification email has been sent.",
      } as ApiResponse);
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(400).json({
        success: false,
        error: "Resend verification failed",
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while resending verification email",
      } as ApiResponse);
    }
  }

  // Get current user profile
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as unknown as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: { user },
        message: "Profile retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        error: "Profile retrieval failed",
        message: "An error occurred while retrieving profile",
      } as ApiResponse);
    }
  }

  // Get current user (me)
  async me(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as unknown as AuthenticatedRequest).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const user = await this.authService.getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: "Not Found",
          message: "User not found",
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
        message: "User retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({
        success: false,
        error: "User retrieval failed",
        message: "An error occurred while retrieving user",
      } as ApiResponse);
    }
  }

  // Send phone verification code
  async sendPhoneVerification(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as unknown as AuthenticatedRequest).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const { phoneNumber } = req.body;
      const result = await this.phoneVerificationService.sendVerificationCode(
        userId,
        phoneNumber
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
        } as ApiResponse);
      } else {
        res.status(400).json({
          success: false,
          error: "Verification failed",
          message: result.message,
        } as ApiResponse);
      }
    } catch (error) {
      console.error("Send phone verification error:", error);
      res.status(500).json({
        success: false,
        error: "Verification failed",
        message: "An error occurred while sending verification code",
      } as ApiResponse);
    }
  }

  // Verify phone code
  async verifyPhone(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as unknown as AuthenticatedRequest).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "User not authenticated",
        } as ApiResponse);
        return;
      }

      const { code } = req.body;
      const result = await this.phoneVerificationService.verifyCode(
        userId,
        code
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
        } as ApiResponse);
      } else {
        res.status(400).json({
          success: false,
          error: "Verification failed",
          message: result.message,
          attemptsRemaining: result.attemptsRemaining,
        } as ApiResponse);
      }
    } catch (error) {
      console.error("Verify phone error:", error);
      res.status(500).json({
        success: false,
        error: "Verification failed",
        message: "An error occurred while verifying phone number",
      } as ApiResponse);
    }
  }
}
