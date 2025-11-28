import { apiService } from "../config";
import {
  ApiResponse,
  VRSClientStatus,
  JobStatus,
  RetentionStatus,
} from "@carelink/types";

// ============================================
// SHARED TYPES
// ============================================

export interface VRSPagination {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

// ============================================
// CLIENT MANAGEMENT TYPES
// ============================================

export interface GetClientsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: VRSClientStatus;
  employerId?: string;
}

export interface VRSClient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email?: string | null;
  phone?: string | null;
  eligibilityType: string;
  servicesNeeded: string[];
  workHistory: unknown; // JSON
  skills: string[];
  interests: string[];
  status: VRSClientStatus;
  assignedSpecialistId?: string | null;
  createdAt: string;
  updatedAt: string;
  placements?: VRSPlacement[];
}

export interface ClientsResponse {
  clients: VRSClient[];
  pagination: VRSPagination;
}

export interface CreateClientData {
  firstName: string;
  lastName: string;
  dateOfBirth: string | Date;
  email?: string;
  phone?: string;
  eligibilityType: string;
  servicesNeeded?: string[];
  workHistory?: unknown;
  skills?: string[];
  interests?: string[];
  status?: VRSClientStatus;
  assignedSpecialistId?: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  id?: string;
}

// ============================================
// EMPLOYER MANAGEMENT TYPES
// ============================================

export interface GetEmployersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface VRSEmployer {
  id: string;
  companyName: string;
  industry: string;
  size: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  isInclusive: boolean;
  hasAccessibility: boolean;
  isSponsoredListing: boolean;
  sponsorshipExpiry?: string | null;
  createdAt: string;
  updatedAt: string;
  jobs?: VRSJob[];
}

export interface EmployersResponse {
  employers: VRSEmployer[];
  pagination: VRSPagination;
}

export interface CreateEmployerData {
  companyName: string;
  industry: string;
  size: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  isInclusive?: boolean;
  hasAccessibility?: boolean;
  isSponsoredListing?: boolean;
  sponsorshipExpiry?: string | Date;
}

export interface UpdateEmployerData extends Partial<CreateEmployerData> {
  id?: string;
}

// ============================================
// JOB MANAGEMENT TYPES
// ============================================

export interface GetJobsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: JobStatus;
  employerId?: string;
}

export interface VRSJob {
  id: string;
  employerId: string;
  title: string;
  description: string;
  employmentType: string;
  schedule: string[];
  wage: number | string;
  wageType: string;
  requirements: string[];
  preferredSkills: string[];
  isRemote: boolean;
  location?: string | null;
  status: JobStatus;
  postedAt: string;
  expiresAt?: string | null;
  employer?: {
    id: string;
    companyName: string;
    industry?: string;
  };
  placements?: VRSPlacement[];
}

export interface JobsResponse {
  jobs: VRSJob[];
  pagination: VRSPagination;
}

export interface CreateJobData {
  employerId: string;
  title: string;
  description: string;
  employmentType: string;
  schedule?: string[];
  wage: number | string;
  wageType: string;
  requirements?: string[];
  preferredSkills?: string[];
  isRemote?: boolean;
  location?: string;
  status?: JobStatus;
  expiresAt?: string | Date;
}

export interface UpdateJobData extends Partial<CreateJobData> {
  id?: string;
}

// ============================================
// PLACEMENT MANAGEMENT TYPES
// ============================================

export interface GetPlacementsParams {
  page?: number;
  limit?: number;
  status?: RetentionStatus;
}

export interface VRSPlacement {
  id: string;
  clientId: string;
  jobId: string;
  placementDate: string;
  startDate?: string | null;
  day30Status?: RetentionStatus | null;
  day60Status?: RetentionStatus | null;
  day90Status?: RetentionStatus | null;
  endDate?: string | null;
  endReason?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: VRSClient;
  job?: VRSJob & {
    employer?: VRSEmployer;
  };
}

export interface PlacementsResponse {
  placements: VRSPlacement[];
  pagination: VRSPagination;
}

export interface UpdateRetentionData {
  day30Status?: RetentionStatus | null;
  day60Status?: RetentionStatus | null;
  day90Status?: RetentionStatus | null;
  endDate?: Date | string | null;
  endReason?: string | null;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface VRSAnalytics {
  totalClients: number;
  totalActiveJobs: number;
  placementsThisQuarter: number;
  retentionRate?: number;
  placementsByMonth?: Array<{
    month: string;
    count: number;
  }>;
  jobsByIndustry?: Array<{
    industry: string;
    count: number;
  }>;
  retention: Array<{
    day90Status: RetentionStatus | null;
    _count: {
      day90Status: number;
    };
  }>;
}

// ============================================
// VRS SERVICE CLASS
// ============================================

export class VRSService {
  // ============================================
  // CLIENT OPERATIONS
  // ============================================

