import { OrganizationType } from '@carelink/types';

// Complete organization interface that matches the database model
export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  ein?: string;
  npi?: string;
  status: string;
  verifiedAt?: string;
  verifiedBy?: string;
  email: string;
  phone: string;
  fax?: string;
  website?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  settings?: any;
  createdAt: string;
  updatedAt: string;
  users?: any[];
  providers?: any[];
  _count?: {
    users: number;
    providers: number;
  };
}

// Organization data for registration/creation (without generated fields)
export interface OrganizationCreateData {
  name: string;
  type: OrganizationType;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  ein?: string;
  npi?: string;
  website?: string;
  fax?: string;
}

// Organization data for updates (partial)
export interface OrganizationUpdateData extends Partial<OrganizationCreateData> {
  id?: string;
}

// Organization search parameters
export interface SearchOrganizationsParams {
  query: string;
  type?: OrganizationType;
  limit?: number;
}

// Organization listing parameters
export interface GetOrganizationsParams {
  page?: number;
  limit?: number;
  type?: OrganizationType;
  status?: string;
}