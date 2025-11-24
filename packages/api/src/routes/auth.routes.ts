import { Router } from "express";
import { body } from "express-validator";
import { AuthController } from "../controllers/auth.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  loginLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  emailVerificationLimiter,
} from "../middleware/rate-limit.middleware";
import {
  LoginSchema,
  RegisterSchema,
  ChangePasswordSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "../types/auth";

const router: Router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

// Public routes
router.post(
  "/register",
  validate([
    body("email").isEmail().normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      ),
    body("firstName").trim().isLength({ min: 1 }),
    body("lastName").trim().isLength({ min: 1 }),
    body("phone")
      .optional({ checkFalsy: true })
      .matches(/^[\d\s\-\+\(\)]+$/)
      .withMessage("Invalid phone number format"),
    body("role").isIn([
      "SUPER_ADMIN",
      "ADMIN",
      "PROVIDER_OWNER",
      "PROVIDER_STAFF",
      "CASE_MANAGER",
      "HOSPITAL_SW",
      "VRS_SPECIALIST",
      "VENDOR",
      "PUBLIC",
    ]),
  ]),
  authController.register
);

router.post(
  "/login",
  loginLimiter, // Rate limit login attempts
  validate([
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 1 }),
  ]),
  authController.login
);

router.post(
  "/forgot-password",
  forgotPasswordLimiter, // Rate limit password reset requests
  validate([body("email").isEmail().normalizeEmail()]),
  authController.forgotPassword
);

router.post(
  "/reset-password",
  resetPasswordLimiter, // Rate limit reset attempts
  validate([
    body("token").isLength({ min: 1 }),
    body("newPassword")
      .isLength({ min: 8 })
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      ),
  ]),
  authController.resetPassword
);

router.get("/verify-email", authController.verifyEmail);

router.post(
  "/resend-verification",
  emailVerificationLimiter, // Rate limit verification email requests
  validate([body("email").isEmail().normalizeEmail()]),
  authController.resendVerification
);

// Protected routes
router.post("/logout", authController.logout);

router.post(
  "/change-password",
  authMiddleware.requireAuth,
  validate([
    body("currentPassword").isLength({ min: 1 }),
    body("newPassword")
      .isLength({ min: 8 })
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      ),
  ]),
  authController.changePassword
);

router.get("/profile", authMiddleware.requireAuth, authController.getProfile);
router.get("/me", authMiddleware.requireAuth, authController.me);

// Phone verification routes
router.post(
  "/send-phone-verification",
  authMiddleware.requireAuth,
  validate([body("phoneNumber").isMobilePhone("en-US")]),
  authController.sendPhoneVerification
);

router.post(
  "/verify-phone",
  authMiddleware.requireAuth,
  validate([body("code").isLength({ min: 6, max: 6 }).isNumeric()]),
  authController.verifyPhone
);

export default router;
