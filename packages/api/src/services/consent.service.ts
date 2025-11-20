import { db } from "@carelink/database";
import { Prisma, ConsentType, CaptureMethod } from "@prisma/client";
import {
  Consent,
  CreateConsentData,
  UpdateConsentData,
  ConsentType as ConsentTypeEnum,
  CaptureMethod as CaptureMethodEnum,
} from "@carelink/types";
import { normalizeDate } from "@carelink/utils";

type ConsentInclude = {
  user: {
    select: {
      id: true;
      firstName: true;
      lastName: true;
      email: true;
    };
  };
};

type ConsentPayload = Prisma.ConsentGetPayload<{ include: ConsentInclude }>;

export class ConsentService {
  /**
   * Create a consent record
   */
  async createConsent(
    userId: string,
    data: CreateConsentData
  ): Promise<Consent> {
    try {
      // Verify user matches the userId in data
      if (data.userId !== userId) {
        throw new Error("Access denied: You can only create consent for yourself");
      }

      // If dischargeCaseId is provided, verify user has access
      if (data.dischargeCaseId) {
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

        const user = await db.user.findUnique({
          where: { id: userId },
          select: { organizationId: true },
        });

        if (!user || user.organizationId !== dischargeCase.hospitalId) {
          throw new Error("Access denied: You can only create consent for your hospital's discharge cases");
        }

        // Check if consent already exists for this discharge case
        const existingConsent = await db.consent.findUnique({
          where: { dischargeCaseId: data.dischargeCaseId },
        });

        if (existingConsent) {
          throw new Error("Consent already exists for this discharge case");
        }
      }

      // Create consent
      const consent = await db.consent.create({
        data: {
          userId: data.userId,
          referralId: data.referralId,
          dischargeCaseId: data.dischargeCaseId,
          consentType: data.consentType as ConsentType,
          consentVersion: data.consentVersion,
          captureMethod: data.captureMethod as CaptureMethod,
          witnessName: data.witnessName,
          witnessTitle: data.witnessTitle,
          signatureData: data.signatureData,
          expiresAt: data.expiresAt ? normalizeDate(data.expiresAt) as Date : null,
          isActive: true,
        },
        include: this.getDefaultInclude(),
      });

      return this.mapConsentToType(consent);
    } catch (error) {
      console.error("Create consent error:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to create consent");
    }
  }

  /**
   * Get consent by discharge case ID
   */
  async getConsentByDischargeCaseId(
    dischargeCaseId: string,
    userId: string
  ): Promise<Consent | null> {
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

      const consent = await db.consent.findUnique({
        where: { dischargeCaseId },
        include: this.getDefaultInclude(),
      });

      if (!consent) {
        return null;
      }

      return this.mapConsentToType(consent);
    } catch (error) {
      console.error("Get consent error:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to get consent");
    }
  }

  /**
   * Update consent
   */
  async updateConsent(
    consentId: string,
    userId: string,
    data: UpdateConsentData
  ): Promise<Consent> {
    try {
      // Get existing consent
      const existingConsent = await db.consent.findUnique({
        where: { id: consentId },
        include: {
          dischargeCase: {
            select: {
              hospitalId: true,
            },
          },
        },
      });

      if (!existingConsent) {
        throw new Error("Consent not found");
      }

      // Verify user has access
      if (existingConsent.dischargeCase) {
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { organizationId: true },
        });

        if (!user || user.organizationId !== existingConsent.dischargeCase.hospitalId) {
          throw new Error("Access denied");
        }
      } else if (existingConsent.userId !== userId) {
        throw new Error("Access denied");
      }

      // Update consent
      const updateData: Prisma.ConsentUpdateInput = {};

      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.revokedAt !== undefined) updateData.revokedAt = data.revokedAt ? normalizeDate(data.revokedAt) as Date : null;
      if (data.revokedReason !== undefined) updateData.revokedReason = data.revokedReason;
      if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ? normalizeDate(data.expiresAt) as Date : null;

      const consent = await db.consent.update({
        where: { id: consentId },
        data: updateData,
        include: this.getDefaultInclude(),
      });

      return this.mapConsentToType(consent);
    } catch (error) {
      console.error("Update consent error:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to update consent");
    }
  }

  /**
   * Get default include for consent queries
   */
  private getDefaultInclude(): ConsentInclude {
    return {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    };
  }

  /**
   * Map Prisma consent to Consent type
   */
  private mapConsentToType(payload: ConsentPayload): Consent {
    return {
      id: payload.id,
      userId: payload.userId,
      user: payload.user
        ? {
            id: payload.user.id,
            firstName: payload.user.firstName,
            lastName: payload.user.lastName,
            email: payload.user.email,
          }
        : undefined,
      referralId: payload.referralId ?? undefined,
      dischargeCaseId: payload.dischargeCaseId ?? undefined,
      consentType: payload.consentType as ConsentTypeEnum,
      consentVersion: payload.consentVersion,
      captureMethod: payload.captureMethod as CaptureMethodEnum,
      witnessName: payload.witnessName ?? undefined,
      witnessTitle: payload.witnessTitle ?? undefined,
      signatureData: payload.signatureData ?? undefined,
      isActive: payload.isActive,
      revokedAt: payload.revokedAt ?? undefined,
      revokedReason: payload.revokedReason ?? undefined,
      consentedAt: payload.consentedAt,
      expiresAt: payload.expiresAt ?? undefined,
    };
  }
}

