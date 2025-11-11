"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/webhooks.ts
const express_1 = require("express");
const stripe_1 = __importDefault(require("stripe"));
const models_1 = require("../models");
const transaction_1 = require("../types/transaction");
const stripeConnectWebhookController_1 = require("../controllers/stripeConnectWebhookController");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
});
const router = (0, express_1.Router)();
// Webhook existant (paiements)
router.post('/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        console.log('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // Gérer payment_intent.succeeded
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const transactionId = paymentIntent.metadata.transactionId;
        if (transactionId) {
            try {
                const transaction = await models_1.Transaction.findByPk(transactionId);
                if (transaction && transaction.status === transaction_1.TransactionStatus.PAYMENT_PENDING) {
                    await transaction.update({
                        status: transaction_1.TransactionStatus.PAYMENT_ESCROWED,
                        stripePaymentIntentId: paymentIntent.id
                    });
                    console.log(`Transaction ${transactionId} mise à jour vers PAYMENT_ESCROWED`);
                }
            }
            catch (error) {
                console.error('Erreur mise à jour transaction:', error);
            }
        }
    }
    // Gérer payment_intent.payment_failed
    if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        const transactionId = paymentIntent.metadata.transactionId;
        if (transactionId) {
            try {
                const transaction = await models_1.Transaction.findByPk(transactionId);
                if (transaction) {
                    await transaction.update({
                        status: transaction_1.TransactionStatus.CANCELLED,
                        cancellationReason: 'Échec du paiement'
                    });
                    console.log(`Transaction ${transactionId} annulée pour échec paiement`);
                }
            }
            catch (error) {
                console.error('Erreur mise à jour transaction:', error);
            }
        }
    }
    res.json({ received: true });
});
// Nouveau webhook Connect (transfers)
router.post('/stripe-connect', stripeConnectWebhookController_1.handleStripeConnectWebhook);
exports.default = router;
