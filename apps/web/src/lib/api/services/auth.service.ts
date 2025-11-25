import { apiService } from "../config";
import { ApiResponse, UserRole } from "@carelink/types";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status: string;
  emailVerified: boolean;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export class AuthService {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      "/api/auth/login",
      credentials
    );
    const data = response.data!;

    // Store token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", data.token);
      apiService.setAuthToken(data.token);
    }

    return data;
  }

  // Register
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      "/api/auth/register",
      data
    );
    const authData = response.data!;

    // Store token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", authData.token);
      apiService.setAuthToken(authData.token);
    }

    return authData;
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await apiService.post("/api/auth/logout");
    } catch (error) {
      // Ignore logout errors
    } finally {
      // Clear token
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        apiService.setAuthToken(null);
      }
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response = await apiService.get<User>("/api/auth/me");
    return response.data!;
  }

  // Change password
  async changePassword(data: ChangePasswordData): Promise<void> {
    await apiService.post("/api/auth/change-password", data);
  }

  // Forgot password
  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    await apiService.post("/api/auth/forgot-password", data);
  }

  // Reset password
  async resetPassword(data: ResetPasswordData): Promise<void> {
    await apiService.post("/api/auth/reset-password", data);
  }

  // Verify email
  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    return await apiService.get<void>(
      `/api/auth/verify-email?token=${encodeURIComponent(token)}`
    );
  }

  // Resend verification email
  async resendVerificationEmail(email: string): Promise<ApiResponse<void>> {
    return await apiService.post<void>("/api/auth/resend-verification", {
      email,
    });
  }

  // Refresh token
  async refreshToken(): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>("/api/auth/refresh");
    const data = response.data!;

    // Store new token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", data.token);
      apiService.setAuthToken(data.token);
    }

    return data;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Get stored token
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  }

  // Initialize auth state
  initializeAuth(): void {
    const token = this.getToken();
    if (token) {
      apiService.setAuthToken(token);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
