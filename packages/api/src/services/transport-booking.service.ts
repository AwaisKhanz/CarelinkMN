import { db } from "@carelink/database";
import { Prisma, BookingStatus, Payer } from "@prisma/client";
import {
  TransportBooking,
  CreateTransportBookingData,
  UpdateTransportBookingData,
  BookingStatus as BookingStatusType,
  Payer as PayerType,
} from "@carelink/types";
import { normalizeDate } from "@carelink/utils";

type TransportBookingInclude = {
  vendor: {
    include: {
      organization: {
        select: {
          id: true;
          name: true;
        };
      };
    };
  };
};

type TransportBookingPayload = Prisma.TransportBookingGetPayload<{
  include: TransportBookingInclude;
}>;

export class TransportBookingService {
  /**
   * Create a transport booking for a discharge case
   */
  async createTransportBooking(
    userId: string,
    data: CreateTransportBookingData
  ): Promise<TransportBooking> {
    try {
      // Verify user has access to the discharge case
      const dischargeCase = await db.dischargeCase.findUnique({
        where: { id: data.dischargeCaseId },
        select: {
          hospitalId: true,
          socialWorkerId: true,
        },
      });

      if (!dischargeCase) {
        throw new Error("Discharge case not found");
      }

      // Verify user belongs to the same hospital
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      if (!user || user.organizationId !== dischargeCase.hospitalId) {
        throw new Error("Access denied: You can only create transport bookings for your hospital's discharge cases");
      }

      // Verify vendor exists
      const vendor = await db.vendor.findUnique({
        where: { id: data.vendorId },
      });

      if (!vendor) {
        throw new Error("Vendor not found");
      }

      // Check if booking already exists for this discharge case
      const existingBooking = await db.transportBooking.findUnique({
        where: { dischargeCaseId: data.dischargeCaseId },
      });

      if (existingBooking) {
        throw new Error("Transport booking already exists for this discharge case");
      }

      // Create transport booking
      const transportBooking = await db.transportBooking.create({
        data: {
          dischargeCaseId: data.dischargeCaseId,
          vendorId: data.vendorId,
          pickupAddress: data.pickupAddress,
          pickupTime: normalizeDate(data.pickupTime) as Date,
          dropoffAddress: data.dropoffAddress,
          vehicleType: data.vehicleType,
          equipmentNeeded: data.equipmentNeeded || [],
          attendantRequired: data.attendantRequired || false,
          estimatedCost: data.estimatedCost ? new Prisma.Decimal(data.estimatedCost) : null,
          payerType: data.payerType,
          status: BookingStatus.PENDING,
        },
        include: this.getDefaultInclude(),
      });

      // Create notification for vendor
      try {
        const { NotificationService } = await import("./notification.service");
        const notificationService = new NotificationService();
        
        // Get vendor owner user
        const vendorOwner = await db.user.findFirst({
          where: {
            organizationId: vendor.organizationId,
            role: "VENDOR",
          },
        });

        if (vendorOwner) {
          await notificationService.createNotification({
            userId: vendorOwner.id,
            type: "NEW_LEAD",
            title: "New Transport Booking Request",
            message: `You have received a new transport booking request`,
            metadata: {
              transportBookingId: transportBooking.id,
              dischargeCaseId: data.dischargeCaseId,
              pickupTime: data.pickupTime,
            },
          });
        }
      } catch (notifError) {
        console.error("Failed to create vendor notification:", notifError);
        // Don't fail the booking if notification fails
      }

      // Emit socket event for real-time updates
      try {
        const { getSocketServer } = await import("../websocket/socket.server");
        const socketServer = getSocketServer();
        
        // Notify Hospital SW and Vendor
        const recipientIds: string[] = [];
        
        // Add Hospital SW (social worker)
        if (dischargeCase.socialWorkerId) {
          recipientIds.push(dischargeCase.socialWorkerId);
        }
        
        // Add Vendor owner
        const vendorOwnerForSocket = await db.user.findFirst({
          where: {
            organizationId: vendor.organizationId,
            role: "VENDOR",
          },
        });
        
        if (vendorOwnerForSocket) {
          recipientIds.push(vendorOwnerForSocket.id);
        }
        
        recipientIds.forEach(userId => {
          socketServer.getIO().to(`user:${userId}`).emit("transport:booking-created", {
            bookingId: transportBooking.id,
            dischargeCaseId: data.dischargeCaseId,
          });
        });
      } catch (socketError) {
        console.warn("Failed to emit socket event:", socketError);
      }

      return this.mapTransportBookingToType(transportBooking);
    } catch (error) {
      console.error("Create transport booking error:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to create transport booking");
    }
  }

  /**
   * Get transport booking by discharge case ID
   */
  async getTransportBookingByDischargeCaseId(
    dischargeCaseId: string,
    userId: string
  ): Promise<TransportBooking | null> {
    try {
      // Verify user has access to the discharge case
      const dischargeCase = await db.dischargeCase.findUnique({
        where: { id: dischargeCaseId },
        select: {
          hospitalId: true,
        },
      });

      if (!dischargeCase) {
        throw new Error("Discharge case not found");
      }

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      if (!user || user.organizationId !== dischargeCase.hospitalId) {
        throw new Error("Access denied");
      }

      const transportBooking = await db.transportBooking.findUnique({
        where: { dischargeCaseId },
        include: this.getDefaultInclude(),
      });

      if (!transportBooking) {
        return null;
      }

      return this.mapTransportBookingToType(transportBooking);
    } catch (error) {
      console.error("Get transport booking error:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to get transport booking");
    }
  }

