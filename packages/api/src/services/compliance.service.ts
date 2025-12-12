import { db } from "@carelink/database";
import { LicenseStatus } from "@carelink/types";

export interface ComplianceIssue {
  id: string;
  type: "EXPIRED_LICENSE" | "EXPIRING_LICENSE" | "PENDING_VERIFICATION" | "MISSING_LICENSE";
  severity: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  resourceType: "License" | "Organization" | "Provider";
  resourceId: string;
  resourceName: string;
  organizationId?: string;
  organizationName?: string;
  dueDate?: Date;
  createdAt: Date;
}

export class ComplianceService {
  /**
   * Get all compliance issues
   */
  async getComplianceIssues(): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    // Get expired licenses
    const expiredLicenses = await db.license.findMany({
      where: {
        expirationDate: {
          lt: new Date(),
        },
        status: {
          not: LicenseStatus.EXPIRED,
        },
      },
      include: {
        licenseType: true,
        provider: {
          include: {
            organization: true,
          },
        },
      },
    });

    for (const license of expiredLicenses) {
      issues.push({
        id: `expired-license-${license.id}`,
        type: "EXPIRED_LICENSE",
        severity: "HIGH",
        title: "Expired License",
        description: `License ${license.licenseType?.name || 'Unknown'} (${license.licenseNumber}) has expired`,
        resourceType: "License",
        resourceId: license.id,
        resourceName: `${license.licenseType?.name || 'Unknown'} - ${license.licenseNumber}`,
        organizationId: license.provider.organizationId,
        organizationName: license.provider.organization.name,
        dueDate: license.expirationDate,
        createdAt: license.expirationDate,
      });
    }

    // Get licenses expiring in next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringLicenses = await db.license.findMany({
      where: {
        expirationDate: {
          gte: new Date(),
          lte: thirtyDaysFromNow,
        },
        status: LicenseStatus.ACTIVE,
      },
      include: {
        licenseType: true,
        provider: {
          include: {
            organization: true,
          },
        },
      },
    });

    for (const license of expiringLicenses) {
      issues.push({
        id: `expiring-license-${license.id}`,
        type: "EXPIRING_LICENSE",
        severity: "MEDIUM",
        title: "License Expiring Soon",
        description: `License ${license.licenseType?.name || 'Unknown'} (${license.licenseNumber}) expires soon`,
        resourceType: "License",
        resourceId: license.id,
        resourceName: `${license.licenseType?.name || 'Unknown'} - ${license.licenseNumber}`,
        organizationId: license.provider.organizationId,
        organizationName: license.provider.organization.name,
        dueDate: license.expirationDate,
        createdAt: new Date(),
      });
    }

    // Get pending license verifications
    const pendingLicenses = await db.license.findMany({
      where: {
        status: LicenseStatus.PENDING,
      },
      include: {
        licenseType: true,
        provider: {
          include: {
            organization: true,
          },
        },
      },
    });

    for (const license of pendingLicenses) {
      issues.push({
        id: `pending-verification-${license.id}`,
        type: "PENDING_VERIFICATION",
        severity: "MEDIUM",
        title: "Pending License Verification",
        description: `License ${license.licenseType?.name || 'Unknown'} (${license.licenseNumber}) awaiting verification`,
        resourceType: "License",
        resourceId: license.id,
        resourceName: `${license.licenseType?.name || 'Unknown'} - ${license.licenseNumber}`,
        organizationId: license.provider.organizationId,
        organizationName: license.provider.organization.name,
        createdAt: license.createdAt,
      });
    }

    // Get providers without licenses
    const providersWithoutLicenses = await db.provider.findMany({
      where: {
        licenses: {
          none: {},
        },
        verified: true, // Only flag verified providers
      },
      include: {
        organization: true,
      },
    });

    for (const provider of providersWithoutLicenses) {
      issues.push({
        id: `missing-license-${provider.id}`,
        type: "MISSING_LICENSE",
        severity: "HIGH",
        title: "Missing License",
        description: `Provider has no licenses on file`,
        resourceType: "Provider",
        resourceId: provider.id,
        resourceName: provider.organization.name,
        organizationId: provider.organizationId,
        organizationName: provider.organization.name,
        createdAt: new Date(),
      });
    }

    // Sort by severity and date
    return issues.sort((a, b) => {
      const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * Get compliance statistics
   */
  async getComplianceStats() {
    const [
      totalLicenses,
      expiredLicenses,
      expiringLicenses,
      pendingVerifications,
      providersWithoutLicenses,
    ] = await Promise.all([
      db.license.count(),
      db.license.count({
        where: {
          expirationDate: { lt: new Date() },
          status: { not: LicenseStatus.EXPIRED },
        },
      }),
      db.license.count({
        where: {
          expirationDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          status: LicenseStatus.ACTIVE,
        },
      }),
      db.license.count({
        where: { status: LicenseStatus.PENDING },
      }),
      db.provider.count({
        where: {
          licenses: { none: {} },
          verified: true,
        },
      }),
    ]);

    const totalIssues =
      expiredLicenses +
      expiringLicenses +
      pendingVerifications +
      providersWithoutLicenses;

    const complianceRate =
      totalLicenses > 0
        ? ((totalLicenses - expiredLicenses - pendingVerifications) / totalLicenses) * 100
        : 100;

    return {
      totalLicenses,
      expiredLicenses,
      expiringLicenses,
      pendingVerifications,
      providersWithoutLicenses,
      totalIssues,
      complianceRate: Math.round(complianceRate * 10) / 10,
    };
  }
}

export const complianceService = new ComplianceService();
