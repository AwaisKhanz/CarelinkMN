import { Request, Response } from "express";
import { VRSClientStatus, JobStatus, RetentionStatus } from "@prisma/client";
import { vrsService } from "../services/vrs.service";
import { ApiResponse } from "../types/common";

export class VRSController {
  async getClients(req: Request, res: Response) {
    try {
      const { page, limit, search, status, employerId } = req.query;
      const statusFilter =
        typeof status === "string" && status.length > 0
          ? (status as VRSClientStatus)
          : undefined;
      const result = await vrsService.getClients({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        status: statusFilter,
        employerId: employerId as string,
      });

      res.json({
        success: true,
        data: result,
        message: "Clients retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Failed to fetch VRS clients:", error);
      res.status(500).json({
        success: false,
        error: "FAILED_TO_FETCH_CLIENTS",
        message: "Could not fetch VRS clients",
      } as ApiResponse);
    }
  }

  async getClientById(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      const client = await vrsService.getClientById(clientId);

      if (!client) {
        res.status(404).json({
          success: false,
          error: "CLIENT_NOT_FOUND",
          message: "Client not found",
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: client,
        message: "Client retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Failed to fetch VRS client:", error);
      res.status(500).json({
        success: false,
        error: "FAILED_TO_FETCH_CLIENT",
        message: "Could not fetch VRS client",
      } as ApiResponse);
    }
  }

  async upsertClient(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      const client = await vrsService.upsertClient(req.body, clientId);
      res.json({
        success: true,
        data: client,
        message: "Client saved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Failed to save VRS client:", error);
      res.status(500).json({
        success: false,
        error: "FAILED_TO_SAVE_CLIENT",
        message: "Could not save VRS client",
      } as ApiResponse);
    }
  }

  async deleteClient(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      await vrsService.deleteClient(clientId);
      res.json({
        success: true,
        message: "Client deleted successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Failed to delete VRS client:", error);
      res.status(500).json({
        success: false,
        error: "FAILED_TO_DELETE_CLIENT",
        message: "Could not delete VRS client",
      } as ApiResponse);
    }
  }

  async getEmployers(req: Request, res: Response) {
    try {
      const { page, limit, search } = req.query;
      const result = await vrsService.getEmployers({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
      });

      res.json({
        success: true,
        data: result,
        message: "Employers retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Failed to fetch VRS employers:", error);
      res.status(500).json({
        success: false,
        error: "FAILED_TO_FETCH_EMPLOYERS",
        message: "Could not fetch VRS employers",
      } as ApiResponse);
    }
  }

  getEmployerById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { employerId } = req.params;
      const employer = await vrsService.getEmployerById(employerId);

      if (!employer) {
        res.status(404).json({
          success: false,
          error: "EMPLOYER_NOT_FOUND",
          message: "Employer not found",
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: employer,
        message: "Employer retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Failed to fetch employer:", error);
      res.status(500).json({
        success: false,
        error: "FAILED_TO_FETCH_EMPLOYER",
        message: "Could not fetch employer",
      } as ApiResponse);
    }
  };

  async upsertEmployer(req: Request, res: Response) {
    try {
      const { employerId } = req.params;
      const employer = await vrsService.upsertEmployer(req.body, employerId);
      res.json({
        success: true,
        data: employer,
        message: "Employer saved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Failed to save VRS employer:", error);
      res.status(500).json({
        success: false,
        error: "FAILED_TO_SAVE_EMPLOYER",
        message: "Could not save VRS employer",
      } as ApiResponse);
    }
  }

  async getJobs(req: Request, res: Response) {
    try {
      const { page, limit, search, status, employerId } = req.query;
      const statusFilter =
        typeof status === "string" && status.length > 0
          ? (status as JobStatus)
          : undefined;
      const result = await vrsService.getJobs({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        status: statusFilter,
        employerId: employerId as string,
      });

      res.json({
        success: true,
        data: result,
        message: "Jobs retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Failed to fetch VRS jobs:", error);
      res.status(500).json({
        success: false,
        error: "FAILED_TO_FETCH_JOBS",
        message: "Could not fetch VRS jobs",
      } as ApiResponse);
    }
  }

  getJobById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { jobId } = req.params;
      const job = await vrsService.getJobById(jobId);

      if (!job) {
        res.status(404).json({
          success: false,
          error: "JOB_NOT_FOUND",
          message: "Job not found",
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: job,
        message: "Job retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Failed to fetch job:", error);
      res.status(500).json({
        success: false,
        error: "FAILED_TO_FETCH_JOB",
        message: "Could not fetch job",
      } as ApiResponse);
    }
  };

  async upsertJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const job = await vrsService.upsertJob(req.body, jobId);
      res.json({
        success: true,
        data: job,
        message: "Job saved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Failed to save VRS job:", error);
      res.status(500).json({
        success: false,
        error: "FAILED_TO_SAVE_JOB",
        message: "Could not save VRS job",
      } as ApiResponse);
    }
  }

  async getPlacements(req: Request, res: Response) {
    try {
      const { page, limit, status } = req.query;
      const statusFilter =
        typeof status === "string" && status.length > 0
          ? (status as RetentionStatus)
          : undefined;
      const result = await vrsService.getPlacements({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        status: statusFilter,
      });

      res.json({
        success: true,
        data: result,
        message: "Placements retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Failed to fetch VRS placements:", error);
      res.status(500).json({
        success: false,
        error: "FAILED_TO_FETCH_PLACEMENTS",
        message: "Could not fetch VRS placements",
      } as ApiResponse);
    }
  }

  createPlacement = async (req: Request, res: Response): Promise<void> => {
    try {
      const { clientId, jobId, placementDate, startDate } = req.body;

      if (!clientId || !jobId || !placementDate) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "clientId, jobId, and placementDate are required",
        } as ApiResponse);
        return;
      }

      const placement = await vrsService.createPlacement({
        clientId,
        jobId,
        placementDate,
        startDate,
      });

      res.status(201).json({
        success: true,
        data: placement,
        message: "Placement created successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Failed to create placement:", error);
      res.status(500).json({
        success: false,
        error: "FAILED_TO_CREATE_PLACEMENT",
        message:
          error instanceof Error ? error.message : "Could not create placement",
      } as ApiResponse);
    }
  };

  async updatePlacementRetention(req: Request, res: Response) {
    try {
      const { placementId } = req.params;
      const { day30Status, day60Status, day90Status, endDate, endReason } =
        req.body;

      const retention = await vrsService.updatePlacementRetention(placementId, {
        day30Status: day30Status ?? null,
        day60Status: day60Status ?? null,
        day90Status: day90Status ?? null,
        endDate: endDate ? new Date(endDate) : undefined,
        endReason: endReason || undefined,
      });

      res.json({
        success: true,
        data: retention,
        message: "Placement retention updated successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Failed to update retention:", error);
      res.status(500).json({
        success: false,
        error: "FAILED_TO_UPDATE_RETENTION",
        message: "Could not update retention status",
      } as ApiResponse);
    }
  }

  async getAnalytics(req: Request, res: Response) {
    try {
      const analytics = await vrsService.getAnalytics();
      res.json({
        success: true,
        data: analytics,
        message: "Analytics retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Failed to fetch VRS analytics:", error);
      res.status(500).json({
        success: false,
        error: "FAILED_TO_FETCH_ANALYTICS",
        message: "Could not fetch analytics",
      } as ApiResponse);
    }
  }
}

export const vrsController = new VRSController();
