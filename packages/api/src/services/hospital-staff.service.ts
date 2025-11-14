import { db } from "@carelink/database";

export class HospitalStaffService {
  // Get hospital staff by user ID
  async getHospitalStaffByUserId(userId: string) {
    try {
      const hospitalStaff = await db.hospitalStaff.findFirst({
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

      return hospitalStaff;
    } catch (error) {
      console.error("Get hospital staff by user ID error:", error);
      throw new Error("Failed to retrieve hospital staff by user ID");
    }
  }

  // Update hospital staff profile
  async updateHospitalStaff(userId: string, updateData: any) {
    try {
      const hospitalStaff = await db.hospitalStaff.findFirst({
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

      if (!hospitalStaff) {
        throw new Error("Hospital staff profile not found");
      }

      const updatedHospitalStaff = await db.hospitalStaff.update({
        where: { id: hospitalStaff.id },
        data: updateData,
        include: {
          organization: true,
        },
      });

      return updatedHospitalStaff;
    } catch (error) {
      console.error("Update hospital staff error:", error);
      throw new Error("Failed to update hospital staff profile");
    }
  }
}
