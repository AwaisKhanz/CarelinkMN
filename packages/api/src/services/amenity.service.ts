import { db } from "@carelink/database";

export interface CreateCustomAmenityData {
  amenityType: string;
  description?: string;
}

export class AmenityService {
  // Get all available amenities (standard list)
  async getAmenities(category?: string) {
    try {
      // Return predefined amenities since we don't have a separate Amenity model
      const standardAmenities = [
        // Accessibility Features
        { amenityType: "Wheelchair Accessible", category: "Accessibility" },
        { amenityType: "Elevator", category: "Accessibility" },
        { amenityType: "Ramp Access", category: "Accessibility" },
        { amenityType: "Wide Doorways", category: "Accessibility" },
        { amenityType: "Handrails", category: "Accessibility" },
        { amenityType: "Accessible Bathroom", category: "Accessibility" },

        // Medical & Health
        { amenityType: "24/7 Nursing Care", category: "Medical" },
        { amenityType: "Medication Management", category: "Medical" },
        { amenityType: "Physical Therapy", category: "Medical" },
        { amenityType: "Occupational Therapy", category: "Medical" },
        { amenityType: "Speech Therapy", category: "Medical" },
        { amenityType: "Memory Care", category: "Medical" },
        { amenityType: "Dementia Care", category: "Medical" },
        { amenityType: "Hospice Care", category: "Medical" },

        // Living Spaces
        { amenityType: "Private Room", category: "Living" },
        { amenityType: "Semi-Private Room", category: "Living" },
        { amenityType: "Private Bathroom", category: "Living" },
        { amenityType: "Kitchenette", category: "Living" },
        { amenityType: "Balcony/Patio", category: "Living" },
        { amenityType: "Garden Access", category: "Living" },

        // Activities & Recreation
        { amenityType: "Activity Room", category: "Activities" },
        { amenityType: "Library", category: "Activities" },
        { amenityType: "Game Room", category: "Activities" },
        { amenityType: "Fitness Center", category: "Activities" },
        { amenityType: "Swimming Pool", category: "Activities" },
        { amenityType: "Walking Paths", category: "Activities" },
        { amenityType: "Outdoor Seating", category: "Activities" },

        // Dining & Nutrition
        { amenityType: "Restaurant-Style Dining", category: "Dining" },
        { amenityType: "Private Dining Room", category: "Dining" },
        { amenityType: "Snack Bar", category: "Dining" },
        { amenityType: "Special Diets", category: "Dining" },
        { amenityType: "Meal Planning", category: "Dining" },

        // Transportation
        { amenityType: "Transportation Services", category: "Transportation" },
        { amenityType: "Medical Appointments", category: "Transportation" },
        { amenityType: "Shopping Trips", category: "Transportation" },

        // Technology & Communication
        { amenityType: "WiFi", category: "Technology" },
        { amenityType: "Cable TV", category: "Technology" },
        { amenityType: "Computer Access", category: "Technology" },
        { amenityType: "Video Calling", category: "Technology" },

        // Safety & Security
        { amenityType: "24/7 Security", category: "Safety" },
        { amenityType: "Emergency Response", category: "Safety" },
        { amenityType: "Smoke Detectors", category: "Safety" },
        { amenityType: "Sprinkler System", category: "Safety" },

        // Pet & Family
        { amenityType: "Pet Friendly", category: "Pets" },
        { amenityType: "Family Visits", category: "Family" },
        { amenityType: "Overnight Stays", category: "Family" },
      ];

      if (category) {
        return standardAmenities.filter(amenity => amenity.category === category);
      }

      return standardAmenities;
    } catch (error) {
      console.error("Get amenities error:", error);
      throw new Error("Failed to retrieve amenities");
    }
  }

  // Get amenity categories
  async getAmenityCategories() {
    try {
      const amenities = await this.getAmenities();
      const categories = [...new Set(amenities.map(a => a.category))];
      return categories.sort();
    } catch (error) {
      console.error("Get amenity categories error:", error);
      throw new Error("Failed to retrieve amenity categories");
    }
  }

  // Create a custom amenity for a home
  async createCustomAmenity(providerId: string, amenityData: CreateCustomAmenityData, userId: string) {
    try {
      // Verify user has access to this provider
      const provider = await db.provider.findFirst({
        where: {
          id: providerId,
          organization: {
            users: {
              some: {
                id: userId,
              },
            },
          },
        },
      });

      if (!provider) {
        throw new Error("Provider not found or access denied");
      }

      // Since we don't have a separate Amenity model, we'll just return the amenity data
      // In a real implementation, you might want to store custom amenities in a separate table
      return {
        amenityType: amenityData.amenityType,
        description: amenityData.description,
        isCustom: true,
      };
    } catch (error) {
      console.error("Create custom amenity error:", error);
      throw new Error("Failed to create custom amenity");
    }
  }

  // Get custom amenities for a provider
  async getProviderCustomAmenities(providerId: string, userId: string) {
    try {
      // Verify user has access to this provider
      const provider = await db.provider.findFirst({
        where: {
          id: providerId,
          organization: {
            users: {
              some: {
                id: userId,
              },
            },
          },
        },
      });

      if (!provider) {
        throw new Error("Provider not found or access denied");
      }

      // Since we don't have a separate Amenity model, return empty array
      // In a real implementation, you might want to store custom amenities in a separate table
      return [];
    } catch (error) {
      console.error("Get provider custom amenities error:", error);
      throw new Error("Failed to retrieve custom amenities");
    }
  }
}
