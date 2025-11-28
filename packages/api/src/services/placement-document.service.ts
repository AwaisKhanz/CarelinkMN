import { db } from "@carelink/database";
import { DocumentCategory } from "@prisma/client";

interface UploadDocumentData {
  fileName: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  storageUrl: string;
  notes?: string;
  expiresAt?: Date;
}

export class PlacementDocumentService {
  /**
   * Upload a document for a placement
   */
  async uploadDocument(
    placementId: string,
    data: UploadDocumentData,
    userId: string
  ): Promise<any> {
    try {
      // Verify placement exists and user has access
      const placement = await db.placement.findUnique({
        where: { id: placementId },
        include: {
          provider: {
            include: {
              organization: {
                include: {
                  users: {
                    where: { id: userId },
                  },
                },
              },
            },
          },
        },
      });

      if (!placement) {
        throw new Error("Placement not found");
      }

      if (placement.provider.organization.users.length === 0) {
        throw new Error("Access denied: You don't have permission to manage this placement");
      }

      const document = await db.placementDocument.create({
        data: {
          placementId,
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
          category: data.category,
          storageUrl: data.storageUrl,
          uploadedBy: userId,
          notes: data.notes,
          expiresAt: data.expiresAt,
        },
      });

      // Emit socket event for real-time update
      try {
        const { getSocketServer } = await import("../websocket/socket.server");
        const socketServer = getSocketServer();
        socketServer.emitToPlacement(placementId, "placement:document:uploaded", {
          placementId,
          document,
        });
      } catch (socketError) {
        console.error("Failed to emit socket event:", socketError);
      }

      return document;
    } catch (error) {
      console.error("Upload document error:", error);
      throw error instanceof Error ? error : new Error("Failed to upload document");
    }
  }

  /**
   * Get all documents for a placement
   */
  async getDocuments(placementId: string, userId: string): Promise<any[]> {
    try{
      // Check user role first
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      // Admin and Super Admin have system-wide access
      const isSystemAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

      if (!isSystemAdmin) {
        // Check if user is Hospital SW and the placement is for their discharge case
        if (user?.role === "HOSPITAL_SW") {
          const placement = await db.placement.findFirst({
            where: {
              id: placementId,
              dischargeCase: {
                socialWorkerId: userId,
              },
            },
          });
          if (!placement) {
            throw new Error("Access denied");
          }
        } else {
          // For provider users, verify access through organization
          const placement = await db.placement.findUnique({
            where: { id: placementId },
            include: {
              provider: {
                include: {
                  organization: {
                    include: {
                      users: {
                        where: { id: userId },
                      },
                    },
                  },
                },
              },
            },
          });

          if (!placement) {
            throw new Error("Placement not found");
          }

          if (placement.provider.organization.users.length === 0) {
            throw new Error("Access denied");
          }
        }
      } else {
        // For admins, just verify placement exists
        const placement = await db.placement.findUnique({
          where: { id: placementId },
          select: { id: true },
        });

        if (!placement) {
          throw new Error("Placement not found");
        }
      }

      const documents = await db.placementDocument.findMany({
        where: { placementId },
        orderBy: { uploadedAt: "desc" },
      });

      return documents;
    } catch (error) {
      console.error("Get documents error:", error);
      throw error instanceof Error ? error : new Error("Failed to retrieve documents");
    }
  }

  /**
   * Get a single document by ID
   */
  async getDocumentById(documentId: string, userId: string): Promise<any> {
    try {
      const document = await db.placementDocument.findUnique({
        where: { id: documentId },
        include: {
          placement: {
            include: {
              provider: {
                include: {
                  organization: {
                    include: {
                      users: {
                        where: { id: userId },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      if (document.placement.provider.organization.users.length === 0) {
        throw new Error("Access denied");
      }

      return document;
    } catch (error) {
      console.error("Get document error:", error);
      throw error instanceof Error ? error : new Error("Failed to retrieve document");
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    try {
      // Verify document exists and user has access
      const document = await db.placementDocument.findUnique({
        where: { id: documentId },
        include: {
          placement: {
            include: {
              provider: {
                include: {
                  organization: {
                    include: {
                      users: {
                        where: { id: userId },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      if (document.placement.provider.organization.users.length === 0) {
        throw new Error("Access denied");
      }

      await db.placementDocument.delete({
        where: { id: documentId },
      });

      // Emit socket event for real-time update
      try {
        const { getSocketServer } = await import("../websocket/socket.server");
        const socketServer = getSocketServer();
        socketServer.emitToPlacement(document.placementId, "placement:document:deleted", {
          placementId: document.placementId,
          documentId,
        });
      } catch (socketError) {
        console.error("Failed to emit socket event:", socketError);
      }

      // TODO: Delete file from storage (S3/cloud storage)
      // This should be implemented based on your storage service
    } catch (error) {
      console.error("Delete document error:", error);
      throw error instanceof Error ? error : new Error("Failed to delete document");
    }
  }

  /**
   * Get documents by category
   */
  async getDocumentsByCategory(
    placementId: string,
    category: DocumentCategory,
    userId: string
  ): Promise<any[]> {
    try {
      // Verify access
      const placement = await db.placement.findUnique({
        where: { id: placementId },
        include: {
          provider: {
            include: {
              organization: {
                include: {
                  users: {
                    where: { id: userId },
                  },
                },
              },
            },
          },
        },
      });

      if (!placement) {
        throw new Error("Placement not found");
      }

      if (placement.provider.organization.users.length === 0) {
        throw new Error("Access denied");
      }

      const documents = await db.placementDocument.findMany({
        where: {
          placementId,
          category,
        },
        orderBy: { uploadedAt: "desc" },
      });

      return documents;
    } catch (error) {
      console.error("Get documents by category error:", error);
      throw error instanceof Error ? error : new Error("Failed to retrieve documents");
    }
  }

  /**
   * Get expiring documents
   */
  async getExpiringDocuments(
    placementId: string,
    daysAhead: number,
    userId: string
  ): Promise<any[]> {
    try {
      // Verify access
      const placement = await db.placement.findUnique({
        where: { id: placementId },
        include: {
          provider: {
            include: {
              organization: {
                include: {
                  users: {
                    where: { id: userId },
                  },
                },
              },
            },
          },
        },
      });

      if (!placement) {
        throw new Error("Placement not found");
      }

      if (placement.provider.organization.users.length === 0) {
        throw new Error("Access denied");
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const documents = await db.placementDocument.findMany({
        where: {
          placementId,
          expiresAt: {
            lte: futureDate,
            gte: new Date(),
          },
        },
        orderBy: { expiresAt: "asc" },
      });

      return documents;
    } catch (error) {
      console.error("Get expiring documents error:", error);
      throw error instanceof Error ? error : new Error("Failed to retrieve expiring documents");
    }
  }
}
