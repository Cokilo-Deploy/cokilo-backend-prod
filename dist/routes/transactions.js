"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stripe_1 = __importDefault(require("stripe"));
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const TransactionController_1 = require("../controllers/TransactionController");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database"); // Ajustez le chemin selon votre structure
const walletService_1 = require("../services/walletService");
const transaction_1 = require("../types/transaction");
const ReviewController_1 = require("../controllers/ReviewController");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-07-30.basil',
});
const router = (0, express_1.Router)();
// Route de test (gardez-la)
router.post('/test-simple', (req, res) => {
    console.log('🎯 Route test-simple appelée !');
    res.json({
        success: true,
        message: 'Route test-simple fonctionne !'
    });
});
// Route POST pour créer une transaction
router.post('/', async (req, res) => {
    try {
        console.log('🔄 Création nouvelle transaction...');
        console.log('🔄 Body reçu:', req.body);
        console.log('🔄 User:', req.user?.id);
        // Appeler votre TransactionController existant
        return await TransactionController_1.TransactionController.createTransaction(req, res);
    }
    catch (error) {
        console.error('❌ Erreur création transaction:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur création transaction'
        });
    }
});
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        console.log('📦 Récupération transactions pour user:', userId);
        const transactions = await models_1.Transaction.findAll({
            where: {
                // Transactions où l'user est expéditeur OU voyageur
                [sequelize_1.Op.or]: [
                    { senderId: userId },
                    { travelerId: userId }
                ]
            },
            include: [
                { model: models_1.User, as: 'sender' },
                { model: models_1.User, as: 'traveler' },
                { model: models_1.Trip, as: 'trip' }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json({
            success: true,
            data: {
                transactions
            }
        });
    }
    catch (error) {
        console.error('❌ Erreur récupération transactions:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur récupération transactions'
        });
    }
});
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
        // Vérification que la transaction existe et que l'utilisateur a accès
        const checkQuery = `
     SELECT 
       t.*,
       traveler."firstName" as traveler_first_name,
       traveler."lastName" as traveler_last_name
     FROM transactions t 
     LEFT JOIN users traveler ON t."travelerId" = traveler.id 
     WHERE t.id = $1 AND t."travelerId" = $2
   `;
        console.log('Vérification accès transaction...');
        const checkResult = await database_1.db.query(checkQuery, [id, userId]);
        if (checkResult.rows.length === 0) {
            console.log('Transaction non trouvée ou accès refusé');
            return res.status(404).json({ error: 'Transaction non trouvée ou accès refusé' });
        }
        const transaction = checkResult.rows[0];
        console.log('Transaction trouvée:', {
            id: transaction.id,
            status: transaction.status,
            pickupCode: transaction.pickupCode,
            travelerId: transaction.travelerId,
            senderId: transaction.senderId
        });
        // Vérifier le code de récupération
        if (transaction.pickupCode !== pickupCode) {
            console.log('Code de récupération incorrect');
            return res.status(400).json({
                error: 'Code de récupération incorrect'
            });
        }
        // Vérifier que la transaction est en statut payment_escrowed
        if (transaction.status !== 'payment_escrowed') {
            console.log('Statut invalide pour récupération:', transaction.status);
            return res.status(400).json({
                error: 'La transaction doit être payée pour être récupérée',
                currentStatus: transaction.status
            });
        }
        console.log('Mise à jour statut vers package_picked_up...');
        // Mise à jour vers package_picked_up
        const updateQuery = `
     UPDATE transactions 
     SET 
       status = 'package_picked_up',
       "pickedUpAt" = NOW(),
       "updatedAt" = NOW()
     WHERE id = $1 
     RETURNING *
   `;
        const updateResult = await database_1.db.query(updateQuery, [id]);
        const updatedTransaction = updateResult.rows[0];
        console.log('Transaction mise à jour:', {
            id: updatedTransaction.id,
            newStatus: updatedTransaction.status,
            pickedUpAt: updatedTransaction.pickedUpAt
        });
        res.json({
            success: true,
            message: 'Récupération confirmée avec succès',
            transaction: {
                id: updatedTransaction.id,
                status: updatedTransaction.status,
                pickedUpAt: updatedTransaction.pickedUpAt,
                pickupCode: updatedTransaction.pickupCode,
                deliveryCode: updatedTransaction.deliveryCode,
                travelerName: `${transaction.traveler_first_name} ${transaction.traveler_last_name}`
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
router.post('/:id/confirm-delivery', auth_1.authMiddleware, async (req, res) => {
    console.log('Route confirm-delivery appelée !');
    try {
        const { id } = req.params;
        const { deliveryCode } = req.body;
        console.log('ID reçu:', id);
        console.log('Code livraison reçu:', deliveryCode);
        if (!req.user) {
            console.log('Utilisateur non authentifié');
            return res.status(401).json({ error: 'Utilisateur non authentifié' });
        }
        const userId = req.user.id;
        console.log('User ID:', userId);
        // Vérification que la transaction existe et que l'utilisateur a accès
        const checkQuery = `
      SELECT 
        t.*,
        sender."firstName" as sender_first_name,
        sender."lastName" as sender_last_name
      FROM transactions t 
      LEFT JOIN users sender ON t."senderId" = sender.id 
      WHERE t.id = $1 AND (t."travelerId" = $2 OR t."senderId" = $2)
    `;
        console.log('Vérification accès transaction...');
        const checkResult = await database_1.db.query(checkQuery, [id, userId]);
        if (checkResult.rows.length === 0) {
            console.log('Transaction non trouvée ou accès refusé');
            return res.status(404).json({ error: 'Transaction non trouvée ou accès refusé' });
        }
        const transaction = checkResult.rows[0];
        console.log('Transaction trouvée:', {
            id: transaction.id,
            status: transaction.status,
            deliveryCode: transaction.deliveryCode,
            pickedUpAt: transaction.pickedUpAt
        });
        // Vérifier le code de livraison
        if (transaction.deliveryCode !== deliveryCode) {
            console.log('Code de livraison incorrect');
            return res.status(400).json({
                error: 'Code de livraison incorrect'
            });
        }
        // Vérifier que le colis a été récupéré
        if (!transaction.pickedUpAt) {
            console.log('Colis pas encore récupéré');
            return res.status(400).json({
                error: 'Le colis doit être récupéré avant la livraison'
            });
        }
        console.log('Mise à jour statut vers payment_released...');
        // Mettre à jour vers payment_released (libérer le paiement)
        const updateQuery = `
      UPDATE transactions 
      SET 
        status = 'payment_released',
        "deliveredAt" = NOW(),
        "updatedAt" = NOW()
      WHERE id = $1 
      RETURNING *
    `;
        const updateResult = await database_1.db.query(updateQuery, [id]);
        const updatedTransaction = updateResult.rows[0];
        console.log('Transaction mise à jour:', {
            id: updatedTransaction.id,
            newStatus: updatedTransaction.status,
            deliveredAt: updatedTransaction.deliveredAt
        });
        // Calculer le montant pour le voyageur (montant - frais de service)
        const travelerAmount = parseFloat(updatedTransaction.travelerAmount || updatedTransaction.amount);
        console.log('Crédit wallet voyageur:', travelerAmount, 'EUR pour user', updatedTransaction.travelerId);
        // Créditer le wallet du voyageur
        await walletService_1.WalletService.creditWallet(updatedTransaction.travelerId, travelerAmount, updatedTransaction.id, `Livraison confirmée - Transaction #${updatedTransaction.id}`);
        console.log('Wallet crédité avec succès');
        res.json({
            success: true,
            message: 'Livraison confirmée, paiement libéré au voyageur',
            transaction: {
                id: updatedTransaction.id,
                status: updatedTransaction.status,
                deliveredAt: updatedTransaction.deliveredAt,
                deliveryCode: updatedTransaction.deliveryCode,
                travelerAmount: travelerAmount,
                senderName: `${transaction.sender_first_name} ${transaction.sender_last_name}`
            }
        });
        console.log('Réponse envoyée avec succès');
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error('Erreur dans confirm-delivery:', errorMessage);
        res.status(500).json({
            error: 'Erreur serveur lors de la confirmation de livraison',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
});
// SEULE MODIFICATION - Route Payment Intent mise à jour pour changer le statut
router.post('/:id/payment-intent', auth_1.authMiddleware, async (req, res) => {
    try {
        const transactionId = req.params.id;
        const userId = req.user?.id;
        console.log('💳 Création Payment Intent pour transaction:', transactionId);
        // Vérifier que la transaction appartient à l'utilisateur
        const transaction = await models_1.Transaction.findOne({
            where: { id: transactionId, senderId: userId }
        });
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction non trouvée'
            });
        }
        // Créer le Payment Intent Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(parseFloat(transaction.amount.toString()) * 100), // Montant réel en centimes
            currency: 'eur',
            automatic_payment_methods: {
                enabled: true,
            },
            description: `CoKilo - Transport transaction ${transactionId}`,
            metadata: {
                transactionId: transactionId,
            },
        });
        // AJOUT: Mettre à jour immédiatement le statut (simulation paiement réussi)
        await transaction.update({
            status: transaction_1.TransactionStatus.PAYMENT_ESCROWED,
            stripePaymentIntentId: paymentIntent.id
        });
        console.log('✅ Payment Intent créé et statut mis à jour:', paymentIntent.id);
        res.json({
            success: true,
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id,
            amount: Math.round(parseFloat(transaction.amount.toString()) * 100),
            currency: 'eur'
        });
    }
    catch (error) {
        console.error('❌ Erreur Payment Intent:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur création payment intent'
        });
    }
});
// Ajoutez cette route après payment-intent
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
            // Utilisez l'enum au lieu de la string
            await transaction.update({
                status: transaction_1.TransactionStatus.PAYMENT_ESCROWED, // Au lieu de 'payment_escrowed'
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
router.delete('/:id/cancel', auth_1.authMiddleware, TransactionController_1.TransactionController.cancelTransaction);
// Routes pour les avis (ajoutez après vos routes transactions existantes)
router.post('/reviews', auth_1.authMiddleware, ReviewController_1.ReviewController.createReview);
router.get('/users/:userId/reviews', ReviewController_1.ReviewController.getUserReviews);
router.get('/transactions/:transactionId/reviews', auth_1.authMiddleware, ReviewController_1.ReviewController.getTransactionReviews);
exports.default = router;
