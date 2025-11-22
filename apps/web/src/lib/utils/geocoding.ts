import { apiService } from "@/lib/api/config";

/**
 * Geocode an address to get latitude and longitude coordinates
 * Uses OpenStreetMap Nominatim API via our backend proxy
 */
export async function geocodeAddress(
  address: string
): Promise<{ latitude: number; longitude: number }> {
  try {
    // Use apiService to call backend geocoding endpoint
    // For now, we'll need to add this endpoint to the backend
    // This is a placeholder that will work once the backend endpoint exists
    const response = await apiService.post<{
      latitude: number;
      longitude: number;
    }>("/api/geocoding/geocode", { address });

    if (response.success && response.data) {
      return response.data;
    }

    // Fallback: return default coordinates (Minneapolis, MN)
    console.warn("Geocoding failed, using default coordinates");
    return { latitude: 44.9778, longitude: -93.265 };
  } catch (error) {
    console.error("Geocoding error:", error);
    // Fallback: return default coordinates (Minneapolis, MN)
    return { latitude: 44.9778, longitude: -93.265 };
  }
}
