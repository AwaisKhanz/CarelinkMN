import { Request, Response } from "express";
import { auditService, AuditSearchCriteria } from "../services/audit.service";
import { ApiResponse } from "../types/common";
import { AuditResult } from "@prisma/client";

export class AuditController {
  constructor() {
    // Bind methods to preserve 'this' context
    this.searchLogs = this.searchLogs.bind(this);
    this.getStatistics = this.getStatistics.bind(this);
    this.exportLogs = this.exportLogs.bind(this);
    this.cleanupOldLogs = this.cleanupOldLogs.bind(this);
  }

  // Search audit logs with filtering
  async searchLogs(req: Request, res: Response): Promise<void> {
    try {
      const {
        userId,
        action,
        resourceType,
        resourceId,
        result,
        fromDate,
        toDate,
        ipAddress,
        limit = 50,
        offset = 0,
      } = req.query;

      const criteria: AuditSearchCriteria = {
        userId: userId as string,
        action: action as string,
        resourceType: resourceType as string,
        resourceId: resourceId as string,
        result: result as AuditResult,
        ipAddress: ipAddress as string,
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0,
      };

      if (fromDate) {
        criteria.fromDate = new Date(fromDate as string);
      }

      if (toDate) {
        criteria.toDate = new Date(toDate as string);
      }

      const results = await auditService.search(criteria);

      // Log this audit access
      await auditService.logSystem("audit.search", {
        searchCriteria: criteria,
        performedBy: (req as any).user?.id,
        resultsCount: results.logs.length,
      });

      res.status(200).json({
        success: true,
        data: results,
        message: "Audit logs retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Search audit logs error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to search audit logs",
        message: "An error occurred while searching audit logs",
      } as ApiResponse);
    }
  }

  // Get audit statistics for a date range
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { fromDate, toDate } = req.query;

      if (!fromDate || !toDate) {
        res.status(400).json({
          success: false,
          error: "Missing date range",
          message: "Both fromDate and toDate are required",
        } as ApiResponse);
        return;
      }

      const from = new Date(fromDate as string);
      const to = new Date(toDate as string);

      if (from >= to) {
        res.status(400).json({
          success: false,
          error: "Invalid date range",
          message: "fromDate must be before toDate",
        } as ApiResponse);
        return;
      }

      const statistics = await auditService.getStatistics(from, to);

      // Log this audit access
      await auditService.logSystem("audit.statistics", {
        dateRange: { from: from.toISOString(), to: to.toISOString() },
        performedBy: (req as any).user?.id,
      });

      res.status(200).json({
        success: true,
        data: statistics,
        message: "Audit statistics retrieved successfully",
      } as ApiResponse);
    } catch (error) {
      console.error("Get audit statistics error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get audit statistics",
        message: "An error occurred while retrieving audit statistics",
      } as ApiResponse);
    }
  }

  // Export audit logs for compliance
  async exportLogs(req: Request, res: Response): Promise<void> {
    try {
      const { fromDate, toDate, includeMetadata = false, format = "json" } = req.query;

      if (!fromDate || !toDate) {
        res.status(400).json({
          success: false,
          error: "Missing date range",
          message: "Both fromDate and toDate are required",
        } as ApiResponse);
        return;
      }

      const from = new Date(fromDate as string);
      const to = new Date(toDate as string);

      if (from >= to) {
        res.status(400).json({
          success: false,
          error: "Invalid date range",
          message: "fromDate must be before toDate",
        } as ApiResponse);
        return;
      }

      const logs = await auditService.exportForCompliance(
        from,
        to,
        includeMetadata === "true"
      );

      // Log this audit export
      await auditService.logSystem("audit.export", {
        dateRange: { from: from.toISOString(), to: to.toISOString() },
        format,
        includeMetadata: includeMetadata === "true",
        recordCount: logs.length,
        performedBy: (req as any).user?.id,
      });

      if (format === "csv") {
        // Convert to CSV format
        const headers = Object.keys(logs[0] || {});
        const csvContent = [
          headers.join(","),
          ...logs.map((log) =>
            headers.map((header) => {
              const value = (log as any)[header];
              // Escape CSV values
              return typeof value === "string" && value.includes(",")
                ? `"${value.replace(/"/g, '""')}"`
                : value;
            }).join(",")
          ),
        ].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="audit_logs_${from.toISOString().split("T")[0]}_to_${
            to.toISOString().split("T")[0]
          }.csv"`
        );
        res.send(csvContent);
      } else {
        // JSON format
        res.status(200).json({
          success: true,
          data: {
            logs,
            exportInfo: {
              fromDate: from.toISOString(),
              toDate: to.toISOString(),
              recordCount: logs.length,
              exportedAt: new Date().toISOString(),
              exportedBy: (req as any).user?.email,
            },
          },
          message: "Audit logs exported successfully",
        } as ApiResponse);
      }
    } catch (error) {
      console.error("Export audit logs error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to export audit logs",
        message: "An error occurred while exporting audit logs",
      } as ApiResponse);
    }
  }

  // Clean up old audit logs (admin only)
  async cleanupOldLogs(req: Request, res: Response): Promise<void> {
    try {
      const { retentionDays = 2555 } = req.body; // 7 years default

      const retentionDaysNum = parseInt(retentionDays as string);

      if (retentionDaysNum < 30) {
        res.status(400).json({
          success: false,
          error: "Invalid retention period",
          message: "Retention period must be at least 30 days",
        } as ApiResponse);
        return;
      }

      const deletedCount = await auditService.cleanup(retentionDaysNum);

      // Log this cleanup operation
      await auditService.logSystem("audit.cleanup", {
        retentionDays: retentionDaysNum,
        deletedRecords: deletedCount,
        performedBy: (req as any).user?.id,
      });

      res.status(200).json({
        success: true,
        data: { deletedCount },
        message: `Successfully cleaned up ${deletedCount} old audit records`,
      } as ApiResponse);
    } catch (error) {
      console.error("Cleanup audit logs error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to cleanup audit logs",
        message: "An error occurred while cleaning up audit logs",
      } as ApiResponse);
    }
  }
}