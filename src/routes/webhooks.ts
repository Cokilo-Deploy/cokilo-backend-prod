// Votre fichier webhooks.ts corrigé
import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { Transaction } from '../models';
import { TransactionStatus } from '../types/transaction';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

const router = Router();

router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, webhookSecret!);
  } catch (err: any) {
    console.log('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer payment_intent.succeeded
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const transactionId = paymentIntent.metadata.transactionId;

    if (transactionId) {
      try {
        const transaction = await Transaction.findByPk(transactionId);
        
        if (transaction && transaction.status === TransactionStatus.PAYMENT_PENDING) {
          await transaction.update({
            status: TransactionStatus.PAYMENT_ESCROWED,
            stripePaymentIntentId: paymentIntent.id
          });
          
          console.log(`Transaction ${transactionId} mise à jour vers PAYMENT_ESCROWED`);
        }
      } catch (error) {
        console.error('Erreur mise à jour transaction:', error);
      }
    }
  }

  // Gérer payment_intent.payment_failed
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const transactionId = paymentIntent.metadata.transactionId;

    if (transactionId) {
      try {
        const transaction = await Transaction.findByPk(transactionId);
        if (transaction) {
          await transaction.update({
            status: TransactionStatus.CANCELLED,
            cancellationReason: 'Échec du paiement'
          });
          
          console.log(`Transaction ${transactionId} annulée pour échec paiement`);
        }
      } catch (error) {
        console.error('Erreur mise à jour transaction:', error);
      }
    }
  }

  res.json({ received: true });
});

export default router;