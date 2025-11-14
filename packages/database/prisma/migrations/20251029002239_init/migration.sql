-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "analytics";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "audit";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "billing";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "core";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "marketplace";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "messaging";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "vrs";

-- CreateEnum
CREATE TYPE "auth"."UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PROVIDER_OWNER', 'PROVIDER_STAFF', 'CASE_MANAGER', 'HOSPITAL_SW', 'VRS_SPECIALIST', 'VENDOR', 'PUBLIC');

-- CreateEnum
CREATE TYPE "auth"."UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "auth"."OrganizationType" AS ENUM ('PROVIDER', 'CASE_MANAGEMENT', 'HOSPITAL', 'VRS', 'VENDOR');

-- CreateEnum
CREATE TYPE "auth"."OrganizationStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "core"."SubscriptionTier" AS ENUM ('FREE', 'PRO', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "core"."LicenseStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "core"."OpeningStatus" AS ENUM ('OPEN', 'PENDING', 'FILLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "core"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'NO_PREFERENCE');

-- CreateEnum
CREATE TYPE "core"."Payer" AS ENUM ('MA', 'MEDICARE', 'PRIVATE', 'CADI', 'BI_TBI', 'EW', 'DD');

-- CreateEnum
CREATE TYPE "core"."Urgency" AS ENUM ('URGENT', 'HIGH', 'ROUTINE');

-- CreateEnum
CREATE TYPE "core"."ReferralStatus" AS ENUM ('NEW', 'IN_REVIEW', 'TOURING', 'OFFER_MADE', 'PLACED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "core"."ShortlistStatus" AS ENUM ('ADDED', 'CONTACTED', 'RESPONDED', 'TOURING', 'DECLINED');

-- CreateEnum
CREATE TYPE "core"."DischargeStatus" AS ENUM ('INTAKE', 'MATCHING', 'INVITES_SENT', 'RESPONSES_PENDING', 'PLACEMENT_CONFIRMED', 'DISCHARGED', 'FOLLOW_UP', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "core"."InviteResponse" AS ENUM ('ACCEPTED', 'DECLINED', 'NO_AVAILABILITY');

-- CreateEnum
CREATE TYPE "core"."PlacementStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "messaging"."ThreadStatus" AS ENUM ('OPEN', 'AWAITING_RESPONSE', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "messaging"."NotificationType" AS ENUM ('REFERRAL_NEW', 'REFERRAL_UPDATE', 'MESSAGE_NEW', 'PLACEMENT_CONFIRMED', 'LICENSE_EXPIRING', 'OPENING_EXPIRING', 'INVITE_RECEIVED', 'INVITE_EXPIRING');

-- CreateEnum
CREATE TYPE "analytics"."EventType" AS ENUM ('SEARCH_PERFORMED', 'SEARCH_FILTER_APPLIED', 'PROVIDER_VIEWED', 'PROVIDER_CONTACTED', 'PROVIDER_FAVORITED', 'REFERRAL_CREATED', 'REFERRAL_SHORTLIST_ADDED', 'REFERRAL_MESSAGE_SENT', 'PLACEMENT_INITIATED', 'PLACEMENT_CONFIRMED', 'PLACEMENT_COMPLETED', 'USER_REGISTERED', 'USER_LOGIN', 'USER_LOGOUT');

-- CreateEnum
CREATE TYPE "billing"."ProductType" AS ENUM ('PROVIDER_SUBSCRIPTION', 'CAREBOT_PRO', 'ENTERPRISE_FEATURES');

-- CreateEnum
CREATE TYPE "billing"."SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'UNPAID');

-- CreateEnum
CREATE TYPE "billing"."InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE');

-- CreateEnum
CREATE TYPE "vrs"."VRSClientStatus" AS ENUM ('INTAKE', 'ASSESSMENT', 'JOB_READY', 'JOB_SEARCHING', 'PLACED', 'FOLLOW_UP', 'CLOSED');

-- CreateEnum
CREATE TYPE "vrs"."JobStatus" AS ENUM ('DRAFT', 'OPEN', 'FILLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "vrs"."RetentionStatus" AS ENUM ('RETAINED', 'NOT_RETAINED', 'PENDING');

-- CreateEnum
CREATE TYPE "marketplace"."VendorCategory" AS ENUM ('TRAINING', 'DME', 'HOME_MODS', 'LEGAL', 'STAFFING', 'TRANSPORT');

-- CreateEnum
CREATE TYPE "marketplace"."BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "marketplace"."LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST');

-- CreateEnum
CREATE TYPE "audit"."AuditResult" AS ENUM ('SUCCESS', 'FAILURE', 'ERROR');

-- CreateEnum
CREATE TYPE "audit"."ConsentType" AS ENUM ('REFERRAL', 'DISCHARGE', 'PHI_RELEASE', 'MARKETING');

-- CreateEnum
CREATE TYPE "audit"."CaptureMethod" AS ENUM ('ELECTRONIC_SIGNATURE', 'VERBAL_WITH_WITNESS', 'WRITTEN_SCAN');

-- CreateEnum
CREATE TYPE "audit"."TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "audit"."TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_ON_USER', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "auth"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "phoneVerified" TIMESTAMP(3),
    "role" "auth"."UserRole" NOT NULL,
    "status" "auth"."UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "auth"."OrganizationType" NOT NULL,
    "ein" TEXT,
    "npi" TEXT,
    "status" "auth"."OrganizationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fax" TEXT,
    "website" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."CaseManager" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "licenseNumber" TEXT,
    "licenseExpiry" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."HospitalStaff" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "department" TEXT,
    "title" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."Provider" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "primaryLicenseType" TEXT NOT NULL,
    "subscriptionTier" "core"."SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "subscriptionId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "description" TEXT,
    "logo" TEXT,
    "coverImage" TEXT,
    "acceptsReferrals" BOOLEAN NOT NULL DEFAULT true,
    "responseTimeHours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."License" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "issuingState" TEXT NOT NULL DEFAULT 'MN',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "status" "core"."LicenseStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."Home" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'MN',
    "zipCode" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location" TEXT,
    "capacity" INTEGER NOT NULL,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "wheelchairAccessible" BOOLEAN NOT NULL DEFAULT false,
    "singleLevel" BOOLEAN NOT NULL DEFAULT false,
    "hasElevator" BOOLEAN NOT NULL DEFAULT false,
    "hasRollInShower" BOOLEAN NOT NULL DEFAULT false,
    "virtualTourUrl" TEXT,
    "acceptingNew" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Home_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."HomePhoto" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."Service" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "licenseTypes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."ProviderService" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."HomeService" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."HomeAmenity" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "amenityType" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "HomeAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."Opening" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "spotsAvailable" INTEGER NOT NULL,
    "availableFrom" TIMESTAMP(3) NOT NULL,
    "availableUntil" TIMESTAMP(3),
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "genderPreference" "core"."Gender",
    "careLevels" TEXT[],
    "supportedNeeds" TEXT[],
    "acceptedPayers" "core"."Payer"[],
    "privatePayRate" DECIMAL(10,2),
    "status" "core"."OpeningStatus" NOT NULL DEFAULT 'OPEN',
    "freshnessTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."Referral" (
    "id" TEXT NOT NULL,
    "referralNumber" TEXT NOT NULL,
    "caseManagerId" TEXT NOT NULL,
    "caseManagerProfileId" TEXT,
    "organizationId" TEXT NOT NULL,
    "clientAge" INTEGER NOT NULL,
    "clientGender" "core"."Gender" NOT NULL,
    "clientInitials" TEXT NOT NULL,
    "careLevels" TEXT[],
    "servicesNeeded" TEXT[],
    "mobilityLevel" TEXT,
    "behavioralNeeds" TEXT[],
    "medicalNeeds" TEXT[],
    "preferredCounties" TEXT[],
    "preferredCities" TEXT[],
    "maxDistance" INTEGER,
    "primaryPayer" "core"."Payer" NOT NULL,
    "secondaryPayer" "core"."Payer",
    "targetMoveDate" TIMESTAMP(3),
    "urgency" "core"."Urgency" NOT NULL DEFAULT 'ROUTINE',
    "status" "core"."ReferralStatus" NOT NULL DEFAULT 'NEW',
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "placedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."ReferralShortlist" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "status" "core"."ShortlistStatus" NOT NULL DEFAULT 'ADDED',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ReferralShortlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."DischargeCase" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "socialWorkerId" TEXT NOT NULL,
    "hospitalStaffId" TEXT,
    "patientInitials" TEXT NOT NULL,
    "patientAge" INTEGER NOT NULL,
    "patientGender" "core"."Gender" NOT NULL,
    "diagnosisCodes" TEXT[],
    "mobilityStatus" TEXT NOT NULL,
    "cognitiveStatus" TEXT,
    "behavioralConcerns" TEXT[],
    "dmeNeeds" TEXT[],
    "medicationManagement" BOOLEAN NOT NULL,
    "currentLocation" TEXT NOT NULL,
    "targetDischargeDate" TIMESTAMP(3) NOT NULL,
    "actualDischargeDate" TIMESTAMP(3),
    "preferredCounties" TEXT[],
    "preferredCities" TEXT[],
    "requiresProximity" BOOLEAN NOT NULL DEFAULT false,
    "proximityZipCode" TEXT,
    "maxDistanceMiles" INTEGER,
    "primaryInsurance" "core"."Payer" NOT NULL,
    "secondaryInsurance" "core"."Payer",
    "status" "core"."DischargeStatus" NOT NULL DEFAULT 'INTAKE',
    "needsTransport" BOOLEAN NOT NULL DEFAULT false,
    "transportType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "matchedAt" TIMESTAMP(3),
    "invitesSentAt" TIMESTAMP(3),
    "placedAt" TIMESTAMP(3),

    CONSTRAINT "DischargeCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."DischargeInvitation" (
    "id" TEXT NOT NULL,
    "dischargeCaseId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "response" "core"."InviteResponse",
    "responseNotes" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),

    CONSTRAINT "DischargeInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."DischargeChecklist" (
    "id" TEXT NOT NULL,
    "dischargeCaseId" TEXT NOT NULL,
    "consentObtained" BOOLEAN NOT NULL DEFAULT false,
    "insuranceVerified" BOOLEAN NOT NULL DEFAULT false,
    "medsReconciled" BOOLEAN NOT NULL DEFAULT false,
    "equipmentOrdered" BOOLEAN NOT NULL DEFAULT false,
    "transportArranged" BOOLEAN NOT NULL DEFAULT false,
    "patientEducated" BOOLEAN NOT NULL DEFAULT false,
    "documentsSent" BOOLEAN NOT NULL DEFAULT false,
    "followUpScheduled" BOOLEAN NOT NULL DEFAULT false,
    "day1Contact" BOOLEAN NOT NULL DEFAULT false,
    "day2Contact" BOOLEAN NOT NULL DEFAULT false,
    "day7Contact" BOOLEAN NOT NULL DEFAULT false,
    "day30Contact" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DischargeChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."Placement" (
    "id" TEXT NOT NULL,
    "referralId" TEXT,
    "dischargeCaseId" TEXT,
    "providerId" TEXT NOT NULL,
    "openingId" TEXT NOT NULL,
    "placementDate" TIMESTAMP(3) NOT NULL,
    "moveInDate" TIMESTAMP(3),
    "status" "core"."PlacementStatus" NOT NULL DEFAULT 'PENDING',
    "packetGeneratedAt" TIMESTAMP(3),
    "packetUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Placement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit"."PacketAccessLog" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "accessedBy" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,

    CONSTRAINT "PacketAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging"."MessageThread" (
    "id" TEXT NOT NULL,
    "referralId" TEXT,
    "dischargeCaseId" TEXT,
    "providerId" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "status" "messaging"."ThreadStatus" NOT NULL DEFAULT 'OPEN',
    "firstResponseAt" TIMESTAMP(3),
    "avgResponseTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "MessageThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging"."Message" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging"."MessageAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "messaging"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channels" TEXT[],
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "emailSentAt" TIMESTAMP(3),
    "smsSentAt" TIMESTAMP(3),
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventType" "analytics"."EventType" NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "providerId" TEXT,
    "referralId" TEXT,
    "eventData" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."Subscription" (
    "id" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productType" "billing"."ProductType" NOT NULL,
    "tier" "core"."SubscriptionTier" NOT NULL,
    "status" "billing"."SubscriptionStatus" NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "seatsIncluded" INTEGER NOT NULL DEFAULT 1,
    "seatsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."Invoice" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "amountDue" DECIMAL(10,2) NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "billing"."InvoiceStatus" NOT NULL,
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "invoiceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vrs"."VRSClient" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "eligibilityType" TEXT NOT NULL,
    "servicesNeeded" TEXT[],
    "workHistory" JSONB NOT NULL DEFAULT '[]',
    "skills" TEXT[],
    "interests" TEXT[],
    "status" "vrs"."VRSClientStatus" NOT NULL DEFAULT 'INTAKE',
    "assignedSpecialistId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VRSClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vrs"."VRSEmployer" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "isInclusive" BOOLEAN NOT NULL DEFAULT false,
    "hasAccessibility" BOOLEAN NOT NULL DEFAULT false,
    "isSponsoredListing" BOOLEAN NOT NULL DEFAULT false,
    "sponsorshipExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VRSEmployer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vrs"."VRSJob" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "schedule" TEXT[],
    "wage" DECIMAL(10,2) NOT NULL,
    "wageType" TEXT NOT NULL,
    "requirements" TEXT[],
    "preferredSkills" TEXT[],
    "isRemote" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "status" "vrs"."JobStatus" NOT NULL DEFAULT 'OPEN',
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "VRSJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vrs"."VRSPlacement" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "placementDate" TIMESTAMP(3) NOT NULL,
    "startDate" TIMESTAMP(3),
    "day30Status" "vrs"."RetentionStatus",
    "day60Status" "vrs"."RetentionStatus",
    "day90Status" "vrs"."RetentionStatus",
    "endDate" TIMESTAMP(3),
    "endReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VRSPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."Vendor" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "category" "marketplace"."VendorCategory" NOT NULL,
    "subcategories" TEXT[],
    "businessName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logo" TEXT,
    "services" TEXT[],
    "serviceAreas" TEXT[],
    "isSponsoredVendor" BOOLEAN NOT NULL DEFAULT false,
    "sponsorshipTier" TEXT,
    "sponsorshipExpiry" TIMESTAMP(3),
    "averageRating" DECIMAL(2,1),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."TransportBooking" (
    "id" TEXT NOT NULL,
    "dischargeCaseId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "pickupTime" TIMESTAMP(3) NOT NULL,
    "dropoffAddress" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "equipmentNeeded" TEXT[],
    "attendantRequired" BOOLEAN NOT NULL DEFAULT false,
    "status" "marketplace"."BookingStatus" NOT NULL DEFAULT 'PENDING',
    "estimatedCost" DECIMAL(10,2),
    "actualCost" DECIMAL(10,2),
    "payerType" "core"."Payer" NOT NULL,
    "confirmationNumber" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TransportBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."VendorLead" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "servicesInterested" TEXT[],
    "message" TEXT,
    "source" TEXT NOT NULL,
    "status" "marketplace"."LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),

    CONSTRAINT "VendorLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "result" "audit"."AuditResult" NOT NULL,
    "errorMessage" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit"."Consent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referralId" TEXT,
    "dischargeCaseId" TEXT,
    "consentType" "audit"."ConsentType" NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "captureMethod" "audit"."CaptureMethod" NOT NULL,
    "witnessName" TEXT,
    "witnessTitle" TEXT,
    "signatureData" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit"."SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" "auth"."UserRole" NOT NULL,
    "currentUrl" TEXT,
    "referralId" TEXT,
    "dischargeCaseId" TEXT,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "audit"."TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "audit"."TicketStatus" NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "auth"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "auth"."User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "auth"."User"("organizationId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "auth"."User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "auth"."Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "auth"."Session"("userId");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "auth"."Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_ein_key" ON "auth"."Organization"("ein");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_npi_key" ON "auth"."Organization"("npi");

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "auth"."Organization"("type");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "auth"."Organization"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CaseManager_email_key" ON "core"."CaseManager"("email");

-- CreateIndex
CREATE INDEX "CaseManager_organizationId_idx" ON "core"."CaseManager"("organizationId");

-- CreateIndex
CREATE INDEX "CaseManager_email_idx" ON "core"."CaseManager"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalStaff_email_key" ON "core"."HospitalStaff"("email");

-- CreateIndex
CREATE INDEX "HospitalStaff_organizationId_idx" ON "core"."HospitalStaff"("organizationId");

-- CreateIndex
CREATE INDEX "HospitalStaff_email_idx" ON "core"."HospitalStaff"("email");

-- CreateIndex
CREATE INDEX "Provider_organizationId_idx" ON "core"."Provider"("organizationId");

-- CreateIndex
CREATE INDEX "Provider_subscriptionTier_idx" ON "core"."Provider"("subscriptionTier");

-- CreateIndex
CREATE INDEX "Provider_verified_idx" ON "core"."Provider"("verified");

-- CreateIndex
CREATE INDEX "License_providerId_idx" ON "core"."License"("providerId");

-- CreateIndex
CREATE INDEX "License_expirationDate_idx" ON "core"."License"("expirationDate");

-- CreateIndex
CREATE INDEX "License_status_idx" ON "core"."License"("status");

-- CreateIndex
CREATE UNIQUE INDEX "License_licenseNumber_issuingState_key" ON "core"."License"("licenseNumber", "issuingState");

-- CreateIndex
CREATE INDEX "Home_providerId_idx" ON "core"."Home"("providerId");

-- CreateIndex
CREATE INDEX "Home_county_idx" ON "core"."Home"("county");

-- CreateIndex
CREATE INDEX "Home_zipCode_idx" ON "core"."Home"("zipCode");

-- CreateIndex
CREATE INDEX "Home_isActive_idx" ON "core"."Home"("isActive");

-- CreateIndex
CREATE INDEX "HomePhoto_homeId_idx" ON "core"."HomePhoto"("homeId");

-- CreateIndex
CREATE UNIQUE INDEX "Service_code_key" ON "core"."Service"("code");

-- CreateIndex
CREATE INDEX "Service_category_idx" ON "core"."Service"("category");

-- CreateIndex
CREATE INDEX "Service_isActive_idx" ON "core"."Service"("isActive");

-- CreateIndex
CREATE INDEX "ProviderService_providerId_idx" ON "core"."ProviderService"("providerId");

-- CreateIndex
CREATE INDEX "ProviderService_serviceId_idx" ON "core"."ProviderService"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderService_providerId_serviceId_key" ON "core"."ProviderService"("providerId", "serviceId");

-- CreateIndex
CREATE INDEX "HomeService_homeId_idx" ON "core"."HomeService"("homeId");

-- CreateIndex
CREATE INDEX "HomeService_serviceId_idx" ON "core"."HomeService"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "HomeService_homeId_serviceId_key" ON "core"."HomeService"("homeId", "serviceId");

-- CreateIndex
CREATE INDEX "HomeAmenity_homeId_idx" ON "core"."HomeAmenity"("homeId");

-- CreateIndex
CREATE INDEX "Opening_providerId_idx" ON "core"."Opening"("providerId");

-- CreateIndex
CREATE INDEX "Opening_homeId_idx" ON "core"."Opening"("homeId");

-- CreateIndex
CREATE INDEX "Opening_status_idx" ON "core"."Opening"("status");

-- CreateIndex
CREATE INDEX "Opening_freshnessTimestamp_idx" ON "core"."Opening"("freshnessTimestamp");

-- CreateIndex
CREATE INDEX "Opening_acceptedPayers_idx" ON "core"."Opening"("acceptedPayers");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referralNumber_key" ON "core"."Referral"("referralNumber");

-- CreateIndex
CREATE INDEX "Referral_caseManagerId_idx" ON "core"."Referral"("caseManagerId");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "core"."Referral"("status");

-- CreateIndex
CREATE INDEX "Referral_urgency_idx" ON "core"."Referral"("urgency");

-- CreateIndex
CREATE INDEX "Referral_primaryPayer_idx" ON "core"."Referral"("primaryPayer");

-- CreateIndex
CREATE INDEX "ReferralShortlist_referralId_idx" ON "core"."ReferralShortlist"("referralId");

-- CreateIndex
CREATE INDEX "ReferralShortlist_status_idx" ON "core"."ReferralShortlist"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralShortlist_referralId_providerId_key" ON "core"."ReferralShortlist"("referralId", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "DischargeCase_caseNumber_key" ON "core"."DischargeCase"("caseNumber");

-- CreateIndex
CREATE INDEX "DischargeCase_hospitalId_idx" ON "core"."DischargeCase"("hospitalId");

-- CreateIndex
CREATE INDEX "DischargeCase_socialWorkerId_idx" ON "core"."DischargeCase"("socialWorkerId");

-- CreateIndex
CREATE INDEX "DischargeCase_status_idx" ON "core"."DischargeCase"("status");

-- CreateIndex
CREATE INDEX "DischargeCase_targetDischargeDate_idx" ON "core"."DischargeCase"("targetDischargeDate");

-- CreateIndex
CREATE INDEX "DischargeInvitation_dischargeCaseId_idx" ON "core"."DischargeInvitation"("dischargeCaseId");

-- CreateIndex
CREATE INDEX "DischargeInvitation_providerId_idx" ON "core"."DischargeInvitation"("providerId");

-- CreateIndex
CREATE INDEX "DischargeInvitation_expiresAt_idx" ON "core"."DischargeInvitation"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "DischargeChecklist_dischargeCaseId_key" ON "core"."DischargeChecklist"("dischargeCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Placement_dischargeCaseId_key" ON "core"."Placement"("dischargeCaseId");

-- CreateIndex
CREATE INDEX "Placement_referralId_idx" ON "core"."Placement"("referralId");

-- CreateIndex
CREATE INDEX "Placement_dischargeCaseId_idx" ON "core"."Placement"("dischargeCaseId");

-- CreateIndex
CREATE INDEX "Placement_providerId_idx" ON "core"."Placement"("providerId");

-- CreateIndex
CREATE INDEX "Placement_status_idx" ON "core"."Placement"("status");

-- CreateIndex
CREATE INDEX "PacketAccessLog_placementId_idx" ON "audit"."PacketAccessLog"("placementId");

-- CreateIndex
CREATE INDEX "PacketAccessLog_accessedBy_idx" ON "audit"."PacketAccessLog"("accessedBy");

-- CreateIndex
CREATE INDEX "MessageThread_referralId_idx" ON "messaging"."MessageThread"("referralId");

-- CreateIndex
CREATE INDEX "MessageThread_dischargeCaseId_idx" ON "messaging"."MessageThread"("dischargeCaseId");

-- CreateIndex
CREATE INDEX "MessageThread_providerId_idx" ON "messaging"."MessageThread"("providerId");

-- CreateIndex
CREATE INDEX "MessageThread_status_idx" ON "messaging"."MessageThread"("status");

-- CreateIndex
CREATE INDEX "Message_threadId_idx" ON "messaging"."Message"("threadId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "messaging"."Message"("senderId");

-- CreateIndex
CREATE INDEX "MessageAttachment_messageId_idx" ON "messaging"."MessageAttachment"("messageId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "messaging"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "messaging"."Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "messaging"."Notification"("type");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "analytics"."AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "analytics"."AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_providerId_idx" ON "analytics"."AnalyticsEvent"("providerId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "analytics"."AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "billing"."Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_organizationId_idx" ON "billing"."Subscription"("organizationId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "billing"."Subscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_stripeInvoiceId_key" ON "billing"."Invoice"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "Invoice_subscriptionId_idx" ON "billing"."Invoice"("subscriptionId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "billing"."Invoice"("status");

-- CreateIndex
CREATE INDEX "VRSEmployer_isSponsoredListing_idx" ON "vrs"."VRSEmployer"("isSponsoredListing");

-- CreateIndex
CREATE INDEX "VRSJob_employerId_idx" ON "vrs"."VRSJob"("employerId");

-- CreateIndex
CREATE INDEX "VRSJob_status_idx" ON "vrs"."VRSJob"("status");

-- CreateIndex
CREATE INDEX "VRSPlacement_clientId_idx" ON "vrs"."VRSPlacement"("clientId");

-- CreateIndex
CREATE INDEX "VRSPlacement_jobId_idx" ON "vrs"."VRSPlacement"("jobId");

-- CreateIndex
CREATE INDEX "Vendor_category_idx" ON "marketplace"."Vendor"("category");

-- CreateIndex
CREATE INDEX "Vendor_isSponsoredVendor_idx" ON "marketplace"."Vendor"("isSponsoredVendor");

-- CreateIndex
CREATE UNIQUE INDEX "TransportBooking_dischargeCaseId_key" ON "marketplace"."TransportBooking"("dischargeCaseId");

-- CreateIndex
CREATE INDEX "TransportBooking_vendorId_idx" ON "marketplace"."TransportBooking"("vendorId");

-- CreateIndex
CREATE INDEX "TransportBooking_status_idx" ON "marketplace"."TransportBooking"("status");

-- CreateIndex
CREATE INDEX "VendorLead_vendorId_idx" ON "marketplace"."VendorLead"("vendorId");

-- CreateIndex
CREATE INDEX "VendorLead_status_idx" ON "marketplace"."VendorLead"("status");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "audit"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "audit"."AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_idx" ON "audit"."AuditLog"("resourceType");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "audit"."AuditLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Consent_dischargeCaseId_key" ON "audit"."Consent"("dischargeCaseId");

-- CreateIndex
CREATE INDEX "Consent_userId_idx" ON "audit"."Consent"("userId");

-- CreateIndex
CREATE INDEX "Consent_consentType_idx" ON "audit"."Consent"("consentType");

-- CreateIndex
CREATE INDEX "Consent_isActive_idx" ON "audit"."Consent"("isActive");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "audit"."SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "audit"."SupportTicket"("status");

-- CreateIndex
CREATE INDEX "SupportTicket_priority_idx" ON "audit"."SupportTicket"("priority");

-- AddForeignKey
ALTER TABLE "auth"."User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."CaseManager" ADD CONSTRAINT "CaseManager_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."HospitalStaff" ADD CONSTRAINT "HospitalStaff_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Provider" ADD CONSTRAINT "Provider_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."License" ADD CONSTRAINT "License_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "core"."Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Home" ADD CONSTRAINT "Home_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "core"."Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."HomePhoto" ADD CONSTRAINT "HomePhoto_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "core"."Home"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."ProviderService" ADD CONSTRAINT "ProviderService_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "core"."Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."ProviderService" ADD CONSTRAINT "ProviderService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "core"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."HomeService" ADD CONSTRAINT "HomeService_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "core"."Home"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."HomeService" ADD CONSTRAINT "HomeService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "core"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."HomeAmenity" ADD CONSTRAINT "HomeAmenity_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "core"."Home"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Opening" ADD CONSTRAINT "Opening_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "core"."Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Opening" ADD CONSTRAINT "Opening_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "core"."Home"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Referral" ADD CONSTRAINT "Referral_caseManagerId_fkey" FOREIGN KEY ("caseManagerId") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Referral" ADD CONSTRAINT "Referral_caseManagerProfileId_fkey" FOREIGN KEY ("caseManagerProfileId") REFERENCES "core"."CaseManager"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."ReferralShortlist" ADD CONSTRAINT "ReferralShortlist_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "core"."Referral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."DischargeCase" ADD CONSTRAINT "DischargeCase_socialWorkerId_fkey" FOREIGN KEY ("socialWorkerId") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."DischargeCase" ADD CONSTRAINT "DischargeCase_hospitalStaffId_fkey" FOREIGN KEY ("hospitalStaffId") REFERENCES "core"."HospitalStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."DischargeInvitation" ADD CONSTRAINT "DischargeInvitation_dischargeCaseId_fkey" FOREIGN KEY ("dischargeCaseId") REFERENCES "core"."DischargeCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."DischargeChecklist" ADD CONSTRAINT "DischargeChecklist_dischargeCaseId_fkey" FOREIGN KEY ("dischargeCaseId") REFERENCES "core"."DischargeCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Placement" ADD CONSTRAINT "Placement_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "core"."Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Placement" ADD CONSTRAINT "Placement_dischargeCaseId_fkey" FOREIGN KEY ("dischargeCaseId") REFERENCES "core"."DischargeCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Placement" ADD CONSTRAINT "Placement_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "core"."Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Placement" ADD CONSTRAINT "Placement_openingId_fkey" FOREIGN KEY ("openingId") REFERENCES "core"."Opening"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit"."PacketAccessLog" ADD CONSTRAINT "PacketAccessLog_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "core"."Placement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."MessageThread" ADD CONSTRAINT "MessageThread_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "core"."Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."MessageThread" ADD CONSTRAINT "MessageThread_dischargeCaseId_fkey" FOREIGN KEY ("dischargeCaseId") REFERENCES "core"."DischargeCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."MessageThread" ADD CONSTRAINT "MessageThread_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "core"."Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "messaging"."MessageThread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."MessageAttachment" ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messaging"."Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "core"."Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "billing"."Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vrs"."VRSJob" ADD CONSTRAINT "VRSJob_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "vrs"."VRSEmployer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vrs"."VRSPlacement" ADD CONSTRAINT "VRSPlacement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "vrs"."VRSClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vrs"."VRSPlacement" ADD CONSTRAINT "VRSPlacement_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "vrs"."VRSJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."Vendor" ADD CONSTRAINT "Vendor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."TransportBooking" ADD CONSTRAINT "TransportBooking_dischargeCaseId_fkey" FOREIGN KEY ("dischargeCaseId") REFERENCES "core"."DischargeCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."TransportBooking" ADD CONSTRAINT "TransportBooking_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "marketplace"."Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."VendorLead" ADD CONSTRAINT "VendorLead_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "marketplace"."Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit"."Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit"."Consent" ADD CONSTRAINT "Consent_dischargeCaseId_fkey" FOREIGN KEY ("dischargeCaseId") REFERENCES "core"."DischargeCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit"."SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
