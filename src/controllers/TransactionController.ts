// src/controllers/TransactionController.ts - Version simplifiée (utilisateurs connectés uniquement)
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Transaction } from '../models/Transaction';
import { TransactionStatus, PackageType } from '../types/transaction';
import { Trip } from '../models/Trip';
import { User } from '../models/User';
import { PaymentService } from '../services/paymentService';
import Stripe from 'stripe';
import { TripCapacityService } from '../services/TripCapacityService';
import { CurrencyService } from '../services/CurrencyService';
import { StripeConnectService } from '../services/StripeConnectService';
import { WalletService } from '../services/walletService';
import { NotificationService } from '../services/NotificationService';
import { translationService } from '../services/TranslationService';
import { sendLocalizedResponse } from '../utils/responseHelpers';
import { UserAccessInfo } from '../utils/userAccess';



const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-08-27.basil',
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
        return sendLocalizedResponse(
          res,
          'msg.invalid_transaction_id',
          null,
          400,
          user
        );
      }

      console.log('🔄 Création Payment Intent pour transaction:', txId);

      const transaction = await Transaction.findOne({
        where: { id: txId, senderId: user.id },
      });

      if (!transaction) {
        return sendLocalizedResponse(
          res,
          'msg.transaction_not_found',
          null,
          404,
          user
        );
      }

      if (transaction.status !== TransactionStatus.PAYMENT_PENDING) {
        return sendLocalizedResponse(
          res,
          'msg.transaction_already_processed',
          null,
          400,
          user
        );
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
            message: translationService.t('msg.payment_intent_retrieved', user,  'Payment intent récupéré'),
            locale: user?.language || 'fr'
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
        status: TransactionStatus.PAYMENT_ESCROWED,
      });

      console.log('✅ Payment Intent créé et statut mis à jour:', paymentData.paymentIntentId);

      return res.json({
        success: true,
        client_secret: paymentData.clientSecret,
        clientSecret: paymentData.clientSecret,
        paymentIntentId: paymentData.paymentIntentId,
        message: translationService.t('msg.payment_intent_created', user,  'Payment intent créé'),
        locale: user?.language || 'fr'
      });

    } catch (error: any) {
      console.error('❌ Erreur création Payment Intent:', error);
      return sendLocalizedResponse(
        res,
        'msg.error_creating_payment',
        null,
        500,
        (req as any).user
      );
    }
  }

  static async createTransaction(req: Request, res: Response) {
    try {
      console.log('🔍 === DEBUT createTransaction ===');
      
      const user = (req as any).user;
      const { tripId, weight, description, itemType, specialInstructions } = req.body;
      

      console.log('🔍 Données extraites:', { tripId, weight, description, itemType });

      if (!description || description.trim().length < 10) {
        console.log('❌ Description trop courte');
        return sendLocalizedResponse(
          res,
          'msg.description_too_short',
          null,
          400,
          user
        );
      }

      console.log('🔍 Recherche du voyage tripId:', tripId);
      
      const trip = await Trip.findByPk(tripId);
      console.log('🔍 Voyage trouvé:', trip ? 'OUI' : 'NON');
      
      if (!trip) {
        console.log('❌ Voyage non trouvé');
        return sendLocalizedResponse(
          res,
          'msg.trip_not_found',
          null,
          400,
          user
        );
      }

      const isAvailable = await TripCapacityService.checkAvailability(tripId, weight);
      if (!isAvailable) {
        return sendLocalizedResponse(
          res,
          'msg.insufficient_capacity',
          null,
          400,
          user
        );
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
      await NotificationService.notifyReservationCreated(transaction);

     
const formattedTransaction = translationService.formatTransactionForAPI(
  {
    id: transaction.id,
    amount: transaction.amount,
    status: transaction.status,
  },
  user,
  
);

      return sendLocalizedResponse(
        res,
        'msg.booking_confirmed',
        {
          transaction: formattedTransaction,
          payment: {
            clientSecret: 'test_client_secret',
            paymentIntentId: 'test_payment_intent',
          },
        },
        201,
        user
      );

    } catch (error: any) {
      console.error('❌ ERREUR DÉTAILLÉE createTransaction:', error);
      return sendLocalizedResponse(
        res,
        'msg.error_creating_booking',
        { details: error.message },
        500,
        (req as any).user
      );
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
        return sendLocalizedResponse(
          res,
          'msg.invalid_transaction_id',
          null,
          400,
          user
        );
      }

      console.log('🔄 Confirmation paiement pour transaction:', transactionId);

      const transaction = await Transaction.findOne({
        where: { id: transactionId, senderId: user.id },
      });

      if (!transaction) {
        return sendLocalizedResponse(
          res,
          'msg.transaction_not_found',
          null,
          404,
          user
        );
      }

      if (!transaction.stripePaymentIntentId) {
        return sendLocalizedResponse(
          res,
          'msg.no_payment_intent',
          null,
          400,
          user
        );
      }

      const paymentResult = await PaymentService.confirmPayment(
        transaction.stripePaymentIntentId,
        paymentMethodId
      );

      if (paymentResult.status === 'succeeded' || paymentResult.status === 'requires_capture') {
        await transaction.update({
          status: TransactionStatus.PAYMENT_ESCROWED,
        });

        await NotificationService.notifyPaymentConfirmed(transaction);
        console.log('✅ Paiement confirmé, statut mis à jour → PAYMENT_ESCROWED');
      }

      const formattedResult = {
        ...paymentResult,
        statusTranslated: translationService.translateTransactionStatus(
          TransactionStatus.PAYMENT_ESCROWED,
          user
        )
      };

      return sendLocalizedResponse(
        res,
        'msg.payment_confirmed',
        formattedResult,
        200,
        user
      );

    } catch (error: any) {
      console.error('❌ Erreur confirmation paiement:', error);
      return sendLocalizedResponse(
        res,
        'msg.error_confirming_payment',
        null,
        500,
        (req as any).user
      );
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
        return sendLocalizedResponse(
          res,
          'msg.invalid_transaction_id',
          null,
          400,
          user
        );
      }

      const transaction = await Transaction.findOne({
        where: { id: transactionId, travelerId: user.id },
      });

      if (!transaction) {
        return sendLocalizedResponse(
          res,
          'msg.transaction_not_found',
          null,
          404,
          user
        );
      }

      if (!pickupCode || transaction.pickupCode !== pickupCode) {
        return sendLocalizedResponse(
          res,
          'msg.invalid_pickup_code',
          null,
          400,
          user
        );
      }

      await transaction.update({
        status: TransactionStatus.PACKAGE_PICKED_UP,
        pickedUpAt: new Date(),
      });

      await NotificationService.notifyPickupReady(transaction);

      const io = require('../socket/socketInstance').getIO();
      if (io) {
        io.to(`user_${transaction.senderId}`).emit('transaction_updated', {
          transactionId: transaction.id,
          status: TransactionStatus.PACKAGE_PICKED_UP
        });
      }

      return sendLocalizedResponse(
        res,
        'msg.package_picked_up',
        null,
        200,
        user
      );

    } catch (error: any) {
      console.error('❌ Erreur confirmation récupération:', error);
      return sendLocalizedResponse(
        res,
        'msg.error_confirming_pickup',
        null,
        500,
        (req as any).user
      );
    }
  }

  static async confirmDelivery(req: Request, res: Response) {
    try {
      console.log('🔄 VERSION: Stripe Connect Logic v2.0 - Sep 09 2025');
      const idFromParams = Number(req.params.id);
      const idFromBody = Number(req.body?.transactionId);
      const transactionId = Number.isFinite(idFromParams) ? idFromParams : idFromBody;
      const { deliveryCode } = req.body;
      const user = (req as any).user;

      if (!Number.isFinite(transactionId)) {
        return sendLocalizedResponse(
          res,
          'msg.invalid_transaction_id',
          null,
          400,
          user
        );
      }

      const transaction = await Transaction.findOne({
        where: {
          id: transactionId,
          [Op.or]: [{ senderId: user.id }, { travelerId: user.id }],
        },
        include: [{ model: User, as: 'traveler' }]
      });

      if (!transaction) {
        return sendLocalizedResponse(
          res,
          'msg.transaction_not_found',
          null,
          404,
          user
        );
      }

      if (!deliveryCode || transaction.deliveryCode !== deliveryCode) {
        return sendLocalizedResponse(
          res,
          'msg.invalid_pickup_code',
          null,
          400,
          user
        );
      }

      if (transaction.stripePaymentIntentId) {
        console.log('✅ Payment Intent trouvé:', transaction.stripePaymentIntentId);
        
        try {
          console.log('✅ Début capture payment...');
          const captureResult = await PaymentService.capturePayment(transaction.stripePaymentIntentId);
          console.log('✅ Capture terminée');
        } catch (captureError: any) {
          if (captureError.message.includes('already been captured')) {
            console.log('ℹ️ PaymentIntent déjà capturé, continue...');
          } else {
            throw captureError;
          }
        }

        const traveler = transaction.traveler;
        await traveler.reload();

        if (traveler.paymentMethod === 'stripe_connect' && traveler.stripeConnectedAccountId) {
          console.log('🇪🇺 Utilisateur EU - Transfer Stripe Connect OBLIGATOIRE');
          
          const transferId = await StripeConnectService.transferToTraveler(
            traveler.id,
            parseFloat(transaction.travelerAmount.toString()),
            'USD',
            transaction.id
          );

          await transaction.update({
            status: TransactionStatus.PAYMENT_RELEASED,
            deliveredAt: new Date(),
            paymentReleasedAt: new Date(),
            stripeTransferId: transferId
          });

          console.log(`💳 Transfer automatique réussi ${transaction.travelerAmount}€ vers Stripe Connect ${traveler.id}`);

        } else {
          console.log('🇩🇿 Utilisateur DZ - Wallet manuel');
          await WalletService.creditWallet(
            transaction.travelerId,
            parseFloat(transaction.travelerAmount.toString()),
            transaction.id,
            `Paiement livraison confirmée #${transaction.id}`
          );

          await transaction.update({
            status: TransactionStatus.PAYMENT_RELEASED,
            deliveredAt: new Date(),
            paymentReleasedAt: new Date(),
          });

          console.log(`💰 ${transaction.travelerAmount}€ transféré vers le wallet du voyageur ${transaction.travelerId}`);
        }
      } else {
        return sendLocalizedResponse(
          res,
          'msg.no_payment_intent',
          null,
          400,
          user
        );
      }

      await NotificationService.notifyDeliveryConfirmed(transaction);

      try {
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
      } catch (socketError) {
        console.log('⚠️ WebSocket non disponible, continue sans notifications');
      }

      return sendLocalizedResponse(
        res,
        'msg.package_delivered',
        null,
        200,
        (req as any).user
      );

    } catch (error: any) {
      console.error('❌ Erreur confirmation livraison:', error);
      return sendLocalizedResponse(
        res,
        'msg.error_confirming_pickup',
        null,
        500,
        (req as any).user
      );
    }
  }

  static async getMyTransactions(req: Request, res: Response) {
    try {
      console.log('🔍 DEBUT getMyTransactions');
      const user = (req as any).user;
      
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

// PUIS appliquez les traductions APRÈS la conversion :
const formattedTransactions = convertedTransactions.map(transaction => {
  return translationService.formatTransactionForAPI(transaction, user);
});

      return sendLocalizedResponse(
        res,
        'msg.transactions_loaded',
        { transactions: convertedTransactions },
        200,
        user
      );

    } catch (error: any) {
      console.error('❌ Erreur getMyTransactions:', error);
      return sendLocalizedResponse(
        res,
        'msg.error_loading_transactions',
        null,
        500,
        (req as any).user
      );
    }
  }

  static async getTransactionDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const txId = Number(id);
      if (!Number.isFinite(txId)) {
        return sendLocalizedResponse(
          res,
          'msg.invalid_transaction_id',
          null,
          400,
          user
        );
      }

      const transaction = await Transaction.findOne({
        where: {
          id: txId,
          [Op.or]: [{ senderId: user.id }, { travelerId: user.id }],
        },
      });

      if (!transaction) {
        return sendLocalizedResponse(
          res,
          'msg.transaction_not_found',
          null,
          404,
          user
        );
      }

      
