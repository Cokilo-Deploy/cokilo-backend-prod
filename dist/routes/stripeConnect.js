"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/stripeConnect.ts
const express_1 = __importDefault(require("express"));
const stripeConnectController_1 = require("../controllers/stripeConnectController");
const auth_1 = require("../middleware/auth"); // Correction ici
const router = express_1.default.Router();
// Toutes les routes nécessitent une authentification
router.use(auth_1.authMiddleware); // Correction ici
// Initier l'onboarding Stripe Connect
router.post('/onboarding', stripeConnectController_1.StripeConnectController.initiateOnboarding);
// Vérifier le statut du compte Connect
router.get('/status', stripeConnectController_1.StripeConnectController.getAccountStatus);
// Mettre à jour le pays (pour déterminer la méthode de paiement)
router.put('/country', stripeConnectController_1.StripeConnectController.updateCountry);
// Informations de paiement
router.get('/payment-info', stripeConnectController_1.StripeConnectController.getPaymentInfo);
// Déconnecter le compte Connect
router.delete('/disconnect', stripeConnectController_1.StripeConnectController.disconnectAccount);
exports.default = router;
