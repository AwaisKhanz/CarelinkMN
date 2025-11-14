import { db } from "@carelink/database";
import { Prisma, EventType, PlacementStatus } from "@prisma/client";
import {
  ProviderAnalyticsFilters,
  ProviderAnalytics,
  FunnelMetrics,
  FillTimeMetrics,
  ResponseTimeMetrics,
  PayerMixAnalysis,
} from "@carelink/types";

export class AnalyticsService {
  /**
   * Get provider analytics
   */
  async getProviderAnalytics(
    filters: ProviderAnalyticsFilters
  ): Promise<ProviderAnalytics> {
    const { providerId, startDate, endDate } = filters;

    // Set default date range to last 30 days if not provided
    const defaultStartDate = startDate 
      ? (typeof startDate === 'string' ? new Date(startDate) : startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = endDate 
      ? (typeof endDate === 'string' ? new Date(endDate) : endDate)
      : new Date();

    // Build date filter
    const dateFilter = {
      gte: defaultStartDate,
      lte: defaultEndDate,
    };

    // Calculate funnel metrics
    const funnel = await this.calculateFunnelMetrics(providerId, dateFilter);

    // Calculate fill time metrics
    const fillTime = await this.calculateFillTimeMetrics(providerId, dateFilter);

    // Calculate response time metrics
    const responseTime = await this.calculateResponseTimeMetrics(providerId, dateFilter);

    // Calculate payer mix
    const payerMix = await this.calculatePayerMix(providerId, dateFilter);

    // Get summary statistics
    const summary = await this.getSummaryStats(providerId);

    return {
      funnel,
      fillTime,
      responseTime,
      payerMix,
      summary,
    };
  }

  /**
   * Calculate funnel metrics: Views → Inquiries → Placements
   */
  private async calculateFunnelMetrics(
    providerId: string,
    dateFilter: { gte: Date; lte: Date }
  ): Promise<FunnelMetrics> {
    // Views: Count of PROVIDER_VIEWED events
    const views = await db.analyticsEvent.count({
      where: {
        providerId,
        eventType: EventType.PROVIDER_VIEWED,
        createdAt: dateFilter,
      },
    });

    // Inquiries: Count of PROVIDER_CONTACTED events or messages sent
    const inquiries = await db.analyticsEvent.count({
      where: {
        providerId,
        eventType: EventType.PROVIDER_CONTACTED,
        createdAt: dateFilter,
      },
    });

    // Placements: Count of placements created
    const placements = await db.placement.count({
      where: {
        providerId,
        createdAt: dateFilter,
      },
    });

    // Calculate conversion rates
    const viewsToInquiries = views > 0 ? (inquiries / views) * 100 : 0;
    const inquiriesToPlacements = inquiries > 0 ? (placements / inquiries) * 100 : 0;
    const viewsToPlacements = views > 0 ? (placements / views) * 100 : 0;

    return {
      views,
      inquiries,
      placements,
      conversionRate: {
        viewsToInquiries,
        inquiriesToPlacements,
        viewsToPlacements,
      },
    };
  }

  /**
   * Calculate fill time metrics (time from opening creation to placement completion)
   */
  private async calculateFillTimeMetrics(
    providerId: string,
    dateFilter: { gte: Date; lte: Date }
  ): Promise<FillTimeMetrics> {
    // Get all openings for this provider
    // Explicitly select fields to avoid issues with missing database columns
    const openings = await db.opening.findMany({
      where: {
        providerId,
        createdAt: dateFilter,
      },
      select: {
        id: true,
        createdAt: true,
        placements: {
          where: {
            status: PlacementStatus.COMPLETED,
            completedAt: {
              not: null,
            },
          },
          select: {
            id: true,
            completedAt: true,
          },
        },
      },
    });

    // Calculate fill times (time from opening creation to placement completion)
    const fillTimes: number[] = [];
    
    for (const opening of openings) {
      for (const placement of opening.placements) {
        if (placement.completedAt) {
          const fillTimeHours =
            (placement.completedAt.getTime() - opening.createdAt.getTime()) /
            (1000 * 60 * 60);
          fillTimes.push(fillTimeHours);
        }
      }
    }

    // Calculate statistics
    const totalOpenings = openings.length;
    const filledOpenings = openings.filter((o) => o.placements.length > 0).length;

    if (fillTimes.length === 0) {
      return {
        averageFillTime: 0,
        medianFillTime: 0,
        minFillTime: 0,
        maxFillTime: 0,
        totalOpenings,
        filledOpenings,
      };
    }

    fillTimes.sort((a, b) => a - b);
    const averageFillTime =
      fillTimes.reduce((sum, time) => sum + time, 0) / fillTimes.length;
    const medianFillTime =
      fillTimes.length % 2 === 0
        ? (fillTimes[fillTimes.length / 2 - 1] + fillTimes[fillTimes.length / 2]) / 2
        : fillTimes[Math.floor(fillTimes.length / 2)];
    const minFillTime = fillTimes[0];
    const maxFillTime = fillTimes[fillTimes.length - 1];

    return {
      averageFillTime: Math.round(averageFillTime * 100) / 100,
      medianFillTime: Math.round(medianFillTime * 100) / 100,
      minFillTime: Math.round(minFillTime * 100) / 100,
      maxFillTime: Math.round(maxFillTime * 100) / 100,
      totalOpenings,
      filledOpenings,
    };
  }

  /**
   * Calculate response time metrics
   */
  private async calculateResponseTimeMetrics(
    providerId: string,
    dateFilter: { gte: Date; lte: Date }
  ): Promise<ResponseTimeMetrics> {
    // Get all message threads for this provider
    const threads = await db.messageThread.findMany({
      where: {
        providerId,
        createdAt: dateFilter,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    const responseTimes: number[] = [];
    let respondedCount = 0;

    for (const thread of threads) {
      if (thread.messages.length < 2) continue; // Need at least 2 messages for a response

      // Find first message from provider (response)
      const providerMessages = thread.messages.filter(
        (msg) => msg.senderId !== thread.initiatorId
      );

      if (providerMessages.length > 0) {
        const firstProviderMessage = providerMessages[0];
        const firstMessage = thread.messages[0];

        const responseTimeHours =
          (firstProviderMessage.createdAt.getTime() -
            firstMessage.createdAt.getTime()) /
          (1000 * 60 * 60);

        responseTimes.push(responseTimeHours);
        respondedCount++;
      }
    }

    const totalMessages = threads.length;

    if (responseTimes.length === 0) {
      return {
        averageResponseTime: 0,
        medianResponseTime: 0,
        responseRate: 0,
        totalMessages,
        respondedMessages: 0,
      };
    }

    responseTimes.sort((a, b) => a - b);
    const averageResponseTime =
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const medianResponseTime =
      responseTimes.length % 2 === 0
        ? (responseTimes[responseTimes.length / 2 - 1] +
            responseTimes[responseTimes.length / 2]) /
          2
        : responseTimes[Math.floor(responseTimes.length / 2)];

    const responseRate = totalMessages > 0 ? (respondedCount / totalMessages) * 100 : 0;

    return {
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      medianResponseTime: Math.round(medianResponseTime * 100) / 100,
      responseRate: Math.round(responseRate * 100) / 100,
      totalMessages,
      respondedMessages: respondedCount,
    };
  }

  /**
   * Calculate payer mix analysis
   */
  private async calculatePayerMix(
    providerId: string,
    dateFilter: { gte: Date; lte: Date }
  ): Promise<PayerMixAnalysis[]> {
    // Get all placements with their payer information
    const placements = await db.placement.findMany({
      where: {
        providerId,
        createdAt: dateFilter,
        status: {
          in: [PlacementStatus.CONFIRMED, PlacementStatus.IN_PROGRESS, PlacementStatus.COMPLETED],
        },
      },
      include: {
        referral: {
          select: {
            primaryPayer: true,
          },
        },
        dischargeCase: {
          select: {
            primaryInsurance: true,
          },
        },
        opening: {
          select: {
            createdAt: true,
          },
        },
      },
    });

    // Group by payer
    const payerMap = new Map<string, { count: number; fillTimes: number[] }>();

    for (const placement of placements) {
      const payer =
        placement.referral?.primaryPayer || placement.dischargeCase?.primaryInsurance;

      if (!payer) continue;

      if (!payerMap.has(payer)) {
        payerMap.set(payer, { count: 0, fillTimes: [] });
      }

      const payerData = payerMap.get(payer)!;
      payerData.count++;

      // Calculate fill time if placement is completed
      if (placement.completedAt && placement.opening) {
        const fillTimeHours =
          (placement.completedAt.getTime() -
            placement.opening.createdAt.getTime()) /
          (1000 * 60 * 60);
        payerData.fillTimes.push(fillTimeHours);
      }
    }

    const totalPlacements = placements.length;

    // Convert to array and calculate percentages
    const payerMix: PayerMixAnalysis[] = Array.from(payerMap.entries()).map(
      ([payer, data]) => {
        const averageFillTime =
          data.fillTimes.length > 0
            ? data.fillTimes.reduce((sum, time) => sum + time, 0) / data.fillTimes.length
            : 0;

        return {
          payer,
          count: data.count,
          percentage: totalPlacements > 0 ? (data.count / totalPlacements) * 100 : 0,
          averageFillTime: Math.round(averageFillTime * 100) / 100,
        };
      }
    );

    // Sort by count descending
    payerMix.sort((a, b) => b.count - a.count);

    return payerMix;
  }

  /**
   * Get summary statistics
   */
  private async getSummaryStats(providerId: string): Promise<{
    totalHomes: number;
    activeOpenings: number;
    totalPlacements: number;
    completedPlacements: number;
    pendingPlacements: number;
  }> {
    const [totalHomes, activeOpenings, placements] = await Promise.all([
      db.home.count({
        where: {
          providerId,
          isActive: true,
        },
      }),
      db.opening.count({
        where: {
          providerId,
          status: "OPEN",
        },
      }),
      db.placement.findMany({
        where: {
          providerId,
        },
        select: {
          status: true,
        },
      }),
    ]);

    const totalPlacements = placements.length;
    const completedPlacements = placements.filter((p) => p.status === PlacementStatus.COMPLETED).length;
    const pendingPlacements = placements.filter((p) => p.status === PlacementStatus.PENDING).length;

    return {
      totalHomes,
      activeOpenings,
      totalPlacements,
      completedPlacements,
      pendingPlacements,
    };
  }
}

