"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const sequelize_1 = require("sequelize");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const NotificationService_1 = require("../services/NotificationService");
const Notification_1 = require("../models/Notification");
const router = (0, express_1.Router)();
// Configuration multer pour l'upload d'images
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/chat/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB max
        files: 1, // 1 fichier à la fois
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Seulement les images sont autorisées'));
        }
    }
});
// Appliquer l'auth à toutes les routes chat
router.use(auth_1.authMiddleware);
// Route de test
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'API Chat fonctionne',
        user: req.user?.id
    });
});
// Upload d'image
router.post('/upload', upload.single('image'), (req, res) => {
    console.log('📸 Upload reçu:', req.file); // AJOUTEZ CE LOG
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucune image uploadée' });
        }
        const imageUrl = `/uploads/chat/${req.file.filename}`;
        console.log('📸 Image sauvegardée:', imageUrl);
        res.json({
            success: true,
            url: imageUrl,
            type: req.file.mimetype,
            size: req.file.size
        });
    }
    catch (error) {
        console.error('Erreur upload image:', error);
        res.status(500).json({ error: 'Erreur upload' });
    }
});
// Créer ou récupérer une conversation
router.post('/conversations', async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId, transactionId } = req.body;
        if (!otherUserId) {
            return res.status(400).json({ error: 'otherUserId requis' });
        }
        if (otherUserId === userId) {
            return res.status(400).json({ error: 'Impossible de créer une conversation avec soi-même' });
        }
        const user1Id = Math.min(userId, otherUserId);
        const user2Id = Math.max(userId, otherUserId);
        let conversation = await models_1.ChatConversation.findOne({
            where: {
                user1Id,
                user2Id,
                ...(transactionId && { transactionId })
            }
        });
        if (!conversation) {
            conversation = await models_1.ChatConversation.create({
                user1Id,
                user2Id,
                transactionId
            });
        }
        res.json({
            success: true,
            conversation: {
                id: conversation.id,
                user1Id: conversation.user1Id,
                user2Id: conversation.user2Id,
                transactionId: conversation.transactionId,
                createdAt: conversation.createdAt
            }
        });
    }
    catch (error) {
        console.error('Erreur création conversation:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Récupérer les conversations de l'utilisateur
// Récupérer les conversations de l'utilisateur
// Récupérer les conversations de l'utilisateur
router.get('/conversations', async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await models_1.ChatConversation.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    { user1Id: userId },
                    { user2Id: userId }
                ]
            },
            include: [
                {
                    model: models_1.User,
                    as: 'user1',
                    attributes: ['id', 'firstName', 'lastName', 'avatar']
                },
                {
                    model: models_1.User,
                    as: 'user2',
                    attributes: ['id', 'firstName', 'lastName', 'avatar']
                },
                {
                    model: models_1.Transaction,
                    as: 'transaction',
                    required: false,
                    attributes: ['id', 'packageDescription', 'status']
                }
            ],
            order: [['lastMessageAt', 'DESC']],
            limit: 20
        });
        // Transformer les données pour identifier l'autre utilisateur
        const conversationsWithOtherUser = conversations.map(conv => {
            const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
            const unreadCount = 0; // TODO: Calculer les messages non lus
            return {
                id: conv.id,
                transactionId: conv.transactionId,
                otherUser: {
                    id: otherUser?.id,
                    firstName: otherUser?.firstName,
                    lastName: otherUser?.lastName,
                    avatar: otherUser?.avatar
                },
                transaction: conv.transaction,
                lastMessageAt: conv.lastMessageAt,
                unreadCount,
                createdAt: conv.createdAt
            };
        });
        res.json({
            success: true,
            conversations: conversationsWithOtherUser
        });
    }
    catch (error) {
        console.error('Erreur récupération conversations:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Envoyer un message dans une conversation
router.post('/conversations/:conversationId/messages', async (req, res) => {
    try {
        const userId = req.user.id;
        const conversationId = parseInt(req.params.conversationId);
        const { content, messageType = 'text', attachmentUrl } = req.body;
        console.log('DEBUG - userId:', userId, typeof userId);
        console.log('DEBUG - conversationId:', conversationId, typeof conversationId);
        console.log('DEBUG - conversationId isNaN:', isNaN(conversationId));
        if (!content?.trim() && !attachmentUrl) {
            return res.status(400).json({ error: 'Message vide' });
        }
        const conversation = await models_1.ChatConversation.findOne({
            where: {
                id: conversationId,
                [sequelize_1.Op.or]: [
                    { user1Id: userId },
                    { user2Id: userId }
                ]
            }
        });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation non trouvée' });
        }
        const message = await models_1.ChatMessage.create({
            conversationId,
            senderId: userId,
            content: content?.trim() || '',
            messageType,
            attachmentUrl
        });
        await conversation.update({
            lastMessageAt: new Date()
        });
        // === NOUVEAU CODE POUR LES NOTIFICATIONS ===
        try {
            // Déterminer qui est le destinataire
            const receiverId = conversation.user1Id === userId
                ? conversation.user2Id
                : conversation.user1Id;
            // Récupérer le nom de l'expéditeur
            const senderUser = await models_1.User.findByPk(userId);
            if (senderUser) {
                const senderName = `${senderUser.firstName} ${senderUser.lastName}`;
                console.log('🔍 Avant appel notifyNewMessage');
                console.log('🔍 receiverId:', receiverId);
                console.log('🔍 senderUser:', senderUser);
                console.log('🔍 senderName:', senderName);
                // Créer la notification de nouveau message
                await NotificationService_1.NotificationService.notifyNewMessage(userId, receiverId, conversationId, content?.trim() || 'Pièce jointe', senderName);
            }
        }
        catch (notificationError) {
            // Ne pas faire échouer l'envoi du message si la notification échoue
            console.error('Erreur notification message:', notificationError);
        }
        // === FIN DU NOUVEAU CODE ===
        res.json({
            success: true,
            message: {
                id: message.id,
                conversationId: message.conversationId,
                senderId: message.senderId,
                content: message.content,
                messageType: message.messageType,
                attachmentUrl: message.attachmentUrl,
                isRead: message.isRead,
                createdAt: message.createdAt
            }
        });
    }
    catch (error) {
        console.error('Erreur envoi message:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Récupérer les messages d'une conversation
router.get('/conversations/:conversationId/messages', async (req, res) => {
    try {
        const userId = req.user.id;
        const conversationId = parseInt(req.params.conversationId);
        const conversation = await models_1.ChatConversation.findOne({
            where: {
                id: conversationId,
                [sequelize_1.Op.or]: [
                    { user1Id: userId },
                    { user2Id: userId }
                ]
            }
        });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation non trouvée' });
        }
        const messages = await models_1.ChatMessage.findAll({
            where: { conversationId },
            order: [['createdAt', 'ASC']],
        });
        res.json({
            success: true,
            messages
        });
    }
    catch (error) {
        console.error('Erreur récupération messages:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Marquer les messages comme lus
// Ajoutez cet endpoint à votre fichier de routes existant
router.post('/conversations/:conversationId/read', async (req, res) => {
    try {
        const userId = req.user.id;
        const conversationId = parseInt(req.params.conversationId);
        console.log('DEBUG - userId:', userId, typeof userId);
        console.log('DEBUG - conversationId:', conversationId, typeof conversationId);
        if (isNaN(conversationId)) {
            return res.status(400).json({ error: 'ID de conversation invalide' });
        }
        // Vérifier que l'utilisateur fait partie de la conversation
        const conversation = await models_1.ChatConversation.findOne({
            where: {
                id: conversationId,
                [sequelize_1.Op.or]: [
                    { user1Id: userId },
                    { user2Id: userId }
                ]
            }
        });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation non trouvée' });
        }
        const allMessages = await models_1.ChatMessage.findAll({
            where: { conversationId: conversationId },
            order: [['createdAt', 'DESC']],
            limit: 5
        });
        console.log('DEBUG - Derniers messages de la conversation:', allMessages.map(m => ({
            id: m.id,
            senderId: m.senderId,
            isRead: m.isRead,
            content: m.content.substring(0, 20)
        })));
        const messagesToMark = await models_1.ChatMessage.findAll({
            where: {
                conversationId: conversationId,
                senderId: { [sequelize_1.Op.ne]: userId },
                isRead: false
            }
        });
        console.log('DEBUG - Messages trouvés à marquer:', messagesToMark.length);
        console.log('DEBUG - Détail messages:', messagesToMark.map(m => ({ id: m.id, senderId: m.senderId, isRead: m.isRead })));
        // Marquer tous les messages de cette conversation comme lus 
        // (sauf ceux envoyés par l'utilisateur actuel)
        const [updatedCount] = await models_1.ChatMessage.update({
            isRead: true,
            readAt: new Date()
        }, {
            where: {
                conversationId: conversationId,
                senderId: { [sequelize_1.Op.ne]: userId }, // Pas les messages de l'utilisateur actuel
                isRead: false // Seulement ceux non lus
            }
        });
        console.log('DEBUG - Messages marqués comme lus:', updatedCount);
        await Notification_1.Notification.update({ isRead: true }, {
            where: {
                userId: userId,
                type: 'new_message',
                isRead: false,
                // Ajoutez une condition pour filtrer par conversation si vous avez cette info dans les notifications
            }
        });
        console.log('DEBUG - Notifications de chat marquées comme lues');
        res.json({
            success: true,
            messagesMarkedAsRead: updatedCount
        });
    }
    catch (error) {
        console.error('Erreur mark as read:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        });
    }
});
// Compter les messages non lus de l'utilisateur
router.get('/unread-count', async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('DEBUG unread-count - userId:', userId);
        const unreadMessages = await models_1.ChatMessage.findAll({
            where: {
                senderId: { [sequelize_1.Op.ne]: userId },
                isRead: false
            },
            include: [{
                    model: models_1.ChatConversation,
                    as: 'conversation',
                    where: {
                        [sequelize_1.Op.or]: [
                            { user1Id: userId },
                            { user2Id: userId }
                        ]
                    }
                }]
        });
        console.log('DEBUG unread-count - Messages non lus trouvés:', unreadMessages.map(m => ({
            id: m.id,
            conversationId: m.conversationId,
            senderId: m.senderId,
            content: m.content.substring(0, 20),
            isRead: m.isRead
        })));
        const unreadCount = await models_1.ChatMessage.count({
            where: {
                senderId: { [sequelize_1.Op.ne]: userId },
                isRead: false
            },
            include: [{
                    model: models_1.ChatConversation,
                    as: 'conversation',
                    where: {
                        [sequelize_1.Op.or]: [
                            { user1Id: userId },
                            { user2Id: userId }
                        ]
                    }
                }]
        });
        console.log('DEBUG unread-count - Compteur trouvé:', unreadCount);
        res.json({
            success: true,
            unreadCount
        });
    }
    catch (error) {
        console.error('Erreur comptage messages non lus:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
exports.default = router;
