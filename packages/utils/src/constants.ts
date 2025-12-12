// ============================================
// MINNESOTA COUNTIES
// ============================================

/**
 * Minnesota counties list (all 87 counties, alphabetically sorted)
 * Used across web app and API for validation and form options
 */
export const MINNESOTA_COUNTIES: readonly string[] = [
  "Aitkin",
  "Anoka",
  "Becker",
  "Beltrami",
  "Benton",
  "Big Stone",
  "Blue Earth",
  "Brown",
  "Carlton",
  "Carver",
  "Cass",
  "Chippewa",
  "Chisago",
  "Clay",
  "Clearwater",
  "Cook",
  "Cottonwood",
  "Crow Wing",
  "Dakota",
  "Dodge",
  "Douglas",
  "Faribault",
  "Fillmore",
  "Freeborn",
  "Goodhue",
  "Grant",
  "Hennepin",
  "Houston",
  "Hubbard",
  "Isanti",
  "Itasca",
  "Jackson",
  "Kanabec",
  "Kandiyohi",
  "Kittson",
  "Koochiching",
  "Lac qui Parle",
  "Lake",
  "Lake of the Woods",
  "Le Sueur",
  "Lincoln",
  "Lyon",
  "Mahnomen",
  "Marshall",
  "Martin",
  "McLeod",
  "Meeker",
  "Mille Lacs",
  "Morrison",
  "Mower",
  "Murray",
  "Nicollet",
  "Nobles",
  "Norman",
  "Olmsted",
  "Otter Tail",
  "Pennington",
  "Pine",
  "Pipestone",
  "Polk",
  "Pope",
  "Ramsey",
  "Red Lake",
  "Redwood",
  "Renville",
  "Rice",
  "Rock",
  "Roseau",
  "Scott",
  "Sherburne",
  "Sibley",
  "St. Louis",
  "Stearns",
  "Steele",
  "Stevens",
  "Swift",
  "Todd",
  "Traverse",
  "Wabasha",
  "Wadena",
  "Waseca",
  "Washington",
  "Watonwan",
  "Wilkin",
  "Winona",
  "Wright",
  "Yellow Medicine",
] as const;

// ============================================
// PAYER TYPES
// ============================================

export interface PayerOption {
  value: string;
  label: string;
}

/**
 * Payer types / Accepted payers
 * Payment options accepted by providers
 */
export const PAYER_OPTIONS: readonly PayerOption[] = [
  { value: "MA", label: "Medical Assistance (MA)" },
  { value: "MEDICARE", label: "Medicare" },
  { value: "PRIVATE", label: "Private Pay" },
  { value: "CADI", label: "CADI" },
  { value: "BI_TBI", label: "BI/TBI" },
  { value: "EW", label: "Elderly Waiver (EW)" },
  { value: "DD", label: "Developmental Disabilities (DD)" },
] as const;

// Legacy export for backward compatibility
export const PAYER_TYPES = PAYER_OPTIONS;

// ============================================
// GENDER OPTIONS
// ============================================

export interface GenderOption {
  value: string;
  label: string;
}

/**
 * Gender options for clients/patients
 * Used in referrals and discharge cases
 */
