"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePaymentCapability = exports.requireVerifiedIdentity = exports.requireBasicAccess = void 0;
const user_1 = require("../types/user"); // ✅ Import correct
const requireBasicAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: User not found' });
    }
    next();
};
exports.requireBasicAccess = requireBasicAccess;
const requireVerifiedIdentity = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: User not found' });
    }
    if (req.user.verificationStatus !== user_1.UserVerificationStatus.VERIFIED) {
        return res.status(403).json({ message: 'Forbidden: Identity verification required' });
    }
    next();
};
exports.requireVerifiedIdentity = requireVerifiedIdentity;
// Middleware pour les actions de paiement
const requirePaymentCapability = async (req, res, next) => {
    try {
        const user = req.user;
        // Doit être vérifié ET avoir un customer Stripe
        if (user.verificationStatus !== user_1.UserVerificationStatus.VERIFIED ||
            !user.stripeCustomerId) {
            return res.status(403).json({
                error: "Vérification d'identité et configuration paiement requises",
                code: 'PAYMENT_SETUP_REQUIRED'
            });
        }
        next();
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur vérification paiement' });
    }
};
exports.requirePaymentCapability = requirePaymentCapability;
