import { db } from "@carelink/database";
import { Payer, EventType } from "@prisma/client";

/**
 * Basic AI Search Service (CareBot Pro)
 * 
 * This is a basic implementation that parses natural language queries
 * into structured search filters. For production, integrate with OpenAI API
 * for more sophisticated NLP.
 */
export class AISearchService {
  /**
   * Parse natural language query into structured filters
   * 
   * @param query - Natural language search query
   * @returns Structured search filters
   */
  async parseQuery(query: string): Promise<{
    counties?: string[];
    cities?: string[];
    licenseTypes?: string[];
    services?: string[];
    payers?: Payer[];
    maxDistance?: number;
    hasAvailability?: boolean;
  }> {
    const lowerQuery = query.toLowerCase();
    const filters: {
      counties?: string[];
      cities?: string[];
      licenseTypes?: string[];
      services?: string[];
      payers?: Payer[];
      maxDistance?: number;
      hasAvailability?: boolean;
    } = {};

    // Extract counties (Minnesota counties)
    const minnesotaCounties = [
      "hennepin", "ramsey", "dakota", "anoka", "washington", "carver", "scott",
      "wright", "sherburne", "stearns", "olmsted", "winona", "mower", "rice",
      "goodhue", "wabasha", "dodge", "steele", "freeborn", "faribault", "martin",
      "jackson", "nobles", "rock", "pipestone", "murray", "cottonwood", "watonwan",
      "blue earth", "le sueur", "sibley", "mcleod", "renville", "kandiyohi",
      "meeker", "wright", "hennepin", "ramsey"
    ];

    const foundCounties = minnesotaCounties.filter(county => 
      lowerQuery.includes(county)
    );
    if (foundCounties.length > 0) {
      filters.counties = foundCounties;
    }

    // Extract cities (common MN cities)
    const cities = ["minneapolis", "st paul", "rochester", "duluth", "bloomington", 
      "brooklyn park", "plymouth", "st cloud", "eagan", "woodbury", "maple grove",
      "eden prairie", "coon rapids", "burnsville", "apple valley", "blaine"];
    
    const foundCities = cities.filter(city => lowerQuery.includes(city));
    if (foundCities.length > 0) {
      filters.cities = foundCities;
    }

    // Extract license types
    const licenseTypes = ["144d", "245d", "crs", "alf", "assisted living", "group home"];
    const foundLicenseTypes = licenseTypes.filter(type => lowerQuery.includes(type));
    if (foundLicenseTypes.length > 0) {
      filters.licenseTypes = foundLicenseTypes;
    }

    // Extract payers
    const payerKeywords: { [key: string]: Payer } = {
      "medical assistance": Payer.MA,
      "ma": Payer.MA,
      "medicare": Payer.MEDICARE,
      "private": Payer.PRIVATE,
      "private pay": Payer.PRIVATE,
      "cadi": Payer.CADI,
      "brain injury": Payer.BI_TBI,
      "tbi": Payer.BI_TBI,
      "elderly waiver": Payer.EW,
      "ew": Payer.EW,
      "developmental disabilities": Payer.DD,
      "dd": Payer.DD,
    };

    const foundPayers: Payer[] = [];
    for (const [keyword, payer] of Object.entries(payerKeywords)) {
      if (lowerQuery.includes(keyword)) {
        foundPayers.push(payer);
      }
    }
    if (foundPayers.length > 0) {
      filters.payers = foundPayers;
    }

    // Extract distance
    const distanceMatch = lowerQuery.match(/(\d+)\s*(mile|miles|mi)/);
    if (distanceMatch) {
      filters.maxDistance = parseInt(distanceMatch[1]);
    }

    // Extract availability keywords
    if (lowerQuery.includes("available") || lowerQuery.includes("open") || 
        lowerQuery.includes("vacancy") || lowerQuery.includes("spot")) {
      filters.hasAvailability = true;
    }

    return filters;
  }

  /**
   * Rate limit check (basic implementation)
   * In production, use Redis or similar for distributed rate limiting
   */
  async checkRateLimit(userId: string): Promise<boolean> {
    // Basic implementation - check last 10 queries in last minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    
    const recentQueries = await db.analyticsEvent.count({
      where: {
        userId: userId,
        eventType: EventType.SEARCH_PERFORMED,
        createdAt: {
          gte: oneMinuteAgo,
        },
      },
    });

    // Allow 10 queries per minute
    return recentQueries < 10;
  }

  /**
   * Track search query for analytics
   */
  async trackSearch(
    userId: string | null,
    query: string,
    filters: {
      counties?: string[];
      cities?: string[];
      licenseTypes?: string[];
      services?: string[];
      payers?: Payer[];
      maxDistance?: number;
      hasAvailability?: boolean;
    }
  ): Promise<void> {
    try {
      await db.analyticsEvent.create({
        data: {
          eventType: EventType.SEARCH_PERFORMED,
          userId: userId || undefined,
          eventData: {
            query,
            filters,
            source: "carebot",
          },
        },
      });
    } catch (error) {
      console.error("Failed to track search:", error);
      // Don't throw - analytics failure shouldn't break search
    }
  }
}

