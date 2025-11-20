import { db } from "@carelink/database";
import { User, UserRole, Organization } from "@prisma/client";
import { UserStatus } from "@carelink/types";
import { RegisterRequest } from "../types/auth";
import crypto from "crypto";

const DEFAULT_PASSWORD_RESET_TTL =
  Number(process.env.PASSWORD_RESET_TOKEN_TTL_MS) || 24 * 60 * 60 * 1000; // 24 hours

export class AuthRepository {
  // User operations
  async createUser(
    userData: RegisterRequest & { hashedPassword: string }
  ): Promise<User & { organization: any }> {
    return await db.user.create({
      data: {
        email: userData.email,
        password: userData.hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role,
        organizationId: undefined,
        status: UserStatus.PENDING_VERIFICATION,
      },
      include: {
        organization: true,
      },
    });
  }

  async findUserByEmail(
    email: string
  ): Promise<(User & { organization: any }) | null> {
    return await db.user.findUnique({
      where: { email },
      include: {
        organization: true,
      },
    });
  }

  async findUserById(
    id: string
  ): Promise<(User & { organization: any }) | null> {
    return await db.user.findUnique({
      where: { id },
      include: {
        organization: true,
      },
    });
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User> {
    return await db.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });
  }

  async updateUserLastLogin(id: string): Promise<User> {
    return await db.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  async verifyUserEmail(id: string): Promise<User> {
    return await db.user.update({
      where: { id },
      data: {
        emailVerified: new Date(),
        status: UserStatus.ACTIVE,
      },
    });
  }

  // Organization operations
  async findOrganizationById(id: string): Promise<Organization | null> {
    return await db.organization.findUnique({
      where: { id },
    });
  }

  async findOrganizationsByType(type: string): Promise<Organization[]> {
    return await db.organization.findMany({
      where: { type: type as any },
      orderBy: { name: "asc" },
    });
  }

  // Password reset operations
  async createPasswordResetToken(
    userId: string,
    options?: {
      expiresInMs?: number;
    }
  ): Promise<string> {
    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const ttl = options?.expiresInMs ?? DEFAULT_PASSWORD_RESET_TTL;
    const expiresAt = new Date(Date.now() + ttl);

    // Delete any existing reset tokens for this user
    await db.passwordResetToken.deleteMany({
      where: { userId },
    });

    // Create new token
    await db.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }

  async findUserByResetToken(token: string): Promise<User | null> {
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt < new Date() || resetToken.usedAt) {
      return null;
    }

    return resetToken.user;
  }

  async usePasswordResetToken(token: string): Promise<void> {
    await db.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    });
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    await db.passwordResetToken.deleteMany({
      where: { userId },
    });
  }

  async cleanupExpiredPasswordResetTokens(): Promise<number> {
    const result = await db.passwordResetToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }

  // Email verification operations
  async createEmailVerificationToken(userId: string): Promise<string> {
    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete any existing verification tokens for this user
    await db.emailVerificationToken.deleteMany({
      where: { userId },
    });

    // Create new token
    await db.emailVerificationToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }

  async findUserByVerificationToken(token: string): Promise<User | null> {
    const verificationToken = await db.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (
      !verificationToken ||
      verificationToken.expiresAt < new Date() ||
      verificationToken.verifiedAt
    ) {
      return null;
    }

    return verificationToken.user;
  }

  async useEmailVerificationToken(token: string): Promise<void> {
    await db.emailVerificationToken.update({
      where: { token },
      data: { verifiedAt: new Date() },
    });
  }

  async clearEmailVerificationToken(userId: string): Promise<void> {
    await db.emailVerificationToken.deleteMany({
      where: { userId },
    });
  }

  async cleanupExpiredEmailVerificationTokens(): Promise<number> {
    const result = await db.emailVerificationToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }

  // Phone verification methods
  async verifyUserPhone(id: string): Promise<User> {
    return await db.user.update({
      where: { id },
      data: { phoneVerified: new Date() },
    });
  }

  async storePhoneVerificationCode(
    userId: string,
    code: string
  ): Promise<void> {
    // In a real implementation, this would store in Redis with TTL
    // For now, we'll use a simple in-memory store or database
    console.log(`Storing phone verification code for user ${userId}: ${code}`);
  }

  async verifyPhoneCode(userId: string, code: string): Promise<boolean> {
    // In a real implementation, this would check Redis
    // For now, we'll accept any 6-digit code in development
    if (process.env.NODE_ENV === "development") {
      return /^\d{6}$/.test(code);
    }
    return false;
  }

  // User management methods
  async updateUser(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      notificationPreferences?: any; // Prisma JSON type
    }>
  ): Promise<User> {
    return await db.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async updateUserStatus(id: string, status: UserStatus): Promise<User> {
    return await db.user.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  // Audit logging
  async logAuthEvent(
    userId: string,
    event: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    result: "SUCCESS" | "FAILURE" | "ERROR" = "SUCCESS"
  ): Promise<void> {
    await db.auditLog.create({
      data: {
        userId,
        action: event,
        resourceType: "User",
        resourceId: userId,
        metadata: details || {},
        ipAddress: ipAddress || "unknown",
        userAgent: userAgent || "unknown",
        result,
      },
    });
  }
}
