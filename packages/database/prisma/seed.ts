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

}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
