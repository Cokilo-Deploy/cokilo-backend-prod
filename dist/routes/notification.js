"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/notificationRoutes.ts
const express_1 = __importDefault(require("express"));
const NotificationController_1 = require("../controllers/NotificationController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Toutes les routes nécessitent une authentification
router.use(auth_1.authMiddleware);
// GET /api/notifications - Récupérer mes notifications
router.get('/', NotificationController_1.NotificationController.getMyNotifications);
// PUT /api/notifications/:id/read - Marquer une notification comme lue
router.put('/:id/read', NotificationController_1.NotificationController.markAsRead);
// PUT /api/notifications/read-all - Marquer toutes comme lues
router.put('/read-all', NotificationController_1.NotificationController.markAllAsRead);
// POST /api/notifications/register-token - Enregistrer le token FCM
router.post('/register-token', NotificationController_1.NotificationController.registerPushToken);
// DELETE /api/notifications/:id - Supprimer une notification
router.delete('/:id', NotificationController_1.NotificationController.deleteNotification);
// GET /api/notifications/unread-count - Nombre de notifications non lues
router.get('/unread-count', NotificationController_1.NotificationController.getUnreadCount);
// PUT /api/notifications/mark-chat-read - Marquer les notifications d'un chat comme lues
router.put('/mark-chat-read', NotificationController_1.NotificationController.markAsRead);
exports.default = router;
