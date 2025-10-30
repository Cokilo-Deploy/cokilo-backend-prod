// src/services/NotificationService.ts
import { Transaction } from '../models/Transaction';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import ExpoPushService from './ExpoPushService';

export class NotificationService {
  
  /**
   * Envoyer une notification complète (Socket + DB + Push future)
   */
  static async  sendNotification(userId: number, type: string, title: string, body: string, data?: any) {
    try {
      // 1. Sauvegarder en DB
      const notification = await Notification.create({
        userId,
        type,
        title,
        body,
        data: data || {},
        isRead: false
      });
      
      // 2. Notification temps réel via Socket
      const io = require('../socket/socketInstance').getIO();
      if (io) {
        io.to(`user_${userId}`).emit('notification', {
          type,
          title,
          body,
          data,
          timestamp: new Date()
        });
      }

      // 3. 🆕 Envoyer Push Notification
      await ExpoPushService.sendPushNotification(
        userId,
        title,
        body,
        {
          notificationId: notification.id,
          type,
          ...data
        }
      );
      
      console.log('🔔 Notification envoyée à user:', userId, '- Type:', type);
      
    } catch (error) {
      console.error('❌ Erreur envoi notification:', error);
    }
  }

  // === NOUVELLES MÉTHODES POUR LE WORKFLOW ===
  
  static async notifyReservationCreated(transaction: Transaction) {
    await this.sendNotification(
      transaction.travelerId,
      'reservation_created',
      '🎒 Nouvelle réservation !',
      `${transaction.packageDescription.substring(0, 50)}... pour ${transaction.amount}€`,
      { transactionId: transaction.id, amount: transaction.amount }
    );
  }
  
  static async notifyPaymentConfirmed(transaction: Transaction) {
    // Au voyageur
    await this.sendNotification(
      transaction.travelerId,
      'payment_confirmed',
      '💳 Paiement reçu !',
      `${transaction.amount}€ sécurisés. Code récupération: ${transaction.pickupCode}`,
      { transactionId: transaction.id, pickupCode: transaction.pickupCode }
    );
    
    // À l'expéditeur
    await this.sendNotification(
      transaction.senderId,
      'payment_confirmed',
      '✅ Paiement confirmé',
      `Votre paiement de ${transaction.amount}€ est sécurisé.`,
      { transactionId: transaction.id }
    );
  }
  
  static async notifyPickupConfirmed(transaction: Transaction) {
    await this.sendNotification(
      transaction.senderId,
      'pickup_confirmed',
      '📦 Colis récupéré !',
      `Votre colis est en route. Code livraison: ${transaction.deliveryCode}`,
      { transactionId: transaction.id, deliveryCode: transaction.deliveryCode }
    );
  }
  
  static async notifyDeliveryConfirmed(transaction: Transaction) {
    // À l'expéditeur
    await this.sendNotification(
      transaction.senderId,
      'delivery_confirmed',
      '🎉 Livraison confirmée !',
      'Votre colis a été livré avec succès.',
      { transactionId: transaction.id }
    );
    
    // Au voyageur
    await this.sendNotification(
      transaction.travelerId,
      'payment_received',
      '💰 Paiement reçu !',
      `${transaction.travelerAmount}€ ajoutés à votre compte.`,
      { transactionId: transaction.id, amount: transaction.travelerAmount }
    );
  }
  
  static async notifyTransactionCancelled(transaction: Transaction, cancelledBy: 'sender' | 'traveler') {
    const otherUserId = cancelledBy === 'sender' ? transaction.travelerId : transaction.senderId;
    
    await this.sendNotification(
      otherUserId,
      'transaction_cancelled',
      '❌ Réservation annulée',
      `La réservation #${transaction.id} a été annulée.`,
      { transactionId: transaction.id }
    );
  }

  // === MÉTHODES EXISTANTES CONSERVÉES ===
  
  static notifyTransactionUpdate(transaction: any) {
    const io = require('../socket/socketInstance').getIO();
    if (io) {
      io.to(`user_${transaction.senderId}`).emit('transaction_updated', {
        transactionId: transaction.id,
        status: transaction.status,
        timestamp: new Date()
      });
           
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
 
  static notifyDeliveryConfirmed_Legacy(transaction: any) {
    const io = require('../socket/socketInstance').getIO();
    if (io) {
      io.to(`user_${transaction.senderId}`).emit('delivery_confirmed', {
        transactionId: transaction.id,
        deliveredAt: transaction.deliveredAt
      });
    }
  }
  /**
   * Créer une notification pour un nouveau message de chat
   */
  
static async notifyNewMessage(senderId: number, receiverId: number, conversationId: number, messageContent: string, senderName: string) {
  console.log('DEBUG NotificationService - senderId:', senderId, typeof senderId);
  console.log('DEBUG NotificationService - receiverId:', receiverId, typeof receiverId);
  console.log('DEBUG NotificationService - conversationId:', conversationId, typeof conversationId);
  
  if (isNaN(senderId) || isNaN(receiverId) || isNaN(conversationId)) {
    console.error('ERREUR: Paramètres NaN détectés');
    return;
  }
  
  await this.sendNotification(
    receiverId,
    'new_message',
    `Nouveau message de ${senderName}`,
    messageContent.length > 50 
      ? messageContent.substring(0, 50) + '...' 
      : messageContent,
    { 
      chatId: conversationId.toString(),
      senderId: senderId,
      conversationId: conversationId
    }
  );
}
}