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
//src/socket/chatSoket.ts
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const User_1 = require("../models/User");
class ChatSocketServer {
    constructor(httpServer) {
        this.connectedUsers = new Map();
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3001",
                methods: ["GET", "POST"]
            }
        });
        this.setupMiddleware();
        this.setupEventHandlers();
    }
    setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    throw new Error('Token manquant');
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.userId || decoded.id;
                next();
            }
            catch (error) {
                next(new Error('Authentification échouée'));
            }
        });
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`Utilisateur ${socket.userId} connecté`);
            // Ajouter à la liste des utilisateurs connectés
            if (!this.connectedUsers.has(socket.userId)) {
                this.connectedUsers.set(socket.userId, new Set());
            }
            this.connectedUsers.get(socket.userId).add(socket.id);
            // Rejoindre les conversations de l'utilisateur
            this.joinUserConversations(socket);
            // Gestionnaire d'envoi de message
            socket.on('send_message', async (data) => {
                await this.handleSendMessage(socket, data);
            });
            // Déconnexion
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
        });
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
        }
        catch (error) {
            console.error('Erreur rejoindre conversations:', error);
        }
    }
    // Dans la méthode handleSendMessage, modifiez :
    async handleSendMessage(socket, data) {
        console.log('📨 Message reçu sur le serveur:', {
            userId: socket.userId,
            conversationId: data.conversationId,
            content: data.content?.substring(0, 50)
        });
        try {
            const { conversationId, content, messageType = 'text', attachmentUrl } = data;
            // Vérifier l'accès à la conversation
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
                socket.emit('error', { message: 'Conversation non trouvée' });
                return;
            }
            // Créer le message avec support des images
            const message = await models_1.ChatMessage.create({
                conversationId,
                senderId: socket.userId,
                content: content || '',
                messageType,
                attachmentUrl
            });
            try {
                // Déterminer le destinataire
                const receiverId = conversation.user1Id === socket.userId
                    ? conversation.user2Id
                    : conversation.user1Id;
                // Récupérer le nom de l'expéditeur  
                const senderUser = await User_1.User.findByPk(socket.userId);
                if (senderUser) {
                    const senderName = `${senderUser.firstName} ${senderUser.lastName}`;
                    // Import et appel de notification
                    const { NotificationService } = await Promise.resolve().then(() => __importStar(require('../services/NotificationService')));
                    await NotificationService.notifyNewMessage(socket.userId, receiverId, conversationId, content?.trim() || 'Pièce jointe', senderName);
                }
            }
            catch (notificationError) {
                console.error('Erreur notification message:', notificationError);
            }
            console.log('💾 Message sauvegardé en base:', message.id);
            // Mettre à jour la conversation
            await conversation.update({ lastMessageAt: new Date() });
            console.log('📤 Envoi du message à la room:', `conversation_${conversationId}`);
            console.log('👥 Clients dans la room:', this.io.sockets.adapter.rooms.get(`conversation_${conversationId}`)?.size || 0);
            // Envoyer à tous les participants AVEC les métadonnées complètes
            this.io.to(`conversation_${conversationId}`).emit('new_message', {
                id: message.id,
                conversationId: message.conversationId,
                senderId: message.senderId,
                content: message.content,
                messageType: message.messageType,
                attachmentUrl: message.attachmentUrl,
                isRead: message.isRead,
                createdAt: message.createdAt
            });
        }
        catch (error) {
            console.error('Erreur envoi message:', error);
            socket.emit('error', { message: 'Erreur envoi message' });
        }
    }
    handleDisconnect(socket) {
        const userSockets = this.connectedUsers.get(socket.userId);
        if (userSockets) {
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
                this.connectedUsers.delete(socket.userId);
            }
        }
        console.log(`Utilisateur ${socket.userId} déconnecté`);
    }
    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }
}
exports.ChatSocketServer = ChatSocketServer;
