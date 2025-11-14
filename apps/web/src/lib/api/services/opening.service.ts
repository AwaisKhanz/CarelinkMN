import { apiService } from "../config";
import { Payer } from "@carelink/types";
import { normalizeDate } from "@/lib/utils/date";
import { PAYER_LABELS } from "@/lib/constants";
import type {
  ApiResponse,
  Opening,
  OpeningStatus,
  OpeningsByStatus,
  CreateOpeningPayload,
  UpdateOpeningPayload,
  PaginatedOpenings,
} from "@carelink/types";

export interface GetOpeningsParams {
  homeId?: string;
  providerId?: string;
  status?: OpeningStatus;
  page?: number;
  limit?: number;
  includeExpired?: boolean;
  search?: string;
}

// Re-export PAYER_LABELS from constants for backward compatibility
export { PAYER_LABELS };

// Function overloads for type safety
function normalizeOpeningPayload(
  data: CreateOpeningPayload,
  homeId: string
): Record<string, unknown>;
function normalizeOpeningPayload(
  data: UpdateOpeningPayload
): Record<string, unknown>;
function normalizeOpeningPayload(
  data: CreateOpeningPayload | UpdateOpeningPayload,
  homeId?: string
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  // Handle homeId (only for create)
  if (homeId !== undefined) {
    payload.homeId = homeId;
  }

  // Handle common fields
  if (data.spotsAvailable !== undefined) {
    payload.spotsAvailable = data.spotsAvailable;
  }
  if (data.availableFrom !== undefined) {
    payload.availableFrom = normalizeDate(data.availableFrom);
  }
  if (data.availableUntil !== undefined) {
    payload.availableUntil = normalizeDate(data.availableUntil);
  }
  if (data.ageMin !== undefined) {
    payload.ageMin = data.ageMin;
  }
  if (data.ageMax !== undefined) {
    payload.ageMax = data.ageMax;
  }
  if (data.genderPreference !== undefined) {
    payload.genderPreference = data.genderPreference;
  }
  if (data.careLevels !== undefined) {
    payload.careLevels = data.careLevels;
  }
  if (data.supportedNeeds !== undefined) {
    payload.supportedNeeds = data.supportedNeeds;
  }
  if (data.acceptedPayers !== undefined) {
    payload.acceptedPayers = data.acceptedPayers;
  }
  if (data.privatePayRate !== undefined) {
    payload.privatePayRate = data.privatePayRate;
  }

  // Handle update-specific fields
  if ("status" in data && data.status !== undefined) {
    payload.status = data.status;
  }
  if ("freshnessTimestamp" in data && data.freshnessTimestamp !== undefined) {
    payload.freshnessTimestamp = normalizeDate(data.freshnessTimestamp);
  }

  return payload;
}

export class OpeningService {
  get payerLabels() {
    return PAYER_LABELS;
  }

  async createOpening(
    homeId: string,
    data: CreateOpeningPayload
  ): Promise<Opening> {
    const payload = normalizeOpeningPayload(data, homeId);
    const response = await apiService.post<Opening>(
      `/api/homes/${homeId}/openings`,
      payload
    );
    return response.data!;
  }

  async getOpenings(
    params: GetOpeningsParams = {}
  ): Promise<ApiResponse<PaginatedOpenings>> {
    const searchParams = new URLSearchParams();

    if (params.homeId) searchParams.append("homeId", params.homeId);
    if (params.providerId) searchParams.append("providerId", params.providerId);
    if (params.status) searchParams.append("status", params.status);
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.includeExpired !== undefined) {
      searchParams.append("includeExpired", params.includeExpired.toString());
    }
    if (params.search) {
      searchParams.append("search", params.search);
    }

    return await apiService.get<PaginatedOpenings>(
      `/api/openings?${searchParams}`
    );
  }

  async getOpeningsByStatus(
    providerId: string
  ): Promise<ApiResponse<OpeningsByStatus>> {
    return await apiService.get<OpeningsByStatus>(
      `/api/providers/${providerId}/openings/by-status`
    );
  }

  async getOpeningById(openingId: string): Promise<Opening> {
    const response = await apiService.get<Opening>(
      `/api/openings/${openingId}`
    );
    return response.data!;
  }

  async updateOpening(
    openingId: string,
    data: UpdateOpeningPayload
  ): Promise<Opening> {
    const payload = normalizeOpeningPayload(data);
    const response = await apiService.put<Opening>(
      `/api/openings/${openingId}`,
      payload
    );
    return response.data!;
  }

  async updateOpeningStatus(
    openingId: string,
    status: OpeningStatus
  ): Promise<Opening> {
    const response = await apiService.patch<Opening>(
      `/api/openings/${openingId}/status`,
      { status }
    );
    return response.data!;
  }

  async refreshOpening(openingId: string): Promise<Opening> {
    const response = await apiService.post<Opening>(
      `/api/openings/${openingId}/refresh`
    );
    return response.data!;
  }

  async deleteOpening(openingId: string): Promise<void> {
    await apiService.delete(`/api/openings/${openingId}`);
  }
}

export const openingService = new OpeningService();
export default openingService;

