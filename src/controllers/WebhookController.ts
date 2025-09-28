// src/controllers/WebhookController.ts
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { StripeIdentityService } from '../services/stripeIdentityService';
import { Transaction } from '../models/Transaction';
import { TransactionStatus } from '../types/transaction';
import { DeliveryService } from '../services/deliveryService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export class WebhookController {
  static async handleStripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
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
          await StripeIdentityService.handleVerificationWebhook(event);
          break;

        case 'charge.dispute.created':
          await WebhookController.handleDisputeCreated(event);
          break;

        default:
          console.log(`🤷 Événement non traité: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('❌ Erreur traitement webhook:', error);
      res.status(500).json({ error: 'Erreur traitement webhook' });
    }
  }

  private static async handlePaymentIntentSucceeded(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const transactionId = paymentIntent.metadata?.transactionId;

    if (!transactionId) {
      console.log('⚠️ PaymentIntent sans transactionId');
      return;
    }

    console.log(`✅ Paiement autorisé pour transaction ${transactionId}`);

    const transaction = await Transaction.findByPk(parseInt(transactionId));
    if (transaction && transaction.status === TransactionStatus.PAYMENT_PENDING) {
      await transaction.update({
        status: TransactionStatus.PAYMENT_ESCROWED,
      });
      console.log(`💰 Transaction ${transactionId} → PAYMENT_ESCROWED`);
    }
  }

  private static async handlePaymentIntentFailed(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const transactionId = paymentIntent.metadata?.transactionId;

    if (!transactionId) return;

    console.log(`❌ Paiement échoué pour transaction ${transactionId}`);

    const transaction = await Transaction.findByPk(parseInt(transactionId));
    if (transaction) {
      await transaction.update({
        internalNotes: `Paiement échoué: ${paymentIntent.last_payment_error?.message || 'Erreur inconnue'}`,
      });
    }
  }

  private static async handlePaymentIntentCanceled(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const transactionId = paymentIntent.metadata?.transactionId;

    if (!transactionId) return;

    console.log(`🚫 Paiement annulé pour transaction ${transactionId}`);

    await DeliveryService.cancelTransaction(
      parseInt(transactionId),
      'admin',
      'Paiement annulé par Stripe'
    );
  }

  private static async handleDisputeCreated(event: Stripe.Event) {
    const dispute = event.data.object as Stripe.Dispute;
    const chargeId = dispute.charge as string;

    console.log(`⚖️ Litige créé pour charge ${chargeId}`);
    console.log(`Montant en litige: ${dispute.amount / 100}€`);
    console.log(`Raison: ${dispute.reason}`);
  }
}
