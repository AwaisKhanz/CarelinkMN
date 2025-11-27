-- CreateEnum
CREATE TYPE "core"."FollowUpType" AS ENUM ('DAY_1_CHECKIN', 'DAY_7_CHECKIN', 'DAY_30_CHECKIN', 'DAY_90_CHECKIN', 'CUSTOM');

-- CreateEnum
CREATE TYPE "core"."FollowUpOutcome" AS ENUM ('POSITIVE', 'CONCERNS', 'NEEDS_ATTENTION', 'NO_RESPONSE');

-- CreateEnum
CREATE TYPE "core"."DocumentCategory" AS ENUM ('MEDICAL_RECORDS', 'INSURANCE', 'IDENTIFICATION', 'CARE_PLAN', 'CONSENT_FORM', 'PHOTO', 'OTHER');

-- CreateEnum
CREATE TYPE "core"."UpdateCategory" AS ENUM ('GENERAL', 'HEALTH', 'ACTIVITY', 'MILESTONE', 'PHOTO');

-- CreateTable
CREATE TABLE "core"."PlacementFollowUp" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "type" "core"."FollowUpType" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "notes" TEXT,
    "outcome" "core"."FollowUpOutcome",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlacementFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."PlacementDocument" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "category" "core"."DocumentCategory" NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storageUrl" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "PlacementDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."PlacementFamilyContact" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "canReceiveUpdates" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlacementFamilyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."PlacementUpdate" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" "core"."UpdateCategory" NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photos" TEXT[],

    CONSTRAINT "PlacementUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlacementFollowUp_placementId_idx" ON "core"."PlacementFollowUp"("placementId");

-- CreateIndex
CREATE INDEX "PlacementFollowUp_scheduledAt_idx" ON "core"."PlacementFollowUp"("scheduledAt");

-- CreateIndex
CREATE INDEX "PlacementFollowUp_completedAt_idx" ON "core"."PlacementFollowUp"("completedAt");

-- CreateIndex
CREATE INDEX "PlacementDocument_placementId_idx" ON "core"."PlacementDocument"("placementId");

-- CreateIndex
CREATE INDEX "PlacementDocument_category_idx" ON "core"."PlacementDocument"("category");

-- CreateIndex
CREATE INDEX "PlacementFamilyContact_placementId_idx" ON "core"."PlacementFamilyContact"("placementId");

-- CreateIndex
CREATE INDEX "PlacementUpdate_placementId_idx" ON "core"."PlacementUpdate"("placementId");

-- CreateIndex
CREATE INDEX "PlacementUpdate_createdAt_idx" ON "core"."PlacementUpdate"("createdAt");

-- AddForeignKey
ALTER TABLE "core"."PlacementFollowUp" ADD CONSTRAINT "PlacementFollowUp_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "core"."Placement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."PlacementDocument" ADD CONSTRAINT "PlacementDocument_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "core"."Placement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."PlacementFamilyContact" ADD CONSTRAINT "PlacementFamilyContact_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "core"."Placement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."PlacementUpdate" ADD CONSTRAINT "PlacementUpdate_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "core"."Placement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
