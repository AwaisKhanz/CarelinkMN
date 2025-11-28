import { apiService } from "../config";
import {
  Vendor,
  VendorLead,
  TransportBooking,
  GetVendorLeadsParams,
  VendorLeadsResponse,
  GetVendorBookingsParams,
  VendorBookingsResponse,
  VendorAnalytics,
  UpdateVendorData,
  UpdateLeadStatusData,
  BookingStatus,
  LeadStatus,
  ApiResponse,
} from "@carelink/types";

// ============================================
// VENDOR SERVICE
// ============================================

interface GetVendorByUserIdResponse extends ApiResponse<Vendor> {}
interface GetVendorByIdResponse extends ApiResponse<Vendor> {}
interface UpdateVendorResponse extends ApiResponse<Vendor> {}
interface GetVendorLeadsResponse extends ApiResponse<VendorLeadsResponse> {}
interface UpdateLeadStatusResponse extends ApiResponse<VendorLead> {}
interface GetVendorBookingsResponse
  extends ApiResponse<VendorBookingsResponse> {}
interface UpdateBookingStatusResponse extends ApiResponse<TransportBooking> {}
interface GetVendorAnalyticsResponse extends ApiResponse<VendorAnalytics> {}

interface UpdateBookingStatusData {
  status: BookingStatus;
  confirmationNumber?: string;
  driverName?: string;
  driverPhone?: string;
  actualCost?: number;
  completedAt?: string | Date;
}

export const vendorService = {
  /**
   * Search vendors
   */
  async searchVendors(params: {
    search?: string;
    organizationId?: string;
    category?: string;
    limit?: number;
  }): Promise<ApiResponse<Vendor[]>> {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append("search", params.search);
    if (params.organizationId) queryParams.append("organizationId", params.organizationId);
    if (params.category) queryParams.append("category", params.category);
    if (params.limit) queryParams.append("limit", params.limit.toString());

    const query = queryParams.toString();
    return apiService.get<Vendor[]>(`/api/vendors${query ? `?${query}` : ""}`);
  },

  /**
   * Get vendor by user ID
   */
  async getVendorByUserId(userId: string): Promise<GetVendorByUserIdResponse> {
    return apiService.get<Vendor>(`/api/vendors/by-user/${userId}`);
  },

  /**
   * Get vendor by vendor ID
   */
  async getVendorById(vendorId: string): Promise<GetVendorByIdResponse> {
    return apiService.get<Vendor>(`/api/vendors/${vendorId}`);
  },

  /**
   * Update vendor profile
   */
  async updateVendor(
    vendorId: string,
    data: UpdateVendorData
  ): Promise<UpdateVendorResponse> {
    return apiService.put<Vendor>(`/api/vendors/${vendorId}`, data);
  },

  /**
   * Get vendor leads
   */
  async getVendorLeads(
    vendorId: string,
    params: GetVendorLeadsParams
  ): Promise<GetVendorLeadsResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.status) queryParams.append("status", params.status);
    if (params.source) queryParams.append("source", params.source);
    if (params.search) queryParams.append("search", params.search);

    const query = queryParams.toString();
    return apiService.get<VendorLeadsResponse>(
      `/api/vendors/${vendorId}/leads${query ? `?${query}` : ""}`
    );
  },

  /**
   * Update lead status
   */
  async updateLeadStatus(
    vendorId: string,
    leadId: string,
    data: UpdateLeadStatusData
  ): Promise<UpdateLeadStatusResponse> {
    return apiService.put<VendorLead>(
      `/api/vendors/${vendorId}/leads/${leadId}/status`,
      data
    );
  },

  /**
   * Get vendor bookings
   */
  async getVendorBookings(
    vendorId: string,
    params: GetVendorBookingsParams
  ): Promise<GetVendorBookingsResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.status) queryParams.append("status", params.status);
    if (params.search) queryParams.append("search", params.search);

    const query = queryParams.toString();
    return apiService.get<VendorBookingsResponse>(
      `/api/vendors/${vendorId}/bookings${query ? `?${query}` : ""}`
    );
  },

  /**
   * Update booking status
   */
  async updateBookingStatus(
    vendorId: string,
    bookingId: string,
    data: UpdateBookingStatusData
  ): Promise<UpdateBookingStatusResponse> {
    return apiService.put<TransportBooking>(
      `/api/vendors/${vendorId}/bookings/${bookingId}/status`,
      data
    );
  },

  /**
   * Get vendor analytics
   */
  async getVendorAnalytics(
    vendorId: string
  ): Promise<GetVendorAnalyticsResponse> {
    return apiService.get<VendorAnalytics>(`/api/vendors/${vendorId}/analytics`);
  },
};

// Export types
export type {
  GetVendorByUserIdResponse,
  GetVendorByIdResponse,
  UpdateVendorResponse,
  GetVendorLeadsResponse,
  UpdateLeadStatusResponse,
  GetVendorBookingsResponse,
  UpdateBookingStatusResponse,
  GetVendorAnalyticsResponse,
  UpdateBookingStatusData,
};
