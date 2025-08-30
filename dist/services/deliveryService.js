"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryService = void 0;
const Transaction_1 = require("../models/Transaction");
const transaction_1 = require("../types/transaction");
const paymentService_1 = require("./paymentService");
const User_1 = require("../models/User");
const crypto_1 = __importDefault(require("crypto"));
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-07-30.basil',
});
class DeliveryService {
    static generateDeliveryCode() {
        return crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
    }
    static async confirmPickup(transactionId, travelerId, pickupPhotos) {
        const transaction = await Transaction_1.Transaction.findOne({
            where: { id: transactionId, travelerId },
            include: [
                { model: User_1.User, as: 'sender' },
                { model: User_1.User, as: 'traveler' }
            ],
        });
        if (!transaction)
            throw new Error('Transaction non trouvée');
        if (transaction.status !== transaction_1.TransactionStatus.PAYMENT_ESCROWED)
            throw new Error(`Transaction dans un état incorrect: ${transaction.status}`);
        if (pickupPhotos?.length) {
            transaction.packagePhotos = [...(transaction.packagePhotos || []), ...pickupPhotos];
        }
        await transaction.update({
            status: transaction_1.TransactionStatus.PACKAGE_PICKED_UP,
            pickedUpAt: new Date(),
        });
        console.log(`📦 Colis récupéré - Transaction ${transactionId} - Code: ${transaction.deliveryCode}`);
        return {
            success: true,
            deliveryCode: transaction.deliveryCode,
            transaction: {
                id: transaction.id,
                status: transaction.status,
                pickupCode: transaction.pickupCode,
                deliveryCode: transaction.deliveryCode,
                pickedUpAt: transaction.pickedUpAt,
            },
            message: 'Colis récupéré avec succès. Donnez le code de récupération à l\'expéditeur.',
        };
    }
    static async confirmDelivery(transactionId, travelerId, deliveryCode, deliveryPhotos) {
        const transaction = await Transaction_1.Transaction.findOne({
            where: { id: transactionId, travelerId, deliveryCode: deliveryCode.toUpperCase() },
            include: [
                { model: User_1.User, as: 'sender' },
                { model: User_1.User, as: 'traveler' }
            ],
        });
        if (!transaction)
            throw new Error('Transaction non trouvée ou code de livraison incorrect');
        if (transaction.status !== transaction_1.TransactionStatus.PACKAGE_PICKED_UP)
            throw new Error(`Transaction dans un état incorrect: ${transaction.status}`);
        if (deliveryPhotos?.length) {
            transaction.packagePhotos = [...(transaction.packagePhotos || []), ...deliveryPhotos];
        }
        await transaction.update({
            status: transaction_1.TransactionStatus.PACKAGE_DELIVERED,
            deliveredAt: new Date(),
        });
        console.log(`✅ Colis livré - Transaction ${transactionId}`);
        return {
            success: true,
            transaction: {
                id: transaction.id,
                status: transaction.status,
                deliveredAt: transaction.deliveredAt,
            },
            message: 'Colis livré avec succès. Le paiement sera libéré automatiquement.',
            nextStep: 'RELEASE_PAYMENT',
        };
    }
    static async releasePayment(transactionId) {
        const transaction = await Transaction_1.Transaction.findOne({
            where: { id: transactionId },
            include: [
                { model: User_1.User, as: 'sender' },
                { model: User_1.User, as: 'traveler' }
            ],
        });
        if (!transaction)
            throw new Error('Transaction non trouvée');
        if (transaction.status !== transaction_1.TransactionStatus.PACKAGE_DELIVERED)
            throw new Error(`Transaction dans un état incorrect: ${transaction.status}`);
        const paymentResult = await paymentService_1.PaymentService.capturePayment(transaction.stripePaymentIntentId);
        await transaction.update({
            status: transaction_1.TransactionStatus.PAYMENT_RELEASED,
            paymentReleasedAt: new Date(),
        });
        if (transaction.traveler) {
            await transaction.traveler.update({
                totalTrips: (transaction.traveler.totalTrips || 0) + 1,
                totalEarnings: (transaction.traveler.totalEarnings || 0) + transaction.travelerAmount,
            });
        }
        console.log(`💰 Paiement libéré - Transaction ${transactionId} - Montant: ${transaction.travelerAmount}€`);
        return {
            success: true,
            transaction: {
                id: transaction.id,
                status: transaction.status,
                paymentReleasedAt: transaction.paymentReleasedAt,
                travelerAmount: transaction.travelerAmount,
            },
            paymentDetails: paymentResult,
            message: 'Paiement libéré avec succès.',
        };
    }
    static async cancelTransaction(transactionId, cancelledBy, reason) {
        const transaction = await Transaction_1.Transaction.findOne({
            where: { id: transactionId },
            include: [
                { model: User_1.User, as: 'traveler' },
                { model: User_1.User, as: 'sender' }
            ]
        });
        if (!transaction)
            throw new Error('Transaction non trouvée');
        if ([transaction_1.TransactionStatus.PACKAGE_DELIVERED, transaction_1.TransactionStatus.PAYMENT_RELEASED].includes(transaction.status)) {
            throw new Error('Transaction ne peut plus être annulée');
        }
        let refundResult = null;
        if ([transaction_1.TransactionStatus.PAYMENT_ESCROWED, transaction_1.TransactionStatus.PACKAGE_PICKED_UP].includes(transaction.status)) {
            if (transaction.status === transaction_1.TransactionStatus.PAYMENT_ESCROWED) {
                refundResult = await paymentService_1.PaymentService.cancelPayment(transaction.stripePaymentIntentId, 'requested_by_customer');
            }
            else {
                refundResult = await paymentService_1.PaymentService.refundPayment(transaction.stripePaymentIntentId, transaction.amount, reason);
            }
        }
        await transaction.update({
            status: transaction_1.TransactionStatus.CANCELLED,
            internalNotes: `Annulée par ${cancelledBy}: ${reason}`,
        });
        console.log(`🚫 Transaction annulée - ${transactionId} par ${cancelledBy}`);
        return {
            success: true,
            transaction: { id: transaction.id, status: transaction.status },
            refundDetails: refundResult,
            message: 'Transaction annulée et remboursement traité.',
        };
    }
    static async getTransactionHistory(transactionId) {
        const transaction = await Transaction_1.Transaction.findOne({
            where: { id: transactionId },
            include: [
                { model: User_1.User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: User_1.User, as: 'traveler', attributes: ['id', 'firstName', 'lastName', 'email'] }
            ]
        });
        if (!transaction)
            throw new Error('Transaction non trouvée');
        return {
            transaction: {
                id: transaction.id,
                status: transaction.status,
                amount: transaction.amount,
                serviceFee: transaction.serviceFee,
                travelerAmount: transaction.travelerAmount,
                packageDescription: transaction.packageDescription,
                packageWeight: transaction.packageWeight,
                pickupAddress: transaction.pickupAddress,
                deliveryAddress: transaction.deliveryAddress,
                statusHistory: transaction.statusHistory,
                createdAt: transaction.createdAt,
                pickedUpAt: transaction.pickedUpAt,
                deliveredAt: transaction.deliveredAt,
                paymentReleasedAt: transaction.paymentReleasedAt,
            },
            participants: {
                // CORRECTION: Utiliser senderId au lieu de sender
                sender: transaction.senderId || null,
                traveler: transaction.traveler || null,
            },
        };
    }
}
exports.DeliveryService = DeliveryService;
