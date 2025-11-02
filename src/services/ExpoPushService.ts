// src/services/ExpoPushService.ts
import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushSuccessTicket } from 'expo-server-sdk';
import { User } from '../models/User';

class ExpoPushService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo();
  }

  /**
   * Envoyer une notification push à un utilisateur
   */
  
async sendPushNotification(
  userId: number,
  title: string,
  body: string,
  data?: any
): Promise<boolean> {
  try {
    const user = await User.findByPk(userId);
    
    if (!user || !user.pushToken) {
      console.log(`📱 Pas de push token pour user ${userId}`);
      return false;
    }

    if (!Expo.isExpoPushToken(user.pushToken)) {
      console.error(`❌ Token Expo invalide pour user ${userId}`);
      return false;
    }

    const message: ExpoPushMessage = {
      to: user.pushToken,
      sound: 'default', // 🔊 Son
      title,
      body,
      data: data || {},
      priority: 'high', // 🔥 Priorité haute
      channelId: data?.type === 'new_message' ? 'messages' : 'default', // 🆕 Canal spécifique
    };

    const chunks = this.expo.chunkPushNotifications([message]);
    
    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        console.log('✅ Push notification envoyée:', ticketChunk);
        this.handleTickets(ticketChunk, userId);
        return true;
      } catch (error) {
        console.error('❌ Erreur envoi push notification:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur sendPushNotification:', error);
    return false;
  }
}

  /**
   * Envoyer des notifications à plusieurs utilisateurs
   */
  async sendBulkPushNotifications(
    userIds: number[],
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      const users = await User.findAll({
        where: {
          id: userIds
        }
      });

      const messages: ExpoPushMessage[] = users
        .filter(user => user.pushToken && Expo.isExpoPushToken(user.pushToken))
        .map(user => ({
          to: user.pushToken!,
          sound: 'default',
          title,
          body,
          data: data || {},
          priority: 'high',
        }));

      if (messages.length === 0) {
        console.log('📱 Aucun token valide pour envoyer les notifications');
        return;
      }

      const chunks = this.expo.chunkPushNotifications(messages);

      for (const chunk of chunks) {
        try {
          await this.expo.sendPushNotificationsAsync(chunk);
          console.log(`✅ ${chunk.length} notifications envoyées`);
        } catch (error) {
          console.error('❌ Erreur envoi bulk push:', error);
        }
      }
    } catch (error) {
      console.error('❌ Erreur sendBulkPushNotifications:', error);
    }
  }

  /**
   * Gérer les tickets de réponse
   */
  private async handleTickets(tickets: ExpoPushTicket[], userId?: number): Promise<void> {
    for (const ticket of tickets) {
      if (ticket.status === 'error') {
        console.error(`❌ Erreur push notification:`, ticket.message);
        
        // Si le device n'est plus enregistré, supprimer le token
        if (ticket.details && 'error' in ticket.details) {
          const errorCode = ticket.details.error;
          
          if (errorCode === 'DeviceNotRegistered' && userId) {
            console.log(`🗑️ Suppression du token invalide pour user ${userId}`);
            await User.update(
  { 
    pushToken: null as any, 
    deviceType: null as any 
  },
  { where: { id: userId } }
);
          }
        }
      } else if (ticket.status === 'ok') {
        console.log('✅ Notification envoyée avec succès:', (ticket as ExpoPushSuccessTicket).id);
      }
    }
  }
}

export default new ExpoPushService();