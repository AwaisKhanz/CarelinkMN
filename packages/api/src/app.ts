import dotenv from "dotenv";

// Load environment variables FIRST before any other imports
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";

// Import routes
import authRoutes from "./routes/auth.routes";
import auditRoutes from "./routes/audit.routes";
import providerRoutes from "./routes/provider.routes";
import userRoutes from "./routes/user.routes";
import organizationRoutes from "./routes/organization.routes";
import caseManagerRoutes from "./routes/case-manager.routes";
import hospitalStaffRoutes from "./routes/hospital-staff.routes";
import vendorRoutes from "./routes/vendor.routes";
import homeRoutes from "./routes/home.routes";
import amenityRoutes from "./routes/amenity.routes";
import openingRoutes from "./routes/opening.routes";
import placementRoutes from "./routes/placement.routes";
import onboardingRoutes from "./routes/onboarding.routes";
import uploadRoutes from "./routes/upload.routes";
import billingRoutes from "./routes/billing.routes";
import webhooksRoutes from "./routes/webhooks.routes";
import serviceRoutes from "./routes/service.routes";
import analyticsRoutes from "./routes/analytics.routes";
import messagingRoutes from "./routes/messaging.routes";
import referralRoutes from "./routes/referral.routes";
import aiSearchRoutes from "./routes/ai-search.routes";
import notificationRoutes from "./routes/notification.routes";
import messageTemplateRoutes from "./routes/message-template.routes";
import dischargeCaseRoutes from "./routes/discharge-case.routes";

// Import middleware
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/validation.middleware";
import { AuthMiddleware } from "./middleware/auth.middleware";

const app: express.Application = express();
const authMiddleware = new AuthMiddleware();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://nominatim.openstreetmap.org", "https://*.openstreetmap.org"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: {
//     success: false,
//     error: "RATE_LIMIT_EXCEEDED",
//     message: "Too many requests from this IP, please try again later.",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use(limiter);

// // Stricter rate limiting for auth endpoints
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 14, // limit each IP to 5 auth requests per windowMs
//   message: {
//     success: false,
//     error: "AUTH_RATE_LIMIT_EXCEEDED",
//     message: "Too many authentication attempts, please try again later.",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// Webhooks must be mounted before body-parsers to preserve raw body
app.use("/api/webhooks", webhooksRoutes);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Lightweight performance monitoring (logs provider API latency; budget: 200ms p95 target)
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs =
      Number(process.hrtime.bigint() - start) / 1_000_000; // ns -> ms
    if (req.path.startsWith("/api/providers")) {
      const msg = `[Perf] ${req.method} ${req.path} ${durationMs.toFixed(1)}ms`;
      if (durationMs > 200) {
        console.warn(msg);
      } else {
        console.log(msg);
      }
    }
  });
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/users", authMiddleware.requireAuth, userRoutes);
// Public routes (no authentication required)
app.use("/api", organizationRoutes);
// Protected routes (authentication required)
app.use("/api", providerRoutes);
app.use("/api", caseManagerRoutes);
app.use("/api", hospitalStaffRoutes);
app.use("/api", vendorRoutes);
app.use("/api", homeRoutes);
app.use("/api", amenityRoutes);
app.use("/api", openingRoutes);
app.use("/api", placementRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api", serviceRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", messagingRoutes);
app.use("/api", referralRoutes);
app.use("/api", aiSearchRoutes);
app.use("/api", notificationRoutes);
app.use("/api", messageTemplateRoutes);
app.use("/api", dischargeCaseRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
