"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserRole } from "@carelink/types";
import { authToasts } from "@/lib/toast";
import { apiService } from "@/lib/api/config";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status?: string;
  emailVerified: boolean;
  organizationId?: string;
  organization?: {
    id: string;
    name: string;
    type: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("auth_token");
        if (storedToken) {
          setToken(storedToken);
          apiService.setAuthToken(storedToken);

          // Verify token and get user profile using authService
          try {
            const { authService } = await import("@/lib/api");
            const user = await authService.getCurrentUser();
            // Ensure emailVerified is always a boolean (fallback to false if undefined/null)
            setUser({
              ...user,
              emailVerified: user.emailVerified ?? false,
            });
          } catch (error) {
            // Token is invalid or expired, clear storage
            console.error("Auth initialization error:", error);
            localStorage.removeItem("auth_token");
            setToken(null);
            apiService.setAuthToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        localStorage.removeItem("auth_token");
        setToken(null);
        apiService.setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const { authService } = await import("@/lib/api");
      const authData = await authService.login({ email, password });

      // Ensure emailVerified is always a boolean
      const user = {
        ...authData.user,
        emailVerified: authData.user.emailVerified ?? false,
      };

      setUser(user);
      setToken(authData.token);
      localStorage.setItem("auth_token", authData.token);
      apiService.setAuthToken(authData.token);

      // Return the user data for immediate use
      return user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const { authService } = await import("@/lib/api");
      const authData = await authService.register(data);

      // Ensure emailVerified is always a boolean (should be false for new registrations)
      const user = {
        ...authData.user,
        emailVerified: authData.user.emailVerified ?? false,
      };

      setUser(user);
      setToken(authData.token);
      localStorage.setItem("auth_token", authData.token);
      apiService.setAuthToken(authData.token);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { authService } = await import("@/lib/api");
      await authService.logout();
      authToasts.logoutSuccess();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("auth_token");
      apiService.setAuthToken(null);
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await apiService.put<{ user: User }>(
        "/api/users/profile",
        data
      );

      if (!response.success || !response.data?.user) {
        throw new Error(response.message || "Profile update failed");
      }

      // Ensure emailVerified is always a boolean
      const user = {
        ...response.data.user,
        emailVerified: response.data.user.emailVerified ?? false,
      };

      setUser(user);
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (!token) return;

    try {
      const { authService } = await import("@/lib/api");
      await authService.changePassword({ currentPassword, newPassword });
    } catch (error) {
      console.error("Password change error:", error);
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await apiService.post("/api/auth/forgot-password", {
        email,
      });

      if (!response.success) {
        throw new Error(response.message || "Password reset request failed");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await apiService.post("/api/auth/reset-password", {
        token,
        newPassword,
      });

      if (!response.success) {
        throw new Error(response.message || "Password reset failed");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
