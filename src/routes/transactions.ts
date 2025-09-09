import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { Transaction, Trip, User } from '../models';
import { Op } from 'sequelize';
import { TransactionController } from '../controllers/TransactionController';
import { authMiddleware } from '../middleware/auth';
import { db } from '../config/database'; // Ajustez le chemin selon votre structure
import { WalletService } from '../services/walletService';
import { TransactionStatus } from '../types/transaction';
import { ReviewController } from '../controllers/ReviewController';
import { CurrencyService } from '../services/CurrencyService';



const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

const router = Router();

// Route de test (gardez-la)
router.post('/test-simple', (req: Request, res: Response) => {
  console.log('🎯 Route test-simple appelée !');
  res.json({ 
    success: true, 
    message: 'Route test-simple fonctionne !' 
  });
});

// Route POST pour créer une transaction
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Création nouvelle transaction...');
    console.log('🔄 Body reçu:', req.body);
    console.log('🔄 User:', (req as any).user?.id);
    
    // Appeler votre TransactionController existant
    return await TransactionController.createTransaction(req, res);
    
  } catch (error: any) {
    console.error('❌ Erreur création transaction:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur création transaction'
    });
  }
});


router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    console.log('📦 Récupération transactions pour user:', userId);
    
    // AJOUT - Récupération de la devise forcée
    const forcedCurrency = req.headers['x-force-currency'] as string;
    const user = (req as any).user;
    const userCurrency = forcedCurrency || user.currency || 'DZD';
    
    console.log('DEVISE UTILISÉE:', {
      userCurrencyFromDB: user.currency,
      forcedCurrency: forcedCurrency,
      finalCurrency: userCurrency
    });

    const transactions = await Transaction.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { travelerId: userId }
        ]
      },
      include: [
        { model: User, as: 'sender' },
        { model: User, as: 'traveler' },
        { model: Trip, as: 'trip' }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log('Transactions récupérées avant conversion:', transactions.length);
    console.log('=== CONVERSION TRANSACTIONS ===');
    console.log('User currency:', userCurrency);

    // AJOUT - Conversion des transactions
    
    const convertedTransactions = await CurrencyService.convertTransactions(transactions, userCurrency);

    if (convertedTransactions.length > 0) {
      console.log('Première transaction après conversion:', {
        amount: convertedTransactions[0].amount,
        displayCurrency: convertedTransactions[0].displayCurrency,
        currencySymbol: convertedTransactions[0].currencySymbol
      });
    }

    res.json({
      success: true,
      data: {
        transactions: convertedTransactions
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur récupération transactions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur récupération transactions'
    });
  }
});

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
    
    // REMPLACEMENT : Utiliser Sequelize au lieu de db.query
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
    
    // REMPLACEMENT : Utiliser Sequelize update
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

router.post('/:id/confirm-delivery', authMiddleware, TransactionController.confirmDelivery);

// SEULE MODIFICATION - Route Payment Intent mise à jour pour changer le statut
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

    // LOGIQUE COMPLÈTEMENT DIFFÉRENTE - Pas de référence à l'ID de transaction
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now().toString();
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(transaction.amount.toString()) * 100),
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      description: `Cokilo-Prod-${timestamp}-${randomSuffix}`, // Complètement différent
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

    

// Ajoutez cette route après payment-intent
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
      // Utilisez l'enum au lieu de la string
      await transaction.update({
        status: TransactionStatus.PAYMENT_ESCROWED, // Au lieu de 'payment_escrowed'
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

router.delete('/:id/cancel', authMiddleware, TransactionController.cancelTransaction);

// Routes pour les avis (ajoutez après vos routes transactions existantes)
router.post('/reviews', authMiddleware, ReviewController.createReview);
router.get('/users/:userId/reviews', ReviewController.getUserReviews);
router.get('/transactions/:transactionId/reviews', authMiddleware, ReviewController.getTransactionReviews);


export default router;