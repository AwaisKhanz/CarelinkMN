import { db } from "@carelink/database";
import { Provider, DischargeCase, Payer } from "@prisma/client";

/**
 * Components of the discharge case matching score
 */
export interface MatchScoreComponents {
  proximity: number;
  payer: number;
  equipment: number;
  total: number;
}

/**
 * Service for matching providers to discharge cases.
 * 
 * Scoring Formula:
 * - Proximity (40%): Distance-based score if proximity required
 * - Payer (30%): Insurance compatibility
 * - Equipment/DME (30%): Equipment and medication management capability
 */
export class DischargeMatchingService {
  /**
   * Calculate proximity score based on zip code distance
   * Higher score for closer providers
   */
  private proximityScore(
    requiresProximity: boolean,
    proximityZipCode: string | null,
    providerZipCode: string,
    maxDistanceMiles: number | null
  ): number {
    if (!requiresProximity || !proximityZipCode) {
      return 1; // Full score if proximity not required
    }

    // Simple zip code prefix matching (first 3 digits indicate general area)
    const caseZipPrefix = proximityZipCode.substring(0, 3);
    const providerZipPrefix = providerZipCode.substring(0, 3);

    if (caseZipPrefix === providerZipPrefix) {
      return 1; // Same area - full score
    }

    // Different areas - reduced score
    // In a real implementation, you'd use a geocoding service
    // to calculate actual distance
    return 0.3;
  }

  /**
   * Calculate payer compatibility score
   */
  private payerScore(
    casePrimaryInsurance: Payer,
    caseSecondaryInsurance: Payer | null,
    providerAcceptedPayers: Payer[]
  ): number {
    let score = 0;

    // Primary insurance match is critical
    if (providerAcceptedPayers.includes(casePrimaryInsurance)) {
      score += 0.7;
    }

    // Secondary insurance match is a bonus
    if (
      caseSecondaryInsurance &&
      providerAcceptedPayers.includes(caseSecondaryInsurance)
    ) {
      score += 0.3;
    }

    return score;
  }

  /**
   * Calculate equipment/DME capability score
   */
  private equipmentScore(
    caseDmeNeeds: string[],
    caseMedicationManagement: boolean,
    providerServices: string[]
  ): number {
    let score = 0;
    let totalNeeds = 0;

    // Check DME needs
    if (caseDmeNeeds && caseDmeNeeds.length > 0) {
      const dmeMatches = caseDmeNeeds.filter((need) =>
        providerServices.includes(need)
      ).length;
      score += (dmeMatches / caseDmeNeeds.length) * 0.7;
      totalNeeds += 0.7;
    }

    // Check medication management
    if (caseMedicationManagement) {
      // Assume providers with "MEDICATION_MANAGEMENT" service can handle this
      if (providerServices.includes("MEDICATION_MANAGEMENT")) {
        score += 0.3;
      }
      totalNeeds += 0.3;
    }

    // If no special needs, give full score
    if (totalNeeds === 0) {
      return 1;
    }

    return score / totalNeeds;
  }

  /**
   * Calculate comprehensive match score for a provider against a discharge case
   * 
   * @param caseId - ID of the discharge case
   * @param providerId - ID of the provider to score
   * @returns Score components and total score (0-1 scale)
   */
  async calculateMatchScore(
    caseId: string,
    providerId: string
  ): Promise<MatchScoreComponents> {
    try {
      // Fetch discharge case and provider data in parallel
      const [dischargeCase, provider] = await Promise.all([
        db.dischargeCase.findUniqueOrThrow({
          where: { id: caseId },
          select: {
            requiresProximity: true,
            proximityZipCode: true,
            maxDistanceMiles: true,
            primaryInsurance: true,
            secondaryInsurance: true,
            dmeNeeds: true,
            medicationManagement: true,
          },
        }),
        db.provider.findUniqueOrThrow({
          where: { id: providerId },
          include: {
            services: {
              include: {
                service: {
                  select: {
                    code: true,
                    name: true,
                  },
                },
              },
            },
            organization: {
              select: {
                zipCode: true,
              },
            },
            openings: {
              where: {
                status: "OPEN",
                spotsAvailable: {
                  gt: 0,
                },
              },
              select: {
                acceptedPayers: true,
              },
            },
          },
        }),
      ]);

      // Extract provider service codes
      const providerServiceCodes = provider.services.map(
        (ps) => ps.service.code
      );

      // Get accepted payers from openings
      const acceptedPayers = new Set<Payer>();
      provider.openings.forEach((opening) => {
        opening.acceptedPayers.forEach((payer) => acceptedPayers.add(payer));
      });

      // Calculate individual score components
      const proximityScoreValue =
        this.proximityScore(
          dischargeCase.requiresProximity,
          dischargeCase.proximityZipCode,
          provider.organization.zipCode,
          dischargeCase.maxDistanceMiles
        ) * 0.4;

      const payerScoreValue =
        this.payerScore(
          dischargeCase.primaryInsurance,
          dischargeCase.secondaryInsurance,
          Array.from(acceptedPayers)
        ) * 0.3;

      const equipmentScoreValue =
        this.equipmentScore(
          dischargeCase.dmeNeeds || [],
          dischargeCase.medicationManagement,
          providerServiceCodes
        ) * 0.3;

      const total = proximityScoreValue + payerScoreValue + equipmentScoreValue;

      return {
        proximity: Number(proximityScoreValue.toFixed(3)),
        payer: Number(payerScoreValue.toFixed(3)),
        equipment: Number(equipmentScoreValue.toFixed(3)),
        total: Number(total.toFixed(3)),
      };
    } catch (error) {
      console.error("Calculate discharge match score error:", error);
      throw error;
    }
  }

