"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const sequelize_1 = require("sequelize");
const Transaction_1 = require("../models/Transaction");
const transaction_1 = require("../types/transaction");
const Trip_1 = require("../models/Trip");
const User_1 = require("../models/User");
const paymentService_1 = require("../services/paymentService");
const stripe_1 = __importDefault(require("stripe"));
const TripCapacityService_1 = require("../services/TripCapacityService");
const StripeConnectService_1 = require("../services/StripeConnectService");
const walletService_1 = require("../services/walletService");
const NotificationService_1 = require("../services/NotificationService");
const TranslationService_1 = require("../services/TranslationService");
const responseHelpers_1 = require("../utils/responseHelpers");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
});
function generateRandomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
function mapPackageType(frenchType) {
    const mapping = {
        'vêtements': transaction_1.PackageType.CLOTHES,
        'documents': transaction_1.PackageType.DOCUMENTS,
        'électronique': transaction_1.PackageType.ELECTRONICS,
        'electronique': transaction_1.PackageType.ELECTRONICS,
        'nourriture': transaction_1.PackageType.FOOD,
        'cadeaux': transaction_1.PackageType.GIFTS,
        'livres': transaction_1.PackageType.BOOKS,
        'autre': transaction_1.PackageType.OTHER,
        'autres': transaction_1.PackageType.OTHER,
    };
    if (!frenchType)
        return transaction_1.PackageType.OTHER;
    const normalized = frenchType.toLowerCase().trim();
    return mapping[normalized] || transaction_1.PackageType.OTHER;
}
class TransactionController {
    static async createPaymentIntent(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            const txId = Number(id);
            if (!Number.isFinite(txId)) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.invalid_transaction_id', null, 400, user);
            }
            console.log('🔄 Création Payment Intent pour transaction:', txId);
            const transaction = await Transaction_1.Transaction.findOne({
                where: { id: txId, senderId: user.id },
            });
            if (!transaction) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.transaction_not_found', null, 404, user);
            }
            if (transaction.status !== transaction_1.TransactionStatus.PAYMENT_PENDING) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.transaction_already_processed', null, 400, user);
            }
            if (transaction.stripePaymentIntentId) {
                console.log('♻️ Payment Intent existant:', transaction.stripePaymentIntentId);
                try {
                    const paymentIntent = await stripe.paymentIntents.retrieve(transaction.stripePaymentIntentId);
                    return res.json({
                        success: true,
                        client_secret: paymentIntent.client_secret,
                        clientSecret: paymentIntent.client_secret,
                        paymentIntentId: transaction.stripePaymentIntentId,
                        message: TranslationService_1.translationService.t('msg.payment_intent_retrieved', user, 'Payment intent récupéré'),
                        locale: user?.language || 'fr'
                    });
                }
                catch (stripeError) {
                    console.log('⚠️ Payment Intent invalide côté Stripe; création d@un nouveau…');
                }
            }
            console.log('🆕 Création nouveau Payment Intent (PaymentService)…');
            const safeDesc = (transaction.packageDescription || '').toString();
            const description = 'CoKilo - Livraison: ' + (safeDesc.length > 50 ? safeDesc.slice(0, 50) + '…' : safeDesc);
            const paymentData = await paymentService_1.PaymentService.createEscrowPayment(parseFloat(transaction.amount.toString()), 'cus_default', transaction.id, description);
            await transaction.update({
                stripePaymentIntentId: paymentData.paymentIntentId,
                status: transaction_1.TransactionStatus.PAYMENT_ESCROWED,
            });
            console.log('✅ Payment Intent créé et statut mis à jour:', paymentData.paymentIntentId);
            return res.json({
                success: true,
                client_secret: paymentData.clientSecret,
                clientSecret: paymentData.clientSecret,
                paymentIntentId: paymentData.paymentIntentId,
                message: TranslationService_1.translationService.t('msg.payment_intent_created', user, 'Payment intent créé'),
                locale: user?.language || 'fr'
            });
        }
        catch (error) {
            console.error('❌ Erreur création Payment Intent:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.error_creating_payment', null, 500, req.user);
        }
    }
    static async createTransaction(req, res) {
        try {
            console.log('🔍 === DEBUT createTransaction ===');
            const user = req.user;
            const { tripId, weight, description, itemType, specialInstructions } = req.body;
            console.log('🔍 Données extraites:', { tripId, weight, description, itemType });
            if (!description || description.trim().length < 10) {
                console.log('❌ Description trop courte');
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.description_too_short', null, 400, user);
            }
            console.log('🔍 Recherche du voyage tripId:', tripId);
            const trip = await Trip_1.Trip.findByPk(tripId);
            console.log('🔍 Voyage trouvé:', trip ? 'OUI' : 'NON');
            if (!trip) {
                console.log('❌ Voyage non trouvé');
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.trip_not_found', null, 400, user);
            }
            const isAvailable = await TripCapacityService_1.TripCapacityService.checkAvailability(tripId, weight);
            if (!isAvailable) {
                console.log('❌ REJETÉ - Capacité insuffisante');
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.insufficient_capacity', null, 400, user);
            }
            const amount = parseFloat((Number(weight) * Number(trip.pricePerKg)).toFixed(2));
            console.log('🔍 Montant calculé:', amount);
            const mappedPackageType = mapPackageType(itemType);
            const transaction = await Transaction_1.Transaction.create({
                travelerId: trip.travelerId,
                senderId: user.id,
                tripId: trip.id,
                amount,
                packageDescription: description,
                packageType: mappedPackageType,
                packageWeight: weight,
                notes: specialInstructions || '',
                currency: 'EUR',
                status: transaction_1.TransactionStatus.PAYMENT_PENDING,
                packagePhotos: [],
                pickupAddress: '',
                deliveryAddress: '',
                packageValue: 0,
                pickupCode: generateRandomCode(),
                deliveryCode: generateRandomCode(),
            });
            await TripCapacityService_1.TripCapacityService.reserveCapacity(tripId, weight);
            await TripCapacityService_1.TripCapacityService.updateTripVisibility();
            await NotificationService_1.NotificationService.notifyReservationCreated(transaction);
            const formattedTransaction = TranslationService_1.translationService.formatTransactionForAPI({
                id: transaction.id,
                amount: transaction.amount,
                status: transaction.status,
            }, user);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.booking_confirmed', {
                transaction: formattedTransaction,
                payment: {
                    clientSecret: 'test_client_secret',
                    paymentIntentId: 'test_payment_intent',
                },
            }, 201, user);
        }
        catch (error) {
            console.error('❌ ERREUR DÉTAILLÉE createTransaction:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.error_creating_booking', { details: error.message }, 500, req.user);
        }
    }
    static async confirmPayment(req, res) {
        try {
            const idFromParams = Number(req.params.id);
            const idFromBody = Number(req.body?.transactionId);
            const transactionId = Number.isFinite(idFromParams) ? idFromParams : idFromBody;
            const { paymentMethodId } = req.body;
            const user = req.user;
            if (!Number.isFinite(transactionId)) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.invalid_transaction_id', null, 400, user);
            }
            console.log('🔄 Confirmation paiement pour transaction:', transactionId);
            const transaction = await Transaction_1.Transaction.findOne({
                where: { id: transactionId, senderId: user.id },
            });
            if (!transaction) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.transaction_not_found', null, 404, user);
            }
            if (!transaction.stripePaymentIntentId) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.no_payment_intent', null, 400, user);
            }
            const paymentResult = await paymentService_1.PaymentService.confirmPayment(transaction.stripePaymentIntentId, paymentMethodId);
            if (paymentResult.status === 'succeeded' || paymentResult.status === 'requires_capture') {
                await transaction.update({
                    status: transaction_1.TransactionStatus.PAYMENT_ESCROWED,
                });
                await NotificationService_1.NotificationService.notifyPaymentConfirmed(transaction);
                console.log('✅ Paiement confirmé, statut mis à jour → PAYMENT_ESCROWED');
            }
            const formattedResult = {
                ...paymentResult,
                statusTranslated: TranslationService_1.translationService.translateTransactionStatus(transaction_1.TransactionStatus.PAYMENT_ESCROWED, user)
            };
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.payment_confirmed', formattedResult, 200, user);
        }
        catch (error) {
            console.error('❌ Erreur confirmation paiement:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.error_confirming_payment', null, 500, req.user);
        }
    }
    static async confirmPickup(req, res) {
        try {
            const idFromParams = Number(req.params.id);
            const idFromBody = Number(req.body?.transactionId);
            const transactionId = Number.isFinite(idFromParams) ? idFromParams : idFromBody;
            const { pickupCode } = req.body;
            const user = req.user;
            if (!Number.isFinite(transactionId)) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.invalid_transaction_id', null, 400, user);
            }
            const transaction = await Transaction_1.Transaction.findOne({
                where: { id: transactionId, travelerId: user.id },
            });
            if (!transaction) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.transaction_not_found', null, 404, user);
            }
            if (!pickupCode || transaction.pickupCode !== pickupCode) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.invalid_pickup_code', null, 400, user);
            }
            await transaction.update({
                status: transaction_1.TransactionStatus.PACKAGE_PICKED_UP,
                pickedUpAt: new Date(),
            });
            await NotificationService_1.NotificationService.notifyPickupReady(transaction);
            const io = require('../socket/socketInstance').getIO();
            if (io) {
                io.to(`user_${transaction.senderId}`).emit('transaction_updated', {
                    transactionId: transaction.id,
                    status: transaction_1.TransactionStatus.PACKAGE_PICKED_UP
                });
            }
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.package_picked_up', null, 200, user);
        }
        catch (error) {
            console.error('❌ Erreur confirmation récupération:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.error_confirming_pickup', null, 500, req.user);
        }
    }
    static async confirmDelivery(req, res) {
        try {
            console.log('🔄 VERSION: Stripe Connect Logic v2.0 - Sep 09 2025');
            const idFromParams = Number(req.params.id);
            const idFromBody = Number(req.body?.transactionId);
            const transactionId = Number.isFinite(idFromParams) ? idFromParams : idFromBody;
            const { deliveryCode } = req.body;
            const user = req.user;
            if (!Number.isFinite(transactionId)) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.invalid_transaction_id', null, 400, user);
            }
            const transaction = await Transaction_1.Transaction.findOne({
                where: {
                    id: transactionId,
                    [sequelize_1.Op.or]: [{ senderId: user.id }, { travelerId: user.id }],
                },
                include: [{ model: User_1.User, as: 'traveler' }]
            });
            if (!transaction) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.transaction_not_found', null, 404, user);
            }
            if (!deliveryCode || transaction.deliveryCode !== deliveryCode) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.invalid_pickup_code', null, 400, user);
            }
            if (transaction.stripePaymentIntentId) {
                console.log('✅ Payment Intent trouvé:', transaction.stripePaymentIntentId);
                try {
                    console.log('✅ Début capture payment...');
                    const captureResult = await paymentService_1.PaymentService.capturePayment(transaction.stripePaymentIntentId);
                    console.log('✅ Capture terminée');
                }
                catch (captureError) {
                    if (captureError.message.includes('already been captured')) {
                        console.log('ℹ️ PaymentIntent déjà capturé, continue...');
                    }
                    else {
                        throw captureError;
                    }
                }
                const traveler = transaction.traveler;
                await traveler.reload();
                if (traveler.paymentMethod === 'stripe_connect' && traveler.stripeConnectedAccountId) {
                    console.log('🇪🇺 Utilisateur EU - Transfer Stripe Connect OBLIGATOIRE');
                    const transferId = await StripeConnectService_1.StripeConnectService.transferToTraveler(traveler.id, parseFloat(transaction.travelerAmount.toString()), 'USD', transaction.id);
                    await transaction.update({
                        status: transaction_1.TransactionStatus.PAYMENT_RELEASED,
                        deliveredAt: new Date(),
                        paymentReleasedAt: new Date(),
                        stripeTransferId: transferId
                    });
                    console.log(`💳 Transfer automatique réussi ${transaction.travelerAmount}€ vers Stripe Connect ${traveler.id}`);
                }
                else {
                    console.log('🇩🇿 Utilisateur DZ - Wallet manuel');
                    await walletService_1.WalletService.creditWallet(transaction.travelerId, parseFloat(transaction.travelerAmount.toString()), transaction.id, `Paiement livraison confirmée #${transaction.id}`);
                    await transaction.update({
                        status: transaction_1.TransactionStatus.PAYMENT_RELEASED,
                        deliveredAt: new Date(),
                        paymentReleasedAt: new Date(),
                    });
                    console.log(`💰 ${transaction.travelerAmount}€ transféré vers le wallet du voyageur ${transaction.travelerId}`);
                }
            }
            else {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.no_payment_intent', null, 400, user);
            }
            await NotificationService_1.NotificationService.notifyDeliveryConfirmed(transaction);
            try {
                const io = require('../socket/socketInstance').getIO();
                if (io) {
                    io.to(`user_${transaction.senderId}`).emit('transaction_updated', {
                        transactionId: transaction.id,
                        status: transaction_1.TransactionStatus.PAYMENT_RELEASED
                    });
                    io.to(`user_${transaction.travelerId}`).emit('payment_received', {
                        transactionId: transaction.id,
                        amount: transaction.travelerAmount
                    });
                }
            }
            catch (socketError) {
                console.log('⚠️ WebSocket non disponible, continue sans notifications');
            }
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.package_delivered', null, 200, req.user);
        }
        catch (error) {
            console.error('❌ Erreur confirmation livraison:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.error_confirming_pickup', null, 500, req.user);
        }
    }
    static async getMyTransactions(req, res) {
        try {
            console.log('🔍 DEBUT getMyTransactions');
            const user = req.user;
            const senderTransactions = await Transaction_1.Transaction.findAll({
                where: { senderId: user.id },
                order: [['createdAt', 'DESC']],
            });
            const travelerTransactions = await Transaction_1.Transaction.findAll({
                where: { travelerId: user.id },
                order: [['createdAt', 'DESC']],
            });
            const allUserTransactions = [...senderTransactions, ...travelerTransactions];
            const uniqueTransactions = allUserTransactions.filter((transaction, index, array) => array.findIndex((t) => t.id === transaction.id) === index);
            uniqueTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            let convertedTransactions;
            // PUIS appliquez les traductions APRÈS la conversion :
            const formattedTransactions = uniqueTransactions.map(transaction => {
                const txData = transaction.toJSON();
                return {
                    ...TranslationService_1.translationService.formatTransactionForAPI(txData, user),
                    displayCurrency: 'EUR',
                    currencySymbol: '€'
                };
            });
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.transactions_loaded', { transactions: formattedTransactions }, 200, user);
        }
        catch (error) {
            console.error('❌ Erreur getMyTransactions:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.error_loading_transactions', null, 500, req.user);
        }
    }
    static async getTransactionDetails(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            const txId = Number(id);
            if (!Number.isFinite(txId)) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.invalid_transaction_id', null, 400, user);
            }
            const transaction = await Transaction_1.Transaction.findOne({
                where: {
                    id: txId,
                    [sequelize_1.Op.or]: [{ senderId: user.id }, { travelerId: user.id }],
                },
            });
            if (!transaction) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.transaction_not_found', null, 404, user);
            }
            const formattedTransaction = TranslationService_1.translationService.formatTransactionForAPI(transaction.toJSON(), user);
            const transactionWithCurrency = {
                ...formattedTransaction,
                displayCurrency: 'EUR',
                currencySymbol: '€'
            };
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.transaction_loaded', { transaction: transactionWithCurrency }, 200, user);
        }
        catch (error) {
            console.error('❌ Erreur getTransactionDetails:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.error_loading_transactions', null, 500, req.user);
        }
    }
    static async cancelTransaction(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            const txId = Number(id);
            if (!Number.isFinite(txId)) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.invalid_transaction_id', null, 400, user);
            }
            const transaction = await Transaction_1.Transaction.findOne({
                where: {
                    id: txId,
                    [sequelize_1.Op.or]: [{ senderId: user.id }, { travelerId: user.id }]
                }
            });
            if (!transaction) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.transaction_not_found', null, 404, user);
            }
            if (transaction.status !== transaction_1.TransactionStatus.PAYMENT_PENDING) {
                return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.cannot_cancel_paid_transaction', null, 400, user);
            }
            let cancelledBy = 'unknown';
            if (user.id === transaction.senderId) {
                cancelledBy = 'sender';
            }
            else if (user.id === transaction.travelerId) {
                cancelledBy = 'traveler';
            }
            await TripCapacityService_1.TripCapacityService.releaseCapacity(transaction.tripId, transaction.packageWeight);
            await transaction.update({
                status: transaction_1.TransactionStatus.CANCELLED,
                internalNotes: `Annulée par ${cancelledBy}`
            });
            await NotificationService_1.NotificationService.notifyTransactionCancelled(transaction, cancelledBy);
            await TripCapacityService_1.TripCapacityService.updateTripVisibility();
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.transaction_cancelled', null, 200, user);
        }
        catch (error) {
            console.error('❌ Erreur annulation transaction:', error);
            return (0, responseHelpers_1.sendLocalizedResponse)(res, 'msg.error_loading_transactions', null, 500, req.user);
        }
    }
}
exports.TransactionController = TransactionController;
