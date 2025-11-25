/*
  Warnings:

  - You are about to drop the column `issuingState` on the `License` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[licenseNumber]` on the table `License` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "core"."OnboardingReviewStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_CHANGES');

-- CreateEnum
CREATE TYPE "core"."RequestStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'CONVERTED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "billing"."BoostPurchaseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'REFUNDED');

-- AlterEnum
ALTER TYPE "analytics"."EventType" ADD VALUE 'REFERRAL_UPDATE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "messaging"."NotificationType" ADD VALUE 'REQUEST_ASSIGNED';
ALTER TYPE "messaging"."NotificationType" ADD VALUE 'REQUEST_STATUS_UPDATE';
ALTER TYPE "messaging"."NotificationType" ADD VALUE 'REQUEST_CONVERTED';
ALTER TYPE "messaging"."NotificationType" ADD VALUE 'NEW_REFERRAL_REQUEST';
ALTER TYPE "messaging"."NotificationType" ADD VALUE 'PROVIDER_RESPONSE';
ALTER TYPE "messaging"."NotificationType" ADD VALUE 'PLACEMENT_UPDATE';
ALTER TYPE "messaging"."NotificationType" ADD VALUE 'URGENT_CASE_ALERT';
ALTER TYPE "messaging"."NotificationType" ADD VALUE 'NEW_REFERRAL';
ALTER TYPE "messaging"."NotificationType" ADD VALUE 'MESSAGE_RECEIVED';
ALTER TYPE "messaging"."NotificationType" ADD VALUE 'DISCHARGE_INVITE_RESPONSE';
ALTER TYPE "messaging"."NotificationType" ADD VALUE 'DISCHARGE_PLACEMENT';
ALTER TYPE "messaging"."NotificationType" ADD VALUE 'NEW_LEAD';
ALTER TYPE "messaging"."NotificationType" ADD VALUE 'BOOKING_CONFIRMED';
ALTER TYPE "messaging"."NotificationType" ADD VALUE 'BOOKING_COMPLETED';
ALTER TYPE "messaging"."NotificationType" ADD VALUE 'CLIENT_UPDATE';
ALTER TYPE "messaging"."NotificationType" ADD VALUE 'JOB_MATCH';
ALTER TYPE "messaging"."NotificationType" ADD VALUE 'RETENTION_ALERT';
ALTER TYPE "messaging"."NotificationType" ADD VALUE 'PLACEMENT_SUCCESS';
ALTER TYPE "messaging"."NotificationType" ADD VALUE 'SYSTEM_ANNOUNCEMENT';
ALTER TYPE "messaging"."NotificationType" ADD VALUE 'ACCOUNT_UPDATE';

-- DropForeignKey
ALTER TABLE "audit"."Consent" DROP CONSTRAINT "Consent_userId_fkey";

-- DropForeignKey
ALTER TABLE "audit"."PacketAccessLog" DROP CONSTRAINT "PacketAccessLog_placementId_fkey";

-- DropForeignKey
ALTER TABLE "audit"."SupportTicket" DROP CONSTRAINT "SupportTicket_userId_fkey";

-- DropForeignKey
ALTER TABLE "billing"."Invoice" DROP CONSTRAINT "Invoice_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "core"."CaseManager" DROP CONSTRAINT "CaseManager_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "core"."DischargeCase" DROP CONSTRAINT "DischargeCase_socialWorkerId_fkey";

-- DropForeignKey
ALTER TABLE "core"."DischargeChecklist" DROP CONSTRAINT "DischargeChecklist_dischargeCaseId_fkey";

-- DropForeignKey
ALTER TABLE "core"."DischargeInvitation" DROP CONSTRAINT "DischargeInvitation_dischargeCaseId_fkey";

-- DropForeignKey
ALTER TABLE "core"."Home" DROP CONSTRAINT "Home_providerId_fkey";

-- DropForeignKey
ALTER TABLE "core"."HomeAmenity" DROP CONSTRAINT "HomeAmenity_homeId_fkey";

-- DropForeignKey
ALTER TABLE "core"."HomePhoto" DROP CONSTRAINT "HomePhoto_homeId_fkey";

-- DropForeignKey
ALTER TABLE "core"."HomeService" DROP CONSTRAINT "HomeService_homeId_fkey";

-- DropForeignKey
ALTER TABLE "core"."HomeService" DROP CONSTRAINT "HomeService_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "core"."HospitalStaff" DROP CONSTRAINT "HospitalStaff_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "core"."License" DROP CONSTRAINT "License_providerId_fkey";

-- DropForeignKey
ALTER TABLE "core"."Opening" DROP CONSTRAINT "Opening_homeId_fkey";

-- DropForeignKey
ALTER TABLE "core"."Opening" DROP CONSTRAINT "Opening_providerId_fkey";

-- DropForeignKey
ALTER TABLE "core"."Placement" DROP CONSTRAINT "Placement_openingId_fkey";

-- DropForeignKey
ALTER TABLE "core"."Placement" DROP CONSTRAINT "Placement_providerId_fkey";

-- DropForeignKey
ALTER TABLE "core"."Provider" DROP CONSTRAINT "Provider_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "core"."ProviderService" DROP CONSTRAINT "ProviderService_providerId_fkey";

-- DropForeignKey
ALTER TABLE "core"."ProviderService" DROP CONSTRAINT "ProviderService_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "core"."Referral" DROP CONSTRAINT "Referral_caseManagerId_fkey";

-- DropForeignKey
ALTER TABLE "core"."ReferralShortlist" DROP CONSTRAINT "ReferralShortlist_referralId_fkey";

-- DropForeignKey
ALTER TABLE "marketplace"."TransportBooking" DROP CONSTRAINT "TransportBooking_dischargeCaseId_fkey";

-- DropForeignKey
ALTER TABLE "marketplace"."TransportBooking" DROP CONSTRAINT "TransportBooking_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "marketplace"."Vendor" DROP CONSTRAINT "Vendor_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "marketplace"."VendorLead" DROP CONSTRAINT "VendorLead_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "messaging"."Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "messaging"."Message" DROP CONSTRAINT "Message_threadId_fkey";

-- DropForeignKey
ALTER TABLE "messaging"."MessageAttachment" DROP CONSTRAINT "MessageAttachment_messageId_fkey";

-- DropForeignKey
ALTER TABLE "messaging"."MessageThread" DROP CONSTRAINT "MessageThread_providerId_fkey";

-- DropForeignKey
ALTER TABLE "messaging"."Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "vrs"."VRSJob" DROP CONSTRAINT "VRSJob_employerId_fkey";

-- DropForeignKey
ALTER TABLE "vrs"."VRSPlacement" DROP CONSTRAINT "VRSPlacement_clientId_fkey";

-- DropForeignKey
ALTER TABLE "vrs"."VRSPlacement" DROP CONSTRAINT "VRSPlacement_jobId_fkey";

-- DropIndex
DROP INDEX "core"."License_licenseNumber_issuingState_key";

-- DropIndex
DROP INDEX "messaging"."Notification_isRead_idx";

-- DropIndex
DROP INDEX "messaging"."Notification_userId_idx";

-- AlterTable
ALTER TABLE "core"."CaseManager" ADD COLUMN     "defaultReferralSettings" JSONB,
ADD COLUMN     "licenseDocumentUrl" TEXT,
ADD COLUMN     "licenseFileName" TEXT,
ADD COLUMN     "notificationPreferences" JSONB;

-- AlterTable
ALTER TABLE "core"."License" DROP COLUMN "issuingState";

-- AlterTable
ALTER TABLE "core"."Opening" ADD COLUMN     "expiryReminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "core"."Provider" ADD COLUMN     "boostExpiresAt" TIMESTAMP(3),
ADD COLUMN     "boostLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "boostPurchasedAt" TIMESTAMP(3),
ADD COLUMN     "boostStripeSubId" TEXT,
ADD COLUMN     "inquiryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastViewedAt" TIMESTAMP(3),
ADD COLUMN     "placementCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "messaging"."Notification" ADD COLUMN     "actionLabel" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "channels" SET DEFAULT ARRAY['IN_APP']::TEXT[];

-- CreateTable
CREATE TABLE "core"."ProviderOnboardingState" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "completedSteps" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "organizationData" JSONB DEFAULT '{}',
    "licenseData" JSONB DEFAULT '{}',
    "serviceData" JSONB DEFAULT '{}',
    "subscriptionData" JSONB DEFAULT '{}',
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "adminReviewStatus" "core"."OnboardingReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderOnboardingState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."PublicReferralRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "recipientAge" INTEGER NOT NULL,
    "recipientGender" "core"."Gender" NOT NULL,
    "recipientInitials" TEXT NOT NULL,
    "careNeeds" TEXT NOT NULL,
    "urgency" "core"."Urgency" NOT NULL DEFAULT 'ROUTINE',
    "preferredCounties" TEXT[],
    "primaryPayer" "core"."Payer",
    "secondaryPayer" "core"."Payer",
    "interestedProviderIds" TEXT[],
    "status" "core"."RequestStatus" NOT NULL DEFAULT 'PENDING',
    "assignedCaseManagerId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "convertedToReferralId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "PublicReferralRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging"."MessageTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "variables" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."BoostPurchase" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "boostLevel" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripePaymentId" TEXT,
    "stripeSubId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "billing"."BoostPurchaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoostPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderOnboardingState_providerId_key" ON "core"."ProviderOnboardingState"("providerId");

-- CreateIndex
CREATE INDEX "ProviderOnboardingState_providerId_idx" ON "core"."ProviderOnboardingState"("providerId");

-- CreateIndex
CREATE INDEX "ProviderOnboardingState_adminReviewStatus_idx" ON "core"."ProviderOnboardingState"("adminReviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "PublicReferralRequest_requestNumber_key" ON "core"."PublicReferralRequest"("requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PublicReferralRequest_convertedToReferralId_key" ON "core"."PublicReferralRequest"("convertedToReferralId");

-- CreateIndex
CREATE INDEX "PublicReferralRequest_userId_idx" ON "core"."PublicReferralRequest"("userId");

-- CreateIndex
CREATE INDEX "PublicReferralRequest_status_idx" ON "core"."PublicReferralRequest"("status");

-- CreateIndex
CREATE INDEX "PublicReferralRequest_assignedCaseManagerId_idx" ON "core"."PublicReferralRequest"("assignedCaseManagerId");

-- CreateIndex
CREATE INDEX "MessageTemplate_userId_idx" ON "messaging"."MessageTemplate"("userId");

-- CreateIndex
CREATE INDEX "MessageTemplate_organizationId_idx" ON "messaging"."MessageTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "MessageTemplate_category_idx" ON "messaging"."MessageTemplate"("category");

-- CreateIndex
CREATE INDEX "BoostPurchase_providerId_idx" ON "billing"."BoostPurchase"("providerId");

-- CreateIndex
CREATE INDEX "BoostPurchase_status_idx" ON "billing"."BoostPurchase"("status");

-- CreateIndex
CREATE INDEX "BoostPurchase_endDate_idx" ON "billing"."BoostPurchase"("endDate");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "core"."Favorite"("userId");

-- CreateIndex
CREATE INDEX "Favorite_providerId_idx" ON "core"."Favorite"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_providerId_key" ON "core"."Favorite"("userId", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "License_licenseNumber_key" ON "core"."License"("licenseNumber");

-- CreateIndex
CREATE INDEX "Opening_expiryReminderSentAt_idx" ON "core"."Opening"("expiryReminderSentAt");

-- CreateIndex
CREATE INDEX "Provider_boostLevel_boostExpiresAt_idx" ON "core"."Provider"("boostLevel", "boostExpiresAt");

-- CreateIndex
CREATE INDEX "Provider_viewCount_idx" ON "core"."Provider"("viewCount");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "messaging"."Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "messaging"."Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "core"."CaseManager" ADD CONSTRAINT "CaseManager_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."HospitalStaff" ADD CONSTRAINT "HospitalStaff_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Provider" ADD CONSTRAINT "Provider_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."License" ADD CONSTRAINT "License_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "core"."Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."ProviderOnboardingState" ADD CONSTRAINT "ProviderOnboardingState_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "core"."Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Home" ADD CONSTRAINT "Home_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "core"."Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."HomePhoto" ADD CONSTRAINT "HomePhoto_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "core"."Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."ProviderService" ADD CONSTRAINT "ProviderService_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "core"."Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."ProviderService" ADD CONSTRAINT "ProviderService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "core"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."HomeService" ADD CONSTRAINT "HomeService_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "core"."Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."HomeService" ADD CONSTRAINT "HomeService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "core"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."HomeAmenity" ADD CONSTRAINT "HomeAmenity_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "core"."Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Opening" ADD CONSTRAINT "Opening_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "core"."Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Opening" ADD CONSTRAINT "Opening_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "core"."Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Referral" ADD CONSTRAINT "Referral_caseManagerId_fkey" FOREIGN KEY ("caseManagerId") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."ReferralShortlist" ADD CONSTRAINT "ReferralShortlist_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "core"."Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."PublicReferralRequest" ADD CONSTRAINT "PublicReferralRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."PublicReferralRequest" ADD CONSTRAINT "PublicReferralRequest_assignedCaseManagerId_fkey" FOREIGN KEY ("assignedCaseManagerId") REFERENCES "auth"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."PublicReferralRequest" ADD CONSTRAINT "PublicReferralRequest_convertedToReferralId_fkey" FOREIGN KEY ("convertedToReferralId") REFERENCES "core"."Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."DischargeCase" ADD CONSTRAINT "DischargeCase_socialWorkerId_fkey" FOREIGN KEY ("socialWorkerId") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."DischargeInvitation" ADD CONSTRAINT "DischargeInvitation_dischargeCaseId_fkey" FOREIGN KEY ("dischargeCaseId") REFERENCES "core"."DischargeCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."DischargeChecklist" ADD CONSTRAINT "DischargeChecklist_dischargeCaseId_fkey" FOREIGN KEY ("dischargeCaseId") REFERENCES "core"."DischargeCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Placement" ADD CONSTRAINT "Placement_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "core"."Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Placement" ADD CONSTRAINT "Placement_openingId_fkey" FOREIGN KEY ("openingId") REFERENCES "core"."Opening"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit"."PacketAccessLog" ADD CONSTRAINT "PacketAccessLog_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "core"."Placement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."MessageThread" ADD CONSTRAINT "MessageThread_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "core"."Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "messaging"."MessageThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."MessageAttachment" ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messaging"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."MessageTemplate" ADD CONSTRAINT "MessageTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging"."MessageTemplate" ADD CONSTRAINT "MessageTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."BoostPurchase" ADD CONSTRAINT "BoostPurchase_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "core"."Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "billing"."Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vrs"."VRSJob" ADD CONSTRAINT "VRSJob_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "vrs"."VRSEmployer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vrs"."VRSPlacement" ADD CONSTRAINT "VRSPlacement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "vrs"."VRSClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vrs"."VRSPlacement" ADD CONSTRAINT "VRSPlacement_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "vrs"."VRSJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."Vendor" ADD CONSTRAINT "Vendor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."TransportBooking" ADD CONSTRAINT "TransportBooking_dischargeCaseId_fkey" FOREIGN KEY ("dischargeCaseId") REFERENCES "core"."DischargeCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."TransportBooking" ADD CONSTRAINT "TransportBooking_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "marketplace"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."VendorLead" ADD CONSTRAINT "VendorLead_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "marketplace"."Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit"."Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit"."SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Favorite" ADD CONSTRAINT "Favorite_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "core"."Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
