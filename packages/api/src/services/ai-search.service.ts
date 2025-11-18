import { db } from "@carelink/database";
import { Payer, EventType } from "@prisma/client";
import OpenAI from "openai";

/**
 * Enhanced AI Search Service (CareBot Pro)
 * 
 * Uses OpenAI API for sophisticated NLP parsing of natural language queries
 * into structured search filters. Falls back to basic keyword matching if OpenAI fails.
 */
export class AISearchService {
  private openai: OpenAI | null = null;

  constructor() {
    // Initialize OpenAI client if API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    }
  }

  /**
   * Parse natural language query into structured filters using OpenAI
   * Falls back to basic keyword matching if OpenAI is unavailable or fails
   * 
   * @param query - Natural language search query
   * @returns Structured search filters and explanation
   */
  async parseQuery(query: string): Promise<{
    counties?: string[];
    cities?: string[];
    licenseTypes?: string[];
    services?: string[];
    payers?: Payer[];
    maxDistance?: number;
    hasAvailability?: boolean;
    explanation?: string;
  }> {
    // Try OpenAI first if available
    if (this.openai) {
      try {
        const result = await this.parseQueryWithOpenAI(query);
        if (result) {
          return result;
        }
      } catch (error) {
        console.error("OpenAI parsing failed, falling back to basic parsing:", error);
        // Fall through to basic parsing
      }
    }

    // Fallback to basic keyword matching
    return this.parseQueryBasic(query);
  }

  /**
   * Parse query using OpenAI API
   */
  private async parseQueryWithOpenAI(query: string): Promise<{
    counties?: string[];
    cities?: string[];
    licenseTypes?: string[];
    services?: string[];
    payers?: Payer[];
    maxDistance?: number;
    hasAvailability?: boolean;
    explanation?: string;
  } | null> {
    if (!this.openai) return null;

    const systemPrompt = `You are CareBot Pro, an AI assistant specialized in parsing natural language queries about healthcare provider searches in Minnesota.

Your task is to extract structured search filters from natural language queries. You must understand Minnesota-specific terminology for:
- Counties (all 87 Minnesota counties, e.g., Hennepin, Ramsey, Dakota, Anoka, etc.)
- Cities (Minnesota cities like Minneapolis, St. Paul, Rochester, Duluth, etc.)
- License types: 144D, 245D, CRS, ALF (Assisted Living Facility)
- Payer types: MA (Medical Assistance), Medicare, Private, CADI, BI_TBI (Brain Injury/Traumatic Brain Injury), EW (Elderly Waiver), DD (Developmental Disabilities)
- Services: Various healthcare services
- Distance: Extract numeric distance in miles
- Availability: Detect if user wants only available/open spots

Return a JSON object with this exact structure:
{
  "counties": ["Hennepin", "Ramsey"], // Array of county names (capitalized properly)
  "cities": ["Minneapolis", "St. Paul"], // Array of city names
  "licenseTypes": ["144D", "245D"], // Array of license type codes
  "services": [], // Array of service names (if mentioned)
  "payers": ["MA", "MEDICARE"], // Array of payer codes (MA, MEDICARE, PRIVATE, CADI, BI_TBI, EW, DD)
  "maxDistance": 25, // Number in miles (if mentioned)
  "hasAvailability": true, // Boolean (if user wants only available spots)
  "explanation": "Brief explanation of what filters were extracted and why" // Human-readable explanation
}

Important:
- Only extract information explicitly mentioned or clearly implied in the query
- Use proper capitalization for counties and cities
- For payers, use the exact codes: MA, MEDICARE, PRIVATE, CADI, BI_TBI, EW, DD
- For license types, use: 144D, 245D, CRS, ALF
- If a field is not mentioned, omit it from the JSON (don't include empty arrays)
- The explanation should be concise and helpful, explaining what was extracted`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        temperature: 0.3, // Lower temperature for more consistent parsing
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) return null;

      const parsed = JSON.parse(content);

      // Validate and normalize the response
      const filters: {
        counties?: string[];
        cities?: string[];
        licenseTypes?: string[];
        services?: string[];
        payers?: Payer[];
        maxDistance?: number;
        hasAvailability?: boolean;
        explanation?: string;
      } = {};

