import { ApiResponse } from "@carelink/types";

export interface FileUploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  documentType: string;
  originalName: string;
  mimeType: string;
}

export class UploadService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "http://localhost:3001";
  }

  /**
   * Upload a file to the server
   * @param file - The file to upload
   * @param documentType - Type of document (e.g., 'license', 'photo', 'document')
   * @param folder - Folder path in storage (e.g., 'licenses', 'photos', 'homes')
   * @returns Promise with upload response containing URL and metadata
   */
  async uploadFile(
    file: File,
    documentType: string = "document",
    folder: string = "general"
  ): Promise<FileUploadResponse> {
    const token = localStorage.getItem("auth_token");
    const formData = new FormData();
    formData.append("document", file);
    formData.append("documentType", documentType);
    formData.append("folder", folder);

    const response = await fetch(`${this.baseUrl}/api/upload/document`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result: ApiResponse<FileUploadResponse> = await response.json();
    return result.data!;
  }
}

export const uploadService = new UploadService();
