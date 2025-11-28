import { db } from "@carelink/database";
import { Prisma } from "@prisma/client";
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
  VendorCategory,
  LeadStatus,
  BookingStatus,
} from "@carelink/types";

export class VendorService {
  // Get vendor by user ID
  async getVendorByUserId(userId: string): Promise<Vendor | null> {
    try {
      const vendor = await db.vendor.findFirst({
        where: {
          organization: {
            users: {
              some: {
                id: userId,
              },
            },
          },
        },
        include: {
          organization: true,
        },
      });

      if (!vendor) {
        return null;
      }

      return this.mapVendorToType(vendor);
    } catch (error) {
      console.error("Get vendor by user ID error:", error);
      throw new Error("Failed to retrieve vendor by user ID");
    }
  }

  // Search/List vendors
  async searchVendors(params: {
    search?: string;
    organizationId?: string;
    category?: string;
    limit?: number;
  }): Promise<Vendor[]> {
    try {
      const where: Prisma.VendorWhereInput = {};

      if (params.organizationId) {
        where.organizationId = params.organizationId;
      }

      if (params.category) {
        where.category = params.category as any;
      }

      if (params.search) {
        where.OR = [
          { businessName: { contains: params.search, mode: "insensitive" } },
          { description: { contains: params.search, mode: "insensitive" } },
        ];
      }

      const vendors = await db.vendor.findMany({
        where,
        include: {
          organization: true,
        },
        take: params.limit || 20,
        orderBy: [
          { isSponsoredVendor: "desc" },
          { isVerified: "desc" },
          { createdAt: "desc" },
        ],
      });

      return vendors.map((vendor) => this.mapVendorToType(vendor));
    } catch (error) {
      console.error("Search vendors error:", error);
      throw new Error("Failed to search vendors");
    }
  }

  // Get vendor by vendor ID
  async getVendorById(vendorId: string): Promise<Vendor | null> {
    try {
      const vendor = await db.vendor.findUnique({
        where: { id: vendorId },
        include: {
          organization: true,
        },
      });

      if (!vendor) {
        return null;
      }

      return this.mapVendorToType(vendor);
    } catch (error) {
      console.error("Get vendor by ID error:", error);
      throw new Error("Failed to retrieve vendor");
    }
  }

  // Update vendor profile
  async updateVendor(vendorId: string, updateData: UpdateVendorData): Promise<Vendor> {
    try {
      const updatedVendor = await db.vendor.update({
        where: { id: vendorId },
        data: {
          ...updateData,
          sponsorshipExpiry: updateData.sponsorshipExpiry
            ? new Date(updateData.sponsorshipExpiry)
            : undefined,
        },
        include: {
          organization: true,
        },
      });

      return this.mapVendorToType(updatedVendor);
    } catch (error) {
      console.error("Update vendor error:", error);
      throw new Error("Failed to update vendor profile");
    }
  }

  // Get vendor leads
  async getVendorLeads(
    vendorId: string,
    params: GetVendorLeadsParams
  ): Promise<VendorLeadsResponse> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const skip = (page - 1) * limit;

