import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { ApiResponse } from "@carelink/types";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_TIMEOUT = 30000; // 30 seconds

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage or context
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Only redirect if we're not already on an auth page and we had a token
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.startsWith("/auth/");
        const hadToken = localStorage.getItem("auth_token");
        
        // Only redirect if:
        // 1. We're not already on an auth page (to prevent redirect loops)
        // 2. We had a token that became invalid (not a failed login attempt)
        if (!isAuthPage && hadToken) {
          localStorage.removeItem("auth_token");
          window.location.href = "/auth/signin";
        }
      }
    }

    return Promise.reject(error);
  }
);

// Generic API methods
export class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = apiClient;
  }

  // GET request
  async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // POST request
  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<ApiResponse<T>>(
        url,
        data,
        config
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PUT request
  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PATCH request
  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<ApiResponse<T>>(
        url,
        data,
        config
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // DELETE request
  async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Handle errors
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const message =
          (error.response.data as ApiResponse)?.message ||
          (error.response.data as ApiResponse)?.error ||
          "An error occurred";
        return new Error(message);
      }

      if (error.request) {
        return new Error("Network error - please check your connection");
      }

      return new Error(error.message || "An unexpected error occurred");
    }

    return error instanceof Error
      ? error
      : new Error("An unexpected error occurred");
  }

  // Set auth token
  setAuthToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.Authorization;
    }
  }

  // Get current token
  getAuthToken(): string | null {
    return (
      (this.client.defaults.headers.Authorization as string)?.replace(
        "Bearer ",
        ""
      ) || null
    );
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
