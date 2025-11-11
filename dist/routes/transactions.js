"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//src/routes/transactions.ts - ADAPTATION de ton fichier traductions.ts avec juste les imports ajoutés
const express_1 = require("express");
const stripe_1 = __importDefault(require("stripe"));
const models_1 = require("../models");
const TransactionController_1 = require("../controllers/TransactionController");
const auth_1 = require("../middleware/auth");
const transaction_1 = require("../types/transaction");
const ReviewController_1 = require("../controllers/ReviewController");
// AJOUT - Import pour traductions
const responseHelpers_1 = require("../utils/responseHelpers");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
});
const router = (0, express_1.Router)();
// Route de test (gardez-la) - MODIFIÉE pour utiliser sendLocalizedResponse
router.post('/test-simple', (req, res) => {
    console.log('🎯 Route test-simple appelée !');
    return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.operation_successful', { message: 'Route test-simple fonctionne !' }, 200, req.user);
});
// Route POST pour créer une transaction - MODIFIÉE pour utiliser le contrôleur adapté
router.post('/', async (req, res) => {
    try {
        console.log('🔄 Création nouvelle transaction...');
        console.log('🔄 Body reçu:', req.body);
        console.log('🔄 User:', req.user?.id);
        // MODIFIÉ - Utiliser le contrôleur adapté avec traductions
        return await TransactionController_1.TransactionController.createTransaction(req, res);
    }
    catch (error) {
        console.error('❌ Erreur création transaction:', error);
        // MODIFIÉ - Utiliser sendLocalizedResponse
        return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.error_creating_booking', { details: error.message }, 500, req.user);
    }
});
// Route GET - MODIFIÉE pour utiliser le contrôleur adapté
router.get('/', async (req, res) => {
    try {
        // MODIFIÉ - Utiliser le contrôleur adapté avec traductions
        return await TransactionController_1.TransactionController.getMyTransactions(req, res);
    }
    catch (error) {
        console.error('❌ Erreur récupération transactions:', error);
        return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.error_loading_transactions', null, 500, req.user);
    }
});
// Route confirm-pickup - TON CODE ORIGINAL conservé
router.post('/:id/confirm-pickup', auth_1.authMiddleware, async (req, res) => {
    console.log('Route confirm-pickup appelée !');
    try {
        const { id } = req.params;
        const { pickupCode } = req.body;
        console.log('ID reçu:', id);
        console.log('Code récupération reçu:', pickupCode);
        if (!req.user) {
            console.log('Utilisateur non authentifié');
            return res.status(401).json({ error: 'Utilisateur non authentifié' });
        }
        const userId = req.user.id;
        console.log('User ID:', userId);
        console.log('Vérification accès transaction...');
        const transaction = await models_1.Transaction.findOne({
            where: {
                id: id,
                travelerId: userId
            },
            include: [
                { model: models_1.User, as: 'traveler' },
                { model: models_1.User, as: 'sender' }
            ]
        });
        if (!transaction) {
            console.log('Transaction non trouvée ou accès refusé');
            return res.status(404).json({ error: 'Transaction non trouvée ou accès refusé' });
        }
        console.log('Transaction trouvée:', {
            id: transaction.id,
            status: transaction.status,
            pickupCode: transaction.pickupCode,
            travelerId: transaction.travelerId,
            senderId: transaction.senderId
        });
        if (transaction.pickupCode !== pickupCode) {
            console.log('Code de récupération incorrect');
            return res.status(400).json({
                error: 'Code de récupération incorrect'
            });
        }
        if (transaction.status !== 'payment_escrowed') {
            console.log('Statut invalide pour récupération:', transaction.status);
            return res.status(400).json({
                error: 'La transaction doit être payée pour être récupérée',
                currentStatus: transaction.status
            });
        }
        console.log('Mise à jour statut vers package_picked_up...');
        await transaction.update({
            status: transaction_1.TransactionStatus.PACKAGE_PICKED_UP,
            pickedUpAt: new Date()
        });
        console.log('Transaction mise à jour:', {
            id: transaction.id,
            newStatus: transaction.status,
            pickedUpAt: transaction.pickedUpAt
        });
        res.json({
            success: true,
            message: 'Récupération confirmée avec succès',
            transaction: {
                id: transaction.id,
                status: transaction.status,
                pickedUpAt: transaction.pickedUpAt,
                pickupCode: transaction.pickupCode,
                deliveryCode: transaction.deliveryCode,
                travelerName: `${transaction.traveler.firstName} ${transaction.traveler.lastName}`
            }
        });
        console.log('Réponse envoyée avec succès');
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error('Erreur dans confirm-pickup:', errorMessage);
        res.status(500).json({
            error: 'Erreur serveur lors de la confirmation',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
});
// TON CODE ORIGINAL conservé
router.post('/:id/confirm-delivery', auth_1.authMiddleware, TransactionController_1.TransactionController.confirmDelivery);
// TON CODE ORIGINAL conservé
router.post('/:id/payment-intent', auth_1.authMiddleware, async (req, res) => {
    try {
        const transactionId = req.params.id;
        const userId = req.user?.id;
        const transaction = await models_1.Transaction.findOne({
            where: { id: transactionId, senderId: userId }
        });
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction non trouvée'
            });
        }
        const randomSuffix = Math.random().toString(36).substring(2, 15);
        const timestamp = Date.now().toString();
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(parseFloat(transaction.amount.toString()) * 100),
            currency: 'eur',
            automatic_payment_methods: { enabled: true },
            description: `Cokilo-Prod-${timestamp}-${randomSuffix}`,
            metadata: {
                app_transaction_id: transactionId.toString(),
                user_id: userId.toString(),
                environment: 'production',
                created_at: new Date().toISOString()
            },
        });
        await transaction.update({
            status: transaction_1.TransactionStatus.PAYMENT_ESCROWED,
            stripePaymentIntentId: paymentIntent.id
        });
        console.log('Payment Intent créé:', paymentIntent.id);
        res.json({
            success: true,
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id
        });
    }
    catch (error) {
        console.error('Erreur Payment Intent:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur création payment intent'
        });
    }
});
// TON CODE ORIGINAL conservé    
router.post('/:id/confirm-payment', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentIntentId } = req.body;
        const userId = req.user?.id;
        console.log('Confirmation paiement pour transaction:', id);
        console.log('PaymentIntent ID:', paymentIntentId);
        const transaction = await models_1.Transaction.findOne({
            where: { id: id, senderId: userId }
        });
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction non trouvée'
            });
        }
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status === 'succeeded') {
            await transaction.update({
                status: transaction_1.TransactionStatus.PAYMENT_ESCROWED,
                stripePaymentIntentId: paymentIntentId
            });
            console.log('Statut transaction mis à jour vers PAYMENT_ESCROWED');
            res.json({
                success: true,
                message: 'Paiement confirmé avec succès'
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: 'Paiement non confirmé côté Stripe'
            });
        }
    }
    catch (error) {
        console.error('Erreur confirmation paiement:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la confirmation du paiement'
        });
    }
});
// TON CODE ORIGINAL conservé
router.delete('/:id/cancel', auth_1.authMiddleware, TransactionController_1.TransactionController.cancelTransaction);
// TON CODE ORIGINAL conservé
router.post('/reviews', auth_1.authMiddleware, ReviewController_1.ReviewController.createReview);
router.get('/users/:userId/reviews', ReviewController_1.ReviewController.getUserReviews);
router.get('/transactions/:transactionId/reviews', auth_1.authMiddleware, ReviewController_1.ReviewController.getTransactionReviews);
exports.default = router;