      const where: Prisma.VendorLeadWhereInput = {
        vendorId,
        ...(params.status && { status: params.status }),
        ...(params.source && { source: params.source }),
        ...(params.search && {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { email: { contains: params.search, mode: "insensitive" } },
            { phone: { contains: params.search, mode: "insensitive" } },
          ],
        }),
      };

      const [leads, total] = await Promise.all([
        db.vendorLead.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        db.vendorLead.count({ where }),
      ]);

      return {
        leads: leads.map((lead) => this.mapLeadToType(lead)),
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
        },
      };
    } catch (error) {
      console.error("Get vendor leads error:", error);
      throw new Error("Failed to retrieve vendor leads");
    }
  }

  // Update lead status
  async updateLeadStatus(
    leadId: string,
    vendorId: string,
    data: UpdateLeadStatusData
  ): Promise<VendorLead> {
    try {
      // Verify lead belongs to vendor
      const lead = await db.vendorLead.findFirst({
        where: { id: leadId, vendorId },
      });

      if (!lead) {
        throw new Error("Lead not found or access denied");
      }

      const updateData: Prisma.VendorLeadUpdateInput = {
        status: data.status,
        ...(data.status === LeadStatus.CONTACTED && !lead.contactedAt && {
          contactedAt: new Date(),
        }),
        ...(data.status === LeadStatus.CONVERTED && !lead.convertedAt && {
          convertedAt: new Date(),
        }),
      };

      const updatedLead = await db.vendorLead.update({
        where: { id: leadId },
        data: updateData,
      });

      return this.mapLeadToType(updatedLead);
    } catch (error) {
      console.error("Update lead status error:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to update lead status");
    }
  }

  // Get vendor bookings
  async getVendorBookings(
    vendorId: string,
    params: GetVendorBookingsParams
  ): Promise<VendorBookingsResponse> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const skip = (page - 1) * limit;

      const where: Prisma.TransportBookingWhereInput = {
        vendorId,
        ...(params.status && { status: params.status }),
        ...(params.search && {
          OR: [
            { pickupAddress: { contains: params.search, mode: "insensitive" } },
            { dropoffAddress: { contains: params.search, mode: "insensitive" } },
            { confirmationNumber: { contains: params.search, mode: "insensitive" } },
            { driverName: { contains: params.search, mode: "insensitive" } },
          ],
        }),
      };

      const [bookings, total] = await Promise.all([
        db.transportBooking.findMany({
          where,
          skip,
          take: limit,
          orderBy: { pickupTime: "desc" },
          include: {
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
            dischargeCase: {
              select: {
                id: true,
                caseNumber: true,
                patientInitials: true,
              },
            },
          },
        }),
        db.transportBooking.count({ where }),
      ]);

      return {
        bookings: bookings.map((booking) => this.mapBookingToType(booking)),
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
        },
      };
    } catch (error) {
      console.error("Get vendor bookings error:", error);
      throw new Error("Failed to retrieve vendor bookings");
    }
  }

  // Update booking status
  async updateBookingStatus(
    bookingId: string,
    vendorId: string,
    status: BookingStatus,
    updateData?: {
      confirmationNumber?: string;
      driverName?: string;
      driverPhone?: string;
      actualCost?: number;
      completedAt?: Date;
    }
  ): Promise<TransportBooking> {
    try {
      // Verify booking belongs to vendor
      const booking = await db.transportBooking.findFirst({
        where: { id: bookingId, vendorId },
      });

      if (!booking) {
        throw new Error("Booking not found or access denied");
      }

      const updatePayload: Prisma.TransportBookingUpdateInput = {
        status,
        ...(updateData?.confirmationNumber && {
          confirmationNumber: updateData.confirmationNumber,
        }),
        ...(updateData?.driverName && { driverName: updateData.driverName }),
        ...(updateData?.driverPhone && { driverPhone: updateData.driverPhone }),
        ...(updateData?.actualCost !== undefined && {
          actualCost: new Prisma.Decimal(updateData.actualCost),
        }),
        ...(status === BookingStatus.COMPLETED && !booking.completedAt && {
          completedAt: updateData?.completedAt || new Date(),
        }),
      };

      const updatedBooking = await db.transportBooking.update({
        where: { id: bookingId },
        data: updatePayload,
        include: {
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
          dischargeCase: {
            select: {
              id: true,
              caseNumber: true,
              patientInitials: true,
              socialWorkerId: true,
            },
          },
        },
      });

      // Create notifications for Hospital SW on status changes
      try {
        const { NotificationService } = await import("./notification.service");
        const notificationService = new NotificationService();

        const dischargeCase = updatedBooking.dischargeCase;

        if (dischargeCase?.socialWorkerId) {
          // Notification for CONFIRMED status
          if (status === BookingStatus.CONFIRMED && booking.status !== BookingStatus.CONFIRMED) {
            await notificationService.createNotification({
              userId: dischargeCase.socialWorkerId,
              type: "BOOKING_CONFIRMED",
              title: "Transport Booking Confirmed",
              message: `Transport booking for case ${dischargeCase.caseNumber} has been confirmed by the vendor`,
              metadata: {
                transportBookingId: bookingId,
                dischargeCaseId: updatedBooking.dischargeCaseId,
                confirmationNumber: updatedBooking.confirmationNumber,
                caseNumber: dischargeCase.caseNumber,
              },
            });
          }

          // Notification for COMPLETED status
          if (status === BookingStatus.COMPLETED && booking.status !== BookingStatus.COMPLETED) {
            await notificationService.createNotification({
              userId: dischargeCase.socialWorkerId,
              type: "BOOKING_COMPLETED",
              title: "Transport Completed",
              message: `Transport for case ${dischargeCase.caseNumber} has been completed`,
              metadata: {
                transportBookingId: bookingId,
                dischargeCaseId: updatedBooking.dischargeCaseId,
                completedAt: updatedBooking.completedAt,
                caseNumber: dischargeCase.caseNumber,
              },
            });
          }
        }
      } catch (notifError) {
        console.error("Failed to create Hospital SW notification:", notifError);
        // Don't fail the update if notification fails
      }

      return this.mapBookingToType(updatedBooking);
    } catch (error) {
      console.error("Update booking status error:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to update booking status");
    }
  }

  // Get vendor analytics
  async getVendorAnalytics(vendorId: string): Promise<VendorAnalytics> {
    try {
      const [
        totalLeads,
        newLeads,
        convertedLeads,
        totalBookings,
        pendingBookings,
        completedBookings,
        leadsBySource,
        bookingsByStatus,
        leadsThisMonth,
        bookingsThisMonth,
        vendor,
      ] = await Promise.all([
        db.vendorLead.count({ where: { vendorId } }),
        db.vendorLead.count({
          where: { vendorId, status: LeadStatus.NEW },
        }),
        db.vendorLead.count({
          where: { vendorId, status: LeadStatus.CONVERTED },
        }),
        db.transportBooking.count({ where: { vendorId } }),
        db.transportBooking.count({
          where: { vendorId, status: BookingStatus.PENDING },
        }),
        db.transportBooking.count({
          where: { vendorId, status: BookingStatus.COMPLETED },
        }),
        db.vendorLead.groupBy({
          by: ["source"],
          where: { vendorId },
          _count: true,
        }),
        db.transportBooking.groupBy({
          by: ["status"],
          where: { vendorId },
          _count: true,
        }),
        db.vendorLead.count({
          where: {
            vendorId,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        db.transportBooking.count({
          where: {
            vendorId,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        db.vendor.findUnique({
          where: { id: vendorId },
          select: {
            averageRating: true,
            reviewCount: true,
          },
        }),
      ]);

      // Calculate total revenue from completed bookings
      const completedBookingsData = await db.transportBooking.findMany({
        where: {
          vendorId,
          status: BookingStatus.COMPLETED,
          actualCost: { not: null },
        },
        select: { actualCost: true },
      });

      const totalRevenue = completedBookingsData.reduce(
        (sum, booking) => sum + Number(booking.actualCost || 0),
        0
      );

      const conversionRate =
        totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      return {
        totalLeads,
        newLeads,
        convertedLeads,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalBookings,
        pendingBookings,
        completedBookings,
        totalRevenue,
        averageRating: vendor?.averageRating ? Number(vendor.averageRating) : undefined,
        reviewCount: vendor?.reviewCount || 0,
        leadsBySource: leadsBySource.map((item) => ({
          source: item.source,
          count: item._count,
        })),
        bookingsByStatus: bookingsByStatus.map((item) => ({
          status: item.status as unknown as BookingStatus,
          count: item._count,
        })),
        leadsThisMonth,
        bookingsThisMonth,
      };
    } catch (error) {
      console.error("Get vendor analytics error:", error);
      throw new Error("Failed to retrieve vendor analytics");
    }
  }

  // Helper: Map Prisma vendor to Vendor type
  private mapVendorToType(
    vendor: Prisma.VendorGetPayload<{
      include: { organization: true };
    }>
  ): Vendor {
    return {
      id: vendor.id,
      organizationId: vendor.organizationId,
      organization: vendor.organization
        ? {
            id: vendor.organization.id,
            name: vendor.organization.name,
            type: vendor.organization.type,
            email: vendor.organization.email,
            phone: vendor.organization.phone,
            addressLine1: vendor.organization.addressLine1,
            addressLine2: vendor.organization.addressLine2 ?? undefined,
            city: vendor.organization.city,
            state: vendor.organization.state,
            zipCode: vendor.organization.zipCode,
            county: vendor.organization.county,
          }
        : undefined,
      category: vendor.category as unknown as VendorCategory,
      subcategories: vendor.subcategories,
      businessName: vendor.businessName,
      description: vendor.description,
      logo: vendor.logo ?? undefined,
      services: vendor.services,
      serviceAreas: vendor.serviceAreas,
      isSponsoredVendor: vendor.isSponsoredVendor,
      sponsorshipTier: vendor.sponsorshipTier ?? undefined,
      sponsorshipExpiry: vendor.sponsorshipExpiry ?? undefined,
      averageRating: vendor.averageRating ? Number(vendor.averageRating) : undefined,
      reviewCount: vendor.reviewCount,
      isVerified: vendor.isVerified,
      verifiedAt: vendor.verifiedAt ?? undefined,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
    };
  }

  // Helper: Map Prisma lead to VendorLead type
  private mapLeadToType(
    lead: Prisma.VendorLeadGetPayload<Record<string, never>>
  ): VendorLead {
    return {
      id: lead.id,
      vendorId: lead.vendorId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone ?? undefined,
      servicesInterested: lead.servicesInterested,
      message: lead.message ?? undefined,
      source: lead.source,
      status: lead.status as unknown as LeadStatus,
      createdAt: lead.createdAt,
      contactedAt: lead.contactedAt ?? undefined,
      convertedAt: lead.convertedAt ?? undefined,
    };
  }

  // Helper: Map Prisma booking to TransportBooking type
  private mapBookingToType(
    booking: Prisma.TransportBookingGetPayload<{
      include: {
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
        dischargeCase: {
          select: {
            id: true;
            caseNumber: true;
            patientInitials: true;
          };
        };
      };
    }>
  ): TransportBooking {
    return {
      id: booking.id,
      dischargeCaseId: booking.dischargeCaseId,
      vendorId: booking.vendorId,
      vendor: booking.vendor
        ? {
            id: booking.vendor.id,
            organization: booking.vendor.organization
              ? {
                  id: booking.vendor.organization.id,
                  name: booking.vendor.organization.name,
                }
              : undefined,
          }
        : undefined,
      pickupAddress: booking.pickupAddress,
      pickupTime: booking.pickupTime,
      dropoffAddress: booking.dropoffAddress,
      vehicleType: booking.vehicleType,
      equipmentNeeded: booking.equipmentNeeded,
      attendantRequired: booking.attendantRequired,
      status: booking.status as unknown as BookingStatus,
      estimatedCost: booking.estimatedCost
        ? Number(booking.estimatedCost)
        : undefined,
      actualCost: booking.actualCost ? Number(booking.actualCost) : undefined,
      payerType: booking.payerType as any,
      confirmationNumber: booking.confirmationNumber ?? undefined,
      driverName: booking.driverName ?? undefined,
      driverPhone: booking.driverPhone ?? undefined,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      completedAt: booking.completedAt ?? undefined,
    };
  }
}