  /**
   * Calculate scores for multiple providers against a discharge case
   * Returns providers sorted by score (highest first)
   * 
   * @param caseId - ID of the discharge case
   * @param providerIds - Array of provider IDs to score
   * @param limit - Maximum number of results to return
   * @returns Array of providers with their scores, sorted by total score descending
   */
  async calculateScoresForProviders(
    caseId: string,
    providerIds: string[],
    limit: number = 10
  ): Promise<Array<{ providerId: string; score: MatchScoreComponents }>> {
    try {
      // Calculate scores for all providers in parallel
      const scorePromises = providerIds.map(async (providerId) => {
        try {
          const score = await this.calculateMatchScore(caseId, providerId);
          return { providerId, score };
        } catch (error) {
          // If scoring fails for a provider, return 0 score
          console.error(`Failed to score provider ${providerId}:`, error);
          return {
            providerId,
            score: {
              proximity: 0,
              payer: 0,
              equipment: 0,
              total: 0,
            },
          };
        }
      });

      const results = await Promise.all(scorePromises);

      // Sort by total score descending and limit
      return results
        .sort((a, b) => b.score.total - a.score.total)
        .slice(0, limit);
    } catch (error) {
      console.error("Calculate scores for providers error:", error);
      throw error;
    }
  }

  /**
   * Get top-matched providers for a discharge case
   * Automatically finds all verified providers with available openings and scores them
   * 
   * @param caseId - ID of the discharge case
   * @param limit - Maximum number of providers to return
   * @returns Array of providers with scores, sorted by score descending
   */
  async getTopProvidersForCase(
    caseId: string,
    limit: number = 10
  ): Promise<
    Array<{
      provider: any;
      score: MatchScoreComponents;
    }>
  > {
    try {
      // Get all verified providers with available openings
      const providers = await db.provider.findMany({
        where: {
          verified: true,
          openings: {
            some: {
              status: "OPEN",
              spotsAvailable: {
                gt: 0,
              },
            },
          },
        },
        select: {
          id: true,
        },
      });

      const providerIds = providers.map((p) => p.id);

      // Calculate scores
      const scoredProviders = await this.calculateScoresForProviders(
        caseId,
        providerIds,
        limit
      );

      // Fetch full provider details for top results
      const topProviderIds = scoredProviders.map((sp) => sp.providerId);
      const fullProviders = await db.provider.findMany({
        where: {
          id: { in: topProviderIds },
        },
        include: {
          organization: {
            select: {
              name: true,
              addressLine1: true,
              city: true,
              state: true,
              zipCode: true,
              phone: true,
              email: true,
            },
          },
          primaryLicenseType: true,
          services: {
            include: {
              service: {
                select: {
                  code: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
          homes: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              capacity: true,
              currentOccupancy: true,
            },
          },
          openings: {
            where: {
              status: "OPEN",
              spotsAvailable: {
                gt: 0,
              },
            },
            select: {
              id: true,
              spotsAvailable: true,
              availableFrom: true,
              acceptedPayers: true,
            },
          },
        },
      });

      // Combine providers with their scores, maintaining sort order
      return scoredProviders.map((sp) => ({
        provider: fullProviders.find((p) => p.id === sp.providerId)!,
        score: sp.score,
      }));
    } catch (error) {
      console.error("Get top providers for case error:", error);
      throw error;
    }
  }
}
