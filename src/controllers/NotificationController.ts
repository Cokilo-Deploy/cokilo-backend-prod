// src/controllers/NotificationController.ts
import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { Op } from 'sequelize';

export class NotificationController {
  
  /**
   * GET /api/notifications - Récupérer mes notifications
   */
  static async getMyNotifications(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { page = 1, limit = 20 } = req.query;
      
      const offset = (Number(page) - 1) * Number(limit);
      
      const notifications = await Notification.findAndCountAll({
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
      
    } catch (error: any) {
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
  static async markAsRead(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      
      const notification = await Notification.findOne({
        where: { 
          id: Number(id), 
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
      
    } catch (error: any) {
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
  static async markAllAsRead(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      await Notification.update(
        { 
          isRead: true,
          readAt: new Date()
        },
        { 
          where: { 
            userId: user.id,
            isRead: false
          }
        }
      );
      
      return res.json({
        success: true,
        message: 'Toutes les notifications marquées comme lues'
      });
      
    } catch (error: any) {
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
  static async registerPushToken(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { pushToken, deviceType } = req.body;
      
      if (!pushToken) {
        return res.status(400).json({
          success: false,
          error: 'Token FCM requis'
        });
      }
      
      // Mettre à jour le token dans le profil utilisateur
      await User.update(
        { 
          pushToken: pushToken,
          deviceType: deviceType || 'unknown'
        },
        { 
          where: { id: user.id }
        }
      );
      
      console.log('📱 Token FCM enregistré pour user:', user.id);
      
      return res.json({
        success: true,
        message: 'Token d\'appareil enregistré'
      });
      
    } catch (error: any) {
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
  static async deleteNotification(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      
      const deleted = await Notification.destroy({
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
      
    } catch (error: any) {
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
  static async getUnreadCount(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      const count = await Notification.count({
        where: { 
          userId: user.id,
          isRead: false
        }
      });
      
      return res.json({
        success: true,
        data: { unreadCount: count }
      });
      
    } catch (error: any) {
      console.error('❌ Erreur getUnreadCount:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors du comptage'
      });
    }
  }
}