export const GENDER_OPTIONS: readonly GenderOption[] = [
  { value: "NO_PREFERENCE", label: "No Preference" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const;

// Service categories
export const SERVICE_CATEGORIES = [
  "Daily Living",
  "Medical",
  "Specialized Care",
  "Physical Support",
  "Personal Care",
  "Health Support",
  "Support Services",
] as const;

// ============================================
// SUPPORTED NEEDS / SERVICES NEEDED
// ============================================

export interface SupportedNeedOption {
  value: string;
  label: string;
}

/**
 * Supported needs / Services needed for referrals
 * Types of services clients may require
 */
export const SUPPORTED_NEEDS: readonly SupportedNeedOption[] = [
  { value: "MOBILITY", label: "Mobility Support" },
  { value: "MEMORY_CARE", label: "Memory Care" },
  { value: "BEHAVIORAL", label: "Behavioral Support" },
  { value: "MEDICAL", label: "Medical Management" },
  { value: "DIABETES", label: "Diabetes Care" },
  { value: "DEMENTIA", label: "Dementia Care" },
  { value: "ALZHEIMERS", label: "Alzheimer's Care" },
  { value: "PARKINSONS", label: "Parkinson's Care" },
  { value: "STROKE", label: "Stroke Recovery" },
  { value: "RESPIRATORY", label: "Respiratory Support" },
] as const;

// ============================================
// BEHAVIORAL NEEDS
// ============================================

export interface BehavioralNeedOption {
  value: string;
  label: string;
}

/**
 * Behavioral needs for referrals
 * Behavioral supports clients may require
 */
export const BEHAVIORAL_NEEDS: readonly BehavioralNeedOption[] = [
  { value: "AGGRESSION", label: "Aggression" },
  { value: "WANDERING", label: "Wandering" },
  { value: "SELF_HARM", label: "Self-Harm" },
  { value: "VERBAL_AGGRESSION", label: "Verbal Aggression" },
  { value: "PHYSICAL_AGGRESSION", label: "Physical Aggression" },
  { value: "ELOPEMENT", label: "Elopement Risk" },
  { value: "SUNDOWNING", label: "Sundowning" },
  { value: "ANXIETY", label: "Anxiety" },
  { value: "DEPRESSION", label: "Depression" },
  { value: "PSYCHOSIS", label: "Psychosis" },
] as const;

// ============================================
// MEDICAL NEEDS
// ============================================

export interface MedicalNeedOption {
  value: string;
  label: string;
}

/**
 * Medical needs for referrals
 * Medical conditions and care requirements
 */
export const MEDICAL_NEEDS: readonly MedicalNeedOption[] = [
  { value: "DIABETES", label: "Diabetes Management" },
  { value: "HYPERTENSION", label: "Hypertension" },
  { value: "HEART_DISEASE", label: "Heart Disease" },
  { value: "RESPIRATORY", label: "Respiratory Support" },
  { value: "OXYGEN", label: "Oxygen Therapy" },
  { value: "DEMENTIA", label: "Dementia Care" },
  { value: "ALZHEIMERS", label: "Alzheimer's Care" },
  { value: "PARKINSONS", label: "Parkinson's Disease" },
  { value: "STROKE", label: "Stroke Recovery" },
  { value: "MOBILITY", label: "Mobility Assistance" },
  { value: "INCONTINENCE", label: "Incontinence Care" },
  { value: "WOUND_CARE", label: "Wound Care" },
  { value: "MEDICATION_MANAGEMENT", label: "Medication Management" },
  { value: "IV_THERAPY", label: "IV Therapy" },
  { value: "FEEDING_TUBE", label: "Feeding Tube" },
] as const;

// ============================================
// CARE LEVELS
// ============================================

export interface CareLevelOption {
  value: string;
  label: string;
}

/**
 * Care levels for referrals and openings
 * Used for matching clients with appropriate care facilities
 */
export const CARE_LEVELS: readonly CareLevelOption[] = [
  { value: "BASIC", label: "Basic Care" },
  { value: "INTERMEDIATE", label: "Intermediate Care" },
  { value: "INTENSIVE", label: "Intensive Care" },
  { value: "MEMORY_CARE", label: "Memory Care" },
  { value: "RESPITE", label: "Respite Care" },
] as const;

// ============================================
// MOBILITY STATUS / LEVELS
// ============================================

export interface MobilityStatusOption {
  value: string;
  label: string;
}

/**
 * Mobility status options for discharge cases
 * Used to describe patient mobility level
 */
export const MOBILITY_STATUS_OPTIONS: readonly MobilityStatusOption[] = [
  { value: "AMBULATORY", label: "Ambulatory" },
  { value: "WHEELCHAIR", label: "Wheelchair" },
  { value: "BEDBOUND", label: "Bedbound" },
  { value: "ASSISTED_WALKING", label: "Assisted Walking" },
] as const;

// Legacy export for backward compatibility (string array)
export const MOBILITY_LEVELS = [
  "AMBULATORY",
  "WHEELCHAIR",
  "BED_BOUND",
  "TRANSFER_ASSIST",
] as const;

// ============================================
// TRANSPORT TYPES
// ============================================

export interface TransportTypeOption {
  value: string;
  label: string;
}

/**
 * Transport types for discharge cases
 * Types of transportation needed for patient discharge
 */
export const TRANSPORT_TYPES: readonly TransportTypeOption[] = [
  { value: "AMBULANCE", label: "Ambulance" },
  { value: "WHEELCHAIR_VAN", label: "Wheelchair Van" },
  { value: "MEDICAL_TRANSPORT", label: "Medical Transport" },
  { value: "FAMILY_TRANSPORT", label: "Family Transport" },
  { value: "OTHER", label: "Other" },
] as const;

// ============================================
// COGNITIVE STATUS
// ============================================

export interface CognitiveStatusOption {
  value: string;
  label: string;
}

/**
 * Cognitive status options for discharge cases
 * Used to describe patient cognitive state
 */
export const COGNITIVE_STATUS_OPTIONS: readonly CognitiveStatusOption[] = [
  { value: "ALERT", label: "Alert & Oriented" },
  { value: "CONFUSED", label: "Confused" },
  { value: "DEMENTIA", label: "Dementia" },
  { value: "COMA", label: "Coma" },
] as const;

// ============================================
// DME NEEDS (Durable Medical Equipment)
// ============================================

export interface DMENeedOption {
  value: string;
  label: string;
}

/**
 * DME needs for discharge cases
 * Durable medical equipment required by patient
 */
export const DME_NEEDS_OPTIONS: readonly DMENeedOption[] = [
  { value: "WHEELCHAIR", label: "Wheelchair" },
  { value: "WALKER", label: "Walker" },
  { value: "HOSPITAL_BED", label: "Hospital Bed" },
  { value: "OXYGEN", label: "Oxygen Equipment" },
  { value: "CPAP", label: "CPAP Machine" },
  { value: "LIFT", label: "Patient Lift" },
] as const;

// ============================================
// BEHAVIORAL CONCERNS
// ============================================

export interface BehavioralConcernOption {
  value: string;
  label: string;
}

/**
 * Behavioral concerns for discharge cases
 * Behavioral issues that need to be addressed
 */
export const BEHAVIORAL_CONCERNS_OPTIONS: readonly BehavioralConcernOption[] = [
  { value: "WANDERING", label: "Wandering" },
  { value: "AGGRESSION", label: "Aggression" },
  { value: "SELF_HARM", label: "Self-Harm Risk" },
  { value: "ELOPEMENT", label: "Elopement Risk" },
  { value: "SUNDOWNING", label: "Sundowning" },
] as const;

// ============================================
// HOSPITAL LOCATIONS
// ============================================

export interface HospitalLocationOption {
  value: string;
  label: string;
}

/**
 * Hospital locations for discharge cases
 * Locations within hospital where patient is located
 */
export const HOSPITAL_LOCATIONS: readonly HospitalLocationOption[] = [
  { value: "ICU", label: "ICU" },
  { value: "MEDICAL_FLOOR", label: "Medical Floor" },
  { value: "SURGICAL_FLOOR", label: "Surgical Floor" },
  { value: "REHAB", label: "Rehabilitation" },
  { value: "ER", label: "Emergency Room" },
  { value: "OTHER", label: "Other" },
] as const;

// ============================================
// COUNTRIES
// ============================================

export interface Country {
  code: string; // ISO 3166-1 alpha-2 code
  name: string; // Country name
}

/**
 * Complete list of all countries (195 countries)
 * Sorted alphabetically by country name
 * Based on ISO 3166-1 standard
 */
export const COUNTRIES: readonly Country[] = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AS", name: "American Samoa" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AI", name: "Anguilla" },
  { code: "AQ", name: "Antarctica" },
  { code: "AG", name: "Antigua and Barbuda" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AW", name: "Aruba" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BM", name: "Bermuda" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BQ", name: "Bonaire, Sint Eustatius and Saba" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BV", name: "Bouvet Island" },
  { code: "BR", name: "Brazil" },
  { code: "IO", name: "British Indian Ocean Territory" },
  { code: "BN", name: "Brunei Darussalam" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "CV", name: "Cabo Verde" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "KY", name: "Cayman Islands" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CX", name: "Christmas Island" },
  { code: "CC", name: "Cocos (Keeling) Islands" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoros" },
  { code: "CG", name: "Congo" },
  { code: "CD", name: "Congo (the Democratic Republic of the)" },
  { code: "CK", name: "Cook Islands" },
  { code: "CR", name: "Costa Rica" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CW", name: "Curaçao" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czechia" },
  { code: "DK", name: "Denmark" },
  { code: "DJ", name: "Djibouti" },
  { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" },
  { code: "SZ", name: "Eswatini" },
  { code: "ET", name: "Ethiopia" },
  { code: "FK", name: "Falkland Islands (Malvinas)" },
  { code: "FO", name: "Faroe Islands" },
  { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GF", name: "French Guiana" },
  { code: "PF", name: "French Polynesia" },
  { code: "TF", name: "French Southern Territories" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GI", name: "Gibraltar" },
  { code: "GR", name: "Greece" },
  { code: "GL", name: "Greenland" },
  { code: "GD", name: "Grenada" },
  { code: "GP", name: "Guadeloupe" },
  { code: "GU", name: "Guam" },
  { code: "GT", name: "Guatemala" },
  { code: "GG", name: "Guernsey" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haiti" },
  { code: "HM", name: "Heard Island and McDonald Islands" },
  { code: "VA", name: "Holy See" },
  { code: "HN", name: "Honduras" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran (Islamic Republic of)" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IM", name: "Isle of Man" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JE", name: "Jersey" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KI", name: "Kiribati" },
  { code: "KP", name: "Korea (the Democratic People's Republic of)" },
  { code: "KR", name: "Korea (the Republic of)" },
  { code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Lao People's Democratic Republic" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libya" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MO", name: "Macao" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MQ", name: "Martinique" },
  { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauritius" },
  { code: "YT", name: "Mayotte" },
  { code: "MX", name: "Mexico" },
  { code: "FM", name: "Micronesia (Federated States of)" },
  { code: "MD", name: "Moldova (the Republic of)" },
  { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MS", name: "Montserrat" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NC", name: "New Caledonia" },
  { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" },
  { code: "NU", name: "Niue" },
  { code: "NF", name: "Norfolk Island" },
  { code: "MK", name: "North Macedonia" },
  { code: "MP", name: "Northern Mariana Islands" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PW", name: "Palau" },
  { code: "PS", name: "Palestine, State of" },
  { code: "PA", name: "Panama" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PN", name: "Pitcairn" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "PR", name: "Puerto Rico" },
  { code: "QA", name: "Qatar" },
  { code: "RE", name: "Réunion" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russian Federation" },
  { code: "RW", name: "Rwanda" },
  { code: "BL", name: "Saint Barthélemy" },
  { code: "SH", name: "Saint Helena, Ascension and Tristan da Cunha" },
  { code: "KN", name: "Saint Kitts and Nevis" },
  { code: "LC", name: "Saint Lucia" },
  { code: "MF", name: "Saint Martin (French part)" },
  { code: "PM", name: "Saint Pierre and Miquelon" },
  { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "WS", name: "Samoa" },
  { code: "SM", name: "San Marino" },
  { code: "ST", name: "Sao Tome and Principe" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SG", name: "Singapore" },
  { code: "SX", name: "Sint Maarten (Dutch part)" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" },
  { code: "ZA", name: "South Africa" },
  { code: "GS", name: "South Georgia and the South Sandwich Islands" },
  { code: "SS", name: "South Sudan" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" },
  { code: "SR", name: "Suriname" },
  { code: "SJ", name: "Svalbard and Jan Mayen" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syrian Arab Republic" },
  { code: "TW", name: "Taiwan (Province of China)" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania, United Republic of" },
  { code: "TH", name: "Thailand" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TG", name: "Togo" },
  { code: "TK", name: "Tokelau" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Turkey" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TC", name: "Turks and Caicos Islands" },
  { code: "TV", name: "Tuvalu" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom of Great Britain and Northern Ireland" },
  { code: "UM", name: "United States Minor Outlying Islands" },
  { code: "US", name: "United States of America" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VU", name: "Vanuatu" },
  { code: "VE", name: "Venezuela (Bolivarian Republic of)" },
  { code: "VN", name: "Viet Nam" },
  { code: "VG", name: "Virgin Islands (British)" },
  { code: "VI", name: "Virgin Islands (U.S.)" },
  { code: "WF", name: "Wallis and Futuna" },
  { code: "EH", name: "Western Sahara" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
] as const;

// Legacy export for backward compatibility (string array)
export const GENDER_PREFERENCES = [
  "MALE",
  "FEMALE",
  "OTHER",
  "NO_PREFERENCE",
] as const;

// Urgency levels
export const URGENCY_LEVELS = [
  { code: "URGENT", name: "Urgent (< 48 hours)", hours: 48 },
  { code: "HIGH", name: "High (< 1 week)", hours: 168 },
  { code: "ROUTINE", name: "Routine (> 1 week)", hours: 168 * 4 },
] as const;

// User roles
export const USER_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "PROVIDER_OWNER",
  "PROVIDER_STAFF",
  "CASE_MANAGER",
  "HOSPITAL_SW",
  "VRS_SPECIALIST",
  "VENDOR",
  "PUBLIC",
] as const;

// Organization types
export const ORGANIZATION_TYPES = [
  "PROVIDER",
  "CASE_MANAGEMENT",
  "HOSPITAL",
  "VRS",
  "VENDOR",
] as const;

// Subscription tiers
export const SUBSCRIPTION_TIERS = [
  {
    code: "FREE",
    name: "Free",
    price: 0,
    features: ["Basic listing", "1 photo", "10 services"],
  },
  {
    code: "PRO",
    name: "Pro",
    price: 99,
    features: ["Enhanced visibility", "5 photos", "Analytics"],
  },
  {
    code: "PREMIUM",
    name: "Premium",
    price: 199,
    features: ["Maximum boost", "Priority support", "Advanced analytics"],
  },
  {
    code: "ENTERPRISE",
    name: "Enterprise",
    price: 499,
    features: ["Custom features", "Dedicated support", "API access"],
  },
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
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

// File upload limits
export const FILE_LIMITS = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  DOCUMENT_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  ALLOWED_DOCUMENT_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
} as const;

// Rate limits
export const RATE_LIMITS = {
  DEFAULT: { requests: 100, window: "1m" },
  SEARCH: { requests: 30, window: "1m" },
  AI: { requests: 10, window: "1m" },
  AUTH: { requests: 5, window: "15m" },
  UPLOAD: { requests: 20, window: "1h" },
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
  DEFAULT: { open: "08:00", close: "17:00" },
  EMERGENCY: { open: "00:00", close: "23:59" },
} as const;

// Notification channels
export const NOTIFICATION_CHANNELS = [
  "EMAIL",
  "SMS",
  "IN_APP",
  "PUSH",
] as const;

// Audit actions
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: "auth.login",
  LOGOUT: "auth.logout",
  PASSWORD_RESET: "auth.password_reset",

  // PHI Access
  PHI_VIEW: "phi.view",
  PHI_DOWNLOAD: "phi.download",
  PHI_EXPORT: "phi.export",

  // Administrative
  USER_CREATE: "user.create",
  USER_UPDATE: "user.update",
  USER_DELETE: "user.delete",
  ROLE_CHANGE: "role.change",

  // Clinical
  REFERRAL_CREATE: "referral.create",
  PLACEMENT_ACCEPT: "placement.accept",
  DISCHARGE_INITIATE: "discharge.initiate",
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

// ============================================
// AI SEARCH CONSTANTS
// ============================================

/**
 * AI Search rate limit (queries per minute)
 * Used for rate limiting AI search requests
 */
export const AI_SEARCH_RATE_LIMIT = 10; // queries per minute

/**
 * Minimum query length for AI search (characters)
 * Queries shorter than this will use basic keyword matching
 */
export const AI_SEARCH_MIN_QUERY_LENGTH = 10; // minimum characters for AI search

// ============================================
// VEHICLE TYPES (For Transportation Vendors)
// ============================================

export interface VehicleTypeOption {
  value: string;
  label: string;
  description: string;
}

/**
 * Vehicle types for transportation vendors
 * Types of vehicles used for medical transportation
 */
export const VEHICLE_TYPES: readonly VehicleTypeOption[] = [
  {
    value: "AMBULANCE",
    label: "Ambulance",
    description: "Full medical transport ambulance",
  },
  {
    value: "WHEELCHAIR_VAN",
    label: "Wheelchair Van",
    description: "Wheelchair accessible van",
  },
  {
    value: "SEDAN",
    label: "Sedan",
    description: "Standard passenger vehicle",
  },
] as const;

// ============================================
// LEAD SOURCES (For Vendors)
// ============================================

export interface LeadSourceOption {
  value: string;
  label: string;
}

/**
 * Lead sources for vendors
 * Where vendor leads originate from
 */
export const LEAD_SOURCES: readonly LeadSourceOption[] = [
  { value: "MARKETPLACE", label: "Marketplace" },
  { value: "REFERRAL", label: "Referral" },
  { value: "AD", label: "Advertisement" },
] as const;
