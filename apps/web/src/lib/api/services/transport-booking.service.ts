import { apiService } from "../config";
import {
  TransportBooking,
  CreateTransportBookingData,
  UpdateTransportBookingData,
  ApiResponse,
} from "@carelink/types";

export class TransportBookingService {
  /**
   * Get transport booking for a discharge case
   */
  async getTransportBookingByCaseId(
    caseId: string
  ): Promise<ApiResponse<TransportBooking | null>> {
    return apiService.get<TransportBooking | null>(
      `/api/discharge-cases/${caseId}/transport-booking`
    );
  }

  /**
   * Create a transport booking for a discharge case
   */
  async createTransportBooking(
    caseId: string,
    data: CreateTransportBookingData
  ): Promise<ApiResponse<TransportBooking>> {
    return apiService.post<TransportBooking>(
      `/api/discharge-cases/${caseId}/transport-booking`,
      data
    );
  }

  /**
   * Update a transport booking
   */
  async updateTransportBooking(
    caseId: string,
    bookingId: string,
    data: UpdateTransportBookingData
  ): Promise<ApiResponse<TransportBooking>> {
    return apiService.patch<TransportBooking>(
      `/api/discharge-cases/${caseId}/transport-booking/${bookingId}`,
      data
    );
  }

  /**
   * Delete a transport booking
   */
  async deleteTransportBooking(
    caseId: string,
    bookingId: string
  ): Promise<ApiResponse<void>> {
    return apiService.delete<void>(
      `/api/discharge-cases/${caseId}/transport-booking/${bookingId}`
    );
  }
}

// Export singleton instance
export const transportBookingService = new TransportBookingService();

