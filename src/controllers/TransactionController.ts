// src/controllers/TransactionController.ts
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Transaction } from '../models/Transaction';
import { TransactionStatus, PackageType } from '../types/transaction';
import { Trip } from '../models/Trip';
import { User } from '../models/User';
import { PaymentService } from '../services/paymentService';
import Stripe from 'stripe';
import { TripCapacityService } from '../services/TripCapacityService';

// AJOUT - Service de conversion
import { CurrencyService } from '../services/CurrencyService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-07-30.basil',
});

function generateRandomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

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

      if (transaction.stripePaymentIntentId) {
        console.log('♻️ Payment Intent existant:', transaction.stripePaymentIntentId);
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            transaction.stripePaymentIntentId
          );
          return res.json({
            success: true,
            client_secret: paymentIntent.client_secret,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: transaction.stripePaymentIntentId,
          });
        } catch (stripeError) {
          console.log('⚠️ Payment Intent invalide côté Stripe; création d@un nouveau…');
        }
      }

      console.log('🆕 Création nouveau Payment Intent (PaymentService)…');

      const safeDesc = (transaction.packageDescription || '').toString();
      const description =
        'CoKilo - Livraison: ' + (safeDesc.length > 50 ? safeDesc.slice(0, 50) + '…' : safeDesc);

      const paymentData = await PaymentService.createEscrowPayment(
        parseFloat(transaction.amount.toString()),
        'cus_default',
        transaction.id,
        description
      );

      await transaction.update({
        stripePaymentIntentId: paymentData.paymentIntentId,
      });

      await transaction.update({
        status: TransactionStatus.PAYMENT_ESCROWED,
      });

      console.log('✅ Payment Intent créé et statut mis à jour:', paymentData.paymentIntentId);

      return res.json({
        success: true,
        client_secret: paymentData.clientSecret,
        clientSecret: paymentData.clientSecret,
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

      const isAvailable = await TripCapacityService.checkAvailability(tripId, weight);
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          error: 'Capacité insuffisante pour ce voyage'
        });
      }

      const amount = parseFloat((Number(weight) * Number(trip.pricePerKg)).toFixed(2));
      console.log('🔍 Montant calculé:', amount);

      const mappedPackageType = mapPackageType(itemType);

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

      await TripCapacityService.reserveCapacity(tripId, weight);
      await TripCapacityService.updateTripVisibility();

      return res.status(201).json({
        success: true,
        data: {
          transaction: {
            id: transaction.id,
            amount: transaction.amount,
            status: transaction.status,
          },
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
        details: error.message
      });
    }
  }

  static async confirmPayment(req: Request, res: Response) {
    try {
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

  static async confirmPickup(req: Request, res: Response) {
    try {
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

  static async confirmDelivery(req: Request, res: Response) {
    try {
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

      if (transaction.stripePaymentIntentId) {
        const captureResult = await PaymentService.capturePayment(transaction.stripePaymentIntentId);
        
        const { WalletService } = require('../services/walletService');
        
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

  // FONCTION MODIFIÉE - avec conversion de devise
  static async getMyTransactions(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      // RÉCUPÉRATION DU HEADER DE DEVISE FORCÉE
      const forcedCurrency = req.headers['x-force-currency'] as string;
      const userCurrency = forcedCurrency || user.currency || 'DZD';
      
      console.log('DEVISE UTILISÉE:', {
        userCurrencyFromDB: user.currency,
        forcedCurrency: forcedCurrency,
        finalCurrency: userCurrency
      });

      const senderTransactions = await Transaction.findAll({
        where: { senderId: user.id },
        order: [['createdAt', 'DESC']],
      });

      const travelerTransactions = await Transaction.findAll({
        where: { travelerId: user.id },
        order: [['createdAt', 'DESC']],
      });

      const allUserTransactions = [...senderTransactions, ...travelerTransactions];
      const uniqueTransactions = allUserTransactions.filter((transaction, index, array) =>
        array.findIndex((t) => t.id === transaction.id) === index
      );

      uniqueTransactions.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // CONVERSION DES TRANSACTIONS
      console.log('Transactions récupérées avant conversion:', uniqueTransactions.length);
      console.log('=== CONVERSION TRANSACTIONS ===');
      console.log('User currency:', userCurrency);
      console.log('Nombre de transactions à convertir:', uniqueTransactions.length);
      
      if (uniqueTransactions.length > 0) {
        console.log('Première transaction avant conversion:', {
          id: uniqueTransactions[0].id,
          amount: uniqueTransactions[0].amount,
          packageDescription: uniqueTransactions[0].packageDescription?.substring(0, 50)
        });
      }

      let convertedTransactions;
      if (userCurrency !== 'EUR') {
        convertedTransactions = await CurrencyService.convertTransactions(uniqueTransactions, userCurrency);
      } else {
        convertedTransactions = uniqueTransactions.map(transaction => ({
          ...transaction.toJSON(),
          displayCurrency: 'EUR',
          currencySymbol: '€'
        }));
      }

      if (convertedTransactions.length > 0) {
        console.log('Première transaction après conversion:', {
          amount: convertedTransactions[0].amount,
          displayCurrency: convertedTransactions[0].displayCurrency,
          currencySymbol: convertedTransactions[0].currencySymbol
        });
      }

      console.log('📊 Transactions converties:', convertedTransactions.length);

      return res.json({
        success: true,
        data: {
          transactions: convertedTransactions,
        },
      });
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      return res.status(500).json({ success: false, error: 'Erreur' });
    }
  }

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

      // CONVERSION DE DEVISE POUR LE DÉTAIL AUSSI
      const forcedCurrency = req.headers['x-force-currency'] as string;
      const userCurrency = forcedCurrency || user.currency || 'DZD';
      
      let convertedTransaction;
      if (userCurrency !== 'EUR') {
        const converted = await CurrencyService.convertTransactions([transaction], userCurrency);
        convertedTransaction = converted[0];
      } else {
        convertedTransaction = {
          ...transaction.toJSON(),
          displayCurrency: 'EUR',
          currencySymbol: '€'
        };
      }

      return res.json({
        success: true,
        data: { transaction: convertedTransaction },
      });
    } catch (error: any) {
      console.error('❌ Erreur getTransactionDetails:', error);
      return res.status(500).json({ success: false, error: 'Erreur' });
    }
  }

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

      if (transaction.status !== TransactionStatus.PAYMENT_PENDING) {
        return res.status(400).json({
          success: false,
          error: 'Cette réservation ne peut plus être annulée car le paiement a été effectué'
        });
      }

      let cancelledBy = 'unknown';
      if (user.id === transaction.senderId) {
        cancelledBy = 'sender';
      } else if (user.id === transaction.travelerId) {
        cancelledBy = 'traveler';
      }

      await TripCapacityService.releaseCapacity(transaction.tripId, transaction.packageWeight);

      await transaction.update({
        status: TransactionStatus.CANCELLED,
        internalNotes: `Annulée par ${cancelledBy}`
      });

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