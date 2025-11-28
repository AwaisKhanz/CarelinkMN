import { db } from "@carelink/database";
import { UpdateCategory } from "@prisma/client";

interface CreateFamilyContactData {
  name: string;
  relationship: string;
  email: string;
  phone?: string;
  isPrimary?: boolean;
  canReceiveUpdates?: boolean;
}

interface CreateUpdateData {
  title: string;
  message: string;
  category: UpdateCategory;
  photos?: string[];
}

export class PlacementFamilyService {
  /**
   * Add a family contact to a placement
   */
  async addFamilyContact(
    placementId: string,
    data: CreateFamilyContactData,
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
        throw new Error("Access denied");
      }

      // If this is set as primary, unset other primary contacts
      if (data.isPrimary) {
        await db.placementFamilyContact.updateMany({
          where: {
            placementId,
            isPrimary: true,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      const contact = await db.placementFamilyContact.create({
        data: {
          placementId,
          name: data.name,
          relationship: data.relationship,
          email: data.email,
          phone: data.phone,
          isPrimary: data.isPrimary ?? false,
          canReceiveUpdates: data.canReceiveUpdates ?? true,
        },
      });

      // Emit socket event for real-time updates
      try {
        const { getSocketServer } = await import("../websocket/socket.server");
        const socketServer = getSocketServer();
        
        // Get provider users and case manager/social worker
        const recipientIds: string[] = [];
        
        // Add provider users
        if (placement.provider.organization.users) {
          recipientIds.push(...placement.provider.organization.users.map(u => u.id));
        }
        
        // Add case manager or social worker
        const fullPlacement = await db.placement.findUnique({
          where: { id: placementId },
          select: {
            referral: { select: { caseManagerId: true } },
            dischargeCase: { select: { socialWorkerId: true } }
          }
        });
        
        if (fullPlacement?.referral?.caseManagerId) {
          recipientIds.push(fullPlacement.referral.caseManagerId);
        }
        if (fullPlacement?.dischargeCase?.socialWorkerId) {
          recipientIds.push(fullPlacement.dischargeCase.socialWorkerId);
        }
        
        recipientIds.forEach(userId => {
          socketServer.getIO().to(`user:${userId}`).emit("family-contact:created", {
            placementId,
            contactId: contact.id,
            name: contact.name
          });
        });
      } catch (socketError) {
        console.warn("Failed to emit socket event:", socketError);
      }

      return contact;
    } catch (error) {
      console.error("Add family contact error:", error);
      throw error instanceof Error ? error : new Error("Failed to add family contact");
    }
  }

  /**
   * Get all family contacts for a placement
   */
  async getFamilyContacts(placementId: string, userId: string): Promise<any[]> {
    try {
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

      const contacts = await db.placementFamilyContact.findMany({
        where: { placementId },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      });

      return contacts;
    } catch (error) {
      console.error("Get family contacts error:", error);
      throw error instanceof Error ? error : new Error("Failed to retrieve family contacts");
    }
  }

  /**
   * Update a family contact
   */
  async updateFamilyContact(
    contactId: string,
    data: Partial<CreateFamilyContactData>,
    userId: string
  ): Promise<any> {
    try {
      // Verify contact exists and user has access
      const contact = await db.placementFamilyContact.findUnique({
        where: { id: contactId },
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

      if (!contact) {
        throw new Error("Family contact not found");
      }

      if (contact.placement.provider.organization.users.length === 0) {
        throw new Error("Access denied");
      }

      // If setting as primary, unset other primary contacts
      if (data.isPrimary) {
        await db.placementFamilyContact.updateMany({
          where: {
            placementId: contact.placementId,
            isPrimary: true,
            id: { not: contactId },
          },
          data: {
            isPrimary: false,
          },
        });
      }

      const updated = await db.placementFamilyContact.update({
        where: { id: contactId },
        data,
      });

      // Emit socket event for real-time updates
      try {
        const { getSocketServer } = await import("../websocket/socket.server");
        const socketServer = getSocketServer();
        
        socketServer.getIO().emit("family-contact:updated", {
          placementId: contact.placementId,
          contactId,
        });
      } catch (socketError) {
        console.warn("Failed to emit socket event:", socketError);
      }

      return updated;
    } catch (error) {
      console.error("Update family contact error:", error);
      throw error instanceof Error ? error : new Error("Failed to update family contact");
    }
  }

  /**
   * Delete a family contact
   */
  async deleteFamilyContact(contactId: string, userId: string): Promise<void> {
    try {
      // Verify contact exists and user has access
      const contact = await db.placementFamilyContact.findUnique({
        where: { id: contactId },
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

      if (!contact) {
        throw new Error("Family contact not found");
      }

      if (contact.placement.provider.organization.users.length === 0) {
        throw new Error("Access denied");
      }

      await db.placementFamilyContact.delete({
        where: { id: contactId },
      });

      // Emit socket event for real-time updates
      try {
        const { getSocketServer } = await import("../websocket/socket.server");
        const socketServer = getSocketServer();
        
        socketServer.getIO().emit("family-contact:deleted", {
          placementId: contact.placementId,
          contactId,
        });
      } catch (socketError) {
        console.warn("Failed to emit socket event:", socketError);
      }
    } catch (error) {
      console.error("Delete family contact error:", error);
      throw error instanceof Error ? error : new Error("Failed to delete family contact");
    }
  }

  /**
   * Create an update for families
   */
  async createUpdate(
    placementId: string,
    data: CreateUpdateData,
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
          familyContacts: {
            where: {
              canReceiveUpdates: true,
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

      const update = await db.placementUpdate.create({
        data: {
          placementId,
          title: data.title,
          message: data.message,
          category: data.category,
          photos: data.photos || [],
          createdBy: userId,
        },
      });

      // TODO: Send email notifications to family contacts
      // This should be implemented based on your email service
      // For now, we'll just log it
      if (placement.familyContacts.length > 0) {
        console.log(
          `Would send email to ${placement.familyContacts.length} family contacts about update: ${data.title}`
        );
      }

      return update;
    } catch (error) {
      console.error("Create update error:", error);
      throw error instanceof Error ? error : new Error("Failed to create update");
    }
  }

  /**
   * Get all updates for a placement
   */
  async getUpdates(placementId: string, userId: string): Promise<any[]> {
    try {
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

      const updates = await db.placementUpdate.findMany({
        where: { placementId },
        orderBy: { createdAt: "desc" },
      });

      return updates;
    } catch (error) {
      console.error("Get updates error:", error);
      throw error instanceof Error ? error : new Error("Failed to retrieve updates");
    }
  }

  /**
   * Delete an update
   */
  async deleteUpdate(updateId: string, userId: string): Promise<void> {
    try {
      // Verify update exists and user has access
      const update = await db.placementUpdate.findUnique({
        where: { id: updateId },
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

      if (!update) {
        throw new Error("Update not found");
      }

      if (update.placement.provider.organization.users.length === 0) {
        throw new Error("Access denied");
      }

      await db.placementUpdate.delete({
        where: { id: updateId },
      });
    } catch (error) {
      console.error("Delete update error:", error);
      throw error instanceof Error ? error : new Error("Failed to delete update");
    }
  }
}
