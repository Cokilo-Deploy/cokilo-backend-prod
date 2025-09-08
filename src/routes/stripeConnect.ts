// src/routes/stripeConnect.ts
import express from 'express';
import { StripeConnectController } from '../controllers/stripeConnectController';
import { authMiddleware } from '../middleware/auth'; // Correction ici

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware); // Correction ici

// Initier l'onboarding Stripe Connect
router.post('/onboarding', StripeConnectController.initiateOnboarding);

// Vérifier le statut du compte Connect
router.get('/status', StripeConnectController.getAccountStatus);

// Mettre à jour le pays (pour déterminer la méthode de paiement)
router.put('/country', StripeConnectController.updateCountry);

// Informations de paiement
router.get('/payment-info', StripeConnectController.getPaymentInfo);

// Déconnecter le compte Connect
router.delete('/disconnect', StripeConnectController.disconnectAccount);

export default router;