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
   const checkResult = await db.query(checkQuery, [id, userId]);
   
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
   
   const updateResult = await db.query(updateQuery, [id]);
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
   
 } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
   console.error('Erreur dans confirm-pickup:', errorMessage);
   
   res.status(500).json({ 
     error: 'Erreur serveur lors de la confirmation',
     details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
   });
 }
});

router.post('/:id/confirm-delivery', authMiddleware, async (req, res) => {
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
    const checkResult = await db.query(checkQuery, [id, userId]);
    
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
    
    const updateResult = await db.query(updateQuery, [id]);
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
    await WalletService.creditWallet(
      updatedTransaction.travelerId,
      travelerAmount,
      updatedTransaction.id,
      `Livraison confirmée - Transaction #${updatedTransaction.id}`
    );
    
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
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('Erreur dans confirm-delivery:', errorMessage);
    
    res.status(500).json({ 
      error: 'Erreur serveur lors de la confirmation de livraison',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

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

    // NETTOYER LES ANCIENS PAYMENT INTENTS INVALIDES
    if (transaction.stripePaymentIntentId) {
      try {
        await stripe.paymentIntents.retrieve(transaction.stripePaymentIntentId);
      } catch (stripeError: any) {
        // Si erreur de conflits d'environnement, nettoyer l'ID
        if (stripeError.message?.includes('live mode') || stripeError.message?.includes('test mode')) {
          console.log('🧹 Nettoyage ancien Payment Intent incompatible');
          await transaction.update({ stripePaymentIntentId: undefined });
        }
      }
    }

    // TOUJOURS CRÉER UN NOUVEAU PAYMENT INTENT
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(transaction.amount.toString()) * 100),
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      description: `CoKilo-T${transactionId}-${Date.now()}`,
      metadata: { transactionId: transactionId.toString() },
    });

    await transaction.update({
      status: TransactionStatus.PAYMENT_ESCROWED,
      stripePaymentIntentId: paymentIntent.id
    });

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