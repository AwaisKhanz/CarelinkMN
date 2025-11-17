// Minnesota counties
export const MINNESOTA_COUNTIES = [
  { name: 'Hennepin', code: '053' },
  { name: 'Ramsey', code: '123' },
  { name: 'Dakota', code: '037' },
  { name: 'Anoka', code: '003' },
  { name: 'Washington', code: '163' },
  { name: 'Carver', code: '019' },
  { name: 'Scott', code: '139' },
  { name: 'Wright', code: '171' },
  { name: 'Sherburne', code: '141' },
  { name: 'Stearns', code: '145' },
  // Add all 87 counties as needed
] as const;

// Payer types
export const PAYER_TYPES = [
  { code: 'MA', name: 'Medical Assistance' },
  { code: 'MEDICARE', name: 'Medicare' },
  { code: 'PRIVATE', name: 'Private Pay' },
  { code: 'CADI', name: 'Community Access for Disability Inclusion' },
  { code: 'BI_TBI', name: 'Brain Injury / Traumatic Brain Injury' },
  { code: 'EW', name: 'Elderly Waiver' },
  { code: 'DD', name: 'Developmental Disabilities' },
] as const;

// License types
export const LICENSE_TYPES = [
  { code: '144D', name: 'Assisted Living - Dementia Care', category: 'Assisted Living' },
  { code: '245D_BASIC', name: '245D Basic', category: 'Community Residential' },
  { code: '245D_INTENSIVE', name: '245D Intensive', category: 'Community Residential' },
  { code: 'CRS', name: 'Community Residential Services', category: 'Community Residential' },
  { code: 'ALF', name: 'Assisted Living Facility', category: 'Assisted Living' },
  { code: 'ICF_DD', name: 'Intermediate Care Facility for DD', category: 'Residential' },
  { code: 'SIL', name: 'Semi-Independent Living', category: 'Independent Living' },
] as const;

// Service categories
export const SERVICE_CATEGORIES = [
  'Daily Living',
  'Medical',
  'Specialized Care',
  'Physical Support',
  'Personal Care',
  'Health Support',
  'Support Services',
] as const;

// Care levels
export const CARE_LEVELS = [
  'BASIC',
  'INTENSIVE',
  'SPECIALIZED',
  'MEMORY_CARE',
  'RESPITE',
] as const;

// Mobility levels
export const MOBILITY_LEVELS = [
  'AMBULATORY',
  'WHEELCHAIR',
  'BED_BOUND',
  'TRANSFER_ASSIST',
] as const;

// Gender preferences
export const GENDER_PREFERENCES = [
  'MALE',
  'FEMALE',
  'OTHER',
  'NO_PREFERENCE',
] as const;

// Urgency levels
export const URGENCY_LEVELS = [
  { code: 'URGENT', name: 'Urgent (< 48 hours)', hours: 48 },
  { code: 'HIGH', name: 'High (< 1 week)', hours: 168 },
  { code: 'ROUTINE', name: 'Routine (> 1 week)', hours: 168 * 4 },
] as const;

// User roles
export const USER_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'PROVIDER_OWNER',
  'PROVIDER_STAFF',
  'CASE_MANAGER',
  'HOSPITAL_SW',
  'VRS_SPECIALIST',
  'VENDOR',
  'PUBLIC',
] as const;

// Organization types
export const ORGANIZATION_TYPES = [
  'PROVIDER',
  'CASE_MANAGEMENT',
  'HOSPITAL',
  'VRS',
  'VENDOR',
] as const;

// Subscription tiers
export const SUBSCRIPTION_TIERS = [
  { code: 'FREE', name: 'Free', price: 0, features: ['Basic listing', '1 photo', '10 services'] },
  { code: 'PRO', name: 'Pro', price: 99, features: ['Enhanced visibility', '5 photos', 'Analytics'] },
  { code: 'PREMIUM', name: 'Premium', price: 199, features: ['Maximum boost', 'Priority support', 'Advanced analytics'] },
  { code: 'ENTERPRISE', name: 'Enterprise', price: 499, features: ['Custom features', 'Dedicated support', 'API access'] },
] as const;

// Performance targets (in milliseconds)
export const PERFORMANCE_TARGETS = {
  SEARCH_RESPONSE_TIME: 1000, // 1 second
  PAGE_LOAD_TIME: 2000, // 2 seconds
  API_RESPONSE_TIME: 200, // 200ms
  AI_MATCHING_TIME: 5000, // 5 seconds
  CACHE_HIT_RATE: 0.8, // 80%
} as const;

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

// File upload limits
export const FILE_LIMITS = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  DOCUMENT_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

// Rate limits
export const RATE_LIMITS = {
  DEFAULT: { requests: 100, window: '1m' },
  SEARCH: { requests: 30, window: '1m' },
  AI: { requests: 10, window: '1m' },
  AUTH: { requests: 5, window: '15m' },
  UPLOAD: { requests: 20, window: '1h' },
} as const;

// Cache TTL (in seconds)
export const CACHE_TTL = {
  STATIC_DATA: 86400, // 24 hours
  SEARCH_RESULTS: 300, // 5 minutes
  PROVIDER_PROFILE: 600, // 10 minutes
  OPENINGS: 120, // 2 minutes
  USER_SESSION: 1800, // 30 minutes
} as const;

// Business hours
export const BUSINESS_HOURS = {
  DEFAULT: { open: '08:00', close: '17:00' },
  EMERGENCY: { open: '00:00', close: '23:59' },
} as const;

// Notification channels
export const NOTIFICATION_CHANNELS = [
  'EMAIL',
  'SMS',
  'IN_APP',
  'PUSH',
] as const;

// Audit actions
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  PASSWORD_RESET: 'auth.password_reset',
  
  // PHI Access
  PHI_VIEW: 'phi.view',
  PHI_DOWNLOAD: 'phi.download',
  PHI_EXPORT: 'phi.export',
  
  // Administrative
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  ROLE_CHANGE: 'role.change',
  
  // Clinical
  REFERRAL_CREATE: 'referral.create',
  PLACEMENT_ACCEPT: 'placement.accept',
  DISCHARGE_INITIATE: 'discharge.initiate',
} as const;

// Opening freshness constants (from PRD requirement)
export const OPENING_EXPIRY_HOURS = 48; // 48-hour freshness enforcement
export const OPENING_EXPIRY_WARNING_HOURS = 12; // Warning threshold before expiry

// Data fetching limits
export const MAX_OPENINGS_FETCH_LIMIT = 100;
export const RECENT_ITEMS_LIMIT = 5;

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
