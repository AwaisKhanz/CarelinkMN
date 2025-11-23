import { apiService } from "../config";

export interface ContactFormData {
  name: string;
  email: string;
  organization?: string;
  role?: string;
  message: string;
}

export interface ContactFormResponse {
  success: boolean;
  message: string;
  data?: {
    submittedAt: string;
  };
}

class ContactService {
  /**
   * Submit contact form
   */
  async submitContactForm(
    data: ContactFormData
  ): Promise<ContactFormResponse> {
    const response = await apiService.post<ContactFormResponse>(
      "/contact/submit",
      data
    );
    
    if (!response.data) {
      throw new Error("No response data received");
    }
    
    return response.data;
  }
}

export const contactService = new ContactService();
