//src/routes/transactions.ts - ADAPTATION de ton fichier traductions.ts avec juste les imports ajoutés
import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { Transaction, Trip, User } from '../models';
import { Op } from 'sequelize';
import { TransactionController } from '../controllers/TransactionController';
import { authMiddleware } from '../middleware/auth';
import { WalletService } from '../services/walletService';
import { TransactionStatus } from '../types/transaction';
import { ReviewController } from '../controllers/ReviewController';
import { CurrencyService } from '../services/CurrencyService';
// AJOUT - Import pour traductions
import { sendLocalizedResponse } from '../utils/responseHelpers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const router = Router();

// Route de test (gardez-la) - MODIFIÉE pour utiliser sendLocalizedResponse
router.post('/test-simple', (req: Request, res: Response) => {
  console.log('🎯 Route test-simple appelée !');
  
  return sendLocalizedResponse(
    res,
    'msg.operation_successful',
    { message: 'Route test-simple fonctionne !' },
    200,
    (req as any).user
  );
});

// Route POST pour créer une transaction - MODIFIÉE pour utiliser le contrôleur adapté
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Création nouvelle transaction...');
    console.log('🔄 Body reçu:', req.body);
    console.log('🔄 User:', (req as any).user?.id);
    
    // MODIFIÉ - Utiliser le contrôleur adapté avec traductions
    return await TransactionController.createTransaction(req, res);
    
  } catch (error: any) {
    console.error('❌ Erreur création transaction:', error);
    // MODIFIÉ - Utiliser sendLocalizedResponse
    return sendLocalizedResponse(
      res,
      'msg.error_creating_booking',
      { details: error.message },
      500,
      (req as any).user
    );
  }
});

// Route GET - MODIFIÉE pour utiliser le contrôleur adapté
router.get('/', async (req: Request, res: Response) => {
  try {
    // MODIFIÉ - Utiliser le contrôleur adapté avec traductions
    return await TransactionController.getMyTransactions(req, res);
    
  } catch (error: any) {
    console.error('❌ Erreur récupération transactions:', error);
    return sendLocalizedResponse(
      res,
      'msg.error_loading_transactions',
      null,
      500,
      (req as any).user
    );
  }
});

// Route confirm-pickup - TON CODE ORIGINAL conservé
router.post('/:id/confirm-pickup', authMiddleware, async (req, res) => {
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
    
    const transaction = await Transaction.findOne({
      where: { 
        id: id, 
        travelerId: userId 
      },
      include: [
        { model: User, as: 'traveler' },
        { model: User, as: 'sender' }
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
      status: TransactionStatus.PACKAGE_PICKED_UP,
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
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('Erreur dans confirm-pickup:', errorMessage);
    
    res.status(500).json({ 
      error: 'Erreur serveur lors de la confirmation',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// TON CODE ORIGINAL conservé
router.post('/:id/confirm-delivery', authMiddleware, TransactionController.confirmDelivery);

// TON CODE ORIGINAL conservé
router.post('/:id/payment-intent', authMiddleware, async (req: Request, res: Response) => {
  try {
    const transactionId = req.params.id;
    const userId = (req as any).user?.id;

    const transaction = await Transaction.findOne({
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
      status: TransactionStatus.PAYMENT_ESCROWED,
      stripePaymentIntentId: paymentIntent.id
    });

    console.log('Payment Intent créé:', paymentIntent.id);

    res.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });

  } catch (error: any) {
    console.error('Erreur Payment Intent:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur création payment intent'
    });
  }
});

// TON CODE ORIGINAL conservé    
router.post('/:id/confirm-payment', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentIntentId } = req.body;
    const userId = (req as any).user?.id;

    console.log('Confirmation paiement pour transaction:', id);
    console.log('PaymentIntent ID:', paymentIntentId);

    const transaction = await Transaction.findOne({
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
        status: TransactionStatus.PAYMENT_ESCROWED,
        stripePaymentIntentId: paymentIntentId
      });

      console.log('Statut transaction mis à jour vers PAYMENT_ESCROWED');

      res.json({
        success: true,
        message: 'Paiement confirmé avec succès'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Paiement non confirmé côté Stripe'
      });
    }

  } catch (error: any) {
    console.error('Erreur confirmation paiement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la confirmation du paiement'
    });
  }
});

// TON CODE ORIGINAL conservé
router.delete('/:id/cancel', authMiddleware, TransactionController.cancelTransaction);

// TON CODE ORIGINAL conservé
router.post('/reviews', authMiddleware, ReviewController.createReview);
router.get('/users/:userId/reviews', ReviewController.getUserReviews);
router.get('/transactions/:transactionId/reviews', authMiddleware, ReviewController.getTransactionReviews);

export default router;