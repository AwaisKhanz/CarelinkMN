import { Request, Response } from "express";
import { storageService } from "../services/storage.service";
import { ProviderService } from "../services/provider.service";
import { ApiResponse } from "../types/common";
import { AuthenticatedRequest } from "../types/auth";
import { validationResult } from "express-validator";
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  }
});

export class UploadController {
  private providerService: ProviderService;

  constructor() {
    this.providerService = new ProviderService();

    // Bind methods to preserve 'this' context
    this.uploadDocument = this.uploadDocument.bind(this);
  }

  /**
   * Upload document and return URL
   */
  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const uploadSingle = upload.single('document');

      uploadSingle(req, res, async (err) => {
        if (err) {
          console.error("File upload error:", err);
          res.status(400).json({
            success: false,
            error: "File upload failed",
            message: err.message,
          } as ApiResponse);
          return;
        }

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

        const user = (req as unknown as AuthenticatedRequest).user;

        if (!(req as any).file) {
          res.status(400).json({
            success: false,
            error: "No file uploaded",
            message: "Please select a file to upload",
          } as ApiResponse);
          return;
        }

        const { documentType = 'document', folder = 'general' } = req.body;

        // Get provider ID from user for provider-specific uploads
        let uploadPath = `${folder}`;
        if (user.role?.includes('PROVIDER')) {
          const provider = await this.providerService.getProviderByUserId(user.id);
          if (provider) {
            uploadPath = `providers/${provider.id}/${folder}`;
          }
        } else {
          // For other users, use user ID
          uploadPath = `users/${user.id}/${folder}`;
        }

        // Upload file to Supabase
        const uploadResult = await storageService.uploadFile(
          (req as any).file.buffer,
          (req as any).file.originalname,
          {
            folder: uploadPath,
            allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
            maxFileSize: 10 * 1024 * 1024 // 10MB
          }
        );

        if (!uploadResult.success) {
          res.status(400).json({
            success: false,
            error: "File upload failed",
            message: uploadResult.error,
          } as ApiResponse);
          return;
        }

        res.status(200).json({
          success: true,
          data: {
            url: uploadResult.url,
            fileName: uploadResult.fileName,
            fileSize: uploadResult.fileSize,
            documentType,
            originalName: (req as any).file.originalname,
            mimeType: (req as any).file.mimetype
          },
          message: "Document uploaded successfully",
        } as ApiResponse);
      });
    } catch (error) {
      console.error("Upload document error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "Failed to upload document",
      } as ApiResponse);
    }
  }
}