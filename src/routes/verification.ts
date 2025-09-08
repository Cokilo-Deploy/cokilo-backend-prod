import express from 'express';
import { VerificationController } from '../controllers/VerificationController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Routes protégées par authentification
router.use(authMiddleware);

router.post('/start', VerificationController.startVerification);
router.get('/status', VerificationController.checkStatus);

// Webhook Stripe (pas d'auth requise - on retire le middleware pour cette route)
router.post('/webhook', express.raw({ type: 'application/json' }), VerificationController.stripeWebhook);
router.post('/verification/stripe-data', authMiddleware, VerificationController.submitStripeData);

export { router as verificationRouter };