  async getClients(
    params: GetClientsParams = {}
  ): Promise<ApiResponse<ClientsResponse>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.status) queryParams.append("status", params.status);
    if (params.employerId) queryParams.append("employerId", params.employerId);

    return apiService.get<ClientsResponse>(
      `/api/vrs/clients?${queryParams.toString()}`
    );
  }

  async getClientById(clientId: string): Promise<ApiResponse<VRSClient>> {
    return apiService.get<VRSClient>(`/api/vrs/clients/${clientId}`);
  }

  async createClient(
    data: CreateClientData
  ): Promise<ApiResponse<VRSClient>> {
    return apiService.post<VRSClient>("/api/vrs/clients", data);
  }

  async updateClient(
    clientId: string,
    data: UpdateClientData
  ): Promise<ApiResponse<VRSClient>> {
    return apiService.put<VRSClient>(`/api/vrs/clients/${clientId}`, data);
  }

  async deleteClient(clientId: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/api/vrs/clients/${clientId}`);
  }

  // ============================================
  // EMPLOYER OPERATIONS
  // ============================================

  async getEmployers(
    params: GetEmployersParams = {}
  ): Promise<ApiResponse<EmployersResponse>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);

    return apiService.get<EmployersResponse>(
      `/api/vrs/employers?${queryParams.toString()}`
    );
  }

  async getEmployerById(employerId: string): Promise<ApiResponse<VRSEmployer>> {
    return apiService.get<VRSEmployer>(`/api/vrs/employers/${employerId}`);
  }

  async createEmployer(
    data: CreateEmployerData
  ): Promise<ApiResponse<VRSEmployer>> {
    return apiService.post<VRSEmployer>("/api/vrs/employers", data);
  }

  async updateEmployer(
    employerId: string,
    data: UpdateEmployerData
  ): Promise<ApiResponse<VRSEmployer>> {
    return apiService.put<VRSEmployer>(`/api/vrs/employers/${employerId}`, data);
  }

  // ============================================
  // JOB OPERATIONS
  // ============================================

  async getJobs(params: GetJobsParams = {}): Promise<ApiResponse<JobsResponse>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.status) queryParams.append("status", params.status);
    if (params.employerId) queryParams.append("employerId", params.employerId);

    return apiService.get<JobsResponse>(`/api/vrs/jobs?${queryParams.toString()}`);
  }

  async getJobById(jobId: string): Promise<ApiResponse<VRSJob>> {
    return apiService.get<VRSJob>(`/api/vrs/jobs/${jobId}`);
  }

  async createJob(data: CreateJobData): Promise<ApiResponse<VRSJob>> {
    return apiService.post<VRSJob>("/api/vrs/jobs", data);
  }

  async updateJob(
    jobId: string,
    data: UpdateJobData
  ): Promise<ApiResponse<VRSJob>> {
    return apiService.put<VRSJob>(`/api/vrs/jobs/${jobId}`, data);
  }

  // ============================================
  // PLACEMENT OPERATIONS
  // ============================================

  async getPlacements(
    params: GetPlacementsParams = {}
  ): Promise<ApiResponse<PlacementsResponse>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.status) queryParams.append("status", params.status);

    return apiService.get<PlacementsResponse>(
      `/api/vrs/placements?${queryParams.toString()}`
    );
  }

  async createPlacement(data: {
    clientId: string;
    jobId: string;
    placementDate: string | Date;
    startDate?: string | Date;
  }): Promise<ApiResponse<VRSPlacement>> {
    return apiService.post<VRSPlacement>("/api/vrs/placements", data);
  }

  async updatePlacementRetention(
    placementId: string,
    data: UpdateRetentionData
  ): Promise<ApiResponse<VRSPlacement>> {
    return apiService.put<VRSPlacement>(
      `/api/vrs/placements/${placementId}/retention`,
      data
    );
  }

  // ============================================
  // ANALYTICS OPERATIONS
  // ============================================

  async getAnalytics(): Promise<ApiResponse<VRSAnalytics>> {
    return apiService.get<VRSAnalytics>("/api/vrs/analytics");
  }
}

export const vrsService = new VRSService();

