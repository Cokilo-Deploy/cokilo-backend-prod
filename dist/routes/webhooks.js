"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stripe_1 = __importDefault(require("stripe"));
const models_1 = require("../models");
const transaction_1 = require("../types/transaction");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-07-30.basil',
});
const router = (0, express_1.Router)();
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
    res.json({ received: true });
});
exports.default = router;
