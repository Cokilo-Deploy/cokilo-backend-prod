// src/controllers/TransactionController.ts
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Transaction } from '../models/Transaction';
import { TransactionStatus, PackageType } from '../types/transaction';
import { Trip } from '../models/Trip';
import { User } from '../models/User'; // conservé si utilisé ailleurs
import { PaymentService } from '../services/paymentService';
import Stripe from 'stripe';
import { TripCapacityService } from '../services/TripCapacityService';

// --- Stripe instance (typée, réutilisable) ---
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-07-30.basil',
});

// Fonction pour générer des codes
function generateRandomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Mapping français → anglais pour packageType
function mapPackageType(frenchType: string | undefined | null): PackageType {
  const mapping: { [key: string]: PackageType } = {
    'vêtements': PackageType.CLOTHES,
    'documents': PackageType.DOCUMENTS,
    'électronique': PackageType.ELECTRONICS,
    'electronique': PackageType.ELECTRONICS,
    'nourriture': PackageType.FOOD,
    'cadeaux': PackageType.GIFTS,
    'livres': PackageType.BOOKS,
    'autre': PackageType.OTHER,
    'autres': PackageType.OTHER,
  };
  if (!frenchType) return PackageType.OTHER;
  const normalized = frenchType.toLowerCase().trim();
  return mapping[normalized] || PackageType.OTHER;
}

export class TransactionController {
  // --- Créer PaymentIntent / escrow ---
  static async createPaymentIntent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const txId = Number(id);
      if (!Number.isFinite(txId)) {
        return res.status(400).json({ success: false, error: 'ID de transaction invalide' });
      }

      console.log('🔄 Création Payment Intent pour transaction:', txId);

