"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.errorHandler = void 0;
const errorHandler = (error, req, res, next) => {
    let { statusCode = 500, message } = error;
    // Erreurs de validation Sequelize
    if (error.name === 'SequelizeValidationError') {
        statusCode = 400;
        message = 'Données invalides';
    }
    // Erreurs JWT
    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Token invalide';
    }
    // Erreurs Stripe
    if (error.name === 'StripeError') {
        statusCode = 400;
        message = 'Erreur de paiement';
    }
    // Log des erreurs en développement
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Erreur:', error);
    }
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        },
    });
};
exports.errorHandler = errorHandler;
// src/middleware/notFound.ts
const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: `Route ${req.originalUrl} non trouvée`,
        },
    });
};
exports.notFound = notFound;
