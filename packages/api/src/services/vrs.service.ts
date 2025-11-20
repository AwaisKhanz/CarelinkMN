import { db } from "@carelink/database";
import {
  Prisma,
  VRSClientStatus,
  RetentionStatus,
  JobStatus,
} from "@prisma/client";

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface VRSClientFilters extends PaginationParams {
  status?: VRSClientStatus;
  employerId?: string;
}

export interface VRSJobFilters extends PaginationParams {
  status?: JobStatus;
  employerId?: string;
}

export interface VRSPlacementFilters extends PaginationParams {
  status?: RetentionStatus;
}

export class VRSService {
  async getClients(filters: VRSClientFilters = {}) {
    const { page = 1, limit = 20, search, status, employerId } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.VRSClientWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (employerId) {
      where.placements = {
        some: {
          job: {
            employerId,
          },
        },
      };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [clients, total] = await Promise.all([
      db.vRSClient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          placements: {
            orderBy: { placementDate: "desc" },
            take: 1,
            include: {
              job: {
                include: {
                  employer: {
                    select: {
                      id: true,
                      companyName: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      db.vRSClient.count({ where }),
    ]);

    return {
      clients,
      pagination: this.buildPagination(page, limit, total),
    };
  }

  async getClientById(clientId: string) {
    return db.vRSClient.findUnique({
      where: { id: clientId },
      include: {
        placements: {
          orderBy: { placementDate: "desc" },
          include: {
            job: {
              include: {
                employer: true,
              },
            },
          },
        },
      },
    });
  }

  async upsertClient(
    data:
      | Prisma.VRSClientUncheckedCreateInput
      | Prisma.VRSClientUncheckedUpdateInput,
    clientId?: string
  ) {
    if (clientId) {
      return db.vRSClient.update({
        where: { id: clientId },
        data: data as Prisma.VRSClientUncheckedUpdateInput,
      });
    }

    return db.vRSClient.create({
      data: data as Prisma.VRSClientUncheckedCreateInput,
    });
  }

  async deleteClient(clientId: string) {
    await db.vRSClient.delete({ where: { id: clientId } });
  }

  async getEmployers(filters: PaginationParams = {}) {
    const { page = 1, limit = 20, search } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.VRSEmployerWhereInput = {};

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { industry: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const [employers, total] = await Promise.all([
      db.vRSEmployer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          jobs: {
            select: {
              id: true,
              title: true,
              status: true,
            },
            take: 3,
            orderBy: { postedAt: "desc" },
          },
        },
      }),
      db.vRSEmployer.count({ where }),
    ]);

    return {
      employers,
      pagination: this.buildPagination(page, limit, total),
    };
  }

  async getEmployerById(employerId: string) {
    return db.vRSEmployer.findUnique({
      where: { id: employerId },
      include: {
        jobs: {
          select: {
            id: true,
            title: true,
            status: true,
          },
          take: 10,
          orderBy: { postedAt: "desc" },
        },
      },
    });
  }

  async upsertEmployer(
    data:
      | Prisma.VRSEmployerUncheckedCreateInput
      | Prisma.VRSEmployerUncheckedUpdateInput,
    employerId?: string
  ) {
    if (employerId) {
      return db.vRSEmployer.update({
        where: { id: employerId },
        data: data as Prisma.VRSEmployerUncheckedUpdateInput,
      });
    }

    return db.vRSEmployer.create({
      data: data as Prisma.VRSEmployerUncheckedCreateInput,
    });
  }

  async getJobs(filters: VRSJobFilters = {}) {
    const { page = 1, limit = 20, search, status, employerId } = filters;

    const skip = (page - 1) * limit;
    const where: Prisma.VRSJobWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (employerId) {
      where.employerId = employerId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [jobs, total] = await Promise.all([
      db.vRSJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { postedAt: "desc" },
        include: {
          employer: {
            select: {
              id: true,
              companyName: true,
              industry: true,
            },
          },
        },
      }),
      db.vRSJob.count({ where }),
    ]);

    return {
      jobs,
      pagination: this.buildPagination(page, limit, total),
    };
  }

  async getJobById(jobId: string) {
    return db.vRSJob.findUnique({
      where: { id: jobId },
      include: {
        employer: true,
        placements: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                status: true,
              },
            },
          },
          orderBy: { placementDate: "desc" },
        },
      },
    });
  }

  async upsertJob(
    data: Prisma.VRSJobUncheckedCreateInput | Prisma.VRSJobUncheckedUpdateInput,
    jobId?: string
  ) {
    if (jobId) {
      return db.vRSJob.update({
        where: { id: jobId },
        data: data as Prisma.VRSJobUncheckedUpdateInput,
      });
    }

    return db.vRSJob.create({
      data: data as Prisma.VRSJobUncheckedCreateInput,
    });
  }

  async getPlacements(filters: VRSPlacementFilters = {}) {
    const { page = 1, limit = 20, status } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.VRSPlacementWhereInput = {};

    if (status) {
      where.OR = [
        { day30Status: status },
        { day60Status: status },
        { day90Status: status },
      ];
    }

    const [placements, total] = await Promise.all([
      db.vRSPlacement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { placementDate: "desc" },
        include: {
          client: true,
          job: {
            include: { employer: true },
          },
        },
      }),
      db.vRSPlacement.count({ where }),
    ]);

    return {
      placements,
      pagination: this.buildPagination(page, limit, total),
    };
  }

  async createPlacement(data: {
    clientId: string;
    jobId: string;
    placementDate: Date | string;
    startDate?: Date | string;
  }) {
    return db.vRSPlacement.create({
      data: {
        clientId: data.clientId,
        jobId: data.jobId,
        placementDate: new Date(data.placementDate),
        startDate: data.startDate ? new Date(data.startDate) : null,
      },
      include: {
        client: true,
        job: {
          include: {
            employer: true,
          },
        },
      },
    });
  }

  async updatePlacementRetention(
    placementId: string,
    retention: Partial<{
      day30Status?: RetentionStatus | null;
      day60Status?: RetentionStatus | null;
      day90Status?: RetentionStatus | null;
      endDate?: Date | null;
      endReason?: string | null;
    }>
  ) {
    return db.vRSPlacement.update({
      where: { id: placementId },
      data: {
        day30Status: retention.day30Status ?? undefined,
        day60Status: retention.day60Status ?? undefined,
        day90Status: retention.day90Status ?? undefined,
        endDate: retention.endDate ?? undefined,
        endReason: retention.endReason ?? undefined,
      },
    });
  }

  async getAnalytics() {
    const [
      totalClients,
      totalActiveJobs,
      placementsThisQuarter,
      retentionSummary,
    ] = await Promise.all([
      db.vRSClient.count(),
      db.vRSJob.count({ where: { status: JobStatus.OPEN } }),
      db.vRSPlacement.count({
        where: {
          placementDate: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      db.vRSPlacement.groupBy({
        by: ["day90Status"],
        _count: {
          day90Status: true,
        },
      }),
    ]);

    return {
      totalClients,
      totalActiveJobs,
      placementsThisQuarter,
      retention: retentionSummary,
    };
  }

  private buildPagination(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      pages: Math.max(Math.ceil(total / limit), 1),
    };
  }
}

export const vrsService = new VRSService();