      const transaction = await Transaction.findOne({
        where: { id: txId, senderId: user.id },
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction non trouvée',
        });
      }

      if (transaction.status !== TransactionStatus.PAYMENT_PENDING) {
        return res.status(400).json({
          success: false,
          error: 'Cette transaction a déjà été traitée',
        });
      }

      // Si un PaymentIntent existe déjà, on tente de le récupérer
      if (transaction.stripePaymentIntentId) {
        console.log('♻️ Payment Intent existant:', transaction.stripePaymentIntentId);
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            transaction.stripePaymentIntentId
          );
          return res.json({
            success: true,
            client_secret: paymentIntent.client_secret,
            clientSecret: paymentIntent.client_secret, // camelCase aussi
            paymentIntentId: transaction.stripePaymentIntentId,
          });
        } catch (stripeError) {
          console.log('⚠️ Payment Intent invalide côté Stripe; création d@un nouveau…');
        }
      }

      // Créer un nouveau PaymentIntent via ton PaymentService (on ne touche pas à ta logique)
      console.log('🆕 Création nouveau Payment Intent (PaymentService)…');

      const safeDesc = (transaction.packageDescription || '').toString();
      const description =
        'CoKilo - Livraison: ' + (safeDesc.length > 50 ? safeDesc.slice(0, 50) + '…' : safeDesc);

      const paymentData = await PaymentService.createEscrowPayment(
        parseFloat(transaction.amount.toString()), // montant en EUR (comme tu le faisais)
        'cus_default', // à remplacer par le vrai customer si tu en as un
        transaction.id,
        description
      );

      // Sauvegarder l'ID PaymentIntent
      await transaction.update({
        stripePaymentIntentId: paymentData.paymentIntentId,
      });

      // CORRECTION: Mettre à jour le statut immédiatement en développement (simulation)
      await transaction.update({
        status: TransactionStatus.PAYMENT_ESCROWED,
      });

      console.log('✅ Payment Intent créé et statut mis à jour:', paymentData.paymentIntentId);

      return res.json({
        success: true,
        client_secret: paymentData.clientSecret,
        clientSecret: paymentData.clientSecret, // compat front
        paymentIntentId: paymentData.paymentIntentId,
      });
    } catch (error: any) {
      console.error('❌ Erreur création Payment Intent:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la création du paiement',
      });
    }
  }

  static async createTransaction(req: Request, res: Response) {
    try {
      console.log('🔍 === DEBUT createTransaction ===');
      console.log('🔍 User reçu:', (req as any).user);
      console.log('🔍 Body reçu:', req.body);
      
      const user = (req as any).user;
      const { tripId, weight, description, itemType, specialInstructions } = req.body;

      console.log('🔍 Données extraites:', { tripId, weight, description, itemType });

      if (!description || description.trim().length < 10) {
        console.log('❌ Description trop courte');
        return res.status(400).json({
          success: false,
          error: 'La description doit contenir au moins 10 caractères',
        });
      }

      console.log('🔍 Recherche du voyage tripId:', tripId);
      
      // Vérifier que le voyage existe
      const trip = await Trip.findByPk(tripId);
      console.log('🔍 Voyage trouvé:', trip ? 'OUI' : 'NON');
      
      if (!trip) {
        console.log('❌ Voyage non trouvé');
        return res.status(400).json({
          success: false,
          error: 'Voyage non trouvé',
        });
      }

      console.log('🔍 Voyage details:', {
        id: trip.id,
        travelerId: trip.travelerId,
        pricePerKg: trip.pricePerKg
      });

      // CORRECTION: Vérifier la disponibilité AVANT la création
      const isAvailable = await TripCapacityService.checkAvailability(tripId, weight);
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          error: 'Capacité insuffisante pour ce voyage'
        });
      }

      // Calculer le montant
      const amount = parseFloat((Number(weight) * Number(trip.pricePerKg)).toFixed(2));
      console.log('🔍 Montant calculé:', amount);

      // Mapper le type de colis
      const mappedPackageType = mapPackageType(itemType);

      // Créer la transaction
      const transaction = await Transaction.create({
        travelerId: trip.travelerId,
        senderId: user.id,
        tripId: trip.id,
        amount,
        packageDescription: description,
        packageType: mappedPackageType,
        packageWeight: weight,
        notes: specialInstructions || '',
        currency: 'EUR',
        status: TransactionStatus.PAYMENT_PENDING,
        packagePhotos: [],
        pickupAddress: '',
        deliveryAddress: '',
        packageValue: 0,
        
        pickupCode: generateRandomCode(),
        deliveryCode: generateRandomCode(),
      });

      // CORRECTION: Réserver la capacité APRÈS la création réussie
      await TripCapacityService.reserveCapacity(tripId, weight);

      // Mettre à jour la visibilité des voyages
      await TripCapacityService.updateTripVisibility();

      return res.status(201).json({
        success: true,
        data: {
          transaction: {
            id: transaction.id,
            amount: transaction.amount,
            status: transaction.status,
          },
          // Tu renvoyais un "payment" fictif : je le garde pour compat,
          // ta vraie création de PaymentIntent passe par /:id/payment-intent
          payment: {
            clientSecret: 'test_client_secret',
            paymentIntentId: 'test_payment_intent',
          },
        },
        message: 'Transaction créée avec succès.',
      });

    } catch (error: any) {
      console.error('❌ ERREUR DÉTAILLÉE createTransaction:', error);
      console.error('❌ Stack trace:', error.stack);
      return res.status(500).json({
        success: false,
        error: 'Erreur création transaction',
        details: error.message // ← Ajout du détail
      });
    }
  }

  // --- Confirmer le paiement (passe à ESCROW) ---
  static async confirmPayment(req: Request, res: Response) {
    try {
      // 🔧 Route = POST /api/transactions/:id/confirm-payment
      const idFromParams = Number(req.params.id);
      const idFromBody = Number(req.body?.transactionId);
      const transactionId = Number.isFinite(idFromParams) ? idFromParams : idFromBody;

      const { paymentMethodId } = req.body;
      const user = (req as any).user;

      if (!Number.isFinite(transactionId)) {
        return res.status(400).json({ success: false, error: 'ID de transaction invalide' });
      }

      console.log('🔄 Confirmation paiement pour transaction:', transactionId);

      const transaction = await Transaction.findOne({
        where: { id: transactionId, senderId: user.id },
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction non trouvée',
        });
      }

      if (!transaction.stripePaymentIntentId) {
        return res.status(400).json({
          success: false,
          error: 'Aucun payment intent associé',
        });
      }

      // Confirmer le paiement via PaymentService
      const paymentResult = await PaymentService.confirmPayment(
        transaction.stripePaymentIntentId,
        paymentMethodId
      );

      if (paymentResult.status === 'succeeded' || paymentResult.status === 'requires_capture') {
        await transaction.update({
          status: TransactionStatus.PAYMENT_ESCROWED,
        });
        console.log('✅ Paiement confirmé, statut mis à jour → PAYMENT_ESCROWED');
      }

      return res.json({
        success: true,
        data: paymentResult,
        message: 'Paiement confirmé avec succès',
      });
    } catch (error: any) {
      console.error('❌ Erreur confirmation paiement:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la confirmation du paiement',
      });
    }
  }

  // --- Confirmer la récupération ---
  static async confirmPickup(req: Request, res: Response) {
    try {
      // 🔧 Route = POST /api/transactions/:id/confirm-pickup
      const idFromParams = Number(req.params.id);
      const idFromBody = Number(req.body?.transactionId);
      const transactionId = Number.isFinite(idFromParams) ? idFromParams : idFromBody;

      const { pickupCode } = req.body;
      const user = (req as any).user;

      if (!Number.isFinite(transactionId)) {
        return res.status(400).json({ success: false, error: 'ID de transaction invalide' });
      }

      const transaction = await Transaction.findOne({
        where: { id: transactionId, travelerId: user.id },
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction non trouvée',
        });
      }

      if (!pickupCode || transaction.pickupCode !== pickupCode) {
        return res.status(400).json({
          success: false,
          error: 'Code de récupération incorrect',
        });
      }

      await transaction.update({
        status: TransactionStatus.PACKAGE_PICKED_UP,
        pickedUpAt: new Date(),
      });

      // Après la mise à jour du statut
const io = require('../socket/socketInstance').getIO();
if (io) {
  io.to(`user_${transaction.senderId}`).emit('transaction_updated', {
    transactionId: transaction.id,
    status: TransactionStatus.PACKAGE_PICKED_UP
  });
}

      return res.json({
        success: true,
        message: 'Récupération confirmée',
      });
    } catch (error: any) {
      console.error('❌ Erreur confirmation récupération:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur',
      });
    }
  }

  // --- Confirmer la livraison (et CAPTURE du paiement) ---
  static async confirmDelivery(req: Request, res: Response) {
    try {
      // 🔧 Route = POST /api/transactions/:id/confirm-delivery
      const idFromParams = Number(req.params.id);
      const idFromBody = Number(req.body?.transactionId);
      const transactionId = Number.isFinite(idFromParams) ? idFromParams : idFromBody;

      const { deliveryCode } = req.body;
      const user = (req as any).user;

      if (!Number.isFinite(transactionId)) {
        return res.status(400).json({ success: false, error: 'ID de transaction invalide' });
      }

      console.log('🔄 Confirmation livraison pour transaction:', transactionId);

      const transaction = await Transaction.findOne({
        where: {
          id: transactionId,
          [Op.or]: [{ senderId: user.id }, { travelerId: user.id }],
        },
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction non trouvée',
        });
      }

      if (!deliveryCode || transaction.deliveryCode !== deliveryCode) {
        return res.status(400).json({
          success: false,
          error: 'Code de livraison incorrect',
        });
      }



      // Capturer le paiement (libérer l'argent au voyageur)
      if (transaction.stripePaymentIntentId) {
      const captureResult = await PaymentService.capturePayment(transaction.stripePaymentIntentId);
      
      // Importer WalletService
      const { WalletService } = require('../services/walletService');
      
      // Transférer l'argent vers le wallet du voyageur
      await WalletService.creditWallet(
        transaction.travelerId,
        parseFloat(transaction.travelerAmount.toString()),
        transaction.id,
        `Paiement livraison confirmée #${transaction.id}`
      );
      
      console.log(`💰 ${transaction.travelerAmount}€ transféré vers le wallet du voyageur ${transaction.travelerId}`);
    }

    await transaction.update({
      status: TransactionStatus.PAYMENT_RELEASED,
      deliveredAt: new Date(),
      paymentReleasedAt: new Date(),
    });

    // AJOUT : Notification temps réel
    const io = require('../socket/socketInstance').getIO();
    if (io) {
      io.to(`user_${transaction.senderId}`).emit('transaction_updated', {
        transactionId: transaction.id,
        status: TransactionStatus.PAYMENT_RELEASED
      });
      io.to(`user_${transaction.travelerId}`).emit('payment_received', {
        transactionId: transaction.id,
        amount: transaction.travelerAmount
      });
    }

    return res.json({
      success: true,
      message: 'Livraison confirmée et paiement transféré vers votre wallet',
    });
  } catch (error: any) {
    console.error('❌ Erreur confirmation livraison:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la confirmation de livraison',
    });
  }
}

  // --- Mes transactions ---
  static async getMyTransactions(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      const senderTransactions = await Transaction.findAll({
        where: { senderId: user.id },
        order: [['createdAt', 'DESC']],
      });

      const travelerTransactions = await Transaction.findAll({
        where: { travelerId: user.id },
        order: [['createdAt', 'DESC']],
      });

      // Combiner et dédupliquer par ID
      const allUserTransactions = [...senderTransactions, ...travelerTransactions];
      const uniqueTransactions = allUserTransactions.filter((transaction, index, array) =>
        array.findIndex((t) => t.id === transaction.id) === index
      );

      // Trier par date
      uniqueTransactions.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      console.log('📊 Transactions uniques:', uniqueTransactions.length);

      return res.json({
        success: true,
        data: {
          transactions: uniqueTransactions,
        },
      });
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      return res.status(500).json({ success: false, error: 'Erreur' });
    }
  }

  // --- Détails d'une transaction ---
  static async getTransactionDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const txId = Number(id);
      if (!Number.isFinite(txId)) {
        return res.status(400).json({ success: false, error: 'ID de transaction invalide' });
      }

      const transaction = await Transaction.findOne({
        where: {
          id: txId,
          [Op.or]: [{ senderId: user.id }, { travelerId: user.id }],
        },
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction non trouvée',
        });
      }

      return res.json({
        success: true,
        data: { transaction },
      });
    } catch (error: any) {
      console.error('❌ Erreur getTransactionDetails:', error);
      return res.status(500).json({ success: false, error: 'Erreur' });
    }
  }
  // --- Annuler une réservation (avant paiement uniquement) ---
