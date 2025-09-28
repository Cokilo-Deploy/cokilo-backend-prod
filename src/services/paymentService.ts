// src/services/paymentService.ts
import Stripe from 'stripe';
import { Transaction } from '../models/Transaction';
import { TransactionStatus } from '../types/transaction';
import { User } from '../models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export class PaymentService {
  // Créer un payment intent avec séquestre (capture manuelle)
  static async createEscrowPayment(
    amount: number,
    customerId: string,
    transactionId: number,
    description: string
  ) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe utilise les centimes
        currency: 'eur',
        customer: customerId,
        capture_method: 'manual', // ← CLEF : capture manuelle pour le séquestre
        confirmation_method: 'manual',
        confirm: false,
        description: description,
        metadata: {
          transactionId: transactionId.toString(),
          type: 'baggage_delivery',
        },
        // Configuration pour mobile
        payment_method_types: ['card'],
      });

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
      };
    } catch (error) {
      throw new Error(`Erreur création payment intent: ${error}`);
    }
  }

  // Confirmer le paiement (autoriser les fonds, mais ne pas capturer)
  static async confirmPayment(paymentIntentId: string, paymentMethodId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      return {
        status: paymentIntent.status,
        requiresAction: paymentIntent.status === 'requires_action',
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      throw new Error(`Erreur confirmation paiement: ${error}`);
    }
  }

  // Capturer le paiement (libérer l'argent au voyageur) - ÉTAPE FINALE
  static async capturePayment(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
      
      return {
        status: paymentIntent.status,
        amount: paymentIntent.amount_received / 100,
        transferId: null, // Sera utilisé plus tard pour les transferts
      };
    } catch (error) {
      throw new Error(`Erreur capture paiement: ${error}`);
    }
  }

  // Annuler le paiement (rembourser l'expéditeur)
  static async cancelPayment(paymentIntentId: string, reason: string = 'requested_by_customer') {
    try {
      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
      
      return {
        status: paymentIntent.status,
        cancellationReason: paymentIntent.cancellation_reason,
      };
    } catch (error) {
      throw new Error(`Erreur annulation paiement: ${error}`);
    }
  }

  // Créer un remboursement partiel ou total
  static async refundPayment(paymentIntentId: string, amount?: number, reason?: string) {
    try {
      const refundData: any = {
        payment_intent: paymentIntentId,
        reason: reason || 'requested_by_customer',
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      const refund = await stripe.refunds.create(refundData);
      
      return {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100,
      };
    } catch (error) {
      throw new Error(`Erreur remboursement: ${error}`);
    }
  }

  // Transférer l'argent au voyageur (pour plus tard, nécessite Stripe Connect)
  static async transferToTraveler(
    amount: number,
    travelerStripeAccountId: string,
    transactionId: number
  ) {
    try {
      // Cette fonction nécessite Stripe Connect
      // Pour l'instant, on simule avec une capture simple
      console.log(`💰 Transfert simulé: ${amount}€ vers ${travelerStripeAccountId} pour transaction ${transactionId}`);
      
      return {
        transferId: `tr_simulated_${Date.now()}`,
        amount: amount,
        status: 'completed',
      };
    } catch (error) {
      throw new Error(`Erreur transfert: ${error}`);
    }
  }

  // Obtenir les détails d'un paiement
  static async getPaymentDetails(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        captureMethod: paymentIntent.capture_method,
        created: new Date(paymentIntent.created * 1000),
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      throw new Error(`Erreur récupération détails paiement: ${error}`);
    }
  }
}