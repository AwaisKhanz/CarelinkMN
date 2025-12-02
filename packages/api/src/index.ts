import app from "./app";
import { db } from "@carelink/database";
import * as cron from "node-cron";
import { ScheduledJobService } from "./services/scheduled-job.service";
import { initializeSocketServer } from "./websocket/socket.server";
import { getJobScheduler } from "./jobs";

const PORT = process.env.API_PORT || process.env.PORT || 3001;
const scheduledJobService = new ScheduledJobService();

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    // Close database connection
    await db.$disconnect();
    console.log("Database connection closed.");

    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await db.$connect();
    console.log("✅ Database connected successfully");

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 API server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
      console.log(`📋 Audit endpoints: http://localhost:${PORT}/api/audit`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });

    // Initialize Socket.IO
    initializeSocketServer(server);

    // Schedule background jobs
    // Run every hour: enforce opening freshness and check license expiry
    cron.schedule("0 * * * *", async () => {
      console.log("[Cron] Running scheduled jobs...");
      try {
        await scheduledJobService.runAllJobs();
      } catch (error) {
        console.error("[Cron] Error running scheduled jobs:", error);
      }
    });

    // Serve Next.js static files in production
    if (process.env.NODE_ENV === 'production') {
      const path = require('path');
      const express = require('express');
      
      // Serve Next.js static files
      const nextStaticPath = path.join(__dirname, '../../apps/web/.next/static');
      const nextPublicPath = path.join(__dirname, '../../apps/web/public');
      
      app.use('/_next/static', express.static(nextStaticPath));
      app.use('/public', express.static(nextPublicPath));
      
      // Serve Next.js pages (this should be after all API routes)
      app.get('*', (req, res) => {
        // Skip API routes and socket.io
        if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
          return res.status(404).json({ error: 'Not found' });
        }
        
        // Serve Next.js index.html for all other routes
        const indexPath = path.join(__dirname, '../../apps/web/out/index.html');
        res.sendFile(indexPath, (err) => {
          if (err) {
            res.status(404).send('Page not found');
          }
        });
      });
      
      console.log('📦 Serving Next.js static files from Express');
    }

    // Start placement notification jobs
    getJobScheduler().start();

    console.log("✅ Scheduled jobs initialized (running every hour)");
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("UNHANDLED_REJECTION");
});

// Start the server
startServer();
