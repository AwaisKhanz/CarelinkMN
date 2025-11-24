import { db } from "@carelink/database";
import { Referral, Provider, Payer, Urgency } from "@prisma/client";

/**
 * Components of the referral score calculation
 */
export interface ScoreComponents {
  urgency: number;
  payer: number;
  distance: number;
  careMatch: number;
  total: number;
}

/**
 * Service for calculating referral priority scores for providers.
 * 
 * Scoring Formula:
 * - Urgency (40%): URGENT=3, HIGH=2, ROUTINE=1
 * - Payer (20%): MEDICARE/PRIVATE=3, others=1
 * - Distance (20%): 1/(maxDistance+1) if proximity required
 * - Care Match (20%): matchCount/totalNeeded
 */
export class ReferralScoringService {
  /**
   * Calculate urgency weight based on referral urgency level
   */
  private urgencyWeight(urgency: Urgency): number {
    switch (urgency) {
      case "URGENT":
        return 3;
      case "HIGH":
        return 2;
      case "ROUTINE":
      default:
        return 1;
    }
  }

  /**
   * Calculate payer weight based on payer type
   * Higher priority for Medicare and Private pay
   */
  private payerWeight(payer: Payer): number {
    const highPriorityPayers: Payer[] = ["MEDICARE", "PRIVATE"];
    return highPriorityPayers.includes(payer) ? 3 : 1;
  }

  /**
   * Calculate distance score based on max distance preference
   * Closer = higher score
   */
  private distanceScore(maxDistance?: number | null): number {
    if (!maxDistance) return 0;
    // Inverse relationship: closer = higher score
    // Cap at 100 miles for scoring purposes
    const cappedDistance = Math.min(maxDistance, 100);
    return 1 / (cappedDistance + 1);
  }

  /**
   * Calculate care level match score
   * Returns ratio of matched care levels to needed care levels
   */
  private careLevelMatchScore(
    neededCareLevels: string[],
    providedServices: string[]
  ): number {
    if (!neededCareLevels || neededCareLevels.length === 0) return 0;
    
    const matchCount = neededCareLevels.filter((level) =>
      providedServices.includes(level)
    ).length;
    
    return matchCount / neededCareLevels.length;
  }

  /**
   * Calculate comprehensive referral score for a provider
   * 
   * @param referralId - ID of the referral
   * @param providerId - ID of the provider to score against
   * @returns Score components and total score (0-1 scale)
   */
  async calculateScore(
    referralId: string,
    providerId: string
  ): Promise<ScoreComponents> {
    try {
      // Fetch referral and provider data in parallel
      const [referral, provider] = await Promise.all([
        db.referral.findUniqueOrThrow({
          where: { id: referralId },
          select: {
            urgency: true,
            primaryPayer: true,
            maxDistance: true,
            careLevels: true,
            servicesNeeded: true,
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
                addressLine1: true,
                city: true,
                state: true,
                zipCode: true,
              },
            },
          },
        }),
      ]);

      // Calculate individual score components
      const urgencyScore = this.urgencyWeight(referral.urgency) * 0.4;
      const payerScore = this.payerWeight(referral.primaryPayer) * 0.2;
      const distScore = this.distanceScore(referral.maxDistance) * 0.2;

      // Extract provider service codes
      const providerServiceCodes = provider.services.map(
        (ps) => ps.service.code
      );

      // Combine care levels and services needed for matching
      const allNeededServices = [
        ...(referral.careLevels || []),
        ...(referral.servicesNeeded || []),
      ];

      const careMatchScore =
        this.careLevelMatchScore(allNeededServices, providerServiceCodes) * 0.2;

      const total = urgencyScore + payerScore + distScore + careMatchScore;

      return {
        urgency: Number(urgencyScore.toFixed(3)),
        payer: Number(payerScore.toFixed(3)),
        distance: Number(distScore.toFixed(3)),
        careMatch: Number(careMatchScore.toFixed(3)),
        total: Number(total.toFixed(3)),
      };
    } catch (error) {
      console.error("Calculate referral score error:", error);
      throw error;
    }
  }

  /**
   * Calculate scores for multiple providers against a single referral
   * Returns providers sorted by score (highest first)
   * 
   * @param referralId - ID of the referral
   * @param providerIds - Array of provider IDs to score
   * @param limit - Maximum number of results to return
   * @returns Array of providers with their scores, sorted by total score descending
   */
  async calculateScoresForProviders(
    referralId: string,
    providerIds: string[],
    limit: number = 10
  ): Promise<Array<{ providerId: string; score: ScoreComponents }>> {
    try {
      // Calculate scores for all providers in parallel
      const scorePromises = providerIds.map(async (providerId) => {
        try {
          const score = await this.calculateScore(referralId, providerId);
          return { providerId, score };
        } catch (error) {
          // If scoring fails for a provider, return 0 score
          console.error(`Failed to score provider ${providerId}:`, error);
          return {
            providerId,
            score: {
              urgency: 0,
              payer: 0,
              distance: 0,
              careMatch: 0,
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
   * Get top-ranked providers for a referral
   * Automatically finds all verified providers and scores them
   * 
   * @param referralId - ID of the referral
   * @param limit - Maximum number of providers to return
   * @returns Array of providers with scores, sorted by score descending
   */
  async getTopProvidersForReferral(
    referralId: string,
    limit: number = 10
  ): Promise<
    Array<{
      provider: any;
      score: ScoreComponents;
    }>
  > {
    try {
      // Get all verified providers
      const providers = await db.provider.findMany({
        where: {
          verified: true,
          acceptsReferrals: true,
        },
        select: {
          id: true,
        },
      });

      const providerIds = providers.map((p) => p.id);

      // Calculate scores
      const scoredProviders = await this.calculateScoresForProviders(
        referralId,
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
        },
      });

      // Combine providers with their scores, maintaining sort order
      return scoredProviders.map((sp) => ({
        provider: fullProviders.find((p) => p.id === sp.providerId)!,
        score: sp.score,
      }));
    } catch (error) {
      console.error("Get top providers for referral error:", error);
      throw error;
    }
  }
}
