"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationRouter = void 0;
const express_1 = __importDefault(require("express"));
const VerificationController_1 = require("../controllers/VerificationController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
exports.verificationRouter = router;
// Routes protégées par authentification
router.use(auth_1.authMiddleware);
router.post('/start', VerificationController_1.VerificationController.startVerification);
router.get('/status', VerificationController_1.VerificationController.checkStatus);
// Webhook Stripe (pas d'auth requise - on retire le middleware pour cette route)
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), VerificationController_1.VerificationController.stripeWebhook);
console.log('Routes de vérification chargées');
router.post('/stripe-data', auth_1.authMiddleware, VerificationController_1.VerificationController.submitStripeData);
