// src/controllers/stripeConnectWebhookController.ts
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { WalletService } from '../services/walletService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const endpointSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET!;

export const handleStripeConnectWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']!;
  let event: Stripe.Event;

  try {
    // Vérification de la signature du webhook
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Erreur signature webhook Connect:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('📡 Événement Connect reçu:', event.type);

  try {
    switch (event.type) {
      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer);
        break;

      case 'transfer.updated':
        await handleTransferUpdated(event.data.object as Stripe.Transfer);
        break;

      case 'transfer.reversed': // Correction: transfer.reversed au lieu de transfer.failed
        await handleTransferReversed(event.data.object as Stripe.Transfer);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case 'account.application.deauthorized':
        await handleAccountDeauthorized(event.data.object as any);
        break;

      default:
        console.log(`🤷‍♂️ Événement Connect non géré: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erreur traitement webhook Connect:', error);
    res.status(500).json({ error: 'Erreur serveur webhook Connect' });
  }
};

// Gestion des événements spécifiques
async function handleTransferCreated(transfer: Stripe.Transfer) {
  console.log('💸 Transfer créé:', transfer.id);
  
  try {
    // Trouver la transaction liée via les metadata
    const transactionId = transfer.metadata?.transactionId;
    if (!transactionId) {
      console.error('❌ Transaction ID manquant dans transfer metadata');
      return;
    }

    // Mettre à jour la transaction avec l'ID du transfer
    await Transaction.update(
      { 
        stripeTransferId: transfer.id,
        paymentReleasedAt: new Date()
      },
      { where: { id: parseInt(transactionId) } } // Correction: parseInt pour convertir string en number
    );

    console.log(`✅ Transaction ${transactionId} mise à jour avec transfer ${transfer.id}`);
  } catch (error) {
    console.error('Erreur handleTransferCreated:', error);
  }
}

async function handleTransferUpdated(transfer: Stripe.Transfer) {
  console.log('🔄 Transfer mis à jour:', transfer.id);
  
  // Vous pouvez ajouter une logique pour notifier l'utilisateur du statut
}

// Correction: transfer.reversed au lieu de transfer.failed
async function handleTransferReversed(transfer: Stripe.Transfer) {
  console.error('❌ Transfer annulé:', transfer.id);
  
  try {
    const transactionId = transfer.metadata?.transactionId;
    if (!transactionId) return;

    // Remettre l'argent dans le wallet en cas d'annulation
    const transaction = await Transaction.findByPk(parseInt(transactionId), {
      include: [{ model: User, as: 'traveler' }]
    });

    if (transaction && transaction.traveler) {
      // Créditer le wallet à nouveau
      // APRÈS (ligne 108-112) - CORRECT
await WalletService.creditWallet(
  transaction.traveler.id,                                    // userId: number
  Number(transaction.travelerAmount),                         // amount: number
  parseInt(transactionId),                                    // transactionId: number
  `Annulation transfer Stripe - Transaction ${transactionId}` // description: string
);

      // Marquer la transaction comme ayant besoin d'un retrait manuel
      await Transaction.update(
        { 
          stripeTransferId: undefined, // Correction: undefined au lieu de null
          paymentReleasedAt: undefined, // Correction: undefined au lieu de null
          internalNotes: `Transfer Stripe annulé ${transfer.id} - Remis en wallet`
        },
        { where: { id: parseInt(transactionId) } }
      );

      console.log(`💰 Argent remis en wallet pour transaction ${transactionId}`);
    }
  } catch (error) {
    console.error('Erreur handleTransferReversed:', error);
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  console.log('👤 Compte Connect mis à jour:', account.id);
  
  try {
    // Mettre à jour le statut de vérification de l'utilisateur
    const user = await User.findOne({
      where: { stripeConnectedAccountId: account.id }
    });

    if (user && account.details_submitted && account.charges_enabled) {
      console.log(`✅ Compte Connect ${account.id} activé pour l'utilisateur ${user.id}`);
      
      // Optionnel: mettre à jour un statut dans votre base
      await User.update(
        { paymentMethod: 'stripe_connect' },
        { where: { id: user.id } }
      );
    }
  } catch (error) {
    console.error('Erreur handleAccountUpdated:', error);
  }
}

async function handleAccountDeauthorized(data: any) {
  console.log('🚫 Compte Connect déconnecté:', data.account);
  
  try {
    // Remettre l'utilisateur en mode manuel
    await User.update(
      { 
        stripeConnectedAccountId: undefined, // Correction: undefined au lieu de null
        paymentMethod: 'manual' 
      },
      { where: { stripeConnectedAccountId: data.account } }
    );

    console.log(`🔄 Utilisateur remis en mode paiement manuel`);
  } catch (error) {
    console.error('Erreur handleAccountDeauthorized:', error);
  }
}