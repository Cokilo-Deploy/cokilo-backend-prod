"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const stripe_1 = __importDefault(require("stripe"));
const stripeIdentityService_1 = require("../services/stripeIdentityService");
const Transaction_1 = require("../models/Transaction");
const transaction_1 = require("../types/transaction");
const deliveryService_1 = require("../services/deliveryService");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-07-30.basil',
});
class WebhookController {
    static async handleStripeWebhook(req, res) {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        let event;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        }
        catch (err) {
            console.error('❌ Erreur signature webhook:', err);
            return res.status(400).send(`Webhook signature verification failed`);
        }
        console.log(`📡 Webhook reçu: ${event.type}`);
        try {
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await WebhookController.handlePaymentIntentSucceeded(event);
                    break;
                case 'payment_intent.payment_failed':
                    await WebhookController.handlePaymentIntentFailed(event);
                    break;
                case 'payment_intent.canceled':
                    await WebhookController.handlePaymentIntentCanceled(event);
                    break;
                case 'identity.verification_session.verified':
                case 'identity.verification_session.requires_input':
                case 'identity.verification_session.canceled':
                    await stripeIdentityService_1.StripeIdentityService.handleVerificationWebhook(event);
                    break;
                case 'charge.dispute.created':
                    await WebhookController.handleDisputeCreated(event);
                    break;
                default:
                    console.log(`🤷 Événement non traité: ${event.type}`);
            }
            res.json({ received: true });
        }
        catch (error) {
            console.error('❌ Erreur traitement webhook:', error);
            res.status(500).json({ error: 'Erreur traitement webhook' });
        }
    }
    static async handlePaymentIntentSucceeded(event) {
        const paymentIntent = event.data.object;
        const transactionId = paymentIntent.metadata?.transactionId;
        if (!transactionId) {
            console.log('⚠️ PaymentIntent sans transactionId');
            return;
        }
        console.log(`✅ Paiement autorisé pour transaction ${transactionId}`);
        const transaction = await Transaction_1.Transaction.findByPk(parseInt(transactionId));
        if (transaction && transaction.status === transaction_1.TransactionStatus.PAYMENT_PENDING) {
            await transaction.update({
                status: transaction_1.TransactionStatus.PAYMENT_ESCROWED,
            });
            console.log(`💰 Transaction ${transactionId} → PAYMENT_ESCROWED`);
        }
    }
    static async handlePaymentIntentFailed(event) {
        const paymentIntent = event.data.object;
        const transactionId = paymentIntent.metadata?.transactionId;
        if (!transactionId)
            return;
        console.log(`❌ Paiement échoué pour transaction ${transactionId}`);
        const transaction = await Transaction_1.Transaction.findByPk(parseInt(transactionId));
        if (transaction) {
            await transaction.update({
                internalNotes: `Paiement échoué: ${paymentIntent.last_payment_error?.message || 'Erreur inconnue'}`,
            });
        }
    }
    static async handlePaymentIntentCanceled(event) {
        const paymentIntent = event.data.object;
        const transactionId = paymentIntent.metadata?.transactionId;
        if (!transactionId)
            return;
        console.log(`🚫 Paiement annulé pour transaction ${transactionId}`);
        await deliveryService_1.DeliveryService.cancelTransaction(parseInt(transactionId), 'admin', 'Paiement annulé par Stripe');
    }
    static async handleDisputeCreated(event) {
        const dispute = event.data.object;
        const chargeId = dispute.charge;
        console.log(`⚖️ Litige créé pour charge ${chargeId}`);
        console.log(`Montant en litige: ${dispute.amount / 100}€`);
        console.log(`Raison: ${dispute.reason}`);
    }
}
exports.WebhookController = WebhookController;
