"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/ExpoPushService.ts
const expo_server_sdk_1 = require("expo-server-sdk");
const User_1 = require("../models/User");
class ExpoPushService {
    constructor() {
        this.expo = new expo_server_sdk_1.Expo();
    }
    /**
     * Envoyer une notification push à un utilisateur
     */
    async sendPushNotification(userId, title, body, data) {
        try {
            const user = await User_1.User.findByPk(userId);
            if (!user || !user.pushToken) {
                console.log(`📱 Pas de push token pour user ${userId}`);
                return false;
            }
            if (!expo_server_sdk_1.Expo.isExpoPushToken(user.pushToken)) {
                console.error(`❌ Token Expo invalide pour user ${userId}`);
                return false;
            }
            const message = {
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
                }
                catch (error) {
                    console.error('❌ Erreur envoi push notification:', error);
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            console.error('❌ Erreur sendPushNotification:', error);
            return false;
        }
    }
    /**
     * Envoyer des notifications à plusieurs utilisateurs
     */
    async sendBulkPushNotifications(userIds, title, body, data) {
        try {
            const users = await User_1.User.findAll({
                where: {
                    id: userIds
                }
            });
            const messages = users
                .filter(user => user.pushToken && expo_server_sdk_1.Expo.isExpoPushToken(user.pushToken))
                .map(user => ({
                to: user.pushToken,
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
                }
                catch (error) {
                    console.error('❌ Erreur envoi bulk push:', error);
                }
            }
        }
        catch (error) {
            console.error('❌ Erreur sendBulkPushNotifications:', error);
        }
    }
    /**
     * Gérer les tickets de réponse
     */
    async handleTickets(tickets, userId) {
        for (const ticket of tickets) {
            if (ticket.status === 'error') {
                console.error(`❌ Erreur push notification:`, ticket.message);
                // Si le device n'est plus enregistré, supprimer le token
                if (ticket.details && 'error' in ticket.details) {
                    const errorCode = ticket.details.error;
                    if (errorCode === 'DeviceNotRegistered' && userId) {
                        console.log(`🗑️ Suppression du token invalide pour user ${userId}`);
                        await User_1.User.update({
                            pushToken: null,
                            deviceType: null
                        }, { where: { id: userId } });
                    }
                }
            }
            else if (ticket.status === 'ok') {
                console.log('✅ Notification envoyée avec succès:', ticket.id);
            }
        }
    }
}
exports.default = new ExpoPushService();
