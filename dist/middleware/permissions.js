"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireVerifiedIdentity = exports.requireBasicAccess = void 0;
const userAccess_1 = require("../utils/userAccess");
const requireBasicAccess = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentification requise'
        });
    }
    if (!req.user.canViewTrips()) {
        return res.status(403).json({
            success: false,
            error: 'Accès refusé'
        });
    }
    next();
};
exports.requireBasicAccess = requireBasicAccess;
const requireVerifiedIdentity = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentification requise'
        });
    }
    if (!req.user.canCreateTrip()) {
        const userAccess = (0, userAccess_1.getUserAccessInfo)(req.user);
        return res.status(403).json({
            success: false,
            error: 'Vérification d\'identité requise',
            code: 'IDENTITY_VERIFICATION_REQUIRED',
            userAccess,
            action: {
                type: 'VERIFY_IDENTITY',
                message: 'Vérifiez votre identité via Stripe Identity pour accéder à cette fonctionnalité',
                url: '/api/verification/start'
            }
        });
    }
    next();
};
exports.requireVerifiedIdentity = requireVerifiedIdentity;
