"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const User_1 = require("../models/User");
const Transaction_1 = require("../models/Transaction");
class ChatController {
    // GET /api/chat/conversations
    async getConversations(req, res) {
        try {
            const authReq = req; // Cast temporaire
            const userId = authReq.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const conversations = await models_1.ChatConversation.findAll({
                where: {
                    [sequelize_1.Op.or]: [
                        { user1Id: userId },
                        { user2Id: userId }
                    ],
                    isArchived: false
                },
                include: [
                    {
                        model: User_1.User,
                        as: 'user1',
                        attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationStatus']
                    },
                    {
                        model: User_1.User,
                        as: 'user2',
                        attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationStatus']
                    },
                    {
                        model: models_1.ChatMessage,
                        as: 'lastMessage',
                        required: false,
                        include: [{
                                model: User_1.User,
                                as: 'sender',
                                attributes: ['id', 'firstName', 'lastName']
                            }]
                    },
                    {
                        model: Transaction_1.Transaction,
                        as: 'transaction',
                        attributes: ['id', 'packageDescription', 'status', 'amount'],
                        required: false
                    }
                ],
                order: [['lastMessageAt', 'DESC']],
                limit,
                offset
            });
            const conversationsWithDetails = await Promise.all(conversations.map(async (conv) => {
                const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
                const unreadCount = await models_1.ChatMessage.count({
                    where: {
                        conversationId: conv.id,
                        senderId: { [sequelize_1.Op.ne]: userId },
                        isRead: false
                    }
                });
                return {
                    id: conv.id,
                    transactionId: conv.transactionId,
                    otherUser: {
                        id: otherUser.id,
                        firstName: otherUser.firstName,
                        lastName: otherUser.lastName,
                        avatar: otherUser.avatar,
                        verificationStatus: otherUser.verificationStatus,
                        isOnline: false,
                        lastSeen: null,
                    },
                    lastMessage: conv.lastMessage ? {
                        id: conv.lastMessage.id,
                        conversationId: conv.lastMessage.conversationId,
                        senderId: conv.lastMessage.senderId,
                        content: conv.lastMessage.content,
                        messageType: conv.lastMessage.messageType,
                        attachmentUrl: conv.lastMessage.attachmentUrl,
                        attachmentType: conv.lastMessage.attachmentType,
                        attachmentSize: conv.lastMessage.attachmentSize,
                        status: conv.lastMessage.status,
                        isRead: conv.lastMessage.isRead,
                        readAt: conv.lastMessage.readAt,
                        editedAt: conv.lastMessage.editedAt,
                        replyToId: conv.lastMessage.replyToId,
                        createdAt: conv.lastMessage.createdAt,
                        updatedAt: conv.lastMessage.updatedAt,
                        sender: {
                            id: conv.lastMessage.sender.id,
                            firstName: conv.lastMessage.sender.firstName,
                            lastName: conv.lastMessage.sender.lastName,
                            avatar: conv.lastMessage.sender.avatar,
                            verificationStatus: conv.lastMessage.sender.verificationStatus
                        }
                    } : undefined,
                    unreadCount,
                    status: conv.status,
                    isArchived: conv.isArchived,
                    transaction: conv.transaction ? {
                        id: conv.transaction.id,
                        packageDescription: conv.transaction.packageDescription,
                        status: conv.transaction.status,
                        amount: conv.transaction.amount
                    } : undefined,
                    lastMessageAt: conv.lastMessageAt,
                    createdAt: conv.createdAt
                };
            }));
            res.json({
                conversations: conversationsWithDetails,
                hasMore: conversations.length === limit
            });
        }
        catch (error) {
            console.error('❌ Erreur récupération conversations:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
    // GET /api/chat/conversations/:id/messages
    async getMessages(req, res) {
        try {
            const authReq = req;
            const userId = authReq.user.id;
            const conversationId = parseInt(req.params.id);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;
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
                include: [
                    {
                        model: User_1.User,
                        as: 'sender',
                        attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationStatus']
                    },
                    {
                        model: models_1.ChatMessage,
                        as: 'replyTo',
                        required: false,
                        include: [{
                                model: User_1.User,
                                as: 'sender',
                                attributes: ['id', 'firstName', 'lastName']
                            }]
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit,
                offset
            });
            const unreadMessageIds = messages
                .filter(msg => msg.senderId !== userId && !msg.isRead)
                .map(msg => msg.id);
            if (unreadMessageIds.length > 0) {
                await models_1.ChatMessage.update({ isRead: true, readAt: new Date() }, { where: { id: { [sequelize_1.Op.in]: unreadMessageIds } } });
            }
            res.json({
                messages: messages.reverse(),
                hasMore: messages.length === limit,
                markedAsRead: unreadMessageIds.length
            });
        }
        catch (error) {
            console.error('❌ Erreur récupération messages:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
    // POST /api/chat/conversations
    async createOrGetConversation(req, res) {
        try {
            const authReq = req;
            const userId = authReq.user.id;
            const { otherUserId, transactionId, initialMessage } = req.body;
            if (!otherUserId) {
                return res.status(400).json({ error: 'otherUserId requis' });
            }
            if (otherUserId === userId) {
                return res.status(400).json({ error: 'Impossible de créer une conversation avec soi-même' });
            }
            const otherUser = await User_1.User.findByPk(otherUserId);
            if (!otherUser || !otherUser.canChat()) {
                return res.status(400).json({ error: 'Utilisateur non autorisé ou introuvable' });
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
                    transactionId,
                    status: 'active'
                });
                if (initialMessage) {
                    await models_1.ChatMessage.create({
                        conversationId: conversation.id,
                        senderId: userId,
                        content: initialMessage,
                        messageType: 'text'
                    });
                }
            }
            const fullConversation = await models_1.ChatConversation.findByPk(conversation.id, {
                include: [
                    {
                        model: User_1.User,
                        as: 'user1',
                        attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationStatus']
                    },
                    {
                        model: User_1.User,
                        as: 'user2',
                        attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationStatus']
                    },
                    {
                        model: Transaction_1.Transaction,
                        as: 'transaction',
                        attributes: ['id', 'packageDescription', 'status', 'amount'],
                        required: false
                    }
                ]
            });
            // CORRECTION: Utiliser les IDs au lieu des objets user
            const otherUserInfo = fullConversation.user1Id === userId ? fullConversation.user2 : fullConversation.user1;
            res.json({
                conversation: {
                    id: fullConversation.id,
                    transactionId: fullConversation.transactionId,
                    otherUser: {
                        id: otherUserInfo.id,
                        firstName: otherUserInfo.firstName,
                        lastName: otherUserInfo.lastName,
                        avatar: otherUserInfo.avatar,
                        verificationStatus: otherUserInfo.verificationStatus
                    },
                    // CORRECTION: Utiliser transactionId au lieu de transaction
                    transaction: fullConversation.transactionId,
                    createdAt: fullConversation.createdAt
                }
            });
        }
        catch (error) {
            console.error('❌ Erreur création conversation:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
    // GET /api/chat/online-users
    // PATCH /api/chat/conversations/:id/archive
    async archiveConversation(req, res) {
        try {
            const authReq = req;
            const userId = authReq.user.id;
            const conversationId = parseInt(req.params.id);
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
            await conversation.update({ isArchived: true });
            res.json({ message: 'Conversation archivée' });
        }
        catch (error) {
            console.error('❌ Erreur archivage conversation:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
}
exports.ChatController = ChatController;
