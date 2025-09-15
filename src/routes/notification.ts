// src/routes/notificationRoutes.ts
import express from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware} from '../middleware/auth';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/notifications - Récupérer mes notifications
router.get('/', NotificationController.getMyNotifications);

// PUT /api/notifications/:id/read - Marquer une notification comme lue
router.put('/:id/read', NotificationController.markAsRead);

// PUT /api/notifications/read-all - Marquer toutes comme lues
router.put('/read-all', NotificationController.markAllAsRead);

// POST /api/notifications/register-token - Enregistrer le token FCM
router.post('/register-token', NotificationController.registerPushToken);

// DELETE /api/notifications/:id - Supprimer une notification
router.delete('/:id', NotificationController.deleteNotification);

// GET /api/notifications/unread-count - Nombre de notifications non lues
router.get('/unread-count', NotificationController.getUnreadCount);

export default router;