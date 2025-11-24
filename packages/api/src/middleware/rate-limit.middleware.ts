import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

/**
 * Rate limiter for login attempts
 * Prevents brute-force attacks on login endpoint
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 45, // Limit each IP to 5 login requests per windowMs
  message: {
    success: false,
    error: "Too many login attempts",
    message: "Too many login attempts from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count successful requests
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: "Too many login attempts",
      message: "Too many login attempts from this IP, please try again after 15 minutes",
    });
  },
});

/**
 * Rate limiter for password reset requests
 * Prevents abuse of forgot password endpoint
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: "Too many password reset requests",
    message: "Too many password reset requests from this IP, please try again after an hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: "Too many password reset requests",
      message: "Too many password reset requests from this IP, please try again after an hour",
    });
  },
});

/**
 * Rate limiter for password reset confirmation
 * Prevents brute-force attacks on reset token
 */
export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 reset attempts per windowMs
  message: {
    success: false,
    error: "Too many password reset attempts",
    message: "Too many password reset attempts from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: "Too many password reset attempts",
      message: "Too many password reset attempts from this IP, please try again after 15 minutes",
    });
  },
});

/**
 * Rate limiter for email verification requests
 * Prevents spam of verification emails
 */
export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 verification email requests per hour
  message: {
    success: false,
    error: "Too many verification email requests",
    message: "Too many verification email requests from this IP, please try again after an hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: "Too many verification email requests",
      message: "Too many verification email requests from this IP, please try again after an hour",
    });
  },
});

/**
 * General API rate limiter
 * Applies to all API endpoints as a baseline protection
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: "Too many requests",
    message: "Too many requests from this IP, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: "Too many requests",
      message: "Too many requests from this IP, please try again later",
    });
  },
});