  /**
   * Update transport booking
   */
  async updateTransportBooking(
    bookingId: string,
    userId: string,
    data: UpdateTransportBookingData
  ): Promise<TransportBooking> {
    try {
      // Get existing booking
      const existingBooking = await db.transportBooking.findUnique({
        where: { id: bookingId },
        include: {
          dischargeCase: {
            select: {
              hospitalId: true,
            },
          },
        },
      });

      if (!existingBooking) {
        throw new Error("Transport booking not found");
      }

      // Verify user has access
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      if (!user || user.organizationId !== existingBooking.dischargeCase.hospitalId) {
        throw new Error("Access denied");
      }

      // Update booking
      const updateData: Prisma.TransportBookingUpdateInput = {};

      if (data.vendorId !== undefined) {
        // Verify vendor exists
        const vendor = await db.vendor.findUnique({
          where: { id: data.vendorId },
        });
        if (!vendor) {
          throw new Error("Vendor not found");
        }
        updateData.vendor = { connect: { id: data.vendorId } };
      }
      if (data.pickupAddress !== undefined) updateData.pickupAddress = data.pickupAddress;
      if (data.pickupTime !== undefined) updateData.pickupTime = normalizeDate(data.pickupTime) as Date;
      if (data.dropoffAddress !== undefined) updateData.dropoffAddress = data.dropoffAddress;
      if (data.vehicleType !== undefined) updateData.vehicleType = data.vehicleType;
      if (data.equipmentNeeded !== undefined) updateData.equipmentNeeded = data.equipmentNeeded;
      if (data.attendantRequired !== undefined) updateData.attendantRequired = data.attendantRequired;
      if (data.status !== undefined) updateData.status = data.status as BookingStatus;
      if (data.estimatedCost !== undefined) updateData.estimatedCost = data.estimatedCost ? new Prisma.Decimal(data.estimatedCost) : null;
      if (data.actualCost !== undefined) updateData.actualCost = data.actualCost ? new Prisma.Decimal(data.actualCost) : null;
      if (data.payerType !== undefined) updateData.payerType = data.payerType;
      if (data.confirmationNumber !== undefined) updateData.confirmationNumber = data.confirmationNumber;
      if (data.driverName !== undefined) updateData.driverName = data.driverName;
      if (data.driverPhone !== undefined) updateData.driverPhone = data.driverPhone;
      if (data.completedAt !== undefined) updateData.completedAt = data.completedAt ? normalizeDate(data.completedAt) as Date : null;

      const transportBooking = await db.transportBooking.update({
        where: { id: bookingId },
        data: updateData,
        include: this.getDefaultInclude(),
      });

      // Emit socket event for real-time updates
      try {
        const { getSocketServer } = await import("../websocket/socket.server");
        const socketServer = getSocketServer();
        
        socketServer.getIO().emit("transport:booking-updated", {
          bookingId,
          dischargeCaseId: existingBooking.dischargeCaseId,
          status: data.status,
        });
      } catch (socketError) {
        console.warn("Failed to emit socket event:", socketError);
      }

      return this.mapTransportBookingToType(transportBooking);
    } catch (error) {
      console.error("Update transport booking error:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to update transport booking");
    }
  }

  /**
   * Delete transport booking
   */
  async deleteTransportBooking(
    bookingId: string,
    userId: string
  ): Promise<void> {
    try {
      // Get existing booking
      const existingBooking = await db.transportBooking.findUnique({
        where: { id: bookingId },
        include: {
          dischargeCase: {
            select: {
              hospitalId: true,
            },
          },
        },
      });

      if (!existingBooking) {
        throw new Error("Transport booking not found");
      }

      // Verify user has access
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      if (!user || user.organizationId !== existingBooking.dischargeCase.hospitalId) {
        throw new Error("Access denied");
      }

      await db.transportBooking.delete({
        where: { id: bookingId },
      });
    } catch (error) {
      console.error("Delete transport booking error:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to delete transport booking");
    }
  }

  /**
   * Get default include for transport booking queries
   */
  private getDefaultInclude(): TransportBookingInclude {
    return {
      vendor: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    };
  }

  /**
   * Map Prisma transport booking to TransportBooking type
   */
  private mapTransportBookingToType(
    payload: TransportBookingPayload
  ): TransportBooking {
    return {
      id: payload.id,
      dischargeCaseId: payload.dischargeCaseId,
      vendorId: payload.vendorId,
      vendor: payload.vendor
        ? {
            id: payload.vendor.id,
            organization: payload.vendor.organization
              ? {
                  id: payload.vendor.organization.id,
                  name: payload.vendor.organization.name,
                }
              : undefined,
          }
        : undefined,
      pickupAddress: payload.pickupAddress,
      pickupTime: payload.pickupTime,
      dropoffAddress: payload.dropoffAddress,
      vehicleType: payload.vehicleType,
      equipmentNeeded: payload.equipmentNeeded,
      attendantRequired: payload.attendantRequired,
      status: payload.status as BookingStatusType,
      estimatedCost: payload.estimatedCost ? Number(payload.estimatedCost) : undefined,
      actualCost: payload.actualCost ? Number(payload.actualCost) : undefined,
      payerType: payload.payerType as PayerType,
      confirmationNumber: payload.confirmationNumber ?? undefined,
      driverName: payload.driverName ?? undefined,
      driverPhone: payload.driverPhone ?? undefined,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
      completedAt: payload.completedAt ?? undefined,
    };
  }
}

