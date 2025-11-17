/**
 * Script to clear all data from the database
 * This script deletes records in the correct order to respect foreign key constraints
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log("🗑️  Starting database cleanup...\n");

  try {
    // Delete in order to respect foreign key constraints
    // Start with child records and work up to parent records

    console.log("1. Deleting child records...");

    // Delete from messaging schema
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "messaging"."MessageAttachment" CASCADE`
    );
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "messaging"."Message" CASCADE`
    );
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "messaging"."MessageThread" CASCADE`
    );
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "messaging"."Notification" CASCADE`
    );
    console.log("   ✓ Messaging records deleted");

    // Delete from audit schema
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "audit"."SupportTicket" CASCADE`
    );
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "audit"."Consent" CASCADE`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "audit"."AuditLog" CASCADE`);
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "audit"."PacketAccessLog" CASCADE`
    );
    console.log("   ✓ Audit records deleted");

    // Delete from analytics schema
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "analytics"."AnalyticsEvent" CASCADE`
    );
    console.log("   ✓ Analytics records deleted");

    // Delete from billing schema
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "billing"."Invoice" CASCADE`
    );
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "billing"."Subscription" CASCADE`
    );
    console.log("   ✓ Billing records deleted");

    // Delete from marketplace schema
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "marketplace"."VendorLead" CASCADE`
    );
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "marketplace"."TransportBooking" CASCADE`
    );
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "marketplace"."Vendor" CASCADE`
    );
    console.log("   ✓ Marketplace records deleted");

    // Delete from vrs schema
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "vrs"."VRSPlacement" CASCADE`
    );
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "vrs"."VRSJob" CASCADE`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "vrs"."VRSClient" CASCADE`);
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "vrs"."VRSEmployer" CASCADE`
    );
    console.log("   ✓ VRS records deleted");

    console.log("\n2. Deleting core schema records...");

    // Delete from core schema
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "core"."Placement" CASCADE`);
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "core"."DischargeChecklist" CASCADE`
    );
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "core"."DischargeInvitation" CASCADE`
    );
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "core"."DischargeCase" CASCADE`
    );
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "core"."ReferralShortlist" CASCADE`
    );
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "core"."Referral" CASCADE`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "core"."Opening" CASCADE`);
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "core"."HomeAmenity" CASCADE`
    );
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "core"."HomeService" CASCADE`
    );
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "core"."HomePhoto" CASCADE`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "core"."Home" CASCADE`);
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "core"."ProviderService" CASCADE`
    );
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "core"."ProviderOnboardingState" CASCADE`
    );
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "core"."License" CASCADE`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "core"."Provider" CASCADE`);
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "core"."CaseManager" CASCADE`
    );
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "core"."HospitalStaff" CASCADE`
    );
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "core"."Service" CASCADE`);
    console.log("   ✓ Core records deleted");

    console.log("\n3. Deleting auth schema records...");

    // Delete from auth schema (must be last)
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "auth"."EmailVerificationToken" CASCADE`
    );
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "auth"."PasswordResetToken" CASCADE`
    );
    // Note: Session table was removed in a migration, so we skip it
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "auth"."User" CASCADE`);
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "auth"."Organization" CASCADE`
    );
    console.log("   ✓ Auth records deleted");

    console.log("\n✅ Database cleared successfully!");
    console.log(
      "\n💡 Note: This script uses TRUNCATE which is faster than DELETE"
    );
    console.log("   and automatically resets auto-increment sequences.");
  } catch (error) {
    console.error("\n❌ Error clearing database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearDatabase()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Failed to clear database:", error);
    process.exit(1);
  });