// --- Annuler une réservation (avant paiement uniquement) ---
static async cancelTransaction(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const txId = Number(id);
    if (!Number.isFinite(txId)) {
      return res.status(400).json({ success: false, error: 'ID de transaction invalide' });
    }

    console.log('🚫 Tentative d\'annulation transaction:', txId, 'par user:', user.id);

    const transaction = await Transaction.findOne({
      where: { 
        id: txId,
        [Op.or]: [{ senderId: user.id }, { travelerId: user.id }]
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction non trouvée'
      });
    }

    // Vérifier que l'annulation est autorisée
    if (transaction.status !== TransactionStatus.PAYMENT_PENDING) {
      return res.status(400).json({
        success: false,
        error: 'Cette réservation ne peut plus être annulée car le paiement a été effectué'
      });
    }

    // Déterminer qui annule
    let cancelledBy = 'unknown';
    if (user.id === transaction.senderId) {
      cancelledBy = 'sender';
    } else if (user.id === transaction.travelerId) {
      cancelledBy = 'traveler';
    }

    // Libérer la capacité réservée
    await TripCapacityService.releaseCapacity(transaction.tripId, transaction.packageWeight);

    // Mettre à jour le statut
    await transaction.update({
      status: TransactionStatus.CANCELLED,
      internalNotes: `Annulée par ${cancelledBy}`
    });

    // Mettre à jour la visibilité des voyages
    await TripCapacityService.updateTripVisibility();

    console.log('✅ Transaction annulée:', txId);

    return res.json({
      success: true,
      message: 'Réservation annulée avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur annulation transaction:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'annulation'
    });
  }
}
}