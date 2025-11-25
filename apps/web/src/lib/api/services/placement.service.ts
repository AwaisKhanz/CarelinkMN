import { apiService } from "../config";
import { PlacementStatus } from "@carelink/types";
import { normalizeDate } from "@/lib/utils/date";
import type {
  ApiResponse,
  PaginatedPlacements,
  Placement,
  CreatePlacementPayload,
  UpdatePlacementPayload,
} from "@carelink/types";

export interface GetPlacementsParams {
  providerId?: string;
  openingId?: string;
  referralId?: string;
  dischargeCaseId?: string;
  status?: PlacementStatus;
  page?: number;
  limit?: number;
  search?: string;
}

// Function overloads for type safety
function normalizePlacementPayload(
  data: CreatePlacementPayload
): Record<string, unknown>;
function normalizePlacementPayload(
  data: UpdatePlacementPayload
): Record<string, unknown>;
function normalizePlacementPayload(
  data: CreatePlacementPayload | UpdatePlacementPayload
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  // Handle create-specific fields
  if ("openingId" in data) {
    payload.openingId = data.openingId;
  }
  if ("referralId" in data && data.referralId !== undefined) {
    payload.referralId = data.referralId;
  }
  if ("dischargeCaseId" in data && data.dischargeCaseId !== undefined) {
    payload.dischargeCaseId = data.dischargeCaseId;
  }

  // Handle common fields
  if (data.placementDate !== undefined) {
    payload.placementDate = normalizeDate(data.placementDate);
  }
  if (data.moveInDate !== undefined) {
    payload.moveInDate = normalizeDate(data.moveInDate);
  }

  // Handle update-specific fields
  if ("status" in data && data.status !== undefined) {
    payload.status = data.status;
  }

  return payload;
}

export class PlacementService {
  async createPlacement(
    data: CreatePlacementPayload
  ): Promise<ApiResponse<Placement>> {
    const payload = normalizePlacementPayload(data);
    return await apiService.post<Placement>("/api/placements", payload);
  }

  async createPlacementFromReferral(data: {
    referralId: string;
    providerId: string;
    homeId: string;
    openingId: string;
    placementDate: string;
    moveInDate?: string;
    notes?: string;
  }): Promise<ApiResponse<Placement>> {
    return await apiService.post<Placement>("/api/placements/from-referral", data);
  }

  async getPlacements(
    params: GetPlacementsParams = {}
  ): Promise<ApiResponse<PaginatedPlacements>> {
    const searchParams = new URLSearchParams();

    if (params.providerId) searchParams.append("providerId", params.providerId);
    if (params.openingId) searchParams.append("openingId", params.openingId);
    if (params.referralId) searchParams.append("referralId", params.referralId);
    if (params.dischargeCaseId)
      searchParams.append("dischargeCaseId", params.dischargeCaseId);
    if (params.status) searchParams.append("status", params.status);
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.search) {
      searchParams.append("search", params.search);
    }

    return await apiService.get<PaginatedPlacements>(
      `/api/placements?${searchParams}`
    );
  }

  async getPlacementById(
    placementId: string
  ): Promise<ApiResponse<Placement>> {
    return await apiService.get<Placement>(
      `/api/placements/${placementId}`
    );
  }

  async updatePlacement(
    placementId: string,
    data: UpdatePlacementPayload
  ): Promise<ApiResponse<Placement>> {
    const payload = normalizePlacementPayload(data);
    return await apiService.put<Placement>(
      `/api/placements/${placementId}`,
      payload
    );
  }

  async updatePlacementStatus(
    placementId: string,
    status: PlacementStatus
  ): Promise<ApiResponse<Placement>> {
    return await apiService.patch<Placement>(
      `/api/placements/${placementId}/status`,
      { status }
    );
  }

  async cancelPlacement(
    placementId: string,
    reason?: string
  ): Promise<ApiResponse<Placement>> {
    return await apiService.post<Placement>(
      `/api/placements/${placementId}/cancel`,
      { reason }
    );
  }

  async generatePacket(
    placementId: string
  ): Promise<ApiResponse<{ packetUrl: string }>> {
    return await apiService.post<{ packetUrl: string }>(
      `/api/placements/${placementId}/packet`
    );
  }

  async getPacketAccessLogs(
    placementId: string
  ): Promise<ApiResponse<any[]>> {
    return await apiService.get<any[]>(
      `/api/placements/${placementId}/packet/access-logs`
    );
  }
}

export const placementService = new PlacementService();
export default placementService;

