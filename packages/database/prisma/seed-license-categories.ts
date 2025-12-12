import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed script to migrate existing static license types to database
 * This creates the license categories and types based on the current LICENSE_TYPES constant
 */

interface LicenseCategoryData {
  code: string;
  name: string;
  description?: string;
  order: number;
  types: Array<{
    code: string;
    name: string;
    description?: string;
    order: number;
  }>;
}

const SEED_DATA: LicenseCategoryData[] = [
  {
    code: "ASSISTED_LIVING",
    name: "Assisted Living",
    description: "Facilities providing assisted living services",
    order: 1,
    types: [
      {
        code: "144D",
        name: "144D - Assisted Living (Dementia Care)",
        description: "Assisted Living facility with specialized dementia care",
        order: 1,
      },
      {
        code: "ALF",
        name: "ALF - Assisted Living Facility",
        description: "Standard Assisted Living Facility",
        order: 2,
      },
    ],
  },
  {
    code: "COMMUNITY_RESIDENTIAL",
    name: "Community Residential",
    description: "Community-based residential services",
    order: 2,
    types: [
      {
        code: "245D_BASIC",
        name: "245D Basic",
        description: "Basic community residential services under 245D",
        order: 1,
      },
      {
        code: "245D_INTENSIVE",
        name: "245D Intensive",
        description: "Intensive community residential services under 245D",
        order: 2,
      },
      {
        code: "CRS",
        name: "CRS - Community Residential Services",
        description: "Community Residential Services",
        order: 3,
      },
    ],
  },
  {
    code: "RESIDENTIAL",
    name: "Residential",
    description: "Residential care facilities",
    order: 3,
    types: [
      {
        code: "ICF_DD",
        name: "ICF/DD - Intermediate Care Facility",
        description: "Intermediate Care Facility for Developmental Disabilities",
        order: 1,
      },
    ],
  },
  {
    code: "INDEPENDENT_LIVING",
    name: "Independent Living",
    description: "Semi-independent living services",
    order: 4,
    types: [
      {
        code: "SIL",
        name: "SIL - Semi-Independent Living",
        description: "Semi-Independent Living services",
        order: 1,
      },
    ],
  },
  {
    code: "OTHER",
    name: "Other",
    description: "Other license types not categorized above",
    order: 5,
    types: [
      {
        code: "OTHER",
        name: "Other",
        description: "Other license type",
        order: 1,
      },
    ],
  },
];

async function seedLicenseCategories() {
  console.log("🌱 Starting license categories and types seed...");

  try {
    // Create categories and types
    for (const categoryData of SEED_DATA) {
      console.log(`\n📁 Creating category: ${categoryData.name}`);

      // Check if category already exists
      const existingCategory = await prisma.licenseCategory.findUnique({
        where: { code: categoryData.code },
      });

      let category;
      if (existingCategory) {
        console.log(`  ℹ️  Category already exists, skipping...`);
        category = existingCategory;
      } else {
        category = await prisma.licenseCategory.create({
          data: {
            code: categoryData.code,
            name: categoryData.name,
            description: categoryData.description,
            order: categoryData.order,
            isActive: true,
          },
        });
        console.log(`  ✅ Created category: ${category.name}`);
      }

      // Create license types for this category
      for (const typeData of categoryData.types) {
        const existingType = await prisma.licenseType.findUnique({
          where: { code: typeData.code },
        });

        if (existingType) {
          console.log(`    ℹ️  License type ${typeData.code} already exists, skipping...`);
        } else {
          const licenseType = await prisma.licenseType.create({
            data: {
              categoryId: category.id,
              code: typeData.code,
              name: typeData.name,
              description: typeData.description,
              order: typeData.order,
              isActive: true,
            },
          });
          console.log(`    ✅ Created license type: ${licenseType.name}`);
        }
      }
    }

    console.log("\n✨ Seed completed successfully!");
    console.log("\n📊 Summary:");

    const categoryCount = await prisma.licenseCategory.count();
    const typeCount = await prisma.licenseType.count();

    console.log(`  - Categories: ${categoryCount}`);
    console.log(`  - License Types: ${typeCount}`);
  } catch (error) {
    console.error("\n❌ Error seeding license categories:", error);
    throw error;
  }
}

// Run the seed function
seedLicenseCategories()
  .then(() => {
    console.log("\n🎉 Seed script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seed script failed:", error);
    process.exit(1);
  });
