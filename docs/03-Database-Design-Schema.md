# CareLinkMN - Database Design & Schema

## Version: 1.0.0
## Date: January 2025
## Status: Ready for Development

---

## Table of Contents
1. [Database Overview](#database-overview)
2. [Schema Design](#schema-design)
3. [Core Tables](#core-tables)
4. [Relationship Models](#relationship-models)
5. [Indexes & Performance](#indexes--performance)
6. [Data Types & Constraints](#data-types--constraints)
7. [Row-Level Security](#row-level-security)
8. [Audit & Compliance](#audit--compliance)
9. [Migration Strategy](#migration-strategy)

---

## Database Overview

### Database Configuration

```sql
-- PostgreSQL 15+ Configuration
-- Database: carelink_production

-- Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Encryption
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Fuzzy text search
CREATE EXTENSION IF NOT EXISTS "postgis";        -- Geospatial data
CREATE EXTENSION IF NOT EXISTS "vector";         -- AI embeddings
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Query performance
CREATE EXTENSION IF NOT EXISTS "btree_gist";     -- Exclusion constraints

-- Configuration Settings
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET effective_cache_size = '12GB';
ALTER SYSTEM SET maintenance_work_mem = '1GB';
ALTER SYSTEM SET work_mem = '50MB';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
```

### Schema Organization

```sql
-- Schema creation
CREATE SCHEMA IF NOT EXISTS auth;       -- Authentication & users
CREATE SCHEMA IF NOT EXISTS core;       -- Core business entities
CREATE SCHEMA IF NOT EXISTS messaging;  -- Messaging system
CREATE SCHEMA IF NOT EXISTS analytics;  -- Analytics & events
CREATE SCHEMA IF NOT EXISTS billing;    -- Billing & subscriptions
CREATE SCHEMA IF NOT EXISTS audit;      -- Audit logs
CREATE SCHEMA IF NOT EXISTS vrs;        -- VRS module
CREATE SCHEMA IF NOT EXISTS marketplace;-- Marketplace vendors
```

---

## Schema Design

### Complete Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions", "multiSchema", "views"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["auth", "core", "messaging", "analytics", "billing", "audit", "vrs", "marketplace"]
}

// ============================================
// AUTH SCHEMA
// ============================================

model User {
  id                String    @id @default(uuid())
  email             String    @unique
  emailVerified     DateTime?
  password          String?   // Hashed
  firstName         String
  lastName          String
  phone             String?
  phoneVerified     DateTime?
  role              UserRole
  status            UserStatus @default(PENDING_VERIFICATION)
  organizationId    String?
  organization      Organization? @relation(fields: [organizationId], references: [id])
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastLoginAt       DateTime?
  passwordChangedAt DateTime?
  
  // Relations
  sessions          Session[]
  auditLogs         AuditLog[]
  notifications     Notification[]
  messages          Message[]
  referrals         Referral[]
  dischargeCases    DischargeCase[]
  consents          Consent[]
  supportTickets    SupportTicket[]
  
  @@index([email])
  @@index([organizationId])
  @@index([role])
  @@schema("auth")
}

enum UserRole {
  SUPER_ADMIN
  ADMIN
  PROVIDER_OWNER
  PROVIDER_STAFF
  CASE_MANAGER
  HOSPITAL_SW
  VRS_SPECIALIST
  VENDOR
  PUBLIC
  
  @@schema("auth")
}

enum UserStatus {
  PENDING_VERIFICATION
  ACTIVE
  SUSPENDED
  DEACTIVATED
  
  @@schema("auth")
}

model Session {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token        String   @unique
  ipAddress    String?
  userAgent    String?
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  
  @@index([userId])
  @@index([token])
  @@schema("auth")
}

model Organization {
  id               String           @id @default(uuid())
  name             String
  type             OrganizationType
  ein              String?          @unique // Employer ID
  npi              String?          @unique // National Provider ID
  status           OrganizationStatus @default(PENDING)
  verifiedAt       DateTime?
  verifiedBy       String?
  
  // Contact Info
  email            String
  phone            String
  fax              String?
  website          String?
  
  // Address
  addressLine1     String
  addressLine2     String?
  city             String
  state            String
  zipCode          String
  county           String
  
  // Settings
  settings         Json             @default("{}")
  
  // Timestamps
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  
  // Relations
  users            User[]
  providers        Provider[]
  caseManagers     CaseManager[]
  hospitalStaff    HospitalStaff[]
  vendors          Vendor[]
  
  @@index([type])
  @@index([status])
  @@schema("auth")
}

enum OrganizationType {
  PROVIDER
  CASE_MANAGEMENT
  HOSPITAL
  VRS
  VENDOR
  
  @@schema("auth")
}

enum OrganizationStatus {
  PENDING
  VERIFIED
  SUSPENDED
  DEACTIVATED
  
  @@schema("auth")
}

// ============================================
// CORE SCHEMA - PROVIDERS
// ============================================

model Provider {
  id                  String    @id @default(uuid())
  organizationId      String
  organization        Organization @relation(fields: [organizationId], references: [id])
  
  // Licensing
  licenses            License[]
  primaryLicenseType  String
  
  // Subscription
  subscriptionTier    SubscriptionTier @default(FREE)
  subscriptionId      String?
  
  // Verification
  verified            Boolean   @default(false)
  verifiedAt          DateTime?
  verificationNotes   String?
  
  // Profile
  description         String?   @db.Text
  logo                String?   // URL
  coverImage          String?   // URL
  
  // Settings
  acceptsReferrals    Boolean   @default(true)
  responseTimeHours   Int?      // Average response time
  
  // Timestamps
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  // Relations
  homes               Home[]
  services            ProviderService[]
  openings            Opening[]
  messages            MessageThread[]
  placements          Placement[]
  analyticsEvents     AnalyticsEvent[]
  
  @@index([organizationId])
  @@index([subscriptionTier])
  @@index([verified])
  @@schema("core")
}

enum SubscriptionTier {
  FREE
  PRO
  PREMIUM
  ENTERPRISE
  
  @@schema("core")
}

model License {
  id               String    @id @default(uuid())
  providerId       String
  provider         Provider  @relation(fields: [providerId], references: [id])
  
  licenseType      String    // e.g., "144D", "245D", "CRS", "ALF"
  licenseNumber    String
  issuingState     String    @default("MN")
  
  issueDate        DateTime
  expirationDate   DateTime
  
  status           LicenseStatus @default(PENDING)
  verifiedAt       DateTime?
  verifiedBy       String?
  
  // Documents
  documentUrl      String?   // Encrypted URL
  
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  @@unique([licenseNumber, issuingState])
  @@index([providerId])
  @@index([expirationDate])
  @@index([status])
  @@schema("core")
}

enum LicenseStatus {
  PENDING
  ACTIVE
  EXPIRED
  SUSPENDED
  REVOKED
  
  @@schema("core")
}

model Home {
  id               String    @id @default(uuid())
  providerId       String
  provider         Provider  @relation(fields: [providerId], references: [id])
  
  // Basic Info
  name             String
  addressLine1     String
  addressLine2     String?
  city             String
  state            String    @default("MN")
  zipCode          String
  county           String
  
  // Geolocation
  latitude         Float
  longitude        Float
  location         Unsupported("geography(POINT, 4326)")?
  
  // Details
  capacity         Int       // Total beds/spots
  currentOccupancy Int       @default(0)
  
  // Features
  wheelchairAccessible Boolean @default(false)
  singleLevel         Boolean @default(false)
  hasElevator         Boolean @default(false)
  hasRollInShower     Boolean @default(false)
  
  // Media
  photos           HomePhoto[]
  virtualTourUrl   String?
  
  // Settings
  acceptingNew     Boolean   @default(true)
  isActive         Boolean   @default(true)
  
  // Timestamps
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  // Relations
  services         HomeService[]
  openings         Opening[]
  amenities        HomeAmenity[]
  
  @@index([providerId])
  @@index([county])
  @@index([zipCode])
  @@index([isActive])
  @@schema("core")
}

model HomePhoto {
  id          String   @id @default(uuid())
  homeId      String
  home        Home     @relation(fields: [homeId], references: [id])
  url         String
  caption     String?
  isPrimary   Boolean  @default(false)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  
  @@index([homeId])
  @@schema("core")
}

// ============================================
// CORE SCHEMA - SERVICES
// ============================================

model Service {
  id                String    @id @default(uuid())
  code              String    @unique // e.g., "ADL_ASSIST"
  name              String
  description       String?
  category          String    // e.g., "Daily Living", "Medical"
  licenseTypes      String[]  // Which licenses can offer this
  
  isActive          Boolean   @default(true)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  providerServices  ProviderService[]
  homeServices      HomeService[]
  
  @@index([category])
  @@index([isActive])
  @@schema("core")
}

model ProviderService {
  id          String    @id @default(uuid())
  providerId  String
  provider    Provider  @relation(fields: [providerId], references: [id])
  serviceId   String
  service     Service   @relation(fields: [serviceId], references: [id])
  
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  
  @@unique([providerId, serviceId])
  @@index([providerId])
  @@index([serviceId])
  @@schema("core")
}

model HomeService {
  id          String    @id @default(uuid())
  homeId      String
  home        Home      @relation(fields: [homeId], references: [id])
  serviceId   String
  service     Service   @relation(fields: [serviceId], references: [id])
  
  isActive    Boolean   @default(true)
  notes       String?
  createdAt   DateTime  @default(now())
  
  @@unique([homeId, serviceId])
  @@index([homeId])
  @@index([serviceId])
  @@schema("core")
}

model HomeAmenity {
  id          String    @id @default(uuid())
  homeId      String
  home        Home      @relation(fields: [homeId], references: [id])
  amenityType String    // e.g., "outdoor_space", "pet_friendly"
  description String?
  
  @@index([homeId])
  @@schema("core")
}

// ============================================
// CORE SCHEMA - OPENINGS
// ============================================

model Opening {
  id                String    @id @default(uuid())
  providerId        String
  provider          Provider  @relation(fields: [providerId], references: [id])
  homeId            String
  home              Home      @relation(fields: [homeId], references: [id])
  
  // Availability
  spotsAvailable    Int
  availableFrom     DateTime
  availableUntil    DateTime?
  
  // Requirements
  ageMin            Int?
  ageMax            Int?
  genderPreference  Gender?
  
  // Care Levels
  careLevels        String[]  // e.g., ["BASIC", "INTENSIVE"]
  supportedNeeds    String[]  // e.g., ["MOBILITY", "MEMORY_CARE"]
  
  // Payers
  acceptedPayers    Payer[]
  privatePayRate    Decimal?  @db.Decimal(10, 2)
  
  // Status
  status            OpeningStatus @default(OPEN)
  freshnessTimestamp DateTime @default(now())
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  placements        Placement[]
  
  @@index([providerId])
  @@index([homeId])
  @@index([status])
  @@index([freshnessTimestamp])
  @@index([acceptedPayers])
  @@schema("core")
}

enum OpeningStatus {
  OPEN
  PENDING
  FILLED
  EXPIRED
  
  @@schema("core")
}

enum Gender {
  MALE
  FEMALE
  OTHER
  NO_PREFERENCE
  
  @@schema("core")
}

enum Payer {
  MA              // Medical Assistance
  MEDICARE
  PRIVATE
  CADI           // Community Access for Disability Inclusion
  BI_TBI         // Brain Injury / Traumatic Brain Injury
  EW             // Elderly Waiver
  DD             // Developmental Disabilities
  
  @@schema("core")
}

// ============================================
// CORE SCHEMA - REFERRALS
// ============================================

model Referral {
  id                String    @id @default(uuid())
  referralNumber    String    @unique @default(cuid())
  
  // Case Manager
  caseManagerId     String
  caseManager       User      @relation(fields: [caseManagerId], references: [id])
  organizationId    String
  
  // Client (De-identified)
  clientAge         Int
  clientGender      Gender
  clientInitials    String    // First + Last initial only
  
  // Needs
  careLevels        String[]
  servicesNeeded    String[]
  mobilityLevel     String?   // e.g., "AMBULATORY", "WHEELCHAIR"
  behavioralNeeds   String[]
  medicalNeeds      String[]
  
  // Preferences
  preferredCounties String[]
  preferredCities   String[]
  maxDistance       Int?      // Miles from preferred location
  
  // Payer
  primaryPayer      Payer
  secondaryPayer    Payer?
  
  // Timeline
  targetMoveDate    DateTime?
  urgency           Urgency   @default(ROUTINE)
  
  // Status
  status            ReferralStatus @default(NEW)
  
  // Notes
  internalNotes     String?   @db.Text
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  placedAt          DateTime?
  closedAt          DateTime?
  
  // Relations
  shortlist         ReferralShortlist[]
  messages          MessageThread[]
  placements        Placement[]
  
  @@index([caseManagerId])
  @@index([status])
  @@index([urgency])
  @@index([primaryPayer])
  @@schema("core")
}

enum Urgency {
  URGENT    // < 48 hours
  HIGH      // < 1 week
  ROUTINE   // > 1 week
  
  @@schema("core")
}

enum ReferralStatus {
  NEW
  IN_REVIEW
  TOURING
  OFFER_MADE
  PLACED
  CLOSED
  CANCELLED
  
  @@schema("core")
}

model ReferralShortlist {
  id            String    @id @default(uuid())
  referralId    String
  referral      Referral  @relation(fields: [referralId], references: [id])
  providerId    String
  
  status        ShortlistStatus @default(ADDED)
  addedAt       DateTime  @default(now())
  contactedAt   DateTime?
  respondedAt   DateTime?
  
  notes         String?
  
  @@unique([referralId, providerId])
  @@index([referralId])
  @@index([status])
  @@schema("core")
}

enum ShortlistStatus {
  ADDED
  CONTACTED
  RESPONDED
  TOURING
  DECLINED
  
  @@schema("core")
}

// ============================================
// CORE SCHEMA - HOSPITAL DISCHARGE
// ============================================

model DischargeCase {
  id                  String    @id @default(uuid())
  caseNumber          String    @unique @default(cuid())
  
  // Hospital & Social Worker
  hospitalId          String
  socialWorkerId      String
  socialWorker        User      @relation(fields: [socialWorkerId], references: [id])
  
  // Patient (Minimal PHI)
  patientInitials     String
  patientAge          Int
  patientGender       Gender
  
  // Medical
  diagnosisCodes      String[]  // ICD-10 codes
  mobilityStatus      String
  cognitiveStatus     String?
  behavioralConcerns  String[]
  
  // Equipment Needs
  dmeNeeds            String[]  // Durable Medical Equipment
  medicationManagement Boolean
  
  // Discharge Planning
  currentLocation     String    // e.g., "ICU", "Medical Floor"
  targetDischargeDate DateTime
  actualDischargeDate DateTime?
  
  // Geography
  preferredCounties   String[]
  preferredCities     String[]
  requiresProximity   Boolean   @default(false)
  proximityZipCode    String?
  maxDistanceMiles    Int?
  
  // Payer
  primaryInsurance    Payer
  secondaryInsurance  Payer?
  
  // Status
  status              DischargeStatus @default(INTAKE)
  
  // Transport
  needsTransport      Boolean   @default(false)
  transportType       String?   // e.g., "AMBULANCE", "WHEELCHAIR_VAN"
  
  // Timestamps
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  matchedAt           DateTime?
  invitesSentAt       DateTime?
  placedAt            DateTime?
  
  // Relations
  invitations         DischargeInvitation[]
  messages            MessageThread[]
  placement           Placement?
  transportBooking    TransportBooking?
  checklist           DischargeChecklist?
  consent             Consent?
  
  @@index([hospitalId])
  @@index([socialWorkerId])
  @@index([status])
  @@index([targetDischargeDate])
  @@schema("core")
}

enum DischargeStatus {
  INTAKE
  MATCHING
  INVITES_SENT
  RESPONSES_PENDING
  PLACEMENT_CONFIRMED
  DISCHARGED
  FOLLOW_UP
  COMPLETED
  CANCELLED
  
  @@schema("core")
}

model DischargeInvitation {
  id                String    @id @default(uuid())
  dischargeCaseId   String
  dischargeCase     DischargeCase @relation(fields: [dischargeCaseId], references: [id])
  providerId        String
  
  invitedAt         DateTime  @default(now())
  expiresAt         DateTime
  respondedAt       DateTime?
  
  response          InviteResponse?
  responseNotes     String?
  
  reminderSentAt    DateTime?
  escalatedAt       DateTime?
  
  @@index([dischargeCaseId])
  @@index([providerId])
  @@index([expiresAt])
  @@schema("core")
}

enum InviteResponse {
  ACCEPTED
  DECLINED
  NO_AVAILABILITY
  
  @@schema("core")
}

model DischargeChecklist {
  id                String    @id @default(uuid())
  dischargeCaseId   String    @unique
  dischargeCase     DischargeCase @relation(fields: [dischargeCaseId], references: [id])
  
  // Pre-discharge
  consentObtained   Boolean   @default(false)
  insuranceVerified Boolean   @default(false)
  medsReconciled    Boolean   @default(false)
  equipmentOrdered  Boolean   @default(false)
  transportArranged Boolean   @default(false)
  
  // During discharge
  patientEducated   Boolean   @default(false)
  documentsSent     Boolean   @default(false)
  followUpScheduled Boolean   @default(false)
  
  // Post-discharge
  day1Contact       Boolean   @default(false)
  day2Contact       Boolean   @default(false)
  day7Contact       Boolean   @default(false)
  day30Contact      Boolean   @default(false)
  
  updatedAt         DateTime  @updatedAt
  
  @@schema("core")
}

// ============================================
// CORE SCHEMA - PLACEMENTS
// ============================================

model Placement {
  id                String    @id @default(uuid())
  
  // References
  referralId        String?
  referral          Referral? @relation(fields: [referralId], references: [id])
  dischargeCaseId   String?   @unique
  dischargeCase     DischargeCase? @relation(fields: [dischargeCaseId], references: [id])
  
  providerId        String
  provider          Provider  @relation(fields: [providerId], references: [id])
  openingId         String
  opening           Opening   @relation(fields: [openingId], references: [id])
  
  // Details
  placementDate     DateTime
  moveInDate        DateTime?
  
  // Status
  status            PlacementStatus @default(PENDING)
  
  // Packet
  packetGeneratedAt DateTime?
  packetUrl         String?   // Signed URL with TTL
  packetAccessLog   PacketAccessLog[]
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  confirmedAt       DateTime?
  completedAt       DateTime?
  
  @@index([referralId])
  @@index([dischargeCaseId])
  @@index([providerId])
  @@index([status])
  @@schema("core")
}

enum PlacementStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  
  @@schema("core")
}

model PacketAccessLog {
  id            String    @id @default(uuid())
  placementId   String
  placement     Placement @relation(fields: [placementId], references: [id])
  
  accessedBy    String    // User ID
  accessedAt    DateTime  @default(now())
  ipAddress     String
  userAgent     String?
  
  @@index([placementId])
  @@index([accessedBy])
  @@schema("audit")
}

// ============================================
// MESSAGING SCHEMA
// ============================================

model MessageThread {
  id                String    @id @default(uuid())
  
  // Context
  referralId        String?
  referral          Referral? @relation(fields: [referralId], references: [id])
  dischargeCaseId   String?
  dischargeCase     DischargeCase? @relation(fields: [dischargeCaseId], references: [id])
  
  // Participants
  providerId        String
  provider          Provider  @relation(fields: [providerId], references: [id])
  initiatorId       String
  
  // Status
  status            ThreadStatus @default(OPEN)
  
  // SLA Tracking
  firstResponseAt   DateTime?
  avgResponseTime   Int?      // In minutes
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastMessageAt     DateTime?
  closedAt          DateTime?
  
  // Relations
  messages          Message[]
  
  @@index([referralId])
  @@index([dischargeCaseId])
  @@index([providerId])
  @@index([status])
  @@schema("messaging")
}

enum ThreadStatus {
  OPEN
  AWAITING_RESPONSE
  RESOLVED
  CLOSED
  
  @@schema("messaging")
}

model Message {
  id            String    @id @default(uuid())
  threadId      String
  thread        MessageThread @relation(fields: [threadId], references: [id])
  
  senderId      String
  sender        User      @relation(fields: [senderId], references: [id])
  
  content       String    @db.Text
  
  // Attachments
  attachments   MessageAttachment[]
  
  // Read receipts
  isRead        Boolean   @default(false)
  readAt        DateTime?
  
  // Timestamps
  createdAt     DateTime  @default(now())
  editedAt      DateTime?
  
  @@index([threadId])
  @@index([senderId])
  @@schema("messaging")
}

model MessageAttachment {
  id            String    @id @default(uuid())
  messageId     String
  message       Message   @relation(fields: [messageId], references: [id])
  
  fileName      String
  fileType      String
  fileSize      Int       // In bytes
  url           String    // Signed URL
  
  createdAt     DateTime  @default(now())
  
  @@index([messageId])
  @@schema("messaging")
}

model Notification {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  
  type          NotificationType
  title         String
  message       String
  
  // Delivery
  channels      String[]  // ["EMAIL", "SMS", "IN_APP"]
  
  // Status
  isRead        Boolean   @default(false)
  readAt        DateTime?
  
  // Email/SMS status
  emailSentAt   DateTime?
  smsSentAt     DateTime?
  
  // Deep linking
  actionUrl     String?
  
  createdAt     DateTime  @default(now())
  
  @@index([userId])
  @@index([isRead])
  @@index([type])
  @@schema("messaging")
}

enum NotificationType {
  REFERRAL_NEW
  REFERRAL_UPDATE
  MESSAGE_NEW
  PLACEMENT_CONFIRMED
  LICENSE_EXPIRING
  OPENING_EXPIRING
  INVITE_RECEIVED
  INVITE_EXPIRING
  
  @@schema("messaging")
}

// ============================================
// ANALYTICS SCHEMA
// ============================================

model AnalyticsEvent {
  id            String    @id @default(uuid())
  
  eventType     EventType
  userId        String?
  sessionId     String?
  
  // Context
  providerId    String?
  provider      Provider? @relation(fields: [providerId], references: [id])
  referralId    String?
  
  // Event Data
  eventData     Json      @default("{}")
  
  // User Info
  ipAddress     String?
  userAgent     String?
  referer       String?
  
  // Location
  country       String?
  region        String?
  city          String?
  
  createdAt     DateTime  @default(now())
  
  @@index([eventType])
  @@index([userId])
  @@index([providerId])
  @@index([createdAt])
  @@schema("analytics")
}

enum EventType {
  // Search events
  SEARCH_PERFORMED
  SEARCH_FILTER_APPLIED
  
  // Provider events
  PROVIDER_VIEWED
  PROVIDER_CONTACTED
  PROVIDER_FAVORITED
  
  // Referral events
  REFERRAL_CREATED
  REFERRAL_SHORTLIST_ADDED
  REFERRAL_MESSAGE_SENT
  
  // Placement events
  PLACEMENT_INITIATED
  PLACEMENT_CONFIRMED
  PLACEMENT_COMPLETED
  
  // User events
  USER_REGISTERED
  USER_LOGIN
  USER_LOGOUT
  
  @@schema("analytics")
}

// ============================================
// BILLING SCHEMA
// ============================================

model Subscription {
  id                String    @id @default(uuid())
  
  // Stripe
  stripeCustomerId  String
  stripeSubscriptionId String @unique
  
  // Owner
  organizationId    String
  
  // Plan
  productType       ProductType
  tier              SubscriptionTier
  
  // Status
  status            SubscriptionStatus
  
  // Billing
  currentPeriodStart DateTime
  currentPeriodEnd  DateTime
  cancelAt          DateTime?
  canceledAt        DateTime?
  
  // Usage
  seatsIncluded     Int       @default(1)
  seatsUsed         Int       @default(0)
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  invoices          Invoice[]
  
  @@index([organizationId])
  @@index([status])
  @@schema("billing")
}

enum ProductType {
  PROVIDER_SUBSCRIPTION
  CAREBOT_PRO
  ENTERPRISE_FEATURES
  
  @@schema("billing")
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELLED
  UNPAID
  
  @@schema("billing")
}

model Invoice {
  id                String    @id @default(uuid())
  subscriptionId    String
  subscription      Subscription @relation(fields: [subscriptionId], references: [id])
  
  stripeInvoiceId   String    @unique
  
  amountDue         Decimal   @db.Decimal(10, 2)
  amountPaid        Decimal   @db.Decimal(10, 2)
  currency          String    @default("usd")
  
  status            InvoiceStatus
  
  billingPeriodStart DateTime
  billingPeriodEnd  DateTime
  
  dueDate           DateTime?
  paidAt            DateTime?
  
  invoiceUrl        String?
  
  createdAt         DateTime  @default(now())
  
  @@index([subscriptionId])
  @@index([status])
  @@schema("billing")
}

enum InvoiceStatus {
  DRAFT
  OPEN
  PAID
  VOID
  UNCOLLECTIBLE
  
  @@schema("billing")
}

// ============================================
// VRS SCHEMA
// ============================================

model VRSClient {
  id                String    @id @default(uuid())
  
  // Demographics
  firstName         String
  lastName          String
  dateOfBirth       DateTime
  
  // Contact (encrypted)
  email             String?   // Encrypted
  phone             String?   // Encrypted
  
  // VRS Details
  eligibilityType   String    // e.g., "DISABILITY", "VETERAN"
  servicesNeeded    String[]
  
  // Employment
  workHistory       Json      @default("[]")
  skills            String[]
  interests         String[]
  
  // Status
  status            VRSClientStatus @default(INTAKE)
  
  // Case Management
  assignedSpecialistId String?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  placements        VRSPlacement[]
  
  @@schema("vrs")
}

enum VRSClientStatus {
  INTAKE
  ASSESSMENT
  JOB_READY
  JOB_SEARCHING
  PLACED
  FOLLOW_UP
  CLOSED
  
  @@schema("vrs")
}

model VRSEmployer {
  id                String    @id @default(uuid())
  
  companyName       String
  industry          String
  size              String    // e.g., "1-50", "51-200"
  
  // Contact
  contactName       String
  contactEmail      String
  contactPhone      String
  
  // Address
  addressLine1      String
  addressLine2      String?
  city              String
  state             String
  zipCode           String
  
  // Features
  isInclusive       Boolean   @default(false)
  hasAccessibility  Boolean   @default(false)
  
  // Sponsorship
  isSponsoredListing Boolean  @default(false)
  sponsorshipExpiry DateTime?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  jobs              VRSJob[]
  
  @@index([isSponsoredListing])
  @@schema("vrs")
}

model VRSJob {
  id                String    @id @default(uuid())
  employerId        String
  employer          VRSEmployer @relation(fields: [employerId], references: [id])
  
  title             String
  description       String    @db.Text
  
  // Details
  employmentType    String    // "FULL_TIME", "PART_TIME", "CONTRACT"
  schedule          String[]  // ["WEEKDAYS", "EVENINGS"]
  wage              Decimal   @db.Decimal(10, 2)
  wageType          String    // "HOURLY", "SALARY"
  
  // Requirements
  requirements      String[]
  preferredSkills   String[]
  
  // Location
  isRemote          Boolean   @default(false)
  location          String?
  
  // Status
  status            JobStatus @default(OPEN)
  
  postedAt          DateTime  @default(now())
  expiresAt         DateTime?
  
  // Relations
  placements        VRSPlacement[]
  
  @@index([employerId])
  @@index([status])
  @@schema("vrs")
}

enum JobStatus {
  DRAFT
  OPEN
  FILLED
  CLOSED
  
  @@schema("vrs")
}

model VRSPlacement {
  id                String    @id @default(uuid())
  
  clientId          String
  client            VRSClient @relation(fields: [clientId], references: [id])
  jobId             String
  job               VRSJob    @relation(fields: [jobId], references: [id])
  
  placementDate     DateTime
  startDate         DateTime?
  
  // Retention tracking
  day30Status       RetentionStatus?
  day60Status       RetentionStatus?
  day90Status       RetentionStatus?
  
  endDate           DateTime?
  endReason         String?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([clientId])
  @@index([jobId])
  @@schema("vrs")
}

enum RetentionStatus {
  RETAINED
  NOT_RETAINED
  PENDING
  
  @@schema("vrs")
}

// ============================================
// MARKETPLACE SCHEMA
// ============================================

model Vendor {
  id                String    @id @default(uuid())
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])
  
  // Category
  category          VendorCategory
  subcategories     String[]
  
  // Profile
  businessName      String
  description       String    @db.Text
  logo              String?
  
  // Services
  services          String[]
  serviceAreas      String[]  // Counties/Cities served
  
  // Sponsorship
  isSponsoredVendor Boolean   @default(false)
  sponsorshipTier   String?   // "BASIC", "PREMIUM"
  sponsorshipExpiry DateTime?
  
  // Ratings
  averageRating     Decimal?  @db.Decimal(2, 1)
  reviewCount       Int       @default(0)
  
  // Verification
  isVerified        Boolean   @default(false)
  verifiedAt        DateTime?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  transportBookings TransportBooking[]
  leads             VendorLead[]
  
  @@index([category])
  @@index([isSponsoredVendor])
  @@schema("marketplace")
}

enum VendorCategory {
  TRAINING
  DME              // Durable Medical Equipment
  HOME_MODS
  LEGAL
  STAFFING
  TRANSPORT        // NEMT providers
  
  @@schema("marketplace")
}

model TransportBooking {
  id                String    @id @default(uuid())
  
  dischargeCaseId   String    @unique
  dischargeCase     DischargeCase @relation(fields: [dischargeCaseId], references: [id])
  
  vendorId          String
  vendor            Vendor    @relation(fields: [vendorId], references: [id])
  
  // Trip Details
  pickupAddress     String
  pickupTime        DateTime
  dropoffAddress    String
  
  // Requirements
  vehicleType       String    // "AMBULANCE", "WHEELCHAIR_VAN", "SEDAN"
  equipmentNeeded   String[]
  attendantRequired Boolean   @default(false)
  
  // Status
  status            BookingStatus @default(PENDING)
  
  // Billing
  estimatedCost     Decimal?  @db.Decimal(10, 2)
  actualCost        Decimal?  @db.Decimal(10, 2)
  payerType         Payer
  
  // Confirmation
  confirmationNumber String?
  driverName        String?
  driverPhone       String?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  completedAt       DateTime?
  
  @@index([vendorId])
  @@index([status])
  @@schema("marketplace")
}

enum BookingStatus {
  PENDING
  CONFIRMED
  IN_TRANSIT
  COMPLETED
  CANCELLED
  
  @@schema("marketplace")
}

model VendorLead {
  id                String    @id @default(uuid())
  vendorId          String
  vendor            Vendor    @relation(fields: [vendorId], references: [id])
  
  // Lead Info
  name              String
  email             String
  phone             String?
  
  // Interest
  servicesInterested String[]
  message           String?   @db.Text
  
  // Source
  source            String    // "MARKETPLACE", "REFERRAL", "AD"
  
  // Status
  status            LeadStatus @default(NEW)
  
  createdAt         DateTime  @default(now())
  contactedAt       DateTime?
  convertedAt       DateTime?
  
  @@index([vendorId])
  @@index([status])
  @@schema("marketplace")
}

enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  CONVERTED
  LOST
  
  @@schema("marketplace")
}

// ============================================
// AUDIT & COMPLIANCE SCHEMA
// ============================================

model AuditLog {
  id                String    @id @default(uuid())
  
  // Actor
  userId            String?
  user              User?     @relation(fields: [userId], references: [id])
  
  // Action
  action            String    // e.g., "user.login", "phi.access"
  resourceType      String    // e.g., "User", "DischargeCase"
  resourceId        String?
  
  // Details
  metadata          Json      @default("{}")
  
  // Request Info
  ipAddress         String?
  userAgent         String?
  
  // Result
  result            AuditResult
  errorMessage      String?
  
  timestamp         DateTime  @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([resourceType])
  @@index([timestamp])
  @@schema("audit")
}

enum AuditResult {
  SUCCESS
  FAILURE
  ERROR
  
  @@schema("audit")
}

model Consent {
  id                String    @id @default(uuid())
  
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  
  // Context
  referralId        String?
  dischargeCaseId   String?   @unique
  dischargeCase     DischargeCase? @relation(fields: [dischargeCaseId], references: [id])
  
  // Consent Details
  consentType       ConsentType
  consentVersion    String    // Version of consent form
  
  // Capture Method
  captureMethod     CaptureMethod
  witnessName       String?   // For verbal consent
  witnessTitle      String?
  
  // Signature
  signatureData     String?   // Base64 encoded signature
  
  // Status
  isActive          Boolean   @default(true)
  revokedAt         DateTime?
  revokedReason     String?
  
  // Timestamps
  consentedAt       DateTime  @default(now())
  expiresAt         DateTime?
  
  @@index([userId])
  @@index([consentType])
  @@index([isActive])
  @@schema("audit")
}

enum ConsentType {
  REFERRAL
  DISCHARGE
  PHI_RELEASE
  MARKETING
  
  @@schema("audit")
}

enum CaptureMethod {
  ELECTRONIC_SIGNATURE
  VERBAL_WITH_WITNESS
  WRITTEN_SCAN
  
  @@schema("audit")
}

model SupportTicket {
  id                String    @id @default(uuid())
  
  // Requester
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  userRole          UserRole
  
  // Context
  currentUrl        String?
  referralId        String?
  dischargeCaseId   String?
  
  // Issue
  category          String    // "TECHNICAL", "BILLING", "COMPLIANCE"
  subject           String
  description       String    @db.Text
  
  // Priority
  priority          TicketPriority @default(MEDIUM)
  
  // Status
  status            TicketStatus @default(OPEN)
  
  // Assignment
  assignedTo        String?
  
  // Resolution
  resolution        String?   @db.Text
  resolvedAt        DateTime?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([userId])
  @@index([status])
  @@index([priority])
  @@schema("audit")
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
  
  @@schema("audit")
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  WAITING_ON_USER
  RESOLVED
  CLOSED
  
  @@schema("audit")
}
```

---

## Core Tables

### Key Entity Relationships

```sql
-- Entity Relationship Summary
/*
Organization (1) ─── (N) Users
Organization (1) ─── (N) Providers
Provider (1) ─── (N) Homes
Provider (1) ─── (N) Licenses
Provider (1) ─── (N) Services (through ProviderService)
Home (1) ─── (N) Services (through HomeService)
Home (1) ─── (N) Openings
Opening (1) ─── (N) Placements
Referral (1) ─── (N) Shortlist Items
Referral (1) ─── (N) Message Threads
Referral (1) ─── (1) Placement
DischargeCase (1) ─── (N) Invitations
DischargeCase (1) ─── (1) Placement
DischargeCase (1) ─── (1) Transport Booking
User (1) ─── (N) Audit Logs
*/
```

---

## Indexes & Performance

### Critical Indexes for Performance

```sql
-- Search Performance Indexes
CREATE INDEX idx_homes_search 
ON core.homes(county, city, zip_code, is_active) 
WHERE is_active = true;

CREATE INDEX idx_openings_fresh 
ON core.openings(freshness_timestamp, status) 
WHERE status = 'OPEN' AND freshness_timestamp > NOW() - INTERVAL '48 hours';

-- Full-text Search
CREATE INDEX idx_services_fts 
ON core.services 
USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Geospatial Index
CREATE INDEX idx_homes_location 
ON core.homes 
USING gist(location);

-- Payer Search (using GIN for array)
CREATE INDEX idx_openings_payers 
ON core.openings 
USING gin(accepted_payers);

-- Analytics Performance
CREATE INDEX idx_analytics_composite 
ON analytics.analytics_events(event_type, created_at, provider_id) 
WHERE provider_id IS NOT NULL;

-- Message Threading
CREATE INDEX idx_messages_thread_unread 
ON messaging.messages(thread_id, is_read, created_at) 
WHERE is_read = false;

-- Audit Trail
CREATE INDEX idx_audit_user_action 
ON audit.audit_logs(user_id, action, timestamp DESC);
```

---

## Data Types & Constraints

### Custom Domain Types

```sql
-- Email validation
CREATE DOMAIN email AS TEXT
CHECK (VALUE ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- Phone number (US format)
CREATE DOMAIN phone AS TEXT
CHECK (VALUE ~ '^\+?1?\d{10,14}$');

-- ZIP code
CREATE DOMAIN zip_code AS TEXT
CHECK (VALUE ~ '^\d{5}(-\d{4})?$');

-- Positive decimal
CREATE DOMAIN positive_decimal AS DECIMAL(10,2)
CHECK (VALUE >= 0);

-- URL validation
CREATE DOMAIN url AS TEXT
CHECK (VALUE ~* '^https?://[^\s/$.?#].[^\s]*$');
```

### Check Constraints

```sql
-- Ensure opening dates are logical
ALTER TABLE core.openings
ADD CONSTRAINT chk_opening_dates 
CHECK (available_from <= COALESCE(available_until, available_from + INTERVAL '1 year'));

-- Ensure age ranges are valid
ALTER TABLE core.openings
ADD CONSTRAINT chk_age_range 
CHECK (COALESCE(age_min, 0) <= COALESCE(age_max, 150));

-- Ensure capacity is positive
ALTER TABLE core.homes
ADD CONSTRAINT chk_capacity 
CHECK (capacity > 0 AND current_occupancy >= 0 AND current_occupancy <= capacity);

-- Ensure subscription dates are valid
ALTER TABLE billing.subscriptions
ADD CONSTRAINT chk_subscription_period 
CHECK (current_period_start < current_period_end);
```

---

## Row-Level Security

### RLS Policies

```sql
-- Enable RLS on all tables
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging.messages ENABLE ROW LEVEL SECURITY;

-- User table policies
CREATE POLICY users_select ON auth.users
FOR SELECT USING (
  id = current_user_id() OR
  organization_id IN (
    SELECT organization_id FROM auth.users WHERE id = current_user_id()
  ) OR
  current_user_role() IN ('ADMIN', 'SUPER_ADMIN')
);

-- Provider visibility
CREATE POLICY providers_public_select ON core.providers
FOR SELECT USING (
  verified = true OR
  organization_id IN (
    SELECT organization_id FROM auth.users WHERE id = current_user_id()
  ) OR
  current_user_role() IN ('ADMIN', 'SUPER_ADMIN')
);

-- Referral access control
CREATE POLICY referrals_access ON core.referrals
FOR ALL USING (
  case_manager_id = current_user_id() OR
  organization_id IN (
    SELECT organization_id FROM auth.users WHERE id = current_user_id()
  ) OR
  id IN (
    SELECT referral_id FROM messaging.message_threads 
    WHERE provider_id IN (
      SELECT id FROM core.providers 
      WHERE organization_id = current_user_organization()
    )
  ) OR
  current_user_role() IN ('ADMIN', 'SUPER_ADMIN')
);

-- Message thread privacy
CREATE POLICY messages_thread_access ON messaging.messages
FOR ALL USING (
  thread_id IN (
    SELECT id FROM messaging.message_threads
    WHERE 
      initiator_id = current_user_id() OR
      provider_id IN (
        SELECT id FROM core.providers 
        WHERE organization_id = current_user_organization()
      )
  ) OR
  current_user_role() IN ('ADMIN', 'SUPER_ADMIN')
);
```

### Helper Functions for RLS

```sql
-- Get current user ID from session
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_user_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_role', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'PUBLIC';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user organization
CREATE OR REPLACE FUNCTION current_user_organization()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_organization_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Audit & Compliance

### Audit Triggers

```sql
-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit.log_change()
RETURNS TRIGGER AS $$
DECLARE
  audit_row audit.audit_logs;
BEGIN
  audit_row.user_id := current_user_id();
  audit_row.action := TG_OP || '.' || TG_TABLE_NAME;
  audit_row.resource_type := TG_TABLE_NAME;
  audit_row.timestamp := NOW();
  
  IF TG_OP = 'DELETE' THEN
    audit_row.resource_id := OLD.id;
    audit_row.metadata := to_jsonb(OLD);
  ELSE
    audit_row.resource_id := NEW.id;
    audit_row.metadata := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW),
      'changed_fields', (
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_each(to_jsonb(NEW))
        WHERE to_jsonb(NEW) -> key IS DISTINCT FROM to_jsonb(OLD) -> key
      )
    );
  END IF;
  
  INSERT INTO audit.audit_logs VALUES (audit_row.*);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_users
AFTER INSERT OR UPDATE OR DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

CREATE TRIGGER audit_referrals
AFTER INSERT OR UPDATE OR DELETE ON core.referrals
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

CREATE TRIGGER audit_discharge_cases
AFTER INSERT OR UPDATE OR DELETE ON core.discharge_cases
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

CREATE TRIGGER audit_placements
AFTER INSERT OR UPDATE OR DELETE ON core.placements
FOR EACH ROW EXECUTE FUNCTION audit.log_change();

CREATE TRIGGER audit_consents
AFTER INSERT OR UPDATE OR DELETE ON audit.consents
FOR EACH ROW EXECUTE FUNCTION audit.log_change();
```

### PHI Access Logging

```sql
-- Log all PHI access
CREATE OR REPLACE FUNCTION audit.log_phi_access(
  p_resource_type TEXT,
  p_resource_id UUID,
  p_action TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    metadata,
    ip_address,
    user_agent,
    result,
    timestamp
  ) VALUES (
    current_user_id(),
    'phi.' || p_action,
    p_resource_type,
    p_resource_id,
    jsonb_build_object(
      'accessed_at', NOW(),
      'session_id', current_setting('app.session_id', true)
    ),
    current_setting('app.client_ip', true),
    current_setting('app.user_agent', true),
    'SUCCESS',
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Migration Strategy

### Initial Schema Creation

```sql
-- Migration: 001_initial_schema.sql
BEGIN;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS messaging;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS billing;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS vrs;
CREATE SCHEMA IF NOT EXISTS marketplace;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create tables (in dependency order)
-- ... (include all CREATE TABLE statements)

-- Create indexes
-- ... (include all CREATE INDEX statements)

-- Enable RLS
-- ... (include all RLS policies)

-- Create triggers
-- ... (include all trigger definitions)

COMMIT;
```

### Seed Data

```sql
-- Migration: 002_seed_data.sql
BEGIN;

-- Seed Minnesota counties
INSERT INTO core.counties (name, code) VALUES
('Hennepin', '053'),
('Ramsey', '123'),
('Dakota', '037'),
-- ... (all 87 counties)
;

-- Seed service categories
INSERT INTO core.services (code, name, category, license_types) VALUES
('ADL_BASIC', 'Activities of Daily Living - Basic', 'Daily Living', ARRAY['144D', '245D']),
('ADL_INTENSIVE', 'Activities of Daily Living - Intensive', 'Daily Living', ARRAY['245D']),
('MED_MGMT', 'Medication Management', 'Medical', ARRAY['144D', '245D', 'ALF']),
-- ... (complete service list)
;

-- Seed license types
INSERT INTO core.license_types (code, name, category) VALUES
('144D', 'Assisted Living - Dementia Care', 'Assisted Living'),
('245D_BASIC', '245D Basic', 'Community Residential'),
('245D_INTENSIVE', '245D Intensive', 'Community Residential'),
-- ... (all license types)
;

COMMIT;
```

### Version Control

```typescript
// package.json scripts
{
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:reset": "prisma migrate reset",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio"
  }
}
```

---

## Performance Optimization

### Query Optimization

```sql
-- Materialized view for provider analytics
CREATE MATERIALIZED VIEW analytics.provider_metrics AS
WITH base_metrics AS (
  SELECT 
    p.id as provider_id,
    COUNT(DISTINCT ae.id) FILTER (WHERE ae.event_type = 'PROVIDER_VIEWED') as total_views,
    COUNT(DISTINCT ae.id) FILTER (WHERE ae.event_type = 'PROVIDER_CONTACTED') as total_contacts,
    COUNT(DISTINCT pl.id) as total_placements,
    AVG(EXTRACT(EPOCH FROM (pl.confirmed_at - pl.created_at))/3600)::numeric(10,2) as avg_hours_to_confirm,
    COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'OPEN') as open_spots,
    COUNT(DISTINCT h.id) as total_homes
  FROM core.providers p
  LEFT JOIN analytics.analytics_events ae ON ae.provider_id = p.id
  LEFT JOIN core.placements pl ON pl.provider_id = p.id
  LEFT JOIN core.openings o ON o.provider_id = p.id
  LEFT JOIN core.homes h ON h.provider_id = p.id
  GROUP BY p.id
)
SELECT 
  bm.*,
  CASE 
    WHEN total_views > 0 THEN (total_contacts::float / total_views * 100)::numeric(5,2)
    ELSE 0
  END as contact_rate,
  CASE
    WHEN total_contacts > 0 THEN (total_placements::float / total_contacts * 100)::numeric(5,2)
    ELSE 0
  END as conversion_rate
FROM base_metrics bm;

CREATE UNIQUE INDEX idx_provider_metrics_id ON analytics.provider_metrics(provider_id);

-- Refresh strategy
CREATE OR REPLACE FUNCTION analytics.refresh_provider_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.provider_metrics;
END;
$$ LANGUAGE plpgsql;
```

### Partitioning Strategy

```sql
-- Partition large tables by date
CREATE TABLE analytics.analytics_events_2025_01 PARTITION OF analytics.analytics_events
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE analytics.analytics_events_2025_02 PARTITION OF analytics.analytics_events
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Automated partition creation
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
  start_date date;
  end_date date;
  partition_name text;
BEGIN
  start_date := date_trunc('month', CURRENT_DATE + interval '1 month');
  end_date := start_date + interval '1 month';
  partition_name := 'analytics_events_' || to_char(start_date, 'YYYY_MM');
  
  EXECUTE format('CREATE TABLE IF NOT EXISTS analytics.%I PARTITION OF analytics.analytics_events FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    start_date,
    end_date
  );
END;
$$ LANGUAGE plpgsql;
```

---

## Backup & Recovery

### Backup Strategy

```bash
#!/bin/bash
# backup.sh

# Daily backup with point-in-time recovery
pg_dump -h $DB_HOST -U $DB_USER -d carelink_production \
  --format=custom \
  --verbose \
  --file="backup_$(date +%Y%m%d_%H%M%S).dump"

# Archive to S3
aws s3 cp backup_*.dump s3://carelink-backups/daily/ --storage-class GLACIER

# Keep 30 days of daily backups, 12 months of monthly backups
```

### Recovery Procedures

```sql
-- Point-in-time recovery
pg_restore -h $DB_HOST -U $DB_USER -d carelink_recovery \
  --verbose \
  --clean \
  --if-exists \
  backup_20250115_120000.dump

-- Verify data integrity
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

This completes the comprehensive database design document with full schema definitions, relationships, performance optimizations, and security measures.
