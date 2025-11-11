"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatSocketServer = void 0;
//src/socket/chatSocketServer.ts
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const User_1 = require("../models/User");
const chat_1 = require("../types/chat");
class ChatSocketServer {
    constructor(httpServer) {
        this.connectedUsers = new Map();
        this.typingUsers = new Map();
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3001",
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });
        this.setupMiddleware();
        this.setupEventHandlers();
    }
    setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
                if (!token) {
                    throw new Error('Token d\'authentification manquant');
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const userId = decoded.userId || decoded.id;
                // Vérifier que l'utilisateur existe et peut chatter
                const user = await User_1.User.findByPk(userId);
                if (!user || !user.canChat()) {
                    throw new Error('Utilisateur non autorisé à utiliser le chat');
                }
                socket.userId = userId;
                socket.userInfo = {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName
                };
                next();
            }
            catch (error) {
                console.error('❌ Erreur authentification socket:', error);
                next(new Error('Authentification échouée'));
            }
        });
    }
    setupEventHandlers() {
        this.io.on('connection', async (socket) => {
            console.log(`✅ Utilisateur ${socket.userInfo.firstName} (${socket.userId}) connecté avec socket ${socket.id}`);
            try {
                await this.handleUserConnection(socket);
                await this.joinUserConversations(socket);
                // Gestionnaires d'événements
                socket.on('join_conversation', (data) => this.handleJoinConversation(socket, data));
                socket.on('send_message', (data) => this.handleSendMessage(socket, data));
                socket.on('mark_messages_read', (data) => this.handleMarkMessagesRead(socket, data));
                socket.on('typing_start', (data) => this.handleTypingStart(socket, data));
                socket.on('typing_stop', (data) => this.handleTypingStop(socket, data));
                socket.on('disconnect', () => this.handleUserDisconnection(socket));
            }
            catch (error) {
                console.error('❌ Erreur lors de la connexion socket:', error);
                socket.emit('error', { message: 'Erreur de connexion' });
            }
        });
    }
    async handleUserConnection(socket) {
        try {
            const userId = socket.userId;
            // Ajouter à la carte des utilisateurs connectés
            if (!this.connectedUsers.has(userId)) {
                this.connectedUsers.set(userId, new Set());
            }
            this.connectedUsers.get(userId).add(socket.id);
            // Notifier les autres utilisateurs
            socket.broadcast.emit('user_online', { userId });
        }
        catch (error) {
            console.error('❌ Erreur connection utilisateur:', error);
        }
    }
    async handleUserDisconnection(socket) {
        try {
            const userId = socket.userId;
            // Retirer de la carte
            const userSockets = this.connectedUsers.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    this.connectedUsers.delete(userId);
                    // Utilisateur complètement déconnecté
                    const lastSeen = new Date();
                    socket.broadcast.emit('user_offline', { userId, lastSeen });
                }
            }
            // Arrêter le typing s'il était en train d'écrire
            this.typingUsers.forEach((users, conversationId) => {
                if (users.has(userId)) {
                    users.delete(userId);
                    socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
                        userId,
                        conversationId
                    });
                }
            });
            console.log(`❌ Utilisateur ${socket.userInfo?.firstName} (${userId}) déconnecté (socket ${socket.id})`);
        }
        catch (error) {
            console.error('❌ Erreur déconnexion:', error);
        }
    }
    async joinUserConversations(socket) {
        try {
            const conversations = await models_1.ChatConversation.findAll({
                where: {
                    [sequelize_1.Op.or]: [
                        { user1Id: socket.userId },
                        { user2Id: socket.userId }
                    ]
                }
            });
            conversations.forEach(conv => {
                socket.join(`conversation_${conv.id}`);
            });
            console.log(`📱 Utilisateur ${socket.userId} rejoint ${conversations.length} conversations`);
        }
        catch (error) {
            console.error('❌ Erreur rejoindre conversations:', error);
        }
    }
    async handleJoinConversation(socket, data) {
        try {
            const { conversationId } = data;
            // Vérifier que l'utilisateur fait partie de cette conversation
            const conversation = await models_1.ChatConversation.findOne({
                where: {
                    id: conversationId,
                    [sequelize_1.Op.or]: [
                        { user1Id: socket.userId },
                        { user2Id: socket.userId }
                    ]
                }
            });
            if (!conversation) {
                socket.emit('error', { message: 'Conversation non trouvée', code: 'CONVERSATION_NOT_FOUND' });
                return;
            }
            socket.join(`conversation_${conversationId}`);
        }
        catch (error) {
            console.error('❌ Erreur rejoindre conversation:', error);
            socket.emit('error', { message: 'Erreur lors de l\'accès à la conversation' });
        }
    }
    async handleSendMessage(socket, data) {
        try {
            const { conversationId, content, messageType = chat_1.ChatMessageType.TEXT, attachmentUrl, attachmentType, replyToId } = data;
            // Validation basique
            if (!content?.trim() && !attachmentUrl) {
                socket.emit('error', { message: 'Message vide', code: 'EMPTY_MESSAGE' });
                return;
            }
            // Vérifier la conversation
            const conversation = await models_1.ChatConversation.findOne({
                where: {
                    id: conversationId,
                    [sequelize_1.Op.or]: [
                        { user1Id: socket.userId },
                        { user2Id: socket.userId }
                    ]
                }
            });
            try {
                const receiverId = conversation.user1Id === socket.userId
                    ? conversation.user2Id
                    : conversation.user1Id;
                const senderName = `${socket.userInfo.firstName} ${socket.userInfo.lastName}`;
                // Import nécessaire en haut du fichier
                const { NotificationService } = await Promise.resolve().then(() => __importStar(require('../services/NotificationService')));
                await NotificationService.notifyNewMessage(socket.userId, receiverId, conversationId, content?.trim() || 'Pièce jointe', senderName);
            }
            catch (notificationError) {
                console.error('Erreur notification message:', notificationError);
            }
            if (!conversation) {
                socket.emit('error', { message: 'Conversation non trouvée', code: 'CONVERSATION_NOT_FOUND' });
                return;
            }
            // Créer le message
            const message = await models_1.ChatMessage.create({
                conversationId,
                senderId: socket.userId,
                content: content?.trim() || '',
                messageType,
                attachmentUrl
            });
            // Charger le message complet avec les relations
            const fullMessage = await models_1.ChatMessage.findByPk(message.id, {
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
                ]
            });
            // Mettre à jour la conversation
            await conversation.update({
                lastMessageAt: new Date()
            });
            // Envoyer à tous les participants
            this.io.to(`conversation_${conversationId}`).emit('new_message', fullMessage);
            // Envoyer notification de mise à jour de conversation
            this.io.to(`conversation_${conversationId}`).emit('conversation_updated', {
                conversationId,
                lastMessage: fullMessage
            });
            // Marquer comme livré
            setTimeout(async () => {
                //await message.update({ status: ChatMessageStatus.DELIVERED });
                this.io.to(`conversation_${conversationId}`).emit('message_delivered', {
                    messageId: message.id,
                    conversationId
                });
            }, 100);
        }
        catch (error) {
            console.error('❌ Erreur envoi message:', error);
            socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
        }
    }
    async handleMarkMessagesRead(socket, data) {
        try {
            const { conversationId, messageIds } = data;
            await models_1.ChatMessage.update({ isRead: true, readAt: new Date() }, {
                where: {
                    id: { [sequelize_1.Op.in]: messageIds },
                    conversationId,
                    senderId: { [sequelize_1.Op.ne]: socket.userId }
                }
            });
            // Notifier les autres utilisateurs de la conversation
            socket.to(`conversation_${conversationId}`).emit('messages_read', {
                messageIds,
                conversationId,
                readBy: socket.userId
            });
        }
        catch (error) {
            console.error('❌ Erreur marquer messages comme lus:', error);
        }
    }
    handleTypingStart(socket, data) {
        const { conversationId } = data;
        const userId = socket.userId;
        if (!this.typingUsers.has(conversationId)) {
            this.typingUsers.set(conversationId, new Set());
        }
        this.typingUsers.get(conversationId).add(userId);
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
            userId,
            conversationId,
            userName: socket.userInfo.firstName
        });
    }
    handleTypingStop(socket, data) {
        const { conversationId } = data;
        const userId = socket.userId;
        const typingInConv = this.typingUsers.get(conversationId);
        if (typingInConv) {
            typingInConv.delete(userId);
            if (typingInConv.size === 0) {
                this.typingUsers.delete(conversationId);
            }
        }
        socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
            userId,
            conversationId
        });
    }
    // Méthodes utilitaires
    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }
    getOnlineUsersCount() {
        return this.connectedUsers.size;
    }
    getUserSocketCount(userId) {
        return this.connectedUsers.get(userId)?.size || 0;
    }
}
exports.ChatSocketServer = ChatSocketServer;
