import {
  PrismaClient,
  UserRole,
  UserStatus,
  OrganizationType,
  OrganizationStatus,
  SubscriptionTier,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log("🌱 Seeding database...\n");

  // ============================================
  // 1. SEED SERVICES
  // ============================================
  console.log("📦 Seeding services...");
  const services = [
    // Daily Living Services
    {
      code: "ADL_BASIC",
      name: "Activities of Daily Living - Basic",
      description:
        "Assistance with basic daily activities such as eating, dressing, and personal hygiene",
      category: "Daily Living",
      licenseTypes: ["144D", "245D", "CRS"],
      isActive: true,
    },
    {
      code: "ADL_INTENSIVE",
      name: "Activities of Daily Living - Intensive",
      description:
        "Intensive assistance with daily activities requiring more support",
      category: "Daily Living",
      licenseTypes: ["245D", "CRS"],
      isActive: true,
    },
    {
      code: "IADL",
      name: "Instrumental Activities of Daily Living",
      description:
        "Assistance with complex daily tasks like meal preparation, housekeeping, and transportation",
      category: "Daily Living",
      licenseTypes: ["144D", "245D", "CRS"],
      isActive: true,
    },

    // Medical Services
    {
      code: "MED_MGMT",
      name: "Medication Management",
      description: "Assistance with medication administration and monitoring",
      category: "Medical",
      licenseTypes: ["144D", "245D", "CRS", "ALF"],
      isActive: true,
    },
    {
      code: "NURSING_CARE",
      name: "Nursing Care",
      description:
        "Professional nursing services including wound care, health monitoring, and medical procedures",
      category: "Medical",
      licenseTypes: ["245D", "CRS", "ALF"],
      isActive: true,
    },
    {
      code: "HEALTH_MONITORING",
      name: "Health Monitoring",
      description:
        "Regular monitoring of vital signs, health status, and coordination with healthcare providers",
      category: "Medical",
      licenseTypes: ["144D", "245D", "CRS", "ALF"],
      isActive: true,
    },

    // Specialized Care Services
    {
      code: "MEMORY_CARE",
      name: "Memory Care",
      description:
        "Specialized care for individuals with dementia and memory-related conditions",
      category: "Specialized Care",
      licenseTypes: ["144D", "ALF"],
      isActive: true,
    },
    {
      code: "BEHAVIORAL_SUPPORT",
      name: "Behavioral Support",
      description:
        "Support for individuals with behavioral health needs and mental health conditions",
      category: "Specialized Care",
      licenseTypes: ["144D", "245D", "CRS"],
      isActive: true,
    },
    {
      code: "RESPITE_CARE",
      name: "Respite Care",
      description:
        "Temporary care services to provide relief for primary caregivers",
      category: "Specialized Care",
      licenseTypes: ["144D", "245D", "CRS", "ALF"],
      isActive: true,
    },

    // Physical Support Services
    {
      code: "MOBILITY_ASSIST",
      name: "Mobility Assistance",
      description: "Help with walking, transfers, and mobility aids",
      category: "Physical Support",
      licenseTypes: ["144D", "245D", "CRS", "ALF"],
      isActive: true,
    },
    {
      code: "PHYSICAL_THERAPY",
      name: "Physical Therapy",
      description:
        "Therapeutic exercises and treatments to improve mobility and physical function",
      category: "Physical Support",
      licenseTypes: ["245D", "CRS", "ALF"],
      isActive: true,
    },
    {
      code: "FALL_PREVENTION",
      name: "Fall Prevention",
      description:
        "Programs and interventions to reduce fall risk and improve safety",
      category: "Physical Support",
      licenseTypes: ["144D", "245D", "CRS", "ALF"],
      isActive: true,
    },

    // Personal Care Services
    {
      code: "PERSONAL_CARE",
      name: "Personal Care",
      description:
        "Assistance with bathing, dressing, grooming, and personal hygiene",
      category: "Personal Care",
      licenseTypes: ["144D", "245D", "CRS", "ALF"],
      isActive: true,
    },
    {
      code: "TOILETING_ASSIST",
      name: "Toileting Assistance",
      description:
        "Help with toileting, incontinence care, and bathroom safety",
      category: "Personal Care",
      licenseTypes: ["144D", "245D", "CRS", "ALF"],
      isActive: true,
    },

    // Health Support Services
    {
      code: "NUTRITION",
      name: "Nutrition Management",
      description:
        "Meal planning, dietary assistance, and nutrition monitoring",
      category: "Health Support",
      licenseTypes: ["144D", "245D", "CRS", "ALF"],
      isActive: true,
    },
    {
      code: "DIABETES_CARE",
      name: "Diabetes Care",
      description:
        "Specialized care for individuals with diabetes including blood sugar monitoring",
      category: "Health Support",
      licenseTypes: ["144D", "245D", "CRS", "ALF"],
      isActive: true,
    },
    {
      code: "WEIGHT_MANAGEMENT",
      name: "Weight Management",
      description: "Programs to help maintain healthy weight and nutrition",
      category: "Health Support",
      licenseTypes: ["144D", "245D", "CRS", "ALF"],
      isActive: true,
    },

    // Support Services
    {
      code: "TRANSPORT",
      name: "Transportation",
      description: "Medical and non-medical transportation services",
      category: "Support Services",
      licenseTypes: ["144D", "245D", "CRS"],
      isActive: true,
    },
    {
      code: "SOCIAL_ACTIVITIES",
      name: "Social Activities",
      description:
        "Organized social events, outings, and recreational activities",
      category: "Support Services",
      licenseTypes: ["144D", "245D", "CRS", "ALF"],
      isActive: true,
    },
    {
      code: "HOUSEKEEPING",
      name: "Housekeeping",
      description: "Light housekeeping and home maintenance services",
      category: "Support Services",
      licenseTypes: ["144D", "245D", "CRS"],
      isActive: true,
    },
    {
      code: "LAUNDRY",
      name: "Laundry Services",
      description: "Assistance with laundry and clothing care",
      category: "Support Services",
      licenseTypes: ["144D", "245D", "CRS"],
      isActive: true,
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { code: service.code },
      update: service,
      create: service,
    });
    console.log(`  ✓ ${service.name}`);
  }
  console.log(`✅ ${services.length} services seeded\n`);

  // ============================================
  // 2. SEED SUPER ADMIN USER
  // ============================================
  console.log("👤 Seeding super admin user...");
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@carelinkmn.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@123456";
  const hashedPassword = await hashPassword(adminPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      firstName: "System",
      lastName: "Administrator",
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: "System",
      lastName: "Administrator",
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
  });
  console.log(`  ✓ Super Admin created: ${adminEmail}`);
  console.log(
    `  ⚠️  Default password: ${adminPassword} (change in production!)\n`
  );

  // ============================================
  // 3. SEED TEST DATA (Optional - Development Only)
  // ============================================
  const seedTestData = process.env.SEED_TEST_DATA === "true";

  if (seedTestData) {
    console.log("🧪 Seeding test data for development...\n");

    // Create test organization
    console.log("📋 Creating test organization...");
    const testOrg = await prisma.organization.upsert({
      where: { ein: "12-3456789" },
      update: {},
      create: {
        name: "CareLinkMN Test Provider",
        type: OrganizationType.PROVIDER,
        ein: "12-3456789",
        npi: "1234567890",
        status: OrganizationStatus.VERIFIED,
        verifiedAt: new Date(),
        verifiedBy: adminUser.id,
        email: "test@carelinkmn.com",
        phone: "(612) 555-0100",
        addressLine1: "123 Test Street",
        city: "Minneapolis",
        state: "MN",
        zipCode: "55401",
        county: "Hennepin",
      },
    });
    console.log(`  ✓ Test Organization: ${testOrg.name}\n`);

    // Create test provider user
    console.log("👥 Creating test provider user...");
    const testProviderPassword = await hashPassword("Provider@123456");
    const testProviderUser = await prisma.user.upsert({
      where: { email: "provider@carelinkmn.com" },
      update: {
        password: testProviderPassword,
        firstName: "Test",
        lastName: "Provider",
        role: UserRole.PROVIDER_OWNER,
        status: UserStatus.ACTIVE,
        organizationId: testOrg.id,
        emailVerified: new Date(),
      },
      create: {
        email: "provider@carelinkmn.com",
        password: testProviderPassword,
        firstName: "Test",
        lastName: "Provider",
        role: UserRole.PROVIDER_OWNER,
        status: UserStatus.ACTIVE,
        organizationId: testOrg.id,
        emailVerified: new Date(),
      },
    });
    console.log(`  ✓ Test Provider User: ${testProviderUser.email}`);
    console.log(`  ⚠️  Default password: Provider@123456\n`);

    // Create test provider
    console.log("🏥 Creating test provider...");
    let testProvider = await prisma.provider.findFirst({
      where: { organizationId: testOrg.id },
    });

    if (!testProvider) {
      testProvider = await prisma.provider.create({
        data: {
          organizationId: testOrg.id,
          primaryLicenseType: "245D",
          subscriptionTier: SubscriptionTier.FREE,
          verified: true,
          verifiedAt: new Date(),
          description:
            "A test provider organization for development and testing purposes.",
          acceptsReferrals: true,
          responseTimeHours: 24,
        },
      });
    }
    console.log(`  ✓ Test Provider created\n`);

    // Create onboarding state for test provider
    console.log("📝 Creating onboarding state...");
    await prisma.providerOnboardingState.upsert({
      where: { providerId: testProvider.id },
      update: {},
      create: {
        providerId: testProvider.id,
        currentStep: 4,
        completedSteps: [0, 1, 2, 3, 4],
        isComplete: true,
        adminReviewStatus: "APPROVED",
        reviewedBy: adminUser.id,
        reviewedAt: new Date(),
      },
    });
    console.log(`  ✓ Onboarding state created\n`);

    // Create test license
    console.log("📜 Creating test license...");
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    await prisma.license.upsert({
      where: {
        licenseNumber: "TEST-245D-001",
      },
      update: {},
      create: {
        providerId: testProvider.id,
        licenseType: "245D",
        licenseNumber: "TEST-245D-001",
        issueDate: new Date("2023-01-01"),
        expirationDate: futureDate,
        status: "ACTIVE",
        verifiedAt: new Date(),
        verifiedBy: adminUser.id,
      },
    });
    console.log(`  ✓ Test License created\n`);

    // Assign some services to test provider
    console.log("🔗 Assigning services to test provider...");
    const serviceCodes = [
      "ADL_BASIC",
      "MED_MGMT",
      "PERSONAL_CARE",
      "NUTRITION",
      "TRANSPORT",
    ];
    const assignedServices = await prisma.service.findMany({
      where: { code: { in: serviceCodes } },
    });

    for (const service of assignedServices) {
      await prisma.providerService.upsert({
        where: {
          providerId_serviceId: {
            providerId: testProvider.id,
            serviceId: service.id,
          },
        },
        update: {},
        create: {
          providerId: testProvider.id,
          serviceId: service.id,
          isActive: true,
        },
      });
    }
    console.log(`  ✓ ${assignedServices.length} services assigned\n`);

    // Create test home
    console.log("🏠 Creating test home...");
    const testHome = await prisma.home.create({
      data: {
        providerId: testProvider.id,
        name: "Sunset Care Home",
        addressLine1: "456 Care Avenue",
        addressLine2: "Suite 100",
        city: "St. Paul",
        state: "MN",
        zipCode: "55102",
        county: "Ramsey",
        latitude: 44.9537,
        longitude: -93.09,
        capacity: 20,
        currentOccupancy: 12,
        wheelchairAccessible: true,
        singleLevel: true,
        hasElevator: false,
        hasRollInShower: true,
        acceptingNew: true,
        isActive: true,
        amenities: {
          create: [
            {
              amenityType: "Private Room",
              description: "Private rooms available",
            },
            {
              amenityType: "Garden Access",
              description: "Beautiful garden area",
            },
            {
              amenityType: "Activity Room",
              description: "Common activity space",
            },
          ],
        },
        photos: {
          create: [
            {
              url: "https://via.placeholder.com/800x600?text=Sunset+Care+Home",
              caption: "Main entrance",
              isPrimary: true,
              order: 0,
            },
          ],
        },
        services: {
          create: assignedServices.map((service) => ({
            serviceId: service.id,
            isActive: true,
          })),
        },
      },
    });
    console.log(`  ✓ Test Home: ${testHome.name}\n`);

    console.log("✅ Test data seeded successfully!\n");
  } else {
    console.log("ℹ️  Skipping test data (set SEED_TEST_DATA=true to enable)\n");
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log("═══════════════════════════════════════");
  console.log("✅ Database seeding completed!");
  console.log("═══════════════════════════════════════");
  console.log(`📊 Services: ${services.length}`);
  console.log(`👤 Super Admin: ${adminEmail}`);
  if (seedTestData) {
    console.log(`🧪 Test Data: Enabled`);
  } else {
    console.log(`🧪 Test Data: Disabled (set SEED_TEST_DATA=true)`);
  }
  console.log("═══════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
