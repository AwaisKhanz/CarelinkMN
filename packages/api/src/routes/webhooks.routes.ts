import express, { Router } from 'express';
import { BillingController } from '../controllers/billing.controller';

const router: Router = Router();
const controller = new BillingController();

// Stripe requires the raw body to validate the signature
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  controller.handleStripeWebhook
);

export default router;


