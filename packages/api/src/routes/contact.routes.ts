import { Router, type IRouter } from "express";
import { submitContactForm } from "../controllers/contact.controller";

const router: IRouter = Router();

/**
 * @route   POST /api/contact/submit
 * @desc    Submit contact form
 * @access  Public
 */
router.post("/submit", submitContactForm);

export default router;
