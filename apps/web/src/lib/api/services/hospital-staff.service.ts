import { apiService } from '../config';
import { ApiResponse } from '@carelink/types';

export interface HospitalStaff {
  id: string;
  organizationId: string;
  department?: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
    type: string;
    status?: string;
    city?: string;
    addressLine1?: string;
    addressLine2?: string;
    state?: string;
    zipCode?: string;
    county?: string;
    phone?: string;
    email?: string;
    website?: string;
    ein?: string;
    fax?: string;
  };
}

export interface UpdateHospitalStaffData {
  department?: string;
  title?: string;
}

export class HospitalStaffService {
  /**
   * Get hospital staff profile by user ID
   */
  async getHospitalStaffByUserId(userId: string): Promise<HospitalStaff | null> {
    try {
      const response = await apiService.get<HospitalStaff>(
        `/api/hospital-staff/by-user/${userId}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Get hospital staff error:', error);
      throw error;
    }
  }

  /**
   * Update hospital staff profile
   */
  async updateHospitalStaff(
    userId: string,
    data: UpdateHospitalStaffData
  ): Promise<HospitalStaff> {
    try {
      const response = await apiService.put<HospitalStaff>(
        `/api/hospital-staff/by-user/${userId}`,
        data
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to update hospital staff profile');
    } catch (error) {
      console.error('Update hospital staff error:', error);
      throw error;
    }
  }
}

export const hospitalStaffService = new HospitalStaffService();

