"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const Notification_1 = require("../models/Notification");
const User_1 = require("../models/User");
const sequelize_1 = require("sequelize");
class NotificationController {
    /**
     * GET /api/notifications - Récupérer mes notifications
     */
    static async getMyNotifications(req, res) {
        try {
            const user = req.user;
            const { page = 1, limit = 20 } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            const notifications = await Notification_1.Notification.findAndCountAll({
                where: { userId: user.id },
                order: [['createdAt', 'DESC']],
                limit: Number(limit),
                offset: offset
            });
            return res.json({
                success: true,
                data: {
                    notifications: notifications.rows,
                    totalCount: notifications.count,
                    page: Number(page),
                    totalPages: Math.ceil(notifications.count / Number(limit))
                }
            });
        }
        catch (error) {
            console.error('❌ Erreur getMyNotifications:', error);
            return res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des notifications'
            });
        }
    }
    /**
     * PUT /api/notifications/:id/read - Marquer comme lue
     */
    static async markAsRead(req, res) {
        try {
            const user = req.user;
            const { id } = req.params;
            // AJOUT : Validation de l'ID
            console.log('markAsRead - ID reçu:', id, typeof id);
            const notificationId = parseInt(id);
            if (!id || isNaN(notificationId)) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de notification invalide'
                });
            }
            const notification = await Notification_1.Notification.findOne({
                where: {
                    id: notificationId, // Utiliser l'ID validé
                    userId: user.id
                }
            });
            if (!notification) {
                return res.status(404).json({
                    success: false,
                    error: 'Notification non trouvée'
                });
            }
            await notification.update({
                isRead: true,
                readAt: new Date()
            });
            return res.json({
                success: true,
                message: 'Notification marquée comme lue'
            });
        }
        catch (error) {
            console.error('❌ Erreur markAsRead:', error);
            return res.status(500).json({
                success: false,
                error: 'Erreur lors de la mise à jour'
            });
        }
    }
    /**
     * PUT /api/notifications/read-all - Marquer toutes comme lues
     */
    static async markAllAsRead(req, res) {
        try {
            const user = req.user;
            await Notification_1.Notification.update({
                isRead: true,
                readAt: new Date()
            }, {
                where: {
                    userId: user.id,
                    isRead: false
                }
            });
            return res.json({
                success: true,
                message: 'Toutes les notifications marquées comme lues'
            });
        }
        catch (error) {
            console.error('❌ Erreur markAllAsRead:', error);
            return res.status(500).json({
                success: false,
                error: 'Erreur lors de la mise à jour'
            });
        }
    }
    /**
     * POST /api/notifications/register-token - Enregistrer token FCM
     */
    static async registerPushToken(req, res) {
        try {
            const user = req.user;
            const { pushToken, deviceType } = req.body;
            if (!pushToken) {
                return res.status(400).json({
                    success: false,
                    error: 'Token FCM requis'
                });
            }
            // Mettre à jour le token dans le profil utilisateur
            await User_1.User.update({
                pushToken: pushToken,
                deviceType: deviceType || 'unknown'
            }, {
                where: { id: user.id }
            });
            console.log('📱 Token FCM enregistré pour user:', user.id);
            return res.json({
                success: true,
                message: 'Token d\'appareil enregistré'
            });
        }
        catch (error) {
            console.error('❌ Erreur registerPushToken:', error);
            return res.status(500).json({
                success: false,
                error: 'Erreur lors de l\'enregistrement du token'
            });
        }
    }
    /**
     * DELETE /api/notifications/:id - Supprimer notification
     */
    static async deleteNotification(req, res) {
        try {
            const user = req.user;
            const { id } = req.params;
            const deleted = await Notification_1.Notification.destroy({
                where: {
                    id: Number(id),
                    userId: user.id
                }
            });
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    error: 'Notification non trouvée'
                });
            }
            return res.json({
                success: true,
                message: 'Notification supprimée'
            });
        }
        catch (error) {
            console.error('❌ Erreur deleteNotification:', error);
            return res.status(500).json({
                success: false,
                error: 'Erreur lors de la suppression'
            });
        }
    }
    /**
     * GET /api/notifications/unread-count - Nombre non lues
     */
    // Dans votre NotificationController.ts - Modifiez seulement cette méthode
    static async getUnreadCount(req, res) {
        try {
            const user = req.user;
            const { type } = req.query; // AJOUT : récupérer le paramètre type
            // AJOUT : construire la condition where dynamiquement
            let whereCondition = {
                userId: user.id,
                isRead: false
            };
            // AJOUT : filtrer par type si spécifié
            if (type) {
                whereCondition.type = type;
            }
            const notifications = await Notification_1.Notification.findAll({
                where: whereCondition
            });
            console.log('DEBUG getUnreadCount - Notifications non lues:', notifications.map(n => ({
                id: n.id,
                type: n.type,
                title: n.title,
                isRead: n.isRead,
            })));
            const count = notifications.length;
            console.log('DEBUG getUnreadCount - Compteur final:', count);
            return res.json({
                success: true,
                data: { unreadCount: count }
            });
        }
        catch (error) {
            console.error('❌ Erreur getUnreadCount:', error);
            return res.status(500).json({
                success: false,
                error: 'Erreur lors du comptage'
            });
        }
    }
    // Dans votre NotificationController.ts - AJOUTEZ cette nouvelle méthode
    static async markChatAsRead(req, res) {
        try {
            const user = req.user;
            const { chatId } = req.body;
            if (!chatId) {
                return res.status(400).json({
                    success: false,
                    error: 'chatId requis'
                });
            }
            // Marquer toutes les notifications de type 'new_message' de ce chat comme lues
            await Notification_1.Notification.update({
                isRead: true,
                readAt: new Date()
            }, {
                where: {
                    userId: user.id,
                    type: 'new_message',
                    isRead: false,
                    // Utiliser une condition LIKE pour chercher dans le JSON
                    data: {
                        [sequelize_1.Op.like]: `%"chatId":"${chatId}"%`
                    }
                }
            });
            return res.json({
                success: true,
                message: 'Notifications du chat marquées comme lues'
            });
        }
        catch (error) {
            console.error('❌ Erreur markChatAsRead:', error);
            return res.status(500).json({
                success: false,
                error: 'Erreur serveur'
            });
        }
    }
}
exports.NotificationController = NotificationController;
