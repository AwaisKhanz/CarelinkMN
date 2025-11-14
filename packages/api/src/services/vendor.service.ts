import { db } from "@carelink/database";

export class VendorService {
  // Get vendor by user ID
  async getVendorByUserId(userId: string) {
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

      return vendor;
    } catch (error) {
      console.error("Get vendor by user ID error:", error);
      throw new Error("Failed to retrieve vendor by user ID");
    }
  }

  // Update vendor profile
  async updateVendor(userId: string, updateData: any) {
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
      });

      if (!vendor) {
        throw new Error("Vendor profile not found");
      }

      const updatedVendor = await db.vendor.update({
        where: { id: vendor.id },
        data: updateData,
        include: {
          organization: true,
        },
      });

      return updatedVendor;
    } catch (error) {
      console.error("Update vendor error:", error);
      throw new Error("Failed to update vendor profile");
    }
  }
}
