import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

export interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
}

export interface FileUploadOptions {
  folder?: string;
  allowedTypes?: string[];
  maxFileSize?: number; // in bytes
}

export class SupabaseStorageService {
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.bucketName =
      process.env.SUPABASE_STORAGE_BUCKET || "carelink-documents";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Supabase configuration missing. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Upload a file to Supabase storage
   */
  async uploadFile(
    file: Buffer | Uint8Array | File,
    originalName: string,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    try {
      const {
        folder = "uploads",
        allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/jpg",
          "application/pdf",
          "image/gif",
        ],
        maxFileSize = 10 * 1024 * 1024, // 10MB default
      } = options;

      // Generate unique filename
      const fileExtension = originalName.split(".").pop()?.toLowerCase() || "";
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `${folder}/${uniqueFileName}`;

      // Validate file size
      const fileSize =
        file instanceof File
          ? file.size
          : file instanceof Buffer
            ? file.length
            : file.byteLength;

      if (fileSize > maxFileSize) {
        return {
          success: false,
          error: `File size exceeds maximum allowed size of ${Math.round(maxFileSize / 1024 / 1024)}MB`,
        };
      }

      // Validate file type (basic validation)
      const fileType = this.getFileTypeFromExtension(fileExtension);
      if (allowedTypes.length > 0 && !allowedTypes.includes(fileType)) {
        return {
          success: false,
          error: `File type ${fileType} is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
        };
      }

      // Upload to Supabase
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          contentType: fileType,
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        return {
          success: false,
          error: `Upload failed: ${error.message}`,
        };
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return {
        success: true,
        url: urlData.publicUrl,
        fileName: uniqueFileName,
        fileSize,
      };
    } catch (error) {
      console.error("File upload error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown upload error",
      };
    }
  }

  /**
   * Delete a file from Supabase storage
   */
  async deleteFile(
    filePath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown delete error",
      };
    }
  }

  /**
   * Generate a signed URL for temporary access to a file
   */
  async getSignedUrl(
    filePath: string,
    expiresIn: number = 3600
  ): Promise<{ url?: string; error?: string }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        return { error: error.message };
      }

      return { url: data.signedUrl };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error generating signed URL",
      };
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(
    filePath: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(filePath.split("/").slice(0, -1).join("/"), {
          search: filePath.split("/").pop(),
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data?.[0] };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error getting file info",
      };
    }
  }

  /**
   * Initialize storage bucket if it doesn't exist
   */
  async initializeBucket(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } =
        await this.supabase.storage.listBuckets();

      if (listError) {
        return { success: false, error: listError.message };
      }

      const bucketExists = buckets?.some(
        (bucket) => bucket.name === this.bucketName
      );

      if (!bucketExists) {
        // Create bucket
        const { error: createError } = await this.supabase.storage.createBucket(
          this.bucketName,
          {
            public: false,
            allowedMimeTypes: [
              "image/jpeg",
              "image/png",
              "image/jpg",
              "image/gif",
              "application/pdf",
            ],
            fileSizeLimit: 10 * 1024 * 1024, // 10MB
          }
        );

        if (createError) {
          return { success: false, error: createError.message };
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown initialization error",
      };
    }
  }

  /**
   * Helper method to get MIME type from file extension
   */
  private getFileTypeFromExtension(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
    };

    return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
  }
}

// Singleton instance
export const storageService = new SupabaseStorageService();