      if (parsed.counties && Array.isArray(parsed.counties)) {
        filters.counties = parsed.counties.map((c: string) => 
          c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()
        );
      }

      if (parsed.cities && Array.isArray(parsed.cities)) {
        filters.cities = parsed.cities.map((c: string) => 
          c.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
        );
      }

      if (parsed.licenseTypes && Array.isArray(parsed.licenseTypes)) {
        filters.licenseTypes = parsed.licenseTypes.map((lt: string) => lt.toUpperCase());
      }

      if (parsed.services && Array.isArray(parsed.services)) {
        filters.services = parsed.services;
      }

      if (parsed.payers && Array.isArray(parsed.payers)) {
        // Map payer strings to Payer enum values
        const payerMap: Record<string, Payer> = {
          MA: Payer.MA,
          MEDICARE: Payer.MEDICARE,
          PRIVATE: Payer.PRIVATE,
          CADI: Payer.CADI,
          "BI_TBI": Payer.BI_TBI,
          "BI-TBI": Payer.BI_TBI,
          EW: Payer.EW,
          DD: Payer.DD,
        };
        filters.payers = parsed.payers
          .map((p: string) => payerMap[p.toUpperCase()])
          .filter((p: Payer | undefined) => p !== undefined) as Payer[];
      }

      if (typeof parsed.maxDistance === "number") {
        filters.maxDistance = parsed.maxDistance;
      }

      if (typeof parsed.hasAvailability === "boolean") {
        filters.hasAvailability = parsed.hasAvailability;
      }

      if (typeof parsed.explanation === "string") {
        filters.explanation = parsed.explanation;
      }

      return filters;
    } catch (error) {
      console.error("OpenAI API error:", error);
      return null;
    }
  }

  /**
   * Basic keyword-based parsing (fallback)
   */
  private parseQueryBasic(query: string): {
    counties?: string[];
    cities?: string[];
    licenseTypes?: string[];
    services?: string[];
    payers?: Payer[];
    maxDistance?: number;
    hasAvailability?: boolean;
    explanation?: string;
  } {
    const lowerQuery = query.toLowerCase();
    const filters: {
      counties?: string[];
      cities?: string[];
      licenseTypes?: string[];
      services?: string[];
      payers?: Payer[];
      maxDistance?: number;
      hasAvailability?: boolean;
      explanation?: string;
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
      filters.counties = foundCounties.map(c => 
        c.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      );
    }

    // Extract cities (common MN cities)
    const cities = ["minneapolis", "st paul", "rochester", "duluth", "bloomington", 
      "brooklyn park", "plymouth", "st cloud", "eagan", "woodbury", "maple grove",
      "eden prairie", "coon rapids", "burnsville", "apple valley", "blaine"];
    
    const foundCities = cities.filter(city => lowerQuery.includes(city));
    if (foundCities.length > 0) {
      filters.cities = foundCities.map(c => 
        c.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      );
    }

    // Extract license types
    const licenseTypes = ["144d", "245d", "crs", "alf", "assisted living", "group home"];
    const foundLicenseTypes = licenseTypes.filter(type => lowerQuery.includes(type));
    if (foundLicenseTypes.length > 0) {
      filters.licenseTypes = foundLicenseTypes.map(lt => {
        if (lt === "assisted living") return "ALF";
        if (lt === "group home") return "144D";
        return lt.toUpperCase();
      });
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

    // Generate basic explanation
    const parts: string[] = [];
    if (filters.counties) parts.push(`Counties: ${filters.counties.join(", ")}`);
    if (filters.cities) parts.push(`Cities: ${filters.cities.join(", ")}`);
    if (filters.licenseTypes) parts.push(`License types: ${filters.licenseTypes.join(", ")}`);
    if (filters.payers) parts.push(`Payers: ${filters.payers.join(", ")}`);
    if (filters.maxDistance) parts.push(`Within ${filters.maxDistance} miles`);
    if (filters.hasAvailability) parts.push("Only available spots");
    
    filters.explanation = parts.length > 0 
      ? `Extracted filters: ${parts.join("; ")}`
      : "No specific filters extracted from query";

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

