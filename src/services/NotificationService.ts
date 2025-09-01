// src/services/NotificationService.ts
import { Transaction } from '../models/Transaction';

export class NotificationService {
  static notifyTransactionUpdate(transaction: any) {
    const io = require('../socket/socketInstance').getIO();
    if (io) {
      // Notifier l'expéditeur
      io.to(`user_${transaction.senderId}`).emit('transaction_updated', {
        transactionId: transaction.id,
        status: transaction.status,
        timestamp: new Date()
      });
      
      // Notifier le voyageur
      io.to(`user_${transaction.travelerId}`).emit('transaction_updated', {
        transactionId: transaction.id,
        status: transaction.status,
        timestamp: new Date()
      });
    }
  }
  
  static notifyPaymentReceived(userId: number, amount: number, transactionId: number) {
    const io = require('../socket/socketInstance').getIO();
    if (io) {
      io.to(`user_${userId}`).emit('wallet_updated', {
        amount: amount,
        transactionId: transactionId,
        type: 'credit',
        message: `Paiement reçu: ${amount}€`
      });
    }
  }

  static notifyPickupReady(transaction: any) {
    const io = require('../socket/socketInstance').getIO();
    if (io) {
      io.to(`user_${transaction.travelerId}`).emit('pickup_ready', {
        transactionId: transaction.id,
        pickupCode: transaction.pickupCode
      });
    }
  }

  static notifyDeliveryConfirmed(transaction: any) {
    const io = require('../socket/socketInstance').getIO();
    if (io) {
      io.to(`user_${transaction.senderId}`).emit('delivery_confirmed', {
        transactionId: transaction.id,
        deliveredAt: transaction.deliveredAt
      });
    }
  }
}