let formattedTransaction = translationService.formatTransactionForAPI(transaction.toJSON(), user);

      const forcedCurrency = req.headers['x-force-currency'] as string;
      const userCurrency = forcedCurrency || user.currency || 'DZD';
      
      let convertedTransaction;
      if (userCurrency !== 'EUR') {
        const converted = await CurrencyService.convertTransactions([formattedTransaction], userCurrency);
        convertedTransaction = converted[0];
      } else {
        convertedTransaction = {
          ...formattedTransaction,
          displayCurrency: 'EUR',
          currencySymbol: '€'
        };
      }

      return sendLocalizedResponse(
        res,
        'msg.transaction_loaded',
        { transaction: convertedTransaction },
        200,
        user
      );

    } catch (error: any) {
      console.error('❌ Erreur getTransactionDetails:', error);
      return sendLocalizedResponse(
        res,
        'msg.error_loading_transactions',
        null,
        500,
        (req as any).user
      );
    }
  }

  static async cancelTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const txId = Number(id);
      if (!Number.isFinite(txId)) {
        return sendLocalizedResponse(
          res,
          'msg.invalid_transaction_id',
          null,
          400,
          user
        );
      }

      const transaction = await Transaction.findOne({
        where: { 
          id: txId,
          [Op.or]: [{ senderId: user.id }, { travelerId: user.id }]
        }
      });

      if (!transaction) {
        return sendLocalizedResponse(
          res,
          'msg.transaction_not_found',
          null,
          404,
          user
        );
      }

      if (transaction.status !== TransactionStatus.PAYMENT_PENDING) {
        return sendLocalizedResponse(
          res,
          'msg.cannot_cancel_paid_transaction',
          null,
          400,
          user
        );
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

      await NotificationService.notifyTransactionCancelled(transaction, cancelledBy as 'sender' | 'traveler');
      await TripCapacityService.updateTripVisibility();

      await user.reload();

      return sendLocalizedResponse(
        res,
        'msg.transaction_cancelled',
        null,
        200,
        user
      );

    } catch (error: any) {
      console.error('❌ Erreur annulation transaction:', error);
      return sendLocalizedResponse(
        res,
        'msg.error_loading_transactions',
        null,
        500,
        (req as any).user
      );
    }
  